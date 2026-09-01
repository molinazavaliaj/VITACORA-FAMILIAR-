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

const RUTA_CAPITULO = (narradorId: string, numero: number) =>
  `${narradorId}/paquete/audiolibro_cap_${String(numero).padStart(2, '0')}.mp3`;
const RUTA_BONUS = (narradorId: string) => `${narradorId}/paquete/audiolibro_bonus_saludos.mp3`;
const RUTA_COMPLETO = (narradorId: string) => `${narradorId}/paquete/audiolibro_completo.mp3`;

function extensionDe(ruta: string): string {
  const punto = ruta.lastIndexOf('.');
  return punto === -1 ? 'ogg' : ruta.slice(punto + 1);
}

async function descargarAudio(db: ReturnType<typeof obtenerClienteDb>, ruta: string): Promise<Buffer> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error || !data) {
    throw new Error(`No se pudo descargar el audio (${ruta}): ${error?.message ?? 'sin datos'}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

/**
 * Arma un tramo del audiolibro: intro hablada por TTS + los audios (rutas
 * completas de Storage) en orden, cada uno normalizado en volumen antes de
 * concatenar — si no, la voz de la intro (TTS, siempre parejo) suena a un
 * volumen distinto del audio grabado en un celular.
 */
async function armarSegmento(
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
 * Arma el audiolibro completo: un mp3 por capítulo (intro + sus audios),
 * un bonus con los saludos de la familia si hay alguno, y la concatenación
 * de todo. Sube cada pieza al bucket `audios` bajo
 * `{narradorId}/paquete/` y devuelve las rutas para guardar en el pedido.
 */
export async function generarAudiolibro(
  narradorId: string,
  estructura: EstructuraCapitulos,
  archivosDisponibles: string[],
  saludos: { nombre: string; vinculo: string; audio_path: string }[]
): Promise<{ capitulos: string[]; bonus?: string; completo: string }> {
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
    const { error } = await db.storage
      .from('audios')
      .upload(ruta, buffer, { contentType: 'audio/mpeg', upsert: true });
    if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
    rutasCapitulos.push(ruta);
    buffersFinal.push(buffer);
  }

  let rutaBonus: string | undefined;
  if (saludos.length > 0) {
    const bufferBonus = await armarSegmento(
      db,
      'Mensajes para usted',
      saludos.map((s) => s.audio_path)
    );
    rutaBonus = RUTA_BONUS(narradorId);
    const { error } = await db.storage
      .from('audios')
      .upload(rutaBonus, bufferBonus, { contentType: 'audio/mpeg', upsert: true });
    if (error) throw new Error(`No se pudo subir ${rutaBonus}: ${error.message}`);
    buffersFinal.push(bufferBonus);
  }

  const bufferCompleto = await concatenarMp3s(buffersFinal);
  const rutaCompleto = RUTA_COMPLETO(narradorId);
  const { error: errorCompleto } = await db.storage
    .from('audios')
    .upload(rutaCompleto, bufferCompleto, { contentType: 'audio/mpeg', upsert: true });
  if (errorCompleto) throw new Error(`No se pudo subir ${rutaCompleto}: ${errorCompleto.message}`);

  return { capitulos: rutasCapitulos, bonus: rutaBonus, completo: rutaCompleto };
}
