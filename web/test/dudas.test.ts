import { describe, it, expect } from "vitest";
import {
  validarCorreccionesFamilia,
  estadoDelPlazo,
  HORAS_PLAZO_DUDAS,
  type DudaFamilia,
} from "../src/lib/dudas";

// La pantalla de dudas (CONTRATO, "Escritor V3 en la fábrica"): la Etapa A deja
// sus dudas de datos y la familia las contesta antes de que el libro se escriba.
// Lo puro: qué se puede guardar y cuánto tiempo queda.

const DUDAS: DudaFamilia[] = [
  { id: "D01", pregunta: "¿Cómo se llamaba la Negra?", tipo: "nombre", que: "", ids: [], citas: [] },
  { id: "D02", pregunta: "¿En qué año se mudaron?", tipo: "fecha", que: "", ids: [], citas: [] },
];

describe("validarCorreccionesFamilia", () => {
  it("acepta las que contestan una duda que existe, y las limpia", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D01", texto: "  Ofelia  " }], DUDAS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.correcciones).toHaveLength(1);
      expect(r.correcciones[0]).toMatchObject({ dudaId: "D01", texto: "Ofelia" });
      // Cada respuesta queda fechada: la pantalla muestra cuándo se contestó.
      expect(Date.parse(r.correcciones[0].cuando!)).toBeTypeOf("number");
    }
  });

  it("descarta las vacías en vez de guardar una respuesta en blanco", () => {
    const r = validarCorreccionesFamilia(
      [{ dudaId: "D01", texto: "   " }, { dudaId: "D02", texto: "1972" }],
      DUDAS,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.correcciones).toHaveLength(1);
      expect(r.correcciones[0]).toMatchObject({ dudaId: "D02", texto: "1972" });
    }
  });

  it("rechaza una duda que no existe: el archivo lo lee la fábrica y un id inventado la confunde", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D99", texto: "algo" }], DUDAS);
    expect(r.ok).toBe(false);
  });

  it("se queda con la última cuando dos personas contestan la misma duda", () => {
    const r = validarCorreccionesFamilia(
      [{ dudaId: "D01", texto: "Ofelia" }, { dudaId: "D01", texto: "Ofelia Rodríguez" }],
      DUDAS,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.correcciones).toHaveLength(1);
      expect(r.correcciones[0]).toMatchObject({ dudaId: "D01", texto: "Ofelia Rodríguez" });
    }
  });

  it("rechaza lo que no es una lista, o una respuesta sin texto", () => {
    expect(validarCorreccionesFamilia("no", DUDAS).ok).toBe(false);
    expect(validarCorreccionesFamilia([{ dudaId: "D01" }], DUDAS).ok).toBe(false);
  });

  it("corta un texto larguísimo en vez de rechazarlo: lo escribió una persona, no se le pierde", () => {
    const r = validarCorreccionesFamilia([{ dudaId: "D01", texto: "x".repeat(3000) }], DUDAS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.correcciones[0].texto.length).toBeLessThanOrEqual(2000);
  });
});

describe("estadoDelPlazo", () => {
  const aviso = "2026-10-12T10:00:00.000Z";

  it("mientras no venció, dice hasta cuándo", () => {
    const r = estadoDelPlazo(aviso, false, new Date("2026-10-12T12:00:00.000Z"));
    expect(r.estado).toBe("abierto");
    expect(r.venceAt).toEqual(new Date(Date.parse(aviso) + HORAS_PLAZO_DUDAS * 3600_000));
  });

  it("vencido pero sin libro todavía: se puede contestar igual", () => {
    const r = estadoDelPlazo(aviso, false, new Date("2026-10-14T10:00:00.000Z"));
    expect(r.estado).toBe("vencido");
  });

  it("con el libro escrito ya no sirve contestar, aunque el plazo no haya vencido", () => {
    const r = estadoDelPlazo(aviso, true, new Date("2026-10-12T12:00:00.000Z"));
    expect(r.estado).toBe("libro_escrito");
  });

  it("sin fecha de aviso no inventa un plazo", () => {
    expect(estadoDelPlazo(null, false, new Date()).estado).toBe("abierto");
    expect(estadoDelPlazo(null, false, new Date()).venceAt).toBeNull();
  });

  it("una fecha de aviso rota se trata como si no estuviera", () => {
    const r = estadoDelPlazo("cualquier cosa", false, new Date());
    expect(r.estado).toBe("abierto");
    expect(r.venceAt).toBeNull();
  });
});
