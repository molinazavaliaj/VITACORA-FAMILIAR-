import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// El checkout del rediseño 2026-10 (DECISIONES D3): /comprar en tres pasos en
// el orden de hoy (su libro → para quién → tus datos y el pago), «Pagar» que
// no cobra dos veces, el trato por el prefijo del número, lo elegido que vuelve
// tras un pago fallido, la compra de viaje con el mismo cascarón y «Pedido
// confirmado». Render estático y lógica pura: sin navegador.

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Playfair_Display: fuente, Archivo: fuente, Source_Serif_4: fuente };
});
const cabeceras = vi.hoisted(() => ({ pais: null as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(cabeceras.pais ? { "x-vercel-ip-country": cabeceras.pais } : {}),
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));
vi.mock("@/lib/supabase/sesion", () => ({ usuarioDeLaSesion: vi.fn(async () => null), crearClienteSesion: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));

import { catalogo } from "@/lib/productos";
import { idiomaDePrefijo, idiomaTrasElNumero } from "@/lib/idioma-telefono";
import { textosComprador } from "@/lib/regalo-textos";
import { Checkout } from "../src/app/comprar/formulario";
import { CheckoutViaje } from "../src/app/comprar/viaje/formulario";
import { carritoDe, cuerpoDeLaCompra, estadoInicial, fallaDelPaso, generoDe, proximaNavidad, type EstadoCompra } from "../src/app/comprar/compra";
import { cuerpoViaje, estadoViajeInicial, fallaViaje } from "../src/app/comprar/viaje/compra-viaje";
import { crearPagador } from "../src/app/_checkout/pagador";
import { guardar, leer, olvidar, vieneDePagoFallido, type Almacen } from "../src/app/_checkout/memoria";
import { CHECKOUT, FALLO } from "../src/app/_textos/checkout";
import { CHECKOUT_VIAJE } from "../src/app/_textos/checkout-viaje";
import { CONFIRMADO } from "../src/app/_textos/pedido-confirmado";
import PaginaComprarEs from "../src/app/comprar/page";
import PaginaComprarCa from "../src/app/ca/comprar/page";
import PaginaComprarAr from "../src/app/ar/comprar/page";
import PaginaViajeEs from "../src/app/comprar/viaje/page";
import PaginaViajeCa from "../src/app/ca/comprar/viaje/page";
import Gracias from "../src/app/comprar/gracias/page";

const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const render = (P: unknown) => renderToStaticMarkup((P as () => ReactElement)());
const ES = CHECKOUT.es;

beforeEach(() => {
  process.env.PRECIO_EUR = "49";
  process.env.PRECIO_ARS = "65000";
  process.env.PRECIO_IMPRESO_EUR = "50";
  process.env.PRECIO_IMPRESO_ARS = "90000";
  process.env.PRECIO_MARCO_EUR = "20";
  process.env.PRECIO_VIAJE_EUR = "49";
  delete process.env.PRECIO_COPIA_EUR;
  delete process.env.PRECIO_MARCO_ADICIONAL_EUR;
  delete process.env.NEXT_PUBLIC_WHATSAPP_DUDAS;
});

/** Un estado del paso 2 ya completo, para variar de a una cosa. */
function completo(cambios: Partial<EstadoCompra> = {}): EstadoCompra {
  return {
    ...estadoInicial("es", catalogo("ES")),
    para: "padre",
    nombre: "Roberto Fernández",
    comoLeDicen: "Roberto",
    regalo: false,
    telefono: "+34 612 345 678",
    email: "martina@ejemplo.com",
    nombreComprador: "Martina",
    vinculo: "hija",
    recibe: "Martina Fernández",
    telefonoRecibe: "612 345 678",
    direccion: { linea1: "Calle Mayor 12", ciudad: "Valladolid", cp: "47001", pais: "España" },
    ...cambios,
  };
}

describe("/comprar en tres pasos", () => {
  it("los pasos van en el orden de D3: su libro, para quién, pago", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    const orden = ["Su libro", "Para quién", "Pago"].map((p) => html.indexOf(`>${p}<`));
    expect(orden.every((i) => i > 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain(escapar(ES.libroTitulo));
    expect(renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={2} />)).toContain(escapar(ES.paraTitulo));
    const paso3 = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} />);
    expect(paso3).toContain(escapar(ES.pagoTitulo));
    expect(paso3).toContain('type="submit"');
  });

  it("arranca con el impreso puesto (Naza 06/10) y el precio de la opción es base + impreso, de productos.ts", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(html).toMatch(/<input(?=[^>]*value="impreso")(?=[^>]*checked="")[^>]*>/);
    expect(html).toContain(escapar(new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(99)));
    // Sin precio del impreso en la región, arranca en digital y la opción no existe.
    delete process.env.PRECIO_IMPRESO_EUR;
    const sin = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(sin).not.toContain('value="impreso"');
    expect(sin).toMatch(/<input(?=[^>]*value="digital")(?=[^>]*checked="")[^>]*>/);
  });

  it("el marco va solo con el impreso (D4): con digital no se puede sumar", () => {
    expect(carritoDe({ formato: "digital", copias: 0, marcos: 1 })).toEqual({ base: "pdf", impresos: 0, marcos: 0 });
    expect(carritoDe({ formato: "impreso", copias: 2, marcos: 1 })).toEqual({ base: "pdf", impresos: 3, marcos: 1 });
  });

  it("se quitaron «Pago recibido» y «Lo completo más tarde», y no hay promesas sin respaldo", () => {
    for (const paso of [1, 2, 3] as const) {
      for (const idioma of ["es", "ca", "ar"] as const) {
        const html = renderToStaticMarkup(<Checkout idioma={idioma} catalogo={catalogo(idioma === "ar" ? "AR" : "ES")} pasoInicial={paso} />);
        expect(html).not.toMatch(/Pago recibido|Lo completo más tarde|anticipo|9 días|VITACORA10|¿Tienes un código\?|una pregunta por día|30 días/i);
      }
    }
  });

  it("la letra pequeña junto a pagar: el desistimiento de hoy y la garantía de la línea (D1)", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} />);
    expect(html).toContain(escapar("sin esperar los 14 días de desistimiento"));
    expect(html).toContain(escapar("Si no quiere hacerlo, te devolvemos el dinero."));
    const ar = renderToStaticMarkup(<Checkout idioma="ar" catalogo={catalogo("AR")} pasoInicial={3} />);
    expect(ar).toContain(escapar("Pago único y seguro con Mercado Pago. Al pagar aceptás los"));
  });

  it("la dirección se pide en el pago solo si hay impreso", () => {
    expect(renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} />)).toContain(escapar(ES.direccionTitulo));
    delete process.env.PRECIO_IMPRESO_EUR;
    expect(renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} />)).not.toContain(escapar(ES.direccionTitulo));
  });

  it("las tres rutas: la región sale del idioma de la web, con su lang, su moneda y su trato", () => {
    const es = render(PaginaComprarEs);
    expect(es).toContain('lang="es-ES"');
    expect(es).toContain("¿Cómo quieres su libro?");
    expect(es).toContain("€");
    const ar = render(PaginaComprarAr);
    expect(ar).toContain('lang="es-AR"');
    expect(ar).toContain("¿Cómo querés su libro?");
    expect(ar).toContain("$");
    const ca = render(PaginaComprarCa);
    expect(ca).toContain('lang="ca-ES"');
    expect(ca).toContain(escapar(CHECKOUT.ca.libroTitulo));
  });

  it("la cabecera propia: logo a la portada de su idioma, pago seguro y entrar; sin número de dudas, sin botón", () => {
    const ca = render(PaginaComprarCa);
    expect(ca).toMatch(/<a(?=[^>]*href="\/ca")[^>]*>/);
    expect(ca).toContain("Pagament segur i xifrat");
    expect(ca).toMatch(/href="\/entrar"/);
    expect(ca).not.toContain("wa.me");
    process.env.NEXT_PUBLIC_WHATSAPP_DUDAS = "+34 600 111 222";
    expect(render(PaginaComprarEs)).toContain('href="https://wa.me/34600111222"');
  });
});

describe("el paso «Para quién»", () => {
  const ahora = new Date("2026-10-13T12:00:00Z");
  const entrega = textosComprador("tu").entrega;

  it("madre y abuela son ella; «Otra persona» y «Para mí» piden elegir", () => {
    expect(generoDe({ para: "madre", genero: null })).toBe("mujer");
    expect(generoDe({ para: "abuelo", genero: null })).toBe("varon");
    expect(generoDe({ para: "otra", genero: "mujer" })).toBe("mujer");
    expect(fallaDelPaso(2, completo({ para: "otra", genero: null }), ES, entrega, ahora)?.texto).toBe(ES.faltaGeneroOtro);
    expect(fallaDelPaso(2, completo({ para: "yo", genero: null }), ES, entrega, ahora)?.texto).toBe(ES.faltaGeneroYo);
  });

  it("sin regalo pide su WhatsApp; con regalo no, pero pide el mensaje de la tarjeta", () => {
    expect(fallaDelPaso(2, completo(), ES, entrega, ahora)).toBeNull();
    expect(fallaDelPaso(2, completo({ telefono: "" }), ES, entrega, ahora)?.campo).toBe("telefono");
    expect(fallaDelPaso(2, completo({ regalo: true, telefono: "" }), ES, entrega, ahora)?.campo).toBe("mensaje");
    expect(fallaDelPaso(2, completo({ regalo: true, telefono: "", mensaje: "Para que nos cuentes" }), ES, entrega, ahora)).toBeNull();
    expect(fallaDelPaso(2, completo({ regalo: null }), ES, entrega, ahora)?.campo).toBe("regalo");
  });

  it("no deja avanzar con «papá» ni «abuela» (salvo en «Para mí»)", () => {
    expect(fallaDelPaso(2, completo({ comoLeDicen: "Papá" }), ES, entrega, ahora)?.texto).toBe(ES.palabraDeFamilia);
    expect(fallaDelPaso(2, completo({ para: "yo", genero: "varon", comoLeDicen: "abuelo" }), ES, entrega, ahora)).toBeNull();
  });

  it("el pago pide correo, quién paga y, con impreso, la dirección", () => {
    expect(fallaDelPaso(3, completo(), ES, entrega, ahora)).toBeNull();
    expect(fallaDelPaso(3, completo({ email: "no" }), ES, entrega, ahora)?.campo).toBe("email");
    expect(fallaDelPaso(3, completo({ vinculo: "" }), ES, entrega, ahora)?.campo).toBe("vinculo");
    expect(fallaDelPaso(3, completo({ direccion: { pais: "España" } }), ES, entrega, ahora)?.campo).toBe("direccion");
    expect(fallaDelPaso(3, completo({ formato: "digital", direccion: {} }), ES, entrega, ahora)).toBeNull();
  });

  it("Navidad es el próximo 24 de diciembre", () => {
    expect(proximaNavidad(new Date(2026, 9, 13))).toBe("2026-12-24");
    expect(proximaNavidad(new Date(2026, 11, 26))).toBe("2027-12-24");
  });
});

describe("el trato de la entrevista arranca por el prefijo del número (C16)", () => {
  it("+54 y +598 de vos, +34 de tú; sin prefijo no dice nada", () => {
    expect(idiomaDePrefijo("+54 9 11 5555 1234")).toBe("es-AR");
    expect(idiomaDePrefijo("+598 99 123 456")).toBe("es-AR");
    expect(idiomaDePrefijo("0034 612 345 678")).toBe("es-ES");
    expect(idiomaDePrefijo("+34 612 345 678")).toBe("es-ES");
    expect(idiomaDePrefijo("612 345 678")).toBeNull();
    expect(idiomaDePrefijo("+33 6 12 34 56 78")).toBeNull();
  });

  it("desde España un +54 pasa a vos; desde la versión catalana un +34 deja el catalán", () => {
    expect(idiomaTrasElNumero("es-ES", "+54 11 5555 1234")).toBe("es-AR");
    expect(idiomaTrasElNumero("es-AR", "+34 612 345 678")).toBe("es-ES");
    expect(idiomaTrasElNumero("ca", "+34 612 345 678")).toBe("ca");
    expect(idiomaTrasElNumero("ca", "+54 11 5555 1234")).toBe("es-AR");
    expect(idiomaTrasElNumero("es-ES", "612 345 678")).toBe("es-ES");
  });

  it("el idioma elegido va en el contexto del narrador; el catalán sigue como opción", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={2} />);
    expect(html).toContain(escapar(ES.paraTitulo));
    const cuerpo = cuerpoDeLaCompra(completo({ idioma: "es-AR" }), "es");
    expect(cuerpo.narrador.contexto.idioma).toBe("es-AR");
    expect(cuerpoDeLaCompra(completo({ idioma: "ca" }), "ca").narrador.contexto.idioma).toBe("ca");
  });
});

describe("el cuerpo de /api/compra (el mismo contrato)", () => {
  it("sin regalo: su WhatsApp, la hora, el carrito y el idioma de la web", () => {
    const c = cuerpoDeLaCompra(completo({ marcos: 1 }), "es");
    expect(c).toMatchObject({
      nombreComprador: "Martina",
      vinculoComprador: "hija",
      region: "ES",
      idiomaWeb: "es",
      narrador: { nombre: "Roberto Fernández", comoLeDicen: "Roberto", telefonoWhatsapp: "+34 612 345 678", horaPreferida: "09:00", contexto: { genero: "varon" } },
      productos: { impresos: 1, marcos: 1 },
    });
    expect(c).not.toHaveProperty("regalo");
  });

  it("regalo: sin teléfono, con la tarjeta, la fecha y la prueba para retomarlo", () => {
    const c = cuerpoDeLaCompra(
      completo({ regalo: true, telefono: "", mensaje: " Feliz Navidad ", fechaEntrega: "2026-12-24", retomar: { narradorId: "n1", token: "t1" } }),
      "es",
    );
    expect(c.narrador).not.toHaveProperty("telefonoWhatsapp");
    expect(c.regalo).toEqual({ mensaje: "Feliz Navidad", fechaEntrega: "2026-12-24", genero: "varon", idioma: "es-ES", retomar: { narradorId: "n1", token: "t1" } });
  });

  it("«Para mí»: el comprador es el narrador", () => {
    const c = cuerpoDeLaCompra(completo({ para: "yo", genero: "mujer", nombre: "Laura Gil", nombreComprador: "" }), "ar");
    expect(c).toMatchObject({ nombreComprador: "Laura Gil", vinculoComprador: "yo mismo", region: "AR", idiomaWeb: "ar" });
  });
});

describe("«Pagar» no se puede pulsar dos veces", () => {
  const T = CHECKOUT.es;
  function deps() {
    let soltar: (r: Response) => void = () => {};
    const fetch = vi.fn(() => new Promise<Response>((res) => (soltar = res)));
    const asignar = vi.fn();
    const antesDeIr = vi.fn();
    return { fetch: fetch as unknown as typeof globalThis.fetch, asignar, antesDeIr, soltar: (r: Response) => soltar(r), llamadas: fetch };
  }
  const ok = () => new Response(JSON.stringify({ urlPago: "https://pago/x", narradorId: "n1", tokenFotos: "t1" }), { status: 200 });

  it("dos clics a la vez crean una sola compra y van una sola vez a la pasarela", async () => {
    const d = deps();
    const pagador = crearPagador(d, T);
    const primero = pagador.pagar({}, []);
    const segundo = await pagador.pagar({}, []);
    expect(segundo).toEqual({ ocupado: true });
    d.soltar(ok());
    expect(await primero).toEqual({ ok: true });
    expect(d.llamadas).toHaveBeenCalledTimes(1);
    expect(d.asignar).toHaveBeenCalledTimes(1);
    expect(d.antesDeIr).toHaveBeenCalledWith({ urlPago: "https://pago/x", narradorId: "n1", tokenFotos: "t1" });
    // Ya se fue a la pasarela: un tercer clic tampoco hace nada.
    expect(await pagador.pagar({}, [])).toEqual({ ocupado: true });
  });

  it("si el pago no arranca, se libera y el reintento vuelve a probar", async () => {
    const d = deps();
    const pagador = crearPagador(d, T);
    const intento = pagador.pagar({}, []);
    d.soltar(new Response(JSON.stringify({ error: "Ese WhatsApp ya tiene un libro en marcha." }), { status: 409 }));
    expect(await intento).toEqual({ error: "Ese WhatsApp ya tiene un libro en marcha." });
    expect(pagador.ocupado).toBe(false);
    const otra = pagador.pagar({}, []);
    d.soltar(ok());
    expect(await otra).toEqual({ ok: true });
  });

  it("si vuelve de la pasarela y corrige un dato, la compra se crea de nuevo con los datos nuevos", async () => {
    const d = deps();
    const pagador = crearPagador(d, T);
    const primero = pagador.pagar({ email: "mal@ejemplo.com" }, []);
    d.soltar(ok());
    expect(await primero).toEqual({ ok: true });
    pagador.liberar(); // volvió atrás desde la pasarela (pageshow)
    const segundo = pagador.pagar({ email: "bien@ejemplo.com" }, []);
    d.soltar(ok());
    expect(await segundo).toEqual({ ok: true });
    expect(d.llamadas).toHaveBeenCalledTimes(2);
    const cuerpo = (d.llamadas.mock.calls as unknown as [string, RequestInit][])[1][1].body;
    expect(JSON.parse(String(cuerpo))).toEqual({ email: "bien@ejemplo.com" });
  });

  it("si algo inesperado falla al irse a la pasarela, el botón no queda bloqueado", async () => {
    const d = deps();
    const pagador = crearPagador({ ...d, asignar: () => { throw new Error("x"); } }, T);
    const intento = pagador.pagar({}, []);
    d.soltar(ok());
    expect(await intento).toEqual({ error: T.errorPago });
    expect(pagador.ocupado).toBe(false);
  });

  it("si una foto falla no va a pagar, y el reintento no crea otra compra ni repite las subidas", async () => {
    const d = deps();
    const subidas: string[] = [];
    let falla = true;
    const pagador = crearPagador(
      {
        ...d,
        subirFoto: async (_n, _t, clave) => {
          if (clave === "b" && falla) throw new Error("No pudimos subir b.jpg.");
          subidas.push(clave);
        },
      },
      T,
    );
    const fotos = [{ clave: "a", nombre: "a.jpg", subida: false }, { clave: "b", nombre: "b.jpg", subida: false }];
    const intento = pagador.pagar({}, fotos, (c) => fotos.forEach((f) => f.clave === c && (f.subida = true)));
    d.soltar(ok());
    expect(await intento).toEqual({ error: `No pudimos subir b.jpg. ${T.sacalaOIntenta}` });
    expect(d.asignar).not.toHaveBeenCalled();
    falla = false;
    expect(await pagador.pagar({}, fotos)).toEqual({ ok: true });
    expect(d.llamadas).toHaveBeenCalledTimes(1);
    expect(subidas).toEqual(["a", "b"]);
  });

  it("el botón deshabilitado dice «Procesando…» con el punto que late", async () => {
    const { BotonPagar } = await import("../src/app/_checkout/piezas");
    const html = renderToStaticMarkup(<BotonPagar enviando texto="Pagar 99 €" procesando={T.procesando} />);
    expect(html).toMatch(/<button[^>]*disabled=""/);
    expect(html).toContain("m-latido");
    expect(html).toContain(T.procesando);
    expect(html).not.toContain("Pagar 99");
  });
});

describe("pago fallido: lo elegido sigue guardado (Casos 2)", () => {
  function almacen(): Almacen & { datos: Map<string, string> } {
    const datos = new Map<string, string>();
    return { datos, getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => void datos.set(k, v), removeItem: (k) => void datos.delete(k) };
  }

  it("la vuelta de la pasarela trae ?pago=fallido", () => {
    expect(vieneDePagoFallido("?pago=fallido")).toBe(true);
    expect(vieneDePagoFallido("?pago=ok")).toBe(false);
    expect(vieneDePagoFallido("")).toBe(false);
  });

  it("se restaura lo guardado de esa compra, no de otra, y vence a las dos horas", () => {
    const a = almacen();
    const estado = completo({ marcos: 1, retomar: { narradorId: "n1", token: "t1" } });
    const t0 = Date.parse("2026-10-13T10:00:00Z");
    guardar(() => a, "vitacora-compra-pendiente", "familiar-es", estado, t0);
    expect(leer(() => a, "vitacora-compra-pendiente", "familiar-es", t0 + 60_000)).toEqual(estado);
    expect(leer(() => a, "vitacora-compra-pendiente", "familiar-ar", t0 + 60_000)).toBeNull();
    expect(leer(() => a, "vitacora-compra-pendiente", "familiar-es", t0 + 3 * 60 * 60 * 1000)).toBeNull();
    olvidar(() => a, "vitacora-compra-pendiente");
    expect(a.datos.size).toBe(0);
  });

  it("sin almacenamiento (modo privado) no rompe nada", () => {
    const roto = () => {
      throw new Error("SecurityError");
    };
    expect(() => guardar(roto, "x", "y", {})).not.toThrow();
    expect(leer(roto, "x", "y")).toBeNull();
  });

  it("el aviso dice que no se cobró nada y, si se restauró, que sigue guardado", async () => {
    const { AvisoFallo } = await import("../src/app/_checkout/piezas");
    const con = renderToStaticMarkup(<AvisoFallo textos={FALLO.es} guardado />);
    expect(con).toContain(escapar("Tu banco no ha aceptado el pago. No se te ha cobrado nada."));
    expect(con).toContain(escapar("Lo que elegiste sigue guardado."));
    expect(renderToStaticMarkup(<AvisoFallo textos={FALLO.es} guardado={false} />)).not.toContain(escapar("sigue guardado"));
  });
});

describe("/comprar/viaje con el mismo cascarón", () => {
  it("el mismo libro (papel y tinta, sin el azul), tres pasos, y en es de vosotros sin «cada noche» (B24)", () => {
    const es = render(PaginaViajeEs);
    expect(es).toContain('data-producto="viaje"');
    expect(es).not.toContain("tema-viaje");
    expect(es).toContain(escapar(CHECKOUT_VIAJE.es.libroTitulo));
    for (const idioma of ["es", "ca", "ar"] as const) {
      for (const paso of [1, 2, 3] as const) {
        const html = renderToStaticMarkup(<CheckoutViaje idioma={idioma} catalogo={catalogo(idioma === "ar" ? "AR" : "ES")} pasoInicial={paso} />);
        expect(html).not.toMatch(/cada noche|una pregunta por noche|cada nit/i);
      }
    }
    expect(Object.values(CHECKOUT_VIAJE.es).join(" ")).toContain("os escribe");
    expect(render(PaginaViajeCa)).toContain('lang="ca-ES"');
  });

  it("hace lo de antes: un POST con el viaje en el contexto, y el impreso con su dirección", () => {
    const V = CHECKOUT_VIAJE.es;
    const e = { ...estadoViajeInicial("es"), nombre: "Sara Ruiz", telefono: "+34 600 000 000", email: "sara@ejemplo.com", salida: "2027-06-02", vuelta: "2027-06-09", etapas: [{ nombre: "Lisboa" }, { nombre: " " }] };
    expect(fallaViaje(2, e, V, CHECKOUT.es)).toBeNull();
    expect(fallaViaje(2, { ...e, vuelta: "2027-06-01" }, V, CHECKOUT.es)?.texto).toBe(V.vueltaAntes);
    expect(fallaViaje(3, { ...e, formato: "impreso" }, V, CHECKOUT.es)?.campo).toBe("recibe");
    const c = cuerpoViaje(e, "es");
    expect(c).toMatchObject({ vinculoComprador: "yo mismo", region: "ES", idiomaWeb: "es", productos: { viaje: true, impresos: 0, marcos: 0 } });
    expect(c.narrador.comoLeDicen).toBe("Sara");
    expect(c.narrador.contexto.viaje.etapas).toEqual([{ nombre: "Lisboa" }]);
  });
});

describe("«Pedido confirmado»", () => {
  const pagina = async (params: Record<string, string>) =>
    renderToStaticMarkup(await (Gracias as unknown as (p: { searchParams: Promise<Record<string, string>> }) => Promise<ReactElement>)({ searchParams: Promise.resolve(params) }));

  it("sin sesión: la pantalla de respaldo, en el idioma de la vuelta, con «Entrar a mi panel»", async () => {
    const ca = await pagina({ idioma: "ca" });
    expect(ca).toContain('lang="ca-ES"');
    expect(ca).toContain(escapar(CONFIRMADO.ca.tituloGenerico));
    expect(ca).toContain(escapar(CONFIRMADO.ca.entrarAlPanel));
    const ar = await pagina({ idioma: "ar" });
    expect(ar).toContain(escapar("Si no lo ves, mirá en promociones o en spam."));
  });

  it("sin idioma en la URL, el país de quien compró, como antes", async () => {
    cabeceras.pais = "ES";
    expect(await pagina({})).toContain(escapar("Si no lo ves, mira en promociones o en spam."));
    cabeceras.pais = null;
    expect(await pagina({})).toContain(escapar("Si no lo ves, mirá en promociones o en spam."));
  });

  it("la lista de qué pasa ahora no promete anticipo ni plazos del impreso", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const T = CONFIRMADO[idioma];
      const todo = [...T.otro("Roberto", true), ...T.regalo("Roberto", true), ...T.propio(true), ...T.generico].map((m) => m.que).join(" ");
      expect(todo).not.toMatch(/anticipo|9 días|9 dies|primeras páginas|capítulo a capítulo/i);
    }
  });

  it("viaje: el texto del biógrafo de viaje", async () => {
    const html = await pagina({ viaje: "1", idioma: "es" });
    expect(html).toContain("Vuestro biógrafo de viaje");
    expect(html).toContain('data-producto="viaje"');
  });
});
