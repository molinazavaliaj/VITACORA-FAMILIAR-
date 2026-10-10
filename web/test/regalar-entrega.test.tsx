import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { textosComprador } from "../src/lib/regalo-textos";
import { CamposEntrega, errorDeEleccion, lineaLeLlega, SIN_ENTREGA, type EleccionEntrega } from "../src/app/regalar/entrega";

// El regalo llega solo el día elegido (spec 2026-10-10): el bloque del paso 2
// y la línea del paso 4 de /regalar. Render estático y reglas puras.

const VOS = textosComprador("vos");
const TU = textosComprador("tu");
const E = VOS.entrega;
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const nada = () => {};

function render(o: { fecha?: string; eleccion?: EleccionEntrega; whatsapp?: boolean; idioma?: "es-AR" | "es-ES" | "ca"; tu?: boolean }) {
  return renderToStaticMarkup(
    <CamposEntrega
      fecha={o.fecha ?? "2099-12-24"} idioma={o.idioma ?? "es-AR"} eleccion={o.eleccion ?? SIN_ENTREGA}
      onCambio={nada} whatsapp={o.whatsapp ?? true} textos={o.tu ? TU : VOS} marca={() => ({})}
    />,
  );
}

describe("CamposEntrega", () => {
  it("sin fecha no muestra nada", () => {
    expect(render({ fecha: "" })).toBe("");
  });
  it("con fecha pregunta y ofrece las tres opciones, con «se la doy yo» marcada", () => {
    const html = render({});
    expect(html).toContain(escapar(E.mandarloEseDia));
    for (const c of Object.values(E.canales)) expect(html).toContain(escapar(c));
    expect(html.match(/<input[^>]*value="nadie"[^>]*>/)?.[0]).toContain('checked=""');
    expect(html).not.toContain(escapar(E.aQueHora));
  });
  it("sin el interruptor de WhatsApp, esa opción no aparece", () => {
    const html = render({ whatsapp: false });
    expect(html).not.toContain(escapar(E.canales.whatsapp));
    expect(html).toContain(escapar(E.canales.mail));
  });
  it("por mail pide la hora de 8 a 22 y el correo, y dice de qué país es la hora", () => {
    const html = render({ eleccion: { canal: "mail", contacto: "", hora: null } });
    expect(html).toContain(escapar(E.aQueHora));
    expect(html).toContain(escapar(E.horaDe("AR")));
    expect(html).toContain(escapar(E.suCorreo));
    expect(html).not.toContain(escapar(E.suCelular));
    expect(html).toContain('value="8"');
    expect(html).toContain('value="22"');
    expect(html).not.toContain('value="7"');
    expect(html).not.toContain(':00');
  });
  it("por WhatsApp pide el celular con su pista; en catalán la hora es de España", () => {
    const html = render({ idioma: "ca", eleccion: { canal: "whatsapp", contacto: "", hora: 10 } });
    expect(html).toContain(escapar(E.suCelular));
    expect(html).toContain(escapar(E.suCelularPista));
    expect(html).toContain(escapar(E.horaDe("ES")));
  });
  it("de tú dice móvil y correo", () => {
    const html = render({ tu: true, eleccion: { canal: "whatsapp", contacto: "", hora: 10 } });
    expect(html).toContain(escapar(TU.entrega.suCelular));
    expect(html).toContain(escapar(TU.entrega.canales.mail));
  });
});

describe("errorDeEleccion", () => {
  const AHORA = new Date("2026-10-10T12:00:00Z"); // 9 en Buenos Aires
  const ok = (e: EleccionEntrega, fecha = "2026-12-24") => errorDeEleccion(e, fecha, "es-AR", AHORA, E);

  it("sin canal no hay nada que revisar", () => {
    expect(ok(SIN_ENTREGA)).toBeNull();
  });
  it("falta la hora", () => {
    expect(ok({ canal: "mail", contacto: "a@b.com", hora: null })).toEqual({ texto: E.faltaHora, campo: "entrega-hora" });
  });
  it("correo mal escrito", () => {
    expect(ok({ canal: "mail", contacto: "abuelo@", hora: 10 })).toEqual({ texto: E.correoMal, campo: "entrega-contacto" });
  });
  it("celular con pocos dígitos", () => {
    expect(ok({ canal: "whatsapp", contacto: "11 55", hora: 10 })).toEqual({ texto: E.celularMal, campo: "entrega-contacto" });
  });
  it("hoy a una hora que ya pasó allá", () => {
    expect(ok({ canal: "mail", contacto: "a@b.com", hora: 8 }, "2026-10-10")).toEqual({ texto: E.horaPasada, campo: "entrega-hora" });
    expect(ok({ canal: "mail", contacto: "a@b.com", hora: 10 }, "2026-10-10")).toBeNull();
  });
});

describe("lineaLeLlega", () => {
  it("con entrega, «Le llega a … el dd/mm a las h.»", () => {
    expect(lineaLeLlega({ canal: "mail", contacto: " abuelo@gmail.com ", hora: 10 }, "2026-12-24", E)).toBe("Le llega a abuelo@gmail.com el 24/12 a las 10.");
  });
  it("sin entrega o sin fecha, nada", () => {
    expect(lineaLeLlega(SIN_ENTREGA, "2026-12-24", E)).toBeNull();
    expect(lineaLeLlega({ canal: "mail", contacto: "a@b.com", hora: 10 }, "", E)).toBeNull();
  });
});
