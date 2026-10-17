import { describe, it, expect } from "vitest";
import { armarHojaLote, SELLO_CENTRO_Y, TEXTOS_CARTA } from "../src/lib/lote-imprimible";
import type { IdiomaRegalo } from "../src/lib/regalo-textos";

const dos = [
  { codigo: "VF-7K3M2Q", qr: "data:image/png;base64,AAA" },
  { codigo: "VF-8P4N3R", qr: "data:image/png;base64,BBB" },
];

const NUMERO = "+54 9 11 0000 0000";
const armar = (cartas: { codigo: string; qr: string }[], idioma: IdiomaRegalo) => armarHojaLote(cartas, idioma, NUMERO);

/** El contenido de la primera hoja con esa clase. */
function hoja(html: string, clase: string): string {
  const desde = html.indexOf(`<section class="hoja ${clase}">`);
  expect(desde).toBeGreaterThanOrEqual(0);
  return html.slice(desde, html.indexOf("</section>", desde));
}

it("una carta por código, con su código y su QR, sin precio", () => {
  const html = armar(dos, "ca");
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
    expect(hoja(armar(dos, "es-AR"), "afuera")).toContain('<h1 class="titulo"><span>El libro</span><span>de tu vida</span></h1>');
    expect(hoja(armar(dos, "es-ES"), "afuera")).toContain("<span>El libro</span><span>de tu vida</span>");
    expect(hoja(armar(dos, "ca"), "afuera")).toContain("<span>El llibre</span><span>de la teva vida</span>");
    expect(hoja(armar(dos, "es-AR"), "afuera")).toContain("Vitácora Familiar");
  });

  it("la tapa se lee en láser: toroide blanco con trazo grueso, marca en blanco pleno, lomo de tapa dura", () => {
    const html = armar(dos, "es-AR");
    expect(html).toMatch(/\.sello-tapa \{[^}]*color: #F4F2EC/);
    expect(html).toMatch(/\.sello-tapa svg \{ width: 34mm/);
    expect(hoja(html, "afuera")).toMatch(/class="toroide-tapa"[^>]*>(<ellipse[^>]*stroke-width="3\.4"\/>)+/);
    expect(html).toMatch(/\.marca-tapa \{[^}]*color: #F4F2EC \}/);
    expect(html).not.toContain("rgba(244, 242, 236, 0.7)");
    // Trampantojo de tapa dura: lomo con luz y canaleta de bisagra, de punta a punta (en el sangrado).
    expect(hoja(html, "afuera")).toContain('<i class="lomo"></i><i class="bisagra"></i>');
    expect(html).toMatch(/\.tapa > \.lomo \{ left: 0; width: 8mm; background: linear-gradient\(to right/);
    expect(html).toMatch(/\.tapa > \.bisagra \{[^}]*#070706[^}]*#4a4943/);
    expect(html).toContain(".tapa > .lomo, .tapa > .bisagra { right: auto; top: -2mm; bottom: -2mm }");
    expect(html).toMatch(/\.tapa > \* \{ position: absolute; left: 11\.5mm; right: 0;/);
    expect(html).not.toContain("#8a877e");
  });

  it("la contratapa tiene la frase y la línea de activación; adentro no va la activación", () => {
    for (const idioma of ["es-AR", "es-ES", "ca"] as const) {
      const t = TEXTOS_CARTA[idioma];
      const html = armar(dos, idioma);
      const afuera = hoja(html, "afuera");
      const contratapa = afuera.slice(afuera.indexOf('class="pagina contratapa"'), afuera.indexOf('class="pagina tapa"'));
      expect(contratapa).toContain(`<p class="frase">${t.tapa}</p>`);
      expect(contratapa).toContain(`<p class="activar">${t.contratapa}</p>`);
      const adentro = hoja(html, "adentro");
      expect(adentro).not.toContain("queda activada");
      expect(adentro).toContain(t.regaloTitulo);
      expect(adentro).toContain(t.para);
      expect(adentro).toContain(t.de);
    }
  });

  it("el código y el QR van adentro, nunca afuera", () => {
    const html = armar(dos, "es-ES");
    const afuera = hoja(html, "afuera");
    const adentro = hoja(html, "adentro");
    expect(afuera).not.toContain("VF-");
    expect(afuera).not.toContain('class="qr"');
    expect(adentro).toContain('<p class="codigo">VF-7K3M2Q</p>');
    expect(adentro.match(/<img class="qr"/g)).toHaveLength(2);
  });

  it("las dos caras tienen marcas de corte y de doblez; solo afuera hay sangrado", () => {
    const html = armar(dos, "es-AR");
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
    const html = armar(dos, "ca");
    const tops = (s: string) => [...s.matchAll(/class="carta" style="(top:[\d.]+mm)"/g)].map((m) => m[1]);
    expect(tops(hoja(html, "afuera"))).toEqual(["top:8.5mm", "top:148.5mm"]);
    expect(tops(hoja(html, "adentro"))).toEqual(["top:8.5mm", "top:148.5mm"]);
  });

  it("una carta impar sigue dando una hoja de afuera y otra de adentro", () => {
    const html = armar([dos[0]], "es-AR");
    expect(html.match(/<img class="qr"/g)).toHaveLength(1);
    expect(html.match(/class="hoja/g)).toHaveLength(3);
    expect(hoja(html, "afuera").match(/class="carta"/g)).toHaveLength(1);
    expect(hoja(html, "afuera").match(/class="corte"/g)).toHaveLength(8);
  });
});

describe("los sellos", () => {
  it("54 sellos redondos con el toroide, sin texto ni código", () => {
    const html = armar(dos, "es-ES");
    const sellos = html.slice(html.indexOf('class="sellos"'));
    expect(sellos.match(/class="sticker"/g)).toHaveLength(54);
    expect(sellos.match(/<svg/g)).toHaveLength(54);
    expect(sellos).not.toContain("VF-");
    expect(sellos).not.toContain("<p");
    expect(sellos).not.toContain("El libro de tu vida");
  });
});

describe("adentro de la carta-libro (textos del 17/10)", () => {
  const esperado = {
    "es-AR": ["Te regalaron una Vitácora.", "Vos le vas contestando con audios, en tus momentos libres.", "Apuntá la cámara del celular acá para empezar.", `Si la cámara no te anda, mandá un WhatsApp al ${NUMERO} con este código.`],
    "es-ES": ["Te han regalado una Vitácora.", "Tú le vas contestando con audios, en tus momentos libres.", "Apunta la cámara del móvil aquí para empezar.", `Si la cámara no te funciona, manda un WhatsApp al ${NUMERO} con este código.`],
    ca: ["T&#39;han regalat una Vitácora.", "Tu li vas responent amb àudios, en els teus moments lliures.", "Apunta la càmera del mòbil aquí per començar.", `Si la càmera no et funciona, envia un WhatsApp al ${NUMERO} amb aquest codi.`],
  } as const;

  it.each(Object.keys(esperado) as IdiomaRegalo[])("%s: título, texto, cómo escanear, el número y el código, en ese orden", (idioma) => {
    const adentro = hoja(armar(dos, idioma), "adentro");
    const [titulo, texto, apunta, respaldo] = esperado[idioma];
    const posiciones = [
      adentro.indexOf(`<p class="regalo">${titulo.replace("&#39;", "'")}</p>`),
      adentro.indexOf(texto),
      adentro.indexOf(`<p class="apunta">${apunta}</p>`),
      adentro.indexOf('<img class="qr"'),
      adentro.indexOf(`<p class="respaldo">${respaldo.replace(NUMERO, `<span class="numero">${NUMERO}</span>`)}</p>`),
      adentro.indexOf('<p class="codigo">VF-7K3M2Q</p>'),
    ];
    expect(posiciones.every((p) => p >= 0)).toBe(true);
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
    expect(adentro).not.toContain("Esto es un regalo.");
  });

  it("la página de la izquierda tiene Para arriba, cuatro renglones grises y De abajo", () => {
    const html = armar(dos, "es-AR");
    const adentro = hoja(html, "adentro");
    const izq = adentro.slice(adentro.indexOf('class="pagina escribir"'), adentro.indexOf('class="pagina regalo-pag"'));
    expect(izq.indexOf(">Para<")).toBeLessThan(izq.indexOf('class="renglones"'));
    expect(izq.indexOf('class="renglones"')).toBeLessThan(izq.indexOf(">De<"));
    expect(izq.match(/class="renglon"/g)).toHaveLength(4);
    expect(html).toContain("border-bottom: 0.25mm solid #b8b4aa");
  });

  it("el texto de adentro va a 10,5 pt en negro pleno", () => {
    expect(armar(dos, "ca")).toMatch(/\.texto, \.apunta, \.respaldo \{[^}]*font-size: 10\.5pt;[^}]*color: #14140F/);
  });

  it("el sello va abajo del título, a 105 mm del borde de arriba", () => {
    expect(SELLO_CENTRO_Y).toBe(105);
  });
});
