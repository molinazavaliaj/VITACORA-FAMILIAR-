import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TEXTOS_REGALO } from "../src/lib/regalo-textos";
import { catalogo } from "../src/lib/productos";

// Gift card: la compra del regalo en /regalar (Task 8). Render estático: la
// página con la región del visitante y el paso de pagar con el botón final.
const estado = vi.hoisted(() => ({ pais: null as string | null }));

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
vi.mock("next/headers", () => ({
  headers: async () => new Headers(estado.pais ? { "x-vercel-ip-country": estado.pais } : {}),
}));

import PaginaRegalar from "../src/app/regalar/page";
import { FormularioRegalo } from "../src/app/regalar/formulario";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const precioBase = (region: "AR" | "ES") => {
  const cat = catalogo(region);
  return escapar(new Intl.NumberFormat(region === "ES" ? "es-ES" : "es-AR", { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(cat.base.precio));
};

async function renderPagina(pais: string | null) {
  estado.pais = pais;
  const el = await (PaginaRegalar as unknown as () => Promise<ReactElement>)();
  return renderToStaticMarkup(el);
}

describe("/regalar", () => {
  beforeEach(() => {
    estado.pais = null;
  });

  it("desde Argentina arranca en el paso 1, con la etiqueta 11 y en pesos", async () => {
    const html = await renderPagina("AR");
    expect(html).toContain(escapar(TEXTOS_REGALO.aQuien));
    expect(html).toContain(escapar(TEXTOS_REGALO.comoLeDecis));
    expect(html).toContain(escapar(TEXTOS_REGALO.genero));
    for (const g of Object.values(TEXTOS_REGALO.generos)) expect(html).toContain(escapar(g));
    expect(html).toMatch(/value="varon"/);
    expect(html).toMatch(/value="mujer"/);
    expect(html).toMatch(/value="otro"/);
    expect(html).toContain(precioBase("AR"));
  });

  it("desde España también se puede comprar (sin bloqueo por país), en euros", async () => {
    const html = await renderPagina("ES");
    expect(html).toContain(escapar(TEXTOS_REGALO.aQuien));
    expect(html).toContain(precioBase("ES"));
  });

  it.each(["AR", "ES"] as const)("el paso de pagar muestra la tarjeta en chico, el precio y el botón 20 (%s)", (region) => {
    const cat = catalogo(region);
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={cat} region={region} pasoInicial={4} />);
    expect(html).toContain(escapar(TEXTOS_REGALO.botonPagar));
    expect(html).toContain(escapar(cat.base.nombre));
    expect(html).toContain(precioBase(region));
  });

  it("el encabezado y la línea de pago salen de TEXTOS_REGALO, con las mismas palabras de antes", async () => {
    expect(TEXTOS_REGALO.yaCompre).toBe("Ya compré · Entrar");
    expect(TEXTOS_REGALO.pagoSeguro("Mercado Pago")).toBe("Pago único y seguro con Mercado Pago. Al pagar aceptás los");
    expect(TEXTOS_REGALO.terminos).toBe("términos");
    const html = await renderPagina("AR");
    expect(html).toContain(escapar(TEXTOS_REGALO.yaCompre));
    for (const region of ["AR", "ES"] as const) {
      const pago = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo(region)} region={region} pasoInicial={4} />);
      expect(pago).toContain(escapar(TEXTOS_REGALO.pagoSeguro(region === "ES" ? "Stripe" : "Mercado Pago")));
      expect(pago).toMatch(new RegExp(`<a href="/legal/terminos"[^>]*>${escapar(TEXTOS_REGALO.terminos)}</a>\\.`));
    }
  });

  it("el paso del mensaje tiene el contador sobre 600, el audio y la fecha desde hoy", () => {
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo("AR")} region="AR" pasoInicial={2} />);
    expect(html).toContain(escapar(TEXTOS_REGALO.tuMensaje));
    expect(html).toContain("0/600");
    expect(html).toContain('maxLength="600"');
    expect(html).toContain(escapar(TEXTOS_REGALO.audio));
    expect(html).toContain(escapar(TEXTOS_REGALO.grabar));
    expect(html).toContain(escapar(TEXTOS_REGALO.cuando));
    expect(html).toMatch(/type="date"[^>]*min="\d{4}-\d{2}-\d{2}"/);
  });

  it("el paso de tus datos pide nombre, qué es tuyo y correo", () => {
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo("AR")} region="AR" pasoInicial={3} />);
    expect(html).toContain(escapar(TEXTOS_REGALO.tuNombre));
    expect(html).toContain(escapar(TEXTOS_REGALO.queEsTuyo));
    expect(html).toContain(escapar(TEXTOS_REGALO.tuCorreo));
  });
});

describe("/regalar, lo que se ve sin tocar", () => {
  it("los nombres de los pasos quedan para los lectores de pantalla en el celular", () => {
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo("AR")} region="AR" />);
    for (const p of TEXTOS_REGALO.pasos) expect(html).toContain(escapar(p));
    expect(html).toContain("sr-only sm:not-sr-only");
    expect(html).not.toMatch(/class="hidden sm:inline"/);
  });

  it("el grabador se nombra con la etiqueta 15", () => {
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo("AR")} region="AR" pasoInicial={2} />);
    expect(html).toMatch(/id="etiqueta-audio"/);
    expect(html).toMatch(/role="group" aria-labelledby="etiqueta-audio"/);
  });
});

describe("la fecha de entrega en el cliente (misma regla que el servidor)", () => {
  const hoy = new Date("2026-10-08T12:00:00Z");
  it("acepta desde ayer en UTC y rechaza lo pasado o inexistente", async () => {
    const { errorDeFechaEntrega, MENSAJE_FECHA_INVALIDA, MENSAJE_FECHA_PASADA } = await import("../src/lib/regalo-reglas");
    expect(errorDeFechaEntrega("2026-10-07", hoy)).toBeNull();
    expect(errorDeFechaEntrega("2026-12-24", hoy)).toBeNull();
    expect(errorDeFechaEntrega("2026-10-06", hoy)).toBe(MENSAJE_FECHA_PASADA);
    expect(errorDeFechaEntrega("2026-02-31", hoy)).toBe(MENSAJE_FECHA_INVALIDA);
  });
});
