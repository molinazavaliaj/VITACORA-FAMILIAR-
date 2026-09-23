import { db } from '../db/cliente.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { esUltimaDelCapitulo, objetoDelCapitulo, preguntaDeOrden } from '../db/guion.js';
import { personalizarPregunta } from '../ia/personalizar.js';
import { tratoDe } from '../ia/trato.js';
import { mensajeDeObjeto } from '../manual/puro.js';
import type { Narrador } from './preguntar.js';

/*
 * «Sus objetos preciados» (3t.30, 22/09).
 *
 * El guion pregunta por historias; esto pide cosas. Al cerrar cada capítulo el
 * biógrafo pide UN objeto concreto —el primer reloj, la camisa que no tiró, el
 * amuleto, la mascota— con la foto y de dónde salió. Ocho en todo el libro.
 *
 * No consume un día: sale pegado a la última pregunta del capítulo, dentro de
 * la ventana de 24 hs. No avanza `dia_actual` ni entra en la cuenta del guion.
 */

/** 48 hs: pasado eso, una foto que llega ya no es la del objeto que pedimos. */
const VENTANA_HORAS = 48;

/** ¿Ya le pedimos este objeto alguna vez? Se pide UNA sola vez y no se insiste nunca. */
export async function yaSePidio(narradorId: string, orden: number): Promise<boolean> {
  const { data } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'objeto').eq('pregunta_orden', orden).limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * El pedido que está esperando respuesta, o null.
 *
 * Abierto = salió hace menos de 48 hs y desde entonces no salió ninguna
 * pregunta nueva. Lo segundo importa: cuando arranca el día siguiente, lo que
 * el narrador mande es la respuesta de hoy, no la foto de anteayer.
 */
export async function pedidoAbierto(narradorId: string, ahora = new Date()): Promise<number | null> {
  const { data } = await db.from('envios').select('pregunta_orden, enviado_at')
    .eq('narrador_id', narradorId).eq('tipo', 'objeto')
    .order('enviado_at', { ascending: false }).limit(1);
  const ultimo = (data as { pregunta_orden: number | null; enviado_at: string }[] | null)?.[0];
  if (!ultimo?.pregunta_orden) return null;
  if (ahora.getTime() - new Date(ultimo.enviado_at).getTime() > VENTANA_HORAS * 3600_000) return null;

  const { data: despues } = await db.from('envios').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'pregunta').gt('enviado_at', ultimo.enviado_at).limit(1);
  return (despues?.length ?? 0) > 0 ? null : ultimo.pregunta_orden;
}

/** ¿El narrador pidió que no le pidamos fotos? Lo prende la familia en el panel. */
export function sinFotos(contexto: Record<string, any> | null | undefined): boolean {
  return contexto?.sinFotos === true;
}

/**
 * El pedido personalizado. Se pasa por el mismo personalizador que las fijas
 * —así llega en el trato del narrador y con lo que ya contó—, pero con una
 * red: si el texto que vuelve se olvidó de pedir la foto, se usa el original.
 * Un pedido de objeto sin el pedido de la foto no es un pedido de objeto.
 */
export async function textoDelPedido(n: Narrador, original: string, orden: number): Promise<string> {
  try {
    const { texto } = await personalizarPregunta(n, original, orden);
    return /foto|fotito|retrato|imagen/i.test(texto) ? texto : original;
  } catch (err) {
    console.warn(`objetos: no pude personalizar el pedido ${orden} de ${n.id}, va el original:`, err);
    return original;
  }
}

/**
 * Si con esta pregunta se cerró un capítulo, pide su objeto. Devuelve true si
 * salió (y entonces el día termina ahí: el pedido ES el segundo mensaje).
 *
 * Nada de esto puede frenar la entrevista: si algo falla, se avisa y el día
 * sigue su curso como si el pedido no existiera.
 */
export async function pedirObjeto(n: Narrador, orden: number): Promise<boolean> {
  try {
    if (sinFotos(n.contexto)) return false;
    if (!(await esUltimaDelCapitulo(n.id, orden))) return false;
    const cerrada = await preguntaDeOrden(n.id, orden);
    if (!cerrada) return false;
    const pedido = await objetoDelCapitulo(n.id, cerrada.capitulo);
    if (!pedido) return false;               // la familia lo borró del panel
    if (await yaSePidio(n.id, pedido.orden)) return false;

    const texto = await textoDelPedido(n, pedido.texto, pedido.orden);
    const waId = await enviarTexto(n.telefono_whatsapp, mensajeDeObjeto(cerrada.capitulo, texto, await tratoDe(n)));
    await db.from('envios').insert({
      narrador_id: n.id, tipo: 'objeto', pregunta_orden: pedido.orden, wa_message_id: waId,
    });
    return true;
  } catch (err) {
    console.error(`objetos: falló el pedido al cerrar el capítulo de ${n.id} (orden ${orden}):`, err);
    return false;
  }
}
