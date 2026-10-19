import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { IDIOMAS_WEB, type IdiomaWeb } from "../src/lib/idioma-web";
import { PaginaLegal, mailtoDesistimiento, metadataLegal } from "../src/app/legal/pagina";
import { DOCUMENTOS_LEGALES, GARANTIAS, TEXTOS_LEGAL, type DocumentoLegal } from "../src/app/_textos/legal";
import { CHECKOUT } from "../src/app/_textos/checkout";
import { CHECKOUT_VIAJE } from "../src/app/_textos/checkout-viaje";
import { TEXTOS_PORTADA } from "../src/app/_textos/portada";
import Terminos from "../src/app/legal/terminos/page";
import ArrepentimientoAr from "../src/app/ar/legal/arrepentimiento/page";
import PrivacidadCa from "../src/app/ca/legal/privacidad/page";

// Las páginas legales del rediseño (fase 5): diseño nuevo, tres idiomas, la
// garantía de cada línea (DECISIONES D1) igual que en el checkout y la FAQ, y
// nada que el producto ya no hace (D4, C4). Los textos los redacta el abogado
// (B13): estos tests fijan lo que NO puede pasar mientras tanto.

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const html = (idioma: IdiomaWeb, documento: DocumentoLegal) =>
  renderToStaticMarkup(<PaginaLegal idioma={idioma} documento={documento} />);
/** El texto visible, sin etiquetas, para buscar frases. */
const texto = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");

/** La cabecera pública lleva la solapa «Kids» desde el 15/10: el resto de la página no la nombra. */
const sinSolapas = (h: string) => h.replace(/<nav[^>]*m-solapas[\s\S]*?<\/nav>/g, "");

const TODAS = IDIOMAS_WEB.flatMap((idioma) => DOCUMENTOS_LEGALES.map((doc) => [idioma, doc] as const));

describe("las páginas legales", () => {
  it.each(TODAS)("%s / %s: título, «En corto», índice, secciones, cabecera y pie", (idioma, doc) => {
    const h = html(idioma, doc);
    const d = TEXTOS_LEGAL[idioma][doc];
    expect(h).toContain(`<h1 class="dir-titular lgl-titulo">${escapar(d.titulo)}</h1>`);
    expect(h).toContain(escapar(TEXTOS_LEGAL[idioma].enCorto));
    expect(d.enCorto.length).toBeGreaterThan(0);
    for (const s of d.secciones) {
      expect(h).toContain(`id="${s.id}"`);
      expect(h).toContain(`href="#${s.id}"`);
    }
    expect(h).toContain("<header"); // la cabecera pública
    expect(h).toContain("<footer"); // el pie público
    expect(h).toContain(`lang="${idioma === "ca" ? "ca-ES" : idioma === "ar" ? "es-AR" : "es-ES"}"`);
  });

  it("las solapas y los enlaces internos se quedan en el idioma de la página", () => {
    const ca = html("ca", "terminos");
    expect(ca).toContain('href="/ca/legal/privacidad"');
    expect(ca).toContain('href="/ca/legal/arrepentimiento"');
    expect(ca).toContain('aria-current="page"');
    const ar = html("ar", "arrepentimiento");
    expect(ar).toContain('href="/ar/legal/terminos#arrepentimiento"');
    // En la hoja (no en la cabecera, que ofrece el cambio de idioma) todo queda en castellano.
    const hoja = html("es", "terminos").split("<main")[1].split("</main>")[0];
    expect(hoja).toContain('href="/legal/privacidad"');
    expect(hoja).not.toContain('href="/ca/legal');
    expect(hoja).not.toContain('href="/ar/legal');
  });

  it("los archivos de ruta renderizan su idioma y su documento", () => {
    expect(renderToStaticMarkup(<Terminos />)).toContain(escapar("Términos del servicio"));
    expect(renderToStaticMarkup(<ArrepentimientoAr />)).toContain("Botón de arrepentimiento");
    expect(renderToStaticMarkup(<PrivacidadCa />)).toContain("Privacitat");
  });

  it("metadata con hreflang de las tres versiones", () => {
    const m = metadataLegal("ca", "privacidad");
    expect(m.title).toBe("Privacitat");
    expect(m.alternates?.canonical).toBe("/ca/legal/privacidad");
    expect(m.alternates?.languages).toMatchObject({ "es-ES": "/legal/privacidad", "es-AR": "/ar/legal/privacidad" });
  });

  it("Argentina: «Botón de arrepentimiento» (Res. 424/2020); España: «Desistimiento»", () => {
    expect(TEXTOS_LEGAL.ar.arrepentimiento.titulo).toBe("Botón de arrepentimiento");
    expect(TEXTOS_LEGAL.es.arrepentimiento.titulo).toBe("Desistimiento");
    expect(TEXTOS_LEGAL.ca.arrepentimiento.titulo).toBe("Desistiment");
    expect(html("ar", "arrepentimiento")).toContain("Quiero arrepentirme de mi compra");
    expect(html("es", "arrepentimiento")).toContain("Quiero desistir de mi compra");
  });

  it("el botón abre un correo a hola@ con el asunto y el cuerpo prellenados", () => {
    const ar = mailtoDesistimiento("ar");
    expect(ar.startsWith("mailto:hola@vitacorafamiliar.com?subject=Arrepentimiento%20de%20compra&body=")).toBe(true);
    expect(mailtoDesistimiento("es")).toContain("subject=Desistimiento%20de%20compra");
    expect(html("es", "arrepentimiento")).toContain('href="mailto:hola@vitacorafamiliar.com?subject=Desistimiento');
  });

  it("los datos que faltan de los titulares se ven marcados", () => {
    expect(html("es", "terminos")).toContain("[a completar]");
    expect(html("ca", "terminos")).toContain("[per completar]");
    expect(html("es", "terminos")).not.toContain("Immaculada");
    expect(html("es", "terminos")).toContain("Joaquín Molina");
  });
});

// La revisión del 17/10 (docs/legal/revision-textos-2026-10-17.md): lo que ya
// quedó corregido no puede volver. Mira el texto visible de las tres versiones.
describe("revisión legal del 17/10: lo corregido no vuelve", () => {
  const visible = (idioma: IdiomaWeb, doc: DocumentoLegal) => texto(sinSolapas(html(idioma, doc)));

  it.each(TODAS)("%s / %s: ni voz sintética (D4), ni dos titulares, ni «nunca se la mostramos» sin el código (B3)", (idioma, doc) => {
    const t = visible(idioma, doc);
    expect(t).not.toMatch(/voz sint[ée]tica|veu sint[èe]tica/i);
    expect(t).not.toMatch(/dos personas|dues persones|una de las dos|una de les dues/i);
    expect(t).not.toMatch(/se la mostramos a nadie fuera de tu familia\.|l'ensenyem a ningú de fora de la teva família\./);
    expect(t).not.toMatch(/hasta el importe que pagaste|fins a l'import que vas pagar/);
    expect(t).not.toMatch(/parte proporcional|part proporcional/);
  });

  it.each(IDIOMAS_WEB)("%s: el plazo de Argentina corre desde que se recibe el libro (A2), en términos y en el botón", (idioma) => {
    const recibe = { es: "desde que recibes el libro", ar: "desde que recibís el libro", ca: "des que reps el llibre" }[idioma];
    for (const doc of ["terminos", "arrepentimiento"] as const) {
      const t = visible(idioma, doc);
      expect(t).toContain(recibe);
      expect(t).not.toMatch(/10 d[ií]as corridos desde la compra|10 dies seguits des de la compra/);
    }
  });

  it.each(IDIOMAS_WEB)("%s: la voz se dice como es (D4) y el código de la contratapa es la excepción (B3)", (idioma) => {
    const t = visible(idioma, "terminos");
    expect(t).toMatch(/no se clona ni se imita su voz|no es clona ni s'imita la seva veu/);
    expect(t).toMatch(/el código de la contratapa abre el libro completo|el codi de la contracoberta obre el llibre complet/);
  });

  it.each(IDIOMAS_WEB)("%s: privacidad pone plazo a los audios originales (B4)", (idioma) => {
    expect(visible(idioma, "privacidad")).toMatch(/3 meses|3 mesos/);
  });

  it.each(IDIOMAS_WEB)("%s: el desistimiento trae el formulario del Anexo B, con el titular y el correo", (idioma) => {
    const h = html(idioma, "arrepentimiento");
    const formulario = h.split('class="lgl-formulario"')[1]?.split("</div>")[0] ?? "";
    expect(formulario).toContain("Joaquín Molina");
    expect(formulario).toContain("hola@vitacorafamiliar.com");
    expect(formulario).toMatch(/Anexo B|Táchese|Ratlleu/);
    expect(TEXTOS_LEGAL[idioma].arrepentimiento.secciones.some((s) => s.id === "formulario")).toBe(true);
  });

  it.each(IDIOMAS_WEB)("%s: factura e IVA incluido (C)", (idioma) => {
    const t = visible(idioma, "terminos");
    expect(t).toMatch(/factura electr[óò]nica/);
    expect(t).toMatch(/IVA incluido|IVA inclòs/);
  });
});

describe("la garantía de cada línea (DECISIONES D1) — PENDIENTE DE REVISIÓN DEL ABOGADO", () => {
  it.each(IDIOMAS_WEB)("%s: está en términos y en desistimiento con el mismo texto", (idioma) => {
    const g = GARANTIAS[idioma];
    for (const doc of ["terminos", "arrepentimiento"] as const) {
      const t = texto(html(idioma, doc));
      for (const frase of [g.familiar, g.viaje, g.propia, g.regla]) expect(t).toContain(frase);
      const seccion = TEXTOS_LEGAL[idioma][doc].secciones.find((s) => s.id === "garantia");
      expect(seccion?.pendienteAbogado).toBe(true);
    }
    // En privacidad no va: no es una página de devoluciones.
    expect(texto(html(idioma, "privacidad"))).not.toContain(g.viaje);
  });

  it.each(IDIOMAS_WEB)("%s: dice exactamente lo mismo que la letra pequeña del checkout", (idioma) => {
    expect(GARANTIAS[idioma].familiar).toBe(CHECKOUT[idioma].garantiaFamiliar);
    expect(GARANTIAS[idioma].propia).toBe(CHECKOUT[idioma].garantiaPropia);
    expect(GARANTIAS[idioma].viaje).toBe(CHECKOUT_VIAJE[idioma].garantia);
  });

  // ca: la FAQ dice «et tornem els diners» y el checkout «et retornem»
  // (reportado en docs/rediseno-2026-10/fase-5/para-el-abogado.md); hasta que
  // Naza elija una, este test mira solo es y ar.
  it.each(["es", "ar"] as const)("%s: y lo mismo que la FAQ «¿Y si no quiere hacerlo?»", (idioma) => {
    const faq = TEXTOS_PORTADA[idioma].faq.preguntas.find((p) => p.pregunta === "¿Y si no quiere hacerlo?");
    expect(faq?.respuesta).toBe(GARANTIAS[idioma].familiar);
  });
});

describe("nada que el producto ya no hace (D4, C4)", () => {
  const PROHIBIDO: [RegExp, string][] = [
    [/una pregunta (por|cada|al) d[ií]a|una pregunta per dia/i, "una pregunta por día"],
    [/(por|al|cada) d[ií]a\b|per dia\b|cada dia\b/i, "algo por día"],
    [/anticipo|avan[çc]ament|bestreta/i, "anticipo"],
    [/audiolibro|audiollibre/i, "audiolibro"],
    [/\b9 d[ií]as\b|\b9 dies\b|nueve d[ií]as/i, "9 días"],
    [/mientras se escribe|mentre s'escriu|escribi[ée]ndose/i, "lo lees mientras se escribe"],
    [/\bKids\b/i, "Kids"],
    [/cup[oó]n|VITACORA10|rasca/i, "cupón"],
    [/se suman a cualquiera|s'afegeixen a qualsevol/i, "marco sin impreso"],
  ];
  // «30 días» se prohibió por el ritmo viejo («la entrevista dura 30 días»), que
  // es hermano de «una pregunta por día» de arriba. No por los plazos de datos:
  // desde el 18/10 la privacidad dice que las copias de seguridad se borran 30
  // días después de que borramos el original (texto aprobado por Naza, y es
  // cierto: PR #73 y #78). Eso sí se publica, así que la regla mira el texto sin
  // esas frases — y sigue cazando cualquier «30 días» en otro lado.
  it.each(TODAS)("%s / %s", (idioma, doc) => {
    const t = texto(sinSolapas(html(idioma, doc)));
    for (const [patron, que] of PROHIBIDO) expect(t, que).not.toMatch(patron);
  });

  // «30 días» se prohibía por el ritmo viejo («la entrevista dura 30 días»),
  // hermano de «una pregunta por día» de arriba. Desde el 18/10 la privacidad lo
  // usa para otra cosa que sí es cierta: las copias de seguridad se borran 30
  // días después del original (PR #73 y #78, texto aprobado por Naza). Así que en
  // vez de prohibir la cifra, se fija dónde puede aparecer.
  it.each(TODAS)("%s / %s: «30 días» solo habla de las copias", (idioma, doc) => {
    const t = texto(sinSolapas(html(idioma, doc)));
    for (const frase of t.split(/(?<=\.)\s+/)) {
      if (!/\b30 d[ií]as\b|\b30 dies\b|treinta d[ií]as|trenta dies/i.test(frase)) continue;
      expect(frase, "«30 días» fuera de las copias de seguridad").toMatch(/c[oò]pi|borr|esborr/i);
    }
  });

  it("y las copias de seguridad están contadas en los tres idiomas", () => {
    for (const idioma of ["es", "ar", "ca"] as const) {
      expect(texto(sinSolapas(html(idioma, "privacidad")))).toMatch(/c[oò]pi[ae]s? de segur(idad|etat)/i);
    }
  });
});

describe("el trato de cada versión", () => {
  const todo = (idioma: IdiomaWeb) => DOCUMENTOS_LEGALES.map((d) => texto(html(idioma, d))).join(" ");
  it("España, de tú: sin voseo", () => {
    expect(todo("es")).not.toMatch(/\b(pod[ée]s|quer[ée]s|ten[ée]s|ped[ií]s|comprás|eleg[íi]s|escrib[ií] a|avisanos|cont[áa]selo|aprob[áa]s)\b/);
  });
  it("Argentina, de vos: sin tuteo", () => {
    expect(todo("ar")).not.toMatch(/\b(puedes|quieres|tienes|pides|compras desde|eliges|escribe a|avísanos|escríbenos|cuéntaselo|apruebas)\b/);
  });
});
