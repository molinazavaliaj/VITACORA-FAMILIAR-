import { describe, expect, it } from "vitest";
import { aJpgSiEsHeic, esHeic } from "@/lib/foto-heic";

const archivo = (nombre: string, tipo: string) => new File([new Uint8Array([1, 2, 3])], nombre, { type: tipo });

describe("foto-heic", () => {
  it("reconoce la HEIC por tipo o por nombre (Windows la manda sin tipo)", () => {
    expect(esHeic(archivo("IMG_1216.HEIC", "image/heic"))).toBe(true);
    expect(esHeic(archivo("IMG_1216.HEIC", ""))).toBe(true);
    expect(esHeic(archivo("foto.heif", "application/octet-stream"))).toBe(true);
    expect(esHeic(archivo("foto.jpg", "image/jpeg"))).toBe(false);
  });

  it("una JPG pasa tal cual, sin cargar la librería", async () => {
    const jpg = archivo("foto.jpg", "image/jpeg");
    expect(await aJpgSiEsHeic(jpg)).toBe(jpg);
  });
});
