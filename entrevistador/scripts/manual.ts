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
 *   adaptativas al orden 26 → cierre al 30.
 *
 * NO manda nada por WhatsApp (no hay API): todo lo que habría salido por
 * WhatsApp se IMPRIME para copiar y pegar. Los `envios` se registran igual,
 * con `wa_message_id = 'manual'`, para que la lógica del módulo (repreguntas,
 * idempotencia del scheduler) siga viendo la misma foto.
 *
 * Uso:
 *   npm run manual -- estado
 *   npm run manual -- siguiente imma                     (--solo-ver para no anotar; --voz para el mp3)
 *   npm run manual -- archivar imma "C:/Users/Naza/Downloads/PTT-20260914-WA0007.ogg"
 *   npm run manual -- cargar imma audios-crudos/imma/dia_03.ogg
 *   npm run manual -- cargar-carpeta imma audios-crudos/imma [--si]
 *   npm run manual -- cerrar imma
 *   npm run manual -- crear --nombre Ciro --le-dicen Ciro --telefono +54... --zona America/Argentina/Buenos_Aires
 */
import { readFileSync, existsSync, statSync, mkdirSync, copyFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Narrador } from '../src/flujo/preguntar.js';
import {
  parsearArgs, slug, ordenDeArchivo, archivoCanonico, proximoOrden, primeraDiferencia,
  mensajeDePregunta, despedida, planDeCarga, esAudio, promptDeTranscripcion, type Args,
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
  transcribirYActualizar: (typeof import('../src/ia/transcribir.js'))['transcribirYActualizar'];
  evaluarRespuesta: (typeof import('../src/ia/cerebro.js'))['evaluarRespuesta'];
  generarPreguntaReemplazo: (typeof import('../src/ia/cerebro.js'))['generarPreguntaReemplazo'];
  personalizarPregunta: (typeof import('../src/ia/personalizar.js'))['personalizarPregunta'];
  memoriaDeCapitulos: (typeof import('../src/ia/resumenes.js'))['memoriaDeCapitulos'];
  guardarRepreguntaEnviada: (typeof import('../src/db/envios.js'))['guardarRepreguntaEnviada'];
  generarPreguntasAdaptativas: (typeof import('../src/ia/adaptativas.js'))['generarPreguntasAdaptativas'];
  generarAudioVoz: (typeof import('../src/ia/voz.js'))['generarAudioVoz'];
  preguntaDeOrden: (typeof import('../src/flujo/preguntar.js'))['preguntaDeOrden'];
  capituloNoAplica: (typeof import('../src/flujo/preguntar.js'))['capituloNoAplica'];
  armarHistoria: (typeof import('../src/db/historia.js'))['armarHistoria'];
  PRIMERA_ADAPTATIVA: (typeof import('../src/ia/adaptativas.js'))['PRIMERA_ADAPTATIVA'];
  ULTIMA_ADAPTATIVA: (typeof import('../src/ia/adaptativas.js'))['ULTIMA_ADAPTATIVA'];
};

let _mods: Promise<Modulos> | null = null;
function modulos(): Promise<Modulos> {
  _mods ??= (async () => {
    const { db } = await import('../src/db/cliente.js');
    const { guardarRespuestaAudio } = await import('../src/db/respuestas.js');
    const { transcribirYActualizar } = await import('../src/ia/transcribir.js');
    const { evaluarRespuesta, generarPreguntaReemplazo } = await import('../src/ia/cerebro.js');
    const { personalizarPregunta } = await import('../src/ia/personalizar.js');
    const { memoriaDeCapitulos } = await import('../src/ia/resumenes.js');
    const { guardarRepreguntaEnviada } = await import('../src/db/envios.js');
    const { generarPreguntasAdaptativas, PRIMERA_ADAPTATIVA, ULTIMA_ADAPTATIVA } = await import('../src/ia/adaptativas.js');
    const { generarAudioVoz } = await import('../src/ia/voz.js');
    const { preguntaDeOrden, capituloNoAplica } = await import('../src/flujo/preguntar.js');
    const { armarHistoria } = await import('../src/db/historia.js');
    return {
      db, guardarRespuestaAudio, transcribirYActualizar, evaluarRespuesta, personalizarPregunta,
      memoriaDeCapitulos, generarPreguntaReemplazo, generarPreguntasAdaptativas, generarAudioVoz, preguntaDeOrden,
      capituloNoAplica, armarHistoria, PRIMERA_ADAPTATIVA, ULTIMA_ADAPTATIVA,
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

const ULTIMA_FIJA = 26; // al completar la 26 se generan las 4 adaptativas (27-30)

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

/** La última orden del guion de este narrador (fija o adaptativa ya generada). */
async function ultimaOrdenDelGuion(narradorId: string): Promise<number> {
  const { db } = await modulos();
  const { data } = await db.from('preguntas').select('orden')
    .or(`narrador_id.eq.${narradorId},narrador_id.is.null`)
    .order('orden', { ascending: false }).limit(1).maybeSingle();
  return (data as { orden?: number } | null)?.orden ?? 0;
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
  const ultima = await ultimaOrdenDelGuion(n.id);

  if (orden > ultima) {
    linea(`Ya está todo: ${n.como_le_dicen} llegó a la orden ${ultima} (la última del guion).`);
    linea(`Cerrá la bitácora: npm run manual -- cerrar ${slug(n.como_le_dicen)}`);
    return;
  }

  let pregunta = await mods.preguntaDeOrden(n.id, orden);
  if (!pregunta && orden >= mods.PRIMERA_ADAPTATIVA && orden <= mods.ULTIMA_ADAPTATIVA) {
    linea(`No hay preguntas 27-30 todavía: llamando al modelo (una llamada, ~USD 0.5)...`);
    await mods.generarPreguntasAdaptativas(n.id);
    pregunta = await mods.preguntaDeOrden(n.id, orden);
  }
  if (!pregunta) throw new Error(`No hay pregunta para la orden ${orden} de ${n.como_le_dicen}.`);

  let texto = pregunta.texto;
  // Misma regla que preguntar.ts: si el capítulo no aplica a esta vida, se reemplaza.
  if (pregunta.narrador_id === null && mods.capituloNoAplica(n.contexto, pregunta.capitulo)) {
    linea(`La orden ${orden} es de «${pregunta.capitulo}» y en esta vida no aplica: generando la pregunta de reemplazo...`);
    const { db } = mods;
    const { data: caps } = await db.from('preguntas').select('capitulo').is('narrador_id', null);
    const capitulos = [...new Set(((caps as { capitulo: string }[] | null) ?? []).map((c) => c.capitulo))]
      .filter((c) => c !== pregunta!.capitulo);
    const nueva = await mods.generarPreguntaReemplazo(
      n.como_le_dicen, await mods.armarHistoria(n.id), capitulos, pregunta.capitulo,
    );
    const { error } = await db.from('preguntas').insert({
      narrador_id: n.id, orden, texto: nueva.texto, capitulo: nueva.capitulo, tipo: 'adaptativa',
    });
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

  const mensaje = mensajeDePregunta(texto);
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
  const avance: Record<string, unknown> = { dia_actual: orden };
  if (n.estado === 'invitado' || n.estado === 'acepto') avance.estado = 'activo';
  await db.from('narradores').update(avance).eq('id', n.id);
  await registrarEnvio(n.id, 'pregunta', orden);
  linea(`Anotado: orden ${orden} enviada a mano (dia_actual = ${orden}). Cuando llegue el audio: npm run manual -- cargar ${slug(n.como_le_dicen)} <archivo>`);
}

/** Copia el audio a la carpeta de crudos con el nombre canónico (respaldo + convención). */
function archivarLocal(n: NarradorFila, ruta: string, orden: number, sufijo: number): string {
  const carpeta = join(CRUDOS, slug(n.como_le_dicen));
  mkdirSync(carpeta, { recursive: true });
  const destino = join(carpeta, archivoCanonico(orden, sufijo));
  if (resolve(destino) !== resolve(ruta)) copyFileSync(ruta, destino);
  return destino;
}

async function cargar(ref: string | undefined, archivo: string | undefined, flags: Args['flags']): Promise<void> {
  if (!archivo) throw new Error('Falta el archivo del audio. Uso: cargar <narrador> <archivo.ogg> [--orden N] [--repregunta]');
  const n = await buscarNarrador(ref);
  const mods = await modulos();
  const ruta = resolverRuta(archivo);
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

  titulo(`Cargando ${basename(ruta)} → ${n.como_le_dicen}, orden ${orden}${esRepregunta ? ' (repregunta)' : ''}`);
  linea(`Pregunta ${orden}: ${pregunta.texto}`);

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

  await trasResponderManual(n, orden, esRepregunta, pregunta.texto, texto, duracionSegundos);
}

/** Los pasos 6-8 de procesar.ts, pero imprimiendo en vez de mandar por WhatsApp. */
async function trasResponderManual(
  n: NarradorFila, orden: number, esRepregunta: boolean, pregunta: string, transcripcion: string, duracionSegundos: number,
): Promise<void> {
  const mods = await modulos();
  const supabase = mods.db;

  if (!esRepregunta) {
    const evaluacion = await mods.evaluarRespuesta(pregunta, transcripcion, duracionSegundos);
    if (!evaluacion.suficiente && evaluacion.repregunta && !(await yaSeRepregunto(n.id, orden))) {
      titulo('El cerebro pide una repregunta — pegala en WhatsApp');
      linea(evaluacion.repregunta);
      await registrarEnvio(n.id, 'repregunta', orden);
      // El texto va al contexto del narrador: es lo que después muestra el panel
      // ("le repreguntamos: …") arriba de la respuesta que llegue.
      await mods.guardarRepreguntaEnviada(n, orden, evaluacion.repregunta);
      linea(`(anotada. Cuando llegue ese audio: npm run manual -- cargar ${slug(n.como_le_dicen)} <archivo> --repregunta --orden ${orden})`);
    } else {
      linea('Respuesta suficiente: sin repregunta.');
    }
  }

  if (orden === ULTIMA_FIJA) {
    linea('Orden 26 completada → generando las 4 preguntas adaptativas 27-30 (una llamada, ~USD 0.5)...');
    await mods.generarPreguntasAdaptativas(n.id);
    linea('Listas: las ves con "npm run manual -- siguiente".');
  }

  await supabase.from('narradores')
    .update({ ultima_respuesta_at: new Date().toISOString(), alerta_silencio: false })
    .eq('id', n.id);

  const ultima = await ultimaOrdenDelGuion(n.id);
  if (orden >= ultima) {
    titulo(`Última pregunta (orden ${ultima}): ${n.como_le_dicen} terminó`);
    linea(despedida(n.como_le_dicen));
    linea();
    linea(`Mandale esa despedida y después: npm run manual -- cerrar ${slug(n.como_le_dicen)}`);
    return;
  }

  linea('Ahora: npm run manual -- siguiente ' + slug(n.como_le_dicen));
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
    await cargar(n.como_le_dicen, p.archivo, { orden: String(p.orden), repregunta: p.sufijo > 1 });
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

async function cerrar(ref: string | undefined): Promise<void> {
  const n = await buscarNarrador(ref);
  const { db } = await modulos();
  const respuestas = await respuestasDe(n.id);
  if (!respuestas.length) throw new Error(`${n.como_le_dicen} no tiene ninguna respuesta: no hay nada que cerrar.`);
  titulo(`Cierre de ${n.como_le_dicen}`);
  linea(`Mandale esto por WhatsApp:`);
  linea();
  linea(despedida(n.como_le_dicen));
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

  titulo(`Narrador creado: ${creado.como_le_dicen}`);
  linea(`  id: ${creado.id}`);
  linea(`  familia: ${(familia as { email: string }).email}`);
  linea(`  estado: ${creado.estado}   ·   modoRapido: ${contexto.modoRapido ? 'sí' : 'no'}   ·   zona: ${fila.zona_horaria}`);
  linea(`  (No hace falta copiarle el guion: las 26 fijas globales se usan solas como plantilla.)`);
  linea();
  linea(`Primera pregunta: npm run manual -- siguiente ${slug(leDicen)}`);
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

  npm run manual -- siguiente <narrador> [--solo-ver] [--voz]
      Imprime el mensaje EXACTO para pegarle al narrador (reconocimiento +
      pregunta del día, con reemplazo si el capítulo no aplica) y lo anota en
      'envios' + avanza dia_actual. --solo-ver no toca la base; --voz te deja
      el mp3 de la pregunta para adjuntarlo a mano.

  npm run manual -- archivar <narrador> <archivo.ogg> [--orden N]
      Copia el audio crudo a audios-crudos/<narrador>/dia_NN.ogg. No toca la base.

  npm run manual -- cargar <narrador> <archivo> [--orden N] [--repregunta]
      El corazón: sube a Storage, inserta la respuesta, transcribe con Whisper,
      evalúa (y te imprime la repregunta si hace falta), genera las adaptativas
      al orden 26 y avisa del cierre al 30.

  npm run manual -- cargar-carpeta <narrador> <carpeta> [--desde N] [--si] [--repregunta]
      Un lote entero: muestra el plan y, con --si, lo carga en orden de llegada.

  npm run manual -- retranscribir <narrador> [--orden N] [--si]
      Vuelve a transcribir lo ya cargado con el contexto de hoy (baja el audio
      original de Storage). Se usa cuando se mejora el glosario o la familia
      completa el árbol familiar. Muestra qué cambió en cada respuesta.

  npm run manual -- cerrar <narrador>
      La despedida final + estado 'completado' (ahí lo toma la fábrica).

  npm run manual -- crear --nombre X --le-dicen Y --telefono +54... [--zona ...] [--nacido 1939]
      [--trato usted|vos] fuerza el trato sin preguntarle al modelo. Si no se
      pasa, lo decide él solo con la ficha la primera vez que le escribimos.

Los audios se guardan como en el audiolibro: dia_07.ogg es la respuesta a la
orden 7; dia_07_2.ogg es la repregunta de ese mismo día.
`);
}

// ── 5. Despacho ────────────────────────────────────────────────────────────
const COMANDOS: Record<string, (a: Args) => Promise<void>> = {
  estado: () => estado(),
  siguiente: (a) => siguiente(a.posicionales[0], a.flags),
  archivar: (a) => archivar(a.posicionales[0], a.posicionales[1], a.flags),
  cargar: (a) => cargar(a.posicionales[0], a.posicionales[1], a.flags),
  'cargar-carpeta': (a) => cargarCarpeta(a.posicionales[0], a.posicionales[1], a.flags),
  retranscribir: (a) => retranscribir(a.posicionales[0], a.flags),
  contexto: (a) => verContexto(a.posicionales[0]),
  resumenes: (a) => verResumenes(a.posicionales[0], a.flags),
  cerrar: (a) => cerrar(a.posicionales[0]),
  crear: (a) => crear(a.flags),
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
