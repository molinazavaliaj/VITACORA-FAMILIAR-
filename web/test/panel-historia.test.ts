// «Vitácora de una historia» en el panel (plan 2026-10-21, Task 4.5): lo contado por bloque, con las reglas de
// historia sobre la charla del bot.
import { describe, expect, it } from "vitest";
import { historiaDeHistoria, llegoAlFinalHistoria, preguntasDelPanelHistoria } from "@/lib/historia-panel";

const fila = (id: string, clave: string, texto: string) => ({
  id, clave_v3: clave, audio_path: `a/${id}.ogg`, transcripcion: texto, texto_directo: null, duracion_segundos: 30, recibido_at: "2026-11-02T13:00:00Z",
});

describe("panel de historia", () => {
  const charla = [
    { de: "bio", partes: [{ id: "TEMA-ABIERTO", texto: "¿Qué historia querés contar?" }] },
    { de: "bio", partes: [{ id: "TEMA-OK", texto: "Buenísimo." }, { id: "COMO", texto: "Funciona así." }] },
    { de: "bloque", bloque: 1, nombre: "El antes" },
    { de: "bio", partes: [{ id: "HC1-A", texto: "Empecemos por el antes." }, { id: "M1", texto: "Si no va, decí paso." }] },
    { de: "bio", partes: [{ id: "M3.1", texto: "Gracias." }, { id: "HC2", texto: "¿Cómo eras?" }] },
    { de: "bloque", bloque: 7, nombre: "El final" },
    { de: "bio", partes: [{ id: "PR-H1", texto: "Esta te la manda Pablo." }] },
    { de: "bio", partes: [{ id: "F:abc", texto: "Una pregunta del panel." }] },
    { de: "bio", partes: [{ id: "RP~HC2", texto: "Me quedé pensando." }] },
    { de: "bio", partes: [{ id: "FIN-H", texto: "Hasta acá llegamos." }] },
  ];
  const estado = { charla, respuestas: [["TEMA", "El campo"], ["HC1-A", "Vivía en Tucumán"]] as [string, string][], esperando: "HC2" };

  it("muestra la historia elegida, las del banco, las de quien regala, las del panel y las repreguntas; no los mensajes", () => {
    const bloques = historiaDeHistoria(estado, [fila("r0", "TEMA", "El campo"), fila("r1", "HC1-A", "Vivía en Tucumán")]);
    expect(bloques.map((b) => b.nombre)).toEqual([null, "El antes", "El final"]);
    expect(bloques.flatMap((b) => b.preguntas.map((p) => p.clave))).toEqual(["TEMA", "HC1-A", "HC2", "PR-H1", "F:abc", "RP~HC2"]);
    const [tema, hc1, hc2] = bloques.flatMap((b) => b.preguntas);
    expect(tema).toMatchObject({ estado: "contestada", respuestas: [expect.objectContaining({ texto: "El campo" })] });
    expect(hc1).toMatchObject({ estado: "contestada", pregunta: "Empecemos por el antes." });
    expect(hc2.estado).toBe("esperando");
  });

  it("el final es la última pregunta (HC10): abierta, contestada o terminada", () => {
    expect(llegoAlFinalHistoria(null)).toBe(false);
    expect(llegoAlFinalHistoria(estado)).toBe(false);
    expect(llegoAlFinalHistoria({ esperando: "HC10" })).toBe(true);
    expect(llegoAlFinalHistoria({ respuestas: [["HC10", "x"]] })).toBe(true);
    expect(llegoAlFinalHistoria({ terminada: true })).toBe(true);
  });

  it("las preguntas del panel: por hacer hasta HC10, después tarde", () => {
    const filas = [{ id: "abc", orden: 200, texto: "Una pregunta del panel.", tipo: "familia" }, { id: "def", orden: 201, texto: "Otra.", tipo: "familia" }];
    expect(preguntasDelPanelHistoria({ ...estado, esperando: "F:abc" }, filas).map((p) => p.estado)).toEqual(["esperando", "por hacer"]);
    expect(preguntasDelPanelHistoria({ ...estado, esperando: "HC10" }, filas).map((p) => p.estado)).toEqual(["sin respuesta", "tarde"]);
  });
});
