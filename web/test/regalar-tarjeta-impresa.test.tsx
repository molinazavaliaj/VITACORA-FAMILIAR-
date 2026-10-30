import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { catalogo } from "../src/lib/productos";
import { textosComprador } from "../src/lib/regalo-textos";
import { cuerpoCompra, type PedidoRegalo } from "../src/app/regalar/enviar";
import { FormularioRegalo } from "../src/app/regalar/formulario";
import { COMPRADOR_WEB } from "../src/app/_textos/regalar";
import {
  CamposTarjeta, compraDelRegalo, errorDeTarjeta, SIN_TARJETA, tarjetaParaEnviar, type EleccionTarjeta,
} from "../src/app/regalar/tarjeta-impresa";

// La tarjeta impresa en un sobre por correo (30/10), en /regalar: la casilla
// del paso 3, la dirección, el ticket y lo que viaja a /api/compra.

const TU = textosComprador("tu");
const T = TU.tarjeta;
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);
const HOY = new Date("2026-10-30T12:00:00Z");
const nada = () => {};
const ENV = { ...process.env };

beforeEach(() => {
  process.env.PRECIO_EUR = "59";
  process.env.PRECIO_TARJETA_EUR = "4";
});
afterEach(() => {
  process.env = { ...ENV };
});

const LLENA: EleccionTarjeta = { quiere: true, aNombreDe: " Lucía ", linea1: "Calle Mayor 12", linea2: "", ciudad: "Valladolid", provincia: " ", cp: "47001" };

function render(o: { fecha?: string; eleccion?: EleccionTarjeta } = {}) {
  return renderToStaticMarkup(
    <CamposTarjeta catalogo={catalogo("ES")} region="ES" fecha={o.fecha ?? ""} ahora={HOY} eleccion={o.eleccion ?? SIN_TARJETA} onCambio={nada} textos={T} marca={() => ({})} />,
  );
}

describe("CamposTarjeta", () => {
  it("sin PRECIO_TARJETA_EUR no aparece nada", () => {
    delete process.env.PRECIO_TARJETA_EUR;
    expect(render()).toBe("");
  });
  it("sin fecha: la casilla con su precio y el detalle, sin la dirección", () => {
    const html = render();
    expect(html).toContain('type="checkbox"');
    expect(html).toContain(escapar(T.casilla));
    expect(html).toContain(escapar(T.detalle));
    expect(html).toContain("+ 4");
    expect(html).not.toContain(escapar(T.aNombreDe));
  });
  it("con la fecha a menos de 7 días: en vez de la casilla, el aviso", () => {
    const html = render({ fecha: "2026-11-02" });
    expect(html).not.toContain('type="checkbox"');
    expect(html).toContain(escapar(T.fechaCerca));
  });
  it("con la fecha a 7 días o más, la casilla", () => {
    expect(render({ fecha: "2026-11-06" })).toContain('type="checkbox"');
  });
  it("marcada pide a nombre de quién y la dirección, con España fija (sin campo)", () => {
    const html = render({ eleccion: { ...SIN_TARJETA, quiere: true } });
    expect(html).toContain(escapar(T.aNombreDe));
    expect(html).toContain(escapar(T.aNombreDePista));
    for (const c of ["linea1", "linea2", "ciudad", "provincia", "cp"] as const) {
      expect(html).toContain(escapar(T.campos[c]));
      expect(html).toContain(`id="tarjeta-${c}"`);
    }
    expect(html).not.toContain('id="tarjeta-pais"');
    expect(html).toContain(">España<");
    expect(html).toContain('maxLength="100"');
  });
});

describe("errorDeTarjeta y tarjetaParaEnviar", () => {
  it("sin marcar no hay error ni nada que mandar", () => {
    expect(errorDeTarjeta(SIN_TARJETA, T)).toBeNull();
    expect(tarjetaParaEnviar(SIN_TARJETA)).toBeNull();
  });
  it("marca el campo que falta", () => {
    expect(errorDeTarjeta({ ...LLENA, aNombreDe: " " }, T)).toEqual({ texto: T.faltaANombreDe, campo: "tarjeta-aNombreDe" });
    expect(errorDeTarjeta({ ...LLENA, cp: "" }, T)).toEqual({ texto: "Falta código postal.", campo: "tarjeta-cp" });
    expect(errorDeTarjeta(LLENA, T)).toBeNull();
  });
  it("manda la dirección limpia, sin opcionales vacíos y con país España", () => {
    expect(tarjetaParaEnviar(LLENA)).toEqual({
      aNombreDe: "Lucía",
      direccion: { linea1: "Calle Mayor 12", ciudad: "Valladolid", cp: "47001", pais: "España" },
    });
  });
});

describe("el ticket del regalo", () => {
  it("la base sola, o la base más la tarjeta (la misma cuenta que el servidor)", () => {
    const cat = catalogo("ES");
    expect(compraDelRegalo(cat, "ES", false).total).toBe(59);
    const con = compraDelRegalo(cat, "ES", true);
    expect(con.lineas.map((l) => l.id)).toEqual(["pdf", "tarjeta"]);
    expect(con.total).toBe(63);
  });
});

describe("FormularioRegalo, paso 3", () => {
  it("con precio, la casilla aparece debajo del correo", () => {
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo("ES")} region="ES" pasoInicial={3} />);
    expect(html.indexOf(escapar(T.casilla))).toBeGreaterThan(html.indexOf('id="email"'));
  });
  it("sin precio no aparece", () => {
    delete process.env.PRECIO_TARJETA_EUR;
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo("ES")} region="ES" pasoInicial={3} />);
    expect(html).not.toContain(escapar(T.casilla));
  });
  it("en catalán, con sus textos", () => {
    const html = renderToStaticMarkup(<FormularioRegalo catalogo={catalogo("ES")} region="ES" pasoInicial={3} idiomaWeb="ca" />);
    expect(html).toContain(escapar(COMPRADOR_WEB.ca.tarjeta.casilla));
  });
});

describe("cuerpoCompra", () => {
  const pedido = (extra: Partial<PedidoRegalo> = {}): PedidoRegalo => ({
    nombre: "Héctor", comoLeDicen: "abuelo", genero: "varon", mensaje: "Hola", fechaEntrega: "", nombreComprador: "Lucía",
    vinculoComprador: "nieta", email: "lucia@ejemplo.com", region: "ES", idioma: "es-ES", audio: null, entrega: null, ...extra,
  });
  it("con la tarjeta, la manda en regalo.tarjeta y los productos de siempre", () => {
    const tarjeta = tarjetaParaEnviar(LLENA);
    const cuerpo = cuerpoCompra(pedido({ tarjeta }));
    expect(cuerpo.regalo).toMatchObject({ tarjeta });
    expect(cuerpo.productos).toEqual({ impresos: 0, marcos: 0 });
  });
  it("sin la tarjeta, no hay clave", () => {
    expect(cuerpoCompra(pedido()).regalo).not.toHaveProperty("tarjeta");
    expect(cuerpoCompra(pedido({ tarjeta: null })).regalo).not.toHaveProperty("tarjeta");
  });
});

describe("los textos de la tarjeta impresa", () => {
  const todos = [textosComprador("vos").tarjeta, T, COMPRADOR_WEB.ca.tarjeta];
  const strings = (t: typeof T) => [...Object.values(t).filter((v): v is string => typeof v === "string"), ...Object.values(t.campos), t.faltaCampo("Ciudad")];
  it("sin dos puntos, sin «. Y» y sin vacíos, en vos, tú y catalán", () => {
    for (const t of todos) {
      for (const s of strings(t)) {
        expect(s.trim()).not.toBe("");
        expect(s).not.toContain(":");
        expect(s).not.toMatch(/\.\s+Y\s/);
      }
    }
  });
  it("de tú dice «Tú» y de vos «Vos»", () => {
    expect(T.aNombreDePista).toBe("Tú o quien la recibe");
    expect(textosComprador("vos").tarjeta.aNombreDePista).toBe("Vos o quien la recibe");
  });
});
