import Anthropic from '@anthropic-ai/sdk';
import { chromium } from 'playwright';
import { cargarConfig } from '../config.js';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../db.js';
import { escribirCapitulo } from './escribir-capitulo.js';
import { construirHtmlLibro } from './plantilla-html.js';
import { generarAudiolibro } from '../audio/audiolibro.js';
import type { Estructura } from './estructura.js';
import { armarMaterial, descargarJson, extraerTexto, formatearNombresCorregidos, type Nombres } from './comun.js';

const RUTA_ESTRUCTURA = (narradorId: string) => `${narradorId}/paquete/estructura.json`;
const RUTA_NOMBRES = (narradorId: string) => `${narradorId}/paquete/nombres.json`;
const RUTA_LIBRO_PDF = (narradorId: string) => `${narradorId}/paquete/libro.pdf`;

const INSTRUCCION_EDITOR = `Revisá coherencia entre capítulos, agregá referencias cruzadas naturales donde ayuden, y escribí la apertura «A mis lectores» y el cierre, ambos en su voz, a partir de toda la historia. Armá también la página «Sus frases»: sus dichos, refranes y muletillas de siempre, tal cual los dice él — los que respondió cuando se le preguntó y los que se le escaparon a lo largo de todas las entrevistas. Devolvé el libro completo en Markdown.`;

/**
 * La pasada de editor: una sola llamada con el libro entero (todos los
 * capítulos ya escritos, concatenados) para que quede coherente entre sí,
 * gane la apertura y el cierre en su voz, y sume la página "Sus frases".
 */
async function editarLibro(cliente: Anthropic, borrador: string): Promise<string> {
  const prompt = `${borrador}\n\n---\n\n${INSTRUCCION_EDITOR}`;

  const stream = cliente.messages.stream({
    model: 'claude-fable-5',
    max_tokens: 64000,
    messages: [{ role: 'user', content: prompt }],
  });

  const mensajeFinal = await stream.finalMessage();
  return extraerTexto(mensajeFinal.content as Array<{ type: string; text?: string }>).trim();
}

type Saludo = { nombre: string; vinculo: string; audio_path: string };

/**
 * El paquete completo que se entrega tras el pago: el libro (un capítulo por
 * vez con su voz, después una pasada de editor con el libro entero) en PDF,
 * y el audiolibro (intro TTS + sus audios por capítulo, más el bonus de
 * saludos). Ante cualquier excepción, marca el pedido `fallido` y loguea —
 * no reintenta solo; alguien tiene que poner el estado de vuelta en
 * `pagado` para que el próximo tick lo tome de nuevo.
 */
export async function generarPaquete(pedido: { id: string; narrador_id: string }): Promise<void> {
  const db = obtenerClienteDb();

  try {
    const narradorId = pedido.narrador_id;

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

    const { data: saludosData, error: errorSaludos } = await db
      .from('saludos')
      .select('*')
      .eq('narrador_id', narradorId);
    if (errorSaludos) throw new Error(`No se pudieron leer los saludos: ${errorSaludos.message}`);
    const saludos = (saludosData ?? []) as Saludo[];

    const todosLosOrdenes = [...respuestasPorOrden.keys()].sort((a, b) => a - b);
    const historiaCompleta = armarMaterial(todosLosOrdenes, preguntasPorOrden, respuestasPorOrden);
    const nombresCorregidos = formatearNombresCorregidos(nombres.correcciones);

    // 1a. Un capítulo por vez, con su voz.
    const capitulosTexto: { nombre: string; texto: string }[] = [];
    for (const capitulo of estructura.capitulos) {
      const material = armarMaterial(capitulo.ordenes, preguntasPorOrden, respuestasPorOrden);
      const texto = await escribirCapitulo(narrador, capitulo.nombre, material, historiaCompleta, nombresCorregidos);
      capitulosTexto.push({ nombre: capitulo.nombre, texto });
    }

    // 1b. Pasada de editor con el libro entero: coherencia, apertura, cierre,
    // "Sus frases".
    const borrador = capitulosTexto.map((c) => `# ${c.nombre}\n\n${c.texto}`).join('\n\n');
    const config = cargarConfig();
    const cliente = new Anthropic({ apiKey: config.anthropicApiKey });
    const libroMarkdown = await editarLibro(cliente, borrador);

    // 1c. HTML → PDF (A5, imprenta) → Storage.
    const contexto = narrador.contexto as { anioNacimiento?: number } | null | undefined;
    const html = construirHtmlLibro({
      titulo: estructura.titulo,
      anioNacimiento: contexto?.anioNacimiento ?? null,
      fotoUrl: narrador.foto_url,
      indice: estructura.capitulos.map((c) => c.nombre),
      libroMarkdown,
      saludos: saludos.map((s) => ({ nombre: s.nombre, vinculo: s.vinculo })),
    });
    await generarPdf(db, narradorId, html);

    // 2. Audiolibro: un mp3 por capítulo + bonus de saludos + completo.
    const { data: archivosNarrador, error: errorArchivos } = await db.storage.from('audios').list(narradorId);
    if (errorArchivos) throw new Error(`No se pudo listar los audios de ${narradorId}: ${errorArchivos.message}`);
    const nombresArchivos = (archivosNarrador ?? []).map((archivo) => archivo.name);

    const audiolibroPaths = await generarAudiolibro(narradorId, estructura, nombresArchivos, saludos);

    // 3. Entregado.
    const { error: errorUpdate } = await db
      .from('pedidos')
      .update({
        estado: 'entregado',
        libro_pdf_path: RUTA_LIBRO_PDF(narradorId),
        audiolibro_paths: audiolibroPaths,
      })
      .eq('id', pedido.id);
    if (errorUpdate) throw new Error(`No se pudo actualizar el pedido ${pedido.id}: ${errorUpdate.message}`);
  } catch (err) {
    console.error(`generarPaquete: falló para el pedido ${pedido.id}:`, err);
    const { error: errorFallo } = await db.from('pedidos').update({ estado: 'fallido' }).eq('id', pedido.id);
    if (errorFallo) {
      console.error(`generarPaquete: no se pudo marcar 'fallido' el pedido ${pedido.id}:`, errorFallo.message);
    }
  }
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

    const { error } = await db.storage.from('audios').upload(RUTA_LIBRO_PDF(narradorId), pdf, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) throw new Error(`No se pudo subir libro.pdf: ${error.message}`);
  } finally {
    await browser.close();
  }
}
