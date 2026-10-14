import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// La portada por idioma (rediseño 2026-10): / es España, de tú; /ar es
// Argentina, de vos como siempre; /ca, catalán. Antes la portada leía el país
// en cada visita (x-vercel-ip-country); ahora cada versión es una página
// estática y el CDN manda a /ar a quien llega de fuera de Europa
// (next.config.ts). Textos aprobados en docs/web-textos-v3/aprobados.md y el
// POR_TRATO del 13/10.
//
// Textos aprobados que el diseño nuevo ya no usa (anotados en
// docs/rediseno-2026-10/fase-1/textos-portada.md para Naza):
// - «La de tu padre/papá, la de tu abuela, la tuya.» (la bajada del hero pasó a
//   ser la de la maqueta: «Tu padre lo cuenta con audios de WhatsApp…»).
// - «¿Cuál sabes/sabés de tu familia?» (la segunda conversación de WhatsApp,
//   la de la sobremesa, no está en el diseño nuevo).
//
// Dirección nueva (14/10, aprobada por Naza): textos que la portada ya no
// muestra, anotados en docs/rediseno-2026-10/direccion/portada/textos.md:
// - «Tienes/Tenés el teléfono lleno de fotos suyas…» (fotos.texto): lo
//   reemplazó el bloque del dolor y la carta (Naza, 3.ª vuelta).
// - «La de tu padre/papá, la de tu abuelo, la de tu abuela.» (paraQuien.titulo):
//   pasó a «Para las vidas que merecen su propio libro.» (aprobado).
// - «Tu padre lo cuenta con audios de WhatsApp…» (hero.bajada): pasó a la
//   bajada de marca aprobada el 14/10.
// - «Si sabe mandar un audio, ya sabe hacerlo.» como título (como.titulo):
//   ahora va dentro de la bajada de «Cómo funciona».

import Home from "../src/app/page";
import PortadaCa from "../src/app/ca/page";
import PortadaAr from "../src/app/ar/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const PAGINAS = { es: Home, ca: PortadaCa, ar: PortadaAr } as const;

function portada(idioma: keyof typeof PAGINAS): string {
  return renderToStaticMarkup(PAGINAS[idioma]());
}

const DE_TU = [
  "Mientras responde, tú vas escuchando su historia desde tu panel.",
  "La vida de tu padre, contada por él",
  "Muchos niños van a conocer a sus abuelos solo por fotos",
  "Lo anotas",
  "Nos dices su nombre",
  "Buenos días, Roberto. Cuéntame el primer recuerdo",
  "Qué bonito eso del patio con el limonero. Cuando quieras, seguimos con tus padres.",
  "Entra cuando quieras a escucharlo.",
  "El mismo biógrafo, pero de viaje contigo.",
  "guarda las fotos que le mandas con su historia",
  "Le respondes con un audio",
  "Le mandas la foto del día y le cuentas qué pasaba.",
  "Las preguntas te llegan a ti",
  "¿Mi padre va a saber usarlo?",
  "se suman si quieres.",
  "Regálalo con una tarjeta →",
];

const DE_VOS = [
  "Mientras responde, vos vas escuchando su historia desde tu panel.",
  "La vida de tu papá, contada por él",
  "Muchos chicos van a conocer a sus abuelos solo por fotos",
  "Lo anotás",
  "Nos decís su nombre",
  "Buen día, Roberto. Contame el primer recuerdo",
  "Qué lindo eso del patio con el limonero. Cuando quieras, seguimos con tus papás.",
  "Entrá cuando quieras a escucharlo.",
  "El mismo biógrafo, pero de viaje con vos.",
  "guarda las fotos que le mandás con su historia",
  "Le respondés con un audio",
  "Le mandás la foto del día y le contás qué pasaba.",
  "Las preguntas te llegan a vos",
  "¿Mi papá va a saber usarlo?",
  "se suman si querés.",
  "Regalalo con una tarjeta →",
];

// Lo que no puede aparecer en ninguna versión (DECISIONES D1 y D4,
// TEXTOS-Y-REGLAS §1).
const PROHIBIDO = [
  "Kids",
  "mientras se escribe",
  "anticipo",
  "30 días",
  "treinta días",
  "una pregunta por día",
  "IFEMA",
  "RESEÑA DE EJEMPLO",
  "El amor",
  "Quiénes somos",
  "Lo que dicen las familias",
];

/** El HTML sin la sección de preguntas frecuentes, que es donde sí va la garantía. */
function sinPreguntas(html: string): string {
  const inicio = html.indexOf('id="preguntas"');
  expect(inicio, "la sección de preguntas existe").toBeGreaterThan(-1);
  const fin = html.indexOf("</section>", inicio);
  return html.slice(0, inicio) + html.slice(fin);
}

describe("la portada según el idioma", () => {
  beforeEach(() => {
    process.env.PRECIO_ARS ??= "65000";
    process.env.PRECIO_EUR ??= "79";
  });

  it("es estática: la página no espera nada (sin headers ni cookies)", () => {
    for (const pagina of Object.values(PAGINAS)) expect(pagina()).not.toBeInstanceOf(Promise);
  });

  it("en / (España), de tú y sin nada de vos", () => {
    const html = portada("es");
    for (const frase of DE_TU) expect(html, frase).toContain(escapar(frase));
    for (const frase of DE_VOS) expect(html, frase).not.toContain(escapar(frase));
    expect(html).toContain('lang="es-ES"');
    expect(html).toContain('href="/comprar"');
    expect(html).toContain('href="/ejemplo"');
    expect(html).toContain('href="/regalar"');
    expect(html).toContain("€");
  });

  it("en /ar, de vos como siempre, en pesos", () => {
    const html = portada("ar");
    for (const frase of DE_VOS) expect(html, frase).toContain(escapar(frase));
    for (const frase of DE_TU) expect(html, frase).not.toContain(escapar(frase));
    expect(html).toContain('lang="es-AR"');
    expect(html).toContain('href="/ar/comprar"');
    expect(html).toContain('href="/ar/ejemplo"');
    expect(html).toContain('href="/ar/regalar"');
    expect(html).toContain("Botón de arrepentimiento");
    expect(html).not.toContain("€");
  });

  it("en /ca, en catalán y con los enlaces en catalán", () => {
    const html = portada("ca");
    expect(html).toContain('lang="ca-ES"');
    expect(html).toContain(escapar("En cada família hi ha"));
    expect(html).toContain('href="/ca/comprar"');
    expect(html).toContain('href="/ca/ejemplo"');
    expect(html).toContain('href="/ca/regalar"');
    expect(html).toContain("€");
  });

  it("Para quién es: el título aprobado, sin Kids", () => {
    expect(portada("es")).toContain(escapar("Para las vidas que merecen su propio libro."));
    expect(portada("ar")).toContain(escapar("Para las vidas que merecen su propio libro."));
    expect(portada("ca")).toContain(escapar("Per a les vides que mereixen el seu propi llibre."));
  });

  it("nada de lo prohibido, en ningún idioma", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const html = portada(idioma);
      for (const frase of PROHIBIDO) expect(html, `${idioma}: ${frase}`).not.toContain(escapar(frase));
    }
  });

  it("la garantía solo en las preguntas frecuentes («¿Y si no quiere hacerlo?»)", () => {
    for (const idioma of ["es", "ar"] as const) {
      const html = portada(idioma);
      expect(html).toContain(escapar("¿Y si no quiere hacerlo?"));
      expect(html).toContain("te devolvemos el dinero");
      expect(sinPreguntas(html), idioma).not.toContain("devolvemos");
    }
    const ca = portada("ca");
    expect(ca).toContain("et tornem els diners");
    expect(sinPreguntas(ca)).not.toContain("tornem");
  });

  it("el inicio no carga imágenes ni vídeo: el primer pintado es el titular", () => {
    const html = portada("es");
    const inicio = html.slice(0, html.indexOf('id="hero"'));
    expect(inicio).not.toContain("<img");
    expect(html).not.toContain("<video");
    expect(html).not.toContain(".mp4");
  });

  it("el libro de ejemplo en 3D: QR real, «Historia inventada» y «Ver otra vez»", () => {
    const es = portada("es");
    expect(es).toMatch(/<path d="M\d+ \d+h1v1h-1z/);
    expect(es).toContain("Historia inventada");
    expect(es).toContain("Ver otra vez");
    expect(es).toContain(escapar("Osvaldo Toroide · El libro de su vida"));
    expect(portada("ca")).toContain("Tornar-ho a veure");
  });

  it("sin violeta: la portada no usa los colores del botón viejo", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const html = portada(idioma).toLowerCase();
      for (const color of ["#8f7be0", "#a08ce8", "#b9a8f5", "#5d3fd3"]) expect(html, `${idioma}: ${color}`).not.toContain(color);
    }
  });
});
