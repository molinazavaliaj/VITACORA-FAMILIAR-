import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TapaLibro } from "../src/app/tapa-libro";
import { idiomaDelLibro } from "../src/lib/tapa";

// La tapa del panel es la misma que imprime la fábrica (Naza, 13/10): la foto
// arriba, «EL LIBRO DE SU VIDA», el nombre y «para siempre». Sin subtítulo.

describe("TapaLibro", () => {
  it("con foto: la foto, el rótulo, el nombre, «para siempre» y la marca", () => {
    const html = renderToStaticMarkup(<TapaLibro titulo="Osvaldo Toroide" fotoSrc="/api/fotos/f1" foco={{ x: 0.3, y: 0.2 }} />);
    expect(html).toContain('src="/api/fotos/f1"');
    expect(html).toContain("object-position:30% 20%");
    expect(html).toContain("EL LIBRO DE SU VIDA");
    expect(html).toContain("Osvaldo Toroide");
    expect(html).toContain("para siempre");
    expect(html).toContain("V·F");
  });

  it("sin foto, el toroide en lugar de la foto", () => {
    const html = renderToStaticMarkup(<TapaLibro titulo="Osvaldo" fotoSrc={null} />);
    expect(html).not.toContain("<img");
    expect(html.match(/<svg/g)?.length).toBe(2);
  });

  it("una historia: «UNA HISTORIA DE SU VIDA» arriba del título que eligió el cliente (Naza, 24/10)", () => {
    const html = renderToStaticMarkup(<TapaLibro titulo="La valija verde" fotoSrc={null} producto="historia" />);
    expect(html).toContain("UNA HISTORIA DE SU VIDA");
    expect(html).not.toContain("EL LIBRO DE SU VIDA");
    expect(html).toContain("La valija verde");
    expect(renderToStaticMarkup(<TapaLibro titulo="Imma" fotoSrc={null} idioma="ca" producto="historia" />)).toContain("UNA HISTÒRIA DE LA SEVA VIDA");
  });

  it("en catalán", () => {
    const html = renderToStaticMarkup(<TapaLibro titulo="Imma" fotoSrc={null} idioma="ca" />);
    expect(html).toContain("EL LLIBRE DE LA SEVA VIDA");
    expect(html).toContain("per sempre");
  });

  it("el idioma del libro sale del de la entrevista, como en la fábrica", () => {
    expect(idiomaDelLibro("ca")).toBe("ca");
    expect(idiomaDelLibro("es-ES")).toBe("es");
    expect(idiomaDelLibro(null)).toBe("es");
  });
});

describe("tamanoNombreTapa", () => {
  it("una palabra nunca se corta: el nombre largo achica la letra, igual que en la fábrica", async () => {
    const { tamanoNombreTapa } = await import("../src/lib/tapa");
    expect(tamanoNombreTapa("Osvaldo Toroide")).toBe(8.6);
    expect(tamanoNombreTapa("IMMACULADA COLELL")).toBe(8.6);
    expect(tamanoNombreTapa("MAXIMILIANO BARTOLOMEOVSKIENKO")).toBeLessThan(8.6);
    const html = renderToStaticMarkup(<TapaLibro titulo="IMMACULADA COLELL" fotoSrc={null} />);
    expect(html).not.toContain("break-words");
  });
});
