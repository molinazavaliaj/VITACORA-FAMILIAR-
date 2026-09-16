import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { confirmarPago } from "@/lib/confirmar-pago";
import { enviarMailAcceso } from "@/lib/mail";
import { verificarFirmaMP } from "@/lib/firma-mp";

// Dos candados. (1) La firma: MP manda `x-signature` (HMAC con la clave del
// webhook, MP_WEBHOOK_SECRET); si no coincide, 401 y no gastamos una llamada
// (bitácora #9, 16/09). (2) La verdad: consultamos el pago DIRECTO contra la
// API de MP con nuestro access token y solo confiamos en esa respuesta — nunca
// en el payload de la notificación.
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // La firma se calcula sobre el data.id de la URL, así que se verifica antes
  // de mirar el cuerpo. Sin secreto configurado se avisa y se sigue (entorno
  // local); en producción la variable está.
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (secreto && paymentId) {
    const valida = verificarFirmaMP({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId: paymentId,
      secreto,
    });
    if (!valida) {
      console.warn("webhook mercadopago: firma inválida, se ignora");
      return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
    }
  } else if (!secreto) {
    console.warn("webhook mercadopago: MP_WEBHOOK_SECRET no configurado, no se verifica la firma");
  }

  if (!paymentId) {
    try {
      const body = (await request.json()) as { data?: { id?: string | number } };
      paymentId = body?.data?.id != null ? String(body.data.id) : null;
    } catch {
      // Sin cuerpo JSON válido: seguimos sin id.
    }
  }

  if (!paymentId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  let payment: Awaited<ReturnType<InstanceType<typeof Payment>["get"]>>;
  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    payment = await new Payment(client).get({ id: paymentId });
  } catch (err) {
    // La llamada en sí falló (red caída, 5xx transitorio de MP, etc.) — esto
    // es NUESTRO, no un juicio sobre la notificación. Devolver 500 para que
    // MP reintente; un 200 acá lo daría por "notificación irrelevante" y el
    // pedido se quedaría cobrado pero marcado "pendiente" para siempre.
    console.error("webhook mercadopago: fallo consultar el pago", err);
    return NextResponse.json({ error: "No se pudo consultar el pago." }, { status: 500 });
  }

  // A partir de acá, la consulta a MP respondió: si no está aprobado o no
  // trae referencia, es una notificación irrelevante de verdad (pago
  // rechazado, pendiente, etc.) — un 200 es correcto.
  if (payment.status === "approved" && payment.external_reference) {
    // Misma confirmación que Stripe: pedido, narrador y mail de acceso en un
    // solo lugar. Un error ahí es NUESTRO (la base, no la notificación) —
    // devolver 500 para que MP reintente, en vez de un 200 que lo daría por
    // hecho y dejaría el pedido cobrado pero marcado "pendiente" para siempre.
    const resultado = await confirmarPago(crearClienteServidor(), {
      pedidoId: payment.external_reference,
      referenciaExterna: String(payment.id),
      enviarMailAcceso,
    });
    if (!resultado.ok) {
      console.error("webhook mercadopago: fallo confirmar el pago", resultado.error);
      return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
