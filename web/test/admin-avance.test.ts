import { describe, it, expect } from "vitest";
import { avanceDe, avanceEnPalabras, type FilaConteo } from "../src/lib/admin/avance";
import { datosDelPanel } from "../src/lib/admin/datos";
import { crearAdmin } from "./dobles";

// El avance de cada historia en el panel (Naza, 02/11: «los porcentajes están mal»). La barra
// era `dia_actual / 30`, que la V3 no avanza: una entrevista V3 por la mitad salía en 0 %.

const fila = (narrador_id: string, pregunta_orden: number, clave_v3: string | null = null, es_repregunta = false): FilaConteo => ({
  narrador_id,
  pregunta_orden,
  es_repregunta,
  clave_v3,
});

describe("una entrevista V3", () => {
  const n = { id: "n1", dia_actual: 0 };

  it("va por el bloque, no por dia_actual (que queda en 0)", () => {
    const a = avanceDe(n, { narrador_id: "n1", bloque: 6, terminada: false }, []);
    expect(a).toMatchObject({ tipo: "v3", bloque: 6, terminada: false });
    expect(a.proporcion).toBeCloseTo(6 / 15);
  });

  it("cuenta las preguntas distintas: la repregunta y la segunda oportunidad van con su madre, ∅ y null no cuentan", () => {
    const filas = [
      fila("n1", 1, "CA1"),
      fila("n1", 2, "CA1"), // dos audios para la misma
      fila("n1", 3, "RP~CA1"),
      fila("n1", 4, "CA16~2"),
      fila("n1", 5, "CA16"),
      fila("n1", 6, "∅"),
      fila("n1", 7, null),
      fila("n2", 1, "CA2"), // de otro narrador
    ];
    expect(avanceDe(n, { narrador_id: "n1", bloque: 2, terminada: false }, filas).respondidas).toBe(2);
  });

  it("terminada va llena, y un bloque raro no rompe la barra", () => {
    expect(avanceDe(n, { narrador_id: "n1", bloque: 9, terminada: true }, []).proporcion).toBe(1);
    expect(avanceDe(n, { narrador_id: "n1", bloque: null, terminada: null }, []).proporcion).toBe(0);
    expect(avanceDe(n, { narrador_id: "n1", bloque: 40, terminada: false }, []).proporcion).toBe(1);
  });

  it("se dice en palabras", () => {
    expect(avanceEnPalabras(avanceDe(n, { narrador_id: "n1", bloque: 6, terminada: false }, [fila("n1", 1, "CA1")]))).toBe(
      "bloque 6 de 15 · 1 respuesta",
    );
    expect(avanceEnPalabras(avanceDe(n, { narrador_id: "n1", bloque: 0, terminada: false }, []))).toBe("todavía no arrancó · 0 respuestas");
    expect(avanceEnPalabras(avanceDe(n, { narrador_id: "n1", bloque: 15, terminada: true }, []))).toMatch(/^entrevista terminada/);
  });
});

describe("la entrevista vieja (guion de 30)", () => {
  it("cuenta las preguntas contestadas, no el día en que va", () => {
    const n = { id: "n1", dia_actual: 17 };
    const filas = [fila("n1", 1), fila("n1", 2), fila("n1", 2), fila("n1", 3, null, true)];
    const a = avanceDe(n, undefined, filas);
    expect(a).toMatchObject({ tipo: "guion", respondidas: 2, pregunta: 17 });
    expect(a.proporcion).toBeCloseTo(2 / 30);
    expect(avanceEnPalabras(a)).toBe("2 de 30 preguntas contestadas");
  });

  it("terminado va lleno", () => {
    expect(avanceDe({ id: "n1", dia_actual: 30 }, undefined, [], true).proporcion).toBe(1);
  });
});

describe("la carga", () => {
  it("trae las entrevistas V3 y cuenta todas las respuestas, de a páginas de 1000", async () => {
    const respuestas = Array.from({ length: 2300 }, (_, i) => ({ id: String(i).padStart(5, "0"), narrador_id: "n1", pregunta_orden: i, es_repregunta: false, clave_v3: `C${i}` }));
    const { admin, pedidosA } = crearAdmin({
      narradores: [{ id: "n1", estado: "activo" }],
      entrevistas_v3: [{ narrador_id: "n1", bloque: 3, terminada: false }],
      respuestas,
    });
    const datos = await datosDelPanel(admin, new Date("2026-11-02T12:00:00Z"));
    expect(datos.entrevistasV3).toHaveLength(1);
    expect(datos.conteo).toHaveLength(2300);
    // la de los textos + tres páginas de la cuenta
    expect(pedidosA("respuestas").length).toBe(4);
  });
});
