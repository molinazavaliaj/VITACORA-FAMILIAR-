// La medición en el navegador (26/10): el píxel de Meta y la etiqueta de
// Google Ads, que solo se cargan si la persona aceptó (lib/medicion.ts).
// `medir` no hace nada si no están cargados: se puede llamar siempre.

import {
  COOKIE_CONSENTIMIENTO,
  DURACION_CONSENTIMIENTO,
  etiquetaCompraGoogle,
  idEventoCompra,
  idGoogleAds,
  idPixelMeta,
  leerConsentimiento,
  valorConsentimiento,
  type Consentimiento,
} from "./medicion";

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[][]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: unknown };
type Ventana = Window & { fbq?: Fbq; _fbq?: Fbq; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/** El evento con el que «Cookies», al pie, vuelve a abrir el aviso. */
export const EVENTO_ABRIR_COOKIES = "vitacora:cookies";

export function decisionGuardada(doc: Document = document): Consentimiento | null {
  const par = doc.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_CONSENTIMIENTO}=`));
  return leerConsentimiento(par ? decodeURIComponent(par.slice(COOKIE_CONSENTIMIENTO.length + 1)) : null);
}

export function guardarDecision(decision: Consentimiento, doc: Document = document) {
  const segura = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  doc.cookie = `${COOKIE_CONSENTIMIENTO}=${valorConsentimiento(decision)}; Max-Age=${DURACION_CONSENTIMIENTO}; Path=/; SameSite=Lax${segura}`;
}

/** Borra las cookies que dejan Meta y Google, para cuando alguien rechaza después de haber aceptado. */
export function borrarCookiesDeMedicion(doc: Document = document) {
  const dominio = typeof location !== "undefined" ? location.hostname.replace(/^www\./, "") : "";
  for (const par of doc.cookie.split("; ")) {
    const nombre = par.split("=")[0];
    if (!/^(_fbp|_fbc|_gcl_\w+|_ga\w*)$/.test(nombre)) continue;
    for (const d of ["", `; Domain=${dominio}`, `; Domain=.${dominio}`]) {
      doc.cookie = `${nombre}=; Max-Age=0; Path=/${d}`;
    }
  }
}

function cargarScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Carga Meta y Google. Solo se llama con la decisión «sí». */
export function cargarMedicion() {
  const w = window as Ventana;
  const pixel = idPixelMeta();
  if (pixel && !w.fbq) {
    // El arranque oficial del píxel, escrito sin el código minificado.
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    } as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
    w.fbq = fbq;
    w._fbq = fbq;
    cargarScript("https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", pixel);
  }
  const google = idGoogleAds();
  if (google && !w.gtag) {
    w.dataLayer = w.dataLayer ?? [];
    w.gtag = function () {
      // gtag necesita el objeto `arguments`, no un array.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    // Modo de consentimiento de Google: ya aceptó (si no, esto no corre).
    w.gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "denied" });
    w.gtag("js", new Date());
    w.gtag("config", google);
    cargarScript(`https://www.googletagmanager.com/gtag/js?id=${google}`);
  }
}

/** Una visita a una página (se llama en cada cambio de página). */
export function medirVisita() {
  const w = window as Ventana;
  w.fbq?.("track", "PageView");
}

/** Empezó a pagar: el botón de pagar mandó la compra. */
export function medirInicioDePago(valor: number | null, moneda: string | null) {
  if (typeof window === "undefined") return;
  const w = window as Ventana;
  const datos = valor !== null && moneda ? { value: valor, currency: moneda.toUpperCase() } : {};
  w.fbq?.("track", "InitiateCheckout", datos);
}

/** La compra, en «Pedido confirmado», con el mismo id que manda el servidor. */
export function medirCompra(pedidoId: string, valor: number, moneda: string) {
  const w = window as Ventana;
  const datos = { value: valor, currency: moneda.toUpperCase() };
  w.fbq?.("track", "Purchase", datos, { eventID: idEventoCompra(pedidoId) });
  const etiqueta = etiquetaCompraGoogle();
  if (etiqueta) w.gtag?.("event", "conversion", { send_to: etiqueta, ...datos, transaction_id: pedidoId });
}
