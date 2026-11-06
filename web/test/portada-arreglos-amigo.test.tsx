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
  it("las hojas se montan sobre la anterior: entre una y otra no se ve el inicio fijo", () => {
    expect(html).toMatch(/class="dir-pagina dir-portada /);
    const css = readFileSync(path.resolve(__dirname, "../src/app/_direccion/direccion.css"), "utf8");
    expect(css).toContain(".dir-portada > section + section { margin-top: -1px; }");
  });

  it("la onda de voz se ve sobre la hoja clara: OndaQuieta pinta con las variables de la tinta", () => {
    expect(html).toContain('class="acu-onda ');
    const css = readFileSync(path.resolve(__dirname, "../src/app/_portada/acuarela.css"), "utf8");
    expect(css).toMatch(/\.acu-onda \{[^}]*--dir-sobre-tinta: var\(--acu-relleno\);[^}]*--dir-sobre-tinta-suave: var\(--acu-suave\);/);
  });

  it("las preguntas van sobre blanco cálido sin depender del orden de las hojas de estilo", () => {
    // La sección lleva dir-papel (las variables del acordeón) y acu-hoja-lisa
    // (el fondo): las dos pintan fondo con la misma fuerza, así que el fondo se
    // fija con una regla más específica, no con quién se cargó último.
    expect(html).toMatch(/id="preguntas" class="dir-papel acu-hoja-lisa /);
    const css = readFileSync(path.resolve(__dirname, "../src/app/_portada/acuarela.css"), "utf8");
    expect(css).toMatch(/\.dir-portada \.dir-papel\.acu-hoja-lisa \{[^}]*background: var\(--acu-blanco\)/);
  });
});
