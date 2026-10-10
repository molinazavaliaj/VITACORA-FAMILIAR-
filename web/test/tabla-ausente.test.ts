import { describe, it, expect } from "vitest";
import { esTablaAusente } from "../src/lib/tabla-ausente";

// La misma regla que entrevistador/src/v3/estado.ts: Postgres (42P01) y
// PostgREST (PGRST205, "could not find the table") dicen lo mismo de dos formas.
describe("esTablaAusente", () => {
  it("42P01 de Postgres", () => {
    expect(esTablaAusente({ code: "42P01", message: 'relation "public.regalos" does not exist' })).toBe(true);
  });
  it("PGRST205 de PostgREST", () => {
    expect(esTablaAusente({ code: "PGRST205", message: "x" })).toBe(true);
  });
  it("el mensaje de PostgREST sin código", () => {
    expect(esTablaAusente({ message: "Could not find the table 'public.regalos' in the schema cache" })).toBe(true);
  });
  it("otro error, o ninguno, no", () => {
    expect(esTablaAusente({ code: "XX000", message: "se cayó" })).toBe(false);
    expect(esTablaAusente(null)).toBe(false);
    expect(esTablaAusente(undefined)).toBe(false);
  });
});
