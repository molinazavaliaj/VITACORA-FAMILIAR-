import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

// Lo que encontró un amigo de Naza probando la portada en el celular (15/10).

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});

import { Portada } from "../src/app/_portada/portada";

const html = renderToStaticMarkup(<Portada idioma="es" />);

describe("la portada en el teléfono", () => {
  it("las hojas se montan sobre la anterior: entre los dientes del papel no se ve el inicio fijo", () => {
    expect(html).toMatch(/class="dir-pagina dir-portada /);
    const css = readFileSync(path.resolve(__dirname, "../src/app/_direccion/direccion.css"), "utf8");
    expect(css).toContain(".dir-portada > section + section { margin-top: -1px; }");
    expect(css).toMatch(/\.dir-portada > section\.dir-deckle \{ margin-top: calc\(var\(--dir-deckle-alto, 14px\) \* -1\); \}/);
  });
});
