/**
 * LA PUERTA MANUAL v2 (diseño 23/09, §4.1): la entrevista entera con el cerebro nuevo —perfil,
 * plan, secuencia viva, encargo, controles, evaluación—, para que Naza se entreviste a sí mismo
 * copiando cada mensaje a WhatsApp a mano. No toca el flujo automático ni la puerta manual vieja
 * (`scripts/manual.ts`, que no se importa). Todo el estado vive en `narradores.contexto.v2`; lo
 * que se puede decidir sin base ni modelo está en `src/manual/estado-v2.ts`, con tests.
 *
 * NO manda nada: todo texto para la persona se IMPRIME ENTERO al final, listo para pegar.
 *
 * Uso (desde entrevistador/):
 *   npm run manual-v2 -- empezar naza [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires] [--familia email]
 *   npm run manual-v2 -- cargar naza <audio.ogg> [--repregunta] [--orden N] [--es-suyo]
 *   npm run manual-v2 -- cargar naza --texto "lo que escribió" [--repregunta] [--orden N]
 *   npm run manual-v2 -- cargar naza --reprocesar [--repregunta] [--orden N]   (si una carga se cortó a mitad)
 *   npm run manual-v2 -- siguiente naza [--saltar] [--reanudar]
 *   npm run manual-v2 -- estado naza
 *
 * Ojo con el orden: el archivo va ANTES de los --flags (`--repregunta audio.ogg` se leería como
 * "--repregunta = audio.ogg").
 */
import { readFileSync, existsSync, statSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { parsearArgs, slug, archivoCanonico, promptDeTranscripcion, motivoParaRechazarAudio, type Args } from '../src/manual/puro.js';
import {
  estadoNuevo, leerEstado, contextoConEstado, planSiHaceFalta, pendientesParaPerfil, preguntaParaCargar,
  queHaceSiguiente, conversacionDe, yaHechasDe, evitarDe, hoyEn, repreguntasParaCansancio, decidirTrasEvaluar,
  sumarGasto, mensajeHoyNo, cierreQuiereParar, mailQuiereParar, despedidaV2, type EstadoV2,
} from '../src/manual/estado-v2.js';
import { actualizarPerfil } from '../src/ia/perfil.js';
import { proxima, avanzar, aplicarPerfil, tocaObjeto, registrarObjeto } from '../src/ia/secuencia.js';
import { escribirPregunta, perfilEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { evaluarV2, hayCansancio } from '../src/ia/evaluar-v2.js';
import type { Marca } from '../src/ia/control-pregunta.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, '..', '..');
const CRUDOS = resolve(REPO, 'audios-crudos');

// ── 1. Entorno ─────────────────────────────────────────────────────────────
// config.ts lee process.env al importarse: esto tiene que pasar antes del primer import de la
// base (por eso esos imports son dinámicos, más abajo). Igual que manual.ts.
try {
  for (const linea of readFileSync(resolve(AQUI, '..', '.env'), 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  // Sin .env propio se usan las variables que ya estén en el entorno.
}
// El CLI no habla con WhatsApp, pero config.ts exige las WA_* al importarse.
for (const v of ['WA_TOKEN', 'WA_PHONE_NUMBER_ID', 'WA_VERIFY_TOKEN']) {
  if (!process.env[v]) process.env[v] = 'manual';
}

// ── 2. Los módulos con base (importados tarde, después del .env) ─────────────
type Modulos = {
  db: (typeof import('../src/db/cliente.js'))['db'];
  guardarRespuestaAudio: (typeof import('../src/db/respuestas.js'))['guardarRespuestaAudio'];
  guardarReserva: (typeof import('../src/db/respuestas.js'))['guardarReserva'];
  transcribirYActualizar: (typeof import('../src/ia/transcribir.js'))['transcribirYActualizar'];
  reservaDe: (typeof import('../src/ia/cerebro.js'))['reservaDe'];
  sumarTemaEvitado: (typeof import('../src/ia/evitar.js'))['sumarTemaEvitado'];
  buscarCruce: (typeof import('../src/db/duplicados.js'))['buscarCruce'];
  registrarUso: (typeof import('../src/costos.js'))['registrarUso'];
  cuentaDeEsteServicio: (typeof import('../src/costos.js'))['cuentaDeEsteServicio'];
};

let _mods: Promise<Modulos> | null = null;
function modulos(): Promise<Modulos> {
  _mods ??= (async () => {
    const { db } = await import('../src/db/cliente.js');
    const { guardarRespuestaAudio, guardarReserva } = await import('../src/db/respuestas.js');
    const { transcribirYActualizar } = await import('../src/ia/transcribir.js');
    const { reservaDe } = await import('../src/ia/cerebro.js');
    const { sumarTemaEvitado } = await import('../src/ia/evitar.js');
    const { buscarCruce } = await import('../src/db/duplicados.js');
    const { registrarUso, cuentaDeEsteServicio } = await import('../src/costos.js');
    return { db, guardarRespuestaAudio, guardarReserva, transcribirYActualizar, reservaDe, sumarTemaEvitado, buscarCruce, registrarUso, cuentaDeEsteServicio };
  })();
  return _mods;
}

let _cliente: Anthropic | null = null;
/** El cliente del modelo, creado recién cuando hace falta (`estado` no llama al modelo). */
function cliente(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY en entrevistador/.env.');
  _cliente ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _cliente;
}

// ── 3. Tipos y consultas cortas ────────────────────────────────────────────
type NarradorFila = {
  id: string; familia_id: string; nombre: string; como_le_dicen: string; zona_horaria: string;
  contexto: Record<string, any> | null; estado: string; dia_actual: number;
};
type RespuestaFila = {
  id: string; pregunta_orden: number; es_repregunta: boolean; transcripcion: string | null;
  texto_directo: string | null; duracion_segundos: number | null; audio_path: string | null; recibido_at: string;
};

const linea = (t = '') => console.log(t);
const titulo = (t: string) => { linea(); linea(`── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}`); };
const flag = (flags: Args['flags'], k: string) => (typeof flags[k] === 'string' ? (flags[k] as string) : undefined);

async function buscarNarrador(ref: string): Promise<NarradorFila | null> {
  const { db } = await modulos();
  const { data, error } = await db.from('narradores').select('*').order('created_at');
  if (error) throw new Error(`No pude leer los narradores: ${error.message}`);
  const todos = (data as NarradorFila[] | null) ?? [];
  const s = slug(ref);
  return todos.find((n) => n.id === ref) ?? todos.find((n) => slug(n.como_le_dicen) === s) ?? todos.find((n) => slug(n.nombre) === s) ?? null;
}

async function exigirNarrador(ref: string | undefined): Promise<{ n: NarradorFila; estado: EstadoV2 }> {
  if (!ref) throw new Error('Falta el narrador (por ejemplo: naza).');
  const n = await buscarNarrador(ref);
  if (!n) throw new Error(`No encontré a «${ref}». Empezá con: npm run manual-v2 -- empezar ${slug(ref)}`);
  const estado = leerEstado(n.contexto ?? {}, n.zona_horaria);
  if (!estado) throw new Error(`${n.como_le_dicen} no tiene entrevista v2 empezada. Empezá con: npm run manual-v2 -- empezar ${slug(n.como_le_dicen)}`);
  return { n, estado };
}

/** Las respuestas vivas del narrador (las descartadas ya no están en esta tabla), en el orden en que llegaron. */
async function respuestasDe(narradorId: string): Promise<RespuestaFila[]> {
  const { db } = await modulos();
  const { data, error } = await db.from('respuestas').select('*')
    .eq('narrador_id', narradorId).order('pregunta_orden').order('recibido_at');
  if (error) throw new Error(`No pude leer las respuestas: ${error.message}`);
  return (data as RespuestaFila[] | null) ?? [];
}

/**
 * Guarda el estado (y lo que haga falta de la fila) de una sola vez. Se vuelve a leer el contexto
 * justo antes, para no pisar lo que el panel haya cambiado mientras el modelo pensaba (`evitar`).
 */
async function guardar(n: NarradorFila, estado: EstadoV2, extra: Record<string, unknown> = {}, evitarNuevo?: string): Promise<void> {
  const { db } = await modulos();
  const { data } = await db.from('narradores').select('contexto').eq('id', n.id).maybeSingle();
  const actual = ((data as { contexto?: Record<string, any> } | null)?.contexto) ?? n.contexto ?? {};
  const base = evitarNuevo !== undefined ? { ...actual, evitar: evitarNuevo } : actual;
  const contexto = contextoConEstado(base, estado);
  const { error } = await db.from('narradores').update({ contexto, ...extra }).eq('id', n.id);
  if (error) throw new Error(`No pude guardar el estado v2 de ${n.como_le_dicen}: ${error.message}`);
  n.contexto = contexto;
}

/** Cada llamada al modelo queda en `consumo_ia` como el resto del entrevistador (el panel suma el día). */
async function anotarUsos(paso: string, narradorId: string, usos: Anthropic.Usage[]): Promise<void> {
  const { db, registrarUso, cuentaDeEsteServicio } = await modulos();
  for (const uso of usos) {
    await registrarUso(db, { servicio: 'entrevistador', paso, modelo: 'claude-opus-5', proveedor: 'anthropic', cuenta: cuentaDeEsteServicio(), narradorId, uso });
  }
}

const nombreDe = (n: NarradorFila, e: EstadoV2) => e.perfil.persona.comoLeDicen?.valor ?? n.como_le_dicen;
const marcaEnTexto = (m?: Marca) => (m ? `⚠ MARCADA (${m.control}): ${m.motivo} — salió igual tras ${m.intentos} intentos` : 'pasó los controles');

/** El cierre de cada comando: los textos para la persona, enteros, uno debajo del otro. */
function imprimirParaPegar(mensajes: { titulo: string; texto: string }[]): void {
  for (const m of mensajes) {
    titulo(`${m.titulo} — copiá y pegá esto en WhatsApp`);
    linea(m.texto);
  }
  linea();
}

// ── 4. Comandos ────────────────────────────────────────────────────────────

/**
 * Crea al narrador si no existe (como `crear` de manual.ts: primera familia de Naza, activo, modo
 * rápido, teléfono `+manual-<slug>` para que nada salga por WhatsApp), arma el perfil de la ficha y
 * escribe la presentación (§2.2).
 */
async function empezar(ref: string | undefined, flags: Args['flags']): Promise<void> {
  if (!ref) throw new Error('Uso: empezar <narrador> [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires] [--familia email]');
  const { db } = await modulos();
  let n = await buscarNarrador(ref);

  if (n) {
    if (leerEstado(n.contexto ?? {}, n.zona_horaria)) {
      throw new Error(`${n.como_le_dicen} ya empezó la entrevista v2. Mirá dónde está: npm run manual-v2 -- estado ${slug(n.como_le_dicen)}`);
    }
    const previas = await respuestasDe(n.id);
    if (previas.length) {
      throw new Error(`${n.como_le_dicen} ya tiene ${previas.length} respuestas del flujo viejo: las órdenes chocarían. Usá otro nombre (--nombre).`);
    }
    linea(`${n.como_le_dicen} ya existía (sin respuestas): arranca la entrevista v2 sobre esa fila.`);
  } else {
    const email = flag(flags, 'familia') ?? 'nazamateos@gmail.com';
    const { data: familia, error: errFamilia } = await db.from('familias').select('id,email').ilike('email', email).limit(1).maybeSingle();
    if (errFamilia || !familia) throw new Error(`No encontré la familia «${email}»: ${errFamilia?.message ?? 'sin filas'}`);
    const nombre = flag(flags, 'nombre') ?? ref.charAt(0).toUpperCase() + ref.slice(1);
    const fila = {
      familia_id: (familia as { id: string }).id,
      nombre,
      como_le_dicen: flag(flags, 'le-dicen') ?? nombre,
      telefono_whatsapp: `+manual-${slug(ref)}`,
      zona_horaria: flag(flags, 'zona') ?? 'America/Argentina/Buenos_Aires',
      hora_preferida: '10:00',
      // Sin ficha a propósito (§4.1): el biógrafo tiene que darse cuenta solo de quién es.
      contexto: { modoRapido: true },
      estado: 'activo',
      dia_actual: 0,
    };
    const { data, error } = await db.from('narradores').insert(fila).select('*').single();
    if (error) throw new Error(`No pude crear al narrador: ${error.message}`);
    n = data as NarradorFila;
    titulo(`Narrador creado: ${n.como_le_dicen}`);
    linea(`  id: ${n.id}   ·   familia: ${(familia as { email: string }).email}   ·   zona: ${n.zona_horaria}   ·   teléfono: ${fila.telefono_whatsapp}`);
  }

  let estado = planSiHaceFalta(estadoNuevo(n.contexto ?? {}, n.zona_horaria));
  const presentacion = proxima(estado.secuencia)!;
  linea(`Castellano: ${estado.perfil.castellano}. Escribiendo la presentación…`);
  const r = await escribirPregunta(cliente(), estado.perfil, presentacion, [], [], evitarDe(n.contexto ?? {}));
  estado = {
    ...sumarGasto(estado, r.usos),
    preguntasEnviadas: { '0': r.texto },
    marcas: r.marca ? { '0': r.marca } : {},
    secuencia: avanzar(estado.secuencia, presentacion, 0),
  };
  await guardar(n, estado, { dia_actual: 0, estado: 'activo' });
  await anotarUsos('v2-presentacion', n.id, r.usos);

  linea(`Intentos: ${r.usos.length} · ${marcaEnTexto(r.marca)} · gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  linea(`Cuando conteste: npm run manual-v2 -- cargar ${slug(n.como_le_dicen)} <audio.ogg>   (o --texto "...")`);
  linea(`La casa de la infancia sale a los pocos minutos aunque no conteste: npm run manual-v2 -- siguiente ${slug(n.como_le_dicen)}`);
  imprimirParaPegar([{ titulo: 'Presentación (orden 0)', texto: r.texto }]);
}

function resolverRuta(archivo: string): string {
  const candidatos = [...new Set([resolve(archivo), resolve(REPO, archivo), resolve(CRUDOS, archivo), resolve(process.cwd(), archivo)])];
  for (const c of candidatos) if (existsSync(c) && statSync(c).isFile()) return c;
  throw new Error(`No encontré el archivo «${archivo}». Lo busqué en:\n  ${candidatos.join('\n  ')}`);
}

/**
 * El candado contra el audio cruzado (hallazgo 43): si la transcripción es casi igual a una ya
 * cargada en OTRO narrador, frena antes de tocar el perfil. No borra nada: dice cómo sacarla.
 */
async function esDeOtro(n: NarradorFila, orden: number, texto: string, respuestaId: string): Promise<boolean> {
  try {
    const { db, buscarCruce } = await modulos();
    const { data } = await db.from('respuestas').select('narrador_id, pregunta_orden, transcripcion').neq('narrador_id', n.id);
    const cruce = buscarCruce(texto, (data ?? []) as never);
    if (!cruce) return false;
    const { data: duenio } = await db.from('narradores').select('como_le_dicen').eq('id', cruce.narrador_id).maybeSingle();
    const quien = (duenio as { como_le_dicen?: string } | null)?.como_le_dicen ?? cruce.narrador_id.slice(0, 8);
    titulo('⚠  ESTE AUDIO YA ESTÁ CARGADO EN OTRO NARRADOR');
    linea(`Lo mismo figura en ${quien}, orden ${cruce.pregunta_orden}.`);
    linea(`Frené acá: no actualicé el perfil ni evalué la respuesta ${orden}.`);
    linea(`Si te equivocaste de archivo, sacala con (la puerta vieja descarta cualquier respuesta por id):`);
    linea(`   npm run manual -- descartar ${slug(n.como_le_dicen)} ${respuestaId} --motivo "audio de ${quien}" --si`);
    linea('y cargá el que sí es suyo. Si de verdad es suyo, descartala igual y volvé a cargar el mismo archivo con --es-suyo.');
    return true;
  } catch (err) {
    // El candado no puede frenar una carga buena: si falla, se avisa y se sigue.
    console.warn('No se pudo comprobar si el audio ya estaba cargado en otro narrador:', err);
    return false;
  }
}

/**
 * Carga una respuesta (audio, texto, o la que ya está si una carga anterior se cortó) y hace lo
 * que haría el día: perfil, plan, secuencia; evaluación (salvo la presentación); reserva, tema a
 * dejar, cansancio, "hoy no", "no quiero seguir"; la repregunta si toca.
 */
async function cargar(ref: string | undefined, archivo: string | undefined, flags: Args['flags']): Promise<void> {
  const { n, estado: leido } = await exigirNarrador(ref);
  const mods = await modulos();
  let estado = leido;
  const esRepregunta = Boolean(flags['repregunta']);
  const ordenPedida = flag(flags, 'orden') !== undefined ? Number(flag(flags, 'orden')) : undefined;
  if (ordenPedida !== undefined && !Number.isInteger(ordenPedida)) throw new Error('--orden tiene que ser un número.');
  const abierta = preguntaParaCargar(estado, ordenPedida, esRepregunta);
  if ('error' in abierta) throw new Error(abierta.error);
  const { orden, objetivo } = abierta;
  const texto = flag(flags, 'texto')?.trim();
  const reprocesar = Boolean(flags['reprocesar']);
  if ([archivo, texto, reprocesar || undefined].filter(Boolean).length !== 1) {
    throw new Error('Uso: cargar <narrador> <audio.ogg> | --texto "..." | --reprocesar   [--repregunta] [--orden N]');
  }

  const filas = await respuestasDe(n.id);
  const deEstaOrden = filas.filter((f) => f.pregunta_orden === orden && f.es_repregunta === esRepregunta);
  if (!esRepregunta && !reprocesar && deEstaOrden.length && estado.retomar !== orden) {
    throw new Error(
      `La orden ${orden} de ${n.como_le_dicen} ya tiene respuesta. Si esto contesta la repregunta: --repregunta. ` +
      'Si la carga anterior se cortó antes de terminar (perfil/evaluación): --reprocesar.',
    );
  }

  titulo(`${n.como_le_dicen}, orden ${orden}${esRepregunta ? ' (repregunta)' : ''} — ${objetivo.id}`);
  linea(`Pregunta: ${abierta.texto}`);

  let respuesta = '';
  let segundos = 0;
  let respuestaId = '';
  let segundosTranscriptos = 0;
  if (reprocesar) {
    const fila = deEstaOrden.at(-1);
    if (!fila) throw new Error(`No hay respuesta${esRepregunta ? ' a la repregunta' : ''} cargada en la orden ${orden} para reprocesar.`);
    respuesta = (fila.transcripcion ?? fila.texto_directo ?? '').trim();
    if (!respuesta) throw new Error(`La respuesta ${fila.id} no tiene transcripción.`);
    segundos = fila.duracion_segundos ?? 0;
    respuestaId = fila.id;
    linea(`Reproceso la respuesta ya cargada (${fila.id}).`);
  } else if (texto) {
    const { data, error } = await mods.db.from('respuestas')
      .insert({ narrador_id: n.id, pregunta_orden: orden, texto_directo: texto, transcripcion: texto, es_repregunta: esRepregunta })
      .select('id').single();
    if (error) throw new Error(`No pude insertar la respuesta: ${error.message}`);
    respuesta = texto;
    // Lo que duraría dicho en voz alta (~150 palabras por minuto): "duró 0 segundos" empujaba a
    // la evaluación a pedir más de una respuesta escrita que alcanzaba.
    segundos = Math.round(texto.split(/\s+/).filter(Boolean).length / 2.5);
    respuestaId = (data as { id: string }).id;
    linea(`Respuesta escrita (${segundos}s estimados si la hubiera dicho): ${texto}`);
  } else {
    const ruta = resolverRuta(archivo!);
    const motivo = motivoParaRechazarAudio(statSync(ruta).size, basename(ruta));
    if (motivo) throw new Error(motivo);
    const audio = readFileSync(ruta);
    const guardada = await mods.guardarRespuestaAudio(n.id, orden, audio, esRepregunta);
    respuestaId = guardada.id;
    linea(`Storage: audios/${guardada.audioPath}`);
    // Respaldo local con el nombre canónico, como la puerta vieja.
    const carpeta = join(CRUDOS, slug(n.como_le_dicen));
    mkdirSync(carpeta, { recursive: true });
    const destino = join(carpeta, archivoCanonico(orden, filas.filter((f) => f.pregunta_orden === orden).length + 1));
    if (resolve(destino) !== resolve(ruta)) copyFileSync(ruta, destino);
    linea(`Respaldo local: ${destino}`);
    const prompt = promptDeTranscripcion(n.contexto ?? {}, nombreDe(n, estado), n.zona_horaria);
    const t = await mods.transcribirYActualizar(respuestaId, audio, prompt, n.id);
    respuesta = t.texto;
    segundos = t.duracionSegundos;
    segundosTranscriptos = t.duracionSegundos;
    linea(`Transcripción (${segundos}s): ${respuesta}`);
    if (!flags['es-suyo'] && await esDeOtro(n, orden, respuesta, respuestaId)) {
      await guardar(n, sumarGasto(estado, [], segundosTranscriptos));
      return;
    }
  }

  // 1. El perfil aprende de la respuesta; el plan y la secuencia se acomodan.
  const usos: Anthropic.Usage[] = [];
  const antes = estado.perfil;
  const p = await actualizarPerfil(cliente(), estado.perfil, abierta.texto, respuesta, pendientesParaPerfil(estado.secuencia));
  usos.push(p.usage);
  await anotarUsos('v2-perfil', n.id, [p.usage]);
  if (!p.ok) linea('⚠ El perfil no se entendió (salida ilegible): queda como estaba.');
  const variablesAntes = estado.secuencia.pendientes.filter((o) => o.tipo === 'variable').length;
  estado = planSiHaceFalta({ ...estado, perfil: p.perfil });
  estado = { ...estado, secuencia: aplicarPerfil(estado.secuencia, estado.perfil) };
  imprimirCambiosDePerfil(antes, estado, variablesAntes);

  // 2. La presentación solo alimenta el perfil (§2.2): no se evalúa ni se repregunta.
  if (objetivo.tipo === 'nucleo' && objetivo.id === 'presentacion' && !esRepregunta) {
    estado = sumarGasto(estado, usos, segundosTranscriptos);
    await guardar(n, estado);
    linea(`Gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
    linea(`Ahora: npm run manual-v2 -- siguiente ${slug(n.como_le_dicen)}`);
    return;
  }

  // 3. La evaluación, con lo último que hablaron (sin la respuesta de hoy).
  const previas = filas.filter((f) => f.id !== respuestaId);
  const ev = await evaluarV2(
    cliente(), estado.perfil, objetivo, abierta.texto, respuesta, segundos,
    conversacionDe(estado, previas), evitarDe(n.contexto ?? {}),
  );
  usos.push(...ev.usos);
  await anotarUsos('v2-evaluar', n.id, ev.usos);
  const e = ev.evaluacion;
  linea(`Evaluación (${ev.usos.length} intento${ev.usos.length === 1 ? '' : 's'}): ${JSON.stringify(e)}`);

  // 4. Lo que se anota siempre, venga lo que venga después.
  const reserva = mods.reservaDe(e, respuesta);
  if (reserva.reservada) {
    linea(`🔒 Pidió reservar ${reserva.tramo ? `una parte: «${reserva.tramo}»` : 'la respuesta entera'}: no va al libro.`);
    await mods.guardarReserva(respuestaId, reserva);
  }
  // Solo se escribe `evitar` si hoy cambió: si no, se respeta lo que la familia haya puesto en el panel.
  let evitarNuevo: string | undefined;
  if (e.dejarTema) {
    const nuevo = mods.sumarTemaEvitado(n.contexto ?? {}, e.dejarTema);
    linea(`🚫 Pidió dejar un tema: «${e.dejarTema}»${nuevo ? ' → queda en contexto.evitar.' : ' (ya estaba anotado o no entra).'}`);
    if (nuevo) evitarNuevo = nuevo.evitar;
  }

  // 5. ¿Repregunta? Cansancio, "hoy no", "no quiero seguir".
  const contestadas = filas.filter((f) => f.es_repregunta).map((f) => f.pregunta_orden).concat(esRepregunta ? [orden] : []);
  const decision = decidirTrasEvaluar(e, {
    esRepregunta,
    yaHayRepregunta: Boolean(estado.repreguntasEnviadas[String(orden)]),
    hoy: hoyEn(n.zona_horaria),
    orden,
    cansancio: hayCansancio(repreguntasParaCansancio(estado, orden, contestadas)),
    sinRepreguntarHasta: estado.sinRepreguntarHasta,
  });
  // La respuesta que llegó después de un "hoy no" cierra la espera (salvo que hoy tampoco pueda).
  if (estado.retomar === orden && !esRepregunta && decision.accion !== 'hoyNo') estado = { ...estado, retomar: undefined };

  const nombre = nombreDe(n, estado);
  const s = slug(n.como_le_dicen);
  const mensajes: { titulo: string; texto: string }[] = [];
  const extra: Record<string, unknown> = {};

  switch (decision.accion) {
    case 'parar': {
      extra.estado = 'pausado';
      const principales = filas.filter((f) => !f.es_repregunta).length + (esRepregunta || reprocesar ? 0 : 1);
      const mail = mailQuiereParar({
        nombre, narradorId: n.id, orden, pregunta: abierta.texto, respuesta, respuestas: principales,
        comandoReanudar: `npm run manual-v2 -- siguiente ${s} --reanudar`,
      });
      titulo('NO QUIERE SEGUIR — la entrevista queda en pausa (estado «pausado»)');
      linea('Mail para los dueños (no se manda solo: copialo y mandalo vos):');
      linea();
      linea(`Asunto: ${mail.asunto}`);
      linea();
      linea(mail.cuerpo);
      mensajes.push({ titulo: 'Cierre (sin pregunta)', texto: cierreQuiereParar(nombre, estado.perfil) });
      break;
    }
    case 'hoyNo':
      estado = { ...estado, retomar: orden };
      linea(`Hoy no puede: la orden ${orden} queda abierta y mañana se retoma la MISMA (siguiente la vuelve a imprimir).`);
      mensajes.push({ titulo: 'Mañana se retoma', texto: mensajeHoyNo(nombre, estado.perfil) });
      break;
    case 'repreguntar':
      estado = {
        ...estado,
        repreguntasEnviadas: { ...estado.repreguntasEnviadas, [orden]: decision.texto },
        marcas: ev.marca ? { ...estado.marcas, [`${orden}-repregunta`]: ev.marca } : estado.marcas,
      };
      linea(`Repregunta: ${ev.usos.length} intento${ev.usos.length === 1 ? '' : 's'} · ${marcaEnTexto(ev.marca)}`);
      linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg> --repregunta`);
      mensajes.push({ titulo: `Repregunta de la orden ${orden}`, texto: decision.texto });
      break;
    case 'nada':
      if (decision.sinRepreguntarHasta) {
        estado = { ...estado, sinRepreguntarHasta: decision.sinRepreguntarHasta, cansancioDesdeOrden: decision.cansancioDesdeOrden };
      }
      linea(`Sin repregunta: ${decision.motivo}.`);
      linea(`Ahora: npm run manual-v2 -- siguiente ${s}`);
      break;
  }

  estado = sumarGasto(estado, usos, segundosTranscriptos);
  await guardar(n, estado, extra, evitarNuevo);
  linea(`Gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  imprimirParaPegar(mensajes);
}

/** Lo que el perfil aprendió hoy, en pocas líneas: para ver si se da cuenta solo de quién es. */
function imprimirCambiosDePerfil(antes: EstadoV2['perfil'], estado: EstadoV2, variablesAntes: number): void {
  const p = estado.perfil;
  const cambios: string[] = [];
  for (const [campo, dato] of Object.entries(p.persona)) {
    const previo = (antes.persona as Record<string, { valor: string } | null>)[campo];
    if (dato && dato.valor !== previo?.valor) cambios.push(`${campo}: ${dato.valor} (${dato.fuente}${dato.por ? `, ${dato.por}` : ''})`);
  }
  if (p.etapas.length !== antes.etapas.length) cambios.push(`etapas: ${antes.etapas.length} → ${p.etapas.length}`);
  if (p.personas.length !== antes.personas.length) cambios.push(`personas: ${antes.personas.length} → ${p.personas.length}`);
  const bisagras = p.bisagras.filter((b) => !antes.bisagras.includes(b));
  if (bisagras.length) cambios.push(`bisagras nuevas: ${bisagras.join(' · ')}`);
  const cubiertos = p.cubiertos.filter((c) => !antes.cubiertos.includes(c));
  if (cubiertos.length) cambios.push(`cubiertos (no se preguntan): ${cubiertos.join(', ')}`);
  if (p.puertaAbierta) cambios.push(`puerta abierta: ${p.puertaAbierta}`);
  if (p.hoyFueFuerte) cambios.push('hoy fue fuerte: mañana lo reconoce antes de preguntar');
  const variables = estado.secuencia.pendientes.filter((o) => o.tipo === 'variable').length;
  if (variables !== variablesAntes) cambios.push(`variables pendientes: ${variablesAntes} → ${variables}`);
  linea(cambios.length ? `Perfil:\n  ${cambios.join('\n  ')}` : 'Perfil: sin cambios.');
}

/**
 * La próxima (§2.5): el biógrafo la elige, la escribe con los controles y la deja como enviada;
 * si se cerró un tramo, pide el objeto como segundo mensaje. Al terminar: el objeto final y la
 * despedida.
 */
async function siguiente(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const { n, estado: leido } = await exigirNarrador(ref);
  let estado = leido;
  const s = slug(n.como_le_dicen);
  const extra: Record<string, unknown> = {};

  if (n.estado === 'completado') { linea(`${n.como_le_dicen} ya terminó la entrevista. Mirá: npm run manual-v2 -- estado ${s}`); return; }
  if (n.estado === 'pausado') {
    if (!flags['reanudar']) {
      throw new Error(`${n.como_le_dicen} pidió no seguir y la entrevista está en pausa. Si lo hablaron y quiere seguir: npm run manual-v2 -- siguiente ${s} --reanudar`);
    }
    extra.estado = 'activo';
    linea('Se reanuda la entrevista (estado → activo).');
  }

  const filas = await respuestasDe(n.id);
  const que = queHaceSiguiente(estado, filas.filter((f) => !f.es_repregunta).map((f) => f.pregunta_orden), Boolean(flags['saltar']));
  if (que.tipo === 'retomar') {
    linea(`Ayer dijo "hoy no": se retoma la MISMA pregunta (orden ${que.orden}). No cambió nada en la base.`);
    linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg>`);
    if (extra.estado) await guardar(n, estado, extra);
    imprimirParaPegar([{ titulo: `Pregunta ${que.orden} (la misma)`, texto: que.texto }]);
    return;
  }
  if (que.tipo === 'falta-respuesta') {
    throw new Error(
      `La orden ${que.orden} todavía no tiene respuesta cargada: cargala primero (npm run manual-v2 -- cargar ${s} <audio.ogg>). ` +
      'Si de verdad querés pasar a la próxima sin respuesta: --saltar.',
    );
  }

  const conversacion = conversacionDe(estado, filas);
  const yaHechas = yaHechasDe(estado);
  const evitar = evitarDe(n.contexto ?? {});
  const sinFotos = Boolean(n.contexto?.sinFotos);
  const nombre = nombreDe(n, estado);
  const usos: Anthropic.Usage[] = [];
  const mensajes: { titulo: string; texto: string }[] = [];

  /** El objeto (§2.5): lo escribe el mismo cerebro, y va con su orden 101+ al lado de las preguntas. */
  const pedirObjeto = async (tramo: NonNullable<ReturnType<typeof tocaObjeto>>, final: boolean, hechasHasta: string[]) => {
    const obj: Objetivo = { tipo: 'objeto', id: `objeto-${tramo}${final ? '-final' : ''}`, tramo };
    const r = await escribirPregunta(cliente(), estado.perfil, obj, conversacion, hechasHasta, evitar);
    usos.push(...r.usos);
    const ordenObjeto = 101 + estado.secuencia.objetos.length;
    estado = {
      ...estado,
      secuencia: registrarObjeto(estado.secuencia, tramo, ordenObjeto, final),
      preguntasEnviadas: { ...estado.preguntasEnviadas, [ordenObjeto]: r.texto },
      marcas: r.marca ? { ...estado.marcas, [ordenObjeto]: r.marca } : estado.marcas,
    };
    linea(`Objeto ${final ? 'final ' : ''}(${tramo}, orden ${ordenObjeto}): ${r.usos.length} intento${r.usos.length === 1 ? '' : 's'} · ${marcaEnTexto(r.marca)}`);
    return r.texto;
  };

  const sig = proxima(estado.secuencia);
  if (!sig) {
    const tramo = tocaObjeto(estado.secuencia, null, sinFotos);
    if (tramo) mensajes.push({ titulo: 'Objeto final', texto: await pedirObjeto(tramo, true, yaHechas) });
    mensajes.push({ titulo: 'Despedida', texto: despedidaV2(nombre, estado.perfil) });
    extra.estado = 'completado';
    estado = sumarGasto(estado, usos);
    await guardar(n, estado, extra);
    await anotarUsos('v2-objeto', n.id, usos);
    titulo(`${n.como_le_dicen} terminó: ${estado.secuencia.hechas.length - 1} preguntas (estado → completado)`);
    linea(`Gasto de la entrevista: USD ${estado.gastoUsd.toFixed(3)}`);
    imprimirParaPegar(mensajes);
    return;
  }

  // El objeto se decide ANTES de avanzar: mira si el tramo de lo ya hecho se cerró.
  const tramoObjeto = tocaObjeto(estado.secuencia, sig, sinFotos);
  const orden = estado.secuencia.hechas.length;
  titulo(`Pregunta ${orden} para ${n.como_le_dicen} — ${sig.id}${sig.tipo === 'variable' ? ` (${sig.tramo}, ${sig.desde}-${sig.hasta} años)` : ''}`);
  const r = await escribirPregunta(cliente(), estado.perfil, sig, conversacion, yaHechas, evitar);
  usos.push(...r.usos);
  await anotarUsos('v2-pregunta', n.id, r.usos);
  estado = {
    ...estado,
    preguntasEnviadas: { ...estado.preguntasEnviadas, [orden]: r.texto },
    marcas: r.marca ? { ...estado.marcas, [orden]: r.marca } : estado.marcas,
    secuencia: avanzar(estado.secuencia, sig, orden),
  };
  linea(`Intentos: ${r.usos.length} · ${marcaEnTexto(r.marca)}`);
  mensajes.push({ titulo: `Pregunta ${orden}`, texto: r.texto });

  if (tramoObjeto) {
    const usosAntes = usos.length;
    mensajes.push({ titulo: 'Segundo mensaje: el objeto', texto: await pedirObjeto(tramoObjeto, false, [...yaHechas, r.texto]) });
    await anotarUsos('v2-objeto', n.id, usos.slice(usosAntes));
  }

  estado = sumarGasto(estado, usos);
  await guardar(n, estado, { ...extra, dia_actual: orden });
  const quedan = estado.secuencia.pendientes.length;
  linea(`Quedan ${quedan} pendiente${quedan === 1 ? '' : 's'} · gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg>   (o --texto "...")`);
  imprimirParaPegar(mensajes);
}

/** El estado en castellano: el perfil, lo que falta, lo que se cayó, lo marcado y lo gastado. */
async function verEstado(ref: string | undefined): Promise<void> {
  const { n, estado } = await exigirNarrador(ref);
  const sec = estado.secuencia;
  titulo(`${n.como_le_dicen} (${n.nombre}) — estado: ${n.estado} · orden vigente: ${n.dia_actual}`);
  linea(`Castellano: ${estado.perfil.castellano} · le dicen: ${estado.perfil.persona.comoLeDicen?.valor ?? 'no se sabe'} · gasto: USD ${estado.gastoUsd.toFixed(3)}`);
  titulo('Perfil');
  linea(perfilEnTexto(estado.perfil));
  titulo(`Hechas (${sec.hechas.length})`);
  for (const h of sec.hechas) {
    const r = estado.repreguntasEnviadas[String(h.orden)];
    linea(`  ${String(h.orden).padStart(2)} · ${h.id}${h.tramo ? ` (${h.tramo})` : ''}${estado.marcas[String(h.orden)] ? '  ⚠ marcada' : ''}${r ? '  + repregunta' : ''}`);
  }
  titulo(`Pendientes (${sec.pendientes.length})`);
  for (const o of sec.pendientes) {
    const donde = o.tipo === 'nucleo' ? o.bloque : o.tipo === 'variable' ? `${o.tramo}, ${o.desde}-${o.hasta} años` : o.tramo;
    linea(`  ${o.id} — ${donde}`);
  }
  titulo('Lo demás');
  linea(`  cubiertos (se cayeron): ${sec.cubiertos.length ? sec.cubiertos.join(', ') : 'ninguno'}`);
  linea(`  objetos: ${sec.objetos.length ? sec.objetos.map((o) => `${o.orden} ${o.tramo}${o.final ? ' (final)' : ''}`).join(' · ') : 'ninguno'}`);
  const marcas = Object.entries(estado.marcas);
  linea(`  marcas: ${marcas.length ? '' : 'ninguna'}`);
  for (const [orden, m] of marcas) linea(`    ${orden}: ${m.control} — ${m.motivo} (${m.intentos} intentos)`);
  if (estado.sinRepreguntarHasta) linea(`  sin repreguntar hasta: ${estado.sinRepreguntarHasta} (cansancio)`);
  if (estado.retomar !== undefined) linea(`  "hoy no": se retoma la orden ${estado.retomar}`);
  if (n.contexto?.evitar) linea(`  temas a evitar: ${String(n.contexto.evitar).replace(/\n/g, ' · ')}`);
  linea();
}

function ayuda(): void {
  linea(`
Puerta manual v2 — la entrevista con el cerebro nuevo (nada sale por WhatsApp: se imprime para pegar)

  npm run manual-v2 -- empezar naza [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires] [--familia email]
  npm run manual-v2 -- cargar naza <audio.ogg> [--repregunta] [--orden N] [--es-suyo]
  npm run manual-v2 -- cargar naza --texto "lo que escribió" [--repregunta] [--orden N]
  npm run manual-v2 -- cargar naza --reprocesar [--repregunta] [--orden N]
  npm run manual-v2 -- siguiente naza [--saltar] [--reanudar]
  npm run manual-v2 -- estado naza
`);
}

const COMANDOS: Record<string, (a: Args) => Promise<void>> = {
  empezar: (a) => empezar(a.posicionales[0], a.flags),
  cargar: (a) => cargar(a.posicionales[0], a.posicionales[1], a.flags),
  siguiente: (a) => siguiente(a.posicionales[0], a.flags),
  estado: (a) => verEstado(a.posicionales[0]),
  ayuda: async () => ayuda(),
};

async function main(): Promise<void> {
  const args = parsearArgs(process.argv.slice(2));
  const comando = args.comando === '' ? 'ayuda' : args.comando;
  const correr = COMANDOS[comando];
  if (!correr) {
    ayuda();
    throw new Error(`No conozco el comando «${comando}».`);
  }
  await correr(args);
}

/** Exportada para que el test de punta a punta (con base y modelo falsos) pueda esperar al comando. */
export const listo = main().catch((err) => {
  console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
