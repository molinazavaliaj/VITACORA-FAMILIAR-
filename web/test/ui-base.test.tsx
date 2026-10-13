import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Acordeon, Boton, Etiqueta, Hoja, Opcion, Pasos, ReproductorOnda, Tarjeta } from "../src/app/_ui";

// Los componentes base del rediseño (fase 0): lo que tienen que cumplir por
// MOTION.md §2 y §4, sin mirar cómo se ven.

describe("componentes base del rediseño", () => {
  it("el botón es un <Link> con href y un <button type=button> sin él", () => {
    const enlace = renderToStaticMarkup(<Boton href="/comprar">Uno</Boton>);
    expect(enlace).toMatch(/<a[^>]*href="\/comprar"/);
    expect(enlace).toContain("m-btn");
    expect(enlace).toContain("min-h-11");

    const boton = renderToStaticMarkup(<Boton variante="fantasma">Dos</Boton>);
    expect(boton).toMatch(/<button[^>]*type="button"/);
    expect(boton).toContain("m-ghost");
    expect(renderToStaticMarkup(<Boton type="submit">Tres</Boton>)).toContain('type="submit"');
  });

  it("la tarjeta y la etiqueta no traen texto propio", () => {
    expect(renderToStaticMarkup(<Tarjeta>x</Tarjeta>)).toBe(
      '<div class="rounded-[20px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">x</div>',
    );
    expect(renderToStaticMarkup(<Etiqueta rellena>y</Etiqueta>)).toContain("uppercase");
  });

  it("la opción es un label con un input nativo escondido", () => {
    const html = renderToStaticMarkup(<Opcion name="formato" value="a" titulo="A" precio="1" defaultChecked />);
    expect(html).toMatch(/^<label[^>]*m-card/);
    expect(html).toMatch(/<input[^>]*type="radio"[^>]*class="sr-only"/);
    expect(html).toContain('checked=""');
    expect(html).toContain("m-dot");
    expect(renderToStaticMarkup(<Opcion tipo="checkbox" titulo="B" />)).toContain('type="checkbox"');
  });

  it("el acordeón usa <details> y <summary> nativos", () => {
    const html = renderToStaticMarkup(<Acordeon pregunta="P" grupo="faq">R</Acordeon>);
    expect(html).toMatch(/^<details[^>]*m-acc-item[^>]*name="faq"/);
    expect(html).toContain("<summary");
    expect(html).toContain("m-plus");
    expect(html).toContain('class="m-acc"');
    expect(html).not.toContain("open");
    expect(renderToStaticMarkup(<Acordeon pregunta="P" abierta>R</Acordeon>)).toContain('open=""');
  });

  it("los pasos marcan el actual y llenan la barra con scaleX", () => {
    const html = renderToStaticMarkup(<Pasos pasos={["a", "b", "c"]} actual={2} etiqueta="Pasos" />);
    expect(html).toContain('aria-label="Pasos"');
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toMatch(/m-progreso[^>]*transform:scaleX\(0\.6666/);
    expect(html).not.toMatch(/width:\s*\d/);
  });

  it("la hoja cerrada no pinta nada; abierta es un diálogo modal con nombre", () => {
    const cerrar = () => {};
    expect(renderToStaticMarkup(<Hoja abierta={false} alCerrar={cerrar} titulo="T" etiquetaCerrar="Cerrar">c</Hoja>)).toBe("");
    const html = renderToStaticMarkup(<Hoja abierta alCerrar={cerrar} titulo="T" etiquetaCerrar="Cerrar">c</Hoja>);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toMatch(/aria-labelledby="([^"]+)"[\s\S]*<h2 id="\1"/);
    expect(html).toContain('aria-label="Cerrar"');
  });

  it("el reproductor tiene un solo <audio> sin precarga y 20 barras quietas", () => {
    const html = renderToStaticMarkup(
      <ReproductorOnda src="/a.mp3" etiquetaReproducir="Escuchar" etiquetaPausar="Pausar" />,
    );
    expect(html.match(/<audio/g)).toHaveLength(1);
    expect(html).toContain('preload="none"');
    expect(html.match(/m-bar/g)).toHaveLength(20);
    expect(html).toContain('data-playing="false"');
    expect(html).toContain('aria-label="Escuchar"');
  });
});
