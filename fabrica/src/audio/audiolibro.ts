import { obtenerClienteDb } from '../db.js';
import { generarAudioTts } from './tts.js';
import { normalizarAMp3, concatenarMp3s } from './ffmpeg.js';

export type EntradaConcat = { capitulo: string; numero: number; archivos: string[] };

type EstructuraCapitulos = { capitulos: { nombre: string; ordenes: number[] }[] };

/**
 * Los audios de las respuestas de una orden se llaman `dia_NN.ogg`, y si hubo
 * repregunta, `dia_NN_2.ogg`, `dia_NN_3.ogg`... Esta función encuentra, entre
 * los archivos disponibles, los que pertenecen a `orden`, en el orden en que
 * van en el audiolibro (sin sufijo primero, después por sufijo numérico —
 * NO alfabético, para que _10 no quede antes que _2).
 */
function archivosDeOrden(orden: number, archivosDisponibles: string[]): string[] {
  const base = `dia_${String(orden).padStart(2, '0')}`;
  const patron = new RegExp(`^${base}(?:_(\\d+))?\\.ogg$`);

  return archivosDisponibles
    .map((archivo) => {
      const coincidencia = archivo.match(patron);
      if (!coincidencia) return null;
      const sufijo = coincidencia[1] ? Number(coincidencia[1]) : 1;
      return { archivo, sufijo };
    })
    .filter((x): x is { archivo: string; sufijo: number } => x !== null)
    .sort((a, b) => a.sufijo - b.sufijo)
    .map((x) => x.archivo);
}

/**
 * Arma, por capítulo, la lista de archivos de audio a concatenar en el
 * audiolibro — en el orden de las órdenes del capítulo, y dentro de cada
 * orden, respuesta principal primero y repreguntas después. Los órdenes sin
 * ningún audio disponible (respondió por texto) simplemente no aportan
 * archivos — no hace falta "saltarlos" explícitamente, el capítulo puede
 * terminar con `archivos: []` si ninguna de sus órdenes tiene audio.
 *
 * Función pura: no toca Storage ni arma nada del audio en sí — eso lo hace
 * `generarAudiolibro`, que la usa para saber qué descargar.
 */
export function armarListaConcat(
  estructura: EstructuraCapitulos,
  archivosDisponibles: string[]
): EntradaConcat[] {
  return estructura.capitulos.map((capitulo, indice) => ({
    capitulo: capitulo.nombre,
    numero: indice + 1,
    archivos: capitulo.ordenes.flatMap((orden) => archivosDeOrden(orden, archivosDisponibles)),
  }));
}

// Exportadas: el audiolibro con voz clonada (voz/ensamblar.ts) deja sus
// piezas en las mismas rutas — para la web es el mismo producto.
export const RUTA_CAPITULO = (narradorId: string, numero: number) =>
  `${narradorId}/paquete/audiolibro_cap_${String(numero).padStart(2, '0')}.mp3`;
export const RUTA_COMPLETO = (narradorId: string) => `${narradorId}/paquete/audiolibro_completo.mp3`;

function extensionDe(ruta: string): string {
  const punto = ruta.lastIndexOf('.');
  return punto === -1 ? 'ogg' : ruta.slice(punto + 1);
}

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

/**
 * Arma un tramo del audiolibro: intro hablada por TTS + los audios (rutas
 * completas de Storage) en orden, cada uno normalizado en volumen antes de
 * concatenar — si no, la voz de la intro (TTS, siempre parejo) suena a un
 * volumen distinto del audio grabado en un celular. Lo usa también el
 * audiolibro con voz clonada (voz/ensamblar.ts): misma intro, y el cuerpo
 * es el mp3 que narró el worker.
 */
export async function armarSegmento(
  db: ReturnType<typeof obtenerClienteDb>,
  introTexto: string,
  rutasAudio: string[]
): Promise<Buffer> {
  const introMp3 = await generarAudioTts(introTexto);
  const introNormalizado = await normalizarAMp3(introMp3, 'mp3');

  const segmentos = [introNormalizado];
  for (const ruta of rutasAudio) {
    const buffer = await descargarAudio(db, ruta);
    segmentos.push(await normalizarAMp3(buffer, extensionDe(ruta)));
  }

  return concatenarMp3s(segmentos);
}

/**
 * Arma el audiolibro completo: un mp3 por capítulo (intro + sus audios) y
 * la concatenación de todos ellos. Sube cada pieza al bucket `audios` bajo
 * `{narradorId}/paquete/` y devuelve las rutas para guardar en el pedido.
 */
export async function generarAudiolibro(
  narradorId: string,
  estructura: EstructuraCapitulos,
  archivosDisponibles: string[]
): Promise<AudiolibroPaths> {
  const db = obtenerClienteDb();
  const lista = armarListaConcat(estructura, archivosDisponibles);

  const rutasCapitulos: string[] = [];
  const buffersFinal: Buffer[] = [];

  for (const entrada of lista) {
    const buffer = await armarSegmento(
      db,
      `Capítulo ${entrada.numero}: ${entrada.capitulo}`,
      entrada.archivos.map((archivo) => `${narradorId}/${archivo}`)
    );
    const ruta = RUTA_CAPITULO(narradorId, entrada.numero);
    await subirMp3(db, ruta, buffer);
    rutasCapitulos.push(ruta);
    buffersFinal.push(buffer);
  }

  const bufferCompleto = await concatenarMp3s(buffersFinal);
  const rutaCompleto = await subirCompletoSiEntra(db, RUTA_COMPLETO(narradorId), bufferCompleto);

  return rutaCompleto ? { capitulos: rutasCapitulos, completo: rutaCompleto } : { capitulos: rutasCapitulos };
}
