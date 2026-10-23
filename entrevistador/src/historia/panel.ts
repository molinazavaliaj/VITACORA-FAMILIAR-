// Las preguntas sumadas desde el panel (Naza, 23/10; docs/historia/banco.md, regla 7): las escribe la web en la
// tabla `preguntas` (tipo 'familia', /api/guion) y el bot las suma a `estado.panel` antes de elegir lo siguiente.
// Van después de las de quien regala y antes de la última pregunta (HC10), con PF-H1 la primera y PF-H2 las
// siguientes. Solo se agregan: si la familia borra o edita una, lo que ya estaba no se toca (como la V3,
// v3/turno.ts sumarFamilia). Las que llegan cuando HC10 ya salió no se hacen: el núcleo no las elige más.

import type { SupabaseClient } from '@supabase/supabase-js';
import { conReintento } from './estado.js';
import type { PreguntaPanel } from './nucleo/entrevista/flujo.js';
import type { EstadoHistoria } from './tipos.js';

/** Las preguntas del panel de ese narrador, en orden. Null si la base falla: quien llama sigue sin sumar nada. */
export async function leerPanel(db: SupabaseClient, narradorId: string): Promise<PreguntaPanel[] | null> {
  const { data, error } = await db.from('preguntas').select('id,orden,texto,tipo').eq('narrador_id', narradorId).eq('tipo', 'familia').order('orden');
  if (error) {
    console.warn(`historia: no pude leer las preguntas del panel de ${narradorId}: ${error.message}`);
    return null;
  }
  return ((data as { id: string; texto: string }[] | null) ?? [])
    .filter((p) => typeof p.texto === 'string' && p.texto.trim())
    .map((p) => ({ id: p.id, texto: p.texto.trim() }));
}

/** El estado con las que no estaban (por id), o null si no hay ninguna nueva. Puro. */
export function sumarPanel(e: EstadoHistoria, leidas: readonly PreguntaPanel[]): EstadoHistoria | null {
  const ya = new Set((e.panel ?? []).map((p) => p.id));
  const nuevas = leidas.filter((p) => !ya.has(p.id));
  if (nuevas.length === 0) return null;
  return { ...e, panel: [...(e.panel ?? []), ...nuevas.map((p) => ({ ...p }))] };
}

/** Lee el panel y, si hay preguntas nuevas, las guarda en la fila. Va antes de cada paso que elige lo siguiente. */
export async function actualizarPanel(db: SupabaseClient, narradorId: string): Promise<void> {
  const leidas = await leerPanel(db, narradorId);
  if (!leidas || leidas.length === 0) return;
  await conReintento(db, narradorId, (f) => {
    const e = sumarPanel(f.estado, leidas);
    return e ? { cambio: { estado: e }, resultado: true } : null;
  });
}
