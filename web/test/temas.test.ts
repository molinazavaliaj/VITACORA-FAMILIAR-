import { describe, it, expect } from "vitest";
import { TEMAS, NOMBRE_TEMA, IMPRESCINDIBLE_MAXIMO, validarTemas, validarImprescindible } from "../src/lib/temas";

// "¿De qué querés que le preguntemos más?" (22/09): los temas que elige quien
// compra. No cambian QUÉ preguntas existen (eso son las plantillas, después):
// le dicen al biógrafo hacia dónde inclinar cada pregunta al escribirla.
describe("temas de la entrevista", () => {
  it("los ocho temas tienen nombre en palabras de familia", () => {
    expect(TEMAS.length).toBe(8);
    for (const t of TEMAS) expect(NOMBRE_TEMA[t].length).toBeGreaterThan(3);
  });
  it("acepta los conocidos, saca repetidos y respeta el orden", () => {
    expect(validarTemas(["oficio", "familia", "oficio"])).toEqual({ ok: true, temas: ["oficio", "familia"] });
    expect(validarTemas([])).toEqual({ ok: true, temas: [] });
    expect(validarTemas(undefined)).toEqual({ ok: true, temas: [] });
  });
  it("rechaza uno inventado o algo que no es lista", () => {
    expect(validarTemas(["futbol"]).ok).toBe(false);
    expect(validarTemas("familia").ok).toBe(false);
  });
  it("lo imprescindible se recorta y se limpia", () => {
    expect(validarImprescindible("  la casa de Pelliza  ")).toEqual({ ok: true, texto: "la casa de Pelliza" });
    expect(validarImprescindible("")).toEqual({ ok: true, texto: "" });
    const largo = validarImprescindible("x".repeat(500));
    expect(largo.ok && largo.texto.length).toBe(IMPRESCINDIBLE_MAXIMO);
    expect(validarImprescindible(42).ok).toBe(false);
  });
});
