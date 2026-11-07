// El pago embebido de España (06/11): /pagar muestra el formulario de Stripe
// dentro de la web, y la clave pública es el interruptor (sin ella, el de siempre).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("stripe", () => ({ default: vi.fn() }));

import Stripe from "stripe";
import { crearCheckout } from "../src/lib/pagos";
import { leerFormularioPago, productoDeLaVuelta, urlFormularioPago } from "../src/lib/pago-embebido";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calcularCompra, CARRITO_VACIO } from "../src/lib/productos";
import { verificarToken } from "../src/lib/token-firmado";
import { vieneDePagoFallido, volvioPorSuCuenta } from "../src/app/_checkout/memoria";

const COMPRA = "/comprar";

function stripeFalso(metodos: { create?: unknown; retrieve?: unknown }) {
  (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
    return { checkout: { sessions: metodos } };
  });
}

function parametros(url: string) {
  const q = new URL(url).searchParams;
  return { s: q.get("s"), v: q.get("v"), t: q.get("t") };
}

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba"; // firma el token de /pagar
  process.env.URL_BASE = "https://vitacorafamiliar.com";
  process.env.STRIPE_SECRET_KEY = "rk_test_x";
  process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_x";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.STRIPE_PUBLISHABLE_KEY;
  vi.restoreAllMocks();
});

describe("crearCheckout con la clave pública", () => {
  it("crea la sesión embebida y manda a /pagar, con el id firmado y sin el secreto en la URL", async () => {
    const create = vi.fn().mockResolvedValue({ id: "cs_1", client_secret: "cs_1_secret_z", url: null });
    stripeFalso({ create });

    const { urlPago } = await crearCheckout({ id: "pedido-1", email: "m@test.com" }, calcularCompra("ES", CARRITO_VACIO), { idioma: "ca", pantalla: "comprar" });

    const args = create.mock.calls[0][0] as Record<string, unknown>;
    expect(args.ui_mode).toBe("embedded_page");
    expect(args.success_url).toBeUndefined();
    expect(args.cancel_url).toBeUndefined();
    expect(args.metadata).toEqual({ pedido_id: "pedido-1" });
    const vuelta = new URL(args.return_url as string);
    expect(vuelta.pathname).toBe("/api/pago/vuelta");
    expect(args.return_url).toContain("session_id={CHECKOUT_SESSION_ID}");

    const url = new URL(urlPago);
    expect(url.origin + url.pathname).toBe("https://vitacorafamiliar.com/pagar");
    expect(url.searchParams.get("s")).toBe("cs_1");
    expect(url.searchParams.get("v")).toBe("/ca/comprar?pago=volvio");
    expect(url.searchParams.get("idioma")).toBe("ca");
    expect(verificarToken("pago", url.searchParams.get("t"), "cs_1|/ca/comprar?pago=volvio")).toBe(true);
    expect(urlPago).not.toContain("secret");
  });

  it("sin la clave pública sigue el pago en la página de Stripe", async () => {
    delete process.env.STRIPE_PUBLISHABLE_KEY;
    const create = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/xyz" });
    stripeFalso({ create });

    const { urlPago } = await crearCheckout({ id: "pedido-1", email: "m@test.com" }, calcularCompra("ES", CARRITO_VACIO));

    expect(urlPago).toBe("https://checkout.stripe.com/xyz");
    expect((create.mock.calls[0][0] as Record<string, unknown>).ui_mode).toBeUndefined();
  });
});

describe("leerFormularioPago", () => {
  const url = () => urlFormularioPago("https://vitacorafamiliar.com", "cs_1", "/comprar?pago=volvio", "es");

  it("con el enlace firmado y la sesión abierta, muestra el formulario", async () => {
    const retrieve = vi.fn().mockResolvedValue({ id: "cs_1", status: "open", client_secret: "cs_1_secret_z" });
    stripeFalso({ retrieve });

    expect(await leerFormularioPago(parametros(url()), COMPRA)).toEqual({
      tipo: "mostrar",
      clavePublica: "pk_test_x",
      secretoSesion: "cs_1_secret_z",
      volver: "/comprar?pago=volvio",
    });
    expect(retrieve).toHaveBeenCalledWith("cs_1");
  });

  it("un enlace tocado no consulta a Stripe: ni otra sesión ni otro destino al volver", async () => {
    const retrieve = vi.fn();
    stripeFalso({ retrieve });
    const buenos = parametros(url());

    expect(await leerFormularioPago({ ...buenos, s: "cs_otra" }, COMPRA)).toEqual({ tipo: "ir", a: COMPRA });
    expect(await leerFormularioPago({ ...buenos, v: "https://malo.example" }, COMPRA)).toEqual({ tipo: "ir", a: COMPRA });
    expect(await leerFormularioPago({ s: undefined, v: undefined, t: undefined }, COMPRA)).toEqual({ tipo: "ir", a: COMPRA });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("si ya se pagó, sigue a la confirmación", async () => {
    stripeFalso({ retrieve: vi.fn().mockResolvedValue({ id: "cs_1", status: "complete", return_url: "https://v.com/api/pago/vuelta?pedido=1&session_id={CHECKOUT_SESSION_ID}" }) });

    expect(await leerFormularioPago(parametros(url()), COMPRA)).toEqual({ tipo: "ir", a: "https://v.com/api/pago/vuelta?pedido=1&session_id=cs_1" });
  });

  it("con la sesión vencida, sin secreto, o si Stripe falla, vuelve a la compra", async () => {
    stripeFalso({ retrieve: vi.fn().mockResolvedValue({ id: "cs_1", status: "expired", client_secret: null }) });
    expect(await leerFormularioPago(parametros(url()), COMPRA)).toEqual({ tipo: "ir", a: "/comprar?pago=volvio" });

    stripeFalso({ retrieve: vi.fn().mockResolvedValue({ id: "cs_1", status: "open", client_secret: null }) });
    expect(await leerFormularioPago(parametros(url()), COMPRA)).toEqual({ tipo: "ir", a: "/comprar?pago=volvio" });

    stripeFalso({ retrieve: vi.fn().mockRejectedValue(new Error("caído")) });
    expect(await leerFormularioPago(parametros(url()), COMPRA)).toEqual({ tipo: "ir", a: "/comprar?pago=volvio" });
  });

  it("si se sacó la clave pública después, vuelve a la compra", async () => {
    const enlace = parametros(url());
    delete process.env.STRIPE_PUBLISHABLE_KEY;

    expect(await leerFormularioPago(enlace, COMPRA)).toEqual({ tipo: "ir", a: "/comprar?pago=volvio" });
  });
});

describe("volver por su cuenta desde /pagar", () => {
  it("restaura lo elegido, pero no es un pago rechazado", () => {
    expect(vieneDePagoFallido("?pago=volvio")).toBe(true);
    expect(volvioPorSuCuenta("?pago=volvio")).toBe(true);
    expect(volvioPorSuCuenta("?pago=fallido")).toBe(false);
  });
});

describe("/pagar lleva el color de la compra de donde viene (07/11)", () => {
  it("lo saca del camino de vuelta que arma crearCheckout, en cada idioma", async () => {
    const casos = [
      [{ idioma: "es", pantalla: "kids" }, "kids"],
      [{ idioma: "ca", pantalla: "kids" }, "kids"],
      [{ idioma: "es", pantalla: "historia" }, "historia"],
      [{ idioma: "es", pantalla: "comprar" }, "familiar"],
      [{ idioma: "es", pantalla: "regalar" }, "familiar"],
    ] as const;
    for (const [origen, producto] of casos) {
      stripeFalso({ create: vi.fn().mockResolvedValue({ id: "cs_1", client_secret: "cs_1_secret_z", url: null }) });
      const { urlPago } = await crearCheckout({ id: "pedido-1", email: "m@test.com" }, calcularCompra("ES", CARRITO_VACIO), origen);
      const volver = new URL(urlPago).searchParams.get("v") ?? "";
      expect(productoDeLaVuelta(volver), volver).toBe(producto);
    }
  });

  it("viaje, con y sin prefijo de idioma; nada raro se toma por otra compra", () => {
    expect(productoDeLaVuelta("/comprar/viaje?pago=volvio")).toBe("viaje");
    expect(productoDeLaVuelta("/ca/comprar/viaje")).toBe("viaje");
    expect(productoDeLaVuelta("/comprar/kids-falso?pago=volvio")).toBe("familiar");
    expect(productoDeLaVuelta("/comprar?kids=1")).toBe("familiar");
  });
});

describe("Kids recupera lo cargado al volver de /pagar (07/11)", () => {
  // El formulario de Kids corre en el navegador; acá se fija que use la misma
  // memoria que viaje y la casa (lo guardado al ir a pagar, leído al volver),
  // y que la vuelta voluntaria no muestre el aviso del banco.
  const fuente = readFileSync(resolve(__dirname, "../src/app/comprar/kids/formulario.tsx"), "utf8");

  it("guarda lo elegido antes de ir a pagar y lo lee al volver, con la misma clave", () => {
    expect(fuente).toContain("guardar(sesion, CLAVE_COMPRA_KIDS, clave, e)");
    expect(fuente).toContain("leer<EstadoKids>(sesion, CLAVE_COMPRA_KIDS, clave)");
  });

  it("el aviso de pago rechazado sale solo con ?pago=fallido", () => {
    expect(fuente).toContain("if (!volvioPorSuCuenta(window.location.search)) setFallo(");
    expect(fuente).toContain("<AvisoFallo textos={FALLO[idioma]}");
  });
});

describe("«Pedido confirmado» olvida toda compra guardada (07/11)", () => {
  // Lo guardado para volver del pago lleva datos personales (en Kids, los del
  // chico). Ya cobrado, no queda en la pestaña. El test mira cada CLAVE_COMPRA*
  // de memoria.ts: una compra nueva que guarde algo sin olvidarlo acá falla.
  it("cada CLAVE_COMPRA* de memoria.ts se olvida en al-confirmar.tsx", async () => {
    const memoria = await import("../src/app/_checkout/memoria");
    const claves = Object.keys(memoria).filter((k) => k.startsWith("CLAVE_COMPRA"));
    expect(claves).toEqual(expect.arrayContaining(["CLAVE_COMPRA", "CLAVE_COMPRA_VIAJE", "CLAVE_COMPRA_KIDS"]));
    const alConfirmar = readFileSync(resolve(__dirname, "../src/app/comprar/gracias/al-confirmar.tsx"), "utf8");
    for (const clave of claves) expect(alConfirmar, clave).toContain(`olvidar(sesion, ${clave});`);
  });
});
