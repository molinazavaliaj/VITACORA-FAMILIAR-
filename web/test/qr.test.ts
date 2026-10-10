import { describe, it, expect } from "vitest";
import { qrDataUri, urlRegalo } from "../src/lib/qr";

// El QR de la gift card. Sin jsqr en web: la lectura real del código ya la prueba
// fabrica/test/qr.test.ts con la misma librería y las mismas opciones.
describe("qrDataUri", () => {
  it("devuelve un PNG en data URI", async () => {
    const uri = await qrDataUri("https://www.vitacorafamiliar.com/regalo/VF-7K3M2Q");
    expect(uri.startsWith("data:image/png;base64,")).toBe(true);
    expect(uri.length).toBeGreaterThan(500);
  });

  it("dos textos distintos dan imágenes distintas", async () => {
    const a = await qrDataUri("https://www.vitacorafamiliar.com/regalo/VF-7K3M2Q");
    const b = await qrDataUri("https://www.vitacorafamiliar.com/regalo/VF-9P4R8T");
    expect(a).not.toBe(b);
  });
});

describe("urlRegalo", () => {
  it("usa URL_BASE si está, y si no (o está vacía) la web de producción", () => {
    const antes = process.env.URL_BASE;
    delete process.env.URL_BASE;
    expect(urlRegalo("VF-7K3M2Q")).toBe("https://www.vitacorafamiliar.com/regalo/VF-7K3M2Q");
    process.env.URL_BASE = "";
    expect(urlRegalo("VF-7K3M2Q")).toBe("https://www.vitacorafamiliar.com/regalo/VF-7K3M2Q");
    process.env.URL_BASE = "http://localhost:3000";
    expect(urlRegalo("VF-7K3M2Q")).toBe("http://localhost:3000/regalo/VF-7K3M2Q");
    if (antes === undefined) delete process.env.URL_BASE;
    else process.env.URL_BASE = antes;
  });
});
