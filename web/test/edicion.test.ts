import { describe, it, expect } from "vitest";
import { validarEdicion, propuestaPorDefecto } from "../src/lib/edicion";

const ctx = { capitulosValidos: ["La infancia", "El amor", "El oficio"], respuestasValidas: new Set(["r1", "r2", "r3"]) };

describe("propuestaPorDefecto", () => {
  it("título con el nombre, subtítulo con el nombre completo, todo incluido", () => {
    const p = propuestaPorDefecto("Alfredo", "Alfredo Pérez", ctx.capitulosValidos);
    expect(p.titulo).toBe("Alfredo — La historia de una vida");
    expect(p.subtitulo).toBe("Alfredo Pérez");
    expect(p.ordenCapitulos).toEqual(ctx.capitulosValidos);
    expect(p.excluidas).toEqual([]);
  });
});

describe("validarEdicion", () => {
  it("guarda solo lo que llega, limpio", () => {
    const r = validarEdicion({ titulo: "  Alfredo,   mecánico  ", correcciones: " el taller era en Domínico " }, ctx);
    expect(r).toEqual({ ok: true, cambios: { titulo: "Alfredo, mecánico", correcciones: "el taller era en Domínico" } });
  });
  it("el título no puede quedar vacío ni pasarse de largo", () => {
    expect(validarEdicion({ titulo: "   " }, ctx).ok).toBe(false);
    expect(validarEdicion({ titulo: "x".repeat(81) }, ctx).ok).toBe(false);
  });
  it("el orden tiene que traer todos los capítulos, una vez cada uno", () => {
    expect(validarEdicion({ ordenCapitulos: ["El amor", "La infancia", "El oficio"] }, ctx).ok).toBe(true);
    expect(validarEdicion({ ordenCapitulos: ["El amor", "La infancia"] }, ctx).ok).toBe(false);
    expect(validarEdicion({ ordenCapitulos: ["El amor", "La infancia", "El oficio", "Otro"] }, ctx).ok).toBe(false);
    expect(validarEdicion({ ordenCapitulos: ["El amor", "El amor", "El oficio"] }, ctx).ok).toBe(false);
  });
  it("no se excluyen respuestas de otra historia", () => {
    expect(validarEdicion({ excluidas: ["r1", "r1", "r3"] }, ctx)).toEqual({ ok: true, cambios: { excluidas: ["r1", "r3"] } });
    expect(validarEdicion({ excluidas: ["r1", "ajena"] }, ctx).ok).toBe(false);
  });
  it("la portada es un uuid o null", () => {
    expect(validarEdicion({ portadaFotoId: null }, ctx).ok).toBe(true);
    expect(validarEdicion({ portadaFotoId: "2b13ad1e-0000-4000-8000-000000000000" }, ctx).ok).toBe(true);
    expect(validarEdicion({ portadaFotoId: "no" }, ctx).ok).toBe(false);
  });
});
