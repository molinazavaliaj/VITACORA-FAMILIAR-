import { describe, it, expect, afterEach } from "vitest";
import {
  DIAS_EN_ESPERA,
  codigoCreadorValido,
  creadoresPrendido,
  estadoDeComision,
  generarTokenPanel,
  importeComision,
  leerPorcentaje,
  normalizarCodigoCreador,
  pareceTokenPanel,
  resumenDeComisiones,
  sugerirCodigo,
  validarAltaCreador,
  esRobotColabora,
} from "../src/lib/creadores";

// Las reglas puras del programa de creadores (21/10): el código, la cuenta de
// la comisión, el token del panel y el alta de /colabora.

afterEach(() => {
  delete process.env.CREADORES;
});

describe("creadoresPrendido", () => {
  it("solo con CREADORES=1", () => {
    expect(creadoresPrendido()).toBe(false);
    process.env.CREADORES = "0";
    expect(creadoresPrendido()).toBe(false);
    process.env.CREADORES = " 1 ";
    expect(creadoresPrendido()).toBe(true);
  });
});

describe("el código del creador", () => {
  it("normaliza lo que escribe la persona: mayúsculas, sin tildes, espacios ni guiones", () => {
    expect(normalizarCodigoCreador("Lucía")).toBe("LUCIA");
    expect(normalizarCodigoCreador("  ana-maria 22 ")).toBe("ANAMARIA22");
    expect(normalizarCodigoCreador("peña_viajes")).toBe("PENAVIAJES");
  });

  it("rechaza lo que no tiene forma de código", () => {
    expect(normalizarCodigoCreador("AB")).toBeNull();
    expect(normalizarCodigoCreador("A".repeat(21))).toBeNull();
    expect(normalizarCodigoCreador("hola!")).toBeNull();
    expect(normalizarCodigoCreador(42)).toBeNull();
    expect(normalizarCodigoCreador(null)).toBeNull();
  });

  it("nunca empieza con el prefijo del rasca y gana (no se confunden)", () => {
    expect(normalizarCodigoCreador("VITACORA10-ABCDEF")).toBeNull();
    expect(normalizarCodigoCreador("vitacora10xyz")).toBeNull();
    expect(codigoCreadorValido("VITACORA10")).toBe(false);
    expect(codigoCreadorValido("VITACORA")).toBe(true);
  });

  it("sugiere el nombre normalizado, recortado a 15", () => {
    expect(sugerirCodigo("Lucía Fernández")).toBe("LUCIAFERNANDEZ");
    expect(sugerirCodigo("María José Rodríguez Peña")).toBe("MARIAJOSERODRIG");
    expect(sugerirCodigo("@la.abuela.cuenta!")).toBe("LAABUELACUENTA");
    expect(sugerirCodigo("Jo")).toBe("");
  });
});

describe("la comisión", () => {
  it("euros a los céntimos", () => {
    expect(importeComision(44.1, "EUR", 20)).toBe(8.82);
    expect(importeComision(49, "EUR", 15)).toBe(7.35);
    expect(importeComision(33.33, "EUR", 10)).toBe(3.33);
  });

  it("pesos al entero", () => {
    expect(importeComision(77175, "ARS", 20)).toBe(15435);
    expect(importeComision(85750, "ARS", 15)).toBe(12863);
  });

  it("lee los porcentajes del panel: enteros dentro del rango", () => {
    expect(leerPorcentaje("20", 1, 50)).toBe(20);
    expect(leerPorcentaje(" 0 ", 0, 50)).toBe(0);
    expect(leerPorcentaje("0", 1, 50)).toBeNull();
    expect(leerPorcentaje("51", 1, 50)).toBeNull();
    expect(leerPorcentaje("12.5", 1, 50)).toBeNull();
    expect(leerPorcentaje("", 1, 50)).toBeNull();
    expect(leerPorcentaje(null, 1, 50)).toBeNull();
  });

  const AHORA = new Date("2026-11-01T09:00:00Z");
  const VIEJA = "2026-10-10T12:00:00Z"; // 22 días antes: ya pasó la espera
  const NUEVA = "2026-10-25T12:00:00Z"; // 7 días antes: sigue en espera

  it("suma por moneda, sin las anuladas, y separa lo que sigue en espera", () => {
    const r = resumenDeComisiones(
      [
        { estado: "pendiente", created_at: VIEJA, moneda: "EUR", importe: 8.82 },
        { estado: "pendiente", created_at: VIEJA, moneda: "EUR", importe: 7.35 },
        { estado: "pendiente", created_at: NUEVA, moneda: "EUR", importe: 3 },
        { estado: "pagada", created_at: VIEJA, moneda: "EUR", importe: 5 },
        { estado: "pendiente", created_at: VIEJA, moneda: "ARS", importe: 15435 },
        { estado: "anulada", created_at: NUEVA, moneda: "EUR", importe: 100 },
      ],
      AHORA,
    );
    expect(r).toEqual({ ventas: 5, enEspera: { EUR: 3 }, porCobrar: { EUR: 16.17, ARS: 15435 }, pagado: { EUR: 5 } });
  });

  it("una comisión queda en espera 14 días desde la compra y después pasa a por cobrar", () => {
    expect(DIAS_EN_ESPERA).toBe(14);
    const hace = (dias: number) => new Date(AHORA.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();
    expect(estadoDeComision({ estado: "pendiente", created_at: hace(0) }, AHORA)).toBe("en_espera");
    expect(estadoDeComision({ estado: "pendiente", created_at: hace(13.9) }, AHORA)).toBe("en_espera");
    expect(estadoDeComision({ estado: "pendiente", created_at: hace(14) }, AHORA)).toBe("en_espera");
    expect(estadoDeComision({ estado: "pendiente", created_at: hace(14.01) }, AHORA)).toBe("por_cobrar");
    // Pagada y anulada no cambian con el tiempo.
    expect(estadoDeComision({ estado: "pagada", created_at: hace(1) }, AHORA)).toBe("pagada");
    expect(estadoDeComision({ estado: "anulada", created_at: hace(30) }, AHORA)).toBe("anulada");
  });
});

describe("el token del panel", () => {
  it("es largo, al azar y con forma de base64url", () => {
    const a = generarTokenPanel();
    const b = generarTokenPanel();
    expect(a).not.toBe(b);
    expect(pareceTokenPanel(a)).toBe(true);
    expect(pareceTokenPanel("corto")).toBe(false);
    expect(pareceTokenPanel(`${a.slice(0, 42)}/`)).toBe(false);
  });
});

describe("el alta de /colabora", () => {
  const BIEN = { nombre: "Lucía", email: "Lucia@Ejemplo.com ", red: "instagram", perfil: "instagram.com/lucia", condiciones: true, idioma: "ar" };

  it("limpia el cuerpo y pasa el correo a minúsculas", () => {
    const r = validarAltaCreador({ ...BIEN, seguidores: " 3.000 ", mensaje: "Hola" });
    expect(r).toEqual({
      ok: true,
      alta: { idioma: "ar", nombre: "Lucía", email: "lucia@ejemplo.com", red: "instagram", perfil: "instagram.com/lucia", seguidores: "3.000", mensaje: "Hola" },
    });
  });

  it("pide lo obligatorio, un correo y un perfil que se puedan usar, y la casilla", () => {
    expect(validarAltaCreador({ ...BIEN, nombre: "" })).toEqual({ ok: false, error: "faltan" });
    expect(validarAltaCreador({ ...BIEN, red: "myspace" })).toEqual({ ok: false, error: "faltan" });
    expect(validarAltaCreador({ ...BIEN, email: "lucia" })).toEqual({ ok: false, error: "email" });
    expect(validarAltaCreador({ ...BIEN, perfil: "lucia" })).toEqual({ ok: false, error: "perfil" });
    expect(validarAltaCreador({ ...BIEN, condiciones: false })).toEqual({ ok: false, error: "condiciones" });
    expect(validarAltaCreador({ ...BIEN, perfil: "@lucia" }).ok).toBe(true);
  });

  it("recorta el mensaje a 1000", () => {
    const r = validarAltaCreador({ ...BIEN, mensaje: "x".repeat(1500) });
    expect(r.ok && r.alta.mensaje.length).toBe(1000);
  });

  it("reconoce al robot por el campo trampa", () => {
    expect(esRobotColabora({ ...BIEN, sitio: "http://spam" })).toBe(true);
    expect(esRobotColabora(BIEN)).toBe(false);
  });
});
