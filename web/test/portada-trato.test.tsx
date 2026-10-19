import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// La portada por idioma (rediseño 2026-10): / es España, de tú; /ar es
// Argentina, de vos; /ca, catalán. Cada versión es una página estática y el
// CDN manda a /ar a quien llega de fuera de Europa (next.config.ts).
//
// Desde el 15/10 la portada es la maqueta que aprobó Naza (correcciones de su
// amigo y brief de Remento, docs/rediseno-2026-10/amigo/textos.md 1 a 30):
// inicio → qué es → cómo funciona → carta → escúchalo → el libro (un solo
// precio, el del impreso) → marcos → regalo → preguntas → duda → cierre. Se
// fueron la banda, «Las fotos quedan», «Para quién» con Viaje, la
// conversación, «Mientras cuenta», «Lo que se hereda», el precio con «desde»,
// el bloque de Viaje y «el tuyo».

import Home, { metadata as metaEs } from "../src/app/page";
import PortadaCa, { metadata as metaCa } from "../src/app/ca/page";
import PortadaAr, { metadata as metaAr } from "../src/app/ar/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const PAGINAS = { es: Home, ca: PortadaCa, ar: PortadaAr } as const;

function portada(idioma: keyof typeof PAGINAS): string {
  return renderToStaticMarkup(PAGINAS[idioma]());
}

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const ars = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const DE_TU = [
  "¿Quieres contar tu propia vida?",
  "También puedes hacer tu libro.",
  "Tú lo vas siguiendo de cerca.",
  "Escuchas cada audio en cuanto lo manda.",
  "Lo ves terminado y eliges la tapa antes de imprimirlo.",
  "Nos dices quién es",
  "Nos dejas su nombre, su WhatsApp y el día en que quieres que empiece.",
  "Muchos niños van a conocer a sus abuelos solo por fotos",
  "Las escuchas con el código de la contratapa o desde el móvil, cuando quieras.",
  "Léelo",
  "Acercas el móvil y suena su voz. Puedes pedir uno",
  "Regálale algo que va a quedar para toda la vida. Eliges el día",
  "Las preguntas te llegan a ti",
  "se suman si quieres.",
];

const DE_VOS = [
  "¿Querés contar tu propia vida?",
  "También podés hacer tu libro.",
  "Vos lo vas siguiendo de cerca.",
  "Escuchás cada audio en cuanto lo manda.",
  "Lo ves terminado y elegís la tapa antes de imprimirlo.",
  "Nos decís quién es",
  "Nos dejás su nombre, su WhatsApp y el día en que querés que empiece.",
  "Muchos chicos van a conocer a sus abuelos solo por fotos",
  "Las escuchás con el código de la contratapa o desde el celular, cuando quieras.",
  "Leelo",
  "Acercás el celular y suena su voz. Podés pedir uno",
  "Regalale algo que va a quedar para toda la vida. Elegís el día",
  "Las preguntas te llegan a vos",
  "se suman si querés.",
];

// Lo que no puede aparecer en ninguna versión (DECISIONES D1 y D4,
// TEXTOS-Y-REGLAS §1) ni lo que se fue el 15/10.
const PROHIBIDO = [
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
  // Lo que se fue con la portada nueva (15/10).
  "Las fotos quedan.",
  "Les fotos queden.",
  "Lo que se hereda",
  "Todo lo que aprendió en una vida",
  "Un solo pago. Sin sorpresas después.",
  "También hay un libro en cada viaje.",
  "Conocer la Vitácora de viaje",
  "¿Y si el libro es el tuyo?",
  "Qué lindo eso del patio con el limonero",
  "No hace falta imaginarlo",
  "tu panel",
  "teu panell",
  "Para las vidas que merecen",
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
    process.env.PRECIO_EUR = "49";
    process.env.PRECIO_ARS = "65000";
    process.env.PRECIO_IMPRESO_EUR = "50";
    process.env.PRECIO_IMPRESO_ARS = "90000";
    process.env.PRECIO_MARCO_EUR = "19";
    delete process.env.PRECIO_MARCO_ARS;
    delete process.env.NEXT_PUBLIC_URL_FRAGMENTO_AUDIO;
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
    expect(html).toContain('src="/telefono-historia"');
    expect(html).toContain("€");
  });

  it("en /ar, de vos, en pesos", () => {
    const html = portada("ar");
    for (const frase of DE_VOS) expect(html, frase).toContain(escapar(frase));
    for (const frase of DE_TU) expect(html, frase).not.toContain(escapar(frase));
    expect(html).toContain('lang="es-AR"');
    expect(html).toContain('href="/ar/comprar"');
    expect(html).toContain('src="/ar/telefono-historia"');
    expect(html).toContain("Botón de arrepentimiento");
    expect(html).not.toContain("€");
  });

  it("en /ca, en catalán y con los enlaces en catalán", () => {
    const html = portada("ca");
    expect(html).toContain('lang="ca-ES"');
    expect(html).toContain(escapar("En cada família hi ha"));
    expect(html).toContain(escapar("Totes les vides mereixen el seu propi llibre."));
    expect(html).toContain('href="/ca/comprar"');
    expect(html).toContain("€");
  });

  it("el orden aprobado: inicio, qué es, cómo funciona, carta, escúchalo, el libro, marcos, regalo, preguntas, duda y cierre", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_DUDAS = "+34600000000";
    const html = portada("es");
    const orden = [
      "En cada familia hay",
      "Un regalo para quien cuenta y otro para toda la familia.",
      "Así se ve la página de su historia.",
      'id="como-funciona"',
      "Su familia lo lee y lo escucha",
      "Un día vas a querer preguntarle algo y ya no va a estar para contártelo.",
      "Su voz, guardada en su libro.",
      "Cada vida merece su propio libro.",
      "Un marco con su voz para cada uno.",
      "No le regales la misma camisa de todos los años.",
      'id="preguntas"',
      "¿Te queda alguna duda?",
      "Todas las vidas merecen su propio libro.",
    ].map((s) => (s.startsWith("id=") ? s : escapar(s)));
    const posiciones = orden.map((s) => html.indexOf(s));
    posiciones.forEach((p, i) => expect(p, orden[i]).toBeGreaterThan(-1));
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
    delete process.env.NEXT_PUBLIC_WHATSAPP_DUDAS;
  });

  it("un solo precio, el del impreso, sin «desde» (ni en la barra fija del móvil)", () => {
    const es = portada("es");
    expect(es).toContain(`>${escapar(eur(49 + 50))}<`);
    expect(es).not.toContain(escapar(eur(49)));
    expect(es).not.toMatch(/[Dd]esde\s*(<!-- -->)?\s*\d/);
    expect(es).toContain(escapar("pago único, sin suscripciones"));
    // El marco, literal a 19 € en España.
    expect(es).toContain(escapar("a 19 € cada uno."));
    const ar = portada("ar");
    expect(ar).toContain(escapar(ars(65000 + 90000)));
    expect(ar).not.toContain(escapar(ars(65000)));
    // Sin PRECIO_MARCO_ARS la frase del marco va sin número.
    expect(ar).toContain(escapar("cada hijo o cada nieto."));
    // Sin impreso en la región no hay ningún número ni barra fija.
    delete process.env.PRECIO_IMPRESO_EUR;
    const sinImpreso = portada("es");
    expect(sinImpreso).not.toContain(escapar(eur(49)));
    expect(sinImpreso).not.toContain("fixed inset-x-0 bottom-0");
  });

  it("los botones dicen «Iniciar Vitácora» y el cierre lleva el lema nuevo", () => {
    for (const idioma of ["es", "ar", "ca"] as const) {
      const html = portada(idioma);
      expect(html.split(escapar("Iniciar Vitácora")).length - 1, idioma).toBeGreaterThanOrEqual(3);
    }
    expect(portada("es")).toContain(escapar("Todas las vidas merecen su propio libro."));
    expect(portada("ar")).toContain(escapar("Todas las vidas merecen su propio libro."));
  });

  it("Escúchalo suena con la voz de Naza (el campo, 0:30) si no hay otro fragmento cargado", () => {
    const html = portada("es");
    expect(html).toContain('src="/rediseno/su-voz-campo.mp3"');
    expect(html).toContain(escapar("El campo"));
    expect(html).toContain("0:30");
    expect(html).toContain(escapar("«En el campo andábamos a caballo, hacíamos vida de campo"));
    expect(portada("ca")).toContain(escapar("«En el campo andábamos a caballo"));
    process.env.NEXT_PUBLIC_URL_FRAGMENTO_AUDIO = "https://ejemplo.com/fragmento.mp3";
    expect(portada("es")).toContain('src="https://ejemplo.com/fragmento.mp3"');
  });

  it("sin «padre» en la portada general (se dice «tu familiar»), ni en el título ni en la descripción", () => {
    for (const idioma of ["es", "ar"] as const) {
      const html = portada(idioma);
      expect(html, idioma).not.toMatch(/\bpadre\b|\bpapá\b/i);
      expect(html).toContain(escapar("¿Va a saber usarlo?"));
    }
    expect(portada("ca")).not.toMatch(/\bpare\b/);
    for (const m of [metaEs, metaAr, metaCa]) {
      const texto = JSON.stringify(m);
      expect(texto).not.toMatch(/padre|papá|\bpare\b/);
    }
    expect(metaEs.description).toBe(
      "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros nos encargamos de escribir su libro y que quede en tu familia para siempre.",
    );
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
      expect(html).toContain(escapar("Te devolvemos todo lo que pagaste. Si empieza y contesta menos de diez preguntas, también te devolvemos todo."));
      expect(sinPreguntas(html), idioma).not.toContain("devolvemos");
    }
    const ca = portada("ca");
    expect(ca).toContain(escapar("Et retornem tot el que vas pagar."));
    expect(sinPreguntas(ca)).not.toContain("retornem");
  });

  it("las preguntas: la primera cambiada, «No le gusta hablar de sí mismo» y las dos nuevas al final", () => {
    const html = portada("es");
    const faq = html.slice(html.indexOf('id="preguntas"'));
    const orden = [
      "¿Va a saber usarlo?",
      "¿Y si no quiere, o le da vergüenza?",
      "«No le gusta hablar de sí mismo.»",
      "¿Se puede tener el libro impreso?",
      "¿Puedo ver el libro antes de que se imprima?",
      "¿Y si quiero hacer mi propio libro?",
    ].map((s) => faq.indexOf(escapar(s)));
    orden.forEach((p) => expect(p).toBeGreaterThan(-1));
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
  });

  it("sin vídeo", () => {
    const html = portada("es");
    expect(html).not.toContain("<video");
    expect(html).not.toContain(".mp4");
  });

  it("el libro de ejemplo en 3D en el inicio: QR real y el libro de Osvaldo", () => {
    const es = portada("es");
    const inicio = es.slice(0, es.indexOf('id="hero"'));
    expect(inicio).toContain("data-libro-3d");
    expect(es).toMatch(/<path d="M\d+ \d+h1v1h-1z/);
    expect(es).toContain(escapar("Osvaldo Toroide · El libro de su vida"));
  });

  it("una sola capa (el inicio): ninguna hoja tapa texto a medio leer", () => {
    const html = portada("es");
    expect(html.match(/data-capa/g)?.length).toBe(1);
  });

  it("sin violeta: la portada no usa los colores del botón viejo", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const html = portada(idioma).toLowerCase();
      for (const color of ["#8f7be0", "#a08ce8", "#b9a8f5", "#5d3fd3"]) expect(html, `${idioma}: ${color}`).not.toContain(color);
    }
  });
});
