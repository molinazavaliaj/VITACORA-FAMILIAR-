import { createHmac, timingSafeEqual } from "node:crypto";

// La firma de las notificaciones de Mercado Pago (bitácora #9, 16/09).
//
// MP manda dos headers: `x-signature: ts=<unix>,v1=<hmac>` y `x-request-id`.
// El HMAC-SHA256 se calcula con la clave secreta del webhook (la que se ve en
// el panel de MP al crear la notificación) sobre el "manifiesto":
//
//     id:{data.id};request-id:{x-request-id};ts:{ts};
//
// Sin esto, cualquiera que supiera la URL podía hacernos consultar pagos a MP
// a voluntad. La consulta directa del pago sigue siendo la verdad; esto es la
// puerta de entrada.

export function manifiestoMP({ dataId, requestId, ts }: { dataId: string; requestId: string | null; ts: string }): string {
  // Regla de MP: si el id es alfanumérico, va en minúsculas.
  const id = /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId;
  const partes = [`id:${id}`];
  if (requestId) partes.push(`request-id:${requestId}`);
  partes.push(`ts:${ts}`);
  return partes.join(";") + ";";
}

function leerFirma(xSignature: string): { ts: string; v1: string } | null {
  const pares = new Map<string, string>();
  for (const trozo of xSignature.split(",")) {
    const i = trozo.indexOf("=");
    if (i < 0) continue;
    pares.set(trozo.slice(0, i).trim(), trozo.slice(i + 1).trim());
  }
  const ts = pares.get("ts");
  const v1 = pares.get("v1");
  if (!ts || !v1 || !/^[0-9a-f]+$/i.test(v1)) return null;
  return { ts, v1 };
}

export function verificarFirmaMP({
  xSignature,
  xRequestId,
  dataId,
  secreto,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secreto: string;
}): boolean {
  if (!xSignature) return false;
  const firma = leerFirma(xSignature);
  if (!firma) return false;
  const esperado = createHmac("sha256", secreto).update(manifiestoMP({ dataId, requestId: xRequestId, ts: firma.ts })).digest("hex");
  const a = Buffer.from(esperado, "hex");
  const b = Buffer.from(firma.v1.toLowerCase(), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
