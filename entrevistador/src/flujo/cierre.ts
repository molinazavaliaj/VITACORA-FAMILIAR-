import { db } from '../db/cliente.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { despedida } from '../manual/puro.js';
import { tratoDe } from '../ia/trato.js';

/**
 * El final: se despide del narrador y lo deja en estado 'completado'.
 *
 * Los saludos de la familia salieron de la fase 1 (decisión del 2026-09-10):
 * el receptor del regalo ya no es el narrador sino quien compra, así que
 * grabarle sorpresas a él dejó de tener sentido. La tabla `saludos` sigue
 * existiendo por si la fase 2 los revive como material para el libro.
 */
export async function cerrarBitacora(narradorId: string): Promise<void> {
  const { data: narrador } = await db.from('narradores')
    .select('id,como_le_dicen,telefono_whatsapp,estado,contexto').eq('id', narradorId).maybeSingle();
  if (!narrador) return;
  const n = narrador as { id: string; como_le_dicen: string; telefono_whatsapp: string; estado: string; contexto: Record<string, any> };
  if (n.estado === 'completado') return; // ya se cerró: no repetir la despedida

  const waId = await enviarTexto(n.telefono_whatsapp, despedida(n.como_le_dicen, await tratoDe(n)));
  await db.from('envios').insert({ narrador_id: narradorId, tipo: 'despedida', wa_message_id: waId });

  await db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId);
}
