import { describe, it, expect } from "vitest";
import { armarHojaLote } from "../src/lib/lote-imprimible";

const dos = [
  { codigo: "VF-7K3M2Q", qr: "data:image/png;base64,AAA" },
  { codigo: "VF-8P4N3R", qr: "data:image/png;base64,BBB" },
];

it("una carta por código, con su código y su QR, sin precio", () => {
  const html = armarHojaLote(dos, "ca");
  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain("VF-7K3M2Q");
  expect(html).toContain("VF-8P4N3R");
  expect(html.match(/<img class="qr"/g)).toHaveLength(2);
  expect(html).not.toMatch(/€|ARS/);
  expect(html).toContain("@page");
});

describe("la hoja", () => {
  it("lleva el texto del idioma del lote y 12 stickers sin código", () => {
    const html = armarHojaLote(dos, "es-ES");
    expect(html).toContain("Para regalarla, escanea el código y págala en vitacorafamiliar.com. Solo entonces queda activada.");
    // La activación va en la contratapa (afuera), ya no adentro.
    const interior = html.slice(html.indexOf('<section class="hoja">', html.indexOf("</section>")));
    expect(interior.slice(0, interior.indexOf("</section>"))).not.toContain("queda activada");
    expect(html).toContain('class="contratapa"');
    expect(html.match(/class="sticker"/g)).toHaveLength(12);
    const stickers = html.slice(html.indexOf('class="stickers"'));
    expect(stickers).not.toContain("VF-");
    expect(stickers).toContain("El libro de tu vida");
    expect(stickers).toContain("Para");
    expect(armarHojaLote(dos, "ca")).toContain("Per a");
  });

  it("una carta impar sigue dando una hoja de afuera y otra de adentro", () => {
    const html = armarHojaLote([dos[0]], "es-AR");
    expect(html.match(/<img class="qr"/g)).toHaveLength(1);
    expect(html.match(/class="hoja"/g)).toHaveLength(3);
  });
});
