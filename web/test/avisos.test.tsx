import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Rediseño, fase 3 (maqueta `Casos` 5): el 404 y los enlaces que ya no sirven,
// en tinta y papel, con una salida útil y sin violeta.

const cabeceras = { pais: "ES", cookie: undefined as string | undefined };
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-vercel-ip-country": cabeceras.pais }),
  cookies: async () => ({ get: () => (cabeceras.cookie ? { value: cabeceras.cookie } : undefined) }),
}));

import NoEncontrada from "../src/app/not-found";
import NoEncontradaCa from "../src/app/ca/not-found";
import NoEncontradaAr from "../src/app/ar/not-found";
import EnlaceLibro from "../src/app/libro/[token]/not-found";
import EnlaceVoz from "../src/app/voz/[token]/not-found";
import RegaloNoEncontrado from "../src/app/regalo/[codigo]/not-found";
import { hrefDeSalida } from "../src/app/_publico/hoja-aviso";
import { TEXTOS_AVISOS } from "../src/app/_textos/avisos";
import { IDIOMAS_WEB } from "../src/lib/idioma-web";

afterEach(() => {
  vi.unstubAllEnvs();
  cabeceras.pais = "ES";
  cabeceras.cookie = undefined;
});

const html = (nodo: React.ReactNode) => renderToStaticMarkup(<>{nodo}</>).replace(/&#x27;/g, "'");
const VIOLETA = /#5D3FD3|#a08ce8|#b9a8f5|violet|purple/i;

describe("el 404", () => {
  it("renderiza la frase aprobada, con salida al inicio y a comprar, sin JS ni violeta", () => {
    const h = html(<NoEncontrada />);
    expect(h).toContain("Esta página se ha perdido.");
    expect(h).toContain("Como algunos recuerdos, si nadie los apunta.");
    expect(h).toMatch(/<a[^>]*href="\/"[^>]*>Volver al inicio<\/a>/);
    expect(h).toMatch(/<a[^>]*href="\/comprar"[^>]*>Iniciar Vitácora<\/a>/);
    expect(h).toContain('lang="es-ES"');
    expect(h).toContain("404");
    expect(h).not.toMatch(/<script/i);
    expect(h).not.toMatch(VIOLETA);
  });

  it("en catalán y en Argentina, con los enlaces de su versión", () => {
    const ca = html(<NoEncontradaCa />);
    expect(ca).toContain("Aquesta pàgina s'ha perdut.");
    expect(ca).toMatch(/href="\/ca"[^>]*>Tornar a l'inici/);
    expect(ca).toContain('href="/ca/comprar"');
    expect(ca).toContain('lang="ca-ES"');
    const ar = html(<NoEncontradaAr />);
    expect(ar).toContain("Esta página se ha perdido.");
    expect(ar).toMatch(/href="\/ar"[^>]*>Volver al inicio/);
    expect(ar).toContain('href="/ar/comprar"');
    expect(ar).toContain('lang="es-AR"');
  });
});

describe("el enlace que ya no sirve", () => {
  it("libro y su voz: «Este enlace ya no sirve», escribirnos (correo sin WhatsApp) y entrar", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_DUDAS", "");
    for (const Pagina of [EnlaceLibro, EnlaceVoz]) {
      const h = html(await Pagina());
      expect(h).toContain("Enlace caducado");
      expect(h).toContain("Este enlace ya no sirve.");
      expect(h).toMatch(/<a[^>]*href="mailto:hola@vitacorafamiliar.com"[^>]*>Escríbenos<\/a>/);
      expect(h).toMatch(/<a[^>]*href="\/entrar"[^>]*>Entrar con mi correo<\/a>/);
      expect(h).not.toMatch(VIOLETA);
    }
  });

  it("con el WhatsApp de dudas configurado, escribirnos va a WhatsApp", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_DUDAS", "+34 611 222 333");
    expect(hrefDeSalida({ tipo: "escribirnos" }, "es")).toBe("https://wa.me/34611222333");
    const h = html(await EnlaceLibro());
    expect(h).toMatch(/<a[^>]*href="https:\/\/wa.me\/34611222333"[^>]*target="_blank"/);
  });

  it("de vos fuera de España; la cookie de idioma manda", async () => {
    cabeceras.pais = "AR";
    expect(html(await EnlaceVoz())).toContain("Abrilo otra vez desde el mensaje donde te llegó.");
    cabeceras.cookie = "ca";
    expect(html(await EnlaceVoz())).toContain("Aquest enllaç ja no serveix.");
  });

  it("el regalo que no se encuentra no revela nada y ofrece escribirnos o volver", async () => {
    const h = html(await RegaloNoEncontrado());
    expect(h).toContain("No encontramos este regalo.");
    expect(h).toContain("Escríbenos");
    expect(h).toMatch(/<a[^>]*href="\/"[^>]*>Volver al inicio<\/a>/);
  });
});

describe("textos de los avisos", () => {
  it("los tres idiomas tienen las mismas claves y ninguno lleva dos puntos", () => {
    const claves = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? claves(v).map((c) => `${k}.${c}`) : [k])).sort();
    for (const idioma of IDIOMAS_WEB) {
      expect(claves(TEXTOS_AVISOS[idioma])).toEqual(claves(TEXTOS_AVISOS.es));
      expect(JSON.stringify(TEXTOS_AVISOS[idioma])).not.toMatch(/[^"]:[^"]|: /);
    }
  });
});
