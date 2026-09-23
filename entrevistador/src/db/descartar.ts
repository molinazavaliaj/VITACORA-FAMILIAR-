// Descartar una respuesta sin borrarla (hallazgo 43, acordado el 23/09).
//
// El 17/09 un audio de Ciro quedó en la orden 27 de Joaquín: quien cargaba se dio cuenta,
// pero la puerta manual no tenía cómo sacarlo y la fábrica lo usó. Descartar mueve UNA
// respuesta —por id, nunca "todas las de una orden"— a `respuestas_descartadas`, y su
// audio a `{narrador}/descartadas/`. No se borra nada: se puede escuchar y restaurar.
//
// El audio se mueve porque el audiolibro elige los archivos por nombre (`dia_NN*.ogg`)
// en la carpeta del narrador, no por la tabla: si el archivo se quedara ahí, la voz de
// otra persona seguiría entrando al audiolibro aunque la fila ya no esté.
//
// Orden de los pasos: primero Storage, después la base (una función que mueve la fila en
// un solo paso). Si la base falla, el audio vuelve a su lugar: nunca queda a medias.

import type { SupabaseClient } from '@supabase/supabase-js';

export type FilaParaDescartar = {
  id: string;
  narrador_id: string;
  pregunta_orden: number;
  audio_path: string | null;
};

/** Lo mínimo que hace falta de la base; así se prueba sin Supabase. */
export type BaseDescarte = {
  leerRespuesta(id: string): Promise<FilaParaDescartar | null>;
  leerDescartada(id: string): Promise<FilaParaDescartar | null>;
  moverAudio(desde: string, hasta: string): Promise<void>;
  rpc(nombre: 'descartar_respuesta' | 'restaurar_respuesta', args: Record<string, unknown>): Promise<void>;
};

const CARPETA = 'descartadas';

export function rutaDescartada(audioPath: string): string {
  const [narrador, ...resto] = audioPath.split('/');
  return [narrador, CARPETA, ...resto].join('/');
}

export function rutaOriginal(audioPath: string): string {
  return audioPath.split('/').filter((parte, i) => !(i === 1 && parte === CARPETA)).join('/');
}

/**
 * Para `cargar --reemplazar`: la respuesta que se reemplaza tiene que ser una sola.
 * Si hay más (respuesta + repregunta), no adivina cuál: las lista y pide descartar por id.
 */
export function elegirParaReemplazar(previas: FilaParaDescartar[], orden: number): FilaParaDescartar {
  if (previas.length === 0) throw new Error(`La orden ${orden} no tiene respuesta: no hay nada que reemplazar. Cargala sin --reemplazar.`);
  if (previas.length > 1) {
    throw new Error(
      `La orden ${orden} tiene ${previas.length} respuestas y no voy a adivinar cuál reemplazar:\n` +
      previas.map((p) => `   ${p.id}  ${p.audio_path ?? '(texto)'}`).join('\n') +
      `\nDescartá la que no va con: descartar <narrador> <id> --motivo "..." y después cargá sin --reemplazar.`,
    );
  }
  return previas[0];
}

export async function descartarRespuesta(base: BaseDescarte, id: string, motivo: string): Promise<FilaParaDescartar> {
  if (!motivo.trim()) throw new Error('Falta el motivo (--motivo "audio de otro narrador", etc.): queda escrito junto a la respuesta.');
  const fila = await base.leerRespuesta(id);
  if (!fila) throw new Error(`No existe la respuesta ${id} (¿ya estaba descartada?).`);

  const destino = fila.audio_path ? rutaDescartada(fila.audio_path) : null;
  if (fila.audio_path && destino) await base.moverAudio(fila.audio_path, destino);
  try {
    await base.rpc('descartar_respuesta', { p_id: id, p_motivo: motivo.trim(), p_audio_path: destino });
  } catch (err) {
    if (fila.audio_path && destino) await devolverAudio(base, destino, fila.audio_path, err);
    throw err;
  }
  return { ...fila, audio_path: destino };
}

/**
 * La compensación cuando la base falló después de mover el audio. Si la vuelta también
 * falla (dos fallas seguidas), el audio queda donde la base no lo espera: no se puede
 * arreglar solo, pero no puede pasar en silencio.
 */
async function devolverAudio(base: BaseDescarte, desde: string, hasta: string, errorOriginal: unknown): Promise<void> {
  try {
    await base.moverAudio(desde, hasta);
  } catch (errVuelta) {
    const motivo = errorOriginal instanceof Error ? errorOriginal.message : String(errorOriginal);
    const vuelta = errVuelta instanceof Error ? errVuelta.message : String(errVuelta);
    throw new Error(
      `La base falló (${motivo}) y NO pude devolver el audio a su lugar (${vuelta}). ` +
      `La fila no cambió, pero el audio quedó en ${desde}. Movelo A MANO en Storage (bucket audios) a ${hasta}.`,
    );
  }
}

export async function restaurarRespuesta(base: BaseDescarte, id: string): Promise<FilaParaDescartar> {
  const fila = await base.leerDescartada(id);
  if (!fila) throw new Error(`No hay una respuesta descartada con id ${id}.`);

  const destino = fila.audio_path ? rutaOriginal(fila.audio_path) : null;
  if (fila.audio_path && destino) await base.moverAudio(fila.audio_path, destino);
  try {
    await base.rpc('restaurar_respuesta', { p_id: id, p_audio_path: destino });
  } catch (err) {
    if (fila.audio_path && destino) await devolverAudio(base, destino, fila.audio_path, err);
    throw err;
  }
  return { ...fila, audio_path: destino };
}

/** La base de verdad. Recibe el cliente para no importar `cliente.ts` (que exige el entorno). */
export function baseDeSupabase(db: SupabaseClient): BaseDescarte {
  const columnas = 'id, narrador_id, pregunta_orden, audio_path';
  return {
    async leerRespuesta(id) {
      const { data, error } = await db.from('respuestas').select(columnas).eq('id', id).maybeSingle();
      if (error) throw new Error(`No pude leer la respuesta ${id}: ${error.message}`);
      return data as FilaParaDescartar | null;
    },
    async leerDescartada(id) {
      const { data, error } = await db.from('respuestas_descartadas').select(columnas).eq('id', id).maybeSingle();
      if (error) throw new Error(`No pude leer la descartada ${id}: ${error.message} (¿está aplicada la migración 20260923000300_respuestas_descartadas.sql?)`);
      return data as FilaParaDescartar | null;
    },
    async moverAudio(desde, hasta) {
      const { error } = await db.storage.from('audios').move(desde, hasta);
      if (error) throw new Error(`Storage no pudo mover ${desde} → ${hasta}: ${error.message}`);
    },
    async rpc(nombre, args) {
      const { error } = await db.rpc(nombre, args);
      if (error) throw new Error(`${nombre} falló: ${error.message}`);
    },
  };
}
