import { registrarUso } from '../costos.js';
import Anthropic from '@anthropic-ai/sdk';
import { cargarConfig } from '../config.js';
import { obtenerClienteDb, type Narrador, type Pregunta, type Respuesta } from '../db.js';
import { escribirCapitulo } from './escribir-capitulo.js';
import { construirHtmlLibro } from './plantilla-html.js';
import { htmlAPdf } from './pdf.js';
import { generarAudiolibro } from '../audio/audiolibro.js';
import { generarEstructura, type Estructura } from './estructura.js';
import { leerEdicion, aplicarOrdenCapitulos, aplicarTitulosCapitulos } from './edicion.js';
import { cargarFotos } from './fotos.js';
import { armarNarracionJson, type ConectoresNarracion } from '../voz/narracion-json.js';
import { escribirConectores, historiasDelCapitulo } from '../voz/conectores.js';
import { elegirFrases } from './frases.js';
import { publicarFrases } from './publicar-frases.js';
import {
  armarContextoDeTemas,
  armarMaterial,
  borrarArchivos,
  descargarTextoOpcional,
  extraerTexto,
  formatearNombresCorregidos,
  rutasDeBorradores,
  RUTA_BORRADOR_CAP,
  RUTA_BORRADOR_LIBRO,
  RUTA_CONECTORES_CAP,
  subirTexto,
  textoRespuesta,
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
async function editarLibro(cliente: Anthropic, borrador: string, narradorId?: string): Promise<string> {
  const prompt = `${borrador}\n\n---\n\n${INSTRUCCION_EDITOR}`;

  const stream = cliente.messages.stream({
    model: 'claude-fable-5',
    max_tokens: 64000,
    messages: [{ role: 'user', content: prompt }],
  });

  const mensajeFinal = await stream.finalMessage();
  // El costo real del libro se mide llamada por llamada (costos.ts); la
  // pasada de editor es la más cara después de los capítulos.
  if (narradorId) await registrarUso(obtenerClienteDb, narradorId, { modelo: 'claude-fable-5', paso: 'editor', usage: mensajeFinal.usage });
  return extraerTexto(mensajeFinal.content as Array<{ type: string; text?: string }>).trim();
}

/**
 * El paquete completo que se entrega tras el pago: el libro (un capítulo por
 * vez con su voz, después una pasada de editor con el libro entero) en PDF
 * y en HTML, y «Su voz»: las mejores frases del narrador en su voz real, con
 * su audio para escuchar por QR (spec 2026-09-20). Corre
 * recién cuando la dueña cerró el libro (`narradores.libro_aprobado_at`,
 * lo gatea el worker), así que la edición que se aplica acá (orden y
 * títulos de capítulos, título, subtítulo, foto de tapa) ya está
 * congelada. Ante
 * cualquier excepción, marca el pedido `fallido` y loguea — no reintenta
 * solo; alguien tiene que poner el estado de vuelta en `pagado` para que el
 * próximo tick lo tome de nuevo.
 *
 * «Su voz» no espera a nadie: la fábrica deja `frases.json` y el pedido de corte, y el libro se
 * entrega igual. El worker de la PC de música corta los audios reales (no narra nada) y completa el
 * mismo archivo; mientras falte alguno, el panel dice que se está preparando.
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

    // La edición de la dueña: solo el orden de capítulos, el título de cada
    // capítulo, el título, el subtítulo y la foto de tapa (ver edicion.ts —
    // `excluidas` y `correcciones` se ignoran a propósito). Las fotos se
    // bajan enteras y van embebidas en el HTML.
    //
    // De acá en adelante `capitulo.nombre` es el título que va al libro (el
    // elegido, o el del guion si no lo renombró): lo ve el escritor, la
    // plantilla, la intro TTS y narracion.json. El nombre del guion queda en
    // `nombreGuion` solo para las fotos, que se cargan con esa clave.
    const edicion = leerEdicion(narrador.edicion);
    const capitulosOrdenados = aplicarTitulosCapitulos(
      aplicarOrdenCapitulos(estructura.capitulos, edicion.ordenCapitulos),
      edicion.titulosCapitulos
    );
    const estructuraFinal: Estructura = { ...estructura, capitulos: capitulosOrdenados };
    const fotos = await cargarFotos(db, narradorId);
    // La plantilla busca las fotos por el título que encabeza cada capítulo
    // en el markdown (`# Los hermanos`), así que se re-clavan del nombre del
    // guion al título final. Un capítulo sin renombrar queda igual.
    const fotosPorCapitulo = new Map(
      capitulosOrdenados.flatMap((c) => {
        const delCapitulo = fotos.porCapitulo.get(c.nombreGuion);
        return delCapitulo ? [[c.nombre, delCapitulo] as const] : [];
      })
    );

    const todosLosOrdenes = [...respuestasPorOrden.keys()].sort((a, b) => a - b);
    const historiaCompleta = armarMaterial(todosLosOrdenes, preguntasPorOrden, respuestasPorOrden);
    const nombresCorregidos = formatearNombresCorregidos(nombres.correcciones);

    // La marca `tema_de_orden` (la escribe el entrevistador cuando el narrador
    // contesta una pregunta y cuenta una historia de otro tema): el recuerdo se
    // SUMA al capítulo de su tema, y en el capítulo donde lo contó queda la
    // aclaración de a dónde va. Los números salen de `estructuraFinal` —el orden
    // FINAL, el que ve el escritor y el que sale impreso—, no de
    // `estructura.json`. Si las columnas todavía no existen (migración sin
    // aplicar) no hay marcas y todo sale exactamente como antes.
    const temasDelLibro = armarContextoDeTemas(estructuraFinal.capitulos, respuestasPorOrden);

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
        const material = armarMaterial(capitulo.ordenes, preguntasPorOrden, respuestasPorOrden, temasDelLibro);
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
      libroMarkdown = await editarLibro(cliente, borrador, narradorId);
      await subirTexto(db, rutaBorradorLibro, libroMarkdown);
    }

    // 1c. HTML → Storage (el lector online carga ese mismo archivo) y
    // HTML → PDF (A5, imprenta) → Storage. La foto de tapa que eligió la
    // dueña reemplaza al retrato de siempre en el frontispicio; si el id
    // no está entre las fotos (o no se pudo bajar), queda el retrato.
    const contexto = narrador.contexto as { anioNacimiento?: number } | null | undefined;
    const fotoTapa = edicion.portadaFotoId ? fotos.porId.get(edicion.portadaFotoId) : undefined;
    const html = await construirHtmlLibro({
      titulo: estructuraFinal.titulo,
      nombreNarrador: narrador.nombre,
      tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
      anioNacimiento: contexto?.anioNacimiento ?? null,
      fotoUrl: fotoTapa?.dataUri ?? narrador.foto_url,
      fotoFoco: fotoTapa?.foco,
      indice: estructuraFinal.capitulos.map((c) => c.nombre),
      libroMarkdown,
      fotosPorCapitulo,
    });
    await subirHtml(db, narradorId, html);
    await generarPdf(db, narradorId, html);

    // 2. Su voz: las mejores frases del narrador, en su voz real (spec 2026-09-20). La fábrica las
    // elige leyendo el libro que acaba de escribir —la página «Sus frases» y las citas de cada
    // capítulo, solo las que él dijo tal cual— y deja `frases.json` + el pedido de corte en el
    // paquete. El audio lo corta el worker de la PC de música sobre los audios reales, sin narrar
    // nada. El libro NO espera: sigue de largo y se entrega en el paso 4, con o sin las frases
    // cortadas (si el modelo se cae quedan las alternativas y el pedido igual: nadie se queda sin
    // libro, y el panel dice "Su voz se está preparando" hasta que estén todos los audios).
    const frases = await elegirFrases(new Anthropic({ apiKey: cargarConfig().anthropicApiKey }), {
      narradorId,
      pedidoId: pedido.id,
      nombre: narrador.nombre,
      libroMarkdown,
      capitulos: estructuraFinal.capitulos.map((capitulo, i) => ({
        nombre: capitulo.nombre,
        numero: i + 1,
        material: capitulo.ordenes.flatMap((orden) =>
          (respuestasPorOrden.get(orden) ?? []).map((r) => ({
            orden,
            respuestaId: r.id,
            audioPath: r.audio_path,
            texto: textoRespuesta(r) ?? '',
            reserva: { reservada: r.reservada, reservado_tramo: r.reservado_tramo },
          }))
        ),
      })),
    });
    await publicarFrases(db, frases);

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
 * Los capítulos como los quiere narracion.json v2: para cada uno (mismo
 * índice en `capitulos` y en `capitulosTexto`, los dos en el orden FINAL),
 * las historias con audio y —si hay alguna— los conectores escritos en su
 * voz. Los conectores se cachean en Storage igual que los borradores
 * (`conectores_cap_NN.json`, numerado por el orden final): un reintento los
 * reusa sin llamar al modelo, y se borran con los borradores al entregar.
 * Un capítulo sin audio no lleva conectores: se narra entero, clonado.
 *
 * Queda sin uso desde el pivote a «Su voz» (spec 2026-09-20): no se borra porque hay narraciones
 * encoladas y el worker todavía lee narracion.json; si en unas semanas no lo usa nadie, se va junto
 * con `voz/narraciones.ts`.
 */
export async function armarCapitulosParaNarrar(
  db: ReturnType<typeof obtenerClienteDb>,
  narrador: Narrador,
  narradorId: string,
  args: {
    capitulos: Estructura['capitulos'];
    capitulosTexto: { nombre: string; texto: string }[];
    preguntasPorOrden: Map<number, Pregunta>;
    respuestasPorOrden: Map<number, Respuesta[]>;
  }
): Promise<Parameters<typeof armarNarracionJson>[0]['capitulos']> {
  let cliente: Anthropic | undefined;
  const resultado: Parameters<typeof armarNarracionJson>[0]['capitulos'] = [];

  for (let i = 0; i < args.capitulos.length; i++) {
    const capitulo = args.capitulos[i];
    const { nombre, texto } = args.capitulosTexto[i];
    const historias = historiasDelCapitulo(capitulo.ordenes, args.preguntasPorOrden, args.respuestasPorOrden);
    if (historias.length === 0) {
      resultado.push({ nombre, markdown: texto });
      continue;
    }

    const rutaConectores = RUTA_CONECTORES_CAP(narradorId, i + 1);
    const cacheado = await descargarTextoOpcional(db, rutaConectores);
    let conectores: ConectoresNarracion;
    if (cacheado !== null) {
      conectores = JSON.parse(cacheado) as ConectoresNarracion;
    } else {
      cliente ??= new Anthropic({ apiKey: cargarConfig().anthropicApiKey });
      conectores = await escribirConectores(cliente, {
        nombre: narrador.nombre,
        capitulo: nombre,
        textoCapitulo: texto,
        historias: historias.map((h) => ({ pregunta: h.pregunta, texto: h.texto })),
      });
      await subirTexto(db, rutaConectores, JSON.stringify(conectores, null, 2), 'application/json');
    }
    resultado.push({ nombre, markdown: texto, historias, conectores });
  }

  return resultado;
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
  // El HTML → PDF vive en `pdf.ts`: lo comparten este camino y el del libro de
  // imprenta (`imprenta.ts`), que es el mismo libro con la sección «Su voz».
  const pdf = await htmlAPdf(html);
  const { error } = await db.storage.from('audios').upload(RUTA_LIBRO_PDF(narradorId), pdf, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir libro.pdf: ${error.message}`);
}
