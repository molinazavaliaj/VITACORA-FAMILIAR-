import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// La voz del carrito (22/09, lo vio Naza): el checkout del Familiar habla en
// castellano neutro de "tú" y el de viaje y el panel, en vos. Las piezas son
// las mismas, así que la voz viaja como dato — y esto lo fija.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));

import { Upsells } from "../src/app/comprar/productos-ui";
import type { Catalogo, Carrito } from "../src/lib/productos";

const cat: Catalogo = {
  moneda: "EUR",
  base: { nombre: "El libro en PDF + Su voz", detalle: "…", precio: 49 },
  viaje: null,
  impreso: { precio: 49, precioCopia: 40 },
  marco: { precio: 20, precioAdicional: 15 },
};
const carrito: Carrito = { base: "pdf", impresos: 0, marcos: 0 };
const render = (trato: "tu" | "vos") =>
  renderToStaticMarkup(createElement(Upsells, { cat, region: "ES" as const, carrito, setCarrito: () => {}, trato }));

describe("la voz del carrito", () => {
  it('en "tú" (checkout del Familiar) no aparece ninguna forma rioplatense', () => {
    const html = render("tu");
    expect(html).toContain("Suma el libro impreso");
    expect(html).toContain("Suma marcos con su voz");
    expect(html).toContain("suma el libro impreso para agregar marcos");
    expect(html).not.toMatch(/Sumá|tenés|querés|Elegí|Podés/);
  });

  it('en "vos" (viaje y panel) sigue en rioplatense', () => {
    const html = render("vos");
    expect(html).toContain("Sumá el libro impreso");
    expect(html).toContain("sumá el libro impreso para agregar marcos");
  });

  it("los mensajes del servidor son impersonales: sirven para las dos voces", async () => {
    const { validarCarrito } = await import("../src/lib/productos");
    process.env.PRECIO_EUR = "49";
    process.env.PRECIO_IMPRESO_EUR = "49";
    const r = validarCarrito("ES", { base: "pdf", impresos: 0, marcos: 2 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensaje).not.toMatch(/Sumá|suma el|tenés|tienes|Elegí|Elige/);
  });
});
