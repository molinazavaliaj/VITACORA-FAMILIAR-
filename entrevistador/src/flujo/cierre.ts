import { db } from '../db/cliente.js';
import { enviarTexto } from '../whatsapp/enviar.js';

const despedida = (comoLeDicen: string) =>
  `${comoLeDicen}... llegamos al final del viaje. Treinta charlas, una vida entera. ` +
  `Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.`;

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
    .select('como_le_dicen,telefono_whatsapp,estado').eq('id', narradorId).maybeSingle();
  if (!narrador) return;
  const n = narrador as { como_le_dicen: string; telefono_whatsapp: string; estado: string };
  if (n.estado === 'completado') return; // ya se cerró: no repetir la despedida

  const waId = await enviarTexto(n.telefono_whatsapp, despedida(n.como_le_dicen));
  await db.from('envios').insert({ narrador_id: narradorId, tipo: 'despedida', wa_message_id: waId });

  await db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId);
}
