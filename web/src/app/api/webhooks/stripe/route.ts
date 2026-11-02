import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { confirmarPago } from "@/lib/confirmar-pago";
import { enviarMailAcceso, enviarMailRegalo } from "@/lib/mail";

// Stripe firma cada request con STRIPE_WEBHOOK_SECRET; constructEvent es lo
// que valida esa firma contra el cuerpo crudo (sin parsear) del request.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const firma = request.headers.get("stripe-signature");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, firma ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("webhook stripe: firma invalida", err);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  // Con un medio de pago diferido (SEPA, Multibanco: se activan desde el
  // Dashboard, no desde el código) `completed` llega con la sesión todavía
  // `unpaid`: el cobro entra o se cae horas o días después, con
  // `async_payment_succeeded` o `async_payment_failed`. Confirmar en
  // `completed` sin mirar `payment_status` arrancaría la entrevista de un
  // pedido que quizás nunca se cobra.
  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.warn(`webhook stripe: el pago diferido del pedido ${session.metadata?.pedido_id ?? "sin pedido_id"} no entró (sesión ${session.id}); el pedido sigue pendiente.`);
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const pedidoId = session.metadata?.pedido_id;

    if (session.payment_status === "unpaid") {
      console.warn(`webhook stripe: el pedido ${pedidoId ?? "sin pedido_id"} completó el checkout con un pago diferido (sesión ${session.id}); se confirma cuando llegue async_payment_succeeded.`);
    } else if (pedidoId) {
      // Todo lo que significa "pagó" vive en confirmarPago (pedido, narrador,
      // mail de acceso). Un error ahí es NUESTRO (la base, no la
      // notificación) — devolver 500 para que Stripe reintente, en vez de un
      // 200 que lo daría por hecho y dejaría el pedido cobrado pero marcado
      // "pendiente" para siempre.
      const resultado = await confirmarPago(crearClienteServidor(), {
        pedidoId,
        referenciaExterna: session.id,
        enviarMailAcceso,
        enviarMailRegalo,
      });
      if (!resultado.ok) {
        console.error("webhook stripe: fallo confirmar el pago", resultado.error);
        return NextResponse.json({ error: "No se pudo actualizar el pedido." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
