import { describe, it, expect, afterEach, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// «Vitácora de una historia» en la web pública (plan 2026-10-21, Tasks 4.3 y 4.4): la cuarta solapa y la página
// /historia en los tres idiomas, con los textos aprobados por Naza el 23/10.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/historia", useSearchParams: () => new URLSearchParams() }));

import { Solapas, Cabecera } from "../src/app/_publico/cabecera";
import { TEXTOS_HISTORIA } from "../src/app/_textos/historia";
import { TEXTOS_PUBLICO } from "../src/app/_textos/publico";
import PaginaEs, { metadata as metaEs } from "../src/app/historia/page";
import PaginaCa, { metadata as metaCa } from "../src/app/ca/historia/page";
import PaginaAr, { metadata as metaAr } from "../src/app/ar/historia/page";

const render = (P: unknown) => renderToStaticMarkup((P as () => ReactElement)());
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

afterEach(() => vi.unstubAllEnvs());

describe("la cuarta solapa", () => {
  it("Familiar · Kids · De viaje · Historia, con Historia marcada en su página", () => {
    const html = renderToStaticMarkup(<Solapas idioma="es" producto="historia" />);
    expect([...html.matchAll(/data-solapa="(\w+)"/g)].map((m) => m[1])).toEqual(["familiar", "kids", "viaje", "historia"]);
    expect(html).toMatch(/data-solapa="historia" aria-current="page"/);
    expect(html).toContain('href="/historia"');
    expect(renderToStaticMarkup(<Solapas idioma="ca" />)).toContain(TEXTOS_PUBLICO.ca.historia);
  });

  it("«Comprar» va a /comprar/historia solo si se vende", () => {
    expect(renderToStaticMarkup(<Cabecera idioma="es" camino="/historia" producto="historia" />)).not.toContain('href="/comprar/historia"');
    vi.stubEnv("HISTORIA_VENTA", "1");
    expect(renderToStaticMarkup(<Cabecera idioma="ar" camino="/historia" producto="historia" />)).toContain('href="/ar/comprar/historia"');
  });
});

describe("la página /historia", () => {
  it("el título y la descripción salen de los textos aprobados, en los tres idiomas", () => {
    expect(metaEs.title).toEqual({ absolute: TEXTOS_HISTORIA.es.meta.titulo });
    expect(metaCa.title).toEqual({ absolute: TEXTOS_HISTORIA.ca.meta.titulo });
    expect(metaAr.description).toBe(TEXTOS_HISTORIA.ar.meta.descripcion);
  });

  it("renderiza con la solapa de historia marcada, el lema, los pasos y las preguntas frecuentes", () => {
    for (const [P, idioma] of [[PaginaEs, "es"], [PaginaCa, "ca"], [PaginaAr, "ar"]] as const) {
      const html = render(P);
      const t = TEXTOS_HISTORIA[idioma];
      expect(html).toMatch(/data-solapa="historia" aria-current="page"/);
      expect(html).toContain(escapar(t.hero.linea1));
      expect(html).toContain(escapar(t.como.pasos[3].titulo));
      expect(html).toContain(escapar(t.faq.preguntas[0].p));
      expect(html).toContain(escapar(t.temas.mudanza.nombre));
    }
  });

  it("sin HISTORIA_VENTA, «Próximamente» y «Escribinos»; con la venta, «Empezar el libro» a su compra", () => {
    const sin = render(PaginaAr);
    expect(sin).toContain(TEXTOS_HISTORIA.ar.proximamente.boton);
    expect(sin).not.toContain('href="/ar/comprar/historia"');
    vi.stubEnv("HISTORIA_VENTA", "1");
    const con = render(PaginaAr);
    expect(con).toContain('href="/ar/comprar/historia"');
    expect(con).toContain(TEXTOS_HISTORIA.ar.empezar);
  });

  it("no dice cuántas preguntas son (Naza, 23/10)", () => {
    for (const P of [PaginaEs, PaginaCa, PaginaAr]) expect(render(P)).not.toMatch(/quince|quinze|\b15 pregunt/i);
  });
});
