import { describe, it, expect } from "vitest";
import { validarHorario, HORAS_FAMILIAR, HORAS_VIAJE, ZONAS, nombreDeZona } from "../src/lib/horario";

// La hora y la zona de la pregunta del día (3t.23): lo puro, compartido por
// los dos checkouts y por Ajustes.
describe("horario", () => {
  it("acepta HH:MM y una zona IANA real", () => {
    expect(validarHorario({ hora: "09:00", zona: "America/Argentina/Buenos_Aires" })).toEqual({ ok: true, hora: "09:00", zona: "America/Argentina/Buenos_Aires" });
    expect(validarHorario({ hora: "21:30", zona: "Europe/Madrid" })).toEqual({ ok: true, hora: "21:30", zona: "Europe/Madrid" });
  });
  it("rechaza horas fuera de rango, formatos raros y zonas inventadas", () => {
    expect(validarHorario({ hora: "25:00", zona: "Europe/Madrid" }).ok).toBe(false);
    expect(validarHorario({ hora: "9:00", zona: "Europe/Madrid" }).ok).toBe(false);
    expect(validarHorario({ hora: "09:00", zona: "Marte/Olympus" }).ok).toBe(false);
    expect(validarHorario({ hora: 9, zona: "Europe/Madrid" }).ok).toBe(false);
  });
  it("las listas tienen lo mismo que tenían los checkouts, y la zona se nombra en humano", () => {
    expect(HORAS_FAMILIAR.map((h) => h.valor)).toEqual(["09:00", "11:00", "16:00", "19:00"]);
    expect(HORAS_VIAJE.map((h) => h.valor)).toEqual(["20:30", "21:30", "22:30", "08:30"]);
    expect(ZONAS.some(([z]) => z === "America/Argentina/Buenos_Aires")).toBe(true);
    expect(nombreDeZona("America/Argentina/Buenos_Aires")).toBe("Argentina, Uruguay, Brasil (este)");
    expect(nombreDeZona("Pacific/Auckland")).toBe("Pacific/Auckland"); // desconocida: tal cual
  });
});
