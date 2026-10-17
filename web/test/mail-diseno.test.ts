import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { armarMailAcceso, armarMailInvitacion, armarMailRegalo, enviarMailAcceso, enviarMailInvitacion, enviarMailRegalo, idiomaMailDeRegion, RUTA_LOGO_MAIL } from "../src/lib/mail";
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
    expect(html).toMatch(/<td bgcolor="#0d0d0c"[^>]*>\s*<a href="https:\/\/prueba\.vitacora\.test\/entrar"/);
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
    expect(texto).toContain(`Entrar a la página de la historia\n${URL}/entrar`);
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
    expect(html).toMatch(/<td bgcolor="#0d0d0c"[^>]*>\s*<a href="https:\/\/prueba\.vitacora\.test\/regalo\/VF-7K3M2Q\/tarjeta"/);
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

describe("mail de invitación con el diseño nuevo (fase 3)", () => {
  it("el botón va a /entrar como tabla con fondo de tinta; mismos asuntos de antes", () => {
    const comun = armarMailInvitacion({ nombreNarrador: "Dora", quienInvita: "Marta", region: "AR" });
    const dudas = armarMailInvitacion({ nombreNarrador: "Dora", quienInvita: "Marta", region: "AR", paraDudas: true });
    expect(comun.asunto).toBe("Marta te invita a la historia de Dora");
    expect(dudas.asunto).toBe("Marta te pide ayuda con la historia de Dora");
    for (const { html } of [comun, dudas]) {
      expect(html).toMatch(/<td bgcolor="#0d0d0c"[^>]*>\s*<a href="https:\/\/prueba\.vitacora\.test\/entrar"/);
      expect(html).toContain('width="600"');
      expect(html).toContain('<html lang="es-AR"');
      expect(html).not.toMatch(/<script|#5D3FD3/i);
    }
    expect(plano(comun.html)).toContain("Ver la historia de Dora");
    expect(plano(comun.html)).toContain("INVITACIÓN");
    expect(plano(comun.html)).toContain("Recibís este mail porque te invitaron a una historia.");
    expect(plano(comun.html)).not.toContain("PEDIDO CONFIRMADO");
    expect(plano(dudas.html)).toContain("Ver las dudas");
  });

  it("escapa el nombre del narrador y de quien invita en el HTML (no en el asunto ni en el texto plano)", () => {
    const { html, asunto, texto } = armarMailInvitacion({ nombreNarrador: '<img src=x onerror="a">', quienInvita: "Ana & <b>Leo</b>", region: "ES" });
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>Leo</b>");
    expect(html).toContain("&lt;img src=x onerror=&quot;a&quot;&gt;");
    expect(html).toContain("Ana &amp; &lt;b&gt;Leo&lt;/b&gt;");
    expect(asunto).toBe('Ana & <b>Leo</b> te invita a la historia de <img src=x onerror="a">');
    expect(texto).toContain("Ana & <b>Leo</b> te ha invitado a seguir su historia.");
  });

  it("España de tú, Argentina de vos; el texto plano trae el link", () => {
    const es = armarMailInvitacion({ nombreNarrador: "Imma", quienInvita: "Pere", region: "ES" });
    expect(plano(es.html)).toContain("Pere te ha invitado a seguir su historia. Podrás escuchar lo que va contando");
    expect(plano(es.html)).toContain("Recibes este email porque te han invitado a una historia.");
    expect(plano(es.html)).not.toMatch(/Entrá|invitó|Recibís|sabés/);
    expect(es.texto).toContain(`Entra con este mismo correo:\nVer la historia de Imma\n${URL}/entrar`);
    expect(es.texto).not.toMatch(/<[a-z]/i);
  });

  it("ninguna promesa que el sistema no cumple; el libro se escribe al terminar (D4)", () => {
    for (const idioma of IDIOMAS_WEB) {
      for (const paraDudas of [false, true]) {
        const m = armarMailInvitacion({ nombreNarrador: "Dora", quienInvita: "Marta", idioma, paraDudas });
        for (const t of [m.asunto, m.html, m.texto]) {
          expect(t).not.toMatch(PROHIBIDAS);
          expect(t).not.toMatch(/está escribiendo el libro/);
        }
      }
    }
    expect(armarMailInvitacion({ nombreNarrador: "Dora", quienInvita: "Marta", idioma: "ca" }).html).toContain('<html lang="ca-ES"');
  });

  it("a Resend le llegan el html y el texto plano", async () => {
    vi.stubEnv("RESEND_API_KEY", "clave-prueba");
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" });
    vi.stubGlobal("fetch", fetchFalso);
    await enviarMailInvitacion({ para: "tia@x.com", nombreNarrador: "Dora", quienInvita: "Marta", region: "AR" });
    const cuerpo = JSON.parse(fetchFalso.mock.calls[0][1].body);
    expect(cuerpo.to).toEqual(["tia@x.com"]);
    expect(cuerpo.subject).toBe("Marta te invita a la historia de Dora");
    expect(cuerpo.text).toContain(`${URL}/entrar`);
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

// Vitácora Kids (15/10): textos aprobados por Naza, literales
// (docs/rediseno-2026-10/kids/textos-aprobados-2026-10-15.md, puntos 1 a 4).
describe("mail de acceso de Vitácora Kids", () => {
  const ASUNTO = "Listo, ya está en marcha el libro de Tomi";
  const A = "Le vamos a escribir a Tomi a la hora que elegiste. A vos te avisamos por WhatsApp.";
  const B = "El primer mensaje te llega a tu WhatsApp. La primera pregunta sale cuando estén juntos.";
  const PANEL = "En tu panel vas a ver todo lo que cuenta. Ahí también podés escribir hasta tres preguntas tuyas para el libro.";
  const DE_LA_BIOGRAFIA = /Hoy le escribimos|En un rato le llega|Arranca cuando quiera|escuchar su voz desde tu panel/;

  it("canal A: asunto, vista previa y primera línea del A, y la fila del panel", () => {
    const { asunto, html, texto } = armarMailAcceso({ comoLeDicen: "Tomi", region: "AR", kids: { canal: "A" } });
    expect(asunto).toBe(ASUNTO);
    expect(html).toContain(A);
    expect(html.split(A).length - 1).toBe(2); // vista previa + cuerpo
    expect(html).toContain(PANEL);
    expect(html).toContain('<html lang="es-AR"');
    expect(html).toContain(`href="${URL}/entrar"`);
    expect(texto).toContain(A);
    expect(texto).toContain(`Mientras cuenta. ${PANEL}`);
    expect(texto).not.toContain(B);
    expect(plano(html)).not.toMatch(DE_LA_BIOGRAFIA);
    expect(texto).not.toMatch(DE_LA_BIOGRAFIA);
    expect(texto).not.toMatch(PROHIBIDAS);
  });

  it("canal B: la vista previa y la primera línea del B", () => {
    const { asunto, html, texto } = armarMailAcceso({ comoLeDicen: "Tomi", region: "AR", kids: { canal: "B" } });
    expect(asunto).toBe(ASUNTO);
    expect(html.split(B).length - 1).toBe(2);
    expect(texto).toContain(B);
    expect(texto).toContain(PANEL);
    expect(texto).not.toContain(A);
    expect(texto).not.toMatch(DE_LA_BIOGRAFIA);
  });

  it("Kids va en vos aunque la familia diga España, y escapa el apodo", () => {
    const { html, texto } = armarMailAcceso({ comoLeDicen: "<b>Tomi</b>", region: "ES", kids: { canal: "A" } });
    expect(html).toContain('<html lang="es-AR"');
    expect(texto).toContain("¿Dudas? Contestá este mail.");
    expect(html).toContain("a &lt;b&gt;Tomi&lt;/b&gt; a la hora");
    expect(html).not.toContain("<b>Tomi</b>");
  });

  it("la biografía no cambia", () => {
    const { asunto, texto } = armarMailAcceso({ comoLeDicen: "abuela", region: "AR" });
    expect(asunto).toBe("Listo. Hoy le escribimos a tu abuela.");
    expect(texto).toContain("vas a poder escuchar su voz desde tu panel.");
    expect(texto).not.toContain(PANEL);
  });
});
