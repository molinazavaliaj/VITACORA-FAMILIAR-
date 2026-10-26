import { createHash } from "node:crypto";
import { COOKIE_CONSENTIMIENTO, idEventoCompra, idPixelMeta, leerConsentimiento } from "./medicion";

// El aviso a Meta desde el servidor cuando entra un pago (API de conversiones,
// 26/10). Ver lib/medicion.ts para las reglas. Dos mitades:
//
//   1. En /api/compra, `medicionDelRequest` mira si quien compra aceptó las
//      cookies. Solo si aceptó, el pedido guarda en `extras.medicion` lo que
//      Meta necesita para reconocer la visita: sus cookies `_fbp`/`_fbc`, el
//      navegador y la IP. Sin consentimiento no se guarda nada.
//   2. En confirmarPago, `avisarCompraAMeta` le manda a Meta la compra (importe,
//      moneda y el correo pasado por SHA-256, como pide Meta) con el mismo id
//      que manda el píxel en «Pedido confirmado», así no se cuenta dos veces.
//
// Nunca tira y nunca cambia el resultado del pago: si Meta no contesta, se
// escribe una línea en el log y listo.

export type MedicionPedido = {
  consentimiento: true;
  fbp?: string;
  fbc?: string;
  ip?: string;
  navegador?: string;
};

type Cookies = { get(nombre: string): { value: string } | undefined };

const LARGO_MAXIMO = 300;

function corto(valor: string | null | undefined): string | undefined {
  const v = (valor ?? "").trim();
  return v && v.length <= LARGO_MAXIMO ? v : undefined;
}

/** Lo que /api/compra guarda en `extras.medicion`, o undefined si no aceptó. */
export function medicionDelRequest(headers: Headers | undefined, cookies: Cookies | undefined): MedicionPedido | undefined {
  // Sin cookies legibles (un request armado a mano) es lo mismo que no haber aceptado: la compra nunca se rompe por esto.
  if (typeof cookies?.get !== "function") return undefined;
  if (leerConsentimiento(cookies.get(COOKIE_CONSENTIMIENTO)?.value) !== "si") return undefined;
  const ip = corto(headers?.get("x-forwarded-for")?.split(",")[0]);
  const fbp = corto(cookies.get("_fbp")?.value);
  const fbc = corto(cookies.get("_fbc")?.value);
  const navegador = corto(headers?.get("user-agent"));
  return {
    consentimiento: true,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...(ip ? { ip } : {}),
    ...(navegador ? { navegador } : {}),
  };
}

/** `extras.medicion` leído de la base, solo si dice que aceptó. */
export function leerMedicion(extras: Record<string, unknown> | undefined): MedicionPedido | null {
  const m = extras?.medicion as Record<string, unknown> | undefined;
  if (!m || m.consentimiento !== true) return null;
  const texto = (v: unknown) => (typeof v === "string" ? corto(v) : undefined);
  const fbp = texto(m.fbp);
  const fbc = texto(m.fbc);
  const ip = texto(m.ip);
  const navegador = texto(m.navegador);
  return {
    consentimiento: true,
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...(ip ? { ip } : {}),
    ...(navegador ? { navegador } : {}),
  };
}

const sha256 = (texto: string) => createHash("sha256").update(texto.trim().toLowerCase()).digest("hex");

/**
 * El `fbc` que Meta entiende. Si no hay cookie `_fbc` pero la visita llegó con
 * `fbclid` (extras.origen), se arma como dice Meta: `fb.1.<milisegundos>.<fbclid>`.
 */
function fbcDe(medicion: MedicionPedido, extras: Record<string, unknown> | undefined): string | undefined {
  if (medicion.fbc) return medicion.fbc;
  const origen = extras?.origen as { ultimo?: { fbclid?: unknown; fecha?: unknown }; primero?: { fbclid?: unknown; fecha?: unknown } } | undefined;
  const toque = typeof origen?.ultimo?.fbclid === "string" ? origen.ultimo : origen?.primero;
  if (typeof toque?.fbclid !== "string") return undefined;
  const ms = typeof toque.fecha === "string" ? Date.parse(toque.fecha) : NaN;
  return `fb.1.${Number.isFinite(ms) ? ms : Date.now()}.${toque.fbclid}`;
}

export type CompraParaMeta = {
  pedidoId: string;
  monto: number | null;
  moneda: string | null;
  email: string | null;
  region: "ES" | "AR" | undefined;
  extras: Record<string, unknown> | undefined;
  ahora: Date;
};

/** El cuerpo que va a Meta, o null si no aceptó o falta el importe. */
export function eventoCompra(compra: CompraParaMeta): Record<string, unknown> | null {
  const medicion = leerMedicion(compra.extras);
  if (!medicion) return null;
  if (compra.monto === null || !Number.isFinite(compra.monto) || !compra.moneda) return null;
  const fbc = fbcDe(medicion, compra.extras);
  const usuario: Record<string, unknown> = {
    ...(compra.email ? { em: [sha256(compra.email)] } : {}),
    ...(compra.region ? { country: [sha256(compra.region)] } : {}),
    ...(medicion.fbp ? { fbp: medicion.fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...(medicion.ip ? { client_ip_address: medicion.ip } : {}),
    ...(medicion.navegador ? { client_user_agent: medicion.navegador } : {}),
  };
  return {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(compra.ahora.getTime() / 1000),
        event_id: idEventoCompra(compra.pedidoId),
        action_source: "website",
        user_data: usuario,
        custom_data: { value: compra.monto, currency: compra.moneda.toUpperCase(), order_id: compra.pedidoId },
      },
    ],
    ...(process.env.META_CAPI_TEST_CODE ? { test_event_code: process.env.META_CAPI_TEST_CODE } : {}),
  };
}

export type ResultadoAvisoMeta = "enviado" | "sin-consentimiento" | "sin-configurar" | "error";

/** Le avisa a Meta la compra. Nunca tira. */
export async function avisarCompraAMeta(
  compra: CompraParaMeta,
  deps: { fetch: typeof fetch } = { fetch },
): Promise<ResultadoAvisoMeta> {
  const pixel = idPixelMeta();
  const token = (process.env.META_CAPI_TOKEN ?? "").trim();
  if (!pixel || !token) return "sin-configurar";
  let cuerpo: Record<string, unknown> | null;
  try {
    cuerpo = eventoCompra(compra);
  } catch (err) {
    console.error(`meta: no pude armar la compra del pedido ${compra.pedidoId}`, err);
    return "error";
  }
  if (!cuerpo) return "sin-consentimiento";
  const version = (process.env.META_GRAPH_VERSION ?? "").trim() || "v24.0";
  try {
    const r = await deps.fetch(`https://graph.facebook.com/${version}/${pixel}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // El token va en el cuerpo y no en la URL, para que no quede en ningún log.
      body: JSON.stringify({ ...cuerpo, access_token: token }),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) {
      const detalle = await r.text().catch(() => "");
      console.error(`meta: la compra del pedido ${compra.pedidoId} volvió ${r.status}: ${detalle.slice(0, 300)}`);
      return "error";
    }
    console.log(`meta: compra avisada (${compra.pedidoId})`);
    return "enviado";
  } catch (err) {
    console.error(`meta: no pude avisar la compra del pedido ${compra.pedidoId}`, err);
    return "error";
  }
}
