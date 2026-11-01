import { describe, it, expect } from "vitest";
import { DIAS_TARJETA_IMPRESA, puedeTarjetaImpresa } from "../src/lib/regalo-reglas";
import { validarTarjetaImpresa } from "../src/lib/tarjeta-impresa";
import { textosComprador } from "../src/lib/regalo-textos";

// La tarjeta impresa del regalo (30/10): Naza la imprime y la manda por
// Correos (3 a 5 días). Solo si hay tiempo y solo dentro de España.

const HOY = new Date("2026-10-30T12:00:00Z");
const TU = textosComprador("tu");

describe("puedeTarjetaImpresa", () => {
  it("son 7 días", () => {
    expect(DIAS_TARJETA_IMPRESA).toBe(7);
  });
  it("sin fecha se puede", () => {
    expect(puedeTarjetaImpresa("", HOY)).toBe(true);
  });
  it("a 6 días no; a 7 sí; más lejos también", () => {
    expect(puedeTarjetaImpresa("2026-11-05", HOY)).toBe(false);
    expect(puedeTarjetaImpresa("2026-11-06", HOY)).toBe(true);
    expect(puedeTarjetaImpresa("2026-12-24", HOY)).toBe(true);
  });
  it("hoy, una fecha pasada o una que no existe, no", () => {
    expect(puedeTarjetaImpresa("2026-10-30", HOY)).toBe(false);
    expect(puedeTarjetaImpresa("2026-10-01", HOY)).toBe(false);
    expect(puedeTarjetaImpresa("2026-02-31", HOY)).toBe(false);
    expect(puedeTarjetaImpresa("mañana", HOY)).toBe(false);
  });
});

const DIRECCION = { linea1: " Calle Mayor 12 ", ciudad: "Valladolid", cp: "47001", pais: "España" };

describe("validarTarjetaImpresa", () => {
  it("con nombre y dirección de España, la devuelve limpia", () => {
    expect(validarTarjetaImpresa({ aNombreDe: "  Lucía  ", direccion: DIRECCION }, TU.tarjeta)).toEqual({
      ok: true,
      tarjeta: { aNombreDe: "Lucía", direccion: { linea1: "Calle Mayor 12", ciudad: "Valladolid", cp: "47001", pais: "España" } },
    });
  });
  it.each(["españa", "ESPANA", "Spain", "Espanya", " España "])("acepta %s como España", (pais) => {
    expect(validarTarjetaImpresa({ aNombreDe: "Lucía", direccion: { ...DIRECCION, pais } }, TU.tarjeta).ok).toBe(true);
  });
  it("fuera de España, no", () => {
    expect(validarTarjetaImpresa({ aNombreDe: "Lucía", direccion: { ...DIRECCION, pais: "Argentina" } }, TU.tarjeta)).toEqual({ ok: false, mensaje: TU.tarjeta.soloEspana });
  });
  it("sin a nombre de quién, o con más de 100 letras, no", () => {
    expect(validarTarjetaImpresa({ aNombreDe: "   ", direccion: DIRECCION }, TU.tarjeta)).toEqual({ ok: false, mensaje: TU.tarjeta.faltaANombreDe });
    expect(validarTarjetaImpresa({ direccion: DIRECCION }, TU.tarjeta)).toEqual({ ok: false, mensaje: TU.tarjeta.faltaANombreDe });
    expect(validarTarjetaImpresa({ aNombreDe: "x".repeat(101), direccion: DIRECCION }, TU.tarjeta).ok).toBe(false);
  });
  it("sin dirección o con un campo obligatorio vacío, no", () => {
    expect(validarTarjetaImpresa({ aNombreDe: "Lucía" }, TU.tarjeta).ok).toBe(false);
    expect(validarTarjetaImpresa({ aNombreDe: "Lucía", direccion: { ...DIRECCION, cp: "" } }, TU.tarjeta).ok).toBe(false);
  });
});
