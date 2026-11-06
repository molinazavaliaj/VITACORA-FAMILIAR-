import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Portada } from "../src/app/_portada/portada";

// La apertura del logo: arriba de la portada, una vez por visita y sin frenar a nadie.
describe("la apertura de la portada", () => {
  const css = readFileSync("src/app/_portada/acuarela.css", "utf8");

  it("el logo se dibuja en la apertura y no empuja el inicio", () => {
    const html = renderToStaticMarkup(<Portada idioma="es" />);
    expect(html).toContain("acu-apertura");
    expect(html).toContain("Vitácora Familiar");
    expect(html).not.toContain("trazo-portada");
    expect(html).toContain("vf-apertura");
  });

  it("sin movimiento no aparece y, si no, se va sola en 2 s", () => {
    expect(css).toMatch(/^\.acu-apertura \{ display: none; \}/m);
    expect(css).toContain("acu-apertura-sale 0.35s ease 1.7s forwards");
    expect(css).toContain("html[data-sin-apertura] .acu-apertura { display: none; }");
  });
});
