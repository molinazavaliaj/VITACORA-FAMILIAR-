import type { Region } from "./precios";

// La región inicial por el país del visitante (2.12, 21/09). Antes la tienda
// arrancaba siempre en Argentina y quien entraba desde España veía pesos.
// Vercel manda el país en `x-vercel-ip-country` (Cloudflare, `cf-ipcountry`).
// Europa → España (EUR); cualquier otro país, o ninguno (local) → Argentina,
// el default de siempre. Es solo el punto de partida: el selector de la
// pantalla sigue mandando.

const EUROPA = new Set([
  "ES", "PT", "FR", "IT", "DE", "NL", "BE", "LU", "AT", "CH", "IE", "GB", "DK", "SE", "NO", "FI",
  "IS", "PL", "CZ", "SK", "HU", "RO", "BG", "GR", "HR", "SI", "EE", "LV", "LT", "MT", "CY", "AD", "MC", "SM", "VA", "LI",
]);

export function regionDePais(codigo: string | null | undefined): Region {
  const pais = (codigo ?? "").trim().toUpperCase();
  return EUROPA.has(pais) ? "ES" : "AR";
}

export function regionDelRequest(headers: Headers): Region {
  return regionDePais(headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry"));
}
