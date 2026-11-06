import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

import { armarCompra, catalogo } from "@/lib/productos";
import { conMarcosParaRegalar, contadorDeMarcos, eleccionDe, eleccionInicial, marcosParaRegalar, normalizarConPack, opcionDe, opcionesDeLibro, precioDeOpcion, reglaDeMarcos, sumaSinPack } from "../src/app/_checkout/opciones-libro";
import { OpcionesLibro } from "../src/app/_checkout/opciones-libro-ui";
import { idiomaDePrefijo, idiomaTrasElNumero } from "@/lib/idioma-telefono";
import { textosComprador } from "@/lib/regalo-textos";
import { Checkout } from "../src/app/comprar/formulario";
import { CheckoutViaje } from "../src/app/comprar/viaje/formulario";
import { carritoDe, cuerpoDeLaCompra, estadoInicial, fallaDelPaso, generoDe, proximaNavidad, type EstadoCompra } from "../src/app/comprar/compra";
import { cuerpoViaje, estadoViajeInicial, fallaViaje } from "../src/app/comprar/viaje/compra-viaje";
import { crearPagador } from "../src/app/_checkout/pagador";
import { guardar, leer, olvidar, vieneDePagoFallido, type Almacen } from "../src/app/_checkout/memoria";
import { CHECKOUT, FALLO, RESUMEN } from "../src/app/_textos/checkout";
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

  it("arranca con el impreso, el precio de la portada (Naza 25/10), aunque haya marco; sin impreso, en digital", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(html).toMatch(/<input(?=[^>]*value="impreso")(?=[^>]*checked="")[^>]*>/);
    expect(html).not.toMatch(/<input(?=[^>]*value="marco")(?=[^>]*checked="")[^>]*>/);
    delete process.env.PRECIO_MARCO_EUR;
    const sinMarco = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(sinMarco).toMatch(/<input(?=[^>]*value="impreso")(?=[^>]*checked="")[^>]*>/);
    expect(eleccionInicial(catalogo("ES"))).toEqual({ formato: "impreso", marcos: 0, opcion: "impreso" });
    // Sin precio del impreso en la región, arranca en digital y la opción no existe.
    delete process.env.PRECIO_IMPRESO_EUR;
    const sin = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(sin).not.toContain('value="impreso"');
    expect(sin).toMatch(/<input(?=[^>]*value="digital")(?=[^>]*checked="")[^>]*>/);
  });

  it("paso 1: tres opciones en orden (el libro completo, el impreso, el digital), una sola elegida, «Para regalar» en la primera", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    const orden = ['value="marco"', 'value="impreso"', 'value="digital"'].map((v) => html.indexOf(v));
    expect(orden.every((i) => i > 0)).toBe(true);
    expect([...orden].sort((a, b) => a - b)).toEqual(orden);
    expect(html.match(/name="formato"/g)).toHaveLength(3);
    expect(html.match(/<input(?=[^>]*name="formato")(?=[^>]*checked="")[^>]*>/g)).toHaveLength(1);
    expect(html).toContain(escapar(ES.marcoOpcionTitulo));
    // «Para regalar» es la cinta del libro completo (y su lectura para lectores de pantalla), solo ahí.
    const cinta = html.indexOf('class="chk-cinta"');
    expect(cinta).toBeGreaterThan(0);
    expect(cinta).toBeLessThan(orden[0]);
    expect(html.slice(cinta, orden[1])).toContain(escapar(ES.impresoEtiqueta));
    // La cinta va solo en la primera (las filas de extras de la elegida pueden decir «Para regalar a tus familiares»).
    expect(html.slice(orden[1]).match(/class="chk-cinta"/g)).toBeNull();
    // Cada opción con su frase de valor (aprobadas) y su título de siempre.
    for (const o of ["marco", "impreso", "digital"] as const) {
      expect(html).toContain(escapar(ES.frases[o].cabeza));
      expect(html).toContain(escapar(ES.frases[o].bajada));
    }
    expect(html).toContain(escapar(ES.impresoTitulo));
    // La tarjeta suelta del marco ya no está: quedó adentro de la primera opción.
    expect(html).not.toContain(escapar(ES.marcoTitulo));
    // El único checkbox es el del marco, en las filas de extras de la elegida (el impreso, desde el 25/10).
    expect(html.slice(0, html.indexOf('class="chk-extras"'))).not.toContain('type="checkbox"');
    // Los precios salen del catálogo: 49 + 50 + 20, 49 + 50 y 49.
    const eur = (n: number) => escapar(new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n));
    for (const n of [119, 99, 49]) expect(html).toContain(eur(n));
  });

  it("paso 1: sin marco en la región no hay opción con marco; sin impreso, solo la digital", () => {
    delete process.env.PRECIO_MARCO_EUR;
    const sinMarco = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(sinMarco).toContain('value="impreso"');
    expect(sinMarco).not.toContain('value="marco"');
    expect(opcionesDeLibro(catalogo("ES"))).toEqual(["impreso", "digital"]);
    process.env.PRECIO_MARCO_EUR = "20";
    delete process.env.PRECIO_IMPRESO_EUR;
    // Con marco pero sin impreso: el marco viaja con el libro, así que tampoco.
    expect(opcionesDeLibro(catalogo("ES"))).toEqual(["digital"]);
    expect(renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />)).not.toContain('value="marco"');
  });

  it("cada opción arma el carrito de siempre y el total es el del servidor", () => {
    const cat = catalogo("ES");
    const e = estadoInicial("es", cat);
    expect(opcionDe(e)).toBe("impreso");
    const casos = [
      ["digital", { base: "pdf", impresos: 0, marcos: 0 }],
      ["impreso", { base: "pdf", impresos: 1, marcos: 0 }],
      ["marco", { base: "pdf", impresos: 1, marcos: 1 }],
    ] as const;
    for (const [opcion, carrito] of casos) {
      const elegido = { ...e, ...eleccionDe(opcion, e) };
      expect(opcionDe(elegido)).toBe(opcion);
      expect(carritoDe(elegido)).toEqual(carrito);
      expect(armarCompra(cat, "ES", carritoDe(elegido)).total).toBe(precioDeOpcion(opcion, cat.base.precio, cat));
    }
    // Lo guardado antes de un pago fallido (o para retomar) vuelve a lo que eligió, no al defecto.
    expect(opcionDe({ ...e, formato: "impreso", marcos: 2, opcion: "impreso" })).toBe("impreso");
    expect(opcionDe({ ...e, formato: "digital", marcos: 0, opcion: "digital" })).toBe("digital");
    // Lo guardado antes de este cambio (sin `opcion`) se deduce de los marcos.
    expect(opcionDe({ formato: "impreso", marcos: 2 })).toBe("marco");
    expect(opcionDe({ formato: "impreso", marcos: 0 })).toBe("impreso");
  });

  it("marcos para regalar: con la 2 y la 3, y no con la digital; se conservan al cambiar entre la 2 y la 3", () => {
    process.env.PRECIO_MARCO_ADICIONAL_EUR = "15";
    process.env.PRECIO_COPIA_EUR = "30";
    const cat = catalogo("ES");
    const base = estadoInicial("es", cat);
    const impreso = { ...base, ...eleccionDe("impreso", base) };
    const marco = { ...base, ...eleccionDe("marco", impreso) };
    const digital = { ...base, ...eleccionDe("digital", base) };
    // Qué cuesta el contador: en la 2 el primero a precio de marco y los demás a adicional; en la 3, solo adicionales.
    expect(contadorDeMarcos("impreso", cat)).toEqual({ primero: 20, demas: 15, max: 19 });
    expect(contadorDeMarcos("marco", cat)).toEqual({ primero: 15, demas: 15, max: 19 });
    expect(contadorDeMarcos("digital", cat)).toBeNull();
    // El total con marcos para regalar es el de armarCompra.
    const dosEnLa2 = { ...impreso, ...conMarcosParaRegalar(impreso, 2) };
    expect(carritoDe(dosEnLa2)).toEqual({ base: "pdf", impresos: 1, marcos: 2 });
    expect(armarCompra(cat, "ES", carritoDe(dosEnLa2)).total).toBe(49 + 50 + 20 + 15);
    const dosEnLa3 = { ...marco, ...conMarcosParaRegalar(marco, 2) };
    expect(opcionDe(dosEnLa3)).toBe("marco");
    expect(carritoDe(dosEnLa3)).toEqual({ base: "pdf", impresos: 1, marcos: 3 });
    expect(armarCompra(cat, "ES", carritoDe(dosEnLa3)).total).toBe(49 + 50 + 20 + 15 * 2);
    // Pasar de la 3 a la 2 deja los mismos marcos para regalar (y saca el incluido), y al revés.
    expect(marcosParaRegalar({ ...dosEnLa3, ...eleccionDe("impreso", dosEnLa3) })).toBe(2);
    expect(marcosParaRegalar({ ...dosEnLa2, ...eleccionDe("marco", dosEnLa2) })).toBe(2);
    // Lo que se ve: en la 2 (la de entrada desde el 25/10) las dos filas de extras adentro de la opción, sin marcar.
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={cat} />);
    const extras = html.indexOf('class="chk-extras"');
    expect(extras).toBeGreaterThan(html.indexOf('value="impreso"'));
    expect(extras).toBeGreaterThan(html.indexOf('value="digital"')); // en la nota de la elegida, debajo de las tres
    expect(html).toContain(escapar(ES.copiasTitulo));
    // En el impreso la fila es el primer marco: «Marco con su foto».
    expect(html).toContain(escapar(ES.marcoPrimeroTitulo));
    expect(html).toContain('class="mdb"');
    expect(html).toContain(escapar(ES.marcoRegaloDetalle));
    expect(html).toContain('name="copias"');
    expect(html).toContain('name="marcos"');
    // Sin marcar no hay contador; marcadas, aparece ahí mismo.
    expect(html).not.toContain(`aria-label="${escapar(ES.unoMas(ES.marcoPrimeroTitulo))}"`);
    const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
    const opciones = (estado: typeof base) =>
      renderToStaticMarkup(
        <OpcionesLibro cat={cat} base={49} estado={estado} onElegir={() => {}} onCambio={() => {}} textos={{ ...ES, titulo: ES.libroTitulo, cinta: ES.impresoEtiqueta }}
          tapa={{ titulo: "", idioma: "es" }} conPack formatear={eur} />,
      );
    // En la 3, el marco del contador es adicional (+15); en la 2 el primero es +20 y dice cuánto los demás.
    expect(opciones(dosEnLa3)).toContain(`>${escapar(`+${eur(15)}`)}<`);
    expect(opciones(dosEnLa3)).toContain(`aria-label="${escapar(ES.unoMas(ES.marcoExtraTitulo))}"`);
    // En el impreso la fila es el primer marco: «Marco con su foto».
    expect(opciones(dosEnLa2)).toContain(escapar(ES.marcoPrimeroTitulo));
    expect(opciones(dosEnLa2)).not.toContain(escapar(ES.marcoExtraTitulo));
    const enLa2 = opciones(dosEnLa2);
    expect(enLa2).toContain(`>${escapar(`+${eur(20)}`)}<`);
    expect(enLa2).toContain(escapar(ES.primeroYDemas(eur(20), eur(15))));
    expect(ES.primeroYDemas("20 €", "15 €")).toBe("+20 € el primero, +15 € los demás");
    // Con la digital no hay extras.
    expect(opciones(digital)).not.toContain('class="chk-extras"');
    // Sin precio adicional, el servidor no cobra un segundo marco: en la 2 se puede uno solo y en la 3 no hay contador.
    delete process.env.PRECIO_MARCO_ADICIONAL_EUR;
    expect(contadorDeMarcos("impreso", catalogo("ES"))).toEqual({ primero: 20, demas: null, max: 1 });
    expect(contadorDeMarcos("marco", catalogo("ES"))).toBeNull();
  });

  it("marco a 19 € todos (Naza 15/10): con PRECIO_MARCO igual a PRECIO_MARCO_ADICIONAL se ve un solo precio, sin «el primero, los demás»", () => {
    process.env.PRECIO_MARCO_EUR = "19";
    process.env.PRECIO_MARCO_ADICIONAL_EUR = "19";
    const cat = catalogo("ES");
    const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
    // La regla pura: con un solo precio no hay texto; con dos, el de siempre.
    expect(reglaDeMarcos({ primero: 19, demas: 19 }, ES.primeroYDemas, eur)).toBeUndefined();
    expect(reglaDeMarcos({ primero: 20, demas: null }, ES.primeroYDemas, eur)).toBeUndefined();
    expect(reglaDeMarcos({ primero: 20, demas: 15 }, ES.primeroYDemas, eur)).toBe(ES.primeroYDemas(eur(20), eur(15)));
    // Lo que se ve en la opción del impreso (la 2, donde antes decía «+20 € el primero, +15 € los demás»).
    const base = estadoInicial("es", cat);
    const impreso = { ...base, ...eleccionDe("impreso", base) };
    const dos = { ...impreso, ...conMarcosParaRegalar(impreso, 2) };
    const html = renderToStaticMarkup(
      <OpcionesLibro cat={cat} base={49} estado={dos} onElegir={() => {}} onCambio={() => {}} textos={{ ...ES, titulo: ES.libroTitulo, cinta: ES.impresoEtiqueta }}
        tapa={{ titulo: "", idioma: "es" }} conPack formatear={eur} />,
    );
    expect(html).toContain(`>${escapar(`+${eur(19)}`)}<`);
    expect(html).not.toContain(escapar(ES.primeroYDemas(eur(19), eur(19))));
    expect(html).not.toContain("el primero");
    // Lo que se cobra no cambia: cada marco a 19.
    expect(armarCompra(cat, "ES", carritoDe(dos)).total).toBe(49 + 50 + 19 * 2);
  });

  it("el pack (Naza 14/10): el libro completo cuesta el pack, sin tachado ni «Ahorras»; el ticket lleva una línea", () => {
    process.env.PRECIO_PACK_EUR = "109";
    try {
      const eur = (n: number) => escapar(new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n));
      const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
      // Sin tachado ni «Ahorras» (Naza 06/11): el libro completo muestra solo el precio del pack.
      expect(html).not.toContain("chk-op-tachado");
      expect(html).not.toContain("chk-ahorro");
      expect(html).not.toMatch(/Ahorras|Ahorrás/);
      expect(html).toContain(`<span class="chk-op-cifra">${eur(109)}</span>`);
      // El ticket del pack (una línea y lo que se ahorra) se ve al elegir el libro completo: se arranca en el impreso (25/10).
      const e = estadoInicial("es", catalogo("ES"));
      const completo = { ...e, ...eleccionDe("marco", e) };
      // El total del ticket es el del servidor.
      expect(armarCompra(catalogo("ES"), "ES", carritoDe(completo)).total).toBe(109);
      expect(armarCompra(catalogo("ES"), "ES", carritoDe(completo)).lineas).toHaveLength(1);
      // Si el pack no es más barato, no se tacha nada y se cobra la suma.
      process.env.PRECIO_PACK_EUR = "119";
      const igual = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
      expect(igual).not.toContain("chk-op-tachado");
      expect(igual).not.toContain(escapar(RESUMEN.es.lineas.pack));
    } finally {
      delete process.env.PRECIO_PACK_EUR;
    }
  });

  it("con la digital no hay contadores (copias y marcos van solo con impreso)", () => {
    process.env.PRECIO_MARCO_ADICIONAL_EUR = "15";
    process.env.PRECIO_COPIA_EUR = "30";
    delete process.env.PRECIO_IMPRESO_EUR;
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(html).not.toContain(escapar(ES.copiasTitulo));
    expect(html).not.toContain(escapar(ES.marcoExtraTitulo));
    expect(html).not.toContain(escapar(ES.marcoPrimeroTitulo));
  });

  it("en el teléfono el botón del paso va en la barra de abajo, después del resumen (Naza 14/10)", () => {
    // El de entrada: el impreso con el PDF (49 + 50).
    const total = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(99);
    for (const paso of [1, 2, 3] as const) {
      const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={paso} />);
      const resumen = html.indexOf(`aria-label="${escapar(RESUMEN.es.etiqueta)}"`);
      const barra = html.indexOf("data-barra-paso");
      expect(resumen).toBeGreaterThan(0);
      expect(barra).toBeGreaterThan(resumen);
      const enLaBarra = html.slice(barra);
      if (paso === 3) {
        // Paga el mismo formulario, desde afuera, con el total.
        expect(enLaBarra).toContain('form="pago-compra"');
        expect(html).toContain('id="pago-compra"');
        expect(enLaBarra).toContain(escapar(ES.pagar(total)));
      } else {
        // Pasos 1 y 2: «Seguir» (Naza 06/11).
        expect(enLaBarra).toContain(`>${escapar(ES.seguir)}<`);
      }
      // El botón del paso (el mismo) se esconde en el teléfono, y la página deja lugar para la barra.
      expect(html).toContain("chk-solo-escritorio");
      expect(html).toContain("chk-con-barra");
    }
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
    expect(html).toContain(escapar("Si no acepta la entrevista o contesta menos de diez preguntas, te devolvemos todo. Desde la décima respuesta, si desistes dentro de esos 14 días, se descuenta la parte ya hecha."));
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

describe("/comprar/viaje: la Vitácora de Viaje V2 (16/10)", () => {
  // La compra de Viaje con su acento azul (acu-acento-viaje) y data-producto="viaje", sin la
  // clase vieja .tema-viaje. Solo lo de la V2: nada de etapas, ciudades, «con quién viajás» ni ángulos.
  it("su paleta, tres pasos, y ni rastro del viaje viejo ni de «cada noche»", () => {
    const es = render(PaginaViajeEs);
    expect(es).toContain('data-producto="viaje"');
    expect(es).not.toContain("tema-viaje");
    expect(es).toContain(escapar(CHECKOUT_VIAJE.es.libroTitulo));
    for (const idioma of ["es", "ca", "ar"] as const) {
      for (const paso of [1, 2, 3] as const) {
        const html = renderToStaticMarkup(<CheckoutViaje idioma={idioma} catalogo={catalogo(idioma === "ar" ? "AR" : "ES")} pasoInicial={paso} />);
        expect(html).not.toMatch(/cada noche|una pregunta por noche|cada nit|etapa|Lisboa|con quién viaj|amb qui viatg|ángulo/i);
      }
    }
    // España de tú, no de vosotros.
    expect(Object.values(CHECKOUT_VIAJE.es).join(" ")).not.toMatch(/os escribe|vuestr/i);
    expect(render(PaginaViajeCa)).toContain('lang="ca-ES"');
  });

  it("paso 1: impreso (elegido) o PDF, y el álbum de 40 solo con su precio cargado", () => {
    const html = renderToStaticMarkup(<CheckoutViaje idioma="es" catalogo={catalogo("ES")} />);
    expect(html).toMatch(/<input(?=[^>]*value="impreso")(?=[^>]*checked="")[^>]*>/);
    expect(html).toContain('value="pdf"');
    expect(html).toContain('value="20"');
    expect(html).not.toContain('value="40"');
    process.env.PRECIO_VIAJE_ALBUM40_EUR = "59";
    try {
      expect(renderToStaticMarkup(<CheckoutViaje idioma="es" catalogo={catalogo("ES")} />)).toContain('value="40"');
    } finally {
      delete process.env.PRECIO_VIAJE_ALBUM40_EUR;
    }
    expect(estadoViajeInicial("es", false).formato).toBe("pdf");
  });

  it("paso 2: pide fechas válidas, mínimo 3 días, país; y el regalo pide quién regala", () => {
    const V = CHECKOUT_VIAJE.es;
    const hoy = "2027-06-01";
    const e = { ...estadoViajeInicial("es"), nombre: "Sara Ruiz", telefono: "+34 600 000 000", email: "sara@ejemplo.com", salida: "2027-06-02", vuelta: "2027-06-09", paisViaje: "portugal" };
    expect(fallaViaje(2, e, V, CHECKOUT.es, hoy)).toBeNull();
    expect(fallaViaje(2, { ...e, vuelta: "2027-06-01" }, V, CHECKOUT.es, hoy)?.texto).toBe(V.fechas.vueltaAntes);
    expect(fallaViaje(2, { ...e, vuelta: "2027-06-03" }, V, CHECKOUT.es, hoy)?.texto).toBe(V.fechas.muyCorto);
    expect(fallaViaje(2, { ...e, salida: "2027-05-30" }, V, CHECKOUT.es, hoy)?.texto).toBe(V.fechas.salidaPasada);
    expect(fallaViaje(2, { ...e, paisViaje: "" }, V, CHECKOUT.es, hoy)?.campo).toBe("pais-viaje");
    expect(fallaViaje(2, { ...e, paraMi: false }, V, CHECKOUT.es, hoy)?.campo).toBe("tu-nombre");
    expect(fallaViaje(2, { ...e, paraMi: false, tuNombre: "Ana" }, V, CHECKOUT.es, hoy)?.campo).toBe("quien-regala");
    expect(fallaViaje(2, { ...e, preguntas: ["a", "b", "c", "d", "e", "f"] }, V, CHECKOUT.es, hoy)?.texto).toBe(V.muchasPreguntas);
    expect(fallaViaje(3, { ...e, formato: "impreso" }, V, CHECKOUT.es, hoy)?.campo).toBe("recibe");
  });

  it("el cuerpo: contexto.viaje con los nombres del contrato del bot, sin ciudades", () => {
    const e = {
      ...estadoViajeInicial("es"), formato: "pdf" as const, album: 40 as const, paraMi: false, tuNombre: "Ana Ruiz", quienRegala: "mamá",
      nombre: "Sara Ruiz", telefono: "+34 600 000 000", email: "ana@ejemplo.com", salida: "2027-06-02", vuelta: "2027-06-09",
      paisViaje: "japon", preguntas: ["¿Qué comiste?", " "],
    };
    const c = cuerpoViaje(e, "es");
    expect(c).toMatchObject({ nombreComprador: "Ana Ruiz", region: "ES", idiomaWeb: "es", productos: { viaje: true, impresos: 0, marcos: 0 } });
    expect(c.vinculoComprador).not.toBe("yo mismo");
    expect(c.narrador).toMatchObject({ nombre: "Sara Ruiz", comoLeDicen: "Sara", horaPreferida: "21:30", zonaHoraria: "Europe/Madrid" });
    expect(c.narrador.contexto.viaje).toEqual({
      salida: "2027-06-02", vuelta: "2027-06-09", zonaCasa: "Europe/Madrid", zonaViaje: "Asia/Tokyo", horaNoche: "21:30",
      regalo: { quienRegala: "mamá" }, preguntasPropias: ["¿Qué comiste?"], formato: "pdf", fotosAlbum: 40, idioma: "es-ES",
    });
  });
});

describe("«Pedido confirmado»", () => {
  const pagina = async (params: Record<string, string>) =>
    renderToStaticMarkup(await (Gracias as unknown as (p: { searchParams: Promise<Record<string, string>> }) => Promise<ReactElement>)({ searchParams: Promise.resolve(params) }));

  it("sin sesión: la pantalla de respaldo, en el idioma de la vuelta, con «Entrar a la página de la historia»", async () => {
    const ca = await pagina({ idioma: "ca" });
    expect(ca).toContain('lang="ca-ES"');
    expect(ca).toContain(escapar(CONFIRMADO.ca.tituloGenerico));
    expect(ca).toContain(escapar(CONFIRMADO.ca.entrarAlPanel(false)));
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
    expect(html).toContain("El biógrafo de viaje");
    expect(html).toContain('data-producto="viaje"');
  });
});

describe("checkout etapa 1: textos y marco (Naza 06/11)", () => {
  const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const conPack = () => {
    process.env.PRECIO_PACK_EUR = "109";
  };
  const sinPack = () => {
    delete process.env.PRECIO_PACK_EUR;
  };

  it("con pack, la fila del impreso muestra la diferencia y al tocarla elige el libro completo", () => {
    conPack();
    try {
      const cat = catalogo("ES");
      const e = estadoInicial("es", cat);
      const elegidas: string[] = [];
      const el = (
        <OpcionesLibro cat={cat} base={cat.base.precio} estado={e} onElegir={(o) => elegidas.push(o)} onCambio={() => {}}
          textos={{ ...ES, titulo: ES.libroTitulo, cinta: ES.impresoEtiqueta }} tapa={{ titulo: "", idioma: "es" }} conPack formatear={eur} />
      );
      const html = renderToStaticMarkup(el);
      // 109 (pack) - 99 (base + impreso) = 10
      expect(html).toContain(escapar(ES.marcoFila(eur(10))));
      expect(html).toContain('data-oferta="marco"');
      expect(html).not.toContain(escapar(ES.marcoPrimeroTitulo));
      // Elegirla = la acción de la opción «marco» (el pack).
      expect(eleccionDe("marco", e).marcos).toBe(1);
      expect(precioDeOpcion("marco", cat.base.precio, cat, true)).toBe(109);
    } finally {
      sinPack();
    }
  });

  it("sin pack (o en Viaje, sin conPack) queda la fila de siempre", () => {
    sinPack();
    const cat = catalogo("ES");
    const e = estadoInicial("es", cat);
    for (const conPackProp of [true, false]) {
      const html = renderToStaticMarkup(
        <OpcionesLibro cat={cat} base={cat.base.precio} estado={e} onElegir={() => {}} onCambio={() => {}}
          textos={{ ...ES, titulo: ES.libroTitulo, cinta: ES.impresoEtiqueta }} tapa={{ titulo: "", idioma: "es" }} conPack={conPackProp} formatear={eur} />,
      );
      expect(html).not.toContain("data-oferta");
      expect(html).toContain(escapar(ES.marcoPrimeroTitulo));
    }
  });

  it("con pack, «impreso» nunca queda con marcos: la fila no vuelve a decir «+19 €»", () => {
    conPack();
    try {
      const cat = catalogo("ES");
      const hayPack = sumaSinPack(cat.base.precio, cat) !== null;
      expect(hayPack).toBe(true);
      const pinta = (estado: EstadoCompra) =>
        renderToStaticMarkup(
          <OpcionesLibro cat={cat} base={cat.base.precio} estado={estado} onElegir={() => {}} onCambio={() => {}}
            textos={{ ...ES, titulo: ES.libroTitulo, cinta: ES.impresoEtiqueta }} tapa={{ titulo: "", idioma: "es" }} conPack formatear={eur} />,
        );
      const inicial = estadoInicial("es", cat);

      // Camino 1: libro completo, un marco extra, y pasa a la opción impresa.
      const completo = { ...inicial, ...eleccionDe("marco", inicial, hayPack) };
      const conExtra = { ...completo, ...conMarcosParaRegalar(completo, 1) };
      expect(conExtra.marcos).toBe(2);
      const impreso = { ...conExtra, ...eleccionDe("impreso", conExtra, hayPack) };
      expect(impreso).toMatchObject({ formato: "impreso", marcos: 0, opcion: "impreso" });
      expect(pinta(impreso)).toContain('data-oferta="marco"');
      expect(pinta(impreso)).not.toContain(escapar(ES.marcoPrimeroTitulo));

      // Camino 2: lo guardado al volver de ?pago=fallido.
      const guardado = { ...inicial, opcion: "impreso" as const, marcos: 1 };
      const vuelto = normalizarConPack(guardado, hayPack);
      expect(vuelto).toMatchObject({ formato: "impreso", marcos: 1, opcion: "marco" });
      expect(opcionDe(vuelto)).toBe("marco");
      // El mismo carrito: lo que se cobra no cambia.
      expect(carritoDe(vuelto)).toEqual(carritoDe(guardado));
      const html = pinta(vuelto);
      expect(html).not.toContain(escapar(ES.marcoPrimeroTitulo));
      expect(html).toContain(`name="formato" checked="" value="marco"`);
      // El formulario lo usa al restaurar y al elegir.
      const fuente = readFileSync(resolve(__dirname, "../src/app/comprar/formulario.tsx"), "utf8");
      expect(fuente).toContain("normalizarConPack(guardado, sumaSinPack(cat.base.precio, cat) !== null)");
      expect(fuente).toContain("eleccionDe(o, e, sumaSinPack(cat.base.precio, cat) !== null)");
    } finally {
      sinPack();
    }
  });

  it("sin pack la regla no aplica: los marcos se conservan y lo guardado queda igual", () => {
    const tres = { formato: "impreso" as const, marcos: 3, opcion: "marco" as const };
    expect(eleccionDe("impreso", tres)).toEqual({ formato: "impreso", marcos: 2, opcion: "impreso" });
    expect(eleccionDe("impreso", tres, false)).toEqual({ formato: "impreso", marcos: 2, opcion: "impreso" });
    const guardado = { formato: "impreso" as const, marcos: 1, opcion: "impreso" as const };
    expect(normalizarConPack(guardado, false)).toBe(guardado);
    expect(opcionDe(normalizarConPack(guardado, false))).toBe("impreso");
    // Con pack, lo que no es «impreso con marcos» tampoco se toca.
    const digital = { formato: "digital" as const, marcos: 0, opcion: "digital" as const };
    expect(normalizarConPack(digital, true)).toBe(digital);
  });

  it("el botón de los pasos 1 y 2 dice «Seguir» y no quedan «Iniciar Vitácora» ni «Continuar» en el checkout", () => {
    for (const idioma of ["es", "ar"] as const) {
      for (const paso of [1, 2] as const) {
        const html = renderToStaticMarkup(<Checkout idioma={idioma} catalogo={catalogo(idioma === "ar" ? "AR" : "ES")} pasoInicial={paso} />);
        expect(html).toContain(">Seguir<");
        expect(html).not.toContain("Iniciar Vitácora");
        expect(html).not.toContain(">Continuar<");
      }
    }
  });

  it("los tres ítems debajo de las opciones salen en el paso 1", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    for (const x of ES.seguridad) expect(html).toContain(escapar(x));
    expect(html).toContain("chk-seguridad");
  });

  it("la nota «Si no sabe usarlo» sale en el paso 2 y en el pago, salvo en «Para mí»", () => {
    const cat = catalogo("ES");
    const hay = (paso: 2 | 3, para: EstadoCompra["para"]) =>
      renderToStaticMarkup(<Checkout idioma="es" catalogo={cat} pasoInicial={paso} estadoDePrueba={{ para }} />).includes(escapar(ES.notaUso.cuerpo));
    expect(hay(2, "padre")).toBe(true);
    expect(hay(3, "padre")).toBe(true);
    expect(hay(2, "yo")).toBe(false);
    expect(hay(3, "yo")).toBe(false);
  });

  it("las notas de la fecha de la tarjeta salen con Navidad y con otra fecha elegida", () => {
    const cat = catalogo("ES");
    const html = (cambios: Partial<EstadoCompra>) =>
      renderToStaticMarkup(<Checkout idioma="es" catalogo={cat} pasoInicial={2} estadoDePrueba={{ para: "padre", regalo: true, ...cambios }} />);
    const navidad = html({ modoFecha: "navidad", fechaEntrega: proximaNavidad(new Date()) });
    expect(navidad).toContain(escapar(ES.notaFecha.navidad.titulo));
    expect(navidad).toContain(escapar(ES.notaFecha.navidad.cuerpo));
    const otra = html({ modoFecha: "otra", fechaEntrega: "2027-03-01" });
    expect(otra).toContain(escapar(ES.notaFecha.otra.titulo));
    expect(otra).not.toContain(escapar(ES.notaFecha.navidad.titulo));
    expect(html({ modoFecha: "otra", fechaEntrega: "" })).not.toContain(escapar(ES.notaFecha.otra.titulo));
  });

  it("la nota de la fecha no sale con entrega automática ni con la tarjeta impresa", () => {
    const cat = catalogo("ES");
    const html = (cambios: Partial<EstadoCompra>) =>
      renderToStaticMarkup(<Checkout idioma="es" catalogo={cat} pasoInicial={2} estadoDePrueba={{ para: "padre", regalo: true, modoFecha: "navidad", fechaEntrega: proximaNavidad(new Date()), ...cambios }} />);
    const titulo = escapar(ES.notaFecha.navidad.titulo);
    expect(html({})).toContain(titulo);
    expect(html({ entrega: { canal: "whatsapp", contacto: "+34600000000", hora: 9 } })).not.toContain(titulo);
    expect(html({ tarjeta: { quiere: true } as EstadoCompra["tarjeta"] })).not.toContain(titulo);
    expect(html({ modoFecha: "otra", fechaEntrega: "2027-03-01", entrega: { canal: "whatsapp", contacto: "+34600000000", hora: 9 } })).not.toContain(escapar(ES.notaFecha.otra.titulo));
  });

  it("los 3 textos de pago y resumen nuevos, en es y ar", () => {
    expect(CHECKOUT.es.metodos).toBe("Pagas de forma segura con Stripe. Si tu móvil tiene Apple Pay o Google Pay, te aparecen ahí.");
    expect(CHECKOUT.ar.metodos).toBe("Pagás en Mercado Pago, con cuenta o sin cuenta.");
    expect(RESUMEN.es.incluye(false)[2]).toBe("Ves cómo avanza su libro desde la página de su historia");
    expect(RESUMEN.ar.incluye(false)[2]).toBe("Ves cómo avanza su libro desde la página de su historia");
    expect(RESUMEN.es.incluye(true)[2]).toBe("Escuchas tus audios desde la página de tu historia");
    expect(CHECKOUT.es.notaFecha.navidad.titulo).toBe("El 24 le das la tarjeta");
    expect(CHECKOUT.es.notaFecha.otra.titulo).toBe("Ese día le das la tarjeta");
  });

  it("los flags de garantía a la vista y de cuotas están apagados por defecto", () => {
    delete process.env.GARANTIA_A_LA_VISTA;
    delete process.env.CUOTAS_AR;
    const es = render(PaginaComprarEs);
    expect(es).not.toContain(`<p class="chk-nota-cuerpo">${escapar(ES.garantiaFamiliar)}`);
    const ar = render(PaginaComprarAr);
    expect(ar).not.toMatch(/3 cuotas de/);
    // La garantía sigue en la letra chica.
    const pagoEs = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} />);
    expect(pagoEs).toContain(escapar(ES.garantiaFamiliar));
    // Encendidos, la garantía va en una nota y sale de la letra chica; las cuotas solo en AR.
    const vista = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={3} garantiaALaVista cuotasAr />);
    expect(vista).toContain(`<p class="chk-nota-cuerpo">${escapar(ES.garantiaFamiliar)}</p>`);
    expect(vista).not.toMatch(/3 cuotas de/);
    const cuotas = renderToStaticMarkup(<Checkout idioma="ar" catalogo={catalogo("AR")} pasoInicial={3} cuotasAr />);
    expect(cuotas).toMatch(/3 cuotas de/);
  });

  it("la cabecera del celular es de un renglón: pago seguro y «Ya compré» solo desde sm", () => {
    const html = render(PaginaComprarEs);
    expect(html).not.toContain("flex-wrap items-center justify-between");
    expect(html).toMatch(/chk-cabecera-dato hidden[^"]*sm:flex/);
  });
});
