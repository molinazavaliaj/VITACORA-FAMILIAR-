// El portón de impresión (3t.26 fase 2; spec docs/superpowers/specs/2026-09-21-logistica-fisica-propuesta.md).
//
// El libro que va a la imprenta NO es el que descarga la familia: lleva además la
// sección «Su voz» —sus mejores frases, cada una con el código que las hace sonar— y
// el código de la contratapa. Esa sección no puede armarse al entregar, porque ahí
// todavía no hay audio recortado ni la familia eligió cuáles quiere.
//
// Cuándo se arma (decisión de Naza, 23/09): **cuando la familia confirma las frases**.
// "Cuando confirma los audios se manda a imprimir todo." No hay espera de días ni un
// botón aparte: la confirmación (`frases.json.confirmado_at`, que escribe el panel) es
// el portón. Antes de esa confirmación el panel le advierte que revise nombres, orden
// de capítulos y frases, porque sale impreso así y no tiene vuelta atrás.
//
// El PDF se sube **aparte** (`libro-imprenta.pdf`): el `libro.pdf` que la familia ya
// descargó no se toca nunca. Si algo falla armando este, lo entregado sigue intacto.
//
// No cuesta modelo: el libro ya está escrito y se reusa el borrador cacheado. Lo único
// que se rehace es el HTML y su PDF.

import { obtenerClienteDb, type Narrador } from '../db.js';
import { construirHtmlLibro } from './plantilla-html.js';
import { htmlAPdf } from './pdf.js';
import { descargarTextoOpcional, RUTA_BORRADOR_LIBRO } from './comun.js';
import { leerEdicion, aplicarOrdenCapitulos, aplicarTitulosCapitulos, ampliarExcluidas, sinOrdenesExcluidas } from './edicion.js';
import { cargarFotos } from './fotos.js';
import { leerFrases } from './publicar-frases.js';
import { urlVozDeNarrador } from './token-voz.js';
import type { Estructura } from './estructura.js';

type Db = ReturnType<typeof obtenerClienteDb>;

export const RUTA_LIBRO_IMPRENTA = (narradorId: string) => `${narradorId}/paquete/libro-imprenta.pdf`;

const RUTA_ESTRUCTURA = (narradorId: string) => `${narradorId}/paquete/estructura.json`;

/**
 * Arma el PDF que va a la imprenta y lo deja en `{narrador}/paquete/libro-imprenta.pdf`.
 *
 * Devuelve `true` si lo armó y `false` si todavía no corresponde —sin frases, sin
 * confirmar, sin libro escrito—. Nunca tira por esos casos: son estados normales de un
 * libro que aún no llegó hasta acá, y quien llama sigue con el próximo narrador.
 */
export async function armarLibroDeImprenta(db: Db, narradorId: string): Promise<boolean> {
  // 1. Las frases, y sobre todo su confirmación: es el portón entero.
  const frases = await leerFrases(db, narradorId);
  if (!frases) {
    console.warn(`imprenta: ${narradorId} no tiene frases.json todavía; no se imprime.`);
    return false;
  }
  if (!frases.confirmado_at) return false;

  // 2. El libro ya escrito. Si no está el borrador, algo se borró: no se reescribe
  // acá (son dólares de modelo y no es el trabajo de este paso), se avisa.
  const libroMarkdown = await descargarTextoOpcional(db, RUTA_BORRADOR_LIBRO(narradorId));
  if (!libroMarkdown) {
    console.error(`imprenta: falta el borrador del libro de ${narradorId}; no se puede armar el de imprenta.`);
    return false;
  }

  const estructuraTexto = await descargarTextoOpcional(db, RUTA_ESTRUCTURA(narradorId));
  if (!estructuraTexto) {
    console.error(`imprenta: falta estructura.json de ${narradorId}; no se puede armar el de imprenta.`);
    return false;
  }
  const estructura = JSON.parse(estructuraTexto) as Estructura;

  const { data: narradorData, error } = await db
    .from('narradores')
    .select('id, nombre, contexto, foto_url, edicion')
    .eq('id', narradorId)
    .maybeSingle();
  if (error || !narradorData) {
    console.error(`imprenta: no se pudo leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
    return false;
  }
  const narrador = narradorData as Narrador;

  // 3. Lo que la dueña editó manda, igual que en el libro entregado: su título de
  // tapa, el orden de los capítulos, los nombres que les puso y los capítulos que
  // quedaron vacíos por lo que excluyó (`generarPaquete` no los escribió).
  const edicion = leerEdicion(narrador.edicion);
  let capitulosDelLibro = estructura.capitulos;
  if (edicion.excluidas.length > 0) {
    const { data: respuestas, error: errorRespuestas } = await db
      .from('respuestas')
      .select('id, pregunta_orden, es_repregunta')
      .eq('narrador_id', narradorId);
    if (errorRespuestas) {
      console.error(`imprenta: no se pudieron leer las respuestas de ${narradorId}: ${errorRespuestas.message}`);
      return false;
    }
    const filas = (respuestas ?? []) as { id: string; pregunta_orden: number; es_repregunta: boolean }[];
    capitulosDelLibro = sinOrdenesExcluidas(estructura.capitulos, filas, ampliarExcluidas(filas, edicion.excluidas));
  }
  const capitulos = aplicarTitulosCapitulos(
    aplicarOrdenCapitulos(capitulosDelLibro, edicion.ordenCapitulos),
    edicion.titulosCapitulos
  );
  const fotos = await cargarFotos(db, narradorId);
  const fotoTapa = edicion.portadaFotoId ? fotos.porId.get(edicion.portadaFotoId) : undefined;
  const contexto = narrador.contexto as { anioNacimiento?: number } | null | undefined;

  const html = await construirHtmlLibro({
    titulo: estructura.titulo,
    nombreNarrador: narrador.nombre,
    tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
    anioNacimiento: contexto?.anioNacimiento ?? null,
    fotoUrl: fotoTapa?.dataUri ?? narrador.foto_url,
    fotoFoco: fotoTapa?.foco,
    indice: capitulos.map((c) => c.nombre),
    libroMarkdown,
    fotosPorCapitulo: fotos.porCapitulo,
    // Lo que distingue a este PDF del entregado: las frases y el destino de sus QR.
    frases,
    urlCliente: urlVozDeNarrador(narradorId),
  });

  const pdf = await htmlAPdf(html);
  const { error: errorSubida } = await db.storage
    .from('audios')
    .upload(RUTA_LIBRO_IMPRENTA(narradorId), pdf, { contentType: 'application/pdf', upsert: true });
  if (errorSubida) throw new Error(`No se pudo subir libro-imprenta.pdf: ${errorSubida.message}`);

  return true;
}
