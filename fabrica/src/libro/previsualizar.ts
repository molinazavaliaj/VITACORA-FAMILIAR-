import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../db.js';
import { escribirCapitulo } from './escribir-capitulo.js';
import type { Estructura } from './estructura.js';

const execFileAsync = promisify(execFile);

export type Nombres = { correcciones: { original: string; corregido: string }[] };

const RUTA_ESTRUCTURA = (narradorId: string) => `${narradorId}/paquete/estructura.json`;
const RUTA_NOMBRES = (narradorId: string) => `${narradorId}/paquete/nombres.json`;
const RUTA_PREVIEW_PDF = (narradorId: string) => `${narradorId}/paquete/preview.pdf`;
const RUTA_MUESTRA_AUDIO = (narradorId: string) => `${narradorId}/paquete/muestra_audiolibro.mp3`;

function textoRespuesta(r: Pick<Respuesta, 'transcripcion' | 'texto_directo'>): string | null {
  const texto = r.transcripcion?.trim() || r.texto_directo;
  return texto && texto.trim() !== '' ? texto : null;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Formatea las correcciones de nombres para el prompt del capítulo:
 * "original → corregido", una por línea. Vacío → "(sin correcciones)" (el
 * prompt igual necesita algo ahí para no confundir al modelo).
 */
export function formatearNombresCorregidos(correcciones: Nombres['correcciones']): string {
  if (correcciones.length === 0) return '(sin correcciones)';
  return correcciones.map((c) => `${c.original} → ${c.corregido}`).join('\n');
}

/**
 * Arma el bloque "P: ... / R: ..." para un conjunto de órdenes de pregunta,
 * en el orden dado. Se usa tanto para el material de un capítulo (subset de
 * órdenes) como para "la historia completa" (todos los órdenes).
 */
export function armarMaterial(
  ordenes: number[],
  preguntasPorOrden: Map<number, Pick<Pregunta, 'texto'>>,
  respuestasPorOrden: Map<number, Pick<Respuesta, 'transcripcion' | 'texto_directo'>[]>
): string {
  const bloques: string[] = [];
  for (const orden of ordenes) {
    const pregunta = preguntasPorOrden.get(orden);
    const respuestas = respuestasPorOrden.get(orden) ?? [];
    for (const respuesta of respuestas) {
      const texto = textoRespuesta(respuesta);
      if (!texto) continue;
      bloques.push(`P: ${pregunta?.texto ?? `Pregunta ${orden}`}\nR: ${texto}`);
    }
  }
  return bloques.join('\n\n');
}

/**
 * Convierte el Markdown mínimo que devuelve el modelo (párrafos + líneas
 * "> cita") a HTML. No es un parser de Markdown general — el prompt solo
 * pide estas dos formas, así que alcanza con esto.
 */
export function capituloMarkdownAHtml(texto: string): string {
  const lineas = texto.split(/\r?\n/);
  const bloques: string[] = [];
  let actual: string[] = [];
  let tipoActual: 'p' | 'blockquote' | null = null;

  function cerrarBloque() {
    if (actual.length === 0) return;
    const contenido = actual.join(' ').trim();
    if (contenido) {
      const etiqueta = tipoActual === 'blockquote' ? 'blockquote' : 'p';
      bloques.push(`<${etiqueta}>${escaparHtml(contenido)}</${etiqueta}>`);
    }
    actual = [];
    tipoActual = null;
  }

  for (const lineaCruda of lineas) {
    const linea = lineaCruda.trim();
    if (linea === '') {
      cerrarBloque();
      continue;
    }
    const esCita = linea.startsWith('>');
    const tipo: 'p' | 'blockquote' = esCita ? 'blockquote' : 'p';
    if (tipoActual !== null && tipoActual !== tipo) cerrarBloque();
    tipoActual = tipo;
    actual.push(esCita ? linea.replace(/^>\s?/, '') : linea);
  }
  cerrarBloque();

  return bloques.join('\n');
}

function construirHtmlPreview(opciones: {
  titulo: string;
  fotoUrl: string | null;
  nombresCapitulos: string[];
  primerCapituloNombre: string;
  primerCapituloHtml: string;
}): string {
  const { titulo, fotoUrl, nombresCapitulos, primerCapituloNombre, primerCapituloHtml } = opciones;

  const indiceHtml = nombresCapitulos.map((nombre) => `<li>${escaparHtml(nombre)}</li>`).join('\n');
  const portadaImg = fotoUrl
    ? `<img src="${escaparHtml(fotoUrl)}" alt="" class="foto-portada" />`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escaparHtml(titulo)}</title>
<style>
  @page { size: A5; margin: 20mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.6; margin: 0; }
  section { page-break-after: always; }
  .portada { text-align: center; padding-top: 30%; }
  .foto-portada { width: 120px; height: 120px; object-fit: cover; border-radius: 50%; margin: 0 auto 24px; display: block; }
  .portada h1 { font-size: 26px; font-weight: normal; margin: 0; }
  .indice h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; }
  .indice ol { padding-left: 20px; }
  .indice li { margin-bottom: 8px; }
  .capitulo h2 { font-size: 22px; font-weight: normal; text-align: center; margin-bottom: 32px; }
  .capitulo p { margin: 0 0 16px; text-align: justify; }
  .capitulo blockquote { margin: 24px 12px; padding-left: 16px; border-left: 3px solid #999; font-style: italic; }
  .velado { page-break-after: avoid; text-align: center; padding-top: 40%; font-size: 32px; letter-spacing: 0.4em; color: #999; }
</style>
</head>
<body>
  <section class="portada">
    ${portadaImg}
    <h1>${escaparHtml(titulo)}</h1>
  </section>
  <section class="indice">
    <h2>Índice</h2>
    <ol>${indiceHtml}</ol>
  </section>
  <section class="capitulo">
    <h2>${escaparHtml(primerCapituloNombre)}</h2>
    ${primerCapituloHtml}
  </section>
  <section class="velado">…</section>
</body>
</html>`;
}

/**
 * Descarga y parsea un JSON de Storage. Tira si no existe o no parsea —
 * ambos casos son "no cumple la precondición" para quien llama.
 */
async function descargarJson<T>(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string,
  descripcion: string
): Promise<T> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error || !data) {
    throw new Error(`No se pudo descargar ${descripcion} (${ruta}): ${error?.message ?? 'sin datos'}`);
  }
  const texto = typeof data.text === 'function' ? await data.text() : String(data);
  try {
    return JSON.parse(texto) as T;
  } catch (err) {
    throw new Error(`${descripcion} (${ruta}) no es JSON válido: ${(err as Error).message}`);
  }
}

/**
 * Genera la previsualización del libro para enamorar a la familia antes de
 * la compra: PDF con portada + índice completo + capítulo 1 + páginas
 * veladas, y una muestra de 60s del audiolibro. Precondición: tienen que
 * existir estructura.json Y nombres.json (recién ahí los nombres propios
 * están corregidos y el capítulo 1 puede escribirse bien).
 */
export async function generarPrevisualizacion(narradorId: string): Promise<void> {
  const db = obtenerClienteDb();

  const estructura = await descargarJson<Estructura>(db, RUTA_ESTRUCTURA(narradorId), 'estructura.json');
  const nombres = await descargarJson<Nombres>(db, RUTA_NOMBRES(narradorId), 'nombres.json');

  const { data: narradorData, error: errorNarrador } = await db
    .from('narradores')
    .select('*')
    .eq('id', narradorId)
    .single();
  if (errorNarrador || !narradorData) {
    throw new Error(`No se pudo leer el narrador ${narradorId}: ${errorNarrador?.message ?? 'sin datos'}`);
  }
  const narrador = narradorData as Narrador;

  const { data: preguntasFijas, error: errorFijas } = await db
    .from('preguntas')
    .select('*')
    .is('narrador_id', null)
    .order('orden', { ascending: true });
  if (errorFijas) throw new Error(`No se pudieron leer las preguntas fijas: ${errorFijas.message}`);

  const { data: preguntasNarrador, error: errorPreguntasNarrador } = await db
    .from('preguntas')
    .select('*')
    .eq('narrador_id', narradorId)
    .order('orden', { ascending: true });
  if (errorPreguntasNarrador) {
    throw new Error(`No se pudieron leer las preguntas del narrador: ${errorPreguntasNarrador.message}`);
  }

  const preguntas: Pregunta[] = [...(preguntasFijas ?? []), ...(preguntasNarrador ?? [])];
  const preguntasPorOrden = new Map<number, Pregunta>();
  for (const pregunta of preguntas) preguntasPorOrden.set(pregunta.orden, pregunta);

  const { data: respuestas, error: errorRespuestas } = await db
    .from('respuestas')
    .select('*')
    .eq('narrador_id', narradorId);
  if (errorRespuestas) throw new Error(`No se pudieron leer las respuestas: ${errorRespuestas.message}`);

  const respuestasList = (respuestas ?? []) as Respuesta[];
  const respuestasPorOrden = new Map<number, Respuesta[]>();
  for (const respuesta of respuestasList) {
    const lista = respuestasPorOrden.get(respuesta.pregunta_orden) ?? [];
    lista.push(respuesta);
    respuestasPorOrden.set(respuesta.pregunta_orden, lista);
  }

  const todosLosOrdenes = [...respuestasPorOrden.keys()].sort((a, b) => a - b);
  const historiaCompleta = armarMaterial(todosLosOrdenes, preguntasPorOrden, respuestasPorOrden);
  const nombresCorregidos = formatearNombresCorregidos(nombres.correcciones);

  const primerCapitulo = estructura.capitulos[0];
  const primerCapituloTexto = primerCapitulo
    ? await escribirCapitulo(
        narrador,
        primerCapitulo.nombre,
        armarMaterial(primerCapitulo.ordenes, preguntasPorOrden, respuestasPorOrden),
        historiaCompleta,
        nombresCorregidos
      )
    : '';

  const html = construirHtmlPreview({
    titulo: estructura.titulo,
    fotoUrl: narrador.foto_url,
    nombresCapitulos: estructura.capitulos.map((c) => c.nombre),
    primerCapituloNombre: primerCapitulo?.nombre ?? estructura.titulo,
    primerCapituloHtml: primerCapituloTexto
      ? capituloMarkdownAHtml(primerCapituloTexto)
      : '<p>Todavía no hay suficiente material para este capítulo.</p>',
  });

  // Orden importa: preview.pdf es el archivo que tick() usa como gate (branch
  // a2 en worker.ts) para decidir "ya está la previsualización, no la
  // regenero". Si lo subiéramos primero y el audio fallara después (ffmpeg
  // ausente, por ejemplo), el narrador quedaría con preview.pdf pero sin
  // muestra_audiolibro.mp3 para siempre — el gate ya estaría cumplido y el
  // tick jamás reintentaría. Por eso el audio va primero y el PDF último:
  // cualquier falla antes del PDF deja todo el proceso reintentable.
  await generarMuestraAudio(db, narradorId, respuestasList);
  await generarPdf(db, narradorId, html);
}

async function generarPdf(
  db: ReturnType<typeof obtenerClienteDb>,
  narradorId: string,
  html: string
): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A5', printBackground: true });

    const { error } = await db.storage.from('audios').upload(RUTA_PREVIEW_PDF(narradorId), pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) throw new Error(`No se pudo subir preview.pdf: ${error.message}`);
  } finally {
    await browser.close();
  }
}

async function generarMuestraAudio(
  db: ReturnType<typeof obtenerClienteDb>,
  narradorId: string,
  respuestas: Respuesta[]
): Promise<void> {
  const primeraConAudio = respuestas
    .filter((r): r is Respuesta & { audio_path: string } => Boolean(r.audio_path))
    .sort((a, b) => a.pregunta_orden - b.pregunta_orden)[0];

  if (!primeraConAudio) {
    console.warn(`generarMuestraAudio: ${narradorId} no tiene ninguna respuesta con audio, se omite la muestra.`);
    return;
  }

  const { data: audioBlob, error: errorAudio } = await db.storage
    .from('audios')
    .download(primeraConAudio.audio_path);
  if (errorAudio || !audioBlob) {
    throw new Error(`No se pudo descargar el audio de muestra (${primeraConAudio.audio_path}): ${errorAudio?.message ?? 'sin datos'}`);
  }

  const dirTemp = await mkdtemp(path.join(tmpdir(), 'vitacora-preview-'));
  const entradaPath = path.join(dirTemp, 'entrada.ogg');
  const salidaPath = path.join(dirTemp, 'muestra.mp3');

  try {
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    await writeFile(entradaPath, buffer);

    await execFileAsync('ffmpeg', ['-y', '-i', entradaPath, '-t', '60', '-acodec', 'libmp3lame', salidaPath]);

    const salidaBuffer = await readFile(salidaPath);

    const { error: errorSubida } = await db.storage
      .from('audios')
      .upload(RUTA_MUESTRA_AUDIO(narradorId), salidaBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });
    if (errorSubida) throw new Error(`No se pudo subir muestra_audiolibro.mp3: ${errorSubida.message}`);
  } finally {
    await rm(dirTemp, { recursive: true, force: true });
  }
}
