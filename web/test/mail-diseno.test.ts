import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { armarMailAcceso, armarMailRegalo, enviarMailAcceso, enviarMailRegalo, idiomaMailDeRegion, RUTA_LOGO_MAIL } from "../src/lib/mail";
import { TEXTOS_MAIL } from "../src/lib/mail-textos";
import { IDIOMAS_WEB } from "../src/lib/idioma-web";

// Rediseño, fase 1: los mails de acceso y del regalo con el diseño de la maqueta
// `Email`. HTML de mail (tablas, 600 px), texto plano siempre, los mismos links
// de antes y ninguna promesa que el sistema no cumple (DECISIONES D1 y D4).

const PROHIBIDAS =
  /anticipo|mientras se escribe|escribiéndose|9 días|nueve días|devolvemos el dinero|garantía|una pregunta por día|una pregunta cada día|30 días|treinta días|cada mañana|tercera respuesta|primeras páginas/i;

const URL = "https://prueba.vitacora.test";

beforeEach(() => vi.stubEnv("URL_BASE", URL));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const plano = (html: string) => html.replace(/\s+/g, " ");

describe("mail de acceso con el diseño nuevo", () => {
  it("lleva el botón a /entrar como tabla con fondo, el logo, el lang y la vista previa", () => {
    const { html, asunto } = armarMailAcceso({ comoLeDicen: "abuela", region: "ES" });
    expect(asunto).toBe("Listo. Hoy le escribimos a tu abuela.");
    expect(html).toContain(`href="${URL}/entrar"`);
    expect(html).toMatch(/<td bgcolor="#2a2620"[^>]*>\s*<a href="https:\/\/prueba\.vitacora\.test\/entrar"/);
    expect(html).toContain(`src="${URL}${RUTA_LOGO_MAIL}"`);
    expect(html).toContain('<html lang="es-ES"');
    expect(html).toContain('width="600"');
    expect(html).toContain("En un rato le llega un mensaje nuestro por WhatsApp a tu abuela.");
    expect(html).not.toMatch(/<script/i);
  });

  it("España de tú y Argentina (o sin región) de vos, como antes", () => {
    const es = plano(armarMailAcceso({ comoLeDicen: "abuela", region: "ES" }).html);
    const ar = plano(armarMailAcceso({ comoLeDicen: "abuela", region: "AR" }).html);
    const sin = plano(armarMailAcceso({ comoLeDicen: "abuela" }).html);
    expect(es).toContain("¿Dudas? Contesta a este email.");
    expect(es).toContain("Recibes este email porque has hecho un pedido.");
    expect(es).not.toMatch(/acá|entrá|Contestá|Recibís/);
    expect(ar).toContain("¿Dudas? Contestá este mail.");
    expect(ar).toContain('<html lang="es-AR"');
    expect(sin).toContain("entrá a la página");
    expect(idiomaMailDeRegion("ES")).toBe("es");
    expect(idiomaMailDeRegion("AR")).toBe("ar");
    expect(idiomaMailDeRegion(null)).toBe("ar");
  });

  it("el texto plano trae lo mismo que el HTML, con el link", () => {
    const { texto } = armarMailAcceso({ comoLeDicen: "abuela", region: "AR" });
    expect(texto).toContain("Gracias por confiar. Ya está en marcha.");
    expect(texto).toContain("En un rato le llega un mensaje nuestro por WhatsApp a tu abuela, contándole de qué se trata. Arranca cuando quiera.");
    expect(texto).toContain(`Entrar a mi tablero\n${URL}/entrar`);
    expect(texto).toContain("Cuando termina de contar, el biógrafo escribe su libro.");
    expect(texto).not.toMatch(/<[a-z]/i);
  });

  it("escapa cómo le dicen en el HTML", () => {
    const { html } = armarMailAcceso({ comoLeDicen: "<b>abu</b> & co", region: "ES" });
    expect(html).toContain("a tu &lt;b&gt;abu&lt;/b&gt; &amp; co,");
    expect(html).not.toContain("<b>abu</b>");
  });

  it("a Resend le llega el html y el texto plano", async () => {
    vi.stubEnv("RESEND_API_KEY", "clave-prueba");
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchFalso);
    await enviarMailAcceso({ para: "e@x.com", comoLeDicen: "abuela", region: "ES" });
    const cuerpo = JSON.parse(fetchFalso.mock.calls[0][1].body);
    expect(cuerpo.from).toBe("Vitácora Familiar <hola@vitacorafamiliar.com>");
    expect(cuerpo.subject).toBe("Listo. Hoy le escribimos a tu abuela.");
    expect(cuerpo.text).toContain(`${URL}/entrar`);
    expect(cuerpo.html).toContain("Gracias por confiar. Ya está en marcha.");
  });
});

describe("mail del regalo con el diseño nuevo", () => {
  it("el botón va a /regalo/<código>/tarjeta y abajo el link a /entrar", () => {
    const { html, texto } = armarMailRegalo({ comoLeDicen: "abuelo", codigo: "VF-7K3M2Q", trato: "vos" });
    expect(html).toMatch(/<td bgcolor="#2a2620"[^>]*>\s*<a href="https:\/\/prueba\.vitacora\.test\/regalo\/VF-7K3M2Q\/tarjeta"/);
    expect(html).toContain(`href="${URL}/entrar"`);
    expect(html).toContain("Tu regalo para abuelo está listo");
    expect(texto).toContain(`Ver la tarjeta\n${URL}/regalo/VF-7K3M2Q/tarjeta`);
    expect(texto).toContain("Ya podés descargar la tarjeta. Imprimila o mandala por WhatsApp.");
  });

  it("de tú con trato tú; el idioma lo pisa (catalán listo)", () => {
    expect(armarMailRegalo({ comoLeDicen: "abuela", codigo: "VF-1", trato: "tu" }).html).toContain('<html lang="es-ES"');
    const ca = armarMailRegalo({ comoLeDicen: "l'àvia", codigo: "VF-1", trato: "tu", idioma: "ca" });
    expect(ca.asunto).toBe("El teu regal per a l'àvia ja està llest");
    expect(ca.html).toContain('<html lang="ca-ES"');
    expect(ca.html).toContain("Veure la targeta");
  });

  it("a Resend le llega el texto plano", async () => {
    vi.stubEnv("RESEND_API_KEY", "clave-prueba");
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchFalso);
    await enviarMailRegalo({ para: "a@x.com", comoLeDicen: "abuela", codigo: "VF-AAAAAA", trato: "tu" });
    const cuerpo = JSON.parse(fetchFalso.mock.calls[0][1].body);
    expect(cuerpo.text).toContain(`${URL}/regalo/VF-AAAAAA/tarjeta`);
  });
});

describe("textos de los mails", () => {
  it("ninguna promesa que el sistema no cumple, en ningún idioma ni formato", () => {
    for (const idioma of IDIOMAS_WEB) {
      const acceso = armarMailAcceso({ comoLeDicen: "abuela", idioma });
      const regalo = armarMailRegalo({ comoLeDicen: "abuela", codigo: "VF-1", trato: "tu", idioma });
      for (const t of [acceso.asunto, acceso.html, acceso.texto, regalo.asunto, regalo.html, regalo.texto]) {
        expect(t).not.toMatch(PROHIBIDAS);
      }
    }
  });

  it("los tres idiomas tienen las mismas claves", () => {
    const claves = (idioma: (typeof IDIOMAS_WEB)[number]) =>
      Object.entries(TEXTOS_MAIL[idioma]).flatMap(([bloque, textos]) => Object.keys(textos).map((k) => `${bloque}.${k}`)).sort();
    expect(claves("ca")).toEqual(claves("es"));
    expect(claves("ar")).toEqual(claves("es"));
  });
});
