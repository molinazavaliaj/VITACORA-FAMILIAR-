import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../db.js';
import { escribirCapitulo } from './escribir-capitulo.js';
import type { Estructura } from './estructura.js';
import {
  armarMaterial,
  capituloMarkdownAHtml,
  descargarJson,
  descargarTextoOpcional,
  escaparHtml,
  formatearNombresCorregidos,
  subirTexto,
  type Nombres,
} from './comun.js';

export { formatearNombresCorregidos, capituloMarkdownAHtml, armarMaterial };
export type { Nombres };

const execFileAsync = promisify(execFile);

const RUTA_ESTRUCTURA = (narradorId: string) => `${narradorId}/paquete/estructura.json`;
const RUTA_NOMBRES = (narradorId: string) => `${narradorId}/paquete/nombres.json`;
const RUTA_PREVIEW_PDF = (narradorId: string) => `${narradorId}/paquete/preview.pdf`;
const RUTA_MUESTRA_AUDIO = (narradorId: string) => `${narradorId}/paquete/muestra_audiolibro.mp3`;
const RUTA_BORRADOR_PREVIEW_CAP1 = (narradorId: string) => `${narradorId}/paquete/borrador_preview_cap1.md`;

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
  let primerCapituloTexto = '';
  if (primerCapitulo) {
    // Checkpoint: si un reintento anterior ya pagó al modelo por el
    // capítulo 1, se reusa en vez de volver a pagar — el paso caro va
    // ANTES que el PDF/audio (los pasos baratos que pueden fallar), y su
    // resultado se cachea apenas se genera.
    const rutaBorrador = RUTA_BORRADOR_PREVIEW_CAP1(narradorId);
    const cacheado = await descargarTextoOpcional(db, rutaBorrador);
    if (cacheado !== null) {
      primerCapituloTexto = cacheado;
    } else {
      primerCapituloTexto = await escribirCapitulo(
        narrador,
        primerCapitulo.nombre,
        armarMaterial(primerCapitulo.ordenes, preguntasPorOrden, respuestasPorOrden),
        historiaCompleta,
        nombresCorregidos
      );
      await subirTexto(db, rutaBorrador, primerCapituloTexto);
    }
  }

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
