// Las fotos que la familia subió por capítulo (tabla `fotos`, la escribe la
// web — spec docs/panel-usuario.md §6.3). La principal abre el capítulo, las
// demás lo cierran en su orden. Se bajan del bucket privado y se embeben
// como data URI: el PDF se imprime desde un HTML autocontenido, y el lector
// online carga ese mismo HTML.
//
// Original sin recomprimir (la resolución la valida la web al subir): el
// impreso necesita los píxeles. Una foto que no baja no frena el libro — se
// avisa y se omite.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Foto } from '../db.js';

/** El punto de la foto que tiene que quedar a la vista al recortarla al marco (0..1 por eje). */
export type Foco = { x: number; y: number };
export const FOCO_CENTRO: Foco = { x: 0.5, y: 0.5 };

/** `object-position` para `object-fit: cover`: el punto (0..1) que queda a la vista. Sin foco, el centro. */
export function estiloFoco(foco: Foco | undefined): string {
  const f = foco ?? FOCO_CENTRO;
  return `object-position: ${Math.round(f.x * 100)}% ${Math.round(f.y * 100)}%`;
}

/** Dónde va la principal del capítulo: `arriba` = página propia después de la
 *  portadilla (como siempre); `abajo` = dentro de la portadilla, debajo del título. */
export type PosicionApertura = 'arriba' | 'abajo';

export type FotoLibro = { dataUri: string; epigrafe: string | null; foco?: Foco };
export type FotosCapitulo = { apertura: FotoLibro | null; posicionApertura?: PosicionApertura; cierre: FotoLibro[] };
export type FotosDelLibro = {
  porCapitulo: Map<string, FotosCapitulo>;
  porId: Map<string, FotoLibro>;
};

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Formatos que Chromium (el que imprime el PDF) no decodifica: una foto así
 * embebida sale como una página en blanco. La web ya no las acepta al subir;
 * las que entraron antes se saltean acá.
 */
const EXTENSIONES_SIN_SOPORTE = new Set(['heic', 'heif']);

function extensionDeRuta(ruta: string): string {
  return ruta.split('.').pop()?.toLowerCase() ?? '';
}

export function mimeDeRuta(ruta: string): string {
  return MIME_POR_EXTENSION[extensionDeRuta(ruta)] ?? 'image/jpeg';
}

/**
 * `fotos.foco` viene como jsonb que escribe la web; acá se vuelve un par de
 * números seguros. Cualquier cosa que no sea `{x, y}` numérico → el centro
 * (lo de siempre); fuera de 0..1 se recorta al borde. Nunca tira: un foco
 * raro no puede frenar un libro.
 */
export function normalizarFoco(crudo: unknown): Foco {
  if (typeof crudo !== 'object' || crudo === null) return { ...FOCO_CENTRO };
  const { x, y } = crudo as { x?: unknown; y?: unknown };
  if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) return { ...FOCO_CENTRO };
  const acotar = (v: number) => Math.min(1, Math.max(0, v));
  return { x: acotar(x), y: acotar(y) };
}

function normalizarPosicion(cruda: unknown): PosicionApertura {
  return cruda === 'abajo' ? 'abajo' : 'arriba';
}

/**
 * Cotas de lo que se embebe en el HTML. Cada foto va entera como data URI
 * (base64 pesa un tercio más que el original), y Chromium tiene que sostener
 * todo el documento en memoria para paginar e imprimir: una foto de 40 MB o
 * un libro con 200 MB de fotos lo tumban. Lo que pasa la cota se omite con
 * aviso; achicar las fotos al subirlas es el siguiente paso de la web.
 */
export const LIMITE_BYTES_FOTO = 8 * 1024 * 1024;
export const LIMITE_BYTES_TOTAL = 60 * 1024 * 1024;

async function bajarFoto(db: SupabaseClient, ruta: string): Promise<Buffer | null> {
  // Todo lo que puede fallar acá (la descarga en sí, o leer el blob) cae en
  // el mismo catch: una foto rota no frena el libro, solo se avisa y se
  // omite — ver el comentario del módulo.
  try {
    const { data, error } = await db.storage.from('audios').download(ruta);
    if (error || !data) throw new Error(error?.message ?? 'sin datos');
    return Buffer.from(await data.arrayBuffer());
  } catch (err) {
    console.warn(`cargarFotos: no se pudo bajar ${ruta} (${(err as Error).message}); la foto se omite.`);
    return null;
  }
}

function comoDataUri(ruta: string, bytes: Buffer): string {
  return `data:${mimeDeRuta(ruta)};base64,${bytes.toString('base64')}`;
}

function enMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function cargarFotos(db: SupabaseClient, narradorId: string): Promise<FotosDelLibro> {
  const { data, error } = await db
    .from('fotos')
    .select('id, narrador_id, capitulo, storage_path, epigrafe, principal, orden, posicion, foco')
    .eq('narrador_id', narradorId)
    .order('orden', { ascending: true });
  if (error) throw new Error(`No se pudieron leer las fotos de ${narradorId}: ${error.message}`);

  const porCapitulo = new Map<string, FotosCapitulo>();
  const porId = new Map<string, FotoLibro>();

  // Se ordena acá por las dudas — no confiar en que la consulta ya vino
  // ordenada. Entre dos principales del mismo capítulo gana la de menor orden.
  const fotosOrdenadas = [...((data ?? []) as Foto[])].sort((a, b) => a.orden - b.orden);
  let bytesEmbebidos = 0;
  for (const foto of fotosOrdenadas) {
    if (EXTENSIONES_SIN_SOPORTE.has(extensionDeRuta(foto.storage_path))) {
      console.warn(`cargarFotos: ${foto.storage_path} es HEIC/HEIF y el navegador no lo decodifica; la foto se omite.`);
      continue;
    }
    const bytes = await bajarFoto(db, foto.storage_path);
    if (bytes === null) continue;
    if (bytes.length > LIMITE_BYTES_FOTO) {
      console.warn(`cargarFotos: ${foto.storage_path} pesa ${enMb(bytes.length)} (tope ${enMb(LIMITE_BYTES_FOTO)}); la foto se omite.`);
      continue;
    }
    if (bytesEmbebidos + bytes.length > LIMITE_BYTES_TOTAL) {
      console.warn(
        `cargarFotos: con ${foto.storage_path} las fotos del libro pasarían ${enMb(LIMITE_BYTES_TOTAL)} ` +
          `(ya van ${enMb(bytesEmbebidos)}); la foto se omite.`
      );
      continue;
    }
    bytesEmbebidos += bytes.length;
    const fotoLibro: FotoLibro = {
      dataUri: comoDataUri(foto.storage_path, bytes),
      epigrafe: foto.epigrafe?.trim() || null,
      foco: normalizarFoco(foto.foco),
    };
    porId.set(foto.id, fotoLibro);

    const capitulo = porCapitulo.get(foto.capitulo) ?? { apertura: null, cierre: [] };
    if (foto.principal && capitulo.apertura === null) {
      capitulo.apertura = fotoLibro;
      // La posición es de la principal; las de cierre la ignoran (CONTRATO).
      capitulo.posicionApertura = normalizarPosicion(foto.posicion);
    } else {
      capitulo.cierre.push(fotoLibro);
    }
    porCapitulo.set(foto.capitulo, capitulo);
  }

  return { porCapitulo, porId };
}
