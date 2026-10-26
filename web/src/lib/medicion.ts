// La medición de anuncios (26/10): el píxel de Meta, la etiqueta de Google Ads
// y el aviso a Meta desde el servidor cuando entra un pago (API de
// conversiones). Hasta hoy la web no tenía nada de esto a propósito (lib/origen.ts,
// art. 22.2 LSSI): en España esas herramientas piden consentimiento.
//
// Reglas:
//   - Todo está APAGADO mientras no haya un id en Vercel
//     (NEXT_PUBLIC_META_PIXEL_ID o NEXT_PUBLIC_GOOGLE_ADS_ID). Sin id no hay
//     aviso de cookies, ni scripts, ni la sección de cookies cambia.
//   - Con un id, aparece el aviso. Nada de Meta ni de Google se carga hasta que
//     la persona acepta, y rechazar es igual de fácil que aceptar.
//   - La elección se guarda en una cookie técnica propia (`vitacora-cookies`)
//     durante un año. Desde «Cookies», al pie, se cambia cuando quiera.
//   - Al servidor solo le llega lo de la medición si aceptó: sin consentimiento,
//     el pedido no guarda nada y a Meta no se le avisa nada.
//
// Este archivo no toca el navegador ni el servidor: lo usan los dos.

export const COOKIE_CONSENTIMIENTO = "vitacora-cookies";
/** Un año, en segundos. */
export const DURACION_CONSENTIMIENTO = 60 * 60 * 24 * 365;
/** Si algún día cambia lo que se mide, se sube la versión y se vuelve a preguntar. */
const VERSION = "v1";

export type Consentimiento = "si" | "no";

/** Lo que se guarda en la cookie: `v1:si` o `v1:no`. */
export function valorConsentimiento(decision: Consentimiento): string {
  return `${VERSION}:${decision}`;
}

/** La decisión guardada, o null si no hay (o es de otra versión: se vuelve a preguntar). */
export function leerConsentimiento(valor: string | null | undefined): Consentimiento | null {
  if (valor === valorConsentimiento("si")) return "si";
  if (valor === valorConsentimiento("no")) return "no";
  return null;
}

/** El id del píxel de Meta, o null. Va en el navegador: es público. */
export function idPixelMeta(): string | null {
  const id = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").trim();
  return /^\d{5,20}$/.test(id) ? id : null;
}

/** El id de Google Ads (`AW-123…`), o null. */
export function idGoogleAds(): string | null {
  const id = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "").trim();
  return /^AW-\d{5,15}$/.test(id) ? id : null;
}

/**
 * La etiqueta de la conversión de compra de Google Ads (`AW-123/abcDEF`), o
 * null. Sin ella la etiqueta igual carga, pero la compra no se cuenta.
 */
export function etiquetaCompraGoogle(): string | null {
  const id = idGoogleAds();
  const etiqueta = (process.env.NEXT_PUBLIC_GOOGLE_ADS_COMPRA ?? "").trim();
  return id && /^[\w-]{4,40}$/.test(etiqueta) ? `${id}/${etiqueta}` : null;
}

/** Hay algo que medir: con esto aparece el aviso de cookies. */
export function medicionConfigurada(): boolean {
  return idPixelMeta() !== null || idGoogleAds() !== null;
}

/**
 * El id de la compra para Meta y Google. El navegador (en «Pedido confirmado»)
 * y el servidor (al entrar el pago) mandan el MISMO, así Meta cuenta una sola
 * compra aunque le llegue dos veces.
 */
export function idEventoCompra(pedidoId: string): string {
  return `compra-${pedidoId}`;
}
