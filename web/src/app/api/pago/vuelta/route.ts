import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { confirmarPago } from "@/lib/confirmar-pago";
import { enviarMailAcceso } from "@/lib/mail";
import { verificarToken } from "@/lib/token-firmado";

// Adonde vuelve el proveedor después de cobrar (3t.20, 21/09). Tres cosas, en
// orden, y ninguna confía en los query params más allá de los ids:
//   1. El pago se verifica CON EL PROVEEDOR (MP: Payment.get; Stripe: la
//      sesión de checkout). Aprobado y del mismo pedido, o no seguimos.
//   2. El pedido se confirma con la misma confirmarPago del webhook. Es
//      idempotente: si el webhook llegó antes, `yaEstaba` y seguimos. Si el
//      webhook falla (21/09: dos pagos reales quedaron pendientes), acá se
//      confirma igual.
//   3. La sesión de la compradora se abre sin mail ni código: un magic link
//      generado en el servidor y verificado acá mismo (el token no sale del
//      servidor). Con eso cae en /tablero/<narrador>.
// La puerta es el token firmado de la URL (1 hora, atado al pedido): solo lo
// tiene el navegador que pagó. Si algo falla, se cae a /comprar/gracias, la
// pantalla de siempre — nunca un error crudo a quien acaba de pagar.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const pedidoId = params.get("pedido");
  const esViaje = params.get("viaje") === "1";
  const urlBase = process.env.URL_BASE ?? request.nextUrl.origin;
  const gracias = NextResponse.redirect(`${urlBase}/comprar/gracias${esViaje ? "?viaje=1" : ""}`);

  if (!pedidoId || !verificarToken("vuelta", params.get("t"), pedidoId)) return gracias;

  const admin = crearClienteServidor();
  const { data: fila } = await admin.from("pedidos").select("id, proveedor, estado, familia_id, narrador_id").eq("id", pedidoId).maybeSingle();
  const pedido = fila as { id: string; proveedor: string; estado: string; familia_id: string; narrador_id: string } | null;
  if (!pedido) return gracias;

  // 1. Verificar el pago con el proveedor.
  let referencia: string | null = null;
  try {
    if (pedido.proveedor === "mercadopago") {
      const paymentId = params.get("payment_id") ?? params.get("collection_id");
      if (!paymentId) return gracias;
      const pago = await new Payment(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })).get({ id: paymentId });
      if (pago.status !== "approved" || pago.external_reference !== pedido.id) return gracias;
      referencia = String(pago.id ?? paymentId);
    } else if (pedido.proveedor === "stripe") {
      const sessionId = params.get("session_id");
      if (!sessionId) return gracias;
      const sesion = await new Stripe(process.env.STRIPE_SECRET_KEY!).checkout.sessions.retrieve(sessionId);
      if (sesion.payment_status !== "paid" || sesion.metadata?.pedido_id !== pedido.id) return gracias;
      referencia = sesion.id;
    } else {
      return gracias;
    }
  } catch (err) {
    console.error(`pago/vuelta: no pude verificar el pago del pedido ${pedido.id}:`, err);
    return gracias;
  }

  // 2. Confirmar el pedido (idempotente con el webhook).
  const resultado = await confirmarPago(admin, { pedidoId: pedido.id, referenciaExterna: referencia, enviarMailAcceso });
  if (!resultado.ok) {
    console.error(`pago/vuelta: el pago ${referencia} está aprobado pero no pude confirmar el pedido ${pedido.id}:`, resultado.error);
    return gracias;
  }

  // 3. Abrir la sesión de la compradora y llevarla a su libro.
  try {
    const { data: familia } = await admin.from("familias").select("email").eq("id", pedido.familia_id).maybeSingle();
    const email = (familia as { email?: string } | null)?.email?.trim().toLowerCase();
    if (!email) return gracias;

    // La cuenta nace con el primer login; si todavía no existe, se crea acá.
    const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existe = (lista?.users ?? []).some((u) => u.email?.toLowerCase() === email);
    if (!existe) {
      const { error } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (error && !/already|exists|registered/i.test(error.message)) throw error;
    }
    const { data: link, error: errorLink } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (errorLink || !tokenHash) throw errorLink ?? new Error("sin hashed_token");

    const sesion = await crearClienteSesion();
    const { data, error } = await sesion.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
    if (error || !data?.session) throw error ?? new Error("sin sesión");
  } catch (err) {
    console.error(`pago/vuelta: el pedido ${pedido.id} quedó confirmado pero no pude abrir la sesión:`, err);
    return gracias;
  }

  return NextResponse.redirect(`${urlBase}/tablero/${pedido.narrador_id}`);
}
