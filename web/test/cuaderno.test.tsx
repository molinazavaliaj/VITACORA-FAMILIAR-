import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import PaginaCuaderno, { metadata } from "../src/app/cuaderno/page";
import { TEXTOS_CUADERNO } from "../src/app/_textos/cuaderno";
import { entradasSitemap } from "../src/lib/sitemap";

// /cuaderno (21/10): adonde lleva el QR de «El cuaderno de su vida». Solo
// España, noindex y con un botón a la portada que deja los utm del QR.

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const html = renderToStaticMarkup(<PaginaCuaderno />);

describe("/cuaderno", () => {
  it("pinta la etiqueta, el título, los dos párrafos y el botón", () => {
    expect(html).toContain(escapar("El cuaderno de su vida"));
    expect(html).toContain(escapar("Un cuaderno lleno es una vida contada"));
    expect(html).toContain(escapar("Gracias por escribirlo. Lo que quedó en esas páginas ya es de toda la familia."));
    expect(html).toContain(escapar(TEXTOS_CUADERNO.parrafos[1]));
    expect(html).toContain("con su voz real en un código para escucharla.");
    expect(html).toContain(escapar("Conocer la Vitácora"));
    expect(html).toContain('lang="es-ES"');
  });

  it("el botón lleva a la portada de España con los utm del QR, en una carga nueva", () => {
    expect(html).toMatch(/<a href="\/\?utm_source=cuaderno&amp;utm_medium=qr"[^>]*>Conocer la Vitácora<\/a>/);
  });

  it("no se indexa, tiene su título y no entra al sitemap", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toEqual({ absolute: "El cuaderno de su vida · Vitácora" });
    expect(metadata.description).toBe(TEXTOS_CUADERNO.parrafos[0]);
    expect(JSON.stringify(entradasSitemap())).not.toContain("cuaderno");
  });
});
