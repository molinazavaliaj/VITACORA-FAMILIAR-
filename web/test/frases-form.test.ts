import { describe, it, expect } from "vitest";
import { seleccionInicial, cambiosParaGuardar } from "../src/app/tablero/[narradorId]/frases/acciones";
import type { CapituloConFrases, FraseCandidata } from "../src/lib/frases";

const f = (id: string, elegida: boolean): FraseCandidata => ({
  id, texto: id, origen: "cita", grupo: null, respuesta_id: null, pregunta_orden: 1, por_que: "", elegida, elegida_por: "modelo",
  estado: "pendiente", audio_path: null, segundos: null, inicio: null, fin: null,
});
const capitulos: CapituloConFrases[] = [
  { numero: 1, capitulo: "La infancia", candidatas: [f("a", true), f("b", true), f("c", false)] },
  { numero: 2, capitulo: "El amor", candidatas: [f("d", true)] },
];

describe("el selector de frases: qué se manda al guardar", () => {
  it("arranca con lo que eligió el biógrafo", () => {
    expect(seleccionInicial(capitulos)).toEqual({ 1: ["a", "b"], 2: ["d"] });
  });
  it("manda solo los capítulos que cambiaron, con el orden nuevo", () => {
    expect(cambiosParaGuardar(capitulos, { 1: ["a", "b"], 2: ["d"] })).toEqual([]);
    expect(cambiosParaGuardar(capitulos, { 1: ["b", "a"], 2: ["d"] })).toEqual([{ numero: 1, elegidas: ["b", "a"] }]);
    expect(cambiosParaGuardar(capitulos, { 1: ["a", "b", "c"], 2: [] })).toEqual([
      { numero: 1, elegidas: ["a", "b", "c"] }, { numero: 2, elegidas: [] },
    ]);
  });
});
