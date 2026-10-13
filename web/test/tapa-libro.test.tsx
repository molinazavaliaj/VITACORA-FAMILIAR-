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
