import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Vitácora Kids en España (Naza 16/10, tanda 8): todo lo que ve un padre de
// España sale en tú (panel, «Su voz», mail de acceso, «Pedido confirmado»,
// errores de la compra, impreso) y el de Argentina sigue en vos. El idioma es
// el del chico: `kids_v2.idioma` / `ficha.idioma` (sin el campo, es-AR).

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

import { loQueCuenta, idiomaDeFila, type FilaKids } from "@/lib/kids-panel";
import { PanelKids } from "../src/app/tablero/[narradorId]/kids";
import { urlKids } from "../src/app/tablero/[narradorId]/kids-acciones";
import { PaginaVozKids } from "../src/app/voz/[token]/kids";
import { CheckoutKids } from "../src/app/comprar/kids/formulario";
import { errorCambioKids, errorDelMotor, errorLibroKids, estadoCortoKids, estadoKids, textosPanelKids } from "../src/app/_textos/panel-kids";
import { TEXTOS_VOZ_KIDS } from "../src/app/_textos/voz-kids";
import { CHECKOUT_KIDS, KIDS_IMPRESO_TEXTOS, KIDS_MISMO_NUMERO_TEXTOS } from "../src/app/_textos/checkout-kids";
import { momentosKids } from "../src/app/_textos/pedido-confirmado";
import { armarMailAcceso } from "../src/lib/mail";
import { validarFichaKids, type FichaKids } from "../src/lib/kids-compra";
import { FICHA, fila, resp } from "./kids-datos";

const esc = (s: string) => renderToStaticMarkup(<>{s}</>);
const N = { id: "n1", nombre: "Nico Rivas", como_le_dicen: "Nico", estado: "activo" };
const FICHA_ES: FichaKids = { ...FICHA, apodo: "Nico", quienRegala: "tu madre", hora: "20:00", zona: "Europe/Madrid", idioma: "es-ES" };

function pantalla(f: FilaKids) {
  return renderToStaticMarkup(<PanelKids n={N} fila={f} capitulos={loQueCuenta([resp("K1"), resp("K12-R1")], [], f.fichaMotor ?? f.ficha, [])} />);
}

/** El texto visible, sin etiquetas. */
const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("el idioma del chico", () => {
  it("sale de kids_v2.idioma o de la ficha; sin ninguno, es-AR", () => {
    expect(idiomaDeFila(fila())).toBe("es-AR");
    expect(idiomaDeFila(fila({ ficha: FICHA_ES }))).toBe("es-ES");
    expect(idiomaDeFila(fila({ idioma: "es-ES" }))).toBe("es-ES");
    expect(idiomaDeFila(fila({ idioma: "fr" }))).toBe("es-AR");
  });

  it("validarFichaKids acepta idioma como el motor: es-AR, es-ES, ca o sin el campo", () => {
    expect(validarFichaKids({ ...FICHA, idioma: "es-ES" }).idioma).toBe("es-ES");
    expect(validarFichaKids({ ...FICHA, idioma: "es-AR" }).idioma).toBe("es-AR");
    expect(validarFichaKids({ ...FICHA, idioma: "ca" }).idioma).toBe("ca");
    expect(validarFichaKids({ ...FICHA, quienRegala: "La teva mare" }).quienRegala).toBe("la teva mare");
    expect(validarFichaKids(FICHA).idioma).toBeUndefined();
    expect(() => validarFichaKids({ ...FICHA, idioma: "fr" as never })).toThrow(/idioma/);
  });
});

describe("el panel de Kids en España, de tú", () => {
  it("la guía, los ejemplos (con «manzana»), la casilla, la hora y los temas de la compra de España", () => {
    const html = pantalla(fila({ ficha: FICHA_ES, fichaMotor: FICHA_ES, avance: { capitulo: 2, preguntasPadreAbiertas: true } }));
    const X = textosPanelKids("es-ES");
    expect(html).toContain(esc("Puedes añadir hasta tres preguntas tuyas. Le llegan a Nico cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de ti, salvo que prefieras que le llegue como una pregunta más."));
    expect(html).toContain(esc("Cuéntame el día que aprendiste a montar en bici sin ruedines."));
    expect(html).toContain(esc("Cuéntame el día que se te cayó el primer diente, que fue comiendo una manzana."));
    expect(html).toContain(esc("Cuéntame la primera noche que dormiste en casa de un amigo y nos llamaste a las dos de la mañana."));
    expect(html).toContain(esc("Léelo todo, pero no le digas nada hasta el libro."));
    expect(html).toContain(esc("Mejor a la vuelta del cole, o cuando podáis sentaros juntos."));
    expect(html).toContain(esc("Su madre"));
    expect(html).toContain(esc("Su nueva familia (la pareja de su madre o de su padre, sus hijos)"));
    expect(html).toContain(esc(X.panel.preguntas.pista));
    expect(html).toContain('value="tu madre"');
    // Nada de vos ni de lo de Argentina en lo que le habla al padre. (Las preguntas
    // que recibió el chico salen del banco de la web, kids-banco.json, en vos.)
    const v = visible(html);
    for (const p of ["Podés", "Contame el día", "choclo", "mazorca", "Leé todo", "Su mamá", "ensamblada", "reconstituida", "rueditas", "en lo de"]) expect(v, p).not.toContain(esc(p));
  });

  it("los estados en tú, con «Vale, vamos» y «a la hora que has elegido»", () => {
    const base = { estado: "activo", apodo: "Nico", capitulo: 0, titulo: null, termino: false, idioma: "es-ES" as const };
    expect(estadoKids({ ...base, canal: "A", arranco: false })).toBe("Todavía no ha empezado. Le vamos a escribir a Nico a la hora que has elegido.");
    expect(estadoKids({ ...base, canal: "A", arranco: true })).toBe("Ya le hemos escrito a Nico. La primera pregunta sale cuando pulse «Vale, vamos».");
    expect(estadoKids({ ...base, canal: "B", arranco: true })).toBe("Ya te hemos escrito. La primera pregunta sale cuando pulséis el botón, juntos.");
    expect(estadoKids({ ...base, canal: "B", arranco: true, termino: true })).toBe("Nico ha terminado de contar. Ahora empezamos a preparar el libro.");
    expect(estadoCortoKids("pendiente", "es-ES")).toBe("todavía no ha empezado");
    expect(textosPanelKids("es-ES").panel.inicio.ver).toBe("Ver todo lo que cuenta");
    expect(textosPanelKids("es-ES").panel.toco("Paso")).toBe("Pulsó «Paso»");
  });

  it("los errores en tú (panel, motor y libro)", () => {
    expect(errorCambioKids("hora", "es-ES")).toBe("Elige una hora de la lista.");
    expect(errorCambioKids("vacio", "es-ES")).toBe("Rellena cómo dice y cómo es.");
    expect(errorCambioKids("base", "es-ES")).toBe("No hemos podido guardar. Prueba de nuevo.");
    expect(errorDelMotor("otro", "es-ES")).toBe("No hemos podido aplicar tu último cambio. Prueba de nuevo, y si vuelve a pasar, escríbenos.");
    expect(errorLibroKids("confirmar", "es-ES")).toBe("Falta confirmar que quieres aprobarlo.");
    expect(urlKids("panel", "n1", "es-ES")).toBe("/api/kids/panel?narrador=n1&idioma=es-ES");
  });
});

describe("el panel de Kids en Argentina sigue en vos", () => {
  it("sin idioma (o es-AR), la guía y los estados de siempre", () => {
    const html = pantalla(fila({ fichaMotor: FICHA, avance: { capitulo: 2, preguntasPadreAbiertas: true } }));
    expect(html).toContain(esc("Contame el día que se te cayó el primer diente, que fue comiendo un choclo."));
    expect(html).toContain(esc("Leé todo, pero no le digas nada hasta el libro."));
    expect(html).toContain(esc("Su mamá"));
    expect(visible(html)).not.toContain(esc("Puedes"));
    const base = { estado: "activo", apodo: "Tomi", capitulo: 0, titulo: null, termino: false };
    expect(estadoKids({ ...base, canal: "A", arranco: true })).toBe("Ya le escribimos a Tomi. La primera pregunta sale cuando toque «Dale, vamos».");
    expect(estadoKids({ ...base, canal: "A", arranco: false, idioma: "es-AR" })).toBe("Todavía no empezó. Le vamos a escribir a Tomi a la hora que elegiste.");
    expect(errorCambioKids("hora")).toBe("Elegí una hora de la lista.");
    expect(textosPanelKids("es-AR").panel.inicio.ver).toBe("Mirá todo lo que cuenta");
  });
});

describe("«Su voz» de Kids", () => {
  it("en España, de tú y con «Escúchala»", () => {
    const html = renderToStaticMarkup(<PaginaVozKids token="t" apodo="Nico" idioma="es-ES" publicables={[{ capitulo: { numero: 1, capitulo: "Quién soy", candidatas: [] }, frases: [{ id: "R1", texto: "Juego al fútbol.", elegida: true, estado: "cortada", audio_path: "n1/a.ogg", segundos: 3 }] }] as never} libroListo={false} />);
    expect(html).toContain(esc(TEXTOS_VOZ_KIDS["es-ES"].bajada));
    expect(html).toContain(esc("Aquí están sus respuestas, tal como las dijo. Toca una para escucharla."));
    expect(html).toContain(esc("Escúchala"));
    expect(html).toContain('href="/kids"');
    expect(html).not.toContain(esc("Escuchala"));
  });

  it("en Argentina, de vos", () => {
    const html = renderToStaticMarkup(<PaginaVozKids token="t" apodo="Tomi" publicables={[]} libroListo={false} />);
    expect(TEXTOS_VOZ_KIDS["es-AR"].bajada).toBe("Acá están sus respuestas, tal como las dijo. Tocá una para escucharla.");
    expect(html).toContain(esc("Sus respuestas en audio todavía se están preparando."));
    expect(html).toContain('href="/ar/kids"');
  });
});

describe("los mails y «Pedido confirmado» de Kids", () => {
  it("el mail de acceso en España va de tú, con lo de la casa en `es`", () => {
    const a = armarMailAcceso({ comoLeDicen: "Nico", region: "ES", kids: { canal: "A", idioma: "es-ES" } });
    expect(a.asunto).toBe("Ya está en marcha el libro de Nico");
    expect(a.texto).toContain("Le vamos a escribir a Nico a la hora que has elegido. A ti te avisamos por WhatsApp.");
    expect(a.texto).toContain("Ahí también puedes escribir hasta tres preguntas tuyas para el libro.");
    const b = armarMailAcceso({ comoLeDicen: "Nico", region: "ES", kids: { canal: "B", idioma: "es-ES" } });
    expect(b.texto).toContain("La primera pregunta sale cuando estéis juntos.");
    expect(b.texto).not.toMatch(/podés|vos\b|estén juntos/);
  });

  it("el mail de acceso en Argentina sigue en vos", () => {
    const a = armarMailAcceso({ comoLeDicen: "Tomi", region: "AR", kids: { canal: "A", idioma: "es-AR" } });
    expect(a.asunto).toBe("Listo, ya está en marcha el libro de Tomi");
    expect(a.texto).toContain("A vos te avisamos por WhatsApp.");
    // Sin idioma, el de siempre.
    expect(armarMailAcceso({ comoLeDicen: "Tomi", region: "AR", kids: { canal: "B" } }).texto).toContain("cuando estén juntos");
  });

  it("«Pedido confirmado» de Kids en tú y en vos", () => {
    const [a] = momentosKids("Nico", "A", false, "es-ES");
    expect(a.que).toBe("A la hora que has elegido le llega a Nico un mensaje nuestro por WhatsApp. Avísale que le va a escribir «Vitácora».");
    const [b] = momentosKids("Nico", "B", false, "es-ES");
    expect(b.que).toBe("Te llega un mensaje nuestro a tu WhatsApp. La primera pregunta sale cuando pulséis el botón, juntos.");
    const [c] = momentosKids("Tomi", "A");
    expect(c.que).toBe("A la hora que elegiste le llega a Tomi un mensaje nuestro por WhatsApp. Avisale que le va a escribir «Vitácora».");
  });
});

describe("la compra de Kids en España", () => {
  it("el aviso del mismo número y el impreso, en tú", () => {
    expect(KIDS_MISMO_NUMERO_TEXTOS["es-ES"]).toBe("El WhatsApp de quien lo cuenta tiene que ser distinto del tuyo. Si las preguntas te llegan a ti, elige «Lo hago yo».");
    expect(KIDS_IMPRESO_TEXTOS["es-ES"].impresoDetalle).toContain("te mandamos el seguimiento del envío.");
    expect(KIDS_IMPRESO_TEXTOS["es-AR"].impresoDetalle).toMatch(/te mandamos el seguimiento\.$/);
    expect(CHECKOUT_KIDS.es.canalAutoriza).toBe("Al elegir esto, eres tú, como adulto responsable, quien autoriza que le escribamos a ese número.");
    expect(CHECKOUT_KIDS.es.temas.ensamblada).toBe("Su nueva familia (la pareja de su madre o de su padre, sus hijos)");
    expect(CHECKOUT_KIDS.es.quienes).toMatchObject({ mama: "Tu madre", papa: "Tu padre", papas: "Tus padres" });
  });

  it("la hora arranca a las 20:00 en España y a las 18:00 en Argentina", () => {
    const es = renderToStaticMarkup(<CheckoutKids idioma="es" precio={59} moneda="EUR" escribir={{ href: "mailto:x", externo: false }} pasoInicial={2} />);
    expect(es).toMatch(/<option value="20:00" selected="">/);
    expect(es).toContain(esc("Mejor a la vuelta del cole, o cuando podáis sentaros juntos."));
    const ar = renderToStaticMarkup(<CheckoutKids idioma="ar" precio={90000} moneda="ARS" escribir={{ href: "mailto:x", externo: false }} pasoInicial={2} />);
    expect(ar).toMatch(/<option value="18:00" selected="">/);
  });
});
