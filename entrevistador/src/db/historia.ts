import { db } from './cliente.js';

export type RespuestaHistoria = { pregunta_orden: number; transcripcion: string | null };

/** Todas las transcripciones del narrador, en orden de pregunta. */
export async function traerRespuestas(narradorId: string): Promise<RespuestaHistoria[]> {
  const { data } = await db.from('respuestas')
    .select('pregunta_orden,transcripcion')
    .eq('narrador_id', narradorId)
    .order('pregunta_orden', { ascending: true });
  return (data as RespuestaHistoria[] | null) ?? [];
}

/** La historia contada hasta ahora, lista para meter en un prompt. */
export async function armarHistoria(narradorId: string): Promise<string> {
  const respuestas = await traerRespuestas(narradorId);
  return respuestas
    .filter((r) => r.transcripcion)
    .map((r) => `Pregunta ${r.pregunta_orden}:\n${r.transcripcion}`)
    .join('\n\n');
}

/** La última transcripción recibida (lo que contó "ayer"). */
export async function ultimaTranscripcion(narradorId: string): Promise<string> {
  const respuestas = await traerRespuestas(narradorId);
  const conTexto = respuestas.filter((r) => r.transcripcion);
  return conTexto.length ? conTexto[conTexto.length - 1].transcripcion! : '';
}
