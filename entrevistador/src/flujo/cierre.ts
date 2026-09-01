import { db } from '../db/cliente.js';
import { enviarTexto, enviarAudioPorLink } from '../whatsapp/enviar.js';

const PAUSA_ENTRE_SALUDOS_MS = 2000; // para que lleguen en orden
const URL_FIRMADA_SEGUNDOS = 3600;

type Saludo = { id: string; nombre: string; vinculo: string; audio_path: string };

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

const despedida = (comoLeDicen: string, haySaludos: boolean) =>
  `${comoLeDicen}... llegamos al final del viaje. Treinta charlas, una vida entera. Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.` +
  (haySaludos
    ? ' Pero antes de despedirme, tengo una sorpresa: su familia también estuvo grabando... para usted. 💌'
    : '');

/**
 * El final: se despide, le entrega los saludos que grabó su familia
 * y deja al narrador en estado 'completado'.
 */
export async function cerrarBitacora(narradorId: string, pausaMs = PAUSA_ENTRE_SALUDOS_MS): Promise<void> {
  const { data: narrador } = await db.from('narradores')
    .select('como_le_dicen,telefono_whatsapp,estado').eq('id', narradorId).maybeSingle();
  if (!narrador) return;
  const n = narrador as { como_le_dicen: string; telefono_whatsapp: string; estado: string };
  if (n.estado === 'completado') return; // ya se cerró: no repetir la despedida

  const { data: filas } = await db.from('saludos').select('id,nombre,vinculo,audio_path')
    .eq('narrador_id', narradorId).eq('entregado', false).order('created_at', { ascending: true });
  const saludos = (filas as Saludo[] | null) ?? [];

  const waId = await enviarTexto(n.telefono_whatsapp, despedida(n.como_le_dicen, saludos.length > 0));
  await db.from('envios').insert({ narrador_id: narradorId, tipo: 'despedida', wa_message_id: waId });

  for (const saludo of saludos) {
    await esperar(pausaMs);
    const presentacion = await enviarTexto(n.telefono_whatsapp, `De ${saludo.nombre} (${saludo.vinculo}):`);
    const { data } = await db.storage.from('audios').createSignedUrl(saludo.audio_path, URL_FIRMADA_SEGUNDOS);
    if (data?.signedUrl) await enviarAudioPorLink(n.telefono_whatsapp, data.signedUrl);
    await db.from('saludos').update({ entregado: true }).eq('id', saludo.id);
    await db.from('envios').insert({ narrador_id: narradorId, tipo: 'saludo_final', wa_message_id: presentacion });
  }

  await db.from('narradores').update({ estado: 'completado' }).eq('id', narradorId);
}
