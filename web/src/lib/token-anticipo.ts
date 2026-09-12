// Token del link del anticipo que la fábrica manda por correo.
//
// La contraparte de `fabrica/src/libro/token-anticipo.ts`: JWT HS256 a mano con
// node:crypto, firmado con SUPABASE_SERVICE_ROLE_KEY, sin expiración, así los
// dos servicios lo firman y lo verifican sin ningún secreto nuevo.
//
// El payload lleva `tipo: 'anticipo'` y acá se comprueba: cualquier otro token
// firmado con el mismo secreto para otro permiso (el link público del libro
// cerrado, por ejemplo) no sirve para abrir el anticipo. Son permisos distintos.

import { createHmac, timingSafeEqual } from "node:crypto";

interface PayloadAnticipo {
  narradorId: string;
}

const TIPO = "anticipo";

function obtenerSecreto(): string {
  const secreto = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secreto) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para verificar el token de anticipo");
  }
  return secreto;
}

function firmarDatos(datos: string, secreto: string): string {
  return createHmac("sha256", secreto).update(datos).digest("base64url");
}

export function verificarTokenAnticipo(token: string): PayloadAnticipo | null {
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
      tipo?: unknown;
    };
    if (datos.tipo !== TIPO) return null;
    if (typeof datos.narradorId !== "string" || datos.narradorId.trim().length === 0) {
      return null;
    }
    return { narradorId: datos.narradorId };
  } catch {
    return null;
  }
}
