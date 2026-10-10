/*
 * ¿Llegó el mensaje? (23/09)
 *
 * Hasta hoy guardábamos que Meta ACEPTÓ el mensaje (`envios.wa_message_id`) y
 * nada más. No es lo mismo que entregarlo: el 21/09 salieron tres bienvenidas,
 * las tres con id de Meta, y las tres personas dicen que no les llegó nada.
 *
 * Meta manda esos avisos por el mismo webhook que los mensajes entrantes, en
 * `value.statuses`. Los tirábamos a la basura. Ahora se guardan, y con eso se
 * distinguen tres problemas que hoy confundimos en uno solo:
 *   · fallido    → el número o la cuenta tienen un problema
 *   · entregado  → le llegó y no lo abrió
 *   · leido      → lo abrió y no contestó: el problema es lo que dice el mensaje
 */

export type EstadoEntrega = 'enviado' | 'entregado' | 'leido' | 'fallido';

export type AvisoDeEntrega = {
  waMessageId: string;
  estado: EstadoEntrega;
  momento: string;
  errorCodigo?: number;
  errorDetalle?: string;
};

/** El orden en que avanzan: un aviso viejo que llega tarde no pisa a uno nuevo. */
const RANGO: Record<EstadoEntrega, number> = { enviado: 1, entregado: 2, leido: 3, fallido: 4 };

const DE_META: Record<string, EstadoEntrega> = {
  sent: 'enviado', delivered: 'entregado', read: 'leido', failed: 'fallido',
};

/** Los avisos de entrega que trae este webhook (vacío si no trae ninguno). */
export function parsearEntregas(body: any): AvisoDeEntrega[] {
  const crudos = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
  if (!Array.isArray(crudos)) return [];
  return crudos.flatMap((s: any) => {
    const estado = DE_META[s?.status];
    if (!estado || !s?.id) return [];
    const error = Array.isArray(s.errors) ? s.errors[0] : undefined;
    return [{
      waMessageId: String(s.id),
      estado,
      // Meta manda el timestamp en segundos; si falta, vale ahora.
      momento: s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : new Date().toISOString(),
      errorCodigo: typeof error?.code === 'number' ? error.code : undefined,
      errorDetalle: [error?.title, error?.message, error?.error_data?.details].filter(Boolean).join(' · ') || undefined,
    }];
  });
}

/**
 * Qué hacer según el código de Meta (10/10). Es un mail interno para los socios, no un texto para el narrador.
 * Los códigos: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
 */
const QUE_HACER: Record<number, string> = {
  131047: 'Pasaron más de 24 h desde su último mensaje: un texto libre ya no le llega. Le llega cuando escriba él o por una plantilla aprobada.',
  130472: 'Meta puso su número en un experimento y no le entrega plantillas de Marketing (la pregunta diaria lo es). Le llega solo si escribe primero: pedile a la familia que le diga que mande un mensaje.',
  131049: 'Meta frenó la plantilla de Marketing para no saturarlo. Se puede reintentar más tarde, o que escriba él primero.',
  131026: 'Meta no se lo pudo entregar en ese número (puede no tener WhatsApp, tener una versión vieja o habernos bloqueado). Hay que llamar a la familia.',
};

export function avisoDeEntregaFallida(f: {
  narradorId: string; nombre?: string | null; tipo: string; errorCodigo?: number; errorDetalle?: string;
}): { clave: string; asunto: string; detalle: string } {
  const quien = f.nombre?.trim() || f.narradorId;
  const codigo = f.errorCodigo ?? 'sin código';
  return {
    // Una vez por narrador y por día (avisarSocios): si le falla todos los días, llega un mail por día.
    clave: `entrega-fallida|${f.narradorId}`,
    asunto: `No le llegó un mensaje a ${quien}`,
    detalle: [
      `Narrador: ${quien} (${f.narradorId})`,
      `Mensaje: ${f.tipo}`,
      `Error de Meta: ${codigo}${f.errorDetalle ? ` — ${f.errorDetalle}` : ''}`,
      '',
      (f.errorCodigo !== undefined && QUE_HACER[f.errorCodigo]) || 'Mirar el código en la lista de errores de WhatsApp Cloud API.',
    ].join('\n'),
  };
}

/**
 * Anota el aviso en la fila del envío. Nada de esto puede tumbar el webhook:
 * si la columna todavía no existe (la migración la aplica Naza) o la fila no
 * está, se avisa por consola y se sigue — el log ya sirve para saber qué pasó.
 */
export async function anotarEntrega(aviso: AvisoDeEntrega): Promise<void> {
  if (aviso.estado === 'fallido') {
    console.error(`whatsapp: MENSAJE NO ENTREGADO ${aviso.waMessageId} — ${aviso.errorCodigo ?? 's/código'}: ${aviso.errorDetalle ?? 'sin detalle'}`);
  } else {
    console.log(`whatsapp: ${aviso.waMessageId} → ${aviso.estado}`);
  }
  try {
    // La base se carga acá adentro y no arriba: así `parsearEntregas` (que es
    // puro) se puede importar sin exigir las variables de entorno.
    const { db } = await import('../db/cliente.js');
    const { data } = await db.from('envios').select('id, entrega, narrador_id, tipo').eq('wa_message_id', aviso.waMessageId).maybeSingle();
    const fila = data as { id: string; entrega?: EstadoEntrega | null; narrador_id?: string | null; tipo?: string | null } | null;
    if (!fila) return; // un mensaje que no salió de `envios` (la confirmación de una foto, por ejemplo)
    if (fila.entrega && RANGO[fila.entrega] >= RANGO[aviso.estado]) return; // ya estaba más adelante
    const { error } = await db.from('envios').update({
      entrega: aviso.estado,
      entrega_at: aviso.momento,
      error_codigo: aviso.errorCodigo ?? null,
      error_detalle: aviso.errorDetalle ?? null,
    }).eq('id', fila.id);
    if (error) console.warn(`entregas: no pude anotar ${aviso.waMessageId} (¿falta la migración?):`, error.message);
    // Un "failed" que llega después de "entregado" o "leído" no es un mensaje perdido: no se avisa.
    const yaLlego = fila.entrega === 'entregado' || fila.entrega === 'leido';
    if (aviso.estado === 'fallido' && fila.narrador_id && !yaLlego) await avisarFallo(fila.narrador_id, fila.tipo ?? '?', aviso);
  } catch (err) {
    console.warn(`entregas: no pude anotar ${aviso.waMessageId}:`, err);
  }
}

/** El aviso a los socios de un mensaje que no llegó. Nunca tira: es el webhook. */
async function avisarFallo(narradorId: string, tipo: string, aviso: AvisoDeEntrega): Promise<void> {
  try {
    const { db } = await import('../db/cliente.js');
    const { data } = await db.from('narradores').select('como_le_dicen').eq('id', narradorId).maybeSingle();
    const nombre = (data as { como_le_dicen?: string | null } | null)?.como_le_dicen ?? null;
    const { avisarSocios } = await import('../v3/avisos.js');
    const a = avisoDeEntregaFallida({ narradorId, nombre, tipo, errorCodigo: aviso.errorCodigo, errorDetalle: aviso.errorDetalle });
    await avisarSocios(a.clave, a.asunto, a.detalle);
  } catch (err) {
    console.warn(`entregas: no pude avisar a los socios del fallo de ${aviso.waMessageId}:`, err);
  }
}
