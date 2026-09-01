import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Mercado Pago no firma la notificación como Stripe: la "autenticación" acá
// es que consultamos el pago DIRECTO contra la API de MP con nuestro propio
// access token, y solo confiamos en lo que esa respuesta dice — nunca en el
// payload que llega en la notificación (podría venir de cualquiera).
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  let paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

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

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const payment = await new Payment(client).get({ id: paymentId });

    if (payment.status === "approved" && payment.external_reference) {
      const admin = crearClienteServidor();
      const { error } = await admin
        .from("pedidos")
        .update({ estado: "pagado", referencia_externa: String(payment.id) })
        .eq("id", payment.external_reference)
        .eq("estado", "pendiente");

      if (error) {
        // Un error acá es NUESTRO (la base, no la notificación) — devolver
        // 500 para que MP reintente, en vez de un 200 que lo daría por hecho
        // y dejaría el pedido cobrado pero marcado "pendiente" para siempre.
        console.error("webhook mercadopago: fallo actualizar el pedido", error);
        return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
      }
    }
  } catch (err) {
    // Esto sí puede ser una notificación irrelevante/mal formada (o un
    // problema transitorio consultando la API de MP) — acá el 200 es
    // correcto para no generar reintentos infinitos por algo que no es
    // culpa nuestra.
    console.error("webhook mercadopago: fallo consultar el pago", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
