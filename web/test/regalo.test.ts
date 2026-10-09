import { describe, it, expect } from "vitest";
import { ALFABETO_CODIGO, generarCodigo, linkWhatsApp, normalizarCodigo, validarRegalo } from "../src/lib/regalo";

describe("generarCodigo", () => {
  it("arma VF- y 6 caracteres del alfabeto sin ambiguos", () => {
    for (let i = 0; i < 200; i++) {
      const c = generarCodigo();
      expect(c).toMatch(/^VF-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    }
  });
  it("usa el azar que le pasan", () => {
    expect(generarCodigo(() => 0)).toBe("VF-222222");
    expect(generarCodigo(() => ALFABETO_CODIGO.length - 1)).toBe("VF-ZZZZZZ");
  });
});

describe("normalizarCodigo", () => {
  it("acepta minúsculas, espacios, guiones y sin el VF", () => {
    expect(normalizarCodigo("vf-7k3m2q")).toBe("VF-7K3M2Q");
    expect(normalizarCodigo(" VF 7K3 M2Q ")).toBe("VF-7K3M2Q");
    expect(normalizarCodigo("7K3M2Q")).toBe("VF-7K3M2Q");
  });
  it("rechaza largo malo o caracteres fuera del alfabeto", () => {
    expect(normalizarCodigo("VF-7K3M")).toBeNull();
    expect(normalizarCodigo("VF-7K3M2O")).toBeNull(); // O no existe
    expect(normalizarCodigo("")).toBeNull();
  });
  it("un código que empieza con VF se puede escribir pelado", () => {
    expect(normalizarCodigo("VF3K2M")).toBe("VF-VF3K2M");
    expect(normalizarCodigo("VFVF3K2M")).toBe("VF-VF3K2M");
    expect(normalizarCodigo("vf-vf3k2m")).toBe("VF-VF3K2M");
  });
});

describe("validarRegalo", () => {
  const hoy = new Date("2026-10-08T12:00:00Z");
  it("pide el mensaje", () => {
    expect(validarRegalo({ mensaje: "  ", genero: "varon" }, hoy)).toEqual({ ok: false, mensaje: expect.any(String) });
  });
  it("corta mensajes de más de 600", () => {
    const r = validarRegalo({ mensaje: "a".repeat(601), genero: "varon" }, hoy);
    expect(r.ok).toBe(false);
  });
  it("pide un género de la lista", () => {
    expect(validarRegalo({ mensaje: "Hola", genero: "x" }, hoy).ok).toBe(false);
  });
  it("la fecha es opcional, y si viene no puede ser pasada", () => {
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer" }, hoy)).toEqual({ ok: true, regalo: { mensaje: "Hola", genero: "mujer", fechaEntrega: null } });
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-12-24" }, hoy))
      .toEqual({ ok: true, regalo: { mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-12-24" } });
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-10-01" }, hoy).ok).toBe(false);
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "mañana" }, hoy).ok).toBe(false);
  });
  it("acepta el hoy de quien regala aunque en UTC ya sea mañana", () => {
    const tarde = new Date("2026-10-09T01:00:00Z"); // 22:00 del 08/10 en Argentina
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-10-08" }, tarde).ok).toBe(true);
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-10-07" }, tarde).ok).toBe(false);
  });
  it("rechaza fechas que no existen en el calendario", () => {
    expect(validarRegalo({ mensaje: "Hola", genero: "mujer", fechaEntrega: "2026-02-31" }, hoy).ok).toBe(false);
  });
  it("acepta un mensaje de exactamente 600", () => {
    expect(validarRegalo({ mensaje: "a".repeat(600), genero: "varon" }, hoy).ok).toBe(true);
  });
  it("rechaza lo que no es un objeto", () => {
    expect(validarRegalo(null, hoy).ok).toBe(false);
    expect(validarRegalo("hola", hoy).ok).toBe(false);
  });
});

describe("linkWhatsApp", () => {
  it("arma wa.me con el mensaje ya escrito", () => {
    expect(linkWhatsApp("5491100000000", "VF-7K3M2Q"))
      .toBe("https://wa.me/5491100000000?text=Hola%2C%20quiero%20empezar%20mi%20libro.%20VF-7K3M2Q");
  });
});
