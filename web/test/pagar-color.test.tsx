// /pagar con el color y el logo de la compra de donde viene (07/11): antes solo
// distinguía viaje, y el pago de Kids o de una historia salía en bordó.
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const leer = vi.hoisted(() => vi.fn());
vi.mock("../src/lib/pago-embebido", async (original) => ({
  ...(await original<typeof import("../src/lib/pago-embebido")>()),
  leerFormularioPago: leer,
}));
// El formulario de Stripe no se monta en el servidor: acá solo importa el marco.
vi.mock("@stripe/stripe-js", () => ({ loadStripe: () => Promise.resolve(null) }));
vi.mock("@stripe/react-stripe-js", () => ({
  EmbeddedCheckoutProvider: ({ children }: { children: React.ReactNode }) => children,
  EmbeddedCheckout: () => null,
}));

import Pagar from "../src/app/pagar/page";

async function pintar(volver: string, idioma = "es") {
  leer.mockResolvedValue({ tipo: "mostrar", clavePublica: "pk_test_x", secretoSesion: "cs_1_secret_z", volver });
  const pagina = await Pagar({ searchParams: Promise.resolve({ s: "cs_1", v: volver, t: "x", idioma }) } as never);
  return renderToStaticMarkup(pagina);
}

describe("/pagar lleva el color de su compra", () => {
  it.each([
    ["/comprar/kids?pago=volvio", "kids", 'href="/kids"'],
    ["/comprar/historia?pago=volvio", "historia", 'href="/historia"'],
    ["/comprar/viaje?pago=volvio", "viaje", 'href="/viaje"'],
    ["/comprar?pago=volvio", "familiar", 'href="/"'],
  ])("%s → %s", async (volver, producto, logo) => {
    const html = await pintar(volver);
    expect(html).toContain(`data-producto="${producto}"`);
    expect(html).toContain(`acu-acento-${producto}`);
    expect(html).toContain(logo);
    // «Volver a mi compra» sigue yendo a la compra de donde salió.
    expect(html).toContain(`href="${volver}"`);
  });

  it("Kids suma lo propio de su compra (.kids-chk), las demás no", async () => {
    expect(await pintar("/comprar/kids?pago=volvio")).toContain("kids-chk");
    expect(await pintar("/comprar?pago=volvio")).not.toContain("kids-chk");
  });

  it("con prefijo de idioma, el logo va a la portada de ese idioma", async () => {
    expect(await pintar("/ca/comprar/kids?pago=volvio", "ca")).toContain('href="/ca/kids"');
  });
});
