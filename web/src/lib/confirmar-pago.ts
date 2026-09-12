// Lo que pasa cuando el proveedor de pago confirma el cobro. Vive aparte del
// webhook de Stripe para que el de MercadoPago haga exactamente lo mismo
// cuando exista: un solo lugar donde "pagó" significa algo.
//
// Pago por adelantado (11/09): el pedido y el narrador existen desde antes
// del cobro (narrador en `pendiente_pago`). Confirmar es:
//   1. pedido pendiente → pagado (compare-and-swap: idempotente ante reintentos)
//   2. narrador pendiente_pago → invitado (recién ahí el entrevistador le escribe)
//   3. avisarle a la familia por mail cómo entrar al tablero
//
// La cuenta de auth NO se crea acá: la crea el propio login por código la
// primera vez que ella entra, y el tablero vincula la familia por mail. Así
// el webhook no toca auth y no hay usuarios huérfanos si alguien paga y
// nunca entra.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ResultadoConfirmacion =
  | { ok: true; yaEstaba: boolean; email: string | null }
  | { ok: false; error: string };

type EnviarMailAcceso = (opciones: { para: string; comoLeDicen: string }) => Promise<boolean>;

export async function confirmarPago(
  admin: SupabaseClient,
  opciones: { pedidoId: string; referenciaExterna: string; enviarMailAcceso: EnviarMailAcceso },
): Promise<ResultadoConfirmacion> {
  const { pedidoId, referenciaExterna, enviarMailAcceso } = opciones;

  // 1. El pedido. Solo si sigue pendiente: Stripe reintenta el webhook y una
  //    segunda llamada no debe volver a mandar el mail ni tocar nada.
  const { data: actualizados, error: errorPedido } = await admin
    .from("pedidos")
    .update({ estado: "pagado", referencia_externa: referenciaExterna })
    .eq("id", pedidoId)
    .eq("estado", "pendiente")
    .select("id, narrador_id, familia_id");

  if (errorPedido) {
    return { ok: false, error: `No se pudo actualizar el pedido: ${errorPedido.message}` };
  }

  const pedido = (actualizados as { id: string; narrador_id: string; familia_id: string }[] | null)?.[0];
  if (!pedido) {
    // Ya estaba pagado (reintento) o no existe. En ambos casos no hay nada
    // que hacer y se responde 200 para que el proveedor deje de insistir.
    return { ok: true, yaEstaba: true, email: null };
  }

  // 2. El narrador arranca. Solo desde pendiente_pago: si por alguna razón ya
  //    estaba más adelante, no se lo retrocede.
  const { error: errorNarrador } = await admin
    .from("narradores")
    .update({ estado: "invitado" })
    .eq("id", pedido.narrador_id)
    .eq("estado", "pendiente_pago");

  if (errorNarrador) {
    // El pedido ya quedó pagado; devolver error hace que el proveedor
    // reintente, y el reintento entra por "yaEstaba" sin arreglar esto. Se
    // loguea fuerte y se sigue: es preferible un narrador que hay que
    // destrabar a mano antes que un pago cobrado y marcado pendiente.
    console.error(`confirmarPago: el pedido ${pedidoId} quedó pagado pero el narrador ${pedido.narrador_id} no pasó a invitado:`, errorNarrador.message);
  }

  // 3. El mail de acceso.
  const [{ data: familia }, { data: narrador }] = await Promise.all([
    admin.from("familias").select("email").eq("id", pedido.familia_id).maybeSingle(),
    admin.from("narradores").select("como_le_dicen").eq("id", pedido.narrador_id).maybeSingle(),
  ]);

  const email = (familia as { email?: string } | null)?.email ?? null;
  if (email) {
    try {
      await enviarMailAcceso({
        para: email,
        comoLeDicen: (narrador as { como_le_dicen?: string } | null)?.como_le_dicen ?? "tu familiar",
      });
    } catch (err) {
      console.error(`confirmarPago: el pago ${pedidoId} se confirmó pero el mail de acceso a ${email} falló:`, err);
    }
  }

  return { ok: true, yaEstaba: false, email };
}
