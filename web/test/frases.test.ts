import { describe, it, expect } from "vitest";
import {
  aplicarSeleccion, elegidasDe, frasesPublicables, resumenDeCorte, validarSeleccion, duracionCorta, tieneAudio,
  type FrasesJson, type FraseCandidata,
} from "../src/lib/frases";

// «Su voz»: lo que la web decide sobre frases.json (puro). El archivo lo crea
// la fábrica y lo completa el worker; acá solo se toca elegida/elegida_por y
// confirmado_at — y se verifica que NADA más cambie.

function frase(id: string, elegida: boolean, extra: Partial<FraseCandidata> = {}): FraseCandidata {
  return {
    id, texto: `texto ${id}`, origen: "cita", grupo: null, respuesta_id: "r-1", pregunta_orden: 3,
    por_que: "se repite en la mesa", elegida, elegida_por: "modelo", estado: "pendiente",
    audio_path: null, segundos: null, inicio: null, fin: null, ...extra,
  };
}

function archivo(): FrasesJson {
  return {
    version: 1, narrador_id: "n-1", pedido_id: "p-1", confirmado_at: null,
    capitulos: [
      { numero: 1, capitulo: "La infancia", candidatas: [frase("c01-01", true), frase("c01-02", true), frase("c01-03", true), frase("c01-04", false)] },
      { numero: 2, capitulo: "El trabajo", candidatas: [frase("c02-01", true, { estado: "cortada", audio_path: "n-1/voz/frases/c02_01.mp3", segundos: 12.4 }), frase("c02-02", false, { estado: "cortada", audio_path: "n-1/voz/frases/c02_02.mp3" })] },
    ],
  };
}

describe("aplicarSeleccion", () => {
  it("reemplaza una elegida por una alternativa: la nueva queda de la familia, la sacada también", () => {
    const r = aplicarSeleccion(archivo(), [{ numero: 1, elegidas: ["c01-01", "c01-02", "c01-04"] }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const cap = r.frases.capitulos[0];
    expect(elegidasDe(cap).map((f) => f.id)).toEqual(["c01-01", "c01-02", "c01-04"]);
    expect(cap.candidatas.find((f) => f.id === "c01-04")).toMatchObject({ elegida: true, elegida_por: "familia" });
    expect(cap.candidatas.find((f) => f.id === "c01-03")).toMatchObject({ elegida: false, elegida_por: "familia" });
    // Las que no tocó siguen siendo del modelo.
    expect(cap.candidatas.find((f) => f.id === "c01-01")).toMatchObject({ elegida: true, elegida_por: "modelo" });
    expect(r.cambios).toBe(2);
    // El capítulo que no mandó no se toca; el archivo no se confirma solo.
    expect(r.frases.capitulos[1]).toEqual(archivo().capitulos[1]);
    expect(r.frases.confirmado_at).toBeNull();
  });

  it("el orden de las elegidas pasa a ser el orden del archivo (es el impreso)", () => {
    const r = aplicarSeleccion(archivo(), [{ numero: 1, elegidas: ["c01-03", "c01-01", "c01-02"] }]);
    if (!r.ok) throw new Error(r.mensaje);
    expect(r.frases.capitulos[0].candidatas.map((f) => f.id)).toEqual(["c01-03", "c01-01", "c01-02", "c01-04"]);
    expect(r.frases.capitulos[0].candidatas[0].elegida_por).toBe("familia"); // la movió
  });

  it("no toca lo que escribe el worker (audio, segundos, estado)", () => {
    const r = aplicarSeleccion(archivo(), [{ numero: 2, elegidas: ["c02-02"] }]);
    if (!r.ok) throw new Error(r.mensaje);
    const c02 = r.frases.capitulos[1].candidatas.find((f) => f.id === "c02-01")!;
    expect(c02).toMatchObject({ elegida: false, estado: "cortada", audio_path: "n-1/voz/frases/c02_01.mp3", segundos: 12.4 });
  });

  it("cero frases en un capítulo está permitido; más de 3, no", () => {
    expect(aplicarSeleccion(archivo(), [{ numero: 1, elegidas: [] }]).ok).toBe(true);
    const r = aplicarSeleccion(archivo(), [{ numero: 1, elegidas: ["c01-01", "c01-02", "c01-03", "c01-04"] }]);
    expect(r).toMatchObject({ ok: false, mensaje: expect.stringContaining("como mucho 3") });
  });

  it("una frase que no es del capítulo, o repetida, se rechaza (nunca se inventa una frase)", () => {
    expect(aplicarSeleccion(archivo(), [{ numero: 1, elegidas: ["c02-01"] }])).toMatchObject({ ok: false, mensaje: expect.stringContaining("c02-01") });
    expect(aplicarSeleccion(archivo(), [{ numero: 1, elegidas: ["c01-01", "c01-01"] }])).toMatchObject({ ok: false, mensaje: expect.stringContaining("repetida") });
  });

  it("sin cambios no hay cambios, y confirmar anota la fecha", () => {
    const r = aplicarSeleccion(archivo(), [{ numero: 1, elegidas: ["c01-01", "c01-02", "c01-03"] }], { confirmar: true, ahora: new Date("2026-09-21T10:00:00Z") });
    if (!r.ok) throw new Error(r.mensaje);
    expect(r.cambios).toBe(0);
    expect(r.frases.capitulos[0]).toEqual(archivo().capitulos[0]);
    expect(r.frases.confirmado_at).toBe("2026-09-21T10:00:00.000Z");
  });
});

describe("lo que se publica y lo que se cuenta", () => {
  it("solo elegidas con audio cortado", () => {
    const pub = frasesPublicables(archivo());
    expect(pub.map((p) => [p.capitulo.numero, p.frases.map((f) => f.id)])).toEqual([[2, ["c02-01"]]]);
    expect(tieneAudio(frase("x", true, { estado: "cortada", audio_path: "" }))).toBe(false);
  });
  it("el resumen del corte", () => {
    expect(resumenDeCorte(archivo())).toEqual({ total: 6, cortadas: 2, pendientes: 4, fallidas: 0, elegidas: 4 });
  });
  it("valida lo que llega por la API", () => {
    expect(validarSeleccion([{ numero: 1, elegidas: ["a"] }])).toEqual({ ok: true, seleccion: [{ numero: 1, elegidas: ["a"] }] });
    expect(validarSeleccion([{ numero: "1", elegidas: ["a"] }]).ok).toBe(false);
    expect(validarSeleccion({}).ok).toBe(false);
  });
  it("la duración corta", () => {
    expect(duracionCorta(12.4)).toBe("0:12");
    expect(duracionCorta(134)).toBe("2:14");
    expect(duracionCorta(null)).toBe("");
  });
});
