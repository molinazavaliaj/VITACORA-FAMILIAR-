import { describe, it, expect } from "vitest";
// Las fechas vivas del viaje (12/10) y el guion espejo del bot.
import { guionDelViaje, planDeGuion, validarFechas, type Viaje } from "../src/lib/viaje";

const viaje: Viaje = {
  salida: "2026-10-20",
  vuelta: "2026-10-25",
  etapas: [
    { nombre: "Lisboa", desde: "2026-10-20", hasta: "2026-10-22" },
    { nombre: "Oporto", desde: "2026-10-23" },
  ],
  angulos: ["comida", "persona"],
};

// El espejo con el guion del bot viejo (entrevistador/src/flujo/viaje.ts) se fue con el viaje V1 (#52).

describe("validarFechas", () => {
  it("antes de la primera pregunta, se mueven las dos", () => {
    expect(validarFechas(viaje, "2026-10-27", "2026-11-03", 0)).toEqual({ ok: true, salida: "2026-10-27", vuelta: "2026-11-03" });
  });

  it("con el viaje en marcha, la salida queda fija", () => {
    const r = validarFechas(viaje, "2026-10-21", "2026-10-25", 2);
    expect(r.ok).toBe(false);
  });

  it("con el viaje en marcha, la vuelta se estira", () => {
    expect(validarFechas(viaje, viaje.salida, "2026-10-30", 3)).toMatchObject({ ok: true, vuelta: "2026-10-30" });
  });

  it("se acorta, pero no antes de la última noche que ya salió", () => {
    // Noche 3 = 22/10. Hasta el 22 sí (la ruta mira si ya la contestó); el 21, no.
    expect(validarFechas(viaje, viaje.salida, "2026-10-22", 3).ok).toBe(true);
    const r = validarFechas(viaje, viaje.salida, "2026-10-21", 3);
    expect(r).toEqual({ ok: false, mensaje: "Ya te mandamos la pregunta del 22 de octubre: la vuelta no puede ser antes." });
  });

  it("la vuelta no puede ser antes de la salida, ni el viaje pasarse de largo", () => {
    expect(validarFechas(viaje, "2026-10-20", "2026-10-19", 0).ok).toBe(false);
    expect(validarFechas(viaje, "2026-01-01", "2026-12-31", 0).ok).toBe(false);
    expect(validarFechas(viaje, "no", "2026-10-25", 0).ok).toBe(false);
  });
});

describe("planDeGuion", () => {
  // Lo que el bot guardó al decir SÍ, con el viaje original.
  const guardadas = guionDelViaje(viaje).map((p) => ({ id: `p${p.orden}`, tipo: "fija", ...p }));

  it("sin cambios, no toca nada", () => {
    expect(planDeGuion(viaje, 2, guardadas.filter((p) => p.orden > 2))).toEqual({ actualizar: [], agregar: [], borrar: [] });
  });

  it("estirar suma noches y la vieja despedida pasa a ser una noche común", () => {
    const largo = { ...viaje, vuelta: "2026-10-27" }; // 6 → 8 noches
    const plan = planDeGuion(largo, 2, guardadas.filter((p) => p.orden > 2));
    expect(plan.agregar.map((p) => p.orden)).toEqual([7, 8]);
    expect(plan.agregar[1].texto).toContain("te vas");
    expect(plan.actualizar.map((p) => p.id)).toEqual(["p6"]); // era la despedida
    expect(plan.borrar).toEqual([]);
  });

  it("acortar borra solo las que sobran y todavía no salieron", () => {
    const corto = { ...viaje, vuelta: "2026-10-24" }; // 6 → 5 noches
    const plan = planDeGuion(corto, 2, guardadas.filter((p) => p.orden > 2));
    expect(plan.borrar).toEqual(["p6"]);
    expect(plan.agregar).toEqual([]);
    expect(plan.actualizar.find((p) => p.id === "p5")?.texto).toContain("te vas"); // la nueva última noche
  });

  it("lo que ya salió no se toca, aunque cambie todo", () => {
    const corrido = { ...viaje, salida: "2026-10-18" };
    const plan = planDeGuion(corrido, 3, guardadas.filter((p) => p.orden > 3));
    const tocadas = [...plan.actualizar.map((p) => p.id), ...plan.borrar];
    expect(tocadas.some((id) => ["p1", "p2", "p3"].includes(id))).toBe(false);
  });

  it("una pregunta que no es del guion (la de cierre) no se borra", () => {
    const corto = { ...viaje, vuelta: "2026-10-23" };
    const cierre = { id: "c", orden: 7, tipo: "cierre", texto: "¿Algo más?", capitulo: "Oporto" };
    expect(planDeGuion(corto, 2, [...guardadas.filter((p) => p.orden > 2), cierre]).borrar).not.toContain("c");
  });
});
