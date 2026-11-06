import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";

// El checkout en Acuarela (Naza 06/11): el cascarón con acu-tema y el acento de
// cada compra, el estante real solo en /comprar, y nada de la tinta de antes.

vi.mock("next/font/google", () => {
  const fuente = () => ({ variable: "fuente", className: "fuente", style: {} });
  return { Archivo: fuente, Playfair_Display: fuente, Source_Serif_4: fuente };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/comprar", useSearchParams: () => new URLSearchParams() }));

import { catalogo } from "@/lib/productos";
import { CascaronCheckout } from "../src/app/_checkout/cascaron";
import { OpcionesLibro } from "../src/app/_checkout/opciones-libro-ui";
import { Checkout } from "../src/app/comprar/formulario";
import { CheckoutViaje } from "../src/app/comprar/viaje/formulario";
import { CHECKOUT } from "../src/app/_textos/checkout";

const ES = CHECKOUT.es;
const fuente = (ruta: string) => readFileSync(resolve(__dirname, "../src/app", ruta), "utf8");
const repisa = (html: string) => html.slice(html.indexOf('class="chk-est-repisa"'), html.indexOf('class="chk-est-notas"'));

beforeEach(() => {
  process.env.PRECIO_EUR = "49";
  process.env.PRECIO_IMPRESO_EUR = "50";
  process.env.PRECIO_MARCO_EUR = "20";
  process.env.PRECIO_PACK_EUR = "109";
  process.env.PRECIO_VIAJE_EUR = "49";
});

describe("el cascarón", () => {
  const cascaron = (props: { viaje?: boolean; kids?: boolean; historia?: boolean } = {}) =>
    renderToStaticMarkup(
      <CascaronCheckout idioma="es" {...props}>
        <p>hoja</p>
      </CascaronCheckout>,
    );

  it("lleva acu-tema y el acento de cada compra", () => {
    expect(cascaron()).toContain("acu-tema acu-acento-familiar");
    expect(cascaron({ viaje: true })).toContain("acu-tema acu-acento-viaje");
    expect(cascaron({ kids: true })).toContain("acu-tema acu-acento-kids");
    expect(cascaron({ historia: true })).toContain("acu-tema acu-acento-historia");
  });

  it("sin la cabecera en tinta ni el borde cortado", () => {
    const html = cascaron();
    expect(html).toContain('class="chk-cabecera"');
    expect(html).not.toContain("dir-tinta");
    expect(html).not.toContain("dir-deckle");
  });

  it("carga la acuarela, y la paleta de noche de Viaje ya no existe", () => {
    expect(fuente("_checkout/cascaron.tsx")).toContain('import "../_portada/acuarela.css"');
    expect(fuente("_checkout/checkout.css")).not.toContain('data-producto="viaje"');
    expect(fuente("_direccion/direccion.css")).not.toContain("viaje.css");
  });
});

describe("no queda tinta en el checkout", () => {
  it("ni en el código de las compras ni en lo que se pinta", () => {
    for (const archivo of ["_checkout/piezas.tsx", "comprar/formulario.tsx", "comprar/viaje/formulario.tsx", "comprar/kids/formulario.tsx", "regalar/formulario.tsx", "comprar/gracias/page.tsx", "comprar/gracias/loading.tsx"]) {
      expect(fuente(archivo), archivo).not.toMatch(/dir-tinta|dir-deckle/);
    }
    for (const paso of [1, 2, 3] as const) {
      expect(renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} pasoInicial={paso} />)).not.toContain("dir-tinta");
    }
  });

  it("el resumen es una nota de papel", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(html).toContain("chk-ficha acu-nota acu-tinte-5");
  });
});

describe("el estante del paso 1", () => {
  it("sale en /comprar, con la foto real y un libro por opción", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(html).toContain('class="chk-est-repisa"');
    expect(fuente("_checkout/checkout.css")).toMatch(/\.chk-est-repisa \{[^}]*url\("\/rediseno\/estante\.jpg"\)/);
    expect(repisa(html).match(/class="chk-est-hueco"/g)).toHaveLength(3);
    expect(repisa(html).match(/aspect-\[148\/210\]|h-full/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("no sale en Historia ni en Viaje, que conservan su lista", () => {
    const historia = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} historia />);
    expect(historia).not.toContain("chk-est-repisa");
    expect(historia).toContain('class="chk-op"');
    const viaje = renderToStaticMarkup(<CheckoutViaje idioma="es" catalogo={catalogo("ES")} />);
    expect(viaje).not.toContain("chk-est-repisa");
    expect(viaje).toContain("m-card");
  });

  it("los radios siguen siendo nativos: el libro y la nota son labels del mismo", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(html.match(/<input[^>]*name="formato"[^>]*>/g)).toHaveLength(3);
    for (const o of ["marco", "impreso", "digital"]) {
      expect(html).toContain(`for="formato-${o}"`);
      expect(html).toMatch(new RegExp(`<input(?=[^>]*type="radio")(?=[^>]*id="formato-${o}")(?=[^>]*value="${o}")[^>]*>`));
    }
    // El libro no se lee dos veces: el nombre del radio es el de la nota.
    expect(repisa(html)).toContain('aria-hidden="true" class="chk-est-grupo"');
  });

  it("el libro elegido se marca, y una sola vez", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(repisa(html).match(/data-elegido="true"/g)).toHaveLength(1);
    expect(repisa(html)).toMatch(/for="formato-impreso"[^>]*data-elegido="true"/);
  });

  it("cada opción con su nota de color, y los extras en la nota de la elegida", () => {
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    for (const [o, tinte] of [["marco", 1], ["impreso", 2], ["digital", 3]] as const) {
      expect(html).toContain(`class="chk-op chk-est-nota acu-nota acu-tinte-${tinte}" data-opcion="${o}"`);
    }
    const elegida = html.indexOf("chk-est-elegida acu-nota acu-tinte-2");
    expect(elegida).toBeGreaterThan(html.indexOf('data-opcion="digital"'));
    expect(html.indexOf('class="chk-extras"')).toBeGreaterThan(elegida);
  });

  it("con una sola opción no hay nada que elegir: va la lista", () => {
    delete process.env.PRECIO_IMPRESO_EUR;
    const html = renderToStaticMarkup(<Checkout idioma="es" catalogo={catalogo("ES")} />);
    expect(html).not.toContain("chk-est-repisa");
  });

  it("la lista de siempre no cambia si no se pide el estante", () => {
    const html = renderToStaticMarkup(
      <OpcionesLibro cat={catalogo("ES")} base={49} estado={{ formato: "impreso", marcos: 0, copias: 0 }} onElegir={() => {}} onCambio={() => {}} textos={{ ...ES, titulo: ES.libroTitulo }} tapa={{ titulo: "", idioma: "es" }} conPack formatear={String} />,
    );
    expect(html).not.toContain("chk-est");
    expect(html).toContain("chk-mini");
  });

  it("el libro de viaje en 3D conserva su estética: las reglas de l3--viaje están en globals.css", () => {
    expect(fuente("_direccion/libro-3d.tsx")).toContain("l3--viaje");
    const css = fuente("globals.css");
    for (const selector of [".l3--viaje .l3-frente .l3-papel-tapa", ".l3--viaje .l3-lomo-cara", ".l3--viaje .l3-escucha"]) expect(css).toContain(selector);
    expect(css).toMatch(/\.l3--viaje \.l3-guarda \{ background-color: #111a2c; \}/);
  });

  it("el estante escala los libros según cuántas opciones hay, y el aviso de cookies no tapa el final", () => {
    const css = fuente("_checkout/checkout.css");
    expect(css).toMatch(/\.chk-est-libro \{[^}]*width: calc\(52% \* var\(--n, 3\) \/ 3\)/);
    expect(css).toMatch(/\.chk-est-pantalla \{[^}]*width: calc\(42% \* var\(--n, 3\) \/ 3\)/);
    expect(css).toMatch(/\.chk-con-barra \{ padding-bottom: calc\(136px \+ env\(safe-area-inset-bottom\) \+ var\(--alto-aviso, 0px\)\); \}/);
  });

  it("nada se pisa y el movimiento respeta a quien no lo quiere", () => {
    const css = fuente("_checkout/checkout.css");
    // Las notas no suben sobre el estante: el aire entre los dos es positivo y no hay margen negativo.
    expect(css).toMatch(/\.chk-est \{[^}]*gap: 20px/);
    expect(css).toMatch(/\.chk \.chk-est-nota \{[^}]*margin: 0/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.chk-est-grupo \{ transition: none; \}/);
  });
});
