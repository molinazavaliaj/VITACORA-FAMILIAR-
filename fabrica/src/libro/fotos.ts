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

export type FotoLibro = { dataUri: string; epigrafe: string | null };
export type FotosCapitulo = { apertura: FotoLibro | null; cierre: FotoLibro[] };
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

export function mimeDeRuta(ruta: string): string {
  const extension = ruta.split('.').pop()?.toLowerCase() ?? '';
  return MIME_POR_EXTENSION[extension] ?? 'image/jpeg';
}

async function bajarComoDataUri(db: SupabaseClient, ruta: string): Promise<string | null> {
  // Todo lo que puede fallar acá (la descarga en sí, o leer el blob) cae en
  // el mismo catch: una foto rota no frena el libro, solo se avisa y se
  // omite — ver el comentario del módulo.
  try {
    const { data, error } = await db.storage.from('audios').download(ruta);
    if (error || !data) throw new Error(error?.message ?? 'sin datos');
    const bytes = Buffer.from(await data.arrayBuffer());
    return `data:${mimeDeRuta(ruta)};base64,${bytes.toString('base64')}`;
  } catch (err) {
    console.warn(`cargarFotos: no se pudo bajar ${ruta} (${(err as Error).message}); la foto se omite.`);
    return null;
  }
}

export async function cargarFotos(db: SupabaseClient, narradorId: string): Promise<FotosDelLibro> {
  const { data, error } = await db
    .from('fotos')
    .select('id, narrador_id, capitulo, storage_path, epigrafe, principal, orden')
    .eq('narrador_id', narradorId)
    .order('orden', { ascending: true });
  if (error) throw new Error(`No se pudieron leer las fotos de ${narradorId}: ${error.message}`);

  const porCapitulo = new Map<string, FotosCapitulo>();
  const porId = new Map<string, FotoLibro>();

  // Se ordena acá por las dudas — no confiar en que la consulta ya vino
  // ordenada. Entre dos principales del mismo capítulo gana la de menor orden.
  const fotosOrdenadas = [...((data ?? []) as Foto[])].sort((a, b) => a.orden - b.orden);
  for (const foto of fotosOrdenadas) {
    const dataUri = await bajarComoDataUri(db, foto.storage_path);
    if (dataUri === null) continue;
    const fotoLibro: FotoLibro = { dataUri, epigrafe: foto.epigrafe?.trim() || null };
    porId.set(foto.id, fotoLibro);

    const capitulo = porCapitulo.get(foto.capitulo) ?? { apertura: null, cierre: [] };
    if (foto.principal && capitulo.apertura === null) {
      capitulo.apertura = fotoLibro;
    } else {
      capitulo.cierre.push(fotoLibro);
    }
    porCapitulo.set(foto.capitulo, capitulo);
  }

  return { porCapitulo, porId };
}
