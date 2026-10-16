import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// /opiniones (rediseño 2026-10). La página arranca vacía: con menos de tres
// opiniones reales en lib/opiniones.ts es un 404, no entra al sitemap y el pie
// no la enlaza. Con tres o más se ve, entra al sitemap y el pie la enlaza.
// Las opiniones de PRUEBA viven solo en este archivo (nombres inventados):
// nunca en lib/opiniones.ts.

vi.mock("next/navigation", async (original) => ({
  ...(await original<typeof import("next/navigation")>()),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import PaginaOpiniones from "../src/app/opiniones/page";
import OpinionesCa from "../src/app/ca/opiniones/page";
import OpinionesAr from "../src/app/ar/opiniones/page";
import { Opiniones } from "../src/app/_opiniones/opiniones";
import { Pie } from "../src/app/_publico";
import { entradasSitemap } from "../src/lib/sitemap";
import { MINIMO_OPINIONES, OPINIONES, URL_OPINIONES_GOOGLE, hayOpiniones, type Opinion } from "../src/lib/opiniones";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

const PRUEBA: Opinion[] = [
  {
    id: "prueba-1",
    frase: "Frase de prueba uno, sobre el libro de su madre.",
    nombre: "Pruebalia",
    relacion: "hija de Testina",
    ciudad: "Ciudad Prueba",
    fecha: "2026-11-03",
    producto: "familiar",
    lang: "es-ES",
    fragmento: "Un párrafo de prueba de su libro.",
    pedido: "pedido-prueba-1",
    permiso: "test",
  },
  {
    id: "prueba-2",
    frase: "Frase de prova en català.",
    nombre: "Provaire",
    relacion: "nét de Provina",
    ciudad: "Ciutat Prova",
    fecha: "2026-10-01",
    producto: "familiar",
    lang: "ca-ES",
    pedido: "pedido-prueba-2",
    permiso: "test",
  },
  {
    id: "prueba-3",
    frase: "Frase de prueba del viaje.",
    nombre: "Testeo",
    relacion: "viajero",
    ciudad: "Pueblo Prueba",
    fecha: "2026-12-20",
    producto: "viaje",
    lang: "es-AR",
    pedido: "pedido-prueba-3",
    permiso: "test",
  },
];

const PAGINAS = { es: PaginaOpiniones, ca: OpinionesCa, ar: OpinionesAr } as const;
const IDIOMAS = ["es", "ca", "ar"] as const;
const pie = (idioma: (typeof IDIOMAS)[number], opiniones?: readonly Opinion[]) =>
  renderToStaticMarkup(<Pie idioma={idioma} camino="/" opiniones={opiniones} />);

describe("opiniones: menos de tres, la página no existe", () => {
  it("el archivo de datos arranca vacío y sin enlace de Google", () => {
    // Si este test falla porque se cargaron opiniones REALES, se borra este
    // caso: lo que importa es que nunca haya opiniones inventadas.
    expect(OPINIONES).toEqual([]);
    expect(URL_OPINIONES_GOOGLE).toBe("");
    expect(MINIMO_OPINIONES).toBe(3);
  });

  it("con 0, 1 o 2 opiniones: 404, sin sitemap y sin enlace en el pie", () => {
    for (const lista of [[], PRUEBA.slice(0, 1), PRUEBA.slice(0, 2)]) {
      expect(hayOpiniones(lista)).toBe(false);
      for (const idioma of IDIOMAS) {
        expect(() => renderToStaticMarkup(<Opiniones idioma={idioma} opiniones={lista} />)).toThrow("NEXT_NOT_FOUND");
        expect(pie(idioma, lista)).not.toContain("opiniones");
      }
      expect(entradasSitemap(lista).some((e) => e.url.includes("opiniones"))).toBe(false);
    }
  });

  it.runIf(!hayOpiniones())("con el archivo de hoy: las tres rutas son 404 y nada las enlaza", () => {
    for (const Pagina of Object.values(PAGINAS)) expect(() => renderToStaticMarkup(<Pagina />)).toThrow("NEXT_NOT_FOUND");
    for (const idioma of IDIOMAS) expect(pie(idioma)).not.toContain("opiniones");
    expect(entradasSitemap().some((e) => e.url.includes("opiniones"))).toBe(false);
  });
});

describe("opiniones: con tres o más, se muestra", () => {
  const html = (idioma: (typeof IDIOMAS)[number], urlGoogle = "") =>
    renderToStaticMarkup(<Opiniones idioma={idioma} opiniones={PRUEBA} urlGoogle={urlGoogle} />);

  it("muestra cada opinión con su frase, quién la dio, el producto y la fecha", () => {
    const es = html("es");
    for (const o of PRUEBA) {
      expect(es).toContain(escapar(o.frase));
      expect(es).toContain(`<b>${escapar(o.nombre)}</b>, ${escapar(o.relacion)} · ${escapar(o.ciudad)}`);
    }
    expect(es).toContain("Libro familiar");
    expect(es).toContain("Libro del viaje");
    expect(es).toContain("noviembre de 2026");
    expect(es).toContain(escapar("Una página de su libro"));
    expect(es).toContain(escapar("Un párrafo de prueba de su libro."));
    // Las más nuevas primero.
    expect(es.indexOf("Frase de prueba del viaje.")).toBeLessThan(es.indexOf("Frase de prueba uno"));
  });

  it("las opiniones van en su idioma original, sin traducir, con su lang", () => {
    for (const idioma of IDIOMAS) {
      const h = html(idioma);
      expect(h).toContain(escapar("Frase de prova en català."));
      expect(h).toContain(escapar("Frase de prueba uno, sobre el libro de su madre."));
      expect(h).toMatch(/<figure lang="ca-ES"/);
      expect(h).toMatch(/<figure lang="es-AR"/);
    }
  });

  it("los textos de la página salen del diccionario de cada idioma", () => {
    expect(html("es")).toContain("Lo que dicen las familias.");
    expect(html("ca")).toContain(escapar("El que diuen les famílies."));
    expect(html("ca")).toContain('lang="ca-ES"');
    expect(html("ar")).toContain('lang="es-AR"');
    expect(html("ca")).toContain('href="/ca/comprar"');
    expect(html("ar")).toContain('href="/ar/comprar"');
  });

  it("dice cómo se comprueban las opiniones (obligatorio en España)", () => {
    expect(html("es")).toContain("Cómo las comprobamos");
    expect(html("es")).toContain(escapar("Comprobamos cada una con su pedido"));
    expect(html("ca")).toContain("Com les comprovem");
  });

  it("el botón de Google solo aparece si hay enlace", () => {
    expect(html("es")).not.toContain("Google");
    const conGoogle = html("es", "https://g.page/r/prueba");
    expect(conGoogle).toContain('href="https://g.page/r/prueba"');
    expect(conGoogle).toContain("Ver todas las opiniones en Google");
  });

  it("sin datos estructurados de reseñas", () => {
    for (const idioma of IDIOMAS) {
      const h = html(idioma, "https://g.page/r/prueba");
      for (const prohibido of ["schema.org", "application/ld+json", "AggregateRating", "itemprop", "Review"]) {
        expect(h, `${idioma}: ${prohibido}`).not.toContain(prohibido);
      }
    }
  });

  it("entra al sitemap y el pie la enlaza, discreto, en su idioma", () => {
    const urls = entradasSitemap(PRUEBA).map((e) => e.url);
    expect(urls).toContain("https://www.vitacorafamiliar.com/opiniones");
    expect(urls).toContain("https://www.vitacorafamiliar.com/ca/opiniones");
    expect(urls).toContain("https://www.vitacorafamiliar.com/ar/opiniones");
    expect(pie("es", PRUEBA)).toMatch(/<a[^>]*href="\/opiniones"[^>]*>Opiniones<\/a>/);
    expect(pie("ca", PRUEBA)).toMatch(/<a[^>]*href="\/ca\/opiniones"[^>]*>Opinions<\/a>/);
    expect(pie("ar", PRUEBA)).toMatch(/<a[^>]*href="\/ar\/opiniones"[^>]*>Opiniones<\/a>/);
  });
});
