import { createHmac, timingSafeEqual } from "node:crypto";

// Permiso para subir fotos SIN sesión, en el paso 5 de la compra (17/09).
// Quien compra todavía no entró nunca al panel (la cuenta nace con el primer
// login), pero ya tiene un narrador creado en `pendiente_pago`. /api/compra le
// devuelve este token, firmado con la clave del servidor, atado a ESE narrador
// y con vencimiento corto: alcanza para subir las fotos y pasar a pagar, y no
// sirve para nada más (ni leer, ni mover, ni otro narrador).

const VIGENCIA_MS = 60 * 60 * 1000; // una hora: la compra dura minutos

function clave(): string {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para firmar el token de fotos.");
  return k;
}

function firma(narradorId: string, vence: number): string {
  return createHmac("sha256", clave()).update(`fotos:${narradorId}:${vence}`).digest("hex");
}

export function firmarTokenFotos(narradorId: string, ahora = Date.now()): string {
  const vence = ahora + VIGENCIA_MS;
  return `${vence}.${firma(narradorId, vence)}`;
}

export function verificarTokenFotos(token: string | null, narradorId: string, ahora = Date.now()): boolean {
  if (!token) return false;
  const [venceTexto, firmaRecibida] = token.split(".");
  const vence = Number(venceTexto);
  if (!Number.isFinite(vence) || vence < ahora || !firmaRecibida) return false;
  const esperada = Buffer.from(firma(narradorId, vence), "hex");
  const recibida = Buffer.from(firmaRecibida, "hex");
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}
