import Stripe from "stripe";
import { MercadoPagoConfig, Preference } from "mercadopago";
import type { Compra } from "@/lib/productos";

// Crea el link de pago (Stripe para ES, Mercado Pago para AR) a partir de una
// compra ya calculada (productos.ts). Los clientes de cada SDK se instancian
// recién acá adentro para que las variables de entorno se lean en el momento
// de la llamada, no al importar el módulo.
//
// Pago por adelantado (11/09): el éxito vuelve a /comprar/gracias, no al
// tablero — la compradora todavía no tiene sesión.

type Pedido = { id: string; email: string };

export async function crearCheckout(pedido: Pedido, compra: Compra): Promise<{ urlPago: string }> {
  const urlBase = process.env.URL_BASE;

  if (compra.region === "ES") {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: pedido.email,
      line_items: compra.lineas.map((linea) => ({
        price_data: {
          currency: "eur",
          // Math.round: precios con decimales (19.99) dan un *100 no entero
          // por coma flotante — Stripe exige centavos como entero.
          unit_amount: Math.round(linea.precioUnitario * 100),
          product_data: { name: linea.nombre },
        },
        quantity: linea.cantidad,
      })),
      metadata: { pedido_id: pedido.id },
      success_url: `${urlBase}/comprar/gracias`,
      cancel_url: `${urlBase}/comprar`,
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de pago.");
    }

    return { urlPago: session.url };
  }

  const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

  const preference = await new Preference(client).create({
    body: {
      items: compra.lineas.map((linea) => ({
        id: linea.id,
        title: linea.nombre,
        quantity: linea.cantidad,
        unit_price: linea.precioUnitario,
        currency_id: "ARS",
      })),
      external_reference: pedido.id,
      back_urls: {
        success: `${urlBase}/comprar/gracias`,
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
