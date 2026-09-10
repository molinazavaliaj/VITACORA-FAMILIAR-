import { chromium } from 'playwright';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../db.js';
import { escribirParrafoAnticipo } from './parrafo-anticipo.js';
import { armarMaterial, capituloMarkdownAHtml, escaparHtml, recortarMuestraDeAudio } from './comun.js';

/**
 * El anticipo: lo que ve la familia a la tercera respuesta, antes de decidir
 * la compra. NO es la previsualización (esa lleva el capítulo 1 entero y
 * necesita estructura.json y nombres.json, que a esta altura no existen).
 * Acá hay portada, el índice del libro y un párrafo — y sobre todo el minuto
 * de su voz real, que es lo único que convence y lo único que sale gratis.
 *
 * Rutas propias a propósito: si escribiera en `preview.pdf` o `estructura.json`
 * pisaría los candados de la previsualización y del libro final.
 */
const RUTA_ANTICIPO_PDF = (narradorId: string) => `${narradorId}/paquete/anticipo.pdf`;
const RUTA_ANTICIPO_MUESTRA = (narradorId: string) => `${narradorId}/paquete/anticipo_muestra.mp3`;

/**
 * El índice que se le muestra a la familia: los capítulos del libro, que ya
 * están en las preguntas fijas (`preguntas.capitulo`). Sale de la base, no
 * del modelo — no cuesta un centavo y es el índice de verdad.
 *
 * Las preguntas del narrador (adaptativas y reemplazos) quedan afuera: son de
 * su rama y a la tercera respuesta todavía no existen.
 */
export function indiceTentativo(preguntas: Pick<Pregunta, 'narrador_id' | 'capitulo'>[]): string[] {
  const capitulos: string[] = [];
  for (const pregunta of preguntas) {
    if (pregunta.narrador_id !== null) continue;
    if (capitulos.includes(pregunta.capitulo)) continue;
    capitulos.push(pregunta.capitulo);
  }
  return capitulos;
}

function construirHtmlAnticipo(opciones: {
  nombre: string;
  capitulos: string[];
  parrafo: string;
}): string {
  const { nombre, capitulos, parrafo } = opciones;
  const indiceHtml = capitulos.map((c) => `<li>${escaparHtml(c)}</li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escaparHtml(nombre)}</title>
<style>
  @page { size: A5; margin: 20mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1c1917; line-height: 1.6; margin: 0; }
  section { page-break-after: always; }
  .portada { text-align: center; padding-top: 32%; }
  .portada h1 { font-size: 26px; font-weight: normal; margin: 0; }
  .portada .pie { margin-top: 18px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #78716c; }
  .indice h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.08em; color: #57534e; }
  .indice ol { padding-left: 20px; }
  .indice li { margin-bottom: 8px; }
  .pagina p { margin: 0 0 16px; text-align: justify; }
  .velado { page-break-after: avoid; text-align: center; padding-top: 40%; font-size: 32px; letter-spacing: 0.4em; color: #a8a29e; }
</style>
</head>
<body>
  <section class="portada">
    <h1>${escaparHtml(nombre)}</h1>
    <p class="pie">El libro de su vida</p>
  </section>
  <section class="indice">
    <h2>Índice</h2>
    <ol>${indiceHtml}</ol>
  </section>
  <section class="pagina">
    ${capituloMarkdownAHtml(parrafo)}
  </section>
  <section class="velado">…</section>
</body>
</html>`;
}

/**
 * Genera el anticipo de un narrador y lo deja en Storage.
 *
 * El orden de subida importa y es el mismo que aprendimos en la
 * previsualización: el audio primero y el PDF último, porque `anticipo.pdf`
 * es el candado que el worker mira para no regenerar. Si el PDF subiera
 * primero y el audio fallara, el narrador quedaría con anticipo sin voz para
 * siempre — el candado ya estaría puesto y nadie reintentaría.
 */
export async function generarAnticipo(narradorId: string): Promise<void> {
  const db = obtenerClienteDb();

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

  const { data: respuestas, error: errorRespuestas } = await db
    .from('respuestas')
    .select('*')
    .eq('narrador_id', narradorId);
  if (errorRespuestas) throw new Error(`No se pudieron leer las respuestas: ${errorRespuestas.message}`);

  const preguntas = (preguntasFijas ?? []) as Pregunta[];
  const respuestasList = (respuestas ?? []) as Respuesta[];

  const preguntasPorOrden = new Map<number, Pregunta>();
  for (const pregunta of preguntas) preguntasPorOrden.set(pregunta.orden, pregunta);

  const respuestasPorOrden = new Map<number, Respuesta[]>();
  for (const respuesta of respuestasList) {
    const lista = respuestasPorOrden.get(respuesta.pregunta_orden) ?? [];
    lista.push(respuesta);
    respuestasPorOrden.set(respuesta.pregunta_orden, lista);
  }

  const ordenes = [...respuestasPorOrden.keys()].sort((a, b) => a - b);
  const material = armarMaterial(ordenes, preguntasPorOrden, respuestasPorOrden);

  // Antes de gastar un centavo: si no hay material, no hay anticipo. El
  // worker vuelve a intentar en el próximo tick, cuando haya respuestas.
  if (material.trim() === '') {
    throw new Error(`El narrador ${narradorId} todavía no tiene material para el anticipo`);
  }

  const parrafo = await escribirParrafoAnticipo(narrador, material);

  const html = construirHtmlAnticipo({
    nombre: narrador.nombre,
    capitulos: indiceTentativo(preguntas),
    parrafo,
  });

  await recortarMuestraDeAudio(db, respuestasList, RUTA_ANTICIPO_MUESTRA(narradorId));
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

    const { error } = await db.storage.from('audios').upload(RUTA_ANTICIPO_PDF(narradorId), pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) throw new Error(`No se pudo subir anticipo.pdf: ${error.message}`);
  } finally {
    await browser.close();
  }
}
