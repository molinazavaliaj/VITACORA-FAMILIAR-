import { createHmac } from "node:crypto";
import { describe, it, expect } from "vitest";
import { verificarFirmaMP, manifiestoMP } from "../src/lib/firma-mp";

// Mercado Pago firma cada notificación: header `x-signature: ts=...,v1=...`,
// donde v1 = HMAC-SHA256(secreto, "id:{data.id};request-id:{x-request-id};ts:{ts};").
// https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks#validar-origen

const SECRETO = "3b451ee3-secreto-de-prueba";
const firmar = (manifiesto: string) => createHmac("sha256", SECRETO).update(manifiesto).digest("hex");

describe("manifiestoMP", () => {
  it("arma el texto exacto que firma Mercado Pago", () => {
    expect(manifiestoMP({ dataId: "123456", requestId: "req-1", ts: "1704908010" })).toBe("id:123456;request-id:req-1;ts:1704908010;");
  });
  it("un data.id alfanumérico va en minúsculas (regla de MP)", () => {
    expect(manifiestoMP({ dataId: "ABC123", requestId: "r", ts: "1" })).toBe("id:abc123;request-id:r;ts:1;");
  });
  it("sin request-id, la parte se omite", () => {
    expect(manifiestoMP({ dataId: "1", requestId: null, ts: "9" })).toBe("id:1;ts:9;");
  });
});

describe("verificarFirmaMP", () => {
  const ok = { dataId: "123456", requestId: "req-1", ts: "1704908010" };
  const header = (v1: string, ts = ok.ts) => `ts=${ts},v1=${v1}`;

  it("acepta una firma válida", () => {
    const v1 = firmar(manifiestoMP(ok));
    expect(verificarFirmaMP({ xSignature: header(v1), xRequestId: ok.requestId, dataId: ok.dataId, secreto: SECRETO })).toBe(true);
  });

  it("rechaza una firma alterada, otro secreto, otro id u otro ts", () => {
    const v1 = firmar(manifiestoMP(ok));
    expect(verificarFirmaMP({ xSignature: header(v1.slice(0, -1) + "0"), xRequestId: ok.requestId, dataId: ok.dataId, secreto: SECRETO })).toBe(false);
    expect(verificarFirmaMP({ xSignature: header(v1), xRequestId: ok.requestId, dataId: ok.dataId, secreto: "otro" })).toBe(false);
    expect(verificarFirmaMP({ xSignature: header(v1), xRequestId: ok.requestId, dataId: "999", secreto: SECRETO })).toBe(false);
    expect(verificarFirmaMP({ xSignature: header(v1, "1"), xRequestId: ok.requestId, dataId: ok.dataId, secreto: SECRETO })).toBe(false);
  });

  it("rechaza headers ausentes o mal formados", () => {
    expect(verificarFirmaMP({ xSignature: null, xRequestId: "r", dataId: "1", secreto: SECRETO })).toBe(false);
    expect(verificarFirmaMP({ xSignature: "basura", xRequestId: "r", dataId: "1", secreto: SECRETO })).toBe(false);
    expect(verificarFirmaMP({ xSignature: "ts=1", xRequestId: "r", dataId: "1", secreto: SECRETO })).toBe(false);
  });

  it("acepta los pares en cualquier orden y con espacios", () => {
    const v1 = firmar(manifiestoMP(ok));
    expect(verificarFirmaMP({ xSignature: `v1=${v1}, ts=${ok.ts}`, xRequestId: ok.requestId, dataId: ok.dataId, secreto: SECRETO })).toBe(true);
  });
});
