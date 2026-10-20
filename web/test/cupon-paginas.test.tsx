import { afterEach, describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PaginaLegal } from "../src/app/legal/pagina";
import { Pie } from "../src/app/_publico/pie";
import { RascaYGana } from "../src/app/_publico/rasca";

// Lo que se ve del rasca y gana (20/10): nada sin RASCA_Y_GANA=1; con la
// variable, las bases (en los tres idiomas), el enlace del pie y el 4 bis de
// la privacidad.

const texto = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");

afterEach(() => {
  delete process.env.RASCA_Y_GANA;
});

describe("apagado (sin RASCA_Y_GANA)", () => {
  it("el pie no enlaza las bases y la privacidad no habla del cupón", () => {
    expect(renderToStaticMarkup(<Pie idioma="es" camino="/" rasca />)).not.toContain("/legal/cupon");
    expect(texto(renderToStaticMarkup(<PaginaLegal idioma="es" documento="privacidad" />))).not.toContain("4 bis");
  });
});

describe("prendido", () => {
  it.each([
    ["es", "/legal/cupon", "Bases del cupón de bienvenida"],
    ["ca", "/ca/legal/cupon", "Bases del cupó de benvinguda"],
    ["ar", "/ar/legal/cupon", "Bases del cupón de bienvenida"],
  ] as const)("%s: las bases con su título, su solapa y el titular", (idioma, ruta, titulo) => {
    process.env.RASCA_Y_GANA = "1";
    const h = renderToStaticMarkup(<PaginaLegal idioma={idioma} documento="cupon" />);
    expect(texto(h)).toContain(titulo);
    expect(h).toContain(`href="${ruta}"`);
    expect(texto(h)).toContain("Joaquín Molina");
    expect(texto(h)).not.toMatch(/nota interna/i);
  });

  it("el pie enlaza las bases en su idioma", () => {
    process.env.RASCA_Y_GANA = "1";
    expect(renderToStaticMarkup(<Pie idioma="ca" camino="/" />)).toContain('href="/ca/legal/cupon"');
  });

  it("la privacidad suma el 4 bis", () => {
    process.env.RASCA_Y_GANA = "1";
    const t = texto(renderToStaticMarkup(<PaginaLegal idioma="es" documento="privacidad" />));
    expect(t).toContain("4 bis. El cupón de bienvenida");
    expect(t).toContain("salvo los recordatorios del cupón");
  });

  it("el popup no se pinta de entrada (aparece a los segundos, en el navegador)", () => {
    expect(renderToStaticMarkup(<RascaYGana idioma="es" quien="Joaquín Molina" correo="soporte@vitacorafamiliar.com" />)).toBe("");
  });
});

describe("el checkout", () => {
  it("el paso del pago muestra el campo del cupón solo si se pide", async () => {
    const { Checkout } = await import("../src/app/comprar/formulario");
    const { catalogo } = await import("../src/lib/productos");
    process.env.PRECIO_EUR = "49";
    const con = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} conCupon />);
    expect(con).toContain('id="cupon"');
    expect(texto(con)).toContain("¿Tienes un cupón?");
    const sin = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} />);
    expect(sin).not.toContain('id="cupon"');
  });

  it("el resumen pinta la línea aprobada con el importe en negativo", async () => {
    const { Resumen } = await import("../src/app/_checkout/piezas");
    const { RESUMEN } = await import("../src/app/_textos/checkout");
    const { calcularCompra } = await import("../src/lib/productos");
    process.env.PRECIO_EUR = "49";
    const compra = { ...calcularCompra("ES", { base: "pdf", impresos: 0, marcos: 0 }), total: 44.1 };
    const h = texto(
      renderToStaticMarkup(
        <Resumen compra={compra} region="ES" textos={RESUMEN.es} cabeza={null} incluye={[]} descuento={{ nombre: "Cupón de bienvenida · 10 % del libro digital", importe: "4,90 €" }} />,
      ),
    );
    expect(h).toContain("Cupón de bienvenida · 10 % del libro digital");
    expect(h).toContain("−4,90 €");
    expect(h).toMatch(/44,10/);
  });
});
