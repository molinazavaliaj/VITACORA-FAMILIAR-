import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { catalogo } from "../src/lib/productos";
import { textosComprador } from "../src/lib/regalo-textos";
import { COMPRADOR_WEB } from "../src/app/_textos/regalar";
import { CHECKOUT } from "../src/app/_textos/checkout";
import {
  CamposTarjeta, errorDeTarjeta, SIN_TARJETA, tarjetaParaEnviar, type EleccionTarjeta,
} from "../src/app/_checkout/tarjeta-impresa";
import { carritoDe, cuerpoDeLaCompra, estadoInicial, fallaDelPaso, quiereTarjeta, tarjetaDeLaCompra, type EstadoCompra } from "../src/app/comprar/compra";
import { armarCompra } from "../src/lib/productos";

// La tarjeta impresa en un sobre por correo (30/10), en /comprar cuando es un
// regalo (/regalar lleva ahí desde el 26/10): la casilla del paso del pago, la
// dirección (o la del libro impreso), el ticket y lo que viaja a /api/compra.

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

/** Un regalo de /comprar listo para pagar, en digital, sin fecha. */
function regaloListo(cambios: Partial<EstadoCompra> = {}): EstadoCompra {
  return {
    ...estadoInicial("es", catalogo("ES")),
    formato: "digital",
    marcos: 0,
    opcion: undefined,
    para: "abuelo",
    nombre: "Héctor García",
    comoLeDicen: "Héctor",
    regalo: true,
    mensaje: "Para que nos cuentes",
    email: "lucia@ejemplo.com",
    nombreComprador: "Lucía",
    vinculo: "nieta",
    ...cambios,
  };
}
const ES = CHECKOUT.es;
const ENTREGA = TU.entrega;
const lejos = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const cerca = () => new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const DIR_LIBRO = { linea1: "Calle Mayor 12", ciudad: "Valladolid", cp: "47001", pais: "España" };

describe("/comprar con la tarjeta impresa", () => {
  it("solo va si es regalo, la marcó y la fecha deja tiempo", () => {
    const cat = catalogo("ES");
    expect(quiereTarjeta(regaloListo({ tarjeta: LLENA }), HOY, cat)).toBe(true);
    expect(quiereTarjeta(regaloListo(), HOY, cat)).toBe(false);
    expect(quiereTarjeta(regaloListo({ tarjeta: LLENA, regalo: false }), HOY, cat)).toBe(false);
    expect(quiereTarjeta(regaloListo({ tarjeta: LLENA, fechaEntrega: "2026-11-02" }), HOY, cat)).toBe(false);
    delete process.env.PRECIO_TARJETA_EUR;
    expect(quiereTarjeta(regaloListo({ tarjeta: LLENA }), HOY, catalogo("ES"))).toBe(false);
  });

  it("el ticket suma la tarjeta con la misma cuenta que el servidor, también con el libro impreso", () => {
    process.env.PRECIO_IMPRESO_EUR = "50";
    const cat = catalogo("ES");
    const digital = regaloListo({ tarjeta: LLENA });
    expect(armarCompra(cat, "ES", { ...carritoDe(digital), tarjeta: quiereTarjeta(digital, HOY, cat) }).total).toBe(63);
    const impreso = regaloListo({ formato: "impreso", tarjeta: LLENA });
    const c = armarCompra(cat, "ES", { ...carritoDe(impreso), tarjeta: quiereTarjeta(impreso, HOY, cat) });
    expect(c.lineas.map((l) => l.id)).toEqual(["pdf", "impreso", "tarjeta"]);
    expect(c.total).toBe(113);
  });

  it("el cuerpo lleva regalo.tarjeta con su dirección; sin marcarla o sin regalo, no", () => {
    const e = regaloListo({ tarjeta: LLENA, fechaEntrega: lejos() });
    expect(cuerpoDeLaCompra(e, "es").regalo).toMatchObject({ tarjeta: tarjetaParaEnviar(LLENA) });
    expect(cuerpoDeLaCompra(regaloListo(), "es").regalo).not.toHaveProperty("tarjeta");
    expect(cuerpoDeLaCompra(regaloListo({ tarjeta: LLENA, fechaEntrega: cerca() }), "es").regalo).not.toHaveProperty("tarjeta");
  });

  it("con el libro impreso, el sobre va a la dirección del libro, a nombre de quien recibe si no escribió otro", () => {
    const e = regaloListo({ formato: "impreso", recibe: "Lucía García", telefonoRecibe: "612 345 678", direccion: DIR_LIBRO, tarjeta: { ...SIN_TARJETA, quiere: true } });
    expect(tarjetaDeLaCompra(e)).toEqual({ aNombreDe: "Lucía García", direccion: DIR_LIBRO });
    expect(tarjetaDeLaCompra({ ...e, tarjeta: { ...SIN_TARJETA, quiere: true, aNombreDe: "Héctor" } })?.aNombreDe).toBe("Héctor");
  });

  it("en el paso del pago marca lo que falta de la tarjeta, y la dirección del libro tiene que ser de España", () => {
    expect(fallaDelPaso(3, regaloListo({ tarjeta: LLENA }), ES, ENTREGA, HOY, undefined, T)).toBeNull();
    expect(fallaDelPaso(3, regaloListo({ tarjeta: { ...LLENA, ciudad: "" } }), ES, ENTREGA, HOY, undefined, T)).toEqual({ texto: "Falta ciudad.", campo: "tarjeta-ciudad" });
    const impreso = regaloListo({ formato: "impreso", recibe: "Lucía", telefonoRecibe: "612 345 678", direccion: DIR_LIBRO, tarjeta: { ...SIN_TARJETA, quiere: true } });
    expect(fallaDelPaso(3, impreso, ES, ENTREGA, HOY, undefined, T)).toBeNull();
    expect(fallaDelPaso(3, { ...impreso, direccion: { ...DIR_LIBRO, pais: "Francia" } }, ES, ENTREGA, HOY, undefined, T)).toEqual({ texto: T.soloEspana, campo: "direccion" });
    // Sin marcarla, nada cambia.
    expect(fallaDelPaso(3, regaloListo({ tarjeta: { ...SIN_TARJETA, ciudad: "" } }), ES, ENTREGA, HOY, undefined, T)).toBeNull();
  });

  it("con el libro impreso la casilla solo pide a nombre de quién, sin otra dirección", () => {
    const html = renderToStaticMarkup(
      <CamposTarjeta catalogo={catalogo("ES")} region="ES" fecha="" ahora={HOY} eleccion={{ ...SIN_TARJETA, quiere: true }} onCambio={nada} textos={T} marca={() => ({})} conDireccionDelLibro />,
    );
    expect(html).toContain('id="tarjeta-aNombreDe"');
    expect(html).toContain(escapar(T.mismaDireccion));
    expect(html).not.toContain('id="tarjeta-linea1"');
    expect(html).not.toContain(">España<");
  });

  it("en catalán, con sus textos", () => {
    const html = renderToStaticMarkup(
      <CamposTarjeta catalogo={catalogo("ES")} region="ES" fecha="" ahora={HOY} eleccion={SIN_TARJETA} onCambio={nada} textos={COMPRADOR_WEB.ca.tarjeta} marca={() => ({})} />,
    );
    expect(html).toContain(escapar(COMPRADOR_WEB.ca.tarjeta.casilla));
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
