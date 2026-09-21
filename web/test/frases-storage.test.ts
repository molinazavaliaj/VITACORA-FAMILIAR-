import { describe, it, expect, vi } from "vitest";
import { guardarFrases, leerFrases } from "../src/lib/frases";

// El cacheo de Storage (Naza, 21/09): frases.json lo escriben tres. Lo que se
// sube va sin caché, y cada lectura pide una URL distinta y sin guardar — si
// no, la relectura previa a escribir puede pisar los cortes del worker.
function admin() {
  const download = vi.fn().mockResolvedValue({ data: { text: async () => '{"version":1,"capitulos":[]}' }, error: null });
  const upload = vi.fn().mockResolvedValue({ data: {}, error: null });
  return { storage: { from: vi.fn(() => ({ download, upload })) }, download, upload };
}

describe("frases.json sin caché", () => {
  it("se sube con cacheControl 0", async () => {
    const a = admin();
    await guardarFrases(a as never, { version: 1, narrador_id: "n-1", pedido_id: "p-1", confirmado_at: null, capitulos: [] });
    expect(a.upload.mock.calls[0][0]).toBe("n-1/paquete/frases.json");
    expect(a.upload.mock.calls[0][2]).toMatchObject({ cacheControl: "0", upsert: true, contentType: "application/json" });
  });

  it("cada lectura pide una URL distinta y sin guardar", async () => {
    const a = admin();
    await leerFrases(a as never, "n-1");
    await leerFrases(a as never, "n-1");
    const [primera, segunda] = a.download.mock.calls;
    expect(primera[0]).toBe("n-1/paquete/frases.json");
    expect(primera[1].cacheNonce).toBeTruthy();
    expect(primera[1].cacheNonce).not.toBe(segunda[1].cacheNonce);
    expect(primera[2]).toEqual({ cache: "no-store" });
  });
});
