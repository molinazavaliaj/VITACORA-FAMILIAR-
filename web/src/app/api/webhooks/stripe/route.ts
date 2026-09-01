import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { crearClienteServidor } from "@/lib/supabase/servidor";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const pedidoId = session.metadata?.pedido_id;

    if (pedidoId) {
      const admin = crearClienteServidor();
      const { error } = await admin
        .from("pedidos")
        .update({ estado: "pagado", referencia_externa: session.id })
        .eq("id", pedidoId)
        .eq("estado", "pendiente");

      if (error) {
        console.error("webhook stripe: fallo actualizar el pedido", error);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
