import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { datosDelPanel } from "../src/lib/admin/datos";
import { frenosDe, contarPorGravedad } from "../src/lib/admin/frenos";
import { cambioDeEntorno, cuentaDelPeriodo, ventaPorVenta, costoPorLibro } from "../src/lib/admin/plata";
import { mapaDeCerebros, livenessDeLaVoz } from "../src/lib/admin/mapa";

// Verificación de punta a punta CONTRA LA BASE REAL (B8 del plan). No corre en la suite
// normal: se prende con E2E_REAL=1 y lee las claves de web/.env.local (nunca del repo).
//
// Para qué sirve: las diez consultas del panel traen SUS columnas escritas a mano, y si una
// se llama distinto, PostgREST devuelve error y `datosDelPanel` —que atrapa todo para que el
// panel nunca se caiga— devolvería una lista vacía EN SILENCIO. Este test es el que hace
// ruido: espía los avisos y exige que no haya ninguno.

const hayClaves = (() => {
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    return env.includes("SUPABASE_URL") || env.includes("NEXT_PUBLIC_SUPABASE_URL");
  } catch {
    return false;
  }
})();

function claves(): { url: string; key: string } {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const de = (nombre: string) =>
    env
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${nombre}=`))
      ?.slice(nombre.length + 1)
      .replace(/^["']|["']$/g, "")
      .trim() ?? "";
  return {
    url: de("SUPABASE_URL") || de("NEXT_PUBLIC_SUPABASE_URL"),
    key: de("SUPABASE_SERVICE_ROLE_KEY") || de("SUPABASE_SERVICE_KEY"),
  };
}

describe.skipIf(!process.env.E2E_REAL || !hayClaves)("el panel contra la base real", () => {
  it("las diez consultas leen sin un solo aviso (ninguna columna mal escrita)", async () => {
    const avisos = vi.spyOn(console, "error").mockImplementation(() => {});
    const { url, key } = claves();
    const admin = createClient(url, key);
    const ahora = new Date();

    const datos = await datosDelPanel(admin, ahora);

    const queFallo = avisos.mock.calls.map((c) => c.join(" ")).filter((t) => t.includes("no pude leer"));
    avisos.mockRestore();
    expect(queFallo).toEqual([]);

    console.log("=== lo que devolvió la base ===");
    console.log({
      narradores: datos.narradores.length,
      familias: datos.familias.length,
      pedidos: datos.pedidos.length,
      respuestas: datos.respuestas.length,
      envios: datos.envios.length,
      narraciones: datos.narraciones.length,
      fotos: datos.fotos.length,
      consumo: datos.consumo.length,
      latidos: datos.latidos.length,
      gastos: datos.gastos.length,
    });

    // Y que la lógica del panel no se rompa con datos reales: frenos, cuenta, mapa.
    const frenos = frenosDe(datos, ahora);
    const cuenta = cuentaDelPeriodo(datos, cambioDeEntorno(process.env), new Date(ahora.getTime() - 31 * 86400_000), ahora);
    const nodos = mapaDeCerebros(datos, ahora);
    const ventas = ventaPorVenta(datos, cambioDeEntorno(process.env));

    console.log("frenos:", contarPorGravedad(frenos), frenos.slice(0, 3).map((f) => f.detalle));
    console.log("cuenta:", {
      entro: cuenta.entro,
      gastoIa: cuenta.gastoIa,
      comisiones: cuenta.comisiones,
      fijos: cuenta.fijos,
      limpia: cuenta.limpia,
      sinConvertir: cuenta.sinConvertir,
    });
    console.log("nodos frenados:", nodos.filter((n) => n.estado === "frenado").map((n) => n.nombre));
    console.log("voz:", livenessDeLaVoz(datos, ahora));
    console.log("costo por libro:", costoPorLibro(datos.consumo).slice(0, 3));
    console.log("ventas:", ventas.length);

    // Nada de esto puede salir NaN con datos de verdad.
    for (const numero of [cuenta.entro, cuenta.gastoIa, cuenta.comisiones, cuenta.fijos, cuenta.limpia]) {
      expect(Number.isNaN(numero)).toBe(false);
    }
    expect(nodos.length).toBeGreaterThan(0);
  }, 60_000);
});
