import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// «Sus objetos preciados» (3t.30): el interruptor de Ajustes. Existe para el
// narrador que no puede sacar ni mandar fotos — a los 85, pedirle una foto y
// que no sepa cómo se siente como un examen, no como una charla.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));

import { Ajustes } from "../src/app/tablero/[narradorId]/preguntas/acciones";

const render = (props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(Ajustes, { narradorId: "n1", ritmo: "diario" as const, evitar: "", ...props } as never));

describe("el interruptor de fotos en Ajustes", () => {
  it("prendido por defecto, y explica qué se pide y cuántas son", () => {
    const html = render({ pedirFotos: true });
    expect(html).toContain("Fotos de sus cosas");
    expect(html).toContain("Pedirle fotos de sus cosas");
    expect(html).toContain("ocho en todo el libro");
    expect(html).toMatch(/type="checkbox"[^>]*checked/);
  });

  it("apagado se ve apagado", () => {
    expect(render({ pedirFotos: false })).not.toMatch(/type="checkbox"[^>]*checked/);
  });

  it("dice que la entrevista sigue igual: apagarlo no es perderse nada", () => {
    expect(render({ pedirFotos: true })).toContain("la entrevista sigue igual");
  });

  it("en una autobiografía habla en primera persona", () => {
    const html = render({ pedirFotos: true, propia: true });
    expect(html).toContain("Fotos de tus cosas");
    expect(html).toContain("Pedirme fotos de mis cosas");
  });

  it("la familia puede ver exactamente qué se le va a pedir, capítulo por capítulo", () => {
    const html = render({
      pedirFotos: true,
      objetos: [
        { orden: 101, capitulo: "La infancia", texto: "¿Guardó algo de cuando era chico?" },
        { orden: 108, capitulo: "La sabiduría", texto: "¿Hay algo que quiera que quede?" },
      ],
    });
    expect(html).toContain("Ver las 2 que le vamos a pedir");
    expect(html).toContain("La infancia");
    expect(html).toContain("¿Guardó algo de cuando era chico?");
    expect(html).toContain("Si no contesta, no insistimos");
  });

  it("en Vitácora de viaje no se ofrece: ahí las fotos son el producto", () => {
    expect(render({})).not.toContain("Fotos de sus cosas");
  });
});
