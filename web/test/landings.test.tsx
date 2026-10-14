import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";

// Las landings de anuncio (rediseño 2026-10, fase 4): /regalo-para-tu-padre
// (/ar/regalo-para-tu-papa), /lo-que-nunca-le-preguntaste, /su-voz y la de
// Viaje, /el-libro-del-viaje, cada una en es, ca y ar. Se fija: que son
// estáticas, que cada una lleva al checkout de su idioma, sus textos, que la
// garantía va una sola vez (en la mini FAQ, DECISIONES D1), que nada
// prohibido aparece (D4, B24) y que las preguntas de /lo-que-nunca-le-preguntaste
// son del banco de verdad de la entrevista V3.

import RegaloEs from "../src/app/regalo-para-tu-padre/page";
import RegaloCa from "../src/app/ca/regalo-para-tu-padre/page";
import RegaloAr from "../src/app/ar/regalo-para-tu-papa/page";
import PreguntasEs from "../src/app/lo-que-nunca-le-preguntaste/page";
import PreguntasCa from "../src/app/ca/lo-que-nunca-le-preguntaste/page";
import PreguntasAr from "../src/app/ar/lo-que-nunca-le-preguntaste/page";
import VozEs from "../src/app/su-voz/page";
import VozCa from "../src/app/ca/su-voz/page";
import VozAr from "../src/app/ar/su-voz/page";
import ViajeEs from "../src/app/el-libro-del-viaje/page";
import ViajeCa from "../src/app/ca/el-libro-del-viaje/page";
import ViajeAr from "../src/app/ar/el-libro-del-viaje/page";
import { metadata as metaRegaloAr } from "../src/app/ar/regalo-para-tu-papa/page";
import { metadata as metaRegaloEs } from "../src/app/regalo-para-tu-padre/page";
import { TEXTOS_LANDING_REGALO } from "../src/app/_textos/landing-regalo";
import { TEXTOS_LANDING_PREGUNTAS } from "../src/app/_textos/landing-preguntas";
import { TEXTOS_LANDING_VOZ } from "../src/app/_textos/landing-voz";
import { TEXTOS_LANDING_VIAJE } from "../src/app/_textos/landing-viaje";
import type { IdiomaWeb } from "../src/lib/idioma-web";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const IDIOMAS: IdiomaWeb[] = ["es", "ca", "ar"];
const PREFIJO: Record<IdiomaWeb, string> = { es: "", ca: "/ca", ar: "/ar" };

const FAMILIARES = {
  regalo: { paginas: { es: RegaloEs, ca: RegaloCa, ar: RegaloAr }, textos: TEXTOS_LANDING_REGALO },
  preguntas: { paginas: { es: PreguntasEs, ca: PreguntasCa, ar: PreguntasAr }, textos: TEXTOS_LANDING_PREGUNTAS },
  voz: { paginas: { es: VozEs, ca: VozCa, ar: VozAr }, textos: TEXTOS_LANDING_VOZ },
} as const;
const VIAJE = { es: ViajeEs, ca: ViajeCa, ar: ViajeAr } as const;

// DECISIONES D1 y D4, TEXTOS-Y-REGLAS §1, PENDIENTES B12, B24 y B26.
const PROHIBIDO = [
  "Kids",
  "mientras se escribe",
  "anticipo",
  "30 días",
  "treinta días",
  "una pregunta por día",
  "cada mañana",
  "cada noche",
  "Cada noche",
  "cada nit",
  "esa misma noche",
  "9 días",
  "nueve días",
  "13 × 18",
  "VITACORA10",
  "IFEMA",
  "RESEÑA DE EJEMPLO",
  "El amor",
  "fbq(",
  "connect.facebook.net",
];

const GARANTIA = ["te devolvemos el dinero", "et tornem els diners", "et retornem els diners"];

function contar(html: string, frase: string): number {
  return html.split(escapar(frase)).length - 1;
}

const viejos: Record<string, string | undefined> = {};
const ENTORNO = { PRECIO_ARS: "65000", PRECIO_EUR: "79", PRECIO_VIAJE_EUR: "59", PRECIO_VIAJE_ARS: "70000" };

beforeEach(() => {
  for (const [k, v] of Object.entries(ENTORNO)) {
    viejos[k] = process.env[k];
    process.env[k] = v;
  }
});
afterEach(() => {
  for (const k of Object.keys(ENTORNO)) {
    if (viejos[k] === undefined) delete process.env[k];
    else process.env[k] = viejos[k];
  }
});

describe("las landings de anuncio del libro de una vida", () => {
  for (const [nombre, { paginas, textos }] of Object.entries(FAMILIARES)) {
    for (const idioma of IDIOMAS) {
      it(`${nombre} en ${idioma}: estática, sus textos y al checkout de su idioma`, () => {
        const pagina = paginas[idioma];
        const elemento = pagina();
        expect(elemento).not.toBeInstanceOf(Promise);
        const html = renderToStaticMarkup(elemento);
        const t = textos[idioma];
        expect(html).toContain(escapar(t.titulo));
        expect(html).toContain(escapar(t.bajada));
        expect(html).toContain(escapar(t.cierre));
        // El botón de la landing (hero y cierre) y el «Comprar» de la cabecera.
        expect(contar(html, t.cta)).toBeGreaterThanOrEqual(2);
        expect(html).toContain(`href="${PREFIJO[idioma]}/comprar"`);
        expect(html).not.toContain('href="/comprar/viaje"');
        expect(html).toContain(`lang="${idioma === "ca" ? "ca-ES" : idioma === "ar" ? "es-AR" : "es-ES"}"`);
        // Sin cabecera completa: ni solapas ni «Entrar» arriba.
        expect(html).not.toContain('data-solapa="viaje"');
        for (const p of PROHIBIDO) expect(html, p).not.toContain(escapar(p));
        // La garantía, una sola vez: en la mini FAQ.
        const veces = GARANTIA.reduce((n, g) => n + contar(html, g), 0);
        expect(veces).toBe(1);
        expect(html.indexOf(escapar(t.faqTitulo))).toBeLessThan(html.search(/te devolvemos el dinero|et tornem els diners/));
      });
    }
  }

  it("en /ar se dice papá; en / y /ca, padre", () => {
    expect(renderToStaticMarkup(RegaloAr())).toContain("papá");
    expect(renderToStaticMarkup(RegaloAr())).not.toContain("tu padre");
    expect(renderToStaticMarkup(RegaloEs())).not.toContain("papá");
    expect(renderToStaticMarkup(PreguntasAr())).toContain(escapar("¿Qué sabés de tu papá antes de que fuera tu papá?"));
  });

  it("las rutas de regalo por idioma se enlazan entre sí (hreflang) con la de Argentina en papá", () => {
    expect(metaRegaloEs.alternates?.languages).toMatchObject({
      "es-ES": "/regalo-para-tu-padre",
      "ca-ES": "/ca/regalo-para-tu-padre",
      "es-AR": "/ar/regalo-para-tu-papa",
    });
    expect(metaRegaloAr.alternates?.canonical).toBe("/ar/regalo-para-tu-papa");
  });

  it("regalo: la tarjeta con sus textos aprobados (y nombres de ejemplo dichos)", () => {
    const html = renderToStaticMarkup(RegaloEs());
    expect(html).toContain(escapar("Osvaldo, Laura te ha hecho un regalo."));
    expect(html).toContain(escapar("Esto es un regalo."));
    expect(html).toContain(escapar("Los nombres son de ejemplo."));
  });

  it("su voz: la onda quieta, sin reproductor ni botón de escuchar", () => {
    for (const idioma of IDIOMAS) {
      const html = renderToStaticMarkup(FAMILIARES.voz.paginas[idioma]());
      expect(html).not.toContain("<audio");
      expect(html).not.toContain(escapar("Escuchar el fragmento"));
      expect(html).toContain("limoner");
    }
  });
});

describe("las preguntas de /lo-que-nunca-le-preguntaste son del banco de la entrevista", () => {
  const BANCOS: Record<IdiomaWeb, string> = { es: "banco-es-ES.md", ar: "banco.md", ca: "banco-ca.md" };
  const carpeta = path.resolve(__dirname, "../../docs/v3/entrevista");
  // Lo que se compara: sin mayúsculas y con los dos puntos como punto (así se
  // adaptaron, como las aprobadas de la portada).
  const normal = (s: string) => s.replace(/:\s/g, ". ").toLowerCase();

  for (const idioma of IDIOMAS) {
    it(`en ${idioma}, cada pregunta sale de su fila del banco (${BANCOS[idioma]}), sin amor`, () => {
      const banco = readFileSync(path.join(carpeta, BANCOS[idioma]), "utf8");
      for (const q of TEXTOS_LANDING_PREGUNTAS[idioma].preguntas) {
        const fila = banco.split("\n").find((l) => l.startsWith(`| ${q.id} |`));
        expect(fila, q.id).toBeDefined();
        const frases = q.texto.split(/(?<=[.?])\s+/).filter((f) => f.length > 12);
        const enElBanco = frases.filter((f) => normal(fila!).includes(normal(f).replace(/\.$/, "")));
        expect(enElBanco.length, `${q.id}: ${q.texto}`).toBeGreaterThan(0);
        expect(q.id).toMatch(/^(OR|CA|ES|TR)\d/);
      }
      const html = renderToStaticMarkup(FAMILIARES.preguntas.paginas[idioma]());
      for (const q of TEXTOS_LANDING_PREGUNTAS[idioma].preguntas) expect(html).toContain(escapar(q.texto));
    });
  }
});

describe("la landing de Viaje", () => {
  for (const idioma of IDIOMAS) {
    it(`en ${idioma}: estática, a la compra de Viaje de su idioma, sin V2 ni «cada noche»`, () => {
      const elemento = VIAJE[idioma]();
      expect(elemento).not.toBeInstanceOf(Promise);
      const html = renderToStaticMarkup(elemento);
      const t = TEXTOS_LANDING_VIAJE[idioma];
      expect(html).toContain(escapar(t.titulo));
      expect(html).toContain(`href="${PREFIJO[idioma]}/comprar/viaje"`);
      expect(html).not.toContain(`href="${PREFIJO[idioma]}/comprar"`);
      for (const p of [...PROHIBIDO, "los dos", "Los dos", "luna de miel", "cada uno con su móvil"]) expect(html, p).not.toContain(escapar(p));
      const veces = GARANTIA.reduce((n, g) => n + contar(html, g), 0);
      expect(veces).toBe(1);
    });
  }

  it("sin precio de Viaje cargado no vende: ni botón ni enlace a la compra", () => {
    delete process.env.PRECIO_VIAJE_EUR;
    const html = renderToStaticMarkup(ViajeEs());
    expect(html).not.toContain('href="/comprar/viaje"');
    expect(html).toContain("Próximamente");
  });
});
