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

describe("tapa, contratapa y marco (13/09)", () => {
  const ctx = { capitulosValidos: ["La infancia"], respuestasValidas: new Set<string>() };
  const id = "0f4a2a2e-6d7a-4a5e-9a9f-0f4a2a2e6d7a";

  it("acepta contratapaFotoId y marcoFotoId con uuid o null", () => {
    const r = validarEdicion({ contratapaFotoId: id, marcoFotoId: null }, ctx);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cambios).toEqual({ contratapaFotoId: id, marcoFotoId: null });
  });

  it("rechaza un id que no es uuid", () => {
    expect(validarEdicion({ contratapaFotoId: "x" }, ctx).ok).toBe(false);
    expect(validarEdicion({ marcoFotoId: 3 }, ctx).ok).toBe(false);
  });
});

describe("títulos de capítulos (13/09)", () => {
  const ctx = { capitulosValidos: ["La infancia", "El amor"], respuestasValidas: new Set<string>() };
  it("acepta renombrar capítulos válidos; ignora los vacíos (vuelven al original)", () => {
    const r = validarEdicion({ titulosCapitulos: { "La infancia": "  Los primeros años ", "El amor": "" } }, ctx);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cambios).toEqual({ titulosCapitulos: { "La infancia": "Los primeros años" } });
  });
  it("rechaza un capítulo que no existe o un título muy largo", () => {
    expect(validarEdicion({ titulosCapitulos: { Otro: "x" } }, ctx).ok).toBe(false);
    expect(validarEdicion({ titulosCapitulos: { "El amor": "a".repeat(61) } }, ctx).ok).toBe(false);
  });
});

describe("marcos con fotos distintas (13/09)", () => {
  const ctx = { capitulosValidos: [], respuestasValidas: new Set<string>() };
  const a = "0f4a2a2e-6d7a-4a5e-9a9f-0f4a2a2e6d7a";
  it("acepta una lista de uuid o null, y el primero también queda como marcoFotoId", () => {
    const r = validarEdicion({ marcosFotoIds: [a, null, a] }, ctx);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.cambios).toEqual({ marcosFotoIds: [a, null, a], marcoFotoId: a });
  });
  it("rechaza basura y más de 20", () => {
    expect(validarEdicion({ marcosFotoIds: ["x"] }, ctx).ok).toBe(false);
    expect(validarEdicion({ marcosFotoIds: Array(21).fill(null) }, ctx).ok).toBe(false);
  });
});
