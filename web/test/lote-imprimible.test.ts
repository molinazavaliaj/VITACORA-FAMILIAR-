import { describe, it, expect } from "vitest";
import { armarHojaLote, TEXTOS_CARTA } from "../src/lib/lote-imprimible";

const dos = [
  { codigo: "VF-7K3M2Q", qr: "data:image/png;base64,AAA" },
  { codigo: "VF-8P4N3R", qr: "data:image/png;base64,BBB" },
];

/** El contenido de la primera hoja con esa clase. */
function hoja(html: string, clase: string): string {
  const desde = html.indexOf(`<section class="hoja ${clase}">`);
  expect(desde).toBeGreaterThanOrEqual(0);
  return html.slice(desde, html.indexOf("</section>", desde));
}

it("una carta por código, con su código y su QR, sin precio", () => {
  const html = armarHojaLote(dos, "ca");
  expect(html.startsWith("<!doctype html>")).toBe(true);
  expect(html).toContain("VF-7K3M2Q");
  expect(html).toContain("VF-8P4N3R");
  expect(html.match(/<img class="qr"/g)).toHaveLength(2);
  expect(html).not.toMatch(/€|ARS|\$/);
  expect(html).toContain("@page { size: A4; margin: 0 }");
  expect(html).toContain("print-color-adjust: exact");
});

describe("la carta-libro", () => {
  it("la tapa lleva el título del idioma partido en dos líneas", () => {
    expect(hoja(armarHojaLote(dos, "es-AR"), "afuera")).toContain('<h1 class="titulo"><span>El libro</span><span>de tu vida</span></h1>');
    expect(hoja(armarHojaLote(dos, "es-ES"), "afuera")).toContain("<span>El libro</span><span>de tu vida</span>");
    expect(hoja(armarHojaLote(dos, "ca"), "afuera")).toContain("<span>El llibre</span><span>de la teva vida</span>");
    expect(hoja(armarHojaLote(dos, "es-AR"), "afuera")).toContain("Vitácora Familiar");
  });

  it("la tapa se lee en láser: toroide blanco con trazo grueso, marca en blanco pleno, lomo gris claro", () => {
    const html = armarHojaLote(dos, "es-AR");
    expect(html).toMatch(/\.sello-tapa \{[^}]*color: #F4F2EC/);
    expect(html).toMatch(/\.sello-tapa svg \{ width: 34mm/);
    expect(hoja(html, "afuera")).toMatch(/class="toroide-tapa"[^>]*>(<ellipse[^>]*stroke-width="3\.4"\/>)+/);
    expect(html).toMatch(/\.marca-tapa \{[^}]*color: #F4F2EC \}/);
    expect(html).not.toContain("rgba(244, 242, 236, 0.7)");
    expect(html).toMatch(/\.tapa > \.lomo \{[^}]*width: 0\.4mm; background: #8a877e/);
  });

  it("la contratapa tiene la frase y la línea de activación; adentro no va la activación", () => {
    for (const idioma of ["es-AR", "es-ES", "ca"] as const) {
      const t = TEXTOS_CARTA[idioma];
      const html = armarHojaLote(dos, idioma);
      const afuera = hoja(html, "afuera");
      const contratapa = afuera.slice(afuera.indexOf('class="pagina contratapa"'), afuera.indexOf('class="pagina tapa"'));
      expect(contratapa).toContain(`<p class="frase">${t.tapa}</p>`);
      expect(contratapa).toContain(`<p class="activar">${t.contratapa}</p>`);
      const adentro = hoja(html, "adentro");
      expect(adentro).not.toContain("queda activada");
      expect(adentro).toContain(t.esUnRegalo);
      expect(adentro).toContain(t.para);
      expect(adentro).toContain(t.de);
    }
  });

  it("el código y el QR van adentro, nunca afuera", () => {
    const html = armarHojaLote(dos, "es-ES");
    const afuera = hoja(html, "afuera");
    const adentro = hoja(html, "adentro");
    expect(afuera).not.toContain("VF-");
    expect(afuera).not.toContain('class="qr"');
    expect(adentro).toContain('<p class="codigo">VF-7K3M2Q</p>');
    expect(adentro.match(/<img class="qr"/g)).toHaveLength(2);
  });

  it("las dos caras tienen marcas de corte y de doblez; solo afuera hay sangrado", () => {
    const html = armarHojaLote(dos, "es-AR");
    const afuera = hoja(html, "afuera");
    const adentro = hoja(html, "adentro");
    // 2 costados × arriba/abajo + 3 cortes horizontales × 2 lados = 10 marcas de corte.
    expect(afuera.match(/class="corte"/g)).toHaveLength(10);
    expect(adentro.match(/class="corte"/g)).toHaveLength(10);
    expect(afuera.match(/class="pliegue"/g)).toHaveLength(2);
    expect(adentro.match(/class="pliegue"/g)).toHaveLength(2);
    expect(afuera).toContain('class="sangrado"');
    expect(adentro).not.toContain('class="sangrado"');
  });

  it("las cartas caen en el mismo lugar en las dos caras (doble faz por el borde largo)", () => {
    const html = armarHojaLote(dos, "ca");
    const tops = (s: string) => [...s.matchAll(/class="carta" style="(top:[\d.]+mm)"/g)].map((m) => m[1]);
    expect(tops(hoja(html, "afuera"))).toEqual(["top:8.5mm", "top:148.5mm"]);
    expect(tops(hoja(html, "adentro"))).toEqual(["top:8.5mm", "top:148.5mm"]);
  });

  it("una carta impar sigue dando una hoja de afuera y otra de adentro", () => {
    const html = armarHojaLote([dos[0]], "es-AR");
    expect(html.match(/<img class="qr"/g)).toHaveLength(1);
    expect(html.match(/class="hoja/g)).toHaveLength(3);
    expect(hoja(html, "afuera").match(/class="carta"/g)).toHaveLength(1);
    expect(hoja(html, "afuera").match(/class="corte"/g)).toHaveLength(8);
  });
});

describe("los sellos", () => {
  it("54 sellos redondos con el toroide, sin texto ni código", () => {
    const html = armarHojaLote(dos, "es-ES");
    const sellos = html.slice(html.indexOf('class="sellos"'));
    expect(sellos.match(/class="sticker"/g)).toHaveLength(54);
    expect(sellos.match(/<svg/g)).toHaveLength(54);
    expect(sellos).not.toContain("VF-");
    expect(sellos).not.toContain("<p");
    expect(sellos).not.toContain("El libro de tu vida");
  });
});
