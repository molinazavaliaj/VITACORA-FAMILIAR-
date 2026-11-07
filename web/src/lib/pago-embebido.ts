import Stripe from "stripe";
import { firmarToken, verificarToken } from "./token-firmado";
import type { IdiomaWeb } from "./idioma-web";

// El pago embebido de España (06/11): la compra crea la sesión de Stripe como
// siempre (lib/pagos.ts) y `urlPago` apunta a NUESTRA página /pagar en vez de a
// checkout.stripe.com. Así el resto del flujo (guardar lo elegido, ir al pago,
// volver por /api/pago/vuelta) no se entera del cambio.
//
// La URL lleva el id de la sesión y adónde vuelve quien se arrepiente, atados
// por un token firmado (1 hora): nadie abre /pagar con otra sesión ni arma un
// enlace que después lo saque a otro sitio. El secreto de la sesión no viaja en
// la URL: lo pide esta función a Stripe, del lado del servidor.

function sujetoDelToken(sesionId: string, volver: string): string {
  return `${sesionId}|${volver}`;
}

export function urlFormularioPago(urlBase: string, sesionId: string, volver: string, idioma?: IdiomaWeb): string {
  const q = new URLSearchParams({ s: sesionId, v: volver, t: firmarToken("pago", sujetoDelToken(sesionId, volver)), ...(idioma ? { idioma } : {}) });
  return `${urlBase}/pagar?${q}`;
}

/**
 * De qué compra viene el pago, por el camino de vuelta (lib/pagos.ts lo arma
 * con la pantalla de origen: /comprar/kids, /comprar/historia, /comprar/viaje,
 * con o sin prefijo de idioma). Con eso /pagar lleva el acento y el logo de
 * esa compra; antes solo distinguía viaje y Kids salía en bordó (07/11).
 */
export function productoDeLaVuelta(volver: string): "familiar" | "viaje" | "kids" | "historia" {
  const camino = volver.split(/[?#]/)[0];
  if (/\/comprar\/kids$/.test(camino)) return "kids";
  if (/\/comprar\/historia$/.test(camino)) return "historia";
  if (/\/comprar\/viaje$/.test(camino)) return "viaje";
  return "familiar";
}

export type FormularioPago =
  | { tipo: "mostrar"; clavePublica: string; secretoSesion: string; volver: string }
  | { tipo: "ir"; a: string };

/**
 * Qué hacer al abrir /pagar. Nunca un error crudo a quien está por pagar: con un
 * enlace vencido o una sesión que ya no sirve vuelve a su compra, y si ya pagó
 * (recargó, o volvió atrás desde la vuelta) sigue a la confirmación.
 */
export async function leerFormularioPago(
  params: { s: unknown; v: unknown; t: unknown },
  compraPorDefecto: string,
): Promise<FormularioPago> {
  const { s: sesionId, v: volver, t: token } = params;
  if (typeof sesionId !== "string" || typeof volver !== "string" || typeof token !== "string") return { tipo: "ir", a: compraPorDefecto };
  if (!verificarToken("pago", token, sujetoDelToken(sesionId, volver))) return { tipo: "ir", a: compraPorDefecto };

  const clavePublica = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!clavePublica) return { tipo: "ir", a: volver };

  try {
    const sesion = await new Stripe(process.env.STRIPE_SECRET_KEY!).checkout.sessions.retrieve(sesionId);
    if (sesion.status === "complete" && sesion.return_url) {
      return { tipo: "ir", a: sesion.return_url.replace("{CHECKOUT_SESSION_ID}", sesion.id) };
    }
    if (sesion.status === "open" && sesion.client_secret) {
      return { tipo: "mostrar", clavePublica, secretoSesion: sesion.client_secret, volver };
    }
    console.error(`pagar: la sesión ${sesionId} no se puede mostrar (estado ${sesion.status}).`);
  } catch (err) {
    console.error(`pagar: no pude leer la sesión ${sesionId}:`, err);
  }
  return { tipo: "ir", a: volver };
}
