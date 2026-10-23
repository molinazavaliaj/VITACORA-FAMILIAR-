import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// «Vitácora de una historia» (plan 2026-10-21, Task 4.4): la compra de Familiar con un paso más, «La historia»,
// entre «Para quién» y el pago. Textos aprobados por Naza el 23/10 (H2 a H10).

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/comprar/historia", useSearchParams: () => new URLSearchParams() }));

import { catalogo } from "@/lib/productos";
import { textosComprador } from "@/lib/regalo-textos";
import { claveDeCompra, cuerpoDeLaCompra, estadoInicial, fallaDelPaso, historiaInicial, pasoDelPago, type EstadoCompra } from "../src/app/comprar/compra";
import { CHECKOUT } from "../src/app/_textos/checkout";
import { TEXTOS_HISTORIA } from "../src/app/_textos/historia";
import { Checkout } from "../src/app/comprar/formulario";
import PaginaEs from "../src/app/comprar/historia/page";
import PaginaAr from "../src/app/ar/comprar/historia/page";
import PaginaCa from "../src/app/ca/comprar/historia/page";

const ES = CHECKOUT.es;
const H = TEXTOS_HISTORIA.es.paso;
const ahora = new Date("2026-10-23T12:00:00Z");
const entrega = textosComprador("tu").entrega;
const render = (P: unknown) => renderToStaticMarkup((P as () => ReactElement)());

beforeEach(() => {
  process.env.PRECIO_EUR = "49";
  process.env.PRECIO_ARS = "65000";
});
afterEach(() => vi.unstubAllEnvs());

function completo(cambios: Partial<EstadoCompra> = {}, historia: Partial<NonNullable<EstadoCompra["historia"]>> = {}): EstadoCompra {
  return {
    ...estadoInicial("es", catalogo("ES")),
    para: "madre",
    nombre: "Marta Gómez",
    comoLeDicen: "Marta",
    regalo: false,
    telefono: "+34 612 345 678",
    email: "pablo@ejemplo.com",
    nombreComprador: "Pablo",
    vinculo: "hijo",
    formato: "digital",
    marcos: 0,
    ...cambios,
    historia: { ...historiaInicial(), ...historia },
  };
}

describe("la compra de historia", () => {
  it("el pago es el paso 4; en Familiar sigue siendo el 3", () => {
    expect(pasoDelPago(completo())).toBe(4);
    expect(pasoDelPago(estadoInicial("es", catalogo("ES")))).toBe(3);
  });

  it("sin tema no avanza; «Otra historia» pide el texto; una pregunta larga, tampoco", () => {
    expect(fallaDelPaso(3, completo(), ES, entrega, ahora, H)).toEqual({ texto: H.errorSinTema, campo: "tema" });
    expect(fallaDelPaso(3, completo({}, { tema: "otra", temaLibre: "  " }), ES, entrega, ahora, H)).toEqual({ texto: H.errorSinOtra, campo: "tema-libre" });
    expect(fallaDelPaso(3, completo({}, { tema: "otra", temaLibre: "El campo" }), ES, entrega, ahora, H)).toBeNull();
    expect(fallaDelPaso(3, completo({}, { tema: "mudanza" }), ES, entrega, ahora, H)).toBeNull();
    const regalo = completo({ regalo: true, mensaje: "Mamá, contá esa historia." }, { tema: "mudanza", preguntasPropias: ["x".repeat(301)] });
    expect(fallaDelPaso(3, regalo, ES, entrega, ahora, H)).toEqual({ texto: H.errorPropiaLarga, campo: "propias" });
  });

  it("con el tema abierto (solo regalo) no hace falta elegir", () => {
    expect(fallaDelPaso(3, completo({ regalo: true, mensaje: "Hola" }, { temaAbierto: true }), ES, entrega, ahora, H)).toBeNull();
    expect(fallaDelPaso(3, completo({}, { temaAbierto: true }), ES, entrega, ahora, H)?.campo).toBe("tema");
  });

  it("el paso 4 es el pago: pide el correo", () => {
    expect(fallaDelPaso(4, completo({ email: "" }, { tema: "mudanza" }), ES, entrega, ahora, H)?.campo).toBe("email");
  });

  it("manda contexto.historia: para uno mismo, sin propias ni tema abierto", () => {
    const c = cuerpoDeLaCompra(completo({}, { tema: "mudanza", temaAbierto: true, preguntasPropias: ["¿Qué?"] }), "es");
    expect(c.narrador.contexto.historia).toEqual({ tema: "mudanza", preguntasPropias: [] });
    expect(cuerpoDeLaCompra(completo({}, { tema: "otra", temaLibre: " El campo " }), "es").narrador.contexto.historia).toEqual({ tema: "otra", temaLibre: "El campo", preguntasPropias: [] });
  });

  it("un regalo manda el tema abierto o el tema, y sus preguntas sin las vacías", () => {
    const regalo = (h: Partial<NonNullable<EstadoCompra["historia"]>>) => cuerpoDeLaCompra(completo({ regalo: true, mensaje: "Hola" }, h), "es").narrador.contexto.historia;
    expect(regalo({ temaAbierto: true, tema: "negocio", preguntasPropias: [" ¿Qué extrañabas? ", ""] })).toEqual({ temaAbierto: true, preguntasPropias: ["¿Qué extrañabas?"] });
    expect(regalo({ tema: "negocio", preguntasPropias: ["¿Y el local?"] })).toEqual({ tema: "negocio", preguntasPropias: ["¿Y el local?"] });
  });

  it("Familiar no manda historia", () => {
    const familiar = { ...completo(), historia: undefined };
    expect("historia" in cuerpoDeLaCompra(familiar, "es").narrador.contexto).toBe(false);
  });

  it("lo guardado para volver de un pago fallido no se mezcla con Familiar", () => {
    expect(claveDeCompra("es", true)).not.toBe(claveDeCompra("es"));
  });

  it("la pantalla: cuatro pasos con «La historia», y el paso 3 con los temas aprobados", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} historia pasoInicial={3} />);
    expect(html).toContain(H.barra);
    expect(html).toContain(ES.pasoDe(3, 4));
    expect(html).toContain(H.titulo);
    expect(html).toContain("Irse a vivir fuera");
    expect(html).toContain("Emigrar, cambiar de ciudad, empezar de cero");
  });

  it("las tres páginas: «Próximamente» sin HISTORIA_VENTA; la compra con HISTORIA_VENTA=1", () => {
    expect(render(PaginaEs)).toContain(TEXTOS_HISTORIA.es.proximamente.titulo);
    vi.stubEnv("HISTORIA_VENTA", "1");
    expect(render(PaginaAr)).toContain(TEXTOS_HISTORIA.ar.paso.barra);
    expect(render(PaginaCa)).toContain(TEXTOS_HISTORIA.ca.paso.barra);
  });
});
