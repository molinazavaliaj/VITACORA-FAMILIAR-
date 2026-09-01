import Stripe from "stripe";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Crea el link de pago (Stripe para ES, Mercado Pago para AR). Los clientes
// de cada SDK se instancian recién acá adentro para que las variables de
// entorno se lean en el momento de la llamada, no al importar el módulo.

const NOMBRE_PRODUCTO = "Vitácora Familiar — Libro y audiolibro de su vida";

type Pedido = { id: string; region: "ES" | "AR"; email: string };

export async function crearCheckout(pedido: Pedido): Promise<{ urlPago: string }> {
  const urlBase = process.env.URL_BASE;

  if (pedido.region === "ES") {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const precioEur = Number(process.env.PRECIO_EUR || "49");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: pedido.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: precioEur * 100,
            product_data: { name: NOMBRE_PRODUCTO },
          },
          quantity: 1,
        },
      ],
      metadata: { pedido_id: pedido.id },
      success_url: `${urlBase}/tablero/descarga`,
      cancel_url: `${urlBase}/comprar`,
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de pago.");
    }

    return { urlPago: session.url };
  }

  const precioArs = process.env.PRECIO_ARS || "49999";
  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

  const preference = await new Preference(client).create({
    body: {
      items: [
        {
          id: "vitacora",
          title: NOMBRE_PRODUCTO,
          quantity: 1,
          unit_price: Number(precioArs),
          currency_id: "ARS",
        },
      ],
      external_reference: pedido.id,
      back_urls: {
        success: `${urlBase}/tablero/descarga`,
        failure: `${urlBase}/comprar`,
      },
      auto_return: "approved",
    },
  });

  if (!preference.init_point) {
    throw new Error("Mercado Pago no devolvió una URL de pago.");
  }

  return { urlPago: preference.init_point };
}
