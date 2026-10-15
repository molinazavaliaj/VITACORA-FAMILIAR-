import { describe, it, expect, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Cabecera, Pie, WhatsAppFlotante } from "../src/app/_publico";
import { numeroWhatsAppDudas, urlWhatsAppDudas } from "../src/lib/whatsapp-dudas";

// La cabecera y el pie públicos del rediseño (fase 1): los comparten la
// portada, /ejemplo y el checkout.

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

describe("la cabecera pública", () => {
  it("en castellano: solapas Familiar · Kids · De viaje, ES · CA, Entrar y Comprar", () => {
    const html = renderToStaticMarkup(<Cabecera idioma="es" camino="/" />);
    expect(html).toContain("Familiar");
    expect(html).toContain("De viaje");
    expect(html).toMatch(/<a[^>]*href="\/ca"[^>]*>CA<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/comprar"[^>]*>Comprar el libro<\/a>/);
    expect(html).toContain('href="/entrar"');
    expect(html).toMatch(/<a[^>]*data-solapa="kids"[^>]*>Kids<\/a>/);
    expect(html).toContain('href="/kids"');
  });

  it("en Kids, la solapa va marcada y sin KIDS_VENTA no hay botón de comprar", () => {
    const antes = process.env.KIDS_VENTA;
    delete process.env.KIDS_VENTA;
    try {
      const html = renderToStaticMarkup(<Cabecera idioma="ar" camino="/kids" producto="kids" />);
      expect(html).toContain('data-activa="kids"');
      expect(html).toContain('href="/ar/kids"');
      expect(html).not.toContain("/comprar");
    } finally {
      if (antes !== undefined) process.env.KIDS_VENTA = antes;
    }
  });

  it("en catalán, el selector vuelve a la misma pantalla en castellano", () => {
    const html = renderToStaticMarkup(<Cabecera idioma="ca" camino="/ejemplo" />);
    expect(html).toMatch(/<a[^>]*href="\/ejemplo"[^>]*>ES<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/ca\/comprar"[^>]*>Comprar el llibre<\/a>/);
    expect(html).toContain('href="/ca"');
  });

  it("en Argentina no ofrece el catalán", () => {
    const html = renderToStaticMarkup(<Cabecera idioma="ar" camino="/" />);
    expect(html).not.toMatch(/>CA</);
    expect(html).toContain('href="/ar/comprar"');
  });

  it("en Viaje, Comprar lleva al checkout de viaje", () => {
    const html = renderToStaticMarkup(<Cabecera idioma="es" camino="/viaje" producto="viaje" />);
    expect(html).toContain('href="/comprar/viaje"');
    expect(html).toContain('data-activa="viaje"');
  });
});

describe("el pie público", () => {
  it("en Argentina, «Botón de arrepentimiento»; en España, «Desistimiento»", () => {
    const ar = renderToStaticMarkup(<Pie idioma="ar" camino="/" />);
    expect(ar).toContain("Botón de arrepentimiento");
    expect(ar).toContain('href="/ar/legal/arrepentimiento"');
    const es = renderToStaticMarkup(<Pie idioma="es" camino="/" />);
    expect(es).toContain("Desistimiento");
    expect(es).not.toContain("Botón de arrepentimiento");
    for (const html of [ar, es]) {
      expect(html).toContain(escapar("Todas las vidas merecen su propio libro"));
      expect(html).toContain("hola@vitacorafamiliar.com");
    }
  });

  it("cada idioma enlaza a sus tres legales (fase 5)", () => {
    for (const [idioma, prefijo] of [["es", ""], ["ca", "/ca"], ["ar", "/ar"]] as const) {
      const html = renderToStaticMarkup(<Pie idioma={idioma} camino="/" />);
      for (const doc of ["terminos", "privacidad", "arrepentimiento"]) {
        expect(html).toContain(`href="${prefijo}/legal/${doc}"`);
      }
    }
    expect(renderToStaticMarkup(<Pie idioma="ca" camino="/" />)).toContain("Desistiment");
  });

  it("el cambio de país va a la misma pantalla en la otra versión", () => {
    expect(renderToStaticMarkup(<Pie idioma="es" camino="/ejemplo" />)).toContain('href="/ar/ejemplo"');
    expect(renderToStaticMarkup(<Pie idioma="ar" camino="/ejemplo" />)).toContain('href="/ejemplo"');
  });
});

describe("el WhatsApp de dudas", () => {
  const antes = process.env.NEXT_PUBLIC_WHATSAPP_DUDAS;
  afterEach(() => {
    if (antes === undefined) delete process.env.NEXT_PUBLIC_WHATSAPP_DUDAS;
    else process.env.NEXT_PUBLIC_WHATSAPP_DUDAS = antes;
  });

  it("sin la variable, ni botón ni enlace", () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_DUDAS;
    expect(renderToStaticMarkup(<WhatsAppFlotante idioma="es" />)).toBe("");
    expect(renderToStaticMarkup(<Pie idioma="es" camino="/" />)).not.toContain("wa.me");
  });

  it("con un número E.164, el botón lleva a wa.me", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_DUDAS = "+34 611 22 33 44";
    expect(renderToStaticMarkup(<WhatsAppFlotante idioma="es" />)).toContain('href="https://wa.me/34611223344"');
  });

  it("un valor que no es un número no cuenta", () => {
    expect(numeroWhatsAppDudas("hola")).toBeNull();
    expect(numeroWhatsAppDudas("")).toBeNull();
    expect(numeroWhatsAppDudas("+0611")).toBeNull();
    expect(urlWhatsAppDudas("+5491122334455")).toBe("https://wa.me/5491122334455");
  });
});
