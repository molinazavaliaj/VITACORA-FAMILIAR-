import { describe, it, expect } from "vitest";
import { armarPaginas, paginar, type LibroDatos } from "../src/app/tablero/[narradorId]/libro/miniatura";

// El libro en miniatura se arma con la lógica de la fábrica: tapa, índice,
// cada capítulo abre en página derecha, el texto se corta en oraciones, las
// fotos adicionales cierran el capítulo, y la contratapa va al final.

const datos: LibroDatos = {
  titulo: "Roberto — La historia de una vida",
  subtitulo: "Roberto",
  portadaFotoId: null,
  contratapaFotoId: null,
  capitulos: [
    { nombre: "La infancia", fotos: [{ id: "f1", epigrafe: null, principal: true }, { id: "f2", epigrafe: "el patio", principal: false }], textos: [{ pregunta: "¿La casa?", texto: "La casa tenía un patio. ".repeat(80) }] },
    { nombre: "Las raíces", fotos: [], textos: [] },
  ],
};

describe("paginar", () => {
  it("un texto corto es una página; uno largo se corta en oraciones", () => {
    expect(paginar("Hola. Chau.")).toEqual(["Hola. Chau."]);
    const paginas = paginar("La casa tenía un patio largo. ".repeat(100));
    expect(paginas.length).toBeGreaterThan(1);
    for (const p of paginas) expect(p.endsWith(".")).toBe(true);
  });
  it("texto vacío → sin páginas", () => {
    expect(paginar("   ")).toEqual([]);
  });
});

describe("armarPaginas", () => {
  const paginas = armarPaginas(datos);
  it("la tapa sola a la derecha, la contratapa sola a la izquierda, cantidad par", () => {
    expect(paginas[0]).toEqual({ tipo: "blanca" });
    expect(paginas[1]).toEqual({ tipo: "tapa" });
    expect(paginas[paginas.length - 2]).toEqual({ tipo: "contratapa" });
    expect(paginas[paginas.length - 1]).toEqual({ tipo: "blanca" });
    expect(paginas.length % 2).toBe(0);
  });
  it("cada capítulo abre en página derecha (índice impar)", () => {
    paginas.forEach((p, i) => {
      if (p.tipo === "capitulo") expect(i % 2).toBe(1);
    });
  });
  it("las fotos que no son la principal cierran el capítulo", () => {
    const i = paginas.findIndex((p) => p.tipo === "fotos");
    expect(i).toBeGreaterThan(0);
    const siguiente = paginas[i + 1];
    expect(["blanca", "capitulo"]).toContain(siguiente.tipo);
  });
});
