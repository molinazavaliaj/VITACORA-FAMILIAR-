import { db } from './cliente.js';

/** El narrador mínimo que hace falta para acordarse de un texto que se le mandó. */
export type NarradorConContexto = { id: string; contexto: Record<string, any> };

/**
 * Guarda el TEXTO de la repregunta que se le mandó al narrador, dentro de su
 * propio `contexto` (`contexto.repreguntasEnviadas[orden]`).
 *
 * Por qué existe: hasta ahora `envios` registraba que se había mandado una
 * repregunta (tipo + orden + `wa_message_id`), pero **no su texto**. El panel
 * podía mostrar la respuesta que llegó después y no qué se le preguntó, que es
 * la mitad del diálogo.
 *
 * ⚠️ Provisoria, igual que `contexto.preguntasEnviadas` (la pregunta preparada
 * del día): el lugar definitivo es una columna de texto en `envios`, que toca
 * `supabase/CONTRATO.md` y lo acuerdan los dos socios. Mientras tanto el panel
 * lee de acá y el narrador puede ver las dos mitades de la charla.
 */
export async function guardarRepreguntaEnviada(
  n: NarradorConContexto, orden: number, texto: string,
): Promise<void> {
  const repreguntas = { ...(n.contexto?.repreguntasEnviadas ?? {}), [orden]: texto };
  const contexto = { ...n.contexto, repreguntasEnviadas: repreguntas };
  // Se muta el objeto en memoria: si después otro módulo guarda el contexto
  // (la memoria por capítulo, por ejemplo), no pisa esto.
  n.contexto = contexto;

  const { error } = await db.from('narradores').update({ contexto }).eq('id', n.id);
  if (error) console.error(`No pude guardar la repregunta ${orden} de ${n.id}:`, error.message);
}
