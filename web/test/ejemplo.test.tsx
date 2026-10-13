import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// /ejemplo (rediseño 2026-10): el libro de Osvaldo para hojear. Historia
// inventada y la página lo dice; sin anticipo, sin garantía, sin amor.

import PaginaEjemplo from "../src/app/ejemplo/page";
import EjemploCa from "../src/app/ca/ejemplo/page";
import EjemploAr from "../src/app/ar/ejemplo/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const PAGINAS = { es: PaginaEjemplo, ca: EjemploCa, ar: EjemploAr } as const;
const ejemplo = (idioma: keyof typeof PAGINAS) => renderToStaticMarkup(PAGINAS[idioma]());

describe("el libro de ejemplo", () => {
  beforeEach(() => {
    process.env.PRECIO_ARS ??= "65000";
    process.env.PRECIO_EUR ??= "79";
  });

  it("dice que la historia es inventada, arriba y junto al botón", () => {
    const es = ejemplo("es");
    expect(es).toContain("Historia inventada");
    expect(es).toContain(escapar("Libro de ejemplo con una historia inventada."));
    expect(ejemplo("ca")).toContain(escapar("Història inventada"));
    expect(ejemplo("ar")).toContain("Historia inventada");
  });

  it("el botón va al checkout de su idioma, con el precio del catálogo", () => {
    expect(ejemplo("es")).toMatch(/href="\/comprar"[^>]*>Empezar el libro de tu padre · [^<]*€/);
    expect(ejemplo("ca")).toContain('href="/ca/comprar"');
    expect(ejemplo("ar")).toMatch(/href="\/ar\/comprar"[^>]*>Empezar el libro de tu papá · /);
  });

  it("sin anticipo, sin «escribiéndose», sin garantía y sin capítulos de amor", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const html = ejemplo(idioma);
      for (const frase of ["anticipo", "Anticipo", "escribiéndose", "mientras se escribe", "devolvemos", "tornem", "El amor", "tercera respuesta", "Kids"]) {
        expect(html, `${idioma}: ${frase}`).not.toContain(frase);
      }
    }
  });

  it("es estática y lleva el idioma de la página", () => {
    for (const pagina of Object.values(PAGINAS)) expect(pagina()).not.toBeInstanceOf(Promise);
    expect(ejemplo("ca")).toContain('lang="ca-ES"');
    expect(ejemplo("ar")).toContain('lang="es-AR"');
  });

  it("se puede hojear: botones de página anterior y siguiente, y la portada a la vista", () => {
    const html = ejemplo("es");
    expect(html).toContain('aria-label="Página anterior"');
    expect(html).toContain('aria-label="Página siguiente"');
    expect(html).toContain("libro-osvaldo-portada.jpg");
    expect(html).toContain(escapar("1 de 5 · Portada"));
  });
});
