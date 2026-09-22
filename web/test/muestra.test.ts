import { describe, it, expect, vi } from "vitest";
import { armarMuestra } from "../src/lib/muestra";

// La muestra pública de un libro cerrado (§8). T3.1 (bitácora #36): si la dueña
// renombró un capítulo en Encargar libro, el link público tiene que decir lo
// mismo que el panel y que el libro impreso — no el nombre del guion.

function admin(narrador: Record<string, unknown> | null, preguntas: { orden: number; capitulo: string }[] = []) {
  return {
    from: (tabla: string) => {
      const b: Record<string, unknown> = {};
      const enc = () => b;
      b.select = enc; b.eq = enc; b.is = enc; b.order = enc;
      b.limit = () => Promise.resolve({ data: [] });
      b.maybeSingle = async () => ({ data: tabla === "narradores" ? narrador : null, error: null });
      b.then = (res: (v: unknown) => void) => res({ data: tabla === "preguntas" ? preguntas : [], error: null });
      return b;
    },
    storage: { from: () => ({ list: async () => ({ data: [] }) }) },
  } as never;
}

const GUION = [
  { orden: 1, capitulo: "La infancia" },
  { orden: 2, capitulo: "El oficio" },
  { orden: 3, capitulo: "Los hijos" },
];

describe("armarMuestra", () => {
  it("sin libro cerrado no hay muestra", async () => {
    expect(await armarMuestra(admin({ id: "n1", nombre: "Osvaldo", edicion: {}, libro_aprobado_at: null }), "n1")).toBeNull();
  });

  it("sin edición, los capítulos son los del guion", async () => {
    const m = await armarMuestra(admin({ id: "n1", nombre: "Osvaldo", edicion: {}, libro_aprobado_at: "2026-09-20T00:00:00Z" }, GUION), "n1");
    expect(m?.capitulos).toEqual(["La infancia", "El oficio", "Los hijos"]);
  });

  it("T3.1: aplica los títulos que puso la dueña, en su orden", async () => {
    const edicion = {
      ordenCapitulos: ["Los hijos", "La infancia", "El oficio"],
      titulosCapitulos: { "Los hijos": "  Mis cuatro hijos  ", "La infancia": "Pelliza, 1948" },
    };
    const m = await armarMuestra(admin({ id: "n1", nombre: "Osvaldo", edicion, libro_aprobado_at: "2026-09-20T00:00:00Z" }, GUION), "n1");
    // renombrados los dos que tienen título; el tercero, con su nombre del guion
    expect(m?.capitulos).toEqual(["Mis cuatro hijos", "Pelliza, 1948", "El oficio"]);
  });

  it("un título vacío o en blanco no pisa el nombre del guion", async () => {
    const edicion = { titulosCapitulos: { "La infancia": "   ", "El oficio": "" } };
    const m = await armarMuestra(admin({ id: "n1", nombre: "Osvaldo", edicion, libro_aprobado_at: "2026-09-20T00:00:00Z" }, GUION), "n1");
    expect(m?.capitulos).toEqual(["La infancia", "El oficio", "Los hijos"]);
  });
});
