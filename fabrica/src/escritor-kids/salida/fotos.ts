// De dónde salen las imágenes del álbum: del disco en los fijos y en el script, de Supabase Storage en producción
// (el bucket `audios`, como cargarFotos de libro/fotos.ts). Una foto que no se puede bajar, que es HEIC o que pesa
// de más no frena el libro: sale sin imagen y se avisa.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LIMITE_BYTES_FOTO, mimeDeRuta } from '../../libro/fotos.js';
import type { FotoKids } from '../material/tipos.js';

export interface FuenteFotos {
  /** La imagen como data URI, o null si no se puede. */
  dataUri(f: FotoKids): Promise<string | null>;
}

const SIN_SOPORTE = /\.(heic|heif)$/i;
const aDataUri = (ruta: string, bytes: Buffer): string | null => (bytes.length > LIMITE_BYTES_FOTO || SIN_SOPORTE.test(ruta) ? null : `data:${mimeDeRuta(ruta)};base64,${bytes.toString('base64')}`);

/** Un fijo: `<dir>/fotos/<nombre del archivo del storage_path>`. */
export function fuenteDeDisco(dir: string, log: (s: string) => void = () => {}): FuenteFotos {
  return {
    async dataUri(f) {
      const p = path.join(dir, 'fotos', path.basename(f.storagePath));
      if (!existsSync(p)) { log(`foto ${f.id}: no está ${p}; sale sin imagen`); return null; }
      return aDataUri(p, readFileSync(p));
    },
  };
}

/** Producción: Supabase Storage, bucket `audios`, con la ruta de la fila de `fotos`. (No se corrió contra la base.) */
export function fuenteDeStorage(db: SupabaseClient, log: (s: string) => void = console.warn): FuenteFotos {
  return {
    async dataUri(f) {
      try {
        const { data, error } = await db.storage.from('audios').download(f.storagePath);
        if (error || !data) throw new Error(error?.message ?? 'sin datos');
        const uri = aDataUri(f.storagePath, Buffer.from(await data.arrayBuffer()));
        if (!uri) log(`foto ${f.id}: ${f.storagePath} es HEIC o pesa de más; sale sin imagen`);
        return uri;
      } catch (err) {
        log(`foto ${f.id}: no se pudo bajar ${f.storagePath} (${(err as Error).message}); sale sin imagen`);
        return null;
      }
    },
  };
}
