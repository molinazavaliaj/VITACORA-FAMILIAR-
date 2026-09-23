/**
 * LA PUERTA MANUAL v2 (diseño 23/09, §4.1): la entrevista entera con el cerebro nuevo —perfil,
 * plan, secuencia viva, encargo, controles, evaluación—, para que Naza se entreviste a sí mismo
 * copiando cada mensaje a WhatsApp a mano. No toca el flujo automático ni la puerta manual vieja
 * (`scripts/manual.ts`, que no se importa). Todo el estado vive en `narradores.contexto.v2`; lo
 * que se puede decidir sin base ni modelo está en `src/manual/estado-v2.ts`, con tests.
 *
 * NO manda nada: todo texto para la persona se IMPRIME ENTERO al final, listo para pegar.
 *
 * El narrador v2 vive SIEMPRE en `estado = 'pausado'`: es el único estado que el scheduler de
 * producción no toca (`src/flujo/scheduler.ts` recorre invitado/acepto/activo). Con 'activo', a su
 * hora el tick le mandaba la pregunta v1 —una llamada al modelo por día— y escribía `contexto` con
 * la copia que leyó al empezar, pisando `contexto.v2` si justo corría un comando de acá. La pausa
 * de "no quiero seguir" va en `contexto.v2.pausa`; al terminar, `contexto.v2.terminada` (NO
 * 'completado': con eso la fábrica de producción arma la estructura v1 y manda el mail "terminó").
 *
 * Uso (desde entrevistador/):
 *   npm run manual-v2 -- empezar naza [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires] [--familia email]
 *   npm run manual-v2 -- cargar naza <audio.ogg> [<otro.ogg> ...] [--repregunta] [--orden N] [--es-suyo]
 *   npm run manual-v2 -- cargar naza --texto "lo que escribió" [--repregunta] [--orden N]
 *   npm run manual-v2 -- cargar naza --reprocesar [--repregunta] [--orden N] [--es-suyo]
 *   npm run manual-v2 -- siguiente naza [--saltar] [--reanudar]
 *   npm run manual-v2 -- estado naza
 *
 * Ojo con el orden: los archivos van ANTES de los --flags (`--repregunta audio.ogg` se leería
 * como "--repregunta = audio.ogg").
 */
import { readFileSync, existsSync, statSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import {
  parsearArgs, slug, archivoCanonico, promptDeTranscripcion, motivoParaRechazarAudio, listaParaConcatenar, type Args,
} from '../src/manual/puro.js';
import {
  estadoNuevo, leerEstado, contextoConEstado, planSiHaceFalta, pendientesParaPerfil, preguntaParaCargar,
  queHaceSiguiente, conversacionDe, yaHechasDe, evitarDe, hoyEn, repreguntasParaCansancio, decidirTrasEvaluar,
  sumarGasto, mensajeHoyNo, cierreQuiereParar, mailQuiereParar, despedidaV2, type EstadoV2, type FilaParaSiguiente,
} from '../src/manual/estado-v2.js';
import { actualizarPerfil } from '../src/ia/perfil.js';
import { proxima, avanzar, aplicarPerfil, tocaObjeto, registrarObjeto } from '../src/ia/secuencia.js';
import { escribirPregunta, perfilEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { evaluarV2, hayCansancio } from '../src/ia/evaluar-v2.js';
import type { Marca } from '../src/ia/control-pregunta.js';
import type { Tramo } from '../src/ia/plan-preguntas.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, '..', '..');
/** Los respaldos locales de audio. `MANUAL_V2_CRUDOS` lo cambia (el test escribe en una carpeta temporal). */
const CRUDOS = process.env.MANUAL_V2_CRUDOS ?? resolve(REPO, 'audios-crudos');

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
const comandoDescartar = (n: NarradorFila, id: string, motivo: string) =>
  `npm run manual -- descartar ${slug(n.como_le_dicen)} ${id} --motivo "${motivo}" --si`;
const comandoReprocesar = (n: NarradorFila, orden: number, esRepregunta: boolean) =>
  `npm run manual-v2 -- cargar ${slug(n.como_le_dicen)} --reprocesar --orden ${orden}${esRepregunta ? ' --repregunta' : ''}`;

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
 * Crea al narrador si no existe (como `crear` de manual.ts: primera familia de Naza, modo rápido,
 * teléfono `+manual-<slug>` para que nada salga por WhatsApp) pero en 'pausado' —ver arriba por
 * qué—; si ya existía en otro estado, lo pasa a 'pausado' y lo dice. Arma el perfil de la ficha y
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
    if (n.estado !== 'pausado') {
      linea(`Su estado era '${n.estado}': pasa a 'pausado' para que el scheduler de producción no le mande la pregunta v1.`);
    }
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
      // 'pausado': el único estado que el scheduler de producción no toca (ver arriba).
      estado: 'pausado',
      dia_actual: 0,
    };
    const { data, error } = await db.from('narradores').insert(fila).select('*').single();
    if (error) throw new Error(`No pude crear al narrador: ${error.message}`);
    n = data as NarradorFila;
    titulo(`Narrador creado: ${n.como_le_dicen}`);
    linea(`  id: ${n.id}   ·   familia: ${(familia as { email: string }).email}   ·   zona: ${n.zona_horaria}   ·   teléfono: ${fila.telefono_whatsapp}`);
    linea(`  estado: 'pausado' a propósito: así el scheduler de producción no lo toca. La entrevista v2 corre igual.`);
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
  await guardar(n, estado, { dia_actual: 0, estado: 'pausado' });
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
 * Una respuesta que llegó en varias notas de voz: se pegan con ffmpeg en un solo .ogg (el mismo
 * patrón que `unirAudios` de manual.ts, bitácora 3). Re-encodea a opus: pegar .ogg con `-c copy`
 * deja saltos en el audio.
 */
function unirAudios(n: NarradorFila, rutas: string[]): string {
  const carpeta = join(CRUDOS, slug(n.como_le_dicen), 'partes');
  mkdirSync(carpeta, { recursive: true });
  const lista = join(carpeta, `union-${Date.now()}.txt`);
  const salida = lista.replace(/\.txt$/, '.ogg');
  writeFileSync(lista, listaParaConcatenar(rutas));
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lista, '-c:a', 'libopus', '-b:a', '32k', salida], { stdio: 'inherit' });
  } catch (err) {
    throw new Error(`No pude unir los ${rutas.length} audios con ffmpeg (¿está instalado y en el PATH?): ${err instanceof Error ? err.message : String(err)}`);
  }
  linea(`Unidos ${rutas.length} audios → ${salida}`);
  return salida;
}

/**
 * El candado contra el audio cruzado (hallazgo 43): si la transcripción es casi igual a una ya
 * cargada en OTRO narrador, devuelve de quién es. No borra nada: quien carga sabe cuál va dónde.
 */
async function deQuienEs(n: NarradorFila, texto: string): Promise<{ quien: string; orden: number } | null> {
  try {
    const { db, buscarCruce } = await modulos();
    const { data } = await db.from('respuestas').select('narrador_id, pregunta_orden, transcripcion').neq('narrador_id', n.id);
    const cruce = buscarCruce(texto, (data ?? []) as never);
    if (!cruce) return null;
    const { data: duenio } = await db.from('narradores').select('como_le_dicen').eq('id', cruce.narrador_id).maybeSingle();
    return { quien: (duenio as { como_le_dicen?: string } | null)?.como_le_dicen ?? cruce.narrador_id.slice(0, 8), orden: cruce.pregunta_orden };
  } catch (err) {
    // El candado no puede frenar una carga buena: si falla, se avisa y se sigue.
    console.warn('No se pudo comprobar si el audio ya estaba cargado en otro narrador:', err);
    return null;
  }
}

/** Baja de Storage el audio de una respuesta (para retranscribir una carga que se cortó antes). */
async function bajarAudio(audioPath: string): Promise<Buffer> {
  const { db } = await modulos();
  const { data, error } = await db.storage.from('audios').download(audioPath);
  if (error || !data) throw new Error(`No pude bajar audios/${audioPath}: ${error?.message ?? 'sin datos'}`);
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Carga una respuesta (audio —una o varias notas—, texto, o la que ya está si una carga anterior
 * se cortó) y hace lo que haría el día: perfil, plan, secuencia; evaluación (salvo la
 * presentación); reserva, tema a dejar, cansancio, "hoy no", "no quiero seguir"; la repregunta si
 * toca. Todo lo que pasa después de guardar la fila va dentro de un try: si algo se cae, dice el
 * comando exacto para retomar (`--reprocesar`).
 */
async function cargar(ref: string | undefined, archivos: string[], flags: Args['flags']): Promise<void> {
  const { n, estado: leido } = await exigirNarrador(ref);
  const mods = await modulos();
  let estado = leido;
  const esRepregunta = Boolean(flags['repregunta']);
  const ordenPedida = flag(flags, 'orden') !== undefined ? Number(flag(flags, 'orden')) : undefined;
  if (ordenPedida !== undefined && !Number.isInteger(ordenPedida)) throw new Error('--orden tiene que ser un número.');
  const abierta = preguntaParaCargar(estado, ordenPedida, esRepregunta);
  if ('error' in abierta) throw new Error(abierta.error);
  const { orden, objetivo, esObjeto } = abierta;
  const texto = flag(flags, 'texto')?.trim();
  const reprocesar = Boolean(flags['reprocesar']);
  const esSuyo = Boolean(flags['es-suyo']);
  if ([archivos.length > 0, Boolean(texto), reprocesar].filter(Boolean).length !== 1) {
    throw new Error('Uso: cargar <narrador> <audio.ogg> [<otro.ogg> ...] | --texto "..." | --reprocesar   [--repregunta] [--orden N]');
  }
  if (estado.pausa) linea(`⚠ La entrevista está en pausa (pidió no seguir el ${estado.pausa.fecha}): cargo la respuesta igual. Para seguir: siguiente --reanudar.`);

  const filas = await respuestasDe(n.id);
  const deEstaOrden = filas.filter((f) => f.pregunta_orden === orden && f.es_repregunta === esRepregunta);
  // Las que frenó el candado no cuentan: se puede cargar el audio bueno aunque la otra siga ahí.
  const validas = deEstaOrden.filter((f) => !estado.bloqueadas.includes(f.id));
  if (!esRepregunta && !reprocesar && validas.length && estado.retomar !== orden) {
    const cortada = validas.find((f) => !estado.procesadas.includes(f.id));
    throw new Error(
      `La orden ${orden} de ${n.como_le_dicen} ya tiene respuesta. Si esto contesta la repregunta: --repregunta.` +
      (cortada ? ` La que está no terminó de procesarse: ${comandoReprocesar(n, orden, false)}` : ''),
    );
  }

  titulo(`${n.como_le_dicen}, orden ${orden}${esRepregunta ? ' (repregunta)' : esObjeto ? ' (objeto)' : ''} — ${objetivo.id}`);
  linea(`Pregunta: ${abierta.texto}`);

  let respuesta = '';
  let segundos = 0;
  let respuestaId = '';
  let segundosTranscriptos = 0;
  let audioParaTranscribir: Buffer | null = null;

  if (reprocesar) {
    // La que quedó a medias (no procesada); si no hay, la última de esa orden.
    const fila = [...deEstaOrden].reverse().find((f) => !estado.procesadas.includes(f.id)) ?? deEstaOrden.at(-1);
    if (!fila) throw new Error(`No hay respuesta${esRepregunta ? ' a la repregunta' : ''} cargada en la orden ${orden} para reprocesar.`);
    if (estado.bloqueadas.includes(fila.id)) {
      if (!esSuyo) {
        throw new Error(
          `La respuesta ${fila.id} la frenó el candado de audio cruzado. Si no es suya: ${comandoDescartar(n, fila.id, 'audio de otro narrador')}. ` +
          `Si de verdad es suya: ${comandoReprocesar(n, orden, esRepregunta)} --es-suyo`,
        );
      }
      estado = { ...estado, bloqueadas: estado.bloqueadas.filter((id) => id !== fila.id) };
      linea('--es-suyo: la respuesta que había frenado el candado entra como suya.');
    }
    respuestaId = fila.id;
    respuesta = (fila.transcripcion ?? fila.texto_directo ?? '').trim();
    segundos = fila.duracion_segundos ?? 0;
    if (!respuesta) {
      if (!fila.audio_path) {
        throw new Error(`La respuesta ${fila.id} no tiene texto ni audio. Sacala con: ${comandoDescartar(n, fila.id, 'carga vacía')}`);
      }
      linea(`No tiene transcripción: la bajo de Storage (audios/${fila.audio_path}) y la transcribo de nuevo.`);
      audioParaTranscribir = await bajarAudio(fila.audio_path);
    } else {
      linea(`Reproceso la respuesta ya cargada (${fila.id}).`);
    }
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
    const rutas = archivos.map(resolverRuta);
    for (const r of rutas) {
      const motivo = motivoParaRechazarAudio(statSync(r).size, basename(r));
      if (motivo) throw new Error(motivo);
    }
    const ruta = rutas.length === 1 ? rutas[0] : unirAudios(n, rutas);
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
    audioParaTranscribir = audio;
  }

  try {
    if (audioParaTranscribir) {
      const prompt = promptDeTranscripcion(n.contexto ?? {}, nombreDe(n, estado), n.zona_horaria);
      const t = await mods.transcribirYActualizar(respuestaId, audioParaTranscribir, prompt, n.id);
      respuesta = t.texto;
      segundos = t.duracionSegundos;
      segundosTranscriptos = t.duracionSegundos;
      linea(`Transcripción (${segundos}s): ${respuesta}`);
      const cruce = esSuyo ? null : await deQuienEs(n, respuesta);
      if (cruce) {
        // Frena ANTES del perfil, y deja la fila anotada: no entra a los prompts ni cuenta como
        // contestada, y `siguiente` no avanza mientras siga en la base.
        estado = sumarGasto({ ...estado, bloqueadas: [...new Set([...estado.bloqueadas, respuestaId])] }, [], segundosTranscriptos);
        await guardar(n, estado);
        titulo('⚠  ESTE AUDIO YA ESTÁ CARGADO EN OTRO NARRADOR');
        linea(`Lo mismo figura en ${cruce.quien}, orden ${cruce.orden}.`);
        linea(`Frené acá: no actualicé el perfil ni evalué la respuesta ${orden}, y siguiente no avanza mientras esté.`);
        linea('Si te equivocaste de archivo, sacala con:');
        linea(`   ${comandoDescartar(n, respuestaId, `audio de ${cruce.quien}`)}`);
        linea('y cargá el que sí es suyo. Si de verdad es suyo (rarísimo):');
        linea(`   ${comandoReprocesar(n, orden, esRepregunta)} --es-suyo`);
        return;
      }
    }
    await procesar(n, estado, { ...abierta, esRepregunta }, filas, respuestaId, respuesta, segundos, segundosTranscriptos, reprocesar);
  } catch (err) {
    console.error(`\n✖ La respuesta quedó guardada (id ${respuestaId}) pero se cortó antes de terminar.`);
    console.error(`  Cuando se arregle, retomala con: ${comandoReprocesar(n, orden, esRepregunta)}`);
    throw err;
  }
}

/** Lo que pasa con una respuesta ya guardada y transcripta: perfil, evaluación y lo que decida. */
async function procesar(
  n: NarradorFila, leido: EstadoV2,
  abierta: { orden: number; objetivo: Objetivo; texto: string; esObjeto: boolean; esRepregunta: boolean },
  filas: RespuestaFila[], respuestaId: string, respuesta: string, segundos: number, segundosTranscriptos: number, reprocesar: boolean,
): Promise<void> {
  const mods = await modulos();
  const { orden, objetivo, esObjeto, esRepregunta } = abierta;
  let estado = leido;
  const s = slug(n.como_le_dicen);

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
  const procesada = (e: EstadoV2): EstadoV2 => ({ ...e, procesadas: [...new Set([...e.procesadas, respuestaId])] });

  // 2. La presentación solo alimenta el perfil (§2.2): no se evalúa ni se repregunta.
  if (objetivo.tipo === 'nucleo' && objetivo.id === 'presentacion' && !esRepregunta) {
    estado = procesada(sumarGasto(estado, usos, segundosTranscriptos));
    await guardar(n, estado);
    linea(`Gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
    linea(`Ahora: npm run manual-v2 -- siguiente ${s}`);
    return;
  }

  // 3. La evaluación, con lo último que hablaron (sin la respuesta de hoy). La de una repregunta o
  //    un objeto se evalúa solo por la reserva, el tema a dejar y el "no quiero seguir".
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
    esRepregunta: esRepregunta || esObjeto,
    yaHayRepregunta: Boolean(estado.repreguntasEnviadas[String(orden)]),
    hoy: hoyEn(n.zona_horaria),
    orden,
    cansancio: hayCansancio(repreguntasParaCansancio(estado, orden, contestadas)),
    sinRepreguntarHasta: estado.sinRepreguntarHasta,
  });
  // La respuesta que llegó después de un "hoy no" cierra la espera (salvo que hoy tampoco pueda).
  if (estado.retomar === orden && !esRepregunta && decision.accion !== 'hoyNo') estado = { ...estado, retomar: undefined };

  const nombre = nombreDe(n, estado);
  const mensajes: { titulo: string; texto: string }[] = [];

  switch (decision.accion) {
    case 'parar': {
      const principales = filas.filter((f) => !f.es_repregunta).length + (esRepregunta || reprocesar ? 0 : 1);
      const mail = mailQuiereParar({
        nombre, narradorId: n.id, orden, pregunta: abierta.texto, respuesta, respuestas: principales,
        comandoReanudar: `npm run manual-v2 -- siguiente ${s} --reanudar`,
      });
      estado = { ...estado, pausa: { motivo: 'quiereParar', fecha: hoyEn(n.zona_horaria) } };
      titulo('NO QUIERE SEGUIR — la entrevista queda en pausa (contexto.v2.pausa)');
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
      // "Hoy no puedo" no es material del libro: se reserva con el mecanismo que ya lee la fábrica.
      await mods.guardarReserva(respuestaId, { reservada: true, tramo: null });
      linea(`Hoy no puede: la orden ${orden} queda abierta y mañana se retoma la MISMA (siguiente la vuelve a imprimir).`);
      linea('Esta respuesta ("hoy no") quedó reservada: no va al libro.');
      mensajes.push({ titulo: 'Mañana se retoma', texto: mensajeHoyNo(nombre, estado.perfil) });
      break;
    case 'repreguntar':
      estado = {
        ...estado,
        repreguntasEnviadas: { ...estado.repreguntasEnviadas, [orden]: decision.texto },
        marcas: ev.marca ? { ...estado.marcas, [`${orden}-repregunta`]: ev.marca } : estado.marcas,
      };
      linea(`Repregunta: ${ev.usos.length} intento${ev.usos.length === 1 ? '' : 's'} · ${marcaEnTexto(ev.marca)}`);
      linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg> --repregunta${orden !== estado.secuencia.hechas.at(-1)?.orden ? ` --orden ${orden}` : ''}`);
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

  estado = procesada(sumarGasto(estado, usos, segundosTranscriptos));
  await guardar(n, estado, {}, evitarNuevo);
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

  if (estado.terminada) { linea(`${n.como_le_dicen} ya terminó la entrevista (${estado.terminada}). Mirá: npm run manual-v2 -- estado ${s}`); return; }
  if (estado.pausa) {
    if (!flags['reanudar']) {
      throw new Error(`${n.como_le_dicen} pidió no seguir (${estado.pausa.fecha}) y la entrevista está en pausa. Si lo hablaron y quiere seguir: npm run manual-v2 -- siguiente ${s} --reanudar`);
    }
    estado = { ...estado, pausa: undefined };
    linea('Se reanuda la entrevista (se saca la pausa de "no quiero seguir").');
  }

  const filas = await respuestasDe(n.id);
  const que = queHaceSiguiente(estado, filas, Boolean(flags['saltar']));
  const describir = (f: FilaParaSiguiente) => `orden ${f.pregunta_orden}${f.es_repregunta ? ' (repregunta)' : ''}, id ${f.id}`;
  if (que.tipo === 'bloqueada') {
    const lineas = que.filas.map((f) => `  ${describir(f)}\n    no es suya:  ${comandoDescartar(n, f.id, 'audio de otro narrador')}\n    sí es suya:  ${comandoReprocesar(n, f.pregunta_orden, f.es_repregunta)} --es-suyo`);
    throw new Error(`Hay una respuesta que frenó el candado de audio cruzado y sigue cargada (ni --saltar la pasa):\n${lineas.join('\n')}`);
  }
  if (que.tipo === 'sin-procesar') {
    const lineas = que.filas.map((f) => `  ${describir(f)}:  ${comandoReprocesar(n, f.pregunta_orden, f.es_repregunta)}`);
    throw new Error(`Hay respuestas que se cargaron pero no terminaron de procesarse (perfil/evaluación):\n${lineas.join('\n')}\nSi de verdad querés seguir sin procesarlas: --saltar.`);
  }
  if (que.tipo === 'retomar') {
    linea(`Ayer dijo "hoy no": se retoma la MISMA pregunta (orden ${que.orden}). --saltar no la saltea: se espera su respuesta.`);
    linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg>`);
    if (leido.pausa && !estado.pausa) await guardar(n, estado);
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
  const pedirObjeto = async (tramo: Tramo, final: boolean, hechasHasta: string[]) => {
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
    linea(`  Lo que cuente de ese objeto: npm run manual-v2 -- cargar ${s} <audio.ogg> --orden ${ordenObjeto}`);
    return r.texto;
  };

  const sig = proxima(estado.secuencia);
  if (!sig) {
    const tramo = tocaObjeto(estado.secuencia, null, sinFotos);
    if (tramo) mensajes.push({ titulo: 'Objeto final', texto: await pedirObjeto(tramo, true, yaHechas) });
    mensajes.push({ titulo: 'Despedida', texto: despedidaV2(nombre, estado.perfil) });
    estado = { ...sumarGasto(estado, usos), terminada: hoyEn(n.zona_horaria) };
    // Sigue 'pausado' en la base a propósito: 'completado' dispararía la fábrica de producción.
    await guardar(n, estado, { estado: 'pausado' });
    await anotarUsos('v2-objeto', n.id, usos);
    titulo(`${n.como_le_dicen} terminó: ${estado.secuencia.hechas.length - 1} preguntas (queda 'pausado' en la base; terminada en contexto.v2)`);
    linea(`El libro: cd ../fabrica && npx tsx --env-file=.env scripts/prueba-reparto.ts ${n.id} --salida prueba-libro-${s}`);
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
  await guardar(n, estado, { dia_actual: orden });
  const quedan = estado.secuencia.pendientes.length;
  linea(`Quedan ${quedan} pendiente${quedan === 1 ? '' : 's'} · gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg>   (o --texto "...")`);
  imprimirParaPegar(mensajes);
}

/** El estado en castellano: el perfil, lo que falta, lo que se cayó, lo marcado y lo gastado. */
async function verEstado(ref: string | undefined): Promise<void> {
  const { n, estado } = await exigirNarrador(ref);
  const sec = estado.secuencia;
  titulo(`${n.como_le_dicen} (${n.nombre}) — estado en la base: ${n.estado} · orden vigente: ${n.dia_actual}`);
  if (estado.pausa) linea(`⏸ EN PAUSA: pidió no seguir el ${estado.pausa.fecha} (siguiente --reanudar para retomar).`);
  if (estado.terminada) linea(`✔ TERMINADA el ${estado.terminada} (la base la deja en 'pausado' a propósito).`);
  linea(`Castellano: ${estado.perfil.castellano} · le dicen: ${estado.perfil.persona.comoLeDicen?.valor ?? 'no se sabe'} · gasto: USD ${estado.gastoUsd.toFixed(3)}`);
  titulo('Perfil');
  linea(perfilEnTexto(estado.perfil));
  titulo(`Hechas (${sec.hechas.length})`);
  for (const h of sec.hechas) {
    const o = String(h.orden);
    const r = estado.repreguntasEnviadas[o];
    const marcaR = estado.marcas[`${o}-repregunta`] ? ' ⚠ marcada' : '';
    linea(`  ${o.padStart(2)} · ${h.id}${h.tramo ? ` (${h.tramo})` : ''}${estado.marcas[o] ? '  ⚠ marcada' : ''}${r ? `  + repregunta${marcaR}` : ''}`);
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
  if (estado.bloqueadas.length) linea(`  frenadas por el candado de audio cruzado: ${estado.bloqueadas.join(', ')}`);
  if (n.contexto?.evitar) linea(`  temas a evitar: ${String(n.contexto.evitar).replace(/\n/g, ' · ')}`);
  linea();
}

function ayuda(): void {
  linea(`
Puerta manual v2 — la entrevista con el cerebro nuevo (nada sale por WhatsApp: se imprime para pegar)

  npm run manual-v2 -- empezar naza [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires] [--familia email]
  npm run manual-v2 -- cargar naza <audio.ogg> [<otro.ogg> ...] [--repregunta] [--orden N] [--es-suyo]
  npm run manual-v2 -- cargar naza --texto "lo que escribió" [--repregunta] [--orden N]
  npm run manual-v2 -- cargar naza --reprocesar [--repregunta] [--orden N] [--es-suyo]
  npm run manual-v2 -- siguiente naza [--saltar] [--reanudar]
  npm run manual-v2 -- estado naza

  · Varios audios para una misma respuesta: se pegan con ffmpeg en uno solo.
  · Lo que cuente de un objeto (órdenes 101+): cargar ... --orden 101.
  · --reprocesar: si una carga se cortó (se cayó el modelo), retoma la que quedó guardada.
  · --saltar pasa a la próxima sin respuesta procesada; NO saltea un "hoy no" (se espera la
    respuesta a la misma) ni una respuesta frenada por el candado de audio cruzado.
  · El narrador queda en estado 'pausado' en la base A PROPÓSITO: es el único estado que el
    scheduler de producción no toca (con 'activo' le mandaba la pregunta vieja y podía pisar
    contexto.v2). La pausa de "no quiero seguir" va en contexto.v2.pausa (--reanudar la saca).
`);
}

const COMANDOS: Record<string, (a: Args) => Promise<void>> = {
  empezar: (a) => empezar(a.posicionales[0], a.flags),
  cargar: (a) => cargar(a.posicionales[0], a.posicionales.slice(1), a.flags),
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
