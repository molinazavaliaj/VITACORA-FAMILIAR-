/**
 * LA PUERTA MANUAL — cómo entrarle al entrevistador mientras Meta no habilita
 * la API de WhatsApp.
 *
 * El entrevistador tiene UNA sola puerta de entrada: el webhook de Meta
 * (`webhook.ts` → `procesar.ts` → `media.ts` baja el audio por `mediaId`).
 * Mientras eso no exista, las preguntas salen a mano desde el WhatsApp de Naza
 * y los audios vuelven a mano. Este script hace con un ARCHIVO DEL DISCO
 * exactamente lo mismo que el webhook hace con un `mediaId`, reutilizando las
 * funciones ya testeadas del módulo:
 *
 *   archivo .ogg → Storage (`{id}/dia_NN.ogg`) → fila en `respuestas` →
 *   Whisper → evaluación (¿hace falta repregunta?) → avance de `dia_actual` →
 *   adaptativas al responder la última del guion → cierre al responder la última
 *   que existe (despedida impresa + 'completado', sin correr `cerrar`).
 *
 * NO manda nada por WhatsApp (no hay API): todo lo que habría salido por
 * WhatsApp se IMPRIME para copiar y pegar. Los `envios` se registran igual,
 * con `wa_message_id = 'manual'`, para que la lógica del módulo (repreguntas,
 * idempotencia del scheduler) siga viendo la misma foto.
 *
 * Uso:
 *   npm run manual -- estado
 *   npm run manual -- bienvenida ciro --de "Naza"       (la presentación, antes de la pregunta 1)
 *   npm run manual -- siguiente imma                     (--solo-ver para no anotar; --voz para el mp3)
 *   npm run manual -- archivar imma "C:/Users/Naza/Downloads/PTT-20260914-WA0007.ogg"
 *   npm run manual -- cargar imma audios-crudos/imma/dia_03.ogg   (varios archivos = una respuesta, se pegan con ffmpeg)
 *   npm run manual -- evaluar imma --orden 7                       (reintenta solo la evaluación)
 *   npm run manual -- cargar-carpeta imma audios-crudos/imma [--si]
 *   npm run manual -- cerrar imma
 *   npm run manual -- crear --nombre Ciro --le-dicen Ciro --telefono +54... --zona America/Argentina/Buenos_Aires
 */
import { readFileSync, existsSync, statSync, mkdirSync, copyFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Narrador } from '../src/flujo/preguntar.js';
import {
  parsearArgs, slug, ordenDeArchivo, archivoCanonico, proximoOrden, primeraDiferencia,
  mensajeDePregunta, despedida, bienvenida, planDeCarga, esAudio, promptDeTranscripcion, type Args,
  motivoParaRechazarAudio, listaParaConcatenar, valorDelArbol, queHacerAlFinal,
} from '../src/manual/puro.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, '..', '..');
const CRUDOS = resolve(REPO, 'audios-crudos');

// ── 1. Entorno ─────────────────────────────────────────────────────────────
// config.ts lee process.env al importarse, así que todo esto tiene que pasar
// antes del primer import del módulo (por eso los imports de abajo son dinámicos).
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

// ── 2. Los módulos reales del entrevistador ────────────────────────────────
type Modulos = {
  db: (typeof import('../src/db/cliente.js'))['db'];
  guardarRespuestaAudio: (typeof import('../src/db/respuestas.js'))['guardarRespuestaAudio'];
  guardarReserva: (typeof import('../src/db/respuestas.js'))['guardarReserva'];
  guardarTemaDeOtraParte: (typeof import('../src/db/respuestas.js'))['guardarTemaDeOtraParte'];
  transcribirYActualizar: (typeof import('../src/ia/transcribir.js'))['transcribirYActualizar'];
  evaluarRespuesta: (typeof import('../src/ia/cerebro.js'))['evaluarRespuesta'];
  reservaDe: (typeof import('../src/ia/cerebro.js'))['reservaDe'];
  temaDe: (typeof import('../src/ia/cerebro.js'))['temaDe'];
  detectarReservaYDejarTema: (typeof import('../src/ia/cerebro.js'))['detectarReservaYDejarTema'];
  sumarTemaEvitado: (typeof import('../src/ia/evitar.js'))['sumarTemaEvitado'];
  textoEvitar: (typeof import('../src/ia/evitar.js'))['textoEvitar'];
  generarPreguntaReemplazo: (typeof import('../src/ia/cerebro.js'))['generarPreguntaReemplazo'];
  personalizarPregunta: (typeof import('../src/ia/personalizar.js'))['personalizarPregunta'];
  memoriaDeCapitulos: (typeof import('../src/ia/resumenes.js'))['memoriaDeCapitulos'];
  guardarRepreguntaEnviada: (typeof import('../src/db/envios.js'))['guardarRepreguntaEnviada'];
  generarPreguntasAdaptativas: (typeof import('../src/ia/adaptativas.js'))['generarPreguntasAdaptativas'];
  generarAudioVoz: (typeof import('../src/ia/voz.js'))['generarAudioVoz'];
  tratoDe: (typeof import('../src/ia/trato.js'))['tratoDe'];
  preguntaDeOrden: (typeof import('../src/flujo/preguntar.js'))['preguntaDeOrden'];
  capituloNoAplica: (typeof import('../src/flujo/preguntar.js'))['capituloNoAplica'];
  esModoRapido: (typeof import('../src/flujo/preguntar.js'))['esModoRapido'];
  armarHistoria: (typeof import('../src/db/historia.js'))['armarHistoria'];
  ultimoOrden: (typeof import('../src/db/guion.js'))['ultimoOrden'];
  tieneAdaptativas: (typeof import('../src/db/guion.js'))['tieneAdaptativas'];
  capitulosDe: (typeof import('../src/db/guion.js'))['capitulosDe'];
  preguntasHechasAntes: (typeof import('../src/db/guion.js'))['preguntasHechasAntes'];
};

let _mods: Promise<Modulos> | null = null;
function modulos(): Promise<Modulos> {
  _mods ??= (async () => {
    const { db } = await import('../src/db/cliente.js');
    const { guardarRespuestaAudio, guardarReserva, guardarTemaDeOtraParte } = await import('../src/db/respuestas.js');
    const { transcribirYActualizar } = await import('../src/ia/transcribir.js');
    const { evaluarRespuesta, generarPreguntaReemplazo, reservaDe, temaDe, detectarReservaYDejarTema } = await import('../src/ia/cerebro.js');
    const { sumarTemaEvitado, textoEvitar } = await import('../src/ia/evitar.js');
    const { personalizarPregunta } = await import('../src/ia/personalizar.js');
    const { memoriaDeCapitulos } = await import('../src/ia/resumenes.js');
    const { guardarRepreguntaEnviada } = await import('../src/db/envios.js');
    const { generarPreguntasAdaptativas } = await import('../src/ia/adaptativas.js');
    const { generarAudioVoz } = await import('../src/ia/voz.js');
    const { tratoDe } = await import('../src/ia/trato.js');
    const { preguntaDeOrden, capituloNoAplica, esModoRapido } = await import('../src/flujo/preguntar.js');
    const { armarHistoria } = await import('../src/db/historia.js');
    const { ultimoOrden, tieneAdaptativas, capitulosDe, preguntasHechasAntes } = await import('../src/db/guion.js');
    return {
      db, guardarRespuestaAudio, guardarReserva, guardarTemaDeOtraParte, transcribirYActualizar, evaluarRespuesta, reservaDe, temaDe, detectarReservaYDejarTema, sumarTemaEvitado, textoEvitar,
      personalizarPregunta, memoriaDeCapitulos, guardarRepreguntaEnviada, generarPreguntaReemplazo, generarPreguntasAdaptativas,
      generarAudioVoz, preguntaDeOrden, capituloNoAplica, esModoRapido, armarHistoria, tratoDe, ultimoOrden, tieneAdaptativas, capitulosDe, preguntasHechasAntes,
    };
  })();
  return _mods;
}

// ── 3. Tipos y consultas cortas ────────────────────────────────────────────
type NarradorFila = Narrador & { nombre: string };

type RespuestaFila = {
  id: string;
  pregunta_orden: number;
  audio_path: string | null;
  transcripcion: string | null;
  texto_directo: string | null;
  es_repregunta: boolean;
  duracion_segundos: number | null;
  recibido_at: string;
};

async function narradores(): Promise<NarradorFila[]> {
  const { db } = await modulos();
  const { data } = await db.from('narradores').select('*').order('created_at');
  return (data as NarradorFila[] | null) ?? [];
}

async function buscarNarrador(ref: string | undefined): Promise<NarradorFila> {
  const todos = await narradores();
  if (!ref) throw new Error(`Falta el narrador. Los que hay: ${todos.map((n) => n.como_le_dicen).join(', ')}`);
  const s = slug(ref);
  const elegido =
    todos.find((n) => n.id === ref) ??
    todos.find((n) => slug(n.como_le_dicen) === s) ??
    todos.find((n) => slug(n.nombre) === s);
  if (elegido) return elegido;
  const parciales = todos.filter((n) => slug(n.nombre).startsWith(s) || slug(n.como_le_dicen).startsWith(s));
  if (parciales.length === 1) return parciales[0];
  if (parciales.length > 1) throw new Error(`«${ref}» no es único: ${parciales.map((n) => n.como_le_dicen).join(', ')}`);
  throw new Error(`No encontré a «${ref}». Los narradores son: ${todos.map((n) => n.como_le_dicen).join(', ')}`);
}

async function respuestasDe(narradorId: string): Promise<RespuestaFila[]> {
  const { db } = await modulos();
  const { data } = await db.from('respuestas').select('*')
    .eq('narrador_id', narradorId).order('pregunta_orden');
  return (data as RespuestaFila[] | null) ?? [];
}

/**
 * La última orden del guion de este narrador: la misma regla que el camino de
 * WhatsApp (`src/db/guion.ts`). Hasta el 20/09 miraba `preguntas` con un `.or()`
 * que mezclaba la plantilla con lo propio (bitácora 28: si la familia sacaba
 * una fija, "la última" seguía siendo la de la plantilla).
 */
async function ultimaOrdenDelGuion(narradorId: string): Promise<number> {
  const { ultimoOrden } = await modulos();
  return ultimoOrden(narradorId);
}

/**
 * Bitácora 28: las 4 adaptativas van después de la última que exista (la 26 o
 * la que sea). Si todavía no están y ya se respondió esa última, se generan acá
 * —tanto al cargar la respuesta como al pedir `siguiente`, así un fallo del
 * modelo en el primer intento no deja la entrevista terminada en 26. La función
 * es idempotente y no lanza. Devuelve la nueva última orden.
 */
async function asegurarAdaptativas(n: NarradorFila, ultimaRespondida: number): Promise<number> {
  const mods = await modulos();
  const ultima = await ultimaOrdenDelGuion(n.id);
  if (ultima === 0 || ultimaRespondida < ultima || (await mods.tieneAdaptativas(n.id))) return ultima;
  linea(`Orden ${ultima} respondida (la última del guion) → generando las 4 preguntas a medida (una llamada, ~USD 0.5)...`);
  await mods.generarPreguntasAdaptativas(n.id);
  const nueva = await ultimaOrdenDelGuion(n.id);
  linea(nueva > ultima
    ? `Listas: órdenes ${ultima + 1}-${nueva}. Las ves con "npm run manual -- siguiente".`
    : '⚠ El modelo no devolvió las 4: la entrevista sigue; volvé a correr "siguiente" y se reintentan.');
  return nueva;
}

/**
 * Guarda en `contexto.preguntasEnviadas[orden]` el texto que de verdad recibió el
 * narrador (bitácora 25): el panel y el libro muestran eso, y `cargar` evalúa
 * contra eso. Es el mismo lugar donde lo deja `personalizarPregunta`.
 */
async function recordarPreguntaEnviada(n: NarradorFila, orden: number, texto: string): Promise<void> {
  const { db } = await modulos();
  const contexto = { ...(n.contexto ?? {}), preguntasEnviadas: { ...(n.contexto?.preguntasEnviadas ?? {}), [orden]: texto } };
  const { error } = await db.from('narradores').update({ contexto }).eq('id', n.id);
  if (error) throw new Error(`No pude anotar la pregunta enviada: ${error.message}`);
  n.contexto = contexto;
}

/** La pregunta tal como se le mandó (personalizada o corregida a mano) si la tenemos; si no, la del guion. */
function textoDePreguntaEnviada(n: NarradorFila, orden: number, delGuion: string): string {
  const enviada = (n.contexto?.preguntasEnviadas ?? {})[String(orden)];
  return typeof enviada === 'string' && enviada.trim() ? enviada : delGuion;
}

/** ¿Ya se le anotó una repregunta a este narrador para esta pregunta? */
async function yaSeRepregunto(narradorId: string, orden: number): Promise<boolean> {
  const { db } = await modulos();
  const { data } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'repregunta').eq('pregunta_orden', orden).limit(1);
  return (data?.length ?? 0) > 0;
}

async function registrarEnvio(narradorId: string, tipo: string, orden?: number): Promise<void> {
  const { db } = await modulos();
  const { error } = await db.from('envios').insert({
    narrador_id: narradorId, tipo, pregunta_orden: orden ?? null, wa_message_id: 'manual',
  });
  if (error) throw new Error(`No pude registrar el envío '${tipo}': ${error.message}`);
}

/** Órdenes que ya tienen respuesta principal (las repreguntas no cuentan). */
function ordenesRespondidas(respuestas: RespuestaFila[]): number[] {
  return respuestas.filter((r) => !r.es_repregunta).map((r) => r.pregunta_orden);
}

function resolverRuta(archivo: string): string {
  // Deduplicado: con una ruta absoluta las cuatro variantes son la misma y el
  // mensaje de error quedaba repitiendo el path cuatro veces.
  const candidatos = [...new Set([
    resolve(archivo), resolve(REPO, archivo), resolve(CRUDOS, archivo), resolve(process.cwd(), archivo),
  ])];
  for (const c of candidatos) if (existsSync(c) && statSync(c).isFile()) return c;
  throw new Error(`No encontré el archivo «${archivo}». Lo busqué en:\n  ${candidatos.join('\n  ')}`);
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const linea = (t = '') => console.log(t);
const titulo = (t: string) => { linea(); linea(`── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}`); };
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

// ── 4. Comandos ────────────────────────────────────────────────────────────

async function estado(): Promise<void> {
  const todos = await narradores();
  linea();
  linea('Vitácora Familiar — puerta manual (sin API de WhatsApp)');
  linea(`Base: ${(process.env.SUPABASE_URL ?? '').replace('https://', '').replace('.supabase.co', '')}   ·   audios: ${CRUDOS}`);

  const enMarcha = todos.filter((n) => ['acepto', 'activo', 'pausado', 'completado', 'cerrado_anticipado'].includes(n.estado));
  const sinPagar = todos.filter((n) => n.estado === 'pendiente_pago');

  titulo(`En marcha (${enMarcha.length})`);
  if (!enMarcha.length) linea('  (ninguno todavía)');
  for (const n of enMarcha) {
    const respuestas = await respuestasDe(n.id);
    const principales = respuestas.filter((r) => !r.es_repregunta);
    const conAudio = respuestas.filter((r) => r.audio_path).length;
    const orden = proximoOrden(n.dia_actual, ordenesRespondidas(respuestas));
    const ultima = await ultimaOrdenDelGuion(n.id);
    linea();
    linea(`  ${n.como_le_dicen}  (${n.nombre})   estado: ${n.estado}`);
    linea(`     guion: ${ultima} preguntas   ·   orden vigente en la base: ${n.dia_actual}   ·   respuestas: ${principales.length} (${conAudio} con audio)`);
    if (respuestas.length) {
      const ultimaResp = respuestas[respuestas.length - 1];
      linea(`     última: orden ${ultimaResp.pregunta_orden} — ${fechaCorta(ultimaResp.recibido_at)}`);
    }
    linea(orden > ultima
      ? (n.estado === 'completado'
          ? '     → cerrado: 30 de 30. La fábrica ya lo puede tomar.'
          : `     → ya respondió todo: corré "npm run manual -- cerrar ${slug(n.como_le_dicen)}"`)
      : `     → siguiente: orden ${orden} — "npm run manual -- siguiente ${slug(n.como_le_dicen)}"`);
    const pendientesRepregunta = new Set(respuestas.filter((r) => r.es_repregunta).map((r) => r.pregunta_orden));
    const sinRepregunta = principales.filter((r) => !pendientesRepregunta.has(r.pregunta_orden) && (r.duracion_segundos ?? 0) < 40 && (r.transcripcion ?? '').split(/\s+/).length < 120);
    if (sinRepregunta.length) {
      linea(`     ⚠ respuestas cortas sin repregunta anotada: órdenes ${sinRepregunta.map((r) => r.pregunta_orden).join(', ')}`);
    }
  }

  const invitados = todos.filter((n) => n.estado === 'invitado');
  titulo(`Sin arrancar (invitado: les falta el SÍ, o los arrancás a mano) (${invitados.length})`);
  if (!invitados.length) linea('  (ninguno)');
  for (const n of invitados) linea(`  ${n.como_le_dicen}  (${n.nombre})   ${n.telefono_whatsapp}`);

  titulo(`Esperando pago (${sinPagar.length})`);
  for (const n of sinPagar) linea(`  ${n.como_le_dicen}  (${n.nombre})`);
  if (!sinPagar.length) linea('  (ninguno)');

  titulo('Recordatorio');
  linea('  poné el audio en audios-crudos/<narrador>/dia_NN.ogg y corré:');
  linea('  npm run manual -- cargar <narrador> <archivo>');
  linea();
}

async function siguiente(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const respuestas = await respuestasDe(n.id);
  const orden = proximoOrden(n.dia_actual, ordenesRespondidas(respuestas));
  // Bitácora 28: si ya respondió la última y faltan las adaptativas, se generan acá.
  const ultima = await asegurarAdaptativas(n, orden - 1);

  if (orden > ultima) {
    linea(`Ya está todo: ${n.como_le_dicen} llegó a la orden ${ultima} (la última del guion).`);
    linea(`Cerrá la bitácora: npm run manual -- cerrar ${slug(n.como_le_dicen)}`);
    return;
  }

  const pregunta = await mods.preguntaDeOrden(n.id, orden);
  if (!pregunta) throw new Error(`No hay pregunta para la orden ${orden} de ${n.como_le_dicen}.`);

  let texto = pregunta.texto;
  const aMano = typeof flags['texto'] === 'string' ? (flags['texto'] as string).trim() : '';
  if (aMano) {
    // Bitácora 25: Naza reemplazó la 21 a mano y en la base quedó la generada.
    // Con --texto se manda ESTE texto y queda anotado como el que recibió.
    texto = aMano;
    linea('↑ texto a mano (--texto): sale así y queda anotado como la pregunta enviada');
  } else if (pregunta.tipo === 'fija' && mods.capituloNoAplica(n.contexto, pregunta.capitulo)) {
    // Misma regla que preguntar.ts: si el capítulo no aplica a esta vida, se
    // reemplaza. Vale para la fija de la plantilla (se inserta la propia con el
    // mismo orden) y para la fija propia del guion copiado (se reescribe esa fila).
    linea(`La orden ${orden} es de «${pregunta.capitulo}» y en esta vida no aplica: generando la pregunta de reemplazo...`);
    const { db } = mods;
    const capitulos = (await mods.capitulosDe(n.id)).filter((c) => c !== pregunta.capitulo);
    const nueva = await mods.generarPreguntaReemplazo(
      n.como_le_dicen, await mods.armarHistoria(n.id), capitulos, pregunta.capitulo, mods.textoEvitar(n.contexto), await mods.tratoDe(n),
    );
    const { error } = pregunta.narrador_id === null
      ? await db.from('preguntas').insert({ narrador_id: n.id, orden, texto: nueva.texto, capitulo: nueva.capitulo, tipo: 'adaptativa' })
      : await db.from('preguntas').update({ texto: nueva.texto, capitulo: nueva.capitulo, tipo: 'adaptativa' }).eq('id', pregunta.id);
    if (error) throw new Error(`No pude guardar la pregunta de reemplazo: ${error.message}`);
    texto = nueva.texto;
  } else if (pregunta.tipo === 'fija') {
    // El biógrafo que escucha: las preguntas del guion se personalizan con lo
    // que el narrador ya contó (misma función que usa el camino de WhatsApp).
    const personalizada = await mods.personalizarPregunta(n, texto, orden, { recordar: !flags['solo-ver'] });
    texto = personalizada.texto;
    linea(personalizada.personalizada
      ? '↑ personalizada con lo que ya contó'
      : `↑ sale tal cual está en el guion${personalizada.motivo ? ` (${personalizada.motivo})` : ''}`);
  }

  const mensaje = mensajeDePregunta(texto, await mods.tratoDe(n));
  titulo(`Pregunta ${orden} para ${n.como_le_dicen} — copiá y pegá esto en WhatsApp`);
  linea(mensaje);
  linea();

  if (flags['voz']) {
    const carpeta = join(CRUDOS, slug(n.como_le_dicen), 'sistema');
    mkdirSync(carpeta, { recursive: true });
    const destino = join(carpeta, `pregunta_${String(orden).padStart(2, '0')}.mp3`);
    writeFileSync(destino, await mods.generarAudioVoz(texto));
    linea(`Audio de la pregunta (para adjuntar a mano): ${destino}`);
  }

  if (flags['solo-ver']) {
    linea('(--solo-ver: no anoté nada en la base)');
    return;
  }
  const { db } = mods;
  if (aMano) await recordarPreguntaEnviada(n, orden, aMano);
  const avance: Record<string, unknown> = { dia_actual: orden };
  if (n.estado === 'invitado' || n.estado === 'acepto') avance.estado = 'activo';
  await db.from('narradores').update(avance).eq('id', n.id);
  await registrarEnvio(n.id, 'pregunta', orden);
  linea(`Anotado: orden ${orden} enviada a mano (dia_actual = ${orden}). Cuando llegue el audio: npm run manual -- cargar ${slug(n.como_le_dicen)} <archivo>`);
}

/**
 * Bitácora 25: la pregunta que se le mandó no es la que quedó en la base (la 21
 * se reemplazó a mano después de `siguiente`). Corrige `preguntasEnviadas[orden]`
 * para que el panel, el libro y la evaluación usen lo que él leyó de verdad.
 */
async function corregirPregunta(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const n = await buscarNarrador(ref);
  const texto = typeof flags['texto'] === 'string' ? (flags['texto'] as string).trim() : '';
  const orden = flags['orden'] !== undefined ? Number(flags['orden']) : n.dia_actual;
  if (!texto || !Number.isInteger(orden) || orden < 1) {
    throw new Error('Uso: corregir-pregunta <narrador> --texto "lo que de verdad le mandaste" [--orden N] (sin --orden, la vigente)');
  }
  const antes = (n.contexto?.preguntasEnviadas ?? {})[String(orden)];
  await recordarPreguntaEnviada(n, orden, texto);
  titulo(`Pregunta ${orden} de ${n.como_le_dicen} corregida`);
  if (typeof antes === 'string') linea(`antes: ${antes}`);
  linea(`ahora: ${texto}`);
}

/** Copia el audio a la carpeta de crudos con el nombre canónico (respaldo + convención). */
function archivarLocal(n: NarradorFila, ruta: string, orden: number, sufijo: number): string {
  const carpeta = join(CRUDOS, slug(n.como_le_dicen));
  mkdirSync(carpeta, { recursive: true });
  const destino = join(carpeta, archivoCanonico(orden, sufijo));
  if (resolve(destino) !== resolve(ruta)) copyFileSync(ruta, destino);
  return destino;
}

/**
 * Bitácora 3: una respuesta que llegó en varias notas de voz. Se pegan con
 * ffmpeg (el mismo que usa la fábrica; Naza ya lo tiene) en un solo .ogg en la
 * carpeta de crudos, y de ahí en más es un archivo como cualquier otro.
 * Re-encodea a opus: pegar .ogg con `-c copy` deja saltos en el audio.
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

async function cargar(ref: string | undefined, archivos: string[], flags: Args['flags']): Promise<void> {
  if (!archivos.length) throw new Error('Falta el archivo del audio. Uso: cargar <narrador> <archivo.ogg> [<otro.ogg> ...] [--orden N] [--repregunta]');
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const rutas = archivos.map(resolverRuta);
  for (const r of rutas) {
    // Bitácora 15: WhatsApp deja el archivo en 0 bytes si se guarda antes de tiempo.
    const motivo = motivoParaRechazarAudio(statSync(r).size, basename(r));
    if (motivo) throw new Error(motivo);
  }
  const ruta = rutas.length === 1 ? rutas[0] : unirAudios(n, rutas);
  const respuestas = await respuestasDe(n.id);

  const delNombre = ordenDeArchivo(basename(ruta));
  const orden = flags['orden'] !== undefined ? Number(flags['orden']) : delNombre?.orden ?? proximoOrden(n.dia_actual, ordenesRespondidas(respuestas));
  const esRepregunta = Boolean(flags['repregunta']) || (delNombre ? delNombre.sufijo > 1 : false);

  const previas = respuestas.filter((r) => r.pregunta_orden === orden);
  if (previas.length && !esRepregunta) {
    throw new Error(
      `La orden ${orden} de ${n.como_le_dicen} ya tiene respuesta (${previas.length}). ` +
      `Si este audio es una repregunta, corré con --repregunta.`,
    );
  }
  if (!previas.length && esRepregunta) {
    throw new Error(`Marqué --repregunta pero la orden ${orden} todavía no tiene respuesta principal.`);
  }

  const pregunta = await mods.preguntaDeOrden(n.id, orden);
  if (!pregunta) throw new Error(`No existe la pregunta ${orden} para ${n.como_le_dicen}.`);
  // Bitácora 18/25: se evalúa contra lo que él leyó (personalizada o corregida), no contra el guion.
  const textoPregunta = textoDePreguntaEnviada(n, orden, pregunta.texto);

  titulo(`Cargando ${basename(ruta)} → ${n.como_le_dicen}, orden ${orden}${esRepregunta ? ' (repregunta)' : ''}`);
  linea(`Pregunta ${orden}: ${textoPregunta}`);

  const audio = readFileSync(ruta);
  linea(`Audio: ${mb(audio.length)}`);
  const sufijo = esRepregunta ? previas.length + 2 : 1;
  const destinoLocal = archivarLocal(n, ruta, orden, sufijo);

  const { id, audioPath } = await mods.guardarRespuestaAudio(n.id, orden, audio, esRepregunta);
  linea(`Storage: audios/${audioPath}`);
  linea(`Respaldo local: ${destinoLocal}`);
  // El contexto que se le sopla a Whisper: vocabulario rioplatense + los datos
  // del narrador que ya están en su fila. Sin esto, "de laburar" se transcribe
  // como "de la URA" (medido con un audio real).
  const contexto = promptDeTranscripcion(n.contexto ?? {}, n.como_le_dicen);
  linea(`Contexto de transcripción (${contexto.length} caracteres): ${contexto.slice(0, 150)}…`);
  const { texto, duracionSegundos } = await mods.transcribirYActualizar(id, audio, contexto);
  linea(`Transcripción (${duracionSegundos}s): ${texto.slice(0, 240)}${texto.length > 240 ? '…' : ''}`);

  await trasResponderManual(n, orden, esRepregunta, textoPregunta, texto, duracionSegundos, id);
}

/**
 * Una respuesta escrita, sin audio. Salió el 17/09 con Joaquín: la pregunta 19
 * ("Los hijos") no aplicaba y contestó "no tengo" por texto. Hace lo mismo que
 * `cargar` menos Storage y Whisper: inserta en `respuestas` con `texto_directo`
 * y sigue con evaluación, adaptativas y avance. Se anota en la ficha
 * (`contexto.datosExtra`) si se pasa --ficha, para que las próximas preguntas
 * lo sepan.
 */
async function responderTexto(ref: string | undefined, texto: string | undefined, flags: Args['flags']): Promise<void> {
  if (!texto) throw new Error('Falta el texto. Uso: responder-texto <narrador> "lo que dijo" [--orden N] [--repregunta] [--ficha "dato para la ficha"]');
  const mods = await modulos();
  const n = await buscarNarrador(ref);
  const respuestas = await respuestasDe(n.id);
  const esRepregunta = Boolean(flags['repregunta']);
  const orden = flags['orden'] !== undefined ? Number(flags['orden']) : proximoOrden(n.dia_actual, ordenesRespondidas(respuestas));
  const previas = respuestas.filter((r) => r.pregunta_orden === orden);
  if (previas.length && !esRepregunta) {
    throw new Error(`La orden ${orden} de ${n.como_le_dicen} ya tiene respuesta (${previas.length}). Si es una repregunta, corré con --repregunta.`);
  }
  const pregunta = await mods.preguntaDeOrden(n.id, orden);
  if (!pregunta) throw new Error(`No existe la pregunta ${orden} para ${n.como_le_dicen}.`);

  titulo(`Respuesta por texto → ${n.como_le_dicen}, orden ${orden}${esRepregunta ? ' (repregunta)' : ''}`);
  linea(`Pregunta ${orden}: ${pregunta.texto}`);
  linea(`Texto: ${texto}`);

  const { data: insertada, error } = await mods.db.from('respuestas')
    .insert({ narrador_id: n.id, pregunta_orden: orden, texto_directo: texto, transcripcion: texto, es_repregunta: esRepregunta })
    .select('id').single();
  if (error) throw new Error(`No pude insertar la respuesta: ${error.message}`);
  const respuestaId = (insertada as { id: string }).id;

  const ficha = typeof flags['ficha'] === 'string' ? (flags['ficha'] as string) : undefined;
  if (ficha) {
    const contexto: Record<string, unknown> = { ...(n.contexto ?? {}) };
    const previo = typeof contexto.datosExtra === 'string' && contexto.datosExtra.trim() ? `${contexto.datosExtra.trim()} ` : '';
    contexto.datosExtra = `${previo}${ficha}`;
    const { error: errorFicha } = await mods.db.from('narradores').update({ contexto }).eq('id', n.id);
    if (errorFicha) throw new Error(`No pude anotar la ficha: ${errorFicha.message}`);
    n.contexto = contexto as NarradorFila['contexto'];
    linea(`Ficha: datosExtra += "${ficha}"`);
  }

  await trasResponderManual(n, orden, esRepregunta, textoDePreguntaEnviada(n, orden, pregunta.texto), texto, 0, respuestaId);
}

/**
 * El paso 6 de procesar.ts: evaluar la respuesta principal e imprimir la
 * repregunta si hace falta. Además guarda lo que la evaluación detectó: la
 * reserva ("esto que no vaya al libro", bitácora 19) en la fila de la
 * respuesta, y el tema que pidió dejar ("vamos por otro lado", bitácora 34) en
 * `contexto.evitar`. Devuelve true si imprimió una repregunta nueva.
 * Lo usan `cargar`, `responder-texto` y `evaluar` (el reintento, bitácora 14-b).
 */
async function evaluarYAnotar(
  n: NarradorFila, orden: number, pregunta: string, transcripcion: string, duracionSegundos: number, respuestaId: string | null,
  { anotar = true } = {},
): Promise<boolean> {
  const mods = await modulos();
  // "Esto es de otra parte" (21/09): la evaluación ve las preguntas ya hechas.
  const preguntasHechas = await mods.preguntasHechasAntes(n.id, orden, n.contexto);
  const evaluacion = await mods.evaluarRespuesta(pregunta, transcripcion, duracionSegundos, mods.textoEvitar(n.contexto), await mods.tratoDe(n), { preguntasHechas, ordenActual: orden });
  await anotarMarcas(n, respuestaId, { reserva: mods.reservaDe(evaluacion, transcripcion), dejarTema: evaluacion.dejarTema ?? null }, anotar);
  const tema = mods.temaDe(evaluacion, preguntasHechas, orden);
  if (tema) {
    linea(`📌 Es un recuerdo de otra parte: pertenece a la pregunta ${tema.temaDeOrden}${tema.temaMotivo ? ` (${tema.temaMotivo})` : ''}. El libro lo ubica en ese capítulo.`);
    if (anotar && respuestaId) await mods.guardarTemaDeOtraParte(respuestaId, tema);
  }

  if (!evaluacion.suficiente && evaluacion.repregunta && !(await yaSeRepregunto(n.id, orden))) {
    titulo('El cerebro pide una repregunta — pegala en WhatsApp');
    linea(evaluacion.repregunta);
    if (!anotar) { linea('(--solo-ver: no anoté nada)'); return true; }
    await registrarEnvio(n.id, 'repregunta', orden);
    // El texto va al contexto del narrador: es lo que después muestra el panel
    // ("le repreguntamos: …") arriba de la respuesta que llegue.
    await mods.guardarRepreguntaEnviada(n, orden, evaluacion.repregunta);
    linea(`(anotada. Cuando llegue ese audio: npm run manual -- cargar ${slug(n.como_le_dicen)} <archivo> --repregunta --orden ${orden})`);
    return true;
  }
  linea(evaluacion.suficiente ? 'Respuesta suficiente: sin repregunta.' : 'Ya había una repregunta anotada para esta orden: no se repite.');
  return false;
}

/**
 * Anota la reserva (bitácora 19) en la fila y el tema a dejar (bitácora 34) en
 * `contexto.evitar`, e imprime lo que encontró. Lo que se anota de cualquier
 * respuesta, venga de la evaluación o de la llamada corta de marcas.
 */
async function anotarMarcas(
  n: NarradorFila, respuestaId: string | null,
  { reserva, dejarTema }: { reserva: { reservada: boolean; tramo: string | null }; dejarTema: string | null }, anotar: boolean,
): Promise<void> {
  const mods = await modulos();
  if (reserva.reservada) {
    linea(`🔒 Pidió reservar ${reserva.tramo ? `una parte: «${reserva.tramo}»` : 'la respuesta entera'}: no va al libro.`);
    if (anotar && respuestaId) await mods.guardarReserva(respuestaId, reserva);
  }
  if (dejarTema && dejarTema.trim()) {
    const contexto = mods.sumarTemaEvitado(n.contexto, dejarTema);
    linea(`🚫 Pidió dejar un tema: «${dejarTema.trim()}»${contexto ? ' → queda en contexto.evitar para el resto de la entrevista.' : ' (ya estaba anotado).'}`);
    if (anotar && contexto) {
      const { error } = await mods.db.from('narradores').update({ contexto }).eq('id', n.id);
      if (error) linea(`  ⚠ no pude anotarlo: ${error.message}`);
      else n.contexto = contexto;
    }
  }
}

/**
 * Bitácora 14-b: reintentar SOLO la evaluación de una respuesta ya cargada
 * (cuando el modelo falló y `estado` la marca "sin repregunta anotada"), sin
 * volver a subir ni transcribir nada.
 */
async function evaluar(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const respuestas = await respuestasDe(n.id);
  const orden = flags['orden'] !== undefined ? Number(flags['orden']) : n.dia_actual;
  const principal = respuestas.find((r) => r.pregunta_orden === orden && !r.es_repregunta);
  if (!principal) throw new Error(`La orden ${orden} de ${n.como_le_dicen} no tiene respuesta principal cargada. Uso: evaluar <narrador> [--orden N] [--solo-ver]`);
  const transcripcion = principal.transcripcion ?? principal.texto_directo ?? '';
  if (!transcripcion.trim()) throw new Error(`La respuesta ${orden} no tiene transcripción: corré retranscribir ${slug(n.como_le_dicen)} --orden ${orden} --si`);
  const pregunta = await mods.preguntaDeOrden(n.id, orden);
  const textoPregunta = textoDePreguntaEnviada(n, orden, pregunta?.texto ?? '');

  titulo(`Evaluar de nuevo la respuesta ${orden} de ${n.como_le_dicen}`);
  linea(`Pregunta: ${textoPregunta}`);
  linea(`Respuesta (${principal.duracion_segundos ?? 0}s): ${transcripcion.slice(0, 240)}${transcripcion.length > 240 ? '…' : ''}`);
  const salioRepregunta = await evaluarYAnotar(n, orden, textoPregunta, transcripcion, principal.duracion_segundos ?? 0, principal.id, { anotar: !flags['solo-ver'] });
  if (!salioRepregunta) linea('Ahora: npm run manual -- siguiente ' + slug(n.como_le_dicen));
}

/** Bitácora 31: la despedida impresa + 'completado', el mismo cierre que `cerrar`. */
async function cerrarManual(n: NarradorFila): Promise<void> {
  const mods = await modulos();
  titulo(`Última pregunta: ${n.como_le_dicen} terminó — mandale esto por WhatsApp`);
  linea(despedida(n.como_le_dicen, await mods.tratoDe(n)));
  linea();
  if (n.estado === 'completado') { linea('Ya estaba en completado.'); return; }
  await mods.db.from('narradores').update({ estado: 'completado' }).eq('id', n.id);
  await registrarEnvio(n.id, 'despedida');
  n.estado = 'completado';
  linea(`Base: estado → 'completado' (ya lo puede tomar la fábrica).`);
}

/** Los pasos 6-8 de procesar.ts, pero imprimiendo en vez de mandar por WhatsApp. */
async function trasResponderManual(
  n: NarradorFila, orden: number, esRepregunta: boolean, pregunta: string, transcripcion: string, duracionSegundos: number,
  respuestaId: string | null = null,
): Promise<void> {
  const mods = await modulos();
  const supabase = mods.db;

  // Solo la PRIMERA respuesta a una pregunta se evalúa (las de la repregunta, no).
  // Pero un "esto no lo pongas" o un "vamos por otro lado" dicho en la
  // ampliación vale igual: ahí se detectan con la llamada corta, sin repreguntar.
  let repreguntaRecienImpresa = false;
  if (esRepregunta) {
    await anotarMarcas(n, respuestaId, await mods.detectarReservaYDejarTema(transcripcion, await mods.tratoDe(n)), true);
  } else {
    repreguntaRecienImpresa = await evaluarYAnotar(n, orden, pregunta, transcripcion, duracionSegundos, respuestaId);
  }

  // Bitácora 28: al responder la última del guion se generan las 4 a medida;
  // desde el 20/09 la función no lanza, así que el cierre de abajo sale igual.
  const ultima = await asegurarAdaptativas(n, orden);

  await supabase.from('narradores')
    .update({ ultima_respuesta_at: new Date().toISOString(), alerta_silencio: false })
    .eq('id', n.id);

  // Bitácora 31: la última respuesta cierra sola (despedida + 'completado').
  switch (queHacerAlFinal(orden >= ultima, repreguntaRecienImpresa)) {
    case 'cerrar':
      await cerrarManual(n);
      return;
    case 'esperar_repregunta':
      linea(`Es la última pregunta (orden ${ultima}): cuando cargues la respuesta a la repregunta (--repregunta), se cierra solo.`);
      return;
    default:
      linea('Ahora: npm run manual -- siguiente ' + slug(n.como_le_dicen));
  }
}

async function cargarCarpeta(ref: string | undefined, carpeta: string | undefined, flags: Args['flags']): Promise<void> {
  if (!carpeta) throw new Error('Falta la carpeta. Uso: cargar-carpeta <narrador> <carpeta> [--desde N] [--si] [--repregunta]');
  const n = await buscarNarrador(ref);
  const dir = resolve(carpeta);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new Error(`No existe la carpeta ${dir}`);

  const archivos = readdirSync(dir)
    .filter((a) => esAudio(a))
    .map((a) => join(dir, a))
    .sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
  if (!archivos.length) { linea(`No hay audios en ${dir}`); return; }

  const respuestas = await respuestasDe(n.id);
  const desde = flags['desde'] !== undefined
    ? Number(flags['desde'])
    : proximoOrden(n.dia_actual, ordenesRespondidas(respuestas));

  // Los archivos con nombre canónico ya saben su orden; el resto se reparte
  // consecutivo desde `desde`, en el orden en que llegaron (mtime).
  const sinNombre = archivos.filter((a) => !ordenDeArchivo(basename(a)));
  const reparto = new Map(planDeCarga(sinNombre, desde, flags['repregunta'] === true).map((p) => [p.archivo, p]));
  const plan = archivos.map((a) => {
    const canonico = ordenDeArchivo(basename(a));
    const paso = reparto.get(a);
    const sufijo = canonico?.sufijo ?? paso?.sufijo ?? 1;
    return { archivo: a, orden: canonico?.orden ?? paso!.orden, sufijo };
  });

  titulo(`Plan de carga para ${n.como_le_dicen} (${plan.length} audios)`);
  for (const p of plan) {
    linea(`  orden ${String(p.orden).padStart(2, '0')}${p.sufijo > 1 ? ` #${p.sufijo}` : ''}   ${basename(p.archivo)}`);
  }
  if (!flags['si']) {
    linea();
    linea('Es sólo el plan. Si está bien, agregá --si y se cargan uno por uno.');
    return;
  }
  for (const p of plan) {
    await cargar(n.como_le_dicen, [p.archivo], { orden: String(p.orden), repregunta: p.sufijo > 1 });
  }
}

async function archivar(ref: string | undefined, archivo: string | undefined, flags: Args['flags']): Promise<void> {
  if (!archivo) throw new Error('Falta el archivo. Uso: archivar <narrador> <archivo.ogg> [--orden N]');
  const n = await buscarNarrador(ref);
  const ruta = resolverRuta(archivo);
  const delNombre = ordenDeArchivo(basename(ruta));
  const respuestas = await respuestasDe(n.id);
  const orden = flags['orden'] !== undefined
    ? Number(flags['orden'])
    : delNombre?.orden ?? proximoOrden(n.dia_actual, ordenesRespondidas(respuestas));
  const sufijo = delNombre?.sufijo ?? (respuestas.some((r) => r.pregunta_orden === orden) ? respuestas.filter((r) => r.pregunta_orden === orden).length + 1 : 1);
  const destino = archivarLocal(n, ruta, orden, sufijo);
  linea(`Guardado: ${destino}`);
  linea(`(sin tocar la base; para cargarlo: npm run manual -- cargar ${slug(n.como_le_dicen)} "${destino}")`);
}

/**
 * Vuelve a transcribir respuestas ya cargadas, con el contexto de hoy.
 *
 * Existe porque el contexto mejora: cuando se agregan palabras al glosario o la
 * familia completa el árbol familiar, las respuestas viejas quedaron con la
 * transcripción peor. Baja el audio de Storage (el original, no se pierde nada)
 * y reescribe `transcripcion` + `duracion_segundos`. Cuesta una llamada de
 * Whisper por respuesta, así que pide `--si`.
 */
async function retranscribir(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const respuestas = await respuestasDe(n.id);
  const conAudio = respuestas.filter((r) => r.audio_path && (flags['orden'] === undefined || r.pregunta_orden === Number(flags['orden'])));
  if (!conAudio.length) {
    linea(`No hay respuestas con audio para retranscribir en ${n.como_le_dicen}.`);
    return;
  }

  const contexto = promptDeTranscripcion(n.contexto ?? {}, n.como_le_dicen);
  titulo(`Retranscribir ${conAudio.length} respuesta(s) de ${n.como_le_dicen}`);
  linea(`Costo estimado: ~USD ${(0.018 * conAudio.length).toFixed(2)} (${conAudio.length} × 3 min de audio).`);
  if (!flags['si']) {
    linea('Es sólo el cálculo. Agregá --si para hacerlo de verdad.');
    return;
  }

  for (const r of conAudio) {
    const { data, error } = await mods.db.storage.from('audios').download(r.audio_path!);
    if (error || !data) {
      linea(`  orden ${r.pregunta_orden}: no pude bajar ${r.audio_path} — ${error?.message ?? 'sin datos'}`);
      continue;
    }
    const antes = r.transcripcion ?? '';
    const { texto, duracionSegundos } = await mods.transcribirYActualizar(
      r.id, Buffer.from(await data.arrayBuffer()), contexto,
    );
    linea(`  orden ${r.pregunta_orden}: ${antes.length} → ${texto.length} caracteres · ${duracionSegundos}s`);
    const i = primeraDiferencia(antes, texto);
    if (i >= 0) {
      linea(`     antes: …${antes.slice(Math.max(0, i - 45), i + 45)}`);
      linea(`     ahora: …${texto.slice(Math.max(0, i - 45), i + 45)}`);
    }
  }
}

/**
 * Muestra el contexto que se le sopla a la transcripción de este narrador.
 * Existe para poder LEERLO: de dónde sale, qué incluye y qué falta cargar.
 */
async function verContexto(ref: string | undefined): Promise<void> {
  const n = await buscarNarrador(ref);
  const texto = promptDeTranscripcion(n.contexto ?? {}, n.como_le_dicen);
  const contexto = (n.contexto ?? {}) as Record<string, any>;
  const tieneDatos = Boolean(contexto.arbol || contexto.lugarNacimiento || contexto.oficio || contexto.datosExtra);

  titulo(`Contexto de transcripción de ${n.como_le_dicen}`);
  linea(texto);
  linea();
  linea(`(${texto.length} caracteres · la API sólo mira ~224 tokens)`);
  linea(tieneDatos
    ? '↑ incluye el vocabulario fijo + los datos de vida y el árbol que cargó la familia.'
    : '↑ este narrador todavía no tiene datos de vida: sólo va el vocabulario rioplatense fijo.');
  linea('Para que rinda más: completá árbol familiar, lugar de nacimiento y oficio en su ficha.');
}

/**
 * Muestra la memoria del biógrafo para este narrador: los resúmenes de los
 * capítulos ya contados. Genera los que falten (una llamada a Haiku por
 * capítulo, ~USD 0,005) y los guarda.
 */
async function verResumenes(ref: string | undefined, flags: Record<string, string | boolean> = {}): Promise<void> {
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const orden = proximoOrden(n.dia_actual, ordenesRespondidas(await respuestasDe(n.id)));
  const memoria = await mods.memoriaDeCapitulos(n, orden, { regenerar: flags.regenerar === true });

  titulo(`Memoria del biógrafo de ${n.como_le_dicen} (para la pregunta ${orden})`);
  linea(memoria || '(todavía no cerró ningún capítulo: la memoria se arma sola a medida que avanza)');
  linea();
  linea('Es memoria INTERNA del entrevistador: no va al libro. El libro se escribe leyendo todo.');
}

/** ¿Ya se le anotó la presentación a este narrador? Devuelve cuándo, o null. */
async function presentadoEl(narradorId: string): Promise<string | null> {
  const { db } = await modulos();
  const { data } = await db.from('envios').select('enviado_at')
    .eq('narrador_id', narradorId).eq('tipo', 'bienvenida').order('enviado_at').limit(1);
  return (data as { enviado_at: string }[] | null)?.[0]?.enviado_at ?? null;
}

/**
 * La presentación del biógrafo: lo primero que recibe, antes de la pregunta 1.
 *
 * Existe porque el primer narrador real (Ciro, 2026-09-15) recibió la pregunta
 * 1 sin que nadie le dijera quién le escribía. En el camino de WhatsApp la manda
 * el scheduler como plantilla de Meta; acá se imprime, con el trato del narrador.
 * Se anota como envío 'bienvenida' para que, cuando Meta vuelva, el scheduler
 * no se la mande otra vez (mira `ultimoEnvio(n.id, 'bienvenida')`).
 */
async function presentar(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const { db } = mods;
  const trato = await mods.tratoDe(n);

  // Quién regala: la misma regla que el scheduler, salvo que se pase --de.
  let quienRegala = typeof flags['de'] === 'string' ? (flags['de'] as string).trim() : '';
  if (!quienRegala) {
    const { data: familia } = await db.from('familias').select('nombre').eq('id', n.familia_id).maybeSingle();
    const vinculo = n.contexto?.vinculoComprador;
    const nombreFamilia = (familia as { nombre?: string } | null)?.nombre ?? (trato === 'vos' ? 'tu familia' : 'su familia');
    quienRegala = vinculo ? `${trato === 'vos' ? 'tu' : 'su'} ${vinculo} ${nombreFamilia}` : nombreFamilia;
  }

  const texto = bienvenida(n.como_le_dicen, quienRegala, trato, { enseguida: mods.esModoRapido(n.contexto) });
  titulo(`Presentación para ${n.como_le_dicen} (trato: ${trato}) — copiá y pegá esto en WhatsApp`);
  linea(texto);
  linea();

  const ya = await presentadoEl(n.id);
  if (ya) {
    linea(`(ya estaba anotada el ${fechaCorta(ya)}: te la imprimo por si la querés reenviar, no la anoto de nuevo)`);
    return;
  }
  if (flags['solo-ver']) {
    linea('(--solo-ver: no anoté nada en la base)');
    return;
  }
  await registrarEnvio(n.id, 'bienvenida');
  linea(`Anotada. Cuando conteste que SÍ: npm run manual -- siguiente ${slug(n.como_le_dicen)}`);
}

async function cerrar(ref: string | undefined): Promise<void> {
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const { db } = mods;
  const respuestas = await respuestasDe(n.id);
  if (!respuestas.length) throw new Error(`${n.como_le_dicen} no tiene ninguna respuesta: no hay nada que cerrar.`);
  titulo(`Cierre de ${n.como_le_dicen}`);
  linea(`Mandale esto por WhatsApp:`);
  linea();
  linea(despedida(n.como_le_dicen, await mods.tratoDe(n)));
  linea();
  if (n.estado !== 'completado') {
    await db.from('narradores').update({ estado: 'completado' }).eq('id', n.id);
    await registrarEnvio(n.id, 'despedida');
    linea(`Base: estado → 'completado' (ya lo puede tomar la fábrica).`);
  } else {
    linea('Ya estaba en completado.');
  }
}

async function crear(flags: Args['flags']): Promise<void> {
  const { db } = await modulos();
  const flag = (k: string) => (typeof flags[k] === 'string' ? (flags[k] as string) : undefined);
  const nombre = flag('nombre');
  const leDicen = flag('le-dicen') ?? flag('leDicen');
  const telefono = flag('telefono');
  if (!nombre || !leDicen || !telefono) {
    throw new Error('Faltan datos. Uso: crear --nombre Ciro --le-dicen Ciro --telefono +54911... [--zona America/Argentina/Buenos_Aires] [--familia email] [--nacido 1939] [--trato usted|vos] [--contexto \'{"arbol":{...}}\']');
  }

  const emailFamilia = flag('familia') ?? 'nazamateos@gmail.com';
  // Se busca por id o por mail según lo que parezca: PostgREST intenta castear
  // todo a uuid si se le pasa un mail dentro de un `or`, y explota.
  const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(emailFamilia);
  const consulta = db.from('familias').select('id,nombre,email');
  const { data: familia, error: errFamilia } = await (esUuid
    ? consulta.eq('id', emailFamilia)
    : consulta.ilike('email', emailFamilia)
  ).limit(1).maybeSingle();
  if (errFamilia || !familia) throw new Error(`No encontré la familia «${emailFamilia}»: ${errFamilia?.message ?? 'sin filas'}`);

  const contexto: Record<string, unknown> = flag('contexto') ? JSON.parse(flag('contexto')!) : {};
  if (flag('nacido')) contexto.anioNacimiento = Number(flag('nacido'));
  if (flag('vinculo')) contexto.vinculoComprador = flag('vinculo');
  if (!flags['no-rapido']) contexto.modoRapido = true;
  // El escape a mano de los pilotos: Naza conoce al narrador mejor que su ficha.
  const trato = flag('trato');
  if (trato === 'usted' || trato === 'vos') contexto.trato = trato;
  else if (trato) throw new Error(`--trato acepta 'usted' o 'vos', no «${trato}».`);

  const fila = {
    familia_id: (familia as { id: string }).id,
    nombre,
    como_le_dicen: leDicen,
    telefono_whatsapp: telefono,
    zona_horaria: flag('zona') ?? 'America/Argentina/Buenos_Aires',
    hora_preferida: flag('hora') ?? '10:00',
    contexto,
    // En modo manual las preguntas las manda Naza a mano, así que no tiene
    // sentido dejarlo 'invitado' esperando la API: arranca listo para la 1.
    estado: flag('estado') ?? 'activo',
    dia_actual: 0,
  };
  const { data, error } = await db.from('narradores').insert(fila).select('id,como_le_dicen,estado').single();
  if (error) throw new Error(`No pude crear al narrador: ${error.message}`);
  const creado = data as { id: string; como_le_dicen: string; estado: string };

  // Bitácora 12: el checkout copia las fijas al narrador (guion propio, CONTRATO
  // 12/09); `crear` no lo hacía y desde el panel no se podían editar sus preguntas.
  const copiadas = await copiarGuion(creado.id);

  titulo(`Narrador creado: ${creado.como_le_dicen}`);
  linea(`  id: ${creado.id}`);
  linea(`  familia: ${(familia as { email: string }).email}`);
  linea(`  estado: ${creado.estado}   ·   modoRapido: ${contexto.modoRapido ? 'sí' : 'no'}   ·   zona: ${fila.zona_horaria}`);
  linea(`  guion propio: ${copiadas} preguntas copiadas de la plantilla (la familia ya puede editarlas en el panel).`);
  linea();
  linea(`Primera pregunta: npm run manual -- siguiente ${slug(leDicen)}`);
}

/**
 * Copia la plantilla global (las fijas) como guion propio del narrador, igual
 * que hace la web al comprar (`web/src/app/api/guion/route.ts`): mismo orden,
 * mismo texto, mismo capítulo, `tipo = 'fija'`. No pisa lo que ya tenga.
 * Devuelve cuántas copió. También sirve para un narrador viejo: `guion <narrador>`.
 */
async function copiarGuion(narradorId: string): Promise<number> {
  const { db } = await modulos();
  const { data: propias } = await db.from('preguntas').select('orden,tipo').eq('narrador_id', narradorId);
  const lista = (propias as { orden: number; tipo: string }[] | null) ?? [];
  if (lista.some((p) => p.tipo === 'fija')) return 0; // ya tiene guion propio
  const { data: globales, error } = await db.from('preguntas').select('orden,texto,capitulo').is('narrador_id', null);
  if (error) throw new Error(`No pude leer la plantilla: ${error.message}`);
  const ocupados = new Set(lista.map((p) => p.orden));
  const filas = ((globales as { orden: number; texto: string; capitulo: string }[] | null) ?? [])
    .filter((g) => !ocupados.has(g.orden))
    .map((g) => ({ narrador_id: narradorId, orden: g.orden, texto: g.texto, capitulo: g.capitulo, tipo: 'fija' }));
  if (!filas.length) return 0;
  const { error: errorCopia } = await db.from('preguntas').insert(filas);
  if (errorCopia) throw new Error(`No pude copiar el guion: ${errorCopia.message}`);
  return filas.length;
}

async function guion(ref: string | undefined): Promise<void> {
  const n = await buscarNarrador(ref);
  const copiadas = await copiarGuion(n.id);
  linea(copiadas
    ? `Guion propio de ${n.como_le_dicen}: ${copiadas} preguntas copiadas de la plantilla.`
    : `${n.como_le_dicen} ya tenía guion propio: no copié nada.`);
}

/**
 * Corrige la ficha de un narrador que ya existe. Salió el 15/09 con Joaquín (28
 * años): su ficha estaba vacía, el trato se decidió 'usted' por default y las
 * preguntas salían forzadas ("sus viejos... cuando usted era chico"). Como el
 * trato se decide UNA sola vez, hay que poder fijarlo a mano después.
 * --rehacer borra la personalización guardada de la orden vigente para que
 * el próximo `siguiente` la genere de nuevo con el trato correcto.
 */
async function ficha(ref: string | undefined, flags: Args['flags']): Promise<void> {
  const { db } = await modulos();
  const n = await buscarNarrador(ref);
  const flag = (k: string) => (typeof flags[k] === 'string' ? (flags[k] as string) : undefined);
  const contexto: Record<string, unknown> = { ...(n.contexto ?? {}) };
  const cambios: string[] = [];

  const trato = flag('trato');
  if (trato === 'usted' || trato === 'vos') { contexto.trato = trato; cambios.push(`trato = ${trato}`); }
  else if (trato) throw new Error(`--trato acepta 'usted' o 'vos', no «${trato}».`);
  if (flag('nacido')) { contexto.anioNacimiento = Number(flag('nacido')); cambios.push(`anioNacimiento = ${flag('nacido')}`); }
  if (flag('lugar')) { contexto.lugarNacimiento = flag('lugar'); cambios.push(`lugarNacimiento = ${flag('lugar')}`); }
  if (flag('oficio')) { contexto.oficio = flag('oficio'); cambios.push(`oficio = ${flag('oficio')}`); }
  if (flag('vinculo')) { contexto.vinculoComprador = flag('vinculo'); cambios.push(`vinculoComprador = ${flag('vinculo')}`); }
  // Bitácora 20-27: el árbol decide si «Los hijos» y «El amor» aplican. "no" = 'no tuvo'.
  const arbol: Record<string, string> = { ...((contexto.arbol as Record<string, string> | undefined) ?? {}) };
  if (flag('hijos')) { arbol.hijos = valorDelArbol(flag('hijos')!); cambios.push(`arbol.hijos = ${arbol.hijos}`); }
  if (flag('pareja')) { arbol.conyuge = valorDelArbol(flag('pareja')!); cambios.push(`arbol.conyuge = ${arbol.conyuge}`); }
  if (flag('padres')) { arbol.padres = flag('padres')!.trim(); cambios.push(`arbol.padres = ${arbol.padres}`); }
  if (flag('hermanos')) { arbol.hermanos = flag('hermanos')!.trim(); cambios.push(`arbol.hermanos = ${arbol.hermanos}`); }
  if (Object.keys(arbol).length) contexto.arbol = arbol;

  if (flags.rehacer) {
    const enviadas = (contexto.preguntasEnviadas ?? {}) as Record<string, string>;
    const orden = String(n.dia_actual);
    if (enviadas[orden]) {
      delete enviadas[orden];
      contexto.preguntasEnviadas = enviadas;
      cambios.push(`se olvida la personalización de la orden ${orden} (se rehace con el próximo siguiente)`);
    }
  }

  // El permiso para clonar la voz, a mano (3t.15): en el piloto se lo pedimos
  // por teléfono, porque la bienvenida que salió por Meta todavía no lo pedía.
  const fila: Record<string, unknown> = { contexto };
  if (flags['voz-si'] && flags['voz-no']) throw new Error('--voz-si y --voz-no juntos no tienen sentido.');
  if (flags['voz-si']) { fila.consentimiento_voz_at = new Date().toISOString(); cambios.push('consentimiento_voz_at = ahora (dio permiso para clonar su voz)'); }
  if (flags['voz-no']) { fila.consentimiento_voz_at = null; cambios.push('consentimiento_voz_at = vacío (sin permiso: la fábrica no clona)'); }

  if (!cambios.length) throw new Error('Nada que cambiar. Uso: ficha <narrador> [--trato usted|vos] [--nacido 1998] [--lugar X] [--oficio X] [--vinculo X] [--hijos no|"Ana y Juan"] [--pareja no|"Élida"] [--padres X] [--hermanos X] [--voz-si|--voz-no] [--rehacer]');

  const { error } = await db.from('narradores').update(fila).eq('id', n.id);
  if (error) throw new Error(`No pude guardar la ficha: ${error.message}`);
  titulo(`Ficha de ${n.como_le_dicen} actualizada`);
  for (const c of cambios) linea(`  ${c}`);
  if (flags.rehacer) linea(`Ahora: npm run manual -- siguiente ${slug(n.como_le_dicen)}`);
}

function ayuda(): void {
  linea(`
Puerta manual de Vitácora Familiar — el entrevistador sin la API de WhatsApp.

  npm run manual -- estado
      Quién va por qué pregunta, qué falta y qué quedó sin repregunta.

  npm run manual -- contexto <narrador>
      Muestra el contexto que se le sopla a la transcripción de ese narrador
      (vocabulario rioplatense + los datos de vida y el árbol que cargó la
      familia). Sirve para ver de dónde sale y qué falta completar.

  npm run manual -- resumenes <narrador> [--regenerar]
      Muestra la memoria del biógrafo: los resúmenes de los capítulos ya
      contados, que son los que le permiten personalizar la pregunta del día sin
      repetir lo que ya contó. Genera los que falten (una llamada a Haiku por
      capítulo) y los guarda; con --regenerar los rehace todos. Es memoria
      interna: el libro se escribe leyendo todo.

  npm run manual -- bienvenida <narrador> [--de "tu amigo Naza"] [--solo-ver]
      La presentación del biógrafo: el PRIMER mensaje, antes de la pregunta 1
      (quién le escribe, quién le regala el libro, cómo funciona, y que
      responda SÍ). Sale con el trato del narrador. --de pisa el "quién regala"
      que arma solo con la familia. Se anota como envío 'bienvenida' para que
      el scheduler no la repita cuando Meta vuelva.

  npm run manual -- siguiente <narrador> [--solo-ver] [--voz] [--texto "..."]
      Imprime el mensaje EXACTO para pegarle al narrador (pregunta del día,
      personalizada, con reemplazo si el capítulo no aplica) y lo anota en
      'envios' + avanza dia_actual. Si ya respondió la última del guion y
      faltan las 4 a medida, las genera. --solo-ver no toca la base; --voz te
      deja el mp3 de la pregunta; --texto manda ESE texto (lo que vos decidiste
      mandarle) y lo anota como la pregunta enviada.

  npm run manual -- corregir-pregunta <narrador> --texto "..." [--orden N]
      Anota lo que de verdad le mandaste (si lo cambiaste a mano después de
      'siguiente'): el panel, el libro y la evaluación usan eso.

  npm run manual -- archivar <narrador> <archivo.ogg> [--orden N]
      Copia el audio crudo a audios-crudos/<narrador>/dia_NN.ogg. No toca la base.

  npm run manual -- cargar <narrador> <archivo> [<otro> ...] [--orden N] [--repregunta]
      El corazón: sube a Storage, inserta la respuesta, transcribe con Whisper,
      evalúa (y te imprime la repregunta si hace falta; anota si pidió reservar
      algo o dejar un tema), genera las 4 a medida al responder la última del
      guion, y al responder la última que existe imprime la despedida y deja
      'completado' (no hace falta correr 'cerrar'). Varios archivos = una sola
      respuesta que llegó en varias notas de voz: se pegan con ffmpeg. Un audio
      de 0 bytes se rechaza.

  npm run manual -- evaluar <narrador> [--orden N] [--solo-ver]
      Reintenta SOLO la evaluación de una respuesta ya cargada (cuando el modelo
      falló y 'estado' la marca sin repregunta), sin subir ni transcribir de nuevo.

  npm run manual -- responder-texto <narrador> "lo que dijo" [--orden N] [--repregunta] [--ficha "dato"]
      Una respuesta escrita, sin audio (ej. "no tengo hijos"). Igual que cargar
      pero sin Storage ni Whisper. --ficha lo suma a contexto.datosExtra.

  npm run manual -- cargar-carpeta <narrador> <carpeta> [--desde N] [--si] [--repregunta]
      Un lote entero: muestra el plan y, con --si, lo carga en orden de llegada.

  npm run manual -- retranscribir <narrador> [--orden N] [--si]
      Vuelve a transcribir lo ya cargado con el contexto de hoy (baja el audio
      original de Storage). Se usa cuando se mejora el glosario o la familia
      completa el árbol familiar. Muestra qué cambió en cada respuesta.

  npm run manual -- cerrar <narrador>
      La despedida final + estado 'completado' (ahí lo toma la fábrica).

  npm run manual -- ficha <narrador> [--trato usted|vos] [--nacido 1998] [--lugar X] [--oficio X] [--vinculo X]
                                     [--hijos no|"Ana y Juan"] [--pareja no|"Élida"] [--padres X] [--hermanos X] [--voz-si|--voz-no] [--rehacer]
      Corrige la ficha de un narrador que ya existe (el trato se decide una sola
      vez; acá se fija a mano). --hijos no / --pareja no anotan 'no tuvo' en el
      árbol: «Los hijos» / «El amor» se reemplazan sin preguntar (lo mismo que
      carga la familia al comprar). --voz-si anota que dio permiso para clonar su
      voz (consentimiento_voz_at; sin eso la fábrica no clona), --voz-no lo
      borra. --rehacer olvida la personalización de la pregunta vigente para
      que el próximo 'siguiente' la genere de nuevo.

  npm run manual -- crear --nombre X --le-dicen Y --telefono +54... [--zona ...] [--nacido 1939]
      [--trato usted|vos] fuerza el trato sin preguntarle al modelo. Si no se
      pasa, lo decide él solo con la ficha la primera vez que le escribimos.
      Le copia las fijas como guion propio (como la compra), así la familia
      puede editarlas en el panel.

  npm run manual -- guion <narrador>
      Copia las fijas a un narrador viejo que no tenga guion propio.

Los audios se guardan como en el audiolibro: dia_07.ogg es la respuesta a la
orden 7; dia_07_2.ogg es la repregunta de ese mismo día.
`);
}

// ── 5. Despacho ────────────────────────────────────────────────────────────
const COMANDOS: Record<string, (a: Args) => Promise<void>> = {
  estado: () => estado(),
  siguiente: (a) => siguiente(a.posicionales[0], a.flags),
  archivar: (a) => archivar(a.posicionales[0], a.posicionales[1], a.flags),
  cargar: (a) => cargar(a.posicionales[0], a.posicionales.slice(1), a.flags),
  evaluar: (a) => evaluar(a.posicionales[0], a.flags),
  'corregir-pregunta': (a) => corregirPregunta(a.posicionales[0], a.flags),
  guion: (a) => guion(a.posicionales[0]),
  'responder-texto': (a) => responderTexto(a.posicionales[0], a.posicionales[1], a.flags),
  'cargar-carpeta': (a) => cargarCarpeta(a.posicionales[0], a.posicionales[1], a.flags),
  retranscribir: (a) => retranscribir(a.posicionales[0], a.flags),
  contexto: (a) => verContexto(a.posicionales[0]),
  resumenes: (a) => verResumenes(a.posicionales[0], a.flags),
  bienvenida: (a) => presentar(a.posicionales[0], a.flags),
  cerrar: (a) => cerrar(a.posicionales[0]),
  crear: (a) => crear(a.flags),
  ficha: (a) => ficha(a.posicionales[0], a.flags),
  ayuda: async () => ayuda(),
};

async function main(): Promise<void> {
  const args = parsearArgs(process.argv.slice(2));
  const comando = args.comando === '' ? 'ayuda' : args.comando;
  const correr = COMANDOS[comando];
  if (!correr) {
    linea(`No conozco el comando «${comando}».`);
    ayuda();
    throw new Error(`comando desconocido: ${comando}`);
  }
  await correr(args);
}

// Sólo corre cuando es el punto de entrada (así los tests pueden importarlo).
const ES_ENTRADA = process.argv[1] ? basename(process.argv[1]).replace(/\.(ts|js|mjs)$/, '') === 'manual' : false;
if (ES_ENTRADA) {
  main().catch((err) => {
    console.error(`\n✖ ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  });
}

export { estado, siguiente, cargar, cargarCarpeta, archivar, cerrar, crear };
