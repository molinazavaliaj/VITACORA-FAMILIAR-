import { describe, it, expect, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// La portada por idioma (rediseño 2026-10): / es España, de tú; /ar es
// Argentina, de vos; /ca, catalán. Cada versión es una página estática y el
// CDN manda a /ar a quien llega de fuera de Europa (next.config.ts).
//
// Desde el 05/11 la portada es la nueva, con la tienda en la segunda pantalla:
// inicio → tienda (las cajitas, cada una con sus precios) → los audios → los
// cuatro pasos → se lee y se escucha → privacidad → preguntas → duda → cierre.
// Se fueron «Qué es» con el teléfono, la carta, los marcos, el regalo y
// «Nuestras ediciones».

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

const DE_TU = ["Ideal si se la quieres regalar.", "Se lo regalas", "Si quieres, añade las tuyas", "Eliges la tapa y te lo enviamos.", "o antes si lo pides."];
const DE_VOS = ["Ideal si se la querés regalar.", "Se lo regalás", "Si querés, sumá las tuyas", "Elegís la tapa y te lo mandamos.", "o antes si lo pedís."];

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
  // Lo que se fue con la portada del 05/11.
  "Unión Europea",
  "Unió Europea",
  "no los vendemos",
  "Tú lo vas siguiendo",
  "Vos lo vas siguiendo",
  "Escuchas cada audio",
  "Escuchás cada audio",
  "Un regalo para quien cuenta",
  "Nuestras ediciones",
  "Florencia Monfort",
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
    process.env.PRECIO_VIAJE_EUR = "45";
    process.env.PRECIO_VIAJE_ARS = "60000";
    delete process.env.VITACORA_BIOGRAFO;
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
    expect(html).not.toContain("telefono-historia");
    expect(html).toContain("€");
  });

  it("en /ar, de vos, en pesos", () => {
    const html = portada("ar");
    for (const frase of DE_VOS) expect(html, frase).toContain(escapar(frase));
    for (const frase of DE_TU) expect(html, frase).not.toContain(escapar(frase));
    expect(html).toContain('lang="es-AR"');
    expect(html).toContain('href="/ar/comprar"');
    expect(html).not.toContain("telefono-historia");
    expect(html).toContain("Botón de arrepentimiento");
    expect(html).not.toContain("€");
  });

  it("en /ca, en catalán y con los enlaces en catalán", () => {
    const html = portada("ca");
    expect(html).toContain('lang="ca-ES"');
    expect(html).toContain(escapar("En cada família hi ha"));
    expect(html).toContain(escapar("Vitácora converteix una vida en un llibre per sempre."));
    expect(html).toContain('href="/ca/comprar"');
    expect(html).toContain("€");
  });

  it("el orden: inicio, tienda, audios, pasos, voz, privacidad, preguntas y cierre", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_DUDAS = "+34600000000";
    const html = portada("es");
    const orden = [
      "En cada familia hay",
      "Vitácora convierte una vida en un libro para siempre.",
      "Para un familiar",
      "Sus audios de WhatsApp se vuelven capítulos.",
      "Así se hace su libro.",
      "Se lee y también se escucha.",
      "Su historia es de tu familia.",
      'id="preguntas"',
      "¿Te queda alguna duda?",
      "Todavía estás a tiempo de preguntarle.",
    ].map((s) => (s.startsWith("id=") ? s : escapar(s)));
    const posiciones = orden.map((s) => html.indexOf(s));
    posiciones.forEach((p, i) => expect(p, orden[i]).toBeGreaterThan(-1));
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
    delete process.env.NEXT_PUBLIC_WHATSAPP_DUDAS;
  });

  it("los dos precios en las cajitas, del catálogo y sin «desde»", () => {
    const es = portada("es");
    for (const n of [49 + 50, 49, 45 + 50, 45]) expect(es, String(n)).toContain(escapar(eur(n)));
    expect(es).not.toMatch(/[Dd]esde\s*(<!-- -->)?\s*\d/);
    const ar = portada("ar");
    for (const n of [65000 + 90000, 65000, 60000 + 90000, 60000]) expect(ar, String(n)).toContain(escapar(ars(n)));
    delete process.env.PRECIO_IMPRESO_EUR;
    const sinImpreso = portada("es");
    expect(sinImpreso).toContain(escapar(eur(49)));
    expect(sinImpreso).not.toContain("fixed inset-x-0 bottom-0");
  });

  it("los botones dicen «Iniciar Vitácora»: la cabecera y el cierre", () => {
    for (const idioma of ["es", "ar", "ca"] as const) {
      const html = portada(idioma);
      expect(html.split(escapar("Iniciar Vitácora")).length - 1, idioma).toBeGreaterThanOrEqual(2);
    }
  });

  it("Se lee y se escucha muestra la onda quieta, sin audio que suene (Naza, 25/10)", () => {
    const html = portada("es");
    expect(html).not.toContain("su-voz-campo.mp3");
    expect(html).not.toContain("<audio");
    expect(html).toContain("0:30");
  });

  it("el inicio: una sola pantalla, con el libro que se cierra y sin el aire de abajo", () => {
    const es = portada("es");
    const inicio = es.slice(0, es.indexOf('id="hero"'));
    expect(inicio).toContain("data-libro-cierra");
    expect(inicio).toContain("min-h-[100svh]");
    expect(inicio).not.toContain("pb-[40svh]");
    expect(inicio).toContain('href="#tienda"');
    expect(inicio).toContain("data-capa");
    expect(es.indexOf('id="tienda"')).toBeGreaterThan(es.indexOf('id="hero"'));
  });

  it("«Se lee y se escucha» muestra la contraportada con su QR", () => {
    const es = portada("es");
    const desde = es.indexOf("acu-hoja-banda2");
    expect(desde).toBeGreaterThan(-1);
    expect(es.slice(desde)).toContain("juan-domingo-contraportada.jpg");
  });

  it("las cajitas: cinco sin Biógrafo, y Florencia solo cuando se prende", () => {
    expect(portada("es").match(/id="caja-/g)?.length).toBe(5);
    process.env.VITACORA_BIOGRAFO = "1";
    const con = portada("es");
    expect(con.match(/id="caja-/g)?.length).toBe(6);
    expect(con).toContain("Florencia Monfort");
    expect(con).toContain("<details");
  });

  it("el regalo lleva a la compra con el regalo elegido, en su idioma", () => {
    expect(portada("es")).toContain('href="/comprar?regalo=1"');
    expect(portada("ar")).toContain('href="/ar/comprar?regalo=1"');
    expect(portada("ca")).toContain('href="/ca/comprar?regalo=1"');
  });

  it("la frase de Google sigue a la vista", () => {
    const html = portada("es");
    expect(html).toContain("biografía");
    expect(html).toContain("memorias");
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
      "Tu familiar nos cuenta su vida con audios de WhatsApp. Nosotros escribimos su biografía, un libro de memorias que queda en tu familia para siempre.",
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

  it("el inicio muestra bajada, dos botones y el libro; el celular va abajo, en la escena de los audios", () => {
    const es = portada("es");
    const inicio = es.slice(0, es.indexOf('id="hero"'));
    expect(inicio).toContain(escapar("Tu familiar nos cuenta su vida con audios de WhatsApp."));
    expect(inicio).toContain('href="#tienda"');
    expect(inicio).not.toContain("acu-tel");
    const escena = es.slice(es.indexOf("acu-escena"));
    expect(escena).toContain("acu-tel");
    expect(escena).toContain(escapar("¿Qué recuerdas de la casa donde creciste?"));
    expect(portada("ar")).toContain(escapar("¿Qué recordás de la casa donde creciste?"));
  });

  it("la franja de confianza abre la tienda y no habla de la garantía", () => {
    const es = portada("es");
    const tienda = es.slice(es.indexOf('id="tienda"'));
    expect(tienda.indexOf(escapar("Pago seguro y cifrado"))).toBeLessThan(tienda.indexOf(escapar("Vitácora convierte una vida")));
    expect(sinPreguntas(es).toLowerCase()).not.toContain("garantía");
  });

  it("la tienda es una estantería con una nota colgada debajo de cada libro", () => {
    const es = portada("es");
    expect(es.match(/class="prt-ed-tapa[ "]/g)?.length).toBe(5);
    expect(es.match(/class="acu-nota /g)?.length).toBe(5);
    expect(es.match(/class="acu-estante-item[ "]/g)?.length).toBe(5);
    expect(es).not.toContain("acu-indice");
    expect(es).toContain("acu-estante--cinco");
  });

  it("la foto de ancho completo va entre las cajitas y los audios, en los tres idiomas", () => {
    for (const idioma of ["es", "ar", "ca"] as const) {
      const html = portada(idioma);
      const foto = html.indexOf("familia-leyendo-ancha");
      expect(foto, idioma).toBeGreaterThan(html.indexOf('class="acu-pie"'));
      expect(foto, idioma).toBeLessThan(html.indexOf("acu-escena"));
    }
  });

  it("sin vídeo", () => {
    const html = portada("es");
    expect(html).not.toContain("<video");
    expect(html).not.toContain(".mp4");
  });

  it("el libro en 3D en el inicio: el de Juan Domingo, con el QR de su libro real", () => {
    const es = portada("es");
    const inicio = es.slice(0, es.indexOf('id="hero"'));
    expect(inicio).toContain("data-libro-3d");
    expect(es).toMatch(/<path d="M\d+ \d+h1v1h-1z/);
    expect(es).toContain(escapar("Juan Domingo Mateos · El libro de su vida"));
    expect(es).not.toContain("Osvaldo Toroide");
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

  it("la barra fija del teléfono usa la variante clara, no la tinta oscura", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const html = portada(idioma);
      expect(html, idioma).toContain("bg-[var(--acu-blanco)]/95");
      expect(html, idioma).toContain("bg-[var(--acu-relleno)]");
      expect(html, idioma).not.toContain("bg-[#070706]/95");
    }
  });
});

describe("portada: la pregunta de los audios no promete quién escucha", () => {
  const NUEVA = {
    es: "Los audios son privados, se usan únicamente para su libro y se pueden borrar todos cuando quiera.",
    ar: "Los audios son privados, se usan únicamente para su libro y se pueden borrar todos cuando quiera.",
    ca: "Els àudios són privats, només es fan servir per al seu llibre i es poden esborrar tots quan vulgui.",
  } as const;
  for (const idioma of ["es", "ar", "ca"] as const) {
    it(`${idioma}: sin «Solo su familia» y con la frase nueva`, () => {
      const html = portada(idioma);
      expect(html).not.toContain("Solo su familia");
      expect(html).not.toContain("Només la seva família");
      expect(html).toContain(escapar(NUEVA[idioma]));
    });
  }
});
