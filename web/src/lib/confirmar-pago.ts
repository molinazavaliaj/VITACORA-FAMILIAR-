// Lo que pasa cuando el proveedor de pago confirma el cobro. Vive aparte del
// webhook de Stripe para que el de MercadoPago haga exactamente lo mismo
// cuando exista: un solo lugar donde "pagó" significa algo.
//
// Pago por adelantado (11/09): el pedido y el narrador existen desde antes
// del cobro (narrador en `pendiente_pago`). Confirmar es:
//   1. pedido pendiente → pagado (compare-and-swap: idempotente ante reintentos)
//   2. narrador pendiente_pago → invitado (recién ahí el entrevistador le escribe),
//      o → regalo_pendiente si el pedido es un regalo (espera su código)
//   3. avisarle a la familia por mail cómo entrar al tablero
//
// La cuenta de auth NO se crea acá: la crea el propio login por código la
// primera vez que ella entra, y el tablero vincula la familia por mail. Así
// el webhook no toca auth y no hay usuarios huérfanos si alguien paga y
// nunca entra.

import type { SupabaseClient } from "@supabase/supabase-js";
import { necesitaEntrega } from "./entregas";
import { productosDelPedido } from "./productos";

export type ResultadoConfirmacion =
  | { ok: true; yaEstaba: boolean; email: string | null; codigoRegalo: string | null }
  | { ok: false; error: string };

type EnviarMailAcceso = (opciones: { para: string; comoLeDicen: string }) => Promise<boolean>;
type EnviarMailRegalo = (opciones: { para: string; comoLeDicen: string; codigo: string }) => Promise<boolean>;

export async function confirmarPago(
  admin: SupabaseClient,
  opciones: { pedidoId: string; referenciaExterna: string; enviarMailAcceso: EnviarMailAcceso; enviarMailRegalo?: EnviarMailRegalo },
): Promise<ResultadoConfirmacion> {
  const { pedidoId, referenciaExterna, enviarMailAcceso } = opciones;

  // 0. Qué se compró, ANTES de tocar nada. Si es un regalo el narrador va a
  //    otro estado y le llega otro mail; leerlo mal haría arrancar un regalo
  //    sin teléfono. Si la lectura falla se devuelve error sin haber cambiado
  //    nada, así el reintento del proveedor es seguro.
  let extras: Record<string, unknown> | undefined;
  let region: "ES" | "AR" | undefined;
  try {
    const { data: filaPedido, error: errorExtras } = await admin
      .from("pedidos").select("extras, familia_id").eq("id", pedidoId).maybeSingle();
    if (errorExtras) {
      return { ok: false, error: `No se pudo leer el pedido: ${errorExtras.message}` };
    }
    const leido = filaPedido as { extras?: Record<string, unknown>; familia_id?: string } | null;
    extras = leido?.extras;
    // La región solo decide el origen de la entrega: si no se puede leer, AR.
    if (leido?.familia_id) {
      const { data: filaFamilia } = await admin.from("familias").select("region").eq("id", leido.familia_id).maybeSingle();
      region = (filaFamilia as { region?: "ES" | "AR" } | null)?.region;
    }
  } catch (err) {
    return { ok: false, error: `No se pudo leer el pedido: ${err instanceof Error ? err.message : String(err)}` };
  }
  // Gift card (08/10): el narrador todavía no tiene teléfono. Espera en
  // regalo_pendiente hasta que escriba con su código (supabase/CONTRATO.md).
  const esRegalo = extras?.regalo === true;

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
    return { ok: true, yaEstaba: true, email: null, codigoRegalo: null };
  }

  // 2. El narrador arranca. Solo desde pendiente_pago: si por alguna razón ya
  //    estaba más adelante, no se lo retrocede.
  const { data: arrancados, error: errorNarrador } = await admin
    .from("narradores")
    .update({ estado: esRegalo ? "regalo_pendiente" : "invitado" })
    .eq("id", pedido.narrador_id)
    .eq("estado", "pendiente_pago")
    .select("id");
  // Si no había nada que arrancar, este pedido era de extras (copias, marcos)
  // sobre un libro que ya existe: se cobró, pero no hay "hoy le escribimos".
  const arranco = ((arrancados as { id: string }[] | null) ?? []).length > 0;

  if (errorNarrador) {
    // El pedido ya quedó pagado; devolver error hace que el proveedor
    // reintente, y el reintento entra por "yaEstaba" sin arreglar esto. Se
    // loguea fuerte y se sigue: es preferible un narrador que hay que
    // destrabar a mano antes que un pago cobrado y marcado pendiente.
    console.error(`confirmarPago: el pedido ${pedidoId} quedó pagado pero el narrador ${pedido.narrador_id} no pasó a ${esRegalo ? "regalo_pendiente" : "invitado"}:`, errorNarrador.message);
  }

  // 3. La entrega de lo físico (3t.26): si el pedido lleva impreso o marcos,
  //    nace su fila en `sin_direccion` y la familia carga la dirección desde
  //    Encargar libro. Si algo falla acá NO se toca el resultado del pago: el
  //    cobro está hecho y una entrega se puede crear después a mano.
  try {
    const productos = productosDelPedido(extras);
    if (necesitaEntrega(productos)) {
      const { error } = await admin.from("entregas").insert({
        pedido_id: pedido.id,
        narrador_id: pedido.narrador_id,
        familia_id: pedido.familia_id,
        estado: "sin_direccion",
        origen: region ?? "AR",
      });
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    console.error(`confirmarPago: el pedido ${pedidoId} quedó pagado pero no pude crear su entrega:`, err);
  }

  // 4. El mail: de acceso, o (regalo) el de la tarjeta.
  const [{ data: familia }, { data: narrador }] = await Promise.all([
    admin.from("familias").select("email").eq("id", pedido.familia_id).maybeSingle(),
    admin.from("narradores").select("como_le_dicen").eq("id", pedido.narrador_id).maybeSingle(),
  ]);

  const email = (familia as { email?: string } | null)?.email ?? null;
  let codigoRegalo: string | null = null;
  if (esRegalo) {
    const { data: regalo } = await admin.from("regalos").select("codigo").eq("narrador_id", pedido.narrador_id).maybeSingle();
    codigoRegalo = (regalo as { codigo?: string } | null)?.codigo ?? null;
  }
  if (email && arranco) {
    try {
      const comoLeDicen = (narrador as { como_le_dicen?: string } | null)?.como_le_dicen ?? "tu familiar";
      if (esRegalo) {
        if (codigoRegalo && opciones.enviarMailRegalo) {
          await opciones.enviarMailRegalo({ para: email, comoLeDicen, codigo: codigoRegalo });
        } else {
          console.error(`confirmarPago: el regalo del pedido ${pedidoId} (narrador ${pedido.narrador_id}) se pagó pero no salió el mail de la tarjeta: ${codigoRegalo ? "falta enviarMailRegalo" : "sin código en regalos"}.`);
        }
      } else {
        await enviarMailAcceso({ para: email, comoLeDicen });
      }
    } catch (err) {
      console.error(`confirmarPago: el pago ${pedidoId} se confirmó pero el ${esRegalo ? "mail del regalo" : "mail de acceso"} a ${email} falló:`, err);
    }
  }

  return { ok: true, yaEstaba: false, email, codigoRegalo };
}
