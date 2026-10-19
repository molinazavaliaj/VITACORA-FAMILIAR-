import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Vitácora Kids en catalán (Naza 16/10, tanda 10): desde /ca se vende Kids
// (región ES, idioma del chico «ca») y todo lo que ve el padre sale en catalán
// (panel, «La seva veu», mail de acceso, «Pedido confirmado», errores, impreso).
// Lo de Argentina y España no cambia (kids-espana.test.tsx, kids.test.tsx).

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

import { loQueCuenta, type FilaKids } from "@/lib/kids-panel";
import { PanelKids } from "../src/app/tablero/[narradorId]/kids";
import { urlKids } from "../src/app/tablero/[narradorId]/kids-acciones";
import { PaginaVozKids } from "../src/app/voz/[token]/kids";
import { CheckoutKids } from "../src/app/comprar/kids/formulario";
import { errorCambioKids, errorDelMotor, errorLibroKids, estadoCortoKids, estadoKids, textosPanelKids } from "../src/app/_textos/panel-kids";
import { TEXTOS_VOZ_KIDS } from "../src/app/_textos/voz-kids";
import { CHECKOUT_KIDS, KIDS_IMPRESO_TEXTOS, KIDS_MISMO_NUMERO_TEXTOS } from "../src/app/_textos/checkout-kids";
import { momentosKids } from "../src/app/_textos/pedido-confirmado";
import { armarMailAcceso } from "../src/lib/mail";
import { idiomaKidsDeRegion, idiomaWebDeKids } from "../src/lib/kids";
import type { FichaKids } from "../src/lib/kids-compra";
import { FICHA, fila, resp } from "./kids-datos";

const esc = (s: string) => renderToStaticMarkup(<>{s}</>);
const N = { id: "n1", nombre: "Nil Puig", como_le_dicen: "Nil", estado: "activo" };
const FICHA_CA: FichaKids = { ...FICHA, apodo: "Nil", quienRegala: "la teva mare", hora: "20:00", zona: "Europe/Madrid", idioma: "ca" };

function pantalla(f: FilaKids) {
  return renderToStaticMarkup(<PanelKids n={N} fila={f} capitulos={loQueCuenta([resp("K1"), resp("K12-R1")], [], f.fichaMotor ?? f.ficha, [])} />);
}

const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("el idioma de una compra desde /ca", () => {
  it("España en catalán es «ca»; España en castellano y Argentina, como siempre", () => {
    expect(idiomaKidsDeRegion("ES", "ca")).toBe("ca");
    expect(idiomaKidsDeRegion("ES", "es")).toBe("es-ES");
    expect(idiomaKidsDeRegion("ES")).toBe("es-ES");
    expect(idiomaKidsDeRegion("AR", "ca")).toBe("es-AR");
    expect(idiomaWebDeKids("ca")).toBe("ca");
  });
});

describe("el panel de Kids en catalán", () => {
  it("la guía (con «poma» y «dona molt més»), la casilla, la hora y los temas de la compra en catalán", () => {
    const html = pantalla(fila({ ficha: FICHA_CA, fichaMotor: FICHA_CA, avance: { capitulo: 2, preguntasPadreAbiertas: true } }));
    expect(html).toContain(esc("Pots afegir fins a tres preguntes teves. Li arriben a Nil cap al final, entre la quarta part i el sobre tancat. Abans de cadascuna li diem que ve de tu, tret que prefereixis que li arribi com una pregunta més."));
    expect(html).toContain(esc("Funciona millor demanar-li una vegada concreta que una opinió. \"Explica'm la vegada que…\" dona molt més que \"Què sents?\" o \"Què penses de…?\"."));
    expect(html).toContain(esc("Explica'm el dia que et va caure la primera dent, que va ser menjant una poma."));
    expect(html).toContain(esc("Llegeix-ho tot, però no li diguis res fins al llibre."));
    expect(html).toContain(esc("Millor quan torni de l'escola, o quan us pugueu asseure junts."));
    expect(html).toContain(esc("La seva nova família (la parella de la mare o del pare, els seus fills)"));
    expect(html).toContain(esc("Qui l'envia?"));
    expect(html).toContain('value="la teva mare"');
    // Lo que recibió el chico, del banco en catalán.
    expect(html).toContain(esc("Els primers anys"));
    const v = visible(html);
    for (const p of ["Puedes", "Podés", "Cuéntame", "Contame", "manzana", "panotxa", "Léelo", "reconstituïda", "De pequeño", "De chiquito"]) expect(v, p).not.toContain(esc(p));
  });

  it("los estados en catalán, con «Vinga, som-hi» (el botón del banco)", () => {
    const base = { estado: "activo", apodo: "Nil", capitulo: 0, titulo: null, termino: false, idioma: "ca" as const };
    expect(estadoKids({ ...base, canal: "A", arranco: false })).toBe("Encara no ha començat. Escriurem a Nil a l'hora que has triat.");
    expect(estadoKids({ ...base, canal: "A", arranco: true })).toBe("Ja hem escrit a Nil. La primera pregunta surt quan premi «Vinga, som-hi».");
    expect(estadoKids({ ...base, canal: "B", arranco: true })).toBe("Ja t'hem escrit. La primera pregunta surt quan premeu el botó, junts.");
    expect(estadoKids({ ...base, canal: "B", arranco: true, capitulo: 5, titulo: "Per a quan siguis gran (el sobre tancat)" })).toBe("Va per la part 5, «Per a quan siguis gran (el sobre tancat)».");
    expect(estadoKids({ ...base, canal: "B", arranco: true, termino: true })).toBe("Nil ha acabat d'explicar. Ara comencem a preparar el llibre.");
    expect(estadoCortoKids("activo", "ca")).toBe("explicant");
    const P = textosPanelKids("ca").panel;
    expect(P.inicio.ver).toBe("Veure tot el que explica");
    expect(P.toco("Passo")).toBe("Ha premut «Passo»");
    expect([P.correccion.dice, P.correccion.es]).toEqual(["Què hi diu", "Com ha de ser"]);
    expect(P.libro.confirmar).toBe("Quan l'aprovis, es queda així i ja no es canvia.");
  });

  it("la línea de la pregunta del padre, en singular y en plural (PADRE-PREG-LINEA del banco)", () => {
    const P = textosPanelKids("ca").panel;
    expect(P.preguntas.conLinea("la teva mare")).toBe("Abans li arriba «Aquesta pregunta te l'envia la teva mare, amb les seves paraules.»");
    expect(P.preguntas.conLinea("els teus pares")).toBe("Abans li arriba «Aquesta pregunta te l'envien els teus pares, amb les seves paraules.»");
    expect(P.preguntas.conLinea("les teves ties")).toContain("te l'envien");
  });

  it("los errores en catalán (panel, motor y libro)", () => {
    expect(errorCambioKids("hora", "ca")).toBe("Tria una hora de la llista.");
    expect(errorCambioKids("vacio", "ca")).toBe("Omple què hi diu i com ha de ser.");
    expect(errorCambioKids("ocupado", "ca")).toBe("En aquell moment s'estava desant un altre canvi. Torna-ho a provar.");
    expect(errorCambioKids("base", "ca")).toBe("No hem pogut desar. Torna-ho a provar.");
    expect(errorDelMotor("otro", "ca")).toBe("No hem pogut aplicar el teu últim canvi. Torna-ho a provar, i si torna a passar, escriu-nos.");
    expect(errorLibroKids("confirmar", "ca")).toBe("Falta confirmar que vols aprovar-lo.");
    expect(urlKids("panel", "n1", "ca")).toBe("/api/kids/panel?narrador=n1&idioma=ca");
  });
});

describe("«La seva veu» de Kids en catalán", () => {
  it("con «Escolta-la» y el enlace a /ca/kids", () => {
    const html = renderToStaticMarkup(<PaginaVozKids token="t" apodo="Nil" idioma="ca" publicables={[{ capitulo: { numero: 1, capitulo: "Qui soc", candidatas: [] }, frases: [{ id: "R1", texto: "Jugo a futbol.", elegida: true, estado: "cortada", audio_path: "n1/a.ogg", segundos: 3 }] }] as never} libroListo={false} />);
    expect(html).toContain(esc("Aquí hi ha les seves respostes, tal com les va dir. Toca'n una per escoltar-la."));
    expect(html).toContain(esc("La seva veu"));
    expect(html).toContain(esc("El llibre de Nil"));
    expect(html).toContain('href="/ca/kids"');
    expect(TEXTOS_VOZ_KIDS.ca.libroNoEsta).toBe("El llibre encara s'està preparant.");
  });
});

describe("el mail y «Pedido confirmado» de Kids en catalán", () => {
  it("el mail de acceso en catalán, con lo de la casa en `ca`", () => {
    const a = armarMailAcceso({ comoLeDicen: "Nil", region: "ES", kids: { canal: "A", idioma: "ca" } });
    expect(a.asunto).toBe("Ja està en marxa el llibre de Nil");
    expect(a.texto).toContain("Escriurem a Nil a l'hora que has triat. A tu t'avisem per WhatsApp.");
    expect(a.texto).toContain("Al teu panell veuràs tot el que explica. Allà també pots escriure fins a tres preguntes teves per al llibre.");
    expect(a.texto).toContain("A cada família hi ha un llibre per escriure.");
    const b = armarMailAcceso({ comoLeDicen: "Nil", region: "ES", kids: { canal: "B", idioma: "ca" } });
    expect(b.texto).toContain("La primera pregunta surt quan estigueu junts.");
    expect(b.texto).not.toMatch(/puedes|estéis|podés/);
  });

  it("«Pedido confirmado» en catalán, con «Mentre explica» de la casa", () => {
    const [a, mientras] = momentosKids("Nil", "A", false, "ca");
    expect(a.que).toBe("A l'hora que has triat, a Nil li arriba un missatge nostre per WhatsApp. Digues-li que li escriurà «Vitácora».");
    expect(mientras.cuando).toBe("Mentre explica");
    const [b] = momentosKids("Nil", "B", false, "ca");
    expect(b.que).toBe("T'arriba un missatge nostre al teu WhatsApp. La primera pregunta surt quan premeu el botó, junts.");
  });
});

describe("la compra de Kids en catalán", () => {
  it("los textos aprobados de la tanda 10: portada, padrí, «li diem», «li ho», «escriguem», «cognoms»", () => {
    const K = CHECKOUT_KIDS.ca;
    expect(K.suNombreAyuda).toBe("Així va a la portada.");
    expect(K.edadAyuda).toBe("Va a la portada, al costat del nom.");
    expect(K.quienBajada).toBe("El que necessitem perquè les preguntes li parlin bé i la portada sigui seva.");
    expect(K.regalaOtraPista).toBe("La teva tieta, el teu padrí, la teva padrina");
    expect(K.apodoAyuda).toBe("Així li diem als missatges.");
    expect([K.regala, K.errores.faltaQuien]).toEqual(["Qui li ho regala", "Falta qui li ho regala."]);
    expect(K.canalAutoriza).toBe("En triar això, ets tu, com a adult responsable, qui autoritza que escriguem a aquest número.");
    expect([K.tuNombrePista, K.suNombrePista]).toEqual(["Nom i cognoms", "Nom i cognoms"]);
    expect(K.canalA.detalle).toBe("Li escrivim directament i respon quan li vingui de gust. Tu veus tot el que explica des de la pàgina de la seva història.");
    expect(K.despuesTexto).toContain("Després de pagar t'arriba un correu");
    expect(K.despuesTexto).toContain("quan estigueu junts.");
    const todo = JSON.stringify(K);
    for (const p of ["tapa", "padrins", "el saludem", "Qui li regala", "li escrivim a aquest", "quan torna ", "reconstituïda", "et arriba", "sigueu junts"]) expect(todo, p).not.toContain(p);
    expect(KIDS_MISMO_NUMERO_TEXTOS.ca).toBe("El WhatsApp de qui ho explica ha de ser diferent del teu. Si les preguntes t'arriben a tu, tria «Ho faig jo».");
    expect(KIDS_IMPRESO_TEXTOS.ca.impresoDetalle).toBe("El mateix llibre, imprès i enquadernat, i també en PDF. L'enviament està inclòs. T'avisem quan surti d'impremta i t'enviem el seguiment de l'enviament.");
  });

  it("en /ca la hora arranca a las 20:00, como en España", () => {
    const ca = renderToStaticMarkup(<CheckoutKids idioma="ca" precio={59} moneda="EUR" escribir={{ href: "mailto:x", externo: false }} pasoInicial={2} />);
    expect(ca).toMatch(/<option value="20:00" selected="">/);
    expect(ca).toContain(esc("Millor quan torni de l'escola, o quan us pugueu asseure junts."));
    expect(ca).toContain(esc("La teva mare"));
  });
});
