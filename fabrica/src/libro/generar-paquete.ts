import Anthropic from '@anthropic-ai/sdk';
import { chromium } from 'playwright';
import { cargarConfig } from '../config.js';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../db.js';
import { escribirCapitulo } from './escribir-capitulo.js';
import { construirHtmlLibro } from './plantilla-html.js';
import { generarAudiolibro } from '../audio/audiolibro.js';
import { generarEstructura, type Estructura } from './estructura.js';
import { leerEdicion, aplicarOrdenCapitulos } from './edicion.js';
import { cargarFotos } from './fotos.js';
import { productosDelPedido } from './productos.js';
import { armarNarracionJson } from '../voz/narracion-json.js';
import { crearNarracion, RUTA_NARRACION_JSON } from '../voz/narraciones.js';
import {
  armarMaterial,
  borrarArchivos,
  descargarTextoOpcional,
  extraerTexto,
  formatearNombresCorregidos,
  rutasDeBorradores,
  RUTA_BORRADOR_CAP,
  RUTA_BORRADOR_LIBRO,
  subirTexto,
  type Nombres,
} from './comun.js';

const RUTA_ESTRUCTURA = (narradorId: string) => `${narradorId}/paquete/estructura.json`;
const RUTA_NOMBRES = (narradorId: string) => `${narradorId}/paquete/nombres.json`;
const RUTA_LIBRO_PDF = (narradorId: string) => `${narradorId}/paquete/libro.pdf`;
const RUTA_LIBRO_HTML = (narradorId: string) => `${narradorId}/paquete/libro.html`;

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

/**
 * El paquete completo que se entrega tras el pago: el libro (un capítulo por
 * vez con su voz, después una pasada de editor con el libro entero) en PDF
 * y en HTML, y el audiolibro (intro TTS + sus audios por capítulo). Corre
 * recién cuando la dueña cerró el libro (`narradores.libro_aprobado_at`,
 * lo gatea el worker), así que la edición que se aplica acá (orden de
 * capítulos, título, subtítulo, foto de tapa) ya está congelada. Ante
 * cualquier excepción, marca el pedido `fallido` y loguea — no reintenta
 * solo; alguien tiene que poner el estado de vuelta en `pagado` para que el
 * próximo tick lo tome de nuevo.
 *
 * Si el pedido compró el audiolibro con voz clonada (`extras.audiolibro`,
 * ver productos.ts), el audiolibro no se arma acá: el pedido queda en el
 * buzón `narraciones` con su `narracion.json` y pasa a `esperando_voz`
 * hasta que el worker de la PC de Naza narre los capítulos.
 */
export async function generarPaquete(pedido: { id: string; narrador_id: string; extras: unknown }): Promise<void> {
  const db = obtenerClienteDb();

  try {
    const narradorId = pedido.narrador_id;

    // La estructura la arma el tick al ver al narrador completado. Si la
    // dueña cerró el libro antes de ese tick (o el tick falló), no es motivo
    // para dejar el pedido en 'fallido': FALTA → se arma acá. Pero solo si
    // falta: si el archivo existe y está roto, el parse tira y el pedido
    // cae a 'fallido' con el error a la vista — regenerarla sería pagarle
    // al modelo de nuevo y pisar el archivo sin que nadie se entere.
    const estructuraTexto = await descargarTextoOpcional(db, RUTA_ESTRUCTURA(narradorId));
    const estructura: Estructura = estructuraTexto
      ? (JSON.parse(estructuraTexto) as Estructura)
      : await generarEstructura(narradorId);

    // nombres.json es opcional: la dueña puede no haber revisado nombres
    // (Regla 0 del panel) y a los 30 días el libro se cierra solo. Si el
    // archivo existe pero está roto, el parse tira y el pedido cae a
    // 'fallido' como cualquier otra excepción — eso no es un caso a tolerar.
    const nombresTexto = await descargarTextoOpcional(db, RUTA_NOMBRES(narradorId));
    const nombres: Nombres = nombresTexto ? (JSON.parse(nombresTexto) as Nombres) : { correcciones: [] };

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

    // La edición de la dueña: solo el orden de capítulos, el título, el
    // subtítulo y la foto de tapa (ver edicion.ts — `excluidas` y
    // `correcciones` se ignoran a propósito). Las fotos se bajan enteras y
    // van embebidas en el HTML.
    const edicion = leerEdicion(narrador.edicion);
    const capitulosOrdenados = aplicarOrdenCapitulos(estructura.capitulos, edicion.ordenCapitulos);
    const estructuraFinal: Estructura = { ...estructura, capitulos: capitulosOrdenados };
    const fotos = await cargarFotos(db, narradorId);

    const todosLosOrdenes = [...respuestasPorOrden.keys()].sort((a, b) => a - b);
    const historiaCompleta = armarMaterial(todosLosOrdenes, preguntasPorOrden, respuestasPorOrden);
    const nombresCorregidos = formatearNombresCorregidos(nombres.correcciones);

    // 1a. Un capítulo por vez, con su voz. Cada uno se cachea en Storage
    // apenas se genera (ANTES de los pasos baratos que pueden fallar más
    // adelante: PDF, audiolibro) — si un reintento cae acá, reusa lo que ya
    // pagó en vez de volver a pagarle al modelo por lo mismo. El número de
    // borrador (`i + 1`) sigue el orden FINAL, ya con la edición aplicada:
    // como la edición quedó congelada al cerrar el libro, un reintento ve
    // el mismo orden y reusa los mismos archivos.
    const capitulosTexto: { nombre: string; texto: string }[] = [];
    for (let i = 0; i < estructuraFinal.capitulos.length; i++) {
      const capitulo = estructuraFinal.capitulos[i];
      const rutaBorrador = RUTA_BORRADOR_CAP(narradorId, i + 1);

      const cacheado = await descargarTextoOpcional(db, rutaBorrador);
      let texto: string;
      if (cacheado !== null) {
        texto = cacheado;
      } else {
        const material = armarMaterial(capitulo.ordenes, preguntasPorOrden, respuestasPorOrden);
        texto = await escribirCapitulo(narrador, capitulo.nombre, material, historiaCompleta, nombresCorregidos);
        await subirTexto(db, rutaBorrador, texto);
      }
      capitulosTexto.push({ nombre: capitulo.nombre, texto });
    }

    // 1b. Pasada de editor con el libro entero: coherencia, apertura, cierre,
    // "Sus frases". Mismo checkpoint: se cachea antes del PDF.
    const borrador = capitulosTexto.map((c) => `# ${c.nombre}\n\n${c.texto}`).join('\n\n');
    const rutaBorradorLibro = RUTA_BORRADOR_LIBRO(narradorId);
    const libroCacheado = await descargarTextoOpcional(db, rutaBorradorLibro);
    let libroMarkdown: string;
    if (libroCacheado !== null) {
      libroMarkdown = libroCacheado;
    } else {
      const config = cargarConfig();
      const cliente = new Anthropic({ apiKey: config.anthropicApiKey });
      libroMarkdown = await editarLibro(cliente, borrador);
      await subirTexto(db, rutaBorradorLibro, libroMarkdown);
    }

    // 1c. HTML → Storage (el lector online carga ese mismo archivo) y
    // HTML → PDF (A5, imprenta) → Storage. La foto de tapa que eligió la
    // dueña reemplaza al retrato de siempre en el frontispicio; si el id
    // no está entre las fotos (o no se pudo bajar), queda el retrato.
    const contexto = narrador.contexto as { anioNacimiento?: number } | null | undefined;
    const fotoTapa = edicion.portadaFotoId ? fotos.porId.get(edicion.portadaFotoId) : undefined;
    const html = construirHtmlLibro({
      titulo: estructuraFinal.titulo,
      nombreNarrador: narrador.nombre,
      tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
      anioNacimiento: contexto?.anioNacimiento ?? null,
      fotoUrl: fotoTapa?.dataUri ?? narrador.foto_url,
      indice: estructuraFinal.capitulos.map((c) => c.nombre),
      libroMarkdown,
      fotosPorCapitulo: fotos.porCapitulo,
    });
    await subirHtml(db, narradorId, html);
    await generarPdf(db, narradorId, html);

    // 2. Voz clonada: el audiolibro lo narra el worker de la PC de Naza, no
    // esta fábrica. Se le deja narracion.json (los capítulos en el orden
    // final, en texto plano — lo que se escribió en borrador_cap_NN.md, ya
    // en memoria) y la fila en el buzón `narraciones`; el pedido queda
    // `esperando_voz` con el PDF cargado y sin `audiolibro_paths` (eso
    // llega cuando la fábrica ensambla la voz). El título es el de tapa si
    // la dueña puso uno; si no, el de la estructura.
    if (productosDelPedido(pedido.extras).audiolibro === 'clonada') {
      const narracion = armarNarracionJson({
        narradorId,
        pedidoId: pedido.id,
        titulo: edicion.titulo ?? estructuraFinal.titulo,
        capitulos: capitulosTexto.map((c) => ({ nombre: c.nombre, markdown: c.texto })),
      });
      await subirTexto(db, RUTA_NARRACION_JSON(narradorId), JSON.stringify(narracion, null, 2), 'application/json');
      await crearNarracion(db, { narradorId, pedidoId: pedido.id });

      const { error: errorEsperando } = await db
        .from('pedidos')
        .update({ estado: 'esperando_voz', libro_pdf_path: RUTA_LIBRO_PDF(narradorId) })
        .eq('id', pedido.id);
      if (errorEsperando) throw new Error(`No se pudo actualizar el pedido ${pedido.id}: ${errorEsperando.message}`);

      // Los borradores NO se borran acá: todavía no se entregó nada. Si la
      // narración queda `fallida` para siempre (sin consentimiento, pocos
      // minutos de voz), el arreglo a mano es volver el pedido a `pagado`
      // con `extras.audiolibro = "real"` — y ese reintento tiene que reusar
      // los borradores, no pagarle al modelo de nuevo. Los borra
      // `ensamblarNarracionesListas` (worker.ts) recién al entregar.
      return;
    }

    // 3. Audiolibro: un mp3 por capítulo (en el orden final) + completo.
    const { data: archivosNarrador, error: errorArchivos } = await db.storage.from('audios').list(narradorId);
    if (errorArchivos) throw new Error(`No se pudo listar los audios de ${narradorId}: ${errorArchivos.message}`);
    const nombresArchivos = (archivosNarrador ?? []).map((archivo) => archivo.name);

    const audiolibroPaths = await generarAudiolibro(narradorId, estructuraFinal, nombresArchivos);

    // 4. Entregado.
    const { error: errorUpdate } = await db
      .from('pedidos')
      .update({
        estado: 'entregado',
        libro_pdf_path: RUTA_LIBRO_PDF(narradorId),
        audiolibro_paths: audiolibroPaths,
      })
      .eq('id', pedido.id);
    if (errorUpdate) throw new Error(`No se pudo actualizar el pedido ${pedido.id}: ${errorUpdate.message}`);

    // 5. Limpieza.
    await limpiarBorradores(db, narradorId, estructuraFinal.capitulos.length);
  } catch (err) {
    console.error(`generarPaquete: falló para el pedido ${pedido.id}:`, err);
    const { error: errorFallo } = await db.from('pedidos').update({ estado: 'fallido' }).eq('id', pedido.id);
    if (errorFallo) {
      console.error(`generarPaquete: no se pudo marcar 'fallido' el pedido ${pedido.id}:`, errorFallo.message);
    }
  }
}

/**
 * Los borradores eran solo scaffolding para no repagarle al modelo en un
 * reintento — con el pedido ya entregado no hacen falta. Si el borrado
 * falla no es motivo para marcar el pedido 'fallido' (ya se entregó bien),
 * así que se loguea y se sigue. (El camino de voz clonada hace lo mismo
 * desde worker.ts, cuando entrega.)
 */
async function limpiarBorradores(
  db: ReturnType<typeof obtenerClienteDb>,
  narradorId: string,
  cantidadCapitulos: number
): Promise<void> {
  try {
    await borrarArchivos(db, rutasDeBorradores(narradorId, cantidadCapitulos));
  } catch (errorLimpieza) {
    console.error(`generarPaquete: no se pudieron borrar los borradores de ${narradorId}:`, errorLimpieza);
  }
}

async function subirHtml(db: ReturnType<typeof obtenerClienteDb>, narradorId: string, html: string): Promise<void> {
  const { error } = await db.storage.from('audios').upload(RUTA_LIBRO_HTML(narradorId), html, {
    contentType: 'text/html; charset=utf-8',
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir libro.html: ${error.message}`);
}

async function generarPdf(
  db: ReturnType<typeof obtenerClienteDb>,
  narradorId: string,
  html: string
): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // Con las fotos embebidas el HTML puede pesar decenas de MB (cota en
    // fotos.ts): cargarlo y paginarlo lleva más que los 30 s por defecto.
    await page.setContent(html, { timeout: 120_000 });
    // La plantilla pagina el texto con un script embebido (reparte los
    // bloques en lienzos A5 y numera folios); imprimir antes de esa marca
    // sacaría el PDF a medio armar.
    await page.waitForFunction('window.__libroPaginado === true', { timeout: 120_000 });
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
