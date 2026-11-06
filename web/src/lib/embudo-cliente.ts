import type { PasoEmbudo, RegionEmbudo } from "./embudo";

// Manda un paso del embudo al contador. Nunca frena ni rompe la compra: todo en try/catch,
// sin esperar respuesta. Una vez por paso por pestaña (sessionStorage). Sin cookies.

const MARCA_PAGAR = "vf-embudo-pagar";

/** `clave` distingue repeticiones legítimas (por ejemplo, el id del pedido en «pagado»). */
export function contarPaso(paso: PasoEmbudo, region: RegionEmbudo, clave = ""): void {
  try {
    if (typeof window === "undefined") return;
    const marca = `vf-embudo-${paso}${clave ? `-${clave}` : ""}`;
    try {
      if (window.sessionStorage.getItem(marca)) return;
      window.sessionStorage.setItem(marca, "1");
    } catch {
      // sin sessionStorage: se manda igual
    }
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
    const dispositivo = typeof window.matchMedia === "function" && window.matchMedia("(max-width: 767px)").matches ? "celular" : "compu";
    const cuerpo = new Blob([JSON.stringify({ compra: "familiar", paso, region, dispositivo })], { type: "application/json" });
    navigator.sendBeacon("/api/embudo", cuerpo);
  } catch {
    // el embudo nunca rompe la compra
  }
}

/**
 * «Pagado»: cuenta solo si en esta pestaña quedó la marca de «pagar», y la borra. Reabrir
 * gracias o entrar desde el mail ya no suma. Si Mercado Pago vuelve en otro contexto (su
 * app, otra pestaña, otro navegador) la marca no está y ese pago NO se cuenta: «pagado»
 * puede quedar por debajo de la realidad, nunca por encima.
 */
export function contarPagado(region: RegionEmbudo, pedidoId: string): void {
  try {
    if (typeof window === "undefined") return;
    if (!window.sessionStorage.getItem(MARCA_PAGAR)) return;
    contarPaso("pagado", region, pedidoId);
    window.sessionStorage.removeItem(MARCA_PAGAR);
  } catch {
    // sin sessionStorage no hay marca: no se cuenta
  }
}
