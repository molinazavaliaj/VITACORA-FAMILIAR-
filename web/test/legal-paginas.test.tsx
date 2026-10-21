import { afterEach, describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { IDIOMAS_WEB, type IdiomaWeb } from "../src/lib/idioma-web";
import { PaginaLegal, mailtoDesistimiento, metadataLegal } from "../src/app/legal/pagina";
import { DOCUMENTOS_LEGALES, GARANTIA, TEXTOS_LEGAL, type DocumentoLegal } from "../src/app/_textos/legal";
import { hayHojaReclamaciones } from "../src/app/legal/pagina";
import Terminos from "../src/app/legal/terminos/page";
import ArrepentimientoAr from "../src/app/ar/legal/arrepentimiento/page";
import PrivacidadCa from "../src/app/ca/legal/privacidad/page";
import Reclamaciones from "../src/app/legal/reclamaciones/page";
import ReclamacionesAr from "../src/app/ar/legal/reclamaciones/page";
import ReclamacionesCa from "../src/app/ca/legal/reclamaciones/page";

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
    // Reclamaciones (tanda 5) no tiene «En corto» ni índice: es una sola sección sin título.
    if (doc === "reclamaciones") {
      expect(d.enCorto).toEqual([]);
      expect(h).not.toContain('id="en-corto"');
      expect(h).not.toContain("lgl-indice");
    } else {
      expect(h).toContain(escapar(TEXTOS_LEGAL[idioma].enCorto));
      expect(d.enCorto.length).toBeGreaterThan(0);
    }
    for (const s of d.secciones) {
      expect(h).toContain(`id="${s.id}"`);
      if (s.titulo) expect(h).toContain(`href="#${s.id}"`);
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
    expect(renderToStaticMarkup(<Reclamaciones />)).toContain(escapar("Reclamaciones y atención"));
    expect(renderToStaticMarkup(<ReclamacionesAr />)).toContain(escapar("Reclamaciones y atención"));
    expect(renderToStaticMarkup(<ReclamacionesCa />)).toContain(escapar("Reclamacions i atenció"));
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
    expect(t).toMatch(/el código de la (?:contratapa|contraportada) abre el libro completo|el codi de la contracoberta obre el llibre complet/);
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

describe("la garantía de cada libro (tanda 4, 19/10) — PENDIENTE DE REVISIÓN DEL ABOGADO", () => {
  const frases = (idioma: IdiomaWeb) => {
    const g = GARANTIA[idioma];
    return [g.titulo, g.ley.subtitulo, g.ley.derecho, g.nuestra.subtitulo, g.cierre.subtitulo, g.cierre.regla, g.cierre.diez]
      .concat([g.ley.plazo, g.nuestra.familiar, g.nuestra.viaje, g.nuestra.propia].map((f) => f.replace(/\*\*/g, "")));
  };

  it.each(IDIOMAS_WEB)("%s: está en términos y en desistimiento con el mismo texto", (idioma) => {
    for (const doc of ["terminos", "arrepentimiento"] as const) {
      const t = texto(html(idioma, doc));
      for (const frase of frases(idioma)) expect(t).toContain(frase);
      const seccion = TEXTOS_LEGAL[idioma][doc].secciones.find((s) => s.id === "garantia");
      expect(seccion?.pendienteAbogado).toBe(true);
    }
    const bloques = (doc: "terminos" | "arrepentimiento") =>
      TEXTOS_LEGAL[idioma][doc].secciones.find((s) => s.id === "garantia")?.bloques;
    expect(bloques("terminos")).toEqual(bloques("arrepentimiento"));
    // En términos es la sección 7; en desistimiento va al final.
    expect(TEXTOS_LEGAL[idioma].terminos.secciones.find((s) => s.id === "garantia")?.titulo).toBe(`7. ${GARANTIA[idioma].titulo}`);
    expect(TEXTOS_LEGAL[idioma].arrepentimiento.secciones.at(-1)?.id).toBe("garantia");
    // En privacidad no va: no es una página de devoluciones.
    expect(texto(html(idioma, "privacidad"))).not.toContain(GARANTIA[idioma].cierre.regla);
  });

  it("los subtítulos se pintan como subtítulos", () => {
    const h = html("es", "terminos");
    for (const s of ["Lo que te da la ley", "Lo que añadimos nosotros", "Cuándo cerramos el libro"]) {
      expect(h).toContain(`<h3 class="lgl-subtitulo">${escapar(s)}</h3>`);
    }
  });

  it("España, 14 días y desistir; Argentina, 10 días, «arrepentirte» y el botón", () => {
    expect(GARANTIA.es.ley.plazo).toContain("14 días naturales desde la compra para desistir");
    expect(GARANTIA.ar.ley.plazo).toContain("10 días corridos");
    expect(GARANTIA.ar.ley.plazo).toContain("para arrepentirte");
    expect(GARANTIA.ar.cierre.diez).toContain("dentro de los 10 días y te arrepentís");
    expect(html("ar", "terminos")).toContain('href="/ar/legal/arrepentimiento"');
    expect(html("es", "terminos")).toContain('href="/legal/arrepentimiento#formulario"');
  });

  it.each(IDIOMAS_WEB)("%s: la vieja «Si no hay libro» ya no está y nada dice «sin devolución»", (idioma) => {
    expect(TEXTOS_LEGAL[idioma].terminos.secciones.some((s) => s.id === "sin-libro")).toBe(false);
    for (const doc of ["terminos", "arrepentimiento"] as const) {
      const t = texto(html(idioma, doc));
      expect(t).not.toMatch(/sin devoluci[oó]n|sense devoluci[oó]/i);
      expect(t).not.toMatch(/108\.3/);
      // Naza 19/10: manda la regla de las diez preguntas, no «mientras dura la entrevista te devolvemos todo».
      expect(t).not.toMatch(/mientras dura,? (la entrevista,? )?te devolvemos todo|mentre dura,? (l'entrevista,? )?t'ho retornem tot/i);
      expect(t).not.toMatch(/Mientras dura la entrevista|Mentre dura l'entrevista/);
      expect(t).not.toMatch(/\(ver la sección 8|\(vegeu la secció 8/);
    }
  });
});

describe("reclamaciones y atención (tanda 5, 19/10)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("en /ar no salen la hoja oficial (36) ni la Junta Arbitral (37), que son de España", () => {
    const t = texto(html("ar", "reclamaciones").split("<main")[1].split("</main>")[0]);
    expect(t).not.toMatch(/hoja oficial|Junta Arbitral/);
    expect(t).toContain("Te respondemos en un plazo máximo de 30 días.");
    expect(t).toContain("en menos de 24 horas te mandamos un número para seguirlo");
  });

  it.each(["es", "ca"] as const)("%s: correo de soporte, horario, 30 días y la Junta Arbitral", (idioma) => {
    const t = texto(html(idioma, "reclamaciones"));
    expect(t).toContain("soporte@vitacorafamiliar.com");
    expect(t).toMatch(/de 10 a 18, hora d(e España|'Espanya)/);
    expect(t).toMatch(/30 d[ií](as|es)/);
    expect(t).toMatch(/Junta Arbitral de Consum/);
  });

  it("sin WhatsApp de dudas, solo el correo", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_DUDAS", "");
    const t = texto(html("es", "reclamaciones"));
    const hoja = texto(html("es", "reclamaciones").split("<main")[1].split("</main>")[0]);
    expect(hoja).not.toContain("WhatsApp");
    expect(t).toContain("Por correo a soporte@vitacorafamiliar.com , de lunes a viernes de 10 a 18, hora de España.");
  });

  it("con WhatsApp de dudas, el número con su enlace", () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_DUDAS", "+34611222333");
    const h = html("es", "reclamaciones");
    expect(h).toContain('href="https://wa.me/34611222333"');
    expect(texto(h)).toContain("Por WhatsApp al +34611222333 o por correo a soporte@vitacorafamiliar.com");
  });

  it("la hoja oficial: sin el PDF, se pide por correo", () => {
    expect(hayHojaReclamaciones()).toBe(false); // PENDIENTES: conseguir el PDF oficial
    expect(texto(html("es", "reclamaciones"))).toContain("Pídenos la hoja oficial de reclamaciones por correo y te la mandamos.");
    expect(html("es", "reclamaciones")).not.toContain("hoja-reclamaciones.pdf");
  });

  it("el número de seguimiento en 24 horas, solo en Argentina", () => {
    expect(texto(html("ar", "reclamaciones"))).toContain("en menos de 24 horas te mandamos un número para seguirlo");
    expect(texto(html("es", "reclamaciones"))).not.toContain("número para seguirlo");
    expect(texto(html("ca", "reclamaciones"))).not.toContain("24 hores");
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
      // También el plazo de respuesta de las reclamaciones (tanda 5, 19/10).
      expect(frase, "«30 días» fuera de las copias de seguridad").toMatch(/c[oò]pi|borr|esborr|respond|respon/i);
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
