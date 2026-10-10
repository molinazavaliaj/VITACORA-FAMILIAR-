// El HTML del libro del escritor nuevo con la plantilla de producción. Lo comparten la entrega (libro.html y
// libro.pdf) y la imprenta (libro-imprenta.pdf, con «Su voz» y sus códigos): el mismo libro, la misma tapa.
//
// De la edición de la dueña (narradores.edicion) valen el título y el subtítulo de tapa y la foto de tapa.
// El orden y los títulos de los capítulos NO: la web los guarda con los nombres del guion viejo, y en la V3
// el plan y los títulos los arma el escritor. Tampoco van fotos por capítulo (se buscan por esos mismos
// nombres viejos): solo la de tapa.
import type { SupabaseClient } from '@supabase/supabase-js';
import { construirHtmlLibro } from '../../libro/plantilla-html.js';
import { leerEdicion } from '../../libro/edicion.js';
import { cargarFotos } from '../../libro/fotos.js';
import type { FrasesJson } from '../../libro/frases.js';
import { libroParaPlantilla } from '../salida/plantilla.js';
import type { IdiomaLibro } from '../tipos.js';

export type NarradorParaLibro = { id: string; nombre: string; contexto: unknown; foto_url: string | null; edicion: unknown };

/** El idioma del libro sale del de la entrevista: catalán → 'ca'; castellano (de acá o de España) → 'es'. */
export const idiomaDelLibro = (idiomaEntrevista: string | null | undefined): IdiomaLibro => (idiomaEntrevista === 'ca' ? 'ca' : 'es');

export async function htmlLibroV3(
  db: SupabaseClient,
  a: { narrador: NarradorParaLibro; libroMd: string; idioma: IdiomaLibro; frases?: FrasesJson; urlCliente?: string },
): Promise<string> {
  const p = libroParaPlantilla(a.libroMd);
  const edicion = leerEdicion(a.narrador.edicion);
  const fotoTapa = edicion.portadaFotoId ? (await cargarFotos(db, a.narrador.id)).porId.get(edicion.portadaFotoId) : undefined;
  const contexto = a.narrador.contexto as { anioNacimiento?: unknown } | null | undefined;
  const anio = typeof contexto?.anioNacimiento === 'number' ? contexto.anioNacimiento : null;
  return construirHtmlLibro({
    titulo: p.titulo,
    nombreNarrador: a.narrador.nombre,
    tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
    anioNacimiento: anio,
    fotoUrl: fotoTapa?.dataUri ?? a.narrador.foto_url,
    fotoFoco: fotoTapa?.foco,
    indice: p.indice,
    libroMarkdown: p.libroMarkdown,
    idioma: a.idioma,
    ...(a.frases ? { frases: a.frases } : {}),
    ...(a.urlCliente ? { urlCliente: a.urlCliente } : {}),
  });
}
