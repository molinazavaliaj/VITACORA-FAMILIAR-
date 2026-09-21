import { createHmac, timingSafeEqual } from "node:crypto";

// Un token firmado por el servidor: atado a un PROPÓSITO y a un SUJETO, con
// vencimiento corto. Sirve para dar un permiso puntual a quien todavía no
// tiene sesión (la compra dura minutos): subir las fotos del paso 5 (17/09) y
// volver del pago directo al panel (3t.20). Un token de un propósito no sirve
// para otro, ni para otro sujeto, ni pasada la hora.

export type Proposito = "fotos" | "vuelta";

const VIGENCIA_MS = 60 * 60 * 1000; // una hora

function clave(): string {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para firmar tokens.");
  return k;
}

function firma(proposito: Proposito, sujeto: string, vence: number): string {
  return createHmac("sha256", clave()).update(`${proposito}:${sujeto}:${vence}`).digest("hex");
}

export function firmarToken(proposito: Proposito, sujeto: string, ahora = Date.now()): string {
  const vence = ahora + VIGENCIA_MS;
  return `${vence}.${firma(proposito, sujeto, vence)}`;
}

export function verificarToken(proposito: Proposito, token: string | null, sujeto: string, ahora = Date.now()): boolean {
  if (!token) return false;
  const [venceTexto, firmaRecibida] = token.split(".");
  const vence = Number(venceTexto);
  if (!Number.isFinite(vence) || vence < ahora || !firmaRecibida || !/^[0-9a-f]+$/.test(firmaRecibida)) return false;
  const esperada = Buffer.from(firma(proposito, sujeto, vence), "hex");
  const recibida = Buffer.from(firmaRecibida, "hex");
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}
