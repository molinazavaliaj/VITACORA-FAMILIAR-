/**
 * LA PUERTA MANUAL v2 (diseño 23/09, §4.1): la entrevista entera con el cerebro nuevo —perfil,
 * guion fijo por etapas, secuencia, encargo, controles, evaluación—, para que Naza se entreviste a sí mismo
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
 *   npm run manual-v2 -- siguiente naza [--saltar] [--reanudar] [--seguido no] [--max 8]
 *   npm run manual-v2 -- estado naza
 *   npm run manual-v2 -- descubrir naza <id> [<id> ...]
 *
 * Piloto "de cero, reusando respuestas viejas" (ajuste D, 24/09): `empezar naza2 --nombre "Naza"
 * --reusar <narrador_id_viejo>`. Cada pregunta nueva (presentación, núcleo o libre) se busca entre
 * las respuestas del piloto viejo; si una ya la contesta, se carga sola como respuesta escrita y se
 * procesa entera (ficha, evaluación…), y se sigue con la próxima hasta la primera que tenga que
 * contestar Naza en vivo (o una repregunta, un objeto, una pausa, el final, o --max pasos).
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
  estadoNuevo, leerEstado, contextoConEstado, rearmarSiHaceFalta, pendientesParaPerfil, preguntaParaCargar,
  queHaceSiguiente, conversacionDe, yaHechasDe, objetoDe, evitarDe, hoyEn, cuandoContesto, ultimaRespuestaAt, recibidoAtDe, repreguntasParaCansancio, repreguntasEnEtapa, decidirTrasEvaluar,
  sumarGasto, mensajeHoyNo, cierreQuiereParar, mailQuiereParar, despedidaV2, nombreLimpio, type EstadoV2, type FilaParaSiguiente, type Decision,
} from '../src/manual/estado-v2.js';
import {
  viejasDe, candidatasPara, seBusca, pasaPorCandado, lineaReusada, opcionesDeReuso, reusadasEnTexto, leerViejasDeBase, quienLoReusa, type Vieja,
} from '../src/manual/reusar-v2.js';
import { buscarReusable } from '../src/ia/reusar-v2.js';
import { actualizarPerfil } from '../src/ia/perfil.js';
import { proxima, avanzar, cubrirDesde, conNombrado, descubrir, etapaCerrada, agregarLibre, tocaObjeto, registrarObjeto, tramoDe, type Rechazado } from '../src/ia/secuencia.js';
import { escribirPregunta, perfilEnTexto, recortarHecha, type Objetivo, type YaHecha } from '../src/ia/pregunta-v2.js';
import { evaluarV2, evaluarPedidos, hayCansancio, type EvaluacionV2 } from '../src/ia/evaluar-v2.js';
import { modeloDePaso, type PasoV2 } from '../src/ia/modelos-v2.js';
import { MAX_LIBRES } from '../src/ia/guion-v2.js';
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

/**
 * `guardia` (los flags de `siguiente`/`cargar`): si este narrador es el piloto VIEJO de un piloto que
 * reusa (ajuste D; los dos se llaman "Naza"), frena salvo `--forzar`: escribirle al viejo por error
 * mezclaría las dos entrevistas.
 */
async function exigirNarrador(ref: string | undefined, guardia?: Args['flags']): Promise<{ n: NarradorFila; estado: EstadoV2 }> {
  if (!ref) throw new Error('Falta el narrador (por ejemplo: naza).');
  const n = await buscarNarrador(ref);
  if (!n) throw new Error(`No encontré a «${ref}». Empezá con: npm run manual-v2 -- empezar ${slug(ref)}`);
  if (guardia && !guardia['forzar']) {
    const { db } = await modulos();
    const { data } = await db.from('narradores').select('id, como_le_dicen, contexto');
    const nuevo = quienLoReusa((data as NarradorFila[] | null) ?? [], n.id);
    if (nuevo) {
      throw new Error(`«${n.como_le_dicen}» (${n.id}) es el piloto viejo: sus respuestas las reusa ${nuevo.como_le_dicen}. Usá ${slug(nuevo.como_le_dicen)} (si de verdad querés este: --forzar).`);
    }
  }
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

/**
 * Cada llamada al modelo queda en `consumo_ia` como el resto del entrevistador (el panel suma el día),
 * con el modelo que de verdad usó ese paso (Sonnet o Haiku: `modeloDePaso`; desde el ajuste C, 24/09,
 * ya no hay ningún paso del esqueleto v2 con Opus).
 */
async function anotarUsos(paso: PasoV2, narradorId: string, usos: Anthropic.Usage[]): Promise<void> {
  const { db, registrarUso, cuentaDeEsteServicio } = await modulos();
  for (const uso of usos) {
    await registrarUso(db, { servicio: 'entrevistador', paso, modelo: modeloDePaso(paso), proveedor: 'anthropic', cuenta: cuentaDeEsteServicio(), narradorId, uso });
  }
}

/** Lo que duraría dicho en voz alta (~150 palabras por minuto): para una respuesta escrita, que no tiene audio. */
const segundosDeTexto = (texto: string) => Math.round(texto.split(/\s+/).filter(Boolean).length / 2.5);

// E20: la ficha puede traer una aclaración ("Naza (así quiere que le digan; ...)"); nombreLimpio
// se queda solo con el nombre para todo lo que se le muestra a la persona o a los dueños.
const nombreDe = (n: NarradorFila, e: EstadoV2) => nombreLimpio(e.perfil.persona.comoLeDicen?.valor ?? n.como_le_dicen);
const marcaEnTexto = (m?: Marca) => (m ? `⚠ MARCADA (${m.control}): ${m.motivo} — salió igual tras ${m.intentos} intentos` : 'pasó los controles');
const comandoDescartar = (n: NarradorFila, id: string, motivo: string) =>
  `npm run manual -- descartar ${slug(n.como_le_dicen)} ${id} --motivo "${motivo}" --si`;
const comandoReprocesar = (n: NarradorFila, orden: number, esRepregunta: boolean) =>
  `npm run manual-v2 -- cargar ${slug(n.como_le_dicen)} --reprocesar --orden ${orden}${esRepregunta ? ' --repregunta' : ''}`;

type Mensaje = { titulo: string; texto: string };
/** Lo que dejó una respuesta procesada: qué se decidió y los textos para la persona (si hay). */
type Procesada = { accion: 'presentacion' | Decision['accion']; mensajes: Mensaje[] };

/** El cierre de cada comando: los textos para la persona, enteros, uno debajo del otro. */
function imprimirParaPegar(mensajes: Mensaje[]): void {
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
  if (!ref) throw new Error('Uso: empezar <narrador> [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires] [--familia email] [--reusar <narrador_id_viejo>]');
  const { db } = await modulos();

  // El piloto que reusa (ajuste D): se valida ANTES de crear nada ni gastar.
  let reusar: EstadoV2['reusar'];
  if (flags['reusar'] !== undefined) {
    const desde = flag(flags, 'reusar');
    if (!desde) throw new Error('--reusar necesita el id del narrador del piloto viejo (--reusar <narrador_id>).');
    opcionesDeReuso(flags);
    const fuente = await buscarNarrador(desde);
    if (!fuente) throw new Error(`No encontré el narrador viejo «${desde}» para reusar sus respuestas.`);
    const viejas = await leerViejas(fuente.id);
    if (!viejas.length) throw new Error(`${fuente.como_le_dicen} (${fuente.id}) no tiene respuestas con texto para reusar.`);
    reusar = { desde: fuente.id, usadas: {} };
    linea(`Reusar: ${viejas.length} respuestas de ${fuente.como_le_dicen} (${fuente.id}). Ese narrador solo se lee: no se toca.`);
  }

  let n = await buscarNarrador(ref);
  if (n && reusar && n.id === reusar.desde) throw new Error('El narrador nuevo no puede ser el mismo del que se reusan las respuestas: usá otro nombre.');

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
    // Los comandos buscan por cómo le dicen: si choca con otro narrador (el piloto viejo también es
    // "Naza"), `siguiente naza` encontraría al viejo. En el piloto que reusa, eso se frena acá.
    const comoLeDicen = flag(flags, 'le-dicen') ?? nombre;
    const tocayo = reusar ? await buscarNarrador(comoLeDicen) : null;
    if (tocayo) {
      throw new Error(`Ya hay un narrador al que le dicen «${tocayo.como_le_dicen}» (${tocayo.id}): los comandos lo confundirían con el nuevo. Poné otro con --le-dicen (por ejemplo --le-dicen "Naza reusa").`);
    }
    const fila = {
      familia_id: (familia as { id: string }).id,
      nombre,
      como_le_dicen: comoLeDicen,
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

  // La fábrica de producción manda el anticipo (una llamada paga + un mail a la familia) a todo
  // narrador 'activo' o 'pausado' con tres respuestas, y su único candado es este archivo en
  // Storage. Se deja puesto desde el día 0: el piloto v2 no es una venta, y ese anticipo saldría
  // con el guion viejo. Si Storage falla, se avisa y se sigue: no puede frenar la entrevista.
  const candado = `${n.id}/paquete/anticipo_enviado.txt`;
  const { error: errCandado } = await db.storage.from('audios').upload(candado, `piloto v2 (${new Date().toISOString()}): sin anticipo de producción`, { contentType: 'text/plain', upsert: true });
  if (errCandado) linea(`⚠ No pude dejar el candado del anticipo (${candado}): ${errCandado.message}. La fábrica de producción va a mandar el anticipo v1 a la 3.ª respuesta.`);
  else linea(`Candado del anticipo de producción puesto (${candado}): la fábrica no le manda el anticipo v1.`);

  // Sin --reusar el estado es el de siempre (sin la clave `reusar`).
  let estado: EstadoV2 = reusar ? { ...estadoNuevo(n.contexto ?? {}, n.zona_horaria), reusar } : estadoNuevo(n.contexto ?? {}, n.zona_horaria);
  const presentacion = proxima(estado.secuencia)!;
  linea(`Castellano: ${estado.perfil.castellano}. Escribiendo la presentación…`);
  const r = await escribirPregunta(cliente(), estado.perfil, presentacion, [], [], evitarDe(n.contexto ?? {}));
  estado = {
    ...sumarGasto(estado, r.usos, 0, modeloDePaso('v2-presentacion')),
    preguntasEnviadas: { '0': r.texto },
    marcas: r.marca ? { '0': r.marca } : {},
    secuencia: avanzar(estado.secuencia, presentacion, 0),
  };
  await guardar(n, estado, { dia_actual: 0, estado: 'pausado' });
  await anotarUsos('v2-presentacion', n.id, r.usos);

  linea(`Intentos: ${r.usos.length} · ${marcaEnTexto(r.marca)} · gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  linea(`Cuando conteste: npm run manual-v2 -- cargar ${slug(n.como_le_dicen)} <audio.ogg>   (o --texto "...")`);
  linea(`La casa de la infancia sale a los pocos minutos aunque no conteste: npm run manual-v2 -- siguiente ${slug(n.como_le_dicen)}`);
  const paso: Paso = { mensajes: [{ titulo: 'Presentación (orden 0)', texto: r.texto }], nueva: { orden: 0, objetivo: presentacion, texto: r.texto } };
  if (!reusar) { imprimirParaPegar(paso.mensajes); return; }
  await seguirReusando(n.id, flags, paso, 0);
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
 * se cortó) y hace lo que haría el día: ficha, guion rearmado, cubiertos; evaluación (salvo la
 * presentación); reserva, tema a dejar, cansancio, "hoy no", "no quiero seguir"; la repregunta si
 * toca. Todo lo que pasa después de guardar la fila va dentro de un try: si algo se cae, dice el
 * comando exacto para retomar (`--reprocesar`).
 */
async function cargar(ref: string | undefined, archivos: string[], flags: Args['flags']): Promise<void> {
  const { n, estado: leido } = await exigirNarrador(ref, flags);
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
    // Una respuesta escrita no tiene duración: con 0 toda respuesta escrita contaría como "corta" y
    // abriría la segunda repregunta de la etapa. Se estima como en la carga con --texto.
    segundos = fila.duracion_segundos ?? segundosDeTexto(respuesta);
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
    segundos = segundosDeTexto(texto);
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
      // E12: con los nombres propios que ya sabe la ficha (Berga, Homero, Tricky…).
      const prompt = promptDeTranscripcion(n.contexto ?? {}, nombreDe(n, estado), n.zona_horaria, estado.perfil);
      const t = await mods.transcribirYActualizar(respuestaId, audioParaTranscribir, prompt, n.id);
      respuesta = t.texto;
      segundos = t.duracionSegundos;
      segundosTranscriptos = t.duracionSegundos;
      linea(`Transcripción (${segundos}s): ${respuesta}`);
      const cruce = pasaPorCandado('audio', esSuyo) ? await deQuienEs(n, respuesta) : null;
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
    const hecho = await procesar(n, estado, { ...abierta, esRepregunta }, filas, respuestaId, respuesta, segundos, segundosTranscriptos, reprocesar);
    if (hecho.accion !== 'presentacion') imprimirParaPegar(hecho.mensajes);
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
): Promise<Procesada> {
  const mods = await modulos();
  const { orden, objetivo, esObjeto, esRepregunta } = abierta;
  let estado = leido;
  const s = slug(n.como_le_dicen);

  // 1. La ficha aprende de la respuesta; si cambió lo que decide el guion (edad, árbol), la secuencia se rearma;
  //    de lo que la ficha dio por contado solo se caen las puertas; lo demás queda nombrado (ajuste E, 25/09).
  const antes = estado.perfil;
  const p = await actualizarPerfil(cliente(), estado.perfil, abierta.texto, respuesta, pendientesParaPerfil(estado.secuencia));
  estado = sumarGasto(estado, [p.usage], 0, modeloDePaso('v2-perfil'));
  await anotarUsos('v2-perfil', n.id, [p.usage]);
  if (!p.ok) linea('⚠ La ficha no se entendió (salida ilegible): queda como estaba.');
  const pendientesAntes = estado.secuencia.pendientes.map((o) => o.id);
  estado = rearmarSiHaceFalta({ ...estado, perfil: p.perfil });
  // El candado de los cubiertos (24/09): un repaso del inicio no cubre nada (salvo puertas), la fila de
  // una persona solo la cubre contestarla, y lo que se rechaza sale de la ficha (`cubrirDesde`).
  // Ajuste E (25/09): solo se tachan puertas; lo demás que pasa el candado queda nombrado y se pregunta igual.
  const cubre = cubrirDesde(estado.secuencia, antes.cubiertos, estado.perfil, objetivo);
  estado = { ...estado, perfil: cubre.perfil, secuencia: cubre.secuencia };
  imprimirCambiosDePerfil(antes, estado, pendientesAntes, cubre);
  const procesada = (e: EstadoV2): EstadoV2 => ({ ...e, procesadas: [...new Set([...e.procesadas, respuestaId])] });

  // 2. La presentación solo alimenta la ficha: no se evalúa ni se repregunta.
  if (objetivo.tipo === 'nucleo' && objetivo.id === 'presentacion' && !esRepregunta) {
    estado = procesada(sumarGasto(estado, [], segundosTranscriptos));
    await guardar(n, estado);
    linea(`Gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
    linea(`Ahora: npm run manual-v2 -- siguiente ${s}`);
    return { accion: 'presentacion', mensajes: [] };
  }

  // 3. La evaluación. A una repregunta o a un objeto solo se le miran los pedidos (reserva, dejar,
  //    hoy no, parar): no se vuelve a repreguntar, así que no se paga una evaluación entera (N29).
  const previas = filas.filter((f) => f.id !== respuestaId);
  let e: EvaluacionV2;
  if (esRepregunta || esObjeto) {
    const r = await evaluarPedidos(cliente(), respuesta);
    estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-pedidos'));
    await anotarUsos('v2-pedidos', n.id, r.usos);
    e = { suficiente: true, falto: [], ...r.pedidos };
    linea(`Pedidos: ${JSON.stringify(r.pedidos)}`);
  } else {
    // E17: la evaluación sabe qué va a pedir la próxima fila del guion, y eso no "falta" acá.
    const r = await evaluarV2(cliente(), estado.perfil, objetivo, abierta.texto, respuesta, segundos, conversacionDe(estado, previas), evitarDe(n.contexto ?? {}), proxima(estado.secuencia));
    estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-evaluar'));
    await anotarUsos('v2-evaluar', n.id, r.usos);
    e = r.evaluacion;
    linea(`Evaluación: ${JSON.stringify(e)}`);
  }

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

  // 5. ¿Repregunta? Una por etapa (más una si la respuesta fue corta y saltó pormenores), cansancio, "hoy no", "no quiero seguir".
  const contestadas = filas.filter((f) => f.es_repregunta).map((f) => f.pregunta_orden).concat(esRepregunta ? [orden] : []);
  // La hecha que se está evaluando: la etapa se cuenta por su bloque (un objeto no tiene, y no se repregunta igual).
  const hecha = esObjeto ? undefined : estado.secuencia.hechas.find((x) => x.orden === orden);
  const decision = decidirTrasEvaluar(e, {
    esRepregunta: esRepregunta || esObjeto,
    yaHayRepregunta: Boolean(estado.repreguntasEnviadas[String(orden)]),
    hoy: hoyEn(n.zona_horaria),
    orden,
    cansancio: hayCansancio(repreguntasParaCansancio(estado, orden, contestadas)),
    sinRepreguntarHasta: estado.sinRepreguntarHasta,
    repreguntasEnEtapa: hecha ? repreguntasEnEtapa(estado, hecha) : 0,
    segundos,
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
    case 'repreguntar': {
      // La escribe el modelo de la pregunta (Sonnet, ajuste C 24/09) con el encargo: lo que faltó, junto, en una sola pregunta; pasa por los controles.
      // La conversación lleva la respuesta de hoy (las `filas` se leyeron antes de guardarla).
      // E17: la repregunta también sabe qué trata la próxima fila, para no pedirlo antes.
      const sig = proxima(estado.secuencia);
      const obj: Objetivo = {
        tipo: 'repregunta', id: `${objetivo.id}-repregunta`, tramo: tramoDe(objetivo), pregunta: abierta.texto, falto: decision.falto,
        ...(sig?.tipo === 'nucleo' ? { proxima: recortarHecha(sig.tema, 160) } : {}),
      };
      // E18: la hora real de la respuesta (con --reprocesar horas después, no es "hace unos minutos").
      const deHoy = { id: respuestaId, pregunta_orden: orden, es_repregunta: false, transcripcion: respuesta, texto_directo: null, recibido_at: recibidoAtDe(filas, respuestaId) };
      const r = await escribirPregunta(cliente(), estado.perfil, obj, conversacionDe(estado, [...previas, deHoy]), yaHechasDe(estado), evitarDe(n.contexto ?? {}), undefined, cuandoContesto(deHoy.recibido_at, n.zona_horaria));
      estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-repregunta'));
      await anotarUsos('v2-repregunta', n.id, r.usos);
      estado = {
        ...estado,
        repreguntasEnviadas: { ...estado.repreguntasEnviadas, [orden]: r.texto },
        marcas: r.marca ? { ...estado.marcas, [`${orden}-repregunta`]: r.marca } : estado.marcas,
      };
      linea(`Repregunta (faltó: ${decision.falto.join('; ')}): ${r.usos.length} intento${r.usos.length === 1 ? '' : 's'} · ${marcaEnTexto(r.marca)}`);
      linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg> --repregunta${orden !== estado.secuencia.hechas.at(-1)?.orden ? ` --orden ${orden}` : ''}`);
      mensajes.push({ titulo: `Repregunta de la orden ${orden}`, texto: r.texto });
      break;
    }
    case 'nada':
      // "Hoy no" al contestar una repregunta o un objeto: no hay pregunta que retomar (la del día ya
      // se contestó), pero "hoy no puedo" no es material del libro: se reserva, como en 'hoyNo'.
      if ((esRepregunta || esObjeto) && e.hoyNo && !(reserva.reservada && !reserva.tramo)) {
        await mods.guardarReserva(respuestaId, { reservada: true, tramo: null });
        linea('Dijo "hoy no": no hay nada que retomar, y esta respuesta quedó reservada: no va al libro.');
      }
      if (decision.sinRepreguntarHasta) {
        estado = { ...estado, sinRepreguntarHasta: decision.sinRepreguntarHasta, cansancioDesdeOrden: decision.cansancioDesdeOrden };
      }
      linea(`Sin repregunta: ${decision.motivo}.`);
      linea(`Ahora: npm run manual-v2 -- siguiente ${s}`);
      break;
  }

  estado = procesada(sumarGasto(estado, [], segundosTranscriptos));
  await guardar(n, estado, {}, evitarNuevo);
  linea(`Gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  return { accion: decision.accion, mensajes };
}

/** Lo que el perfil aprendió hoy, en pocas líneas: para ver si se da cuenta solo de quién es. */
function imprimirCambiosDePerfil(
  antes: EstadoV2['perfil'], estado: EstadoV2, pendientesAntes: string[],
  { rechazados, cubiertos, nombrados }: { rechazados: Rechazado[]; cubiertos: string[]; nombrados: string[] } = { rechazados: [], cubiertos: [], nombrados: [] },
): void {
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
  if (cubiertos.length) cambios.push(`puertas resueltas (no se preguntan): ${cubiertos.join(', ')}`);
  if (nombrados.length) cambios.push(`ya nombrados (se preguntan igual, yendo a lo que falta): ${nombrados.join(', ')}`);
  if (rechazados.length) cambios.push(`cubiertos rechazados (se preguntan igual): ${rechazados.map((r) => `${r.id} (${r.motivo})`).join(', ')}`);
  if (p.hoyFueFuerte) cambios.push('hoy fue fuerte: mañana lo reconoce antes de preguntar');
  if (p.noTuvo.length !== antes.noTuvo.length) cambios.push(`no tuvo: ${p.noTuvo.join(', ')}`);
  const ahora = estado.secuencia.pendientes.map((o) => o.id);
  const entraron = ahora.filter((id) => !pendientesAntes.includes(id));
  const salieron = pendientesAntes.filter((id) => !ahora.includes(id));
  if (entraron.length) cambios.push(`filas que entraron al guion: ${entraron.join(', ')}`);
  if (salieron.length) cambios.push(`filas que salieron del guion: ${salieron.join(', ')}`);
  linea(cambios.length ? `Perfil:\n  ${cambios.join('\n  ')}` : 'Perfil: sin cambios.');
}

/**
 * Lo que dejó un paso de `siguiente`: los textos para pegar y, si se escribió una pregunta nueva, cuál
 * (el piloto que reusa busca para esa) y el objeto que salió con ella (ese lo contesta Naza en vivo).
 */
type Paso = { mensajes: Mensaje[]; nueva?: { orden: number; objetivo: Objetivo; texto: string }; objeto?: Mensaje };

/** `siguiente`: un paso; en el piloto que reusa, además, la búsqueda y el encadenado (`seguirReusando`). */
async function siguiente(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const { estado } = await exigirNarrador(ref, flags);
  if (estado.reusar) opcionesDeReuso(flags); // un --max mal escrito frena antes de gastar
  const paso = await pasoSiguiente(ref, flags);
  if (!estado.reusar) { imprimirParaPegar(paso.mensajes); return; }
  await seguirReusando(ref!, flags, paso, estado.gastoUsd);
}

/**
 * La próxima (§2.5): el biógrafo la elige, la escribe con los controles y la deja como enviada;
 * si se cerró un tramo, pide el objeto como segundo mensaje. Al terminar: el objeto final y la
 * despedida. No imprime los textos para pegar: los devuelve (los imprime quien llama, al final).
 */
async function pasoSiguiente(ref: string | undefined, flags: Args['flags']): Promise<Paso> {
  const { n, estado: leido } = await exigirNarrador(ref);
  let estado = leido;
  const s = slug(n.como_le_dicen);

  if (estado.terminada) { linea(`${n.como_le_dicen} ya terminó la entrevista (${estado.terminada}). Mirá: npm run manual-v2 -- estado ${s}`); return { mensajes: [] }; }
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
    return { mensajes: [{ titulo: `Pregunta ${que.orden} (la misma)`, texto: que.texto }] };
  }
  if (que.tipo === 'falta-respuesta') {
    throw new Error(
      `La orden ${que.orden} todavía no tiene respuesta cargada: cargala primero (npm run manual-v2 -- cargar ${s} <audio.ogg>). ` +
      'Si de verdad querés pasar a la próxima sin respuesta: --saltar.',
    );
  }

  const conversacion = conversacionDe(estado, filas);
  // E18: cuándo llegó la última respuesta, en su zona (se pueden pedir varias preguntas por día).
  const cuando = cuandoContesto(ultimaRespuestaAt(estado, filas), n.zona_horaria);
  const yaHechas = yaHechasDe(estado);
  const evitar = evitarDe(n.contexto ?? {});
  const sinFotos = Boolean(n.contexto?.sinFotos);
  const nombre = nombreDe(n, estado);
  const mensajes: { titulo: string; texto: string }[] = [];

  /** El objeto (§2.5): lo escribe el mismo cerebro, y va con su orden 101+ al lado de las preguntas. */
  const pedirObjeto = async (tramo: Tramo, final: boolean, hechasHasta: YaHecha[]) => {
    const obj: Objetivo = objetoDe({ tramo, final });
    const r = await escribirPregunta(cliente(), estado.perfil, obj, conversacion, hechasHasta, evitar, undefined, cuando);
    estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-objeto'));
    await anotarUsos('v2-objeto', n.id, r.usos);
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

  // Si la última que se mandó cerró su etapa, y su respuesta ya pasó por la ficha, va una libre: lo
  // que nombró y no contó de esa etapa (un "[etapa] …" de noSabemos), incluido lo de esa última
  // respuesta. Se elige acá y no al mandar la última fila, que todavía no tenía respuesta. Una sola
  // por etapa (`agregarLibre` rechaza la segunda), hasta MAX_LIBRES y sin pasar el techo.
  const ultimaHecha = estado.secuencia.hechas.at(-1);
  const cerrado = ultimaHecha ? etapaCerrada(estado.secuencia, ultimaHecha.objetivo) : null;
  if (cerrado) {
    const { secuencia, libre } = agregarLibre(estado.secuencia, estado.perfil, cerrado);
    estado = { ...estado, secuencia };
    linea(libre ? `Se cerró ${cerrado}: va una pregunta libre (${libre.id}: ${libre.anclas[0]}).` : `Se cerró ${cerrado}: sin pregunta libre (nada nombrado sin contar, ya hay una, ya hay ${MAX_LIBRES} o se llegó al techo).`);
  }

  const sig = proxima(estado.secuencia);
  if (!sig) {
    const tramo = tocaObjeto(estado.secuencia, null, sinFotos);
    if (tramo) mensajes.push({ titulo: 'Objeto final', texto: await pedirObjeto(tramo, true, yaHechas) });
    mensajes.push({ titulo: 'Despedida', texto: despedidaV2(nombre, estado.perfil) });
    estado = { ...estado, terminada: hoyEn(n.zona_horaria) };
    // Sigue 'pausado' en la base a propósito: 'completado' dispararía la fábrica de producción.
    await guardar(n, estado, { estado: 'pausado' });
    titulo(`${n.como_le_dicen} terminó: ${estado.secuencia.hechas.length - 1} preguntas (queda 'pausado' en la base; terminada en contexto.v2)`);
    linea(`El libro: cd ../fabrica && npx tsx --env-file=.env scripts/prueba-reparto.ts ${n.id} --salida prueba-libro-${s}`);
    linea(`Gasto de la entrevista: USD ${estado.gastoUsd.toFixed(3)}`);
    return { mensajes };
  }

  // El objeto se decide ANTES de avanzar: mira si el tramo de lo ya hecho se cerró.
  const tramoObjeto = tocaObjeto(estado.secuencia, sig, sinFotos);
  const orden = estado.secuencia.hechas.length;
  titulo(`Pregunta ${orden} para ${n.como_le_dicen} — ${sig.id}${sig.tipo === 'variable' ? ` (${sig.tramo}, ${sig.desde}-${sig.hasta} años)` : ''}`);
  // Ajuste E: si la fila ya se nombró en otra respuesta, el objetivo lo dice (no repetir; ir a lo que falta).
  const r = await escribirPregunta(cliente(), estado.perfil, conNombrado(estado.secuencia, sig), conversacion, yaHechas, evitar, undefined, cuando);
  estado = sumarGasto(estado, r.usos, 0, modeloDePaso('v2-pregunta'));
  await anotarUsos('v2-pregunta', n.id, r.usos);
  estado = {
    ...estado,
    preguntasEnviadas: { ...estado.preguntasEnviadas, [orden]: r.texto },
    marcas: r.marca ? { ...estado.marcas, [orden]: r.marca } : estado.marcas,
    secuencia: avanzar(estado.secuencia, sig, orden),
  };
  linea(`Intentos: ${r.usos.length} · ${marcaEnTexto(r.marca)}`);
  mensajes.push({ titulo: `Pregunta ${orden}`, texto: r.texto });

  let objeto: Mensaje | undefined;
  if (tramoObjeto) {
    const hechaHoy: YaHecha = { id: sig.id, tema: sig.tipo === 'nucleo' ? sig.tema : sig.id };
    objeto = { titulo: 'Segundo mensaje: el objeto', texto: await pedirObjeto(tramoObjeto, false, [...yaHechas, hechaHoy]) };
    mensajes.push(objeto);
  }

  await guardar(n, estado, { dia_actual: orden });
  const quedan = estado.secuencia.pendientes.length;
  linea(`Quedan ${quedan} pendiente${quedan === 1 ? '' : 's'} · gasto acumulado: USD ${estado.gastoUsd.toFixed(3)}`);
  linea(`Cuando conteste: npm run manual-v2 -- cargar ${s} <audio.ogg>   (o --texto "...")`);
  return { mensajes, nueva: { orden, objetivo: sig, texto: r.texto }, objeto };
}

// ── 5. El piloto que reusa respuestas viejas (ajuste D, 24/09) ──────────────

/**
 * Después de escribir una pregunta: si es de las que se buscan (presentación, núcleo, libre), busca
 * entre las respuestas viejas una que ya la conteste; si hay, la carga y la procesa y (con
 * `--seguido`, el default) escribe la próxima y vuelve a buscar. Frena en la primera que tenga que
 * contestar Naza en vivo: sin coincidencia, una repregunta, un objeto, "hoy no" / "no quiero seguir",
 * el final, o `--max` preguntas escritas en esta corrida. Los textos para pegar van al final, enteros.
 */
async function seguirReusando(ref: string, flags: Args['flags'], primero: Paso, gastoInicial: number): Promise<void> {
  const { seguido, max } = opcionesDeReuso(flags);
  const { n, estado: inicial } = await exigirNarrador(ref);
  const s = slug(n.como_le_dicen);
  const viejas = await leerViejas(inicial.reusar!.desde);
  const alFinal: Mensaje[] = [];
  let paso = primero;
  let pasos = 1;
  let reusadas = 0;

  try {
    for (;;) {
      const nueva = paso.nueva;
      // Terminó, un "hoy no" que se retoma, o algo que no se busca: se imprime tal cual.
      if (!nueva || !seBusca(nueva.objetivo)) { alFinal.push(...paso.mensajes); break; }

      const { n: fila, estado } = await exigirNarrador(ref);
      const candidatas = candidatasPara(viejas, estado.reusar?.usadas ?? {});
      const b = await buscarReusable(cliente(), nueva.objetivo, nueva.texto, candidatas);
      if (b.usos.length) {
        await guardar(fila, sumarGasto(estado, b.usos, 0, modeloDePaso('v2-reusar')));
        await anotarUsos('v2-reusar', fila.id, b.usos);
      }
      const vieja = b.corto ? candidatas.find((c) => c.corto === b.corto) : undefined;
      if (!vieja) {
        linea(`Sin respuesta vieja para la pregunta ${nueva.orden}${b.motivo ? ` (${b.motivo})` : ''}: esta la contestás vos.`);
        alFinal.push(...paso.mensajes);
        break;
      }

      const hecho = await cargarReusada(ref, vieja, nueva.orden, b.cubre);
      reusadas++;
      if (paso.objeto) alFinal.push(paso.objeto);
      alFinal.push(...hecho.mensajes);
      // Repregunta, "hoy no", "no quiero seguir": los ve Naza (a una repregunta no se le busca respuesta vieja).
      if (hecho.accion !== 'nada' && hecho.accion !== 'presentacion') break;
      if (paso.objeto) { linea(`Salió un objeto con la pregunta ${nueva.orden}: ese lo contestás vos. Después: npm run manual-v2 -- siguiente ${s}`); break; }
      if (!seguido) { linea(`Para seguir: npm run manual-v2 -- siguiente ${s}`); break; }
      if (pasos >= max) { linea(`Llegué a --max ${max} en esta corrida. Para seguir: npm run manual-v2 -- siguiente ${s}`); break; }
      paso = await pasoSiguiente(ref, {});
      pasos++;
    }
  } finally {
    // Aunque un paso se caiga, se ve cuánto se reusó y cuánto se gastó en esta corrida.
    const { estado: fin } = await exigirNarrador(ref);
    titulo(`Esta corrida: reusé ${reusadas} · gasto de la corrida USD ${(fin.gastoUsd - gastoInicial).toFixed(3)} · acumulado USD ${fin.gastoUsd.toFixed(3)}`);
  }
  imprimirParaPegar(alFinal);
}

/** Las respuestas del piloto viejo que se pueden reusar (solo lectura: `select` y nada más; sin lo reservado). */
async function leerViejas(desde: string): Promise<Vieja[]> {
  const { db } = await modulos();
  return viejasDe(await leerViejasDeBase(db, desde));
}

/**
 * Carga una respuesta vieja en la pregunta `orden` por el MISMO camino que `cargar --texto` (fila con
 * `texto_directo` y `transcripcion`, duración estimada por palabras) y la procesa entera. Anota la
 * usada ANTES de procesar: si algo se corta, no se vuelve a usar y se retoma con `--reprocesar`.
 * No pasa por el candado de audio cruzado (`pasaPorCandado('reusada')`, en `src/manual/reusar-v2.ts`).
 */
async function cargarReusada(ref: string, vieja: Vieja, orden: number, cubre: string): Promise<Procesada> {
  const { n, estado: leido } = await exigirNarrador(ref);
  const mods = await modulos();
  const abierta = preguntaParaCargar(leido, orden, false);
  if ('error' in abierta) throw new Error(abierta.error);
  const filas = await respuestasDe(n.id);
  if (filas.some((f) => f.pregunta_orden === orden && !f.es_repregunta)) throw new Error(`La orden ${orden} ya tiene respuesta: no reuso encima.`);

  const texto = vieja.respuesta;
  // La usada se anota ANTES de insertar: si se corta entre una cosa y la otra, a lo sumo se pierde
  // una candidata (nunca se ofrece dos veces la misma).
  const reusar = leido.reusar!;
  const estado: EstadoV2 = { ...leido, reusar: { ...reusar, usadas: { ...reusar.usadas, [String(orden)]: vieja.id } } };
  await guardar(n, estado);
  const { data, error } = await mods.db.from('respuestas')
    .insert({ narrador_id: n.id, pregunta_orden: orden, texto_directo: texto, transcripcion: texto, es_repregunta: false })
    .select('id').single();
  if (error) throw new Error(`No pude insertar la respuesta reusada: ${error.message}`);
  const respuestaId = (data as { id: string }).id;

  titulo(`${n.como_le_dicen}, orden ${orden} — ${abierta.objetivo.id} (reusada, cubre: ${cubre})`);
  linea(`Pregunta: ${abierta.texto}`);
  linea(lineaReusada(vieja));
  const segundos = segundosDeTexto(texto);
  linea(`Respuesta reusada (${segundos}s estimados si la hubiera dicho): ${texto}`);
  // La excepción explícita al candado: `pasaPorCandado('reusada')` es false (es texto suyo, del piloto
  // viejo; contra ese narrador daría "ya está cargado en otro" siempre). Si algún día cambiara, frena acá.
  const cruce = pasaPorCandado('reusada') ? await deQuienEs(n, texto) : null;
  if (cruce) throw new Error(`La respuesta reusada figura en ${cruce.quien}, orden ${cruce.orden}: frené (id ${respuestaId}).`);
  try {
    return await procesar(n, estado, { ...abierta, esRepregunta: false }, filas, respuestaId, texto, segundos, 0, false);
  } catch (err) {
    console.error(`\n✖ La respuesta reusada quedó guardada (id ${respuestaId}) pero se cortó antes de terminar.`);
    console.error(`  Cuando se arregle, retomala con: ${comandoReprocesar(n, orden, false)}`);
    throw err;
  }
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
  titulo(`Se cayeron (${sec.caidas.length})`);
  for (const c of sec.caidas) linea(`  ${c.id} — ${c.motivo}`);
  linea(`  libres agregadas: ${sec.libres} de ${MAX_LIBRES}`);
  titulo('Lo demás');
  linea(`  cubiertos (se cayeron): ${sec.cubiertos.length ? sec.cubiertos.join(', ') : 'ninguno'}`);
  const nombrados = Object.entries(sec.nombrados ?? {});
  linea(`  ya nombrados (se preguntan igual): ${nombrados.length ? nombrados.map(([id, desde]) => `${id} (en ${desde})`).join(', ') : 'ninguno'}`);
  linea(`  objetos: ${sec.objetos.length ? sec.objetos.map((o) => `${o.orden} ${o.tramo}${o.final ? ' (final)' : ''}`).join(' · ') : 'ninguno'}`);
  const marcas = Object.entries(estado.marcas);
  linea(`  marcas: ${marcas.length ? '' : 'ninguna'}`);
  for (const [orden, m] of marcas) linea(`    ${orden}: ${m.control} — ${m.motivo} (${m.intentos} intentos)`);
  if (estado.sinRepreguntarHasta) linea(`  sin repreguntar hasta: ${estado.sinRepreguntarHasta} (cansancio)`);
  if (estado.retomar !== undefined) linea(`  "hoy no": se retoma la orden ${estado.retomar}`);
  if (estado.bloqueadas.length) linea(`  frenadas por el candado de audio cruzado: ${estado.bloqueadas.join(', ')}`);
  if (n.contexto?.evitar) linea(`  temas a evitar: ${String(n.contexto.evitar).replace(/\n/g, ' · ')}`);
  if (estado.reusar) {
    const total = (await leerViejas(estado.reusar.desde)).length;
    for (const l of reusadasEnTexto(estado.reusar, total, sec.hechas)) linea(`  ${l}`);
  }
  linea();
}

/**
 * `descubrir <narrador> <id> [<id> ...]`: devuelve al guion filas que la ficha dio por contadas por
 * error (24/09: un repaso del inicio que "cubrió" a-los-quince, estudios y oficio). Sin modelo: saca
 * los ids de los cubiertos (secuencia y ficha), rearma la secuencia (cada fila en su lugar, sin
 * duplicar, sin las hechas, con el techo), guarda e imprime cómo quedan las pendientes.
 */
async function descubrirFilas(ref: string | undefined, ids: string[], flags: Args['flags']): Promise<void> {
  if (!ref || !ids.length) throw new Error('Uso: descubrir <narrador> <id> [<id> ...]   (los ids, como los muestra "estado")');
  const { n, estado } = await exigirNarrador(ref, flags);
  const r = descubrir(estado.secuencia, estado.perfil, ids);
  if ('error' in r) throw new Error(`No descubrí nada: ${r.error}`);
  await guardar(n, { ...estado, secuencia: r.secuencia, perfil: r.perfil });
  const pendientes = r.secuencia.pendientes.map((o) => o.id);
  const noVolvieron = ids.filter((id) => !pendientes.includes(id));
  titulo(`${n.como_le_dicen}: vuelven al guion ${ids.join(', ')}`);
  if (noVolvieron.length) linea(`⚠ No entraron (el techo o el guion de hoy no las tienen): ${noVolvieron.join(', ')}`);
  linea(`Cubiertos que quedan: ${r.secuencia.cubiertos.length ? r.secuencia.cubiertos.join(', ') : 'ninguno'}`);
  const nombrados = Object.keys(r.secuencia.nombrados);
  linea(`Nombrados que quedan: ${nombrados.length ? nombrados.join(', ') : 'ninguno'}`);
  linea(`Pendientes (${pendientes.length}), en orden:`);
  pendientes.forEach((id, i) => linea(`  ${String(i + 1).padStart(2)}. ${id}${ids.includes(id) ? '   ← volvió' : ''}`));
}

function ayuda(): void {
  linea(`
Puerta manual v2 — la entrevista con el cerebro nuevo (nada sale por WhatsApp: se imprime para pegar)

  npm run manual-v2 -- empezar naza [--nombre "Naza"] [--zona America/Argentina/Buenos_Aires] [--familia email]
  npm run manual-v2 -- cargar naza <audio.ogg> [<otro.ogg> ...] [--repregunta] [--orden N] [--es-suyo]
  npm run manual-v2 -- cargar naza --texto "lo que escribió" [--repregunta] [--orden N]
  npm run manual-v2 -- cargar naza --reprocesar [--repregunta] [--orden N] [--es-suyo]
  npm run manual-v2 -- siguiente naza [--saltar] [--reanudar] [--seguido no] [--max 8]
  npm run manual-v2 -- estado naza
  npm run manual-v2 -- descubrir naza <id> [<id> ...]   (devuelve al guion filas cubiertas por error, o las saca de los nombrados; sin modelo)

  Piloto que reusa respuestas viejas (ajuste D):
  npm run manual-v2 -- empezar naza-reusa --nombre "Naza" --le-dicen "Naza reusa" --reusar <narrador_id_viejo>

  · Varios audios para una misma respuesta: se pegan con ffmpeg en uno solo.
  · Lo que cuente de un objeto (órdenes 101+): cargar ... --orden 101.
  · --reprocesar: si una carga se cortó (se cayó el modelo), retoma la que quedó guardada.
  · --saltar pasa a la próxima sin respuesta procesada; NO saltea un "hoy no" (se espera la
    respuesta a la misma) ni una respuesta frenada por el candado de audio cruzado.
  · En el piloto VIEJO de uno que reusa, siguiente y cargar frenan (--forzar si de verdad es ese).
  · Con --reusar, cada pregunta nueva (presentación, núcleo o libre) se busca entre las respuestas
    viejas; si una la contesta, se carga sola y se sigue con la próxima (--seguido no: de a una;
    --max N: hasta N preguntas por corrida, 8 si no se dice). Repreguntas y objetos: siempre vos.
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
  descubrir: (a) => descubrirFilas(a.posicionales[0], a.posicionales.slice(1), a.flags),
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
