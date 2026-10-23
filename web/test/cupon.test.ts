import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("stripe", () => ({ default: vi.fn() }));
vi.mock("mercadopago", () => ({ MercadoPagoConfig: vi.fn(), Preference: vi.fn(), Payment: vi.fn() }));

import Stripe from "stripe";
import { Preference } from "mercadopago";
import {
  aplicarCupon,
  generarCodigoCupon,
  hoyEn,
  importeDelCupon,
  lineasParaCobrar,
  normalizarCodigo,
  recordatorioQueToca,
  validarCupon,
  venceEl,
  vigente,
  type FilaCupon,
} from "../src/lib/cupon";
import { calcularCompra, catalogo } from "../src/lib/productos";
import { crearCheckout } from "../src/lib/pagos";
import { armarMailConfirmarCupon, armarMailCupon, armarMailRecordatorio } from "../src/lib/mail-cupon";
import { verificarToken } from "../src/lib/token-firmado";
import { TEXTOS_CUPON } from "../src/app/_textos/cupon";
import { BASES_CUPON, privacidadConCupon } from "../src/app/_textos/legal-cupon";
import { TEXTOS_LEGAL } from "../src/app/_textos/legal";

// El cupón de bienvenida del rasca y gana (20/10): 10 % del libro digital,
// también dentro del pack; un uso; 30 días con el último incluido; solo en su
// país; nunca con la promo global; hasta 4 recordatorios en 14 días.

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

beforeEach(() => {
  process.env.PRECIO_EUR = "49";
  process.env.PRECIO_ARS = "85750";
  process.env.PRECIO_IMPRESO_EUR = "40";
  process.env.PRECIO_MARCO_EUR = "30";
  process.env.PRECIO_PACK_EUR = "109";
  process.env.PRECIO_COPIA_EUR = "25";
  process.env.URL_BASE = "https://vitacorafamiliar.com";
});

const DIA = 24 * 60 * 60 * 1000;

function fila(cambios: Partial<FilaCupon> = {}): FilaCupon {
  return {
    id: "c1",
    codigo: "VITACORA10-ABCDEF",
    email: "ana@ejemplo.com",
    region: "ES",
    idioma: "es",
    porcentaje: 10,
    acepta_recordatorios: true,
    created_at: "2026-10-20T10:00:00Z",
    confirmado_at: "2026-10-20T10:05:00Z",
    vence_el: "2026-11-19",
    recordatorios_enviados: 0,
    ultimo_recordatorio_at: null,
    baja_at: null,
    usado_at: null,
    ...cambios,
  };
}

describe("el código", () => {
  it("tiene la forma VITACORA10-XXXXXX sin letras que se confunden", () => {
    for (let i = 0; i < 200; i++) expect(generarCodigoCupon()).toMatch(/^VITACORA10-[A-HJKMNP-Z2-9]{6}$/);
  });

  it("se normaliza como lo escribe la gente: minúsculas, espacios, sin guion", () => {
    expect(normalizarCodigo(" vitacora10-abc234 ")).toBe("VITACORA10-ABC234");
    expect(normalizarCodigo("VITACORA10 ABC234")).toBe("VITACORA10-ABC234");
    expect(normalizarCodigo("VITACORA10ABC234")).toBe("VITACORA10-ABC234");
    expect(normalizarCodigo("VITACORA10-ABC10O")).toBeNull(); // 1, 0 y O no existen
    expect(normalizarCodigo("OTRO-ABC234")).toBeNull();
    expect(normalizarCodigo(42)).toBeNull();
  });
});

describe("las fechas, en el calendario del país", () => {
  it("vence 30 días después del día de la confirmación, y el último día vale", () => {
    const confirmado = new Date("2026-10-20T10:00:00Z");
    expect(venceEl("ES", confirmado)).toBe("2026-11-19");
    expect(vigente("2026-11-19", "ES", new Date("2026-11-19T22:30:00Z"))).toBe(true); // 23:30 en Madrid
    expect(vigente("2026-11-19", "ES", new Date("2026-11-19T23:30:00Z"))).toBe(false); // 00:30 del 20 en Madrid
  });

  it("usa la fecha del país: de noche en Buenos Aires todavía es el día anterior", () => {
    const tarde = new Date("2026-10-21T01:30:00Z"); // 22:30 del 20 en Buenos Aires
    expect(hoyEn("AR", tarde)).toBe("2026-10-20");
    expect(hoyEn("ES", tarde)).toBe("2026-10-21");
    expect(venceEl("AR", tarde)).toBe("2026-11-19");
  });
});

describe("¿se puede usar?", () => {
  const ahora = new Date("2026-10-25T12:00:00Z");
  it("sí, confirmado, de su país, sin usar y sin vencer", () => {
    expect(validarCupon(fila(), "ES", ahora, null)).toEqual({ ok: true, codigo: "VITACORA10-ABCDEF", porcentaje: 10 });
  });
  it.each([
    ["no_existe", null, "ES", null],
    ["otra_region", fila(), "AR", null],
    ["sin_confirmar", fila({ confirmado_at: null, vence_el: null }), "ES", null],
    ["usado", fila({ usado_at: "2026-10-22T10:00:00Z" }), "ES", null],
    ["vencido", fila({ vence_el: "2026-10-24" }), "ES", null],
    ["con_promo", fila(), "ES", 20],
  ] as const)("no: %s", (motivo, f, region, promo) => {
    expect(validarCupon(f, region, ahora, promo)).toEqual({ ok: false, motivo });
  });
});

describe("la cuenta (siempre del servidor)", () => {
  it("10 % del libro digital de la región: 4,90 € y $ 8.575", () => {
    expect(importeDelCupon(catalogo("ES"), 10)).toBe(4.9);
    expect(importeDelCupon(catalogo("AR"), 10)).toBe(8575);
  });

  it("solo el PDF: 49 € → 44,10 €", () => {
    const c = aplicarCupon(calcularCompra("ES", { base: "pdf", impresos: 0, marcos: 0 }), catalogo("ES"), { codigo: "X", porcentaje: 10 });
    expect(c?.total).toBe(44.1);
    expect(c?.descuento).toEqual({ codigo: "X", porcentaje: 10, importe: 4.9 });
  });

  it("con impreso, copias y marcos: el descuento es el del digital, no del total", () => {
    const sin = calcularCompra("ES", { base: "pdf", impresos: 2, marcos: 0 });
    const con = aplicarCupon(sin, catalogo("ES"), { codigo: "X", porcentaje: 10 });
    expect(con?.total).toBe(Math.round((sin.total - 4.9) * 100) / 100);
  });

  it("con el pack: el 10 % del digital que trae el pack (109 € → 104,10 €)", () => {
    const pack = calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 1 });
    expect(pack.lineas.map((l) => l.id)).toEqual(["pack"]);
    expect(aplicarCupon(pack, catalogo("ES"), { codigo: "X", porcentaje: 10 })?.total).toBe(104.1);
  });

  it("sin libro digital (un pedido de extras del panel) no aplica", () => {
    const extras = calcularCompra("ES", { base: null, impresos: 0, marcos: 0, impresosPrevios: 1 });
    expect(aplicarCupon({ ...extras, lineas: [{ id: "copia", nombre: "Copia", cantidad: 1, precioUnitario: 25 }], total: 25 }, catalogo("ES"), { codigo: "X", porcentaje: 10 })).toBeNull();
  });

  it("a la pasarela: el descuento se resta de la línea del digital y la suma da el total", () => {
    const con = aplicarCupon(calcularCompra("ES", { base: "pdf", impresos: 3, marcos: 0 }), catalogo("ES"), { codigo: "X", porcentaje: 10 })!;
    const lineas = lineasParaCobrar(con);
    expect(lineas[0]).toMatchObject({ id: "pdf", precioUnitario: 44.1 });
    expect(lineas[0].nombre).toContain("Cupón de bienvenida");
    expect(lineas.slice(1)).toEqual(con.lineas.slice(1));
    expect(Math.round(lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0) * 100) / 100).toBe(con.total);
  });

  it("sin cupón, las líneas de siempre", () => {
    const c = calcularCompra("ES", { base: "pdf", impresos: 1, marcos: 0 });
    expect(lineasParaCobrar(c)).toBe(c.lineas);
  });
});

describe("Stripe y Mercado Pago cobran el total con el descuento", () => {
  it("Stripe: 4410 céntimos por el PDF", async () => {
    const crear = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/x" });
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { checkout: { sessions: { create: crear } } };
    });
    const compra = aplicarCupon(calcularCompra("ES", { base: "pdf", impresos: 0, marcos: 0 }), catalogo("ES"), { codigo: "X", porcentaje: 10 })!;
    await crearCheckout({ id: "p1", email: "ana@ejemplo.com" }, compra);
    const args = crear.mock.calls[0][0] as { line_items: { price_data: { unit_amount: number } }[] };
    expect(args.line_items.map((l) => l.price_data.unit_amount)).toEqual([4410]);
  });

  it("Mercado Pago: $ 77.175 por el PDF", async () => {
    const crear = vi.fn().mockResolvedValue({ init_point: "https://mp.example/x" });
    (Preference as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { create: crear };
    });
    const compra = aplicarCupon(calcularCompra("AR", { base: "pdf", impresos: 0, marcos: 0 }), catalogo("AR"), { codigo: "X", porcentaje: 10 })!;
    await crearCheckout({ id: "p2", email: "juan@ejemplo.com" }, compra);
    const args = crear.mock.calls[0][0] as { body: { items: { unit_price: number }[] } };
    expect(args.body.items.map((l) => l.unit_price)).toEqual([77175]);
  });
});

describe("los recordatorios: hasta 4, en 14 días, solo con la segunda casilla", () => {
  const confirmado = new Date("2026-10-20T10:05:00Z").getTime();
  const en = (dias: number) => new Date(confirmado + dias * DIA + 60_000);

  it("salen los días 2, 5, 9 y 13", () => {
    expect(recordatorioQueToca(fila(), en(1))).toBeNull();
    expect(recordatorioQueToca(fila(), en(2))).toBe(1);
    expect(recordatorioQueToca(fila({ recordatorios_enviados: 1, ultimo_recordatorio_at: en(2).toISOString() }), en(4))).toBeNull();
    expect(recordatorioQueToca(fila({ recordatorios_enviados: 1, ultimo_recordatorio_at: en(2).toISOString() }), en(5))).toBe(2);
    expect(recordatorioQueToca(fila({ recordatorios_enviados: 2, ultimo_recordatorio_at: en(5).toISOString() }), en(9))).toBe(3);
    expect(recordatorioQueToca(fila({ recordatorios_enviados: 3, ultimo_recordatorio_at: en(9).toISOString() }), en(13))).toBe(4);
  });

  it("nunca un quinto, ni después de los 14 días", () => {
    expect(recordatorioQueToca(fila({ recordatorios_enviados: 4 }), en(13.5))).toBeNull();
    expect(recordatorioQueToca(fila({ recordatorios_enviados: 2 }), en(14.1))).toBeNull();
  });

  it("si el cron se atrasó, uno por día y no dos juntos", () => {
    expect(recordatorioQueToca(fila({ recordatorios_enviados: 1, ultimo_recordatorio_at: en(10).toISOString() }), en(10.2))).toBeNull();
  });

  it.each([
    ["sin la segunda casilla", { acepta_recordatorios: false }],
    ["sin confirmar", { confirmado_at: null, vence_el: null }],
    ["de baja", { baja_at: "2026-10-21T10:00:00Z" }],
    ["ya usado", { usado_at: "2026-10-21T10:00:00Z" }],
  ] as const)("no salen %s", (_, cambios) => {
    expect(recordatorioQueToca(fila(cambios), en(2))).toBeNull();
  });
});

describe("los mails", () => {
  it("el de confirmar trae el botón firmado y no el código", () => {
    const m = armarMailConfirmarCupon(fila({ confirmado_at: null, vence_el: null }));
    expect(m.texto).not.toContain("VITACORA10-ABCDEF");
    const url = /https:\/\/vitacorafamiliar\.com\/cupon\/confirmar\?c=c1&t=([^\s"&]+)/.exec(m.texto);
    expect(url && verificarToken("cupon-confirmar", url[1], "c1")).toBe(true);
  });

  it("el del código trae el código, la fecha exacta y el link para usarlo", () => {
    const m = armarMailCupon({ ...fila(), vence_el: "2026-11-19" });
    expect(m.texto).toContain("VITACORA10-ABCDEF");
    expect(m.texto).toContain("19 de noviembre de 2026");
    expect(m.texto).toContain("/comprar?cupon=VITACORA10-ABCDEF");
    expect(m.texto).toContain("/legal/cupon");
  });

  it("sin la segunda casilla, el del código no habla de recordatorios ni lleva baja", () => {
    const m = armarMailCupon({ ...fila({ acepta_recordatorios: false }), vence_el: "2026-11-19" });
    expect(m.texto).not.toContain(TEXTOS_CUPON.es.mail.cupon.conRecordatorios);
    expect(m.texto).not.toContain("/api/cupon/baja");
  });

  it("los recordatorios dicen PUBLICIDAD, cuál de los 4 es y traen la baja de un clic", () => {
    for (const n of [1, 2, 3, 4] as const) {
      const m = armarMailRecordatorio({ ...fila(), vence_el: "2026-11-19" }, n);
      expect(m.asunto.startsWith("Publicidad")).toBe(true);
      expect(m.texto.startsWith("PUBLICIDAD")).toBe(true);
      expect(m.texto).toContain(`${n} de 4`);
      const t = new URL(m.baja).searchParams.get("t");
      expect(verificarToken("cupon-baja", t, "c1")).toBe(true);
    }
  });

  it("en catalán y de vos según la web donde se pidió", () => {
    expect(armarMailCupon({ ...fila({ idioma: "ca" }), vence_el: "2026-11-19" }).asunto).toBe(TEXTOS_CUPON.ca.mail.cupon.asunto);
    expect(armarMailConfirmarCupon(fila({ idioma: "ar", region: "AR" })).asunto).toBe("Confirmá tu correo para recibir tu cupón");
  });
});

describe("los textos que ve una persona", () => {
  it("las casillas son las aprobadas (tanda 1, texto 10)", () => {
    expect(TEXTOS_CUPON.es.popup.casillaCupon).toBe("Quiero recibir el cupón en este correo.");
    expect(TEXTOS_CUPON.es.popup.casillaRecordatorios).toBe("Acepto que Vitácora me escriba hasta 4 veces para recordarme el descuento. Me doy de baja con un clic.");
    expect(TEXTOS_CUPON.es.checkout.linea).toBe("Cupón de bienvenida · 10 % del libro digital");
  });

  it("las bases no publican notas internas, y dicen lo de §1.6", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const todo = JSON.stringify(BASES_CUPON[idioma]);
      expect(todo).not.toMatch(/nota interna|\[titulares|VITACORA10-/i);
    }
    const es = JSON.stringify(BASES_CUPON.es);
    expect(es).toContain("Si compras un pack, el 10 % se calcula sobre el precio del libro digital que incluye el pack.");
    expect(es).toContain("solo vale en la web de ese país");
    expect(es).toContain("El último día también vale");
    expect(es).toContain("ni a precios ya rebajados");
    expect(es).toContain("no se vuelve a activar");
    expect(es).toContain("5 días hábiles");
    expect(es).toContain("No es un sorteo");
    expect(es).toContain("no limitan tus derechos");
    expect(JSON.stringify(BASES_CUPON.ar)).toContain("{titular:AR}");
  });

  it("de tú en España, de vos en Argentina", () => {
    const voseo = /\b(tenés|querés|pedís|comprás|escribí|tocá|revisá|compartís|podés)\b/i;
    expect(JSON.stringify(TEXTOS_CUPON.es, (_, v) => (typeof v === "function" ? v("X", "Y") : v))).not.toMatch(voseo);
    expect(JSON.stringify(BASES_CUPON.es)).not.toMatch(voseo);
    // «Te escribe Vitácora» es tercera persona: vale en los dos.
    const tuteo = /\b(tienes|quieres|pides|compras|escríbenos|toca|revisa|compartes|puedes)\b/i;
    expect(JSON.stringify(TEXTOS_CUPON.ar, (_, v) => (typeof v === "function" ? v("X", "Y") : v))).not.toMatch(tuteo);
    expect(JSON.stringify(BASES_CUPON.ar)).not.toMatch(tuteo);
  });

  it("sin dos puntos en lo que se lee (regla de la casa)", () => {
    const leer = (o: unknown) => JSON.stringify(o, (_, v) => (typeof v === "function" ? v("X", "Y") : v));
    for (const idioma of ["es", "ca", "ar"] as const) {
      const sinUrls = leer({ ...TEXTOS_CUPON[idioma], checkout: { ...TEXTOS_CUPON[idioma].checkout, pista: "" }, popup: { ...TEXTOS_CUPON[idioma].popup, correoPista: "" } });
      expect(sinUrls).not.toMatch(/[a-záéíóúñ]: /i);
      expect(leer(BASES_CUPON[idioma])).not.toMatch(/[a-záéíóúñ]: /i);
    }
  });

  it("la privacidad con el cupón suma el 4 bis, la excepción a «publicidad» y Resend", () => {
    for (const idioma of ["es", "ca", "ar"] as const) {
      const d = privacidadConCupon(TEXTOS_LEGAL[idioma].privacidad, idioma);
      const ids = d.secciones.map((s) => s.id);
      expect(ids.indexOf("cupon")).toBe(ids.indexOf("para-que") + 1);
      const todo = JSON.stringify(d);
      expect(todo).toMatch(/4 bis/);
      expect(todo).toMatch(/cupón de bienvenida con sus recordatorios|cupó de benvinguda amb els seus recordatoris/);
      expect(todo).toMatch(/salvo los recordatorios del cupón|excepte els recordatoris del cupó/);
    }
  });
});
