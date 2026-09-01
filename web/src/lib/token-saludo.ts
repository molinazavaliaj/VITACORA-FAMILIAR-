// Token del link compartible de "Saludos de los seres queridos".
//
// v1: un JWT HS256 hecho a mano con node:crypto (sin dependencia externa),
// firmado con SUPABASE_SERVICE_ROLE_KEY como secreto, sin expiración.
// Payload: { narradorId }.

import { createHmac, timingSafeEqual } from "node:crypto";

const HEADER = { alg: "HS256", typ: "JWT" } as const;

interface PayloadSaludo {
  narradorId: string;
}

function obtenerSecreto(): string {
  const secreto = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secreto) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para firmar el token de saludo");
  }
  return secreto;
}

function base64urlDeTexto(texto: string): string {
  return Buffer.from(texto, "utf8").toString("base64url");
}

function firmarDatos(datos: string, secreto: string): string {
  return createHmac("sha256", secreto).update(datos).digest("base64url");
}

export function firmarTokenSaludo(narradorId: string): string {
  const secreto = obtenerSecreto();
  const encabezado = base64urlDeTexto(JSON.stringify(HEADER));
  const payload = base64urlDeTexto(JSON.stringify({ narradorId } satisfies PayloadSaludo));
  const datos = `${encabezado}.${payload}`;
  const firma = firmarDatos(datos, secreto);
  return `${datos}.${firma}`;
}

export function verificarTokenSaludo(token: string): PayloadSaludo | null {
  if (!token) return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [encabezado, payload, firma] = partes;

  let secreto: string;
  try {
    secreto = obtenerSecreto();
  } catch {
    return null;
  }

  const firmaEsperada = firmarDatos(`${encabezado}.${payload}`, secreto);

  const bufferEsperado = Buffer.from(firmaEsperada);
  const bufferRecibido = Buffer.from(firma);
  if (
    bufferEsperado.length !== bufferRecibido.length ||
    !timingSafeEqual(bufferEsperado, bufferRecibido)
  ) {
    return null;
  }

  try {
    const datos = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      narradorId?: unknown;
    };
    if (typeof datos.narradorId !== "string" || datos.narradorId.trim().length === 0) {
      return null;
    }
    return { narradorId: datos.narradorId };
  } catch {
    return null;
  }
}
