// El libro para Bookmundo de un narrador: junta lo que ya está en la base (el libro escrito, la tapa que
// eligió la dueña, el idioma, las frases confirmadas) y deja en Storage, en `{narrador}/bookmundo/`:
//   interior-168x240.pdf · cubierta.png · cubierta-GUIAS-no-subir.png · informe.txt
// No cuesta modelo: el libro ya está escrito. No sube nada a Bookmundo (no tienen API): una persona lo baja,
// lee el informe y lo sube a mano. Lo llaman la entrega del libro (libro-v3.ts) y el portón de imprenta
// (imprenta.ts, cuando la familia confirma las frases y el interior suma «Su voz»).
import type { SupabaseClient } from '@supabase/supabase-js';
import { descargarTextoOpcional, RUTA_BORRADOR_LIBRO } from '../comun.js';
import { leerEdicion, aplicarOrdenCapitulos, aplicarTitulosCapitulos } from '../edicion.js';
import { cargarFotos } from '../fotos.js';
import type { FrasesJson } from '../frases.js';
import type { LenguaLibro } from '../plantilla-html.js';
import { urlVozDeNarrador } from '../token-voz.js';
import type { Estructura } from '../estructura.js';
import { libroParaPlantilla } from '../../escritor/salida/plantilla.js';
import { idiomaDelLibro, tratoDelLibro } from '../../escritor/produccion/html.js';
import { armarLibroBookmundo, ARCHIVOS_BOOKMUNDO, type DatosLibro, type LibroBookmundo } from './armar.js';

export const CARPETA_BOOKMUNDO = (narradorId: string): string => `${narradorId}/bookmundo`;
const RUTA_LIBRO_MD_V3 = (narradorId: string): string => `${narradorId}/escritor/libro.md`;
const RUTA_ESTRUCTURA = (narradorId: string): string => `${narradorId}/paquete/estructura.json`;

/**
 * Arma y sube el libro para Bookmundo. Devuelve el resultado, o null si el narrador todavía no tiene libro
 * escrito (estado normal: no tira por eso). Tira si falla Chromium o Storage: quien llama decide.
 */
export async function armarBookmundoDeNarrador(db: SupabaseClient, narradorId: string, o: { frases?: FrasesJson } = {}): Promise<LibroBookmundo | null> {
  const { data: n, error } = await db.from('narradores').select('id, nombre, contexto, foto_url, edicion').eq('id', narradorId).maybeSingle();
  if (error || !n) throw new Error(`bookmundo: no se pudo leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
  const narrador = n as { id: string; nombre: string; contexto: unknown; foto_url: string | null; edicion: unknown };
  const edicion = leerEdicion(narrador.edicion);
  const fotos = await cargarFotos(db, narradorId);
  const fotoTapa = edicion.portadaFotoId ? fotos.porId.get(edicion.portadaFotoId) : undefined;
  const contexto = narrador.contexto as { anioNacimiento?: unknown } | null | undefined;
  const anio = typeof contexto?.anioNacimiento === 'number' ? contexto.anioNacimiento : null;
  const urlVoz = urlVozDeNarrador(narradorId);

  let libro: DatosLibro;
  let lengua: LenguaLibro;
  const libroV3 = await descargarTextoOpcional(db, RUTA_LIBRO_MD_V3(narradorId));
  if (libroV3 !== null) {
    // El escritor nuevo: idioma y trato de la entrevista; sin fotos por capítulo (escritor/produccion/html.ts).
    const { data: e } = await db.from('entrevistas_v3').select('idioma').eq('narrador_id', narradorId).maybeSingle();
    const idiomaEntrevista = (e as { idioma?: string } | null)?.idioma;
    const idioma = idiomaDelLibro(idiomaEntrevista);
    const trato = tratoDelLibro(idiomaEntrevista);
    lengua = idioma === 'ca' ? 'ca' : trato === 'tu' ? 'es-ES' : 'es-AR';
    const p = libroParaPlantilla(libroV3);
    libro = {
      titulo: p.titulo, nombreNarrador: narrador.nombre, tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
      anioNacimiento: anio, indice: p.indice, libroMarkdown: p.libroMarkdown, idioma, trato,
    };
  } else {
    // El libro viejo: borrador y estructura del paquete, con el orden, los títulos y las fotos de la dueña.
    const borrador = await descargarTextoOpcional(db, RUTA_BORRADOR_LIBRO(narradorId));
    const estructuraTexto = await descargarTextoOpcional(db, RUTA_ESTRUCTURA(narradorId));
    if (!borrador || !estructuraTexto) return null;
    const estructura = JSON.parse(estructuraTexto) as Estructura;
    const capitulos = aplicarTitulosCapitulos(aplicarOrdenCapitulos(estructura.capitulos, edicion.ordenCapitulos), edicion.titulosCapitulos);
    lengua = 'es-AR';
    libro = {
      titulo: estructura.titulo, nombreNarrador: narrador.nombre, tapa: { titulo: edicion.titulo, subtitulo: edicion.subtitulo },
      anioNacimiento: anio, indice: capitulos.map((c) => c.nombre), libroMarkdown: borrador, fotosPorCapitulo: fotos.porCapitulo,
    };
  }
  if (o.frases) Object.assign(libro, { frases: o.frases, urlCliente: urlVoz });

  const r = await armarLibroBookmundo(libro, {
    nombreTapa: edicion.titulo ?? narrador.nombre,
    nombreNarrador: narrador.nombre,
    lengua,
    // La foto original que eligió la familia, nunca retocada por IA (la cara del narrador no sale de una IA).
    foto: fotoTapa?.dataUri ?? narrador.foto_url,
    fotoPosicion: fotoTapa?.foco ? `${Math.round(fotoTapa.foco.x * 100)}% ${Math.round(fotoTapa.foco.y * 100)}%` : undefined,
    urlQr: urlVoz,
  });

  const carpeta = CARPETA_BOOKMUNDO(narradorId);
  const subir = async (archivo: string, cuerpo: Buffer | string, tipo: string) => {
    const { error: e } = await db.storage.from('audios').upload(`${carpeta}/${archivo}`, cuerpo, { contentType: tipo, upsert: true });
    if (e) throw new Error(`bookmundo: no se pudo subir ${carpeta}/${archivo}: ${e.message}`);
  };
  await subir(ARCHIVOS_BOOKMUNDO.interior, r.interior, 'application/pdf');
  await subir(ARCHIVOS_BOOKMUNDO.cubierta, r.cubierta.png, 'image/png');
  await subir(ARCHIVOS_BOOKMUNDO.guias, r.cubierta.guias, 'image/png');
  await subir(ARCHIVOS_BOOKMUNDO.informe, r.informe, 'text/plain; charset=utf-8');
  console.log(`bookmundo ${narradorId}: ${r.informeInterior.paginas} págs, ${r.ok ? 'listo para subir' : 'CON ERRORES (ver informe.txt)'}`);
  return r;
}

/** Para la entrega y el portón: nunca frena lo que ya se entregó. */
export async function armarBookmundoSinFrenar(db: SupabaseClient, narradorId: string, o: { frases?: FrasesJson } = {}): Promise<void> {
  try {
    await armarBookmundoDeNarrador(db, narradorId, o);
  } catch (err) {
    console.error(`bookmundo ${narradorId}: no salió (el libro se entrega igual):`, err instanceof Error ? err.message : err);
  }
}
