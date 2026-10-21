import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

// Los tres videos del libro (arreglos chicos, 18/10; MOTION.md nº 14): Familiar
// en /ejemplo, Viaje en /viaje y Kids en /kids. Ninguno en un hero. Desde el
// servidor solo sale el póster (el <video> lo pone el navegador cuando la
// sección se acerca y si se puede mover), y los archivos son livianos, sin
// audio y con el índice al principio (faststart).

import { VideoLibro, puedeMoverse, PAUSA_FINAL_MS } from "../src/app/_direccion/video-libro";
import PaginaEjemplo from "../src/app/ejemplo/page";
import ViajeEs from "../src/app/viaje/page";
import ViajeAr from "../src/app/ar/viaje/page";
import { PaginaKidsCompleta } from "../src/app/_kids/pagina";
import { TEXTOS_KIDS } from "../src/app/_textos/kids";
import { TEXTOS_EJEMPLO } from "../src/app/_textos/ejemplo";

const PUBLICO = path.join(__dirname, "../public");

beforeEach(() => {
  process.env.PRECIO_ARS ??= "65000";
  process.env.PRECIO_EUR ??= "79";
});

/** Las cajas de primer nivel de un mp4, en orden. */
function cajas(archivo: string): string[] {
  const d = readFileSync(archivo);
  const out: string[] = [];
  for (let i = 0; i < d.length; ) {
    const largo = d.readUInt32BE(i);
    out.push(d.toString("latin1", i + 4, i + 8));
    if (largo === 0) break;
    i += largo;
  }
  return out;
}

describe("los archivos", () => {
  for (const [video, maximo] of [
    ["viaje-libro", 800_000],
    ["kids-libro", 800_000],
    ["libro-cinematico", 1_400_000],
  ] as const) {
    it(`${video}: liviano, faststart y con su póster`, () => {
      const mp4 = path.join(PUBLICO, "video", `${video}.mp4`);
      expect(statSync(mp4).size).toBeLessThan(maximo);
      const orden = cajas(mp4);
      expect(orden.indexOf("moov")).toBeGreaterThan(-1);
      expect(orden.indexOf("moov")).toBeLessThan(orden.indexOf("mdat"));
      // Sin pista de audio: un solo trak, el de video.
      const moov = readFileSync(mp4).toString("latin1");
      expect(moov.split("trak").length - 1).toBeGreaterThanOrEqual(1);
      expect(moov).not.toContain("soun");
      expect(statSync(path.join(PUBLICO, "video", `${video}-poster.jpg`)).size).toBeLessThan(120_000);
    });
  }
});

describe("VideoLibro", () => {
  it("desde el servidor, solo el póster: ni <video> ni src", () => {
    const html = renderToStaticMarkup(<VideoLibro src="/video/kids-libro.mp4" poster="/video/kids-libro-poster.jpg" alt="El libro" ancho={1120} alto={640} sizes="100vw" />);
    expect(html).not.toContain("<video");
    expect(html).not.toContain("kids-libro.mp4");
    expect(html).toContain("kids-libro-poster.jpg");
    expect(html).toContain('alt="El libro"');
    expect(html).toContain("aspect-ratio:1120 / 640");
  });

  it("con «menos movimiento» o ahorro de datos no se mueve", () => {
    const ventana = (reduce: boolean, saveData = false) => ({
      matchMedia: (q: string) => ({ matches: reduce && q.includes("reduce") }) as MediaQueryList,
      navigator: { connection: { saveData } },
    });
    expect(puedeMoverse(ventana(false))).toBe(true);
    expect(puedeMoverse(ventana(true))).toBe(false);
    expect(puedeMoverse(ventana(false, true))).toBe(false);
  });

  it("la pausa sobre el último cuadro es de 3,5 s", () => {
    expect(PAUSA_FINAL_MS).toBe(3500);
  });
});

describe("dónde va cada uno", () => {
  it("/ejemplo: después del título y antes del libro que se hojea", () => {
    const html = renderToStaticMarkup(PaginaEjemplo());
    const titulo = html.indexOf(TEXTOS_EJEMPLO.es.titulo);
    const poster = html.indexOf("libro-cinematico-poster.jpg");
    const libro = html.indexOf(TEXTOS_EJEMPLO.es.anterior);
    expect(titulo).toBeGreaterThan(-1);
    expect(poster).toBeGreaterThan(titulo);
    expect(libro).toBeGreaterThan(poster);
  });

  // 19/10 (Naza): el inicio de /viaje es como el de Familiar, con el libro de
  // viaje en 3D; el video del libro sale (si no, el libro se repite).
  it("/viaje: el libro de viaje en 3D en el inicio y sin el video", () => {
    for (const pagina of [ViajeEs, ViajeAr]) {
      const html = renderToStaticMarkup(pagina());
      const libro = html.indexOf("l3-escena l3--viaje");
      expect(libro).toBeGreaterThan(html.indexOf("</h1>"));
      expect(libro).toBeLessThan(html.indexOf("Las fotos quedan."));
      expect(html).not.toContain("viaje-libro-poster.jpg");
    }
  });

  // 19/10 (Naza): el inicio de /kids es como el de Familiar, con el libro de
  // Nico que se abre debajo del lema, una sola vez.
  it("/kids: el libro de Nico en el inicio, una sola vez", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const html = renderToStaticMarkup(<PaginaKidsCompleta idioma={idioma} />);
      const poster = html.indexOf("kids-libro-poster.jpg");
      expect(poster).toBeGreaterThan(html.indexOf("</h1>"));
      expect(poster).toBeLessThan(html.indexOf(TEXTOS_KIDS[idioma].dibujos.frase[0]));
      expect(html.split("kids-video ").length - 1).toBe(1);
    }
  });
});
