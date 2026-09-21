import { createHmac, timingSafeEqual } from "node:crypto";

// El link público del libro cerrado (docs/panel-usuario.md §8). Mismo esquema
// que el token del anticipo: JWT HS256 a mano, firmado con
// SUPABASE_SERVICE_ROLE_KEY, sin expiración — el link es para que los primos lo
// abran cuando quieran. El payload lleva `tipo: 'libro'`: un token de anticipo
// no abre el libro ni al revés.

// Dos tipos de link, misma firma (21/09, spec "Su voz"):
//   'libro' — el link para compartir: muestra + comprar copia.
//   'voz'   — el código impreso en el libro y el chip del marco: abre la
//             página del cliente entera (el libro online + sus frases), sin
//             login. Es otro tipo a propósito: el link que el comprador reenvía
//             para vender copias sigue mostrando solo la muestra.
type Tipo = "libro" | "voz";
const ENCABEZADO = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");

function secreto(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para firmar el link del libro");
  return s;
}

function firmar(datos: string): string {
  return createHmac("sha256", secreto()).update(datos).digest("base64url");
}

function firmarToken(narradorId: string, tipo: Tipo): string {
  const payload = Buffer.from(JSON.stringify({ narradorId, tipo })).toString("base64url");
  return `${ENCABEZADO}.${payload}.${firmar(`${ENCABEZADO}.${payload}`)}`;
}

function verificarToken(token: string, tipo: Tipo): { narradorId: string } | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [encabezado, payload, firma] = partes;
  let esperada: string;
  try {
    esperada = firmar(`${encabezado}.${payload}`);
  } catch {
    return null;
  }
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const datos = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { narradorId?: unknown; tipo?: unknown };
    if (datos.tipo !== tipo || typeof datos.narradorId !== "string" || !datos.narradorId) return null;
    return { narradorId: datos.narradorId };
  } catch {
    return null;
  }
}

export const firmarTokenLibro = (narradorId: string) => firmarToken(narradorId, "libro");
export const verificarTokenLibro = (token: string) => verificarToken(token, "libro");

/** El link del código impreso y del chip: `/voz/<token>`. La fábrica lo genera igual (misma clave, `tipo: 'voz'`) para el QR. */
export const firmarTokenVoz = (narradorId: string) => firmarToken(narradorId, "voz");
export const verificarTokenVoz = (token: string) => verificarToken(token, "voz");
