import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Direccion } from "../src/app/_direccion/direccion";
import { TEXTOS_PORTADA } from "../src/app/_textos/portada";

// El prototipo de dirección visual (/prueba-direccion, 13/10): usa los textos
// aprobados de la portada en castellano de España, sin escribir ninguno a mano,
// y no muestra lo que la portada tiene prohibido (Kids, garantía).

const t = TEXTOS_PORTADA.es;
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

describe("prototipo de dirección visual", () => {
  const html = renderToStaticMarkup(<Direccion />);

  it("renderiza los textos aprobados de la portada", () => {
    const textos = [
      t.hero.titulo[0],
      t.hero.titulo[1],
      t.hero.bajada,
      t.hero.comprar,
      t.hero.verComo,
      `${t.fotos.titulo[0]} ${t.fotos.titulo[1]}`,
      t.fotos.texto,
      t.como.titulo,
      t.como.bajada,
      ...t.como.pasos.flatMap((p) => [p.titulo, p.texto]),
      t.paraQuien.padre.texto,
      t.paraQuien.abuelo.texto,
      t.paraQuien.viaje.texto,
      t.hereda.cierre,
    ];
    for (const texto of textos) expect(html).toContain(escapar(texto));
    // El título de «Para quién es» lleva los nombres en cursiva: mismo texto.
    expect(html.replace(/<\/?em[^>]*>/g, "")).toContain(escapar(t.paraQuien.titulo));
  });

  it("muestra el precio del catálogo, no una cifra a mano", () => {
    expect(html).toMatch(/Desde \d[\d.]*\s€ · pago único/);
  });

  it("lleva a comprar y al ejemplo", () => {
    expect(html).toContain('href="/comprar"');
    expect(html).toContain('href="/ejemplo"');
  });

  it("no menciona Kids ni la garantía", () => {
    expect(html).not.toMatch(/kids/i);
    expect(html).not.toMatch(/devolvemos/i);
    expect(html).not.toMatch(/garant/i);
  });
});
