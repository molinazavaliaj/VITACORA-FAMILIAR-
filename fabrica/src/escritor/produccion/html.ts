// El HTML del libro del escritor nuevo con la plantilla de producción. Lo comparten la entrega (libro.html y
// libro.pdf) y la imprenta (libro-imprenta.pdf, con «Su voz» y sus códigos): el mismo libro, la misma tapa.
//
// De la edición de la dueña (narradores.edicion) valen el título y la foto de tapa (el subtítulo ya no sale, 13/10).
// Los capítulos los arma el escritor, así que las fotos no van por capítulo: la de tapa va en la tapa y todas las
// demás que subió la familia, en el álbum del final (02/11; la web lo muestra como «álbum · tapa · marcos»).
import type { SupabaseClient } from '@supabase/supabase-js';
import { construirHtmlLibro } from '../../libro/plantilla-html.js';
import { leerEdicion } from '../../libro/edicion.js';
import { cargarFotos, fotosDelAlbum } from '../../libro/fotos.js';
import { procesarFotosConChromium } from '../../libro/preparar-fotos.js';
import type { FrasesJson } from '../../libro/frases.js';
import { libroParaPlantilla } from '../salida/plantilla.js';
import type { IdiomaLibro } from '../tipos.js';

export type NarradorParaLibro = { id: string; nombre: string; contexto: unknown; foto_url: string | null; edicion: unknown; libro_aprobado_at?: string | null };

/** El idioma del libro sale del de la entrevista: catalán → 'ca'; castellano (de acá o de España) → 'es'. */
export const idiomaDelLibro = (idiomaEntrevista: string | null | undefined): IdiomaLibro => (idiomaEntrevista === 'ca' ? 'ca' : 'es');

/** El trato de los textos fijos del libro (13/10): España de tú, acá de vos (como `TRATO` de la ficha). */
export const tratoDelLibro = (idiomaEntrevista: string | null | undefined): 'vos' | 'tu' => (idiomaEntrevista === 'es-ES' || idiomaEntrevista === 'ca' ? 'tu' : 'vos');

export async function htmlLibroV3(
  db: SupabaseClient,
  a: { narrador: NarradorParaLibro; libroMd: string; idioma: IdiomaLibro; trato?: 'vos' | 'tu'; frases?: FrasesJson; urlCliente?: string },
): Promise<string> {
  const p = libroParaPlantilla(a.libroMd);
  const edicion = leerEdicion(a.narrador.edicion);
  const fotos = await cargarFotos(db, a.narrador.id, { procesar: procesarFotosConChromium });
  const fotoTapa = edicion.portadaFotoId ? fotos.porId.get(edicion.portadaFotoId) : undefined;
  const album = fotosDelAlbum(fotos, { tapaId: fotoTapa ? edicion.portadaFotoId : null });
  const contexto = a.narrador.contexto as { anioNacimiento?: unknown } | null | undefined;
  const anio = typeof contexto?.anioNacimiento === 'number' ? contexto.anioNacimiento : null;
  return construirHtmlLibro({
    titulo: p.titulo,
    nombreNarrador: a.narrador.nombre,
    tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
    anioNacimiento: anio,
    ...(a.narrador.libro_aprobado_at ? { anioColofon: new Date(a.narrador.libro_aprobado_at).getUTCFullYear() } : {}),
    fotoUrl: fotoTapa?.dataUri ?? a.narrador.foto_url,
    fotoFoco: fotoTapa?.foco,
    indice: p.indice,
    libroMarkdown: p.libroMarkdown,
    album,
    idioma: a.idioma,
    ...(a.trato ? { trato: a.trato } : {}),
    ...(a.frases ? { frases: a.frases } : {}),
    ...(a.urlCliente ? { urlCliente: a.urlCliente } : {}),
  });
}
