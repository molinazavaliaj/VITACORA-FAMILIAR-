// El libro online (paquete/libro.html y libro.pdf) siempre con el diseño de hoy.
//
// Por qué existe (01/11): el código impreso en la contratapa abre `/voz/<token>`, que muestra el libro.html
// que la fábrica dejó al entregar. Si después cambia el diseño del libro, el online se quedaba con el viejo
// para siempre (al de Imma le pasó: el QR abría la tapa del 14/10 y el impreso era el del 17/10).
//
// Cómo: al arrancar la fábrica (el diseño solo cambia cuando se publica la fábrica), por cada libro V3
// cerrado y ya entregado se vuelve a armar el HTML —sin modelos: el texto es el libro.md del escritor— y se
// compara con el guardado. Si cambió algo (diseño, foto de tapa), se reemplazan el HTML y el PDF.
import type { SupabaseClient } from '@supabase/supabase-js';
import { htmlAPdf } from '../../libro/pdf.js';
import { idioma, trato } from '../lectura.js';
import { htmlLibroV3, type NarradorParaLibro } from './html.js';
import { carpetaDeLaBase, PREFIJO_ESCRITOR } from './libro-v3.js';

export const RUTA_LIBRO_HTML_ONLINE = (narradorId: string): string => `${narradorId}/paquete/libro.html`;
export const RUTA_LIBRO_PDF_ONLINE = (narradorId: string): string => `${narradorId}/paquete/libro.pdf`;

/**
 * El libro.html de un libro ya escrito, armado hoy. null si no tiene libro.md del escritor (no es V3, o todavía
 * no se escribió). `fotoTapa`: un data URI para la tapa en vez de la elegida (solo el script, para una tapa
 * retocada a mano); no toca la edición.
 */
export async function htmlOnlineDe(db: SupabaseClient, narradorId: string, o: { fotoTapa?: string } = {}): Promise<{ nombre: string; html: string } | null> {
  const { data: n, error } = await db.from('narradores').select('id, nombre, contexto, foto_url, edicion, libro_aprobado_at').eq('id', narradorId).maybeSingle();
  if (error || !n) throw new Error(`libro online: no se pudo leer el narrador ${narradorId}: ${error?.message ?? 'no existe'}`);
  const { data: md } = await db.storage.from('audios').download(`${PREFIJO_ESCRITOR(narradorId)}/libro.md`);
  if (!md) return null;
  // Idioma y trato de su material, como al entregar (escribirLibroV3): si no, el HTML saldría distinto sin serlo.
  const { c } = await carpetaDeLaBase(db, narradorId);
  const narrador = (o.fotoTapa
    ? { ...n, edicion: { ...(n.edicion as object | null), portadaFotoId: null }, foto_url: o.fotoTapa }
    : n) as NarradorParaLibro;
  const html = await htmlLibroV3(db, { narrador, libroMd: await md.text(), idioma: idioma(c), trato: trato(c) });
  return { nombre: (n as { nombre: string }).nombre, html };
}

/** Sube el HTML y su PDF al paquete (lo que abren el QR y la descarga de la familia). */
export async function subirLibroOnline(db: SupabaseClient, narradorId: string, html: string, pdf: Uint8Array | Buffer): Promise<void> {
  for (const [ruta, cuerpo, tipo] of [
    [RUTA_LIBRO_HTML_ONLINE(narradorId), html, 'text/html; charset=utf-8'],
    [RUTA_LIBRO_PDF_ONLINE(narradorId), pdf, 'application/pdf'],
  ] as const) {
    const { error } = await db.storage.from('audios').upload(ruta, cuerpo, { contentType: tipo, upsert: true });
    if (error) throw new Error(`libro online: no se pudo subir ${ruta}: ${error.message}`);
  }
}

type Deps = {
  armar: (db: SupabaseClient, narradorId: string) => Promise<{ nombre: string; html: string } | null>;
  pdf: (html: string) => Promise<Uint8Array | Buffer>;
};

/**
 * Pone al día el libro online de cada libro cerrado que ya tiene uno. Devuelve a quiénes se les rehízo.
 * Nunca tira: un libro que falla se anota y se sigue con el resto (se reintenta en el próximo arranque).
 */
export async function ponerAlDiaLibrosOnline(db: SupabaseClient, deps: Deps = { armar: (d, id) => htmlOnlineDe(d, id), pdf: htmlAPdf }): Promise<string[]> {
  const rehechos: string[] = [];
  const { data: cerrados, error } = await db.from('narradores').select('id').not('libro_aprobado_at', 'is', null);
  if (error) {
    console.error('libro online: no se pudieron leer los libros cerrados:', error.message);
    return rehechos;
  }
  for (const { id } of (cerrados ?? []) as { id: string }[]) {
    try {
      // Solo los ya entregados: sin libro.html, el libro lo arma el escritor al entregar.
      const { data: guardado } = await db.storage.from('audios').download(RUTA_LIBRO_HTML_ONLINE(id));
      if (!guardado) continue;
      const hoy = await deps.armar(db, id);
      if (!hoy || hoy.html === (await guardado.text())) continue;
      await subirLibroOnline(db, id, hoy.html, await deps.pdf(hoy.html));
      rehechos.push(hoy.nombre);
      console.log(`libro online: ${hoy.nombre} (${id}) rehecho con el diseño de hoy`);
    } catch (err) {
      console.error(`libro online: no se pudo poner al día el de ${id}:`, err instanceof Error ? err.message : err);
    }
  }
  return rehechos;
}
