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
    const { data } = await db.from('envios').select('id, entrega').eq('wa_message_id', aviso.waMessageId).maybeSingle();
    const fila = data as { id: string; entrega?: EstadoEntrega | null } | null;
    if (!fila) return; // un mensaje que no salió de `envios` (la confirmación de una foto, por ejemplo)
    if (fila.entrega && RANGO[fila.entrega] >= RANGO[aviso.estado]) return; // ya estaba más adelante
    const { error } = await db.from('envios').update({
      entrega: aviso.estado,
      entrega_at: aviso.momento,
      error_codigo: aviso.errorCodigo ?? null,
      error_detalle: aviso.errorDetalle ?? null,
    }).eq('id', fila.id);
    if (error) console.warn(`entregas: no pude anotar ${aviso.waMessageId} (¿falta la migración?):`, error.message);
  } catch (err) {
    console.warn(`entregas: no pude anotar ${aviso.waMessageId}:`, err);
  }
}
