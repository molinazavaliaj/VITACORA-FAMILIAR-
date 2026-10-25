import { createHmac, timingSafeEqual } from "node:crypto";
import { secretoFirma, secretosVerificacion } from "./secreto-firma";

// Un token firmado por el servidor: atado a un PROPÓSITO y a un SUJETO, con
// vencimiento corto. Sirve para dar un permiso puntual a quien todavía no
// tiene sesión (la compra dura minutos): subir las fotos del paso 5 (17/09) y
// volver del pago directo al panel (3t.20). Un token de un propósito no sirve
// para otro, ni para otro sujeto, ni pasada la hora.

// El cupón de bienvenida (20/10) usa dos más, con su propia vigencia: el botón
// de confirmar del mail (doble opt-in, 7 días) y la baja de un clic de los
// recordatorios (un año: tiene que andar en el último mail).
export type Proposito = "fotos" | "vuelta" | "cupon-confirmar" | "cupon-baja";

const VIGENCIA_MS = 60 * 60 * 1000; // una hora

function firma(proposito: Proposito, sujeto: string, vence: number, clave = secretoFirma()): string {
  return createHmac("sha256", clave).update(`${proposito}:${sujeto}:${vence}`).digest("hex");
}

export function firmarToken(proposito: Proposito, sujeto: string, ahora = Date.now(), vigenciaMs = VIGENCIA_MS): string {
  const vence = ahora + vigenciaMs;
  return `${vence}.${firma(proposito, sujeto, vence)}`;
}

export function verificarToken(proposito: Proposito, token: string | null, sujeto: string, ahora = Date.now()): boolean {
  if (!token) return false;
  const [venceTexto, firmaRecibida] = token.split(".");
  const vence = Number(venceTexto);
  if (!Number.isFinite(vence) || vence < ahora || !firmaRecibida || !/^[0-9a-f]+$/.test(firmaRecibida)) return false;
  const recibida = Buffer.from(firmaRecibida, "hex");
  return secretosVerificacion().some((clave) => {
    const esperada = Buffer.from(firma(proposito, sujeto, vence, clave), "hex");
    return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
  });
}
