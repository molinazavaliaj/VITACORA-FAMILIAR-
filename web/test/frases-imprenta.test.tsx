import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// 3t.26 fase 2 (23/09): el portón de imprenta cambió lo que significa confirmar.
// Los dos textos de esta pantalla decían lo CONTRARIO de lo que pasa ahora, y el
// peor era "si no confirmás, se imprime la que eligió el biógrafo": con el portón,
// si no confirma no se imprime nada y la familia espera para siempre un libro que
// no va a salir.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock("../src/app/tablero/[narradorId]/reproductor", () => ({ ReproductorRespuesta: () => null }));

import { SelectorDeFrases } from "../src/app/tablero/[narradorId]/frases/acciones";

const capitulos = [{
  numero: 1, titulo: "La infancia",
  candidatas: [{ id: "f1", texto: "Una casa de adobe", elegida: true, segundos: 8, path: null, respuestaId: "r1", inicio: 0, fin: 8 }],
}] as never;

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(SelectorDeFrases, { narradorId: "n1", capitulos, puedeEditar: true, ...props } as never));

describe("la pantalla de «Su voz», con el portón de imprenta", () => {
  it("sin confirmar, dice que el impreso depende de confirmar — no lo contrario", () => {
    const html = render();
    expect(html).toContain("El libro impreso sale recién cuando confirmes");
    expect(html).not.toContain("se imprime la que eligió el biógrafo");
  });

  it("confirmada, no promete que todavía se puede cambiar", () => {
    const html = render({ confirmadoAt: "2026-09-20T10:00:00Z" });
    expect(html).not.toContain("seguir cambiando hasta que se imprima");
    expect(html).toContain("Ya puede entrar a imprenta");
  });

  it("quien no puede editar no ve ninguno de los dos textos ni el botón", () => {
    const html = render({ puedeEditar: false });
    expect(html).not.toContain("Dar por buena la selección");
    expect(html).not.toContain("El libro impreso sale recién");
  });

  it("el cartel de aviso no aparece solo: se abre con el botón", () => {
    expect(render()).not.toContain("Esto va a la imprenta");
    expect(render()).toContain("Dar por buena la selección");
  });
});
