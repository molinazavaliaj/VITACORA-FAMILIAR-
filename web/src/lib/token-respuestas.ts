import { createHmac, timingSafeEqual } from "node:crypto";
import { secretosVerificacion } from "./secreto-firma";

// El link propio del narrador (/mis-respuestas/<token>, 05/11; CONTRATO, «Lo contado es privado»). Lo firma el
// entrevistador (entrevistador/src/link-respuestas.ts); acá solo se verifica. A diferencia de los otros links, vence.
// `vencido` se distingue de `invalido` para poder decirle que lo pida de nuevo.

export type TokenRespuestas = { ok: true; narradorId: string } | { ok: false; motivo: "invalido" | "vencido" };

const firmar = (datos: string, secreto: string) => createHmac("sha256", secreto).update(datos).digest("base64url");

export function verificarTokenRespuestas(token: string, ahora: number = Date.now()): TokenRespuestas {
  const partes = (token ?? "").split(".");
  if (partes.length !== 3) return { ok: false, motivo: "invalido" };
  const [encabezado, payload, firma] = partes;
  let secretos: string[];
  try {
    secretos = secretosVerificacion();
  } catch {
    return { ok: false, motivo: "invalido" };
  }
  const recibida = Buffer.from(firma);
  const valida = secretos.some((s) => {
    const esperada = Buffer.from(firmar(`${encabezado}.${payload}`, s));
    return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
  });
  if (!valida) return { ok: false, motivo: "invalido" };
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { narradorId?: unknown; tipo?: unknown; exp?: unknown };
    if (d.tipo !== "respuestas" || typeof d.narradorId !== "string" || !d.narradorId || typeof d.exp !== "number") return { ok: false, motivo: "invalido" };
    if (ahora >= d.exp) return { ok: false, motivo: "vencido" };
    return { ok: true, narradorId: d.narradorId };
  } catch {
    return { ok: false, motivo: "invalido" };
  }
}
