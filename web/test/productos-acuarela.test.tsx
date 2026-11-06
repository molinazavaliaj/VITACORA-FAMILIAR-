import { describe, it, expect, afterEach, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";

// Las páginas de producto con el armado de la portada (06/11): la acuarela con un
// acento por producto, el libro en el estante y los precios del catálogo.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/", useSearchParams: () => new URLSearchParams() }));

import KidsEs from "../src/app/kids/page";
import KidsAr from "../src/app/ar/kids/page";
import HistoriaEs from "../src/app/historia/page";
import EventosEs from "../src/app/eventos/page";
import EventosCa from "../src/app/ca/eventos/page";
import EventosAr from "../src/app/ar/eventos/page";
import { TEXTOS_PRODUCTOS_ACUARELA } from "../src/app/_textos/productos-acuarela";

const html = (P: unknown) => renderToStaticMarkup((P as () => ReactElement)());
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const css = readFileSync(path.join(__dirname, "../src/app/_portada/acuarela.css"), "utf8");

afterEach(() => vi.unstubAllEnvs());

function contraste(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, c] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * c;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe("los acentos", () => {
  it("llegan a 4,5:1 sobre el blanco cálido y con el texto claro encima", () => {
    for (const producto of ["familiar", "viaje", "kids", "historia", "eventos"]) {
      const m = css.match(new RegExp(`\\.acu-acento-${producto} \\{ --acu-bordo: (#[0-9a-f]{6})`));
      expect(m, producto).not.toBeNull();
      expect(contraste(m![1], "#fffdfa"), producto).toBeGreaterThanOrEqual(4.5);
      expect(contraste(m![1], "#fff9f1"), producto).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("cada página lleva el suyo", () => {
    expect(html(KidsEs)).toContain("acu-tema acu-acento-kids");
    expect(html(HistoriaEs)).toContain("acu-tema acu-acento-historia");
    expect(html(EventosEs)).toContain("acu-tema acu-acento-eventos");
  });
});

describe("el estante de cada producto", () => {
  it("Kids sin venta: Próximamente, sin precio ni compra", () => {
    vi.stubEnv("PRECIO_KIDS_EUR", "59");
    const h = html(KidsEs);
    expect(h).toContain("acu-estante--uno");
    expect(h).not.toContain("/comprar/kids");
  });

  it("Kids con venta: el impreso se suma al precio de Kids, salen del catálogo y nunca dicen «desde»", () => {
    vi.stubEnv("KIDS_VENTA", "1");
    vi.stubEnv("PRECIO_KIDS_EUR", "59");
    vi.stubEnv("PRECIO_EUR", "45");
    vi.stubEnv("PRECIO_IMPRESO_EUR", "50");
    const h = html(KidsEs);
    expect(h).toMatch(/109\s?€/);
    expect(h).toMatch(/59\s?€/);
    expect(h).toContain('href="/comprar/kids"');
    expect(h).not.toMatch(/desde\s+\d/i);
  });

  it("Kids mantiene su aviso de privacidad y el sobre cerrado", () => {
    const h = html(KidsAr);
    expect(h).toContain('href="/ar/legal/privacidad"');
    expect(h).toContain(escapar("en un sobre cerrado"));
  });

  it("Historia con venta lleva a su compra", () => {
    vi.stubEnv("HISTORIA_VENTA", "1");
    expect(html(HistoriaEs)).toContain('href="/comprar/historia"');
  });

  it("Eventos no tiene precio: consulta, y la nota lleva al formulario", () => {
    const h = html(EventosEs);
    expect(h).toContain("Consultar");
    expect(h).toContain('href="#contacto"');
    expect(h).not.toMatch(/€/);
  });
});

describe("los textos nuevos de Eventos", () => {
  it("salen en los tres idiomas y siguen las reglas", () => {
    for (const [P, idioma] of [[EventosEs, "es"], [EventosCa, "ca"], [EventosAr, "ar"]] as const) {
      const faq = TEXTOS_PRODUCTOS_ACUARELA[idioma].eventos.faq;
      expect(faq.preguntas.length).toBeGreaterThan(0);
      const h = html(P);
      for (const q of faq.preguntas) expect(h).toContain(escapar(q.pregunta));
      for (const s of [faq.titulo, ...faq.preguntas.flatMap((q) => [q.pregunta, q.respuesta])]) {
        expect(s, s).not.toMatch(/:/);
        expect(s, s).not.toMatch(/(^|[.?!]\s)Y\s/);
        expect(s, s).not.toMatch(/padre|papá|\bpare\b|Unión Europea|no los vendemos|desde\s+\d|€|\$|días|semanas/i);
      }
    }
  });
});
