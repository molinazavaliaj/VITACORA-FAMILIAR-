// Los 15 días del «no aceptó»: se borra su ficha y sus fotos (19/10).
//
// Lo prometen los legales: «Si el narrador no acepta participar: en 15 días
// borramos su nombre, su número, su ficha y sus fotos» (privacidad §7, texto
// aprobado por Naza el 18/10). El reloj arranca con la marca `noAcepto` que
// pone el scheduler a los 30 días de la bienvenida (PR #90).
//
// NO se borra la fila del narrador, y es a propósito: el pedido la referencia y
// los datos de la compra hay que guardarlos el tiempo que exige la ley fiscal
// (los mismos legales lo dicen). Entonces se anonimiza: nombre, cómo le dicen y
// teléfono dejan de identificar a nadie, y el contexto —la ficha: dónde nació,
// a qué se dedicó, su árbol familiar— se vacía.
//
// `telefono_whatsapp` es `not null unique`, así que no puede quedar en null: se
// reemplaza por una marca con su id, que no es un teléfono de nadie.
//
// Qué NO se toca: respuestas y audios. Quien no aceptó no contestó nada, y si
// algo hubiera, no es lo que prometimos borrar acá.
//
// APAGADO hasta el OK de Joaquín: se prende con BORRADO_NO_ACEPTO=1. Igual que
// el borrado de audios de Naza, esto destruye datos y no tiene vuelta atrás.

import type { SupabaseClient } from '@supabase/supabase-js';

export const DIAS_PARA_BORRAR_FICHA = 15;
export const BUCKET_FOTOS = 'audios';

/** El valor que queda en lugar del teléfono: no es el de nadie y respeta el unique. */
export const telefonoBorrado = (narradorId: string) => `borrado:${narradorId}`;

export type NarradorParaBorrar = {
  id: string;
  estado: string;
  contexto: Record<string, unknown> | null;
};

/**
 * ¿Le toca el borrado hoy?
 *
 * Tres condiciones, y la segunda es la que importa: si después de la marca
 * terminó aceptando, no se borra nada. Alguien puede contestar el día 31.
 */
export function leTocaBorrar(n: NarradorParaBorrar, ahora: Date): boolean {
  const contexto = n.contexto ?? {};
  if (contexto.borradoFicha) return false;                      // ya se hizo
  if (n.estado !== 'invitado') return false;                    // aceptó después
  const marca = contexto.noAcepto as { cuando?: string } | undefined;
  if (!marca?.cuando) return false;
  const dias = (ahora.getTime() - new Date(marca.cuando).getTime()) / 86_400_000;
  return Number.isFinite(dias) && dias >= DIAS_PARA_BORRAR_FICHA;
}

/** Lo que queda del contexto: las marcas del proceso, nada de la persona. */
export function contextoAnonimo(contexto: Record<string, unknown> | null, ahora: Date): Record<string, unknown> {
  const noAcepto = (contexto ?? {}).noAcepto;
  return {
    ...(noAcepto ? { noAcepto } : {}),
    borradoFicha: { cuando: ahora.toISOString() },
  };
}

/**
 * Borra la ficha y las fotos de un narrador que no aceptó.
 *
 * Las fotos primero: si falla el anonimizado, quedan borradas igual (es lo que
 * prometimos). Al revés sería peor — la ficha anonimizada y las fotos ahí.
 */
export async function borrarFichaYFotos(db: SupabaseClient, narradorId: string, ahora: Date): Promise<number> {
  const { data, error } = await db.from('fotos').select('id, storage_path').eq('narrador_id', narradorId);
  if (error) throw new Error(`no pude listar las fotos de ${narradorId}: ${error.message}`);
  const fotos = (data ?? []) as Array<{ id: string; storage_path: string }>;

  if (fotos.length > 0) {
    const paths = fotos.map((f) => f.storage_path).filter(Boolean);
    if (paths.length > 0) {
      const { error: errorStorage } = await db.storage.from(BUCKET_FOTOS).remove(paths);
      if (errorStorage) throw new Error(`no pude borrar las fotos de ${narradorId}: ${errorStorage.message}`);
    }
    const { error: errorFilas } = await db.from('fotos').delete().eq('narrador_id', narradorId);
    if (errorFilas) throw new Error(`borré los archivos pero no las filas de ${narradorId}: ${errorFilas.message}`);
  }

  const { data: antes } = await db.from('narradores').select('contexto').eq('id', narradorId).maybeSingle();
  const contexto = (antes as { contexto?: Record<string, unknown> } | null)?.contexto ?? null;
  const { error: errorNarrador } = await db.from('narradores').update({
    nombre: 'Narrador borrado',
    como_le_dicen: 'Narrador borrado',
    telefono_whatsapp: telefonoBorrado(narradorId),
    contexto: contextoAnonimo(contexto, ahora),
  }).eq('id', narradorId);
  if (errorNarrador) throw new Error(`no pude anonimizar a ${narradorId}: ${errorNarrador.message}`);

  return fotos.length;
}
