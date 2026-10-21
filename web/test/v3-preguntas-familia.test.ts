import { describe, expect, it } from "vitest";
import { preguntasDeLaFamiliaV3, type FilaPreguntaFamiliaV3 } from "@/lib/v3";
import { idiomaPreguntasFamilia, textosPreguntasFamilia } from "@/lib/preguntas-familia-textos";

// 20/10 (Naza, probando el regalo para su madre): la familia sumaba una pregunta y después no la veía en
// ningún lado. Ahora la página de su historia las lista tal cual las escribió y dice en qué quedaron.

const fila = (id: string, orden: number, texto: string, tipo = "familia"): FilaPreguntaFamiliaV3 => ({ id, orden, texto, tipo });

describe("las preguntas de la familia V3", () => {
  it("lista solo las de la familia, en el orden en que se sumaron y con su texto exacto", () => {
    const filas = [fila("b", 201, "¿Y el perro Tobi?"), fila("x", 3, "¿Dónde naciste?", "fija"), fila("a", 200, "  ¿Cómo conociste a papá?  ")];
    expect(preguntasDeLaFamiliaV3({}, filas)).toEqual([
      { id: "a", texto: "¿Cómo conociste a papá?", estado: "por hacer" },
      { id: "b", texto: "¿Y el perro Tobi?", estado: "por hacer" },
    ]);
  });

  it("dice si ya contestó, si está esperando, si la dejó pasar o si todavía no se la hicimos", () => {
    const estado = {
      respuestas: [["OR1", "En Jujuy."], ["F:a", "En un baile."]] as [string, string][],
      charla: [
        { de: "bio", partes: [{ id: "M15", texto: "Tu familia quiere saber algo." }, { id: "F:a", texto: "¿Cómo conociste a papá?" }] },
        { de: "bio", partes: [{ id: "F:b", texto: "¿Y el perro Tobi?" }] },
        { de: "bio", partes: [{ id: "F:c", texto: "¿Qué cocinabas?" }] },
      ],
      esperando: "F:c",
    };
    const filas = [fila("a", 200, "¿Cómo conociste a papá?"), fila("b", 201, "¿Y el perro Tobi?"), fila("c", 202, "¿Qué cocinabas?"), fila("d", 203, "¿Y la casa de Tigre?")];
    expect(preguntasDeLaFamiliaV3(estado, filas).map((p) => p.estado)).toEqual(["contestada", "sin respuesta", "esperando", "por hacer"]);
  });

  it("con la repregunta abierta, la pregunta ya está contestada; con la segunda oportunidad abierta, espera", () => {
    const estado = { respuestas: [["F:a", "En un baile."]] as [string, string][], esperando: "RP~F:a" };
    expect(preguntasDeLaFamiliaV3(estado, [fila("a", 200, "¿Cómo conociste a papá?")])[0].estado).toBe("contestada");
    const otra = { respuestas: [] as [string, string][], esperando: "F:a~2" };
    expect(preguntasDeLaFamiliaV3(otra, [fila("a", 200, "¿Cómo conociste a papá?")])[0].estado).toBe("esperando");
  });

  it("la que no llegó antes de la foto del final queda como tarde", () => {
    const filas = [fila("a", 200, "¿Cómo conociste a papá?")];
    expect(preguntasDeLaFamiliaV3({ esperando: "FO1" }, filas)[0].estado).toBe("tarde");
    expect(preguntasDeLaFamiliaV3({ terminada: true }, filas)[0].estado).toBe("tarde");
    expect(preguntasDeLaFamiliaV3({ familiaTarde: ["F:a"] }, filas)[0].estado).toBe("tarde");
  });

  it("sin entrevista leída, todas quedan por hacer", () => {
    expect(preguntasDeLaFamiliaV3(null, [fila("a", 200, "¿Cómo conociste a papá?")])[0].estado).toBe("por hacer");
  });
});

describe("los textos de las preguntas de la familia", () => {
  it("vos para Argentina, tú para España, y catalán listo", () => {
    expect(idiomaPreguntasFamilia("vos")).toBe("ar");
    expect(idiomaPreguntasFamilia("tu")).toBe("es");
    expect(textosPreguntasFamilia("ar").estado("esperando", false)).toBe("Ya se la hicimos. Falta que conteste.");
    expect(textosPreguntasFamilia("es").estado("esperando", false)).toBe("Ya se la hemos hecho. Falta que conteste.");
    expect(textosPreguntasFamilia("ca").titulo).toBe("Les preguntes de la família");
  });

  it("ningún texto usa dos puntos ni dice «panel», en ningún idioma", () => {
    const estados = ["contestada", "esperando", "sin respuesta", "por hacer", "tarde"] as const;
    for (const idioma of ["es", "ar", "ca"] as const) {
      const T = textosPreguntasFamilia(idioma);
      const todos = [T.titulo, T.bajada, ...estados.flatMap((e) => [T.estado(e, false), T.estado(e, true)])];
      for (const t of todos) {
        expect(t).not.toMatch(/:/);
        expect(t.toLowerCase()).not.toContain("panel");
      }
    }
  });
});
