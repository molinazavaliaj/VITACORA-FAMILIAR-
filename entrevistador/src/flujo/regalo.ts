// Gift card (spec 2026-10-07-gift-card-design §6): un número que no conocemos
// escribe con el código de su tarjeta. Se le pone el teléfono al narrador que
// armó quien regala, pasa a 'invitado' y le llega la bienvenida como texto
// libre (escribió él primero: la ventana de 24 hs está abierta). Desde ahí,
// el SÍ y todo lo demás siguen como siempre (procesar.ts).

import type { SupabaseClient } from '@supabase/supabase-js';
import { bienvenida } from '../manual/puro.js';
import { ritmoDe } from './ritmo.js';
import { extraerCodigo } from './regalo-codigo.js';
import { TEXTOS_REGALO_BOT } from './regalo-textos.js';

export type DepsRegalo = { db: SupabaseClient; enviarTexto: (telefono: string, texto: string) => Promise<string> };
export type ResultadoCanje = 'sin_codigo' | 'no_existe' | 'usado_por_otro' | 'no_listo' | 'canjeado';

const esTablaAusente = (e: { code?: string } | null) => e?.code === '42P01';

export async function canjearRegalo(deps: DepsRegalo, m: { telefono: string; texto: string }): Promise<ResultadoCanje> {
  const codigo = extraerCodigo(m.texto);
  if (!codigo) return 'sin_codigo';
  const { db } = deps;

  const { data: regalo, error } = await db.from('regalos')
    .select('id, narrador_id, usado_at, usado_por_telefono').eq('codigo', codigo).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) { console.warn('regalo: la tabla regalos todavía no existe'); return 'sin_codigo'; }
    throw error;
  }
  if (!regalo) {
    await deps.enviarTexto(m.telefono, TEXTOS_REGALO_BOT.noExiste);
    return 'no_existe';
  }
  if (regalo.usado_at) {
    await deps.enviarTexto(m.telefono, TEXTOS_REGALO_BOT.usadoPorOtro);
    console.warn(`regalo: ${codigo} ya usado por ${regalo.usado_por_telefono}; ahora escribe ${m.telefono}`);
    return 'usado_por_otro';
  }

  // 1. Se toma el regalo. Compare-and-swap: dos mensajes juntos no lo canjean dos veces.
  const ahora = new Date().toISOString();
  const { data: tomado } = await db.from('regalos')
    .update({ usado_at: ahora, usado_por_telefono: m.telefono })
    .eq('id', regalo.id).is('usado_at', null).select('id');
  if (!tomado?.length) {
    await deps.enviarTexto(m.telefono, TEXTOS_REGALO_BOT.usadoPorOtro);
    return 'usado_por_otro';
  }

  // 2. El narrador: teléfono e invitado, solo si estaba esperando el regalo.
  const { data: narrador, error: errorNarrador } = await db.from('narradores')
    .update({ telefono_whatsapp: m.telefono, estado: 'invitado' })
    .eq('id', regalo.narrador_id).eq('estado', 'regalo_pendiente').select('id');
  if (errorNarrador || !narrador?.length) {
    // No se pagó todavía, o ese teléfono ya es de otro narrador (23505). Se
    // devuelve el regalo para que se pueda canjear cuando se arregle.
    await db.from('regalos').update({ usado_at: null, usado_por_telefono: null }).eq('id', regalo.id);
    console.error(`regalo: no pude canjear ${codigo} para ${m.telefono}:`, errorNarrador?.message ?? 'el narrador no estaba en regalo_pendiente');
    return 'no_listo';
  }

  // 3. La bienvenida. Si falla, el próximo mensaje la vuelve a intentar (procesar.ts).
  await mandarBienvenidaDeRegalo(deps, regalo.narrador_id, m.telefono);
  return 'canjeado';
}

/** La bienvenida de siempre (vos), firmada por quien regala, como texto libre. */
export async function mandarBienvenidaDeRegalo(deps: DepsRegalo, narradorId: string, telefono: string): Promise<boolean> {
  try {
    const [{ data: n }, { data: r }] = await Promise.all([
      deps.db.from('narradores').select('como_le_dicen, contexto').eq('id', narradorId).maybeSingle(),
      deps.db.from('regalos').select('quien_regala').eq('narrador_id', narradorId).maybeSingle(),
    ]);
    if (!n || !r) return false;
    const enseguida = ritmoDe(n.contexto) === 'seguido';
    const waId = await deps.enviarTexto(telefono, bienvenida(n.como_le_dicen, r.quien_regala, 'vos', { enseguida }));
    await deps.db.from('envios').insert({ narrador_id: narradorId, tipo: 'bienvenida', pregunta_orden: null, wa_message_id: waId });
    return true;
  } catch (err) {
    console.error(`regalo: falló la bienvenida de ${narradorId}:`, err);
    return false;
  }
}
