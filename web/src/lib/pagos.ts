import Stripe from "stripe";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { firmarToken } from "./token-firmado";
import type { Compra } from "@/lib/productos";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";

// Crea el link de pago (Stripe para ES, Mercado Pago para AR) a partir de una
// compra ya calculada (productos.ts). Los clientes de cada SDK se instancian
// recién acá adentro para que las variables de entorno se lean en el momento
// de la llamada, no al importar el módulo.
//
// Pago por adelantado (11/09): el éxito vuelve a /comprar/gracias, no al
// tablero — la compradora todavía no tiene sesión.

type Pedido = { id: string; email: string };

/**
 * De qué pantalla salió la compra (rediseño 2026-10). Con esto la pasarela
 * vuelve a la versión del idioma correcto: si no cobró, a la misma compra con
 * `?pago=fallido` (ahí se restaura lo elegido, Casos 2); si cobró, la vuelta
 * lleva el idioma para que «Pedido confirmado» hable igual. Sin esto (el panel,
 * Encargar libro), todo queda como antes.
 */
export type OrigenCompra = { idioma: IdiomaWeb; pantalla?: "comprar" | "regalar" };

export async function crearCheckout(pedido: Pedido, compra: Compra, origen?: OrigenCompra): Promise<{ urlPago: string }> {
  // Vitácora de viaje: la pantalla de gracias explica cómo arrancar por WhatsApp, y "atrás" vuelve a su compra.
  const esViaje = compra.lineas.some((l) => l.id === "viaje");
  const vuelta = esViaje ? "/viaje" : "";
  const urlBase = process.env.URL_BASE;
  // 3t.20: al cobrar, el proveedor vuelve a NUESTRA ruta con un token firmado
  // atado al pedido (1 hora): ahí se verifica el pago con el proveedor, se
  // confirma el pedido aunque el webhook falle, y se abre la sesión.
  const urlVuelta = `${urlBase}/api/pago/vuelta?pedido=${encodeURIComponent(pedido.id)}&t=${firmarToken("vuelta", pedido.id)}${esViaje ? "&viaje=1" : ""}${origen ? `&idioma=${origen.idioma}` : ""}`;
  // Si no se cobró (cancelar, tarjeta rechazada): de vuelta a la compra de donde salió.
  const urlCancelada = origen
    ? `${urlBase}${ruta(origen.idioma, origen.pantalla === "regalar" ? "/regalar" : `/comprar${vuelta}`)}?pago=fallido`
    : `${urlBase}/comprar${vuelta}`;

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
      success_url: `${urlVuelta}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: urlCancelada,
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
      // Lo que se lee en el resumen de la tarjeta (máx. 22 caracteres). El
      // nombre del vendedor en el mail de MP sale de la cuenta, no de acá.
      statement_descriptor: "VITACORA",
      back_urls: {
        success: urlVuelta,
        failure: urlCancelada,
      },
      // MP rechaza auto_return si la URL de vuelta no es https pública (en
      // local, con localhost, tira "invalid_auto_return"). En producción va.
      ...(urlBase?.startsWith("https://") ? { auto_return: "approved" as const } : {}),
    },
  });

  if (!preference.init_point) {
    throw new Error("Mercado Pago no devolvió una URL de pago.");
  }

  return { urlPago: preference.init_point };
}
