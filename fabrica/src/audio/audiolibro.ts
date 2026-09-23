import { obtenerClienteDb } from '../db.js';

// El audiolibro con voz clonada (voz/ensamblar.ts) deja sus piezas en estas
// rutas. El de los audios crudos (generarAudiolibro) se sacó el 23/09
// (hallazgo 43): elegía los audios por nombre de archivo.
export const RUTA_CAPITULO = (narradorId: string, numero: number) =>
  `${narradorId}/paquete/audiolibro_cap_${String(numero).padStart(2, '0')}.mp3`;
export const RUTA_COMPLETO = (narradorId: string) => `${narradorId}/paquete/audiolibro_completo.mp3`;

export async function descargarAudio(db: ReturnType<typeof obtenerClienteDb>, ruta: string): Promise<Buffer> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error || !data) {
    throw new Error(`No se pudo descargar el audio (${ruta}): ${error?.message ?? 'sin datos'}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Sube una pieza del audiolibro al bucket `audios` (upsert: un reintento pisa la anterior). */
export async function subirMp3(db: ReturnType<typeof obtenerClienteDb>, ruta: string, buffer: Buffer): Promise<void> {
  if (!entraEnStorage(buffer.length)) {
    throw new Error(
      `No entra en Storage: ${ruta} pesa ${enMb(buffer.length)} y el tope por archivo es ${enMb(LIMITE_BYTES_ARCHIVO_STORAGE)}.`
    );
  }
  const { error } = await db.storage.from('audios').upload(ruta, buffer, { contentType: 'audio/mpeg', upsert: true });
  if (error) {
    if (esErrorDeTamano(error.message)) {
      throw new Error(
        `No entra en Storage: ${ruta} pesa ${enMb(buffer.length)} y el tope por archivo es ${enMb(LIMITE_BYTES_ARCHIVO_STORAGE)} (${error.message}).`
      );
    }
    throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
  }
}

/**
 * Tope por archivo de Storage en el plan gratis de Supabase (50 MB). Un
 * audiolibro entero a 128 kbps pasa ese tope a partir de ~50 minutos: el de
 * Joaquín (69 min, 66 MB) tumbó el ensamblado dos veces el 18/09. Los
 * capítulos entran siempre (el más largo anda por 15 MB).
 *
 * El tope vive acá y lo mira TODO lo que sube (`subirMp3` y
 * `subirCompletoSiEntra`): el chequeo suelto solo en el completo fue el que dejó
 * la lección — el próximo archivo grande lo descubría igual de tarde. Se puede
 * ajustar sin tocar código con `LIMITE_MB_ARCHIVO_STORAGE` (por si algún día el
 * plan de Supabase cambia).
 */
export const LIMITE_BYTES_ARCHIVO_STORAGE =
  Math.max(1, Number(process.env.LIMITE_MB_ARCHIVO_STORAGE ?? 50) || 50) * 1024 * 1024;

/** Para los mensajes: "66.3 MB" se lee mejor que 69511577. */
export const enMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** ¿Entra en Storage? Un solo lugar para el tope: lo miran todas las subidas. */
export function entraEnStorage(bytes: number): boolean {
  return bytes <= LIMITE_BYTES_ARCHIVO_STORAGE;
}

/** ¿Es el error de Storage que dice que el archivo no entra? */
export function esErrorDeTamano(mensaje: string): boolean {
  return /exceeded the maximum allowed size|payload too large/i.test(mensaje);
}

/**
 * El mp3 completo es un extra (el panel reproduce por capítulos, y muestra
 * "el audiolibro completo" solo si existe). Si no entra en Storage, se avisa
 * y se entrega sin él: nunca frena una entrega cuya parte cara — la voz —
 * ya está hecha. Devuelve la ruta si quedó subido, `null` si no.
 */
export async function subirCompletoSiEntra(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string,
  buffer: Buffer
): Promise<string | null> {
  if (!entraEnStorage(buffer.length)) {
    console.warn(
      `${ruta}: el audiolibro completo pesa ${enMb(buffer.length)} y el tope por archivo es ${enMb(LIMITE_BYTES_ARCHIVO_STORAGE)}; se entrega solo por capítulos.`
    );
    return null;
  }
  const { error } = await db.storage.from('audios').upload(ruta, buffer, { contentType: 'audio/mpeg', upsert: true });
  if (error) {
    if (esErrorDeTamano(error.message)) {
      console.warn(`${ruta}: Storage rechazó el completo (${error.message}); se entrega solo por capítulos.`);
      return null;
    }
    throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
  }
  return ruta;
}

/** Lo que va a `pedidos.audiolibro_paths`. `completo` falta cuando no entró en Storage. */
export type AudiolibroPaths = { capitulos: string[]; completo?: string };
