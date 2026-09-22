import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// La sección Envío de Encargar libro (3t.26). Se mira el HTML: qué ve la
// familia en cada estado y cuándo la dirección deja de poder escribirse.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));

import { Envio, type EntregaVista } from "../src/app/tablero/[narradorId]/libro/envio";

const base: EntregaVista = {
  id: "ent-1", estado: "sin_direccion",
  destinatarioNombre: null, destinatarioTelefono: null, direccion: null, nota: null,
  transportista: null, seguimiento: null, seguimientoUrl: null, problema: null,
};
const render = (e: Partial<EntregaVista>) =>
  renderToStaticMarkup(createElement(Envio, { narradorId: "n1", entrega: { ...base, ...e }, queViaja: "El libro impreso y el marco" }));

describe("la sección Envío", () => {
  it("sin dirección: pide los campos, dice qué viaja y que el envío está incluido", () => {
    const html = render({});
    expect(html).toContain("Falta la dirección de envío");
    expect(html).toContain("El libro impreso y el marco");
    expect(html).toContain("el envío ya está incluido");
    for (const etiqueta of ["Quién lo recibe", "Teléfono", "Calle y número", "Ciudad", "Código postal", "País"]) {
      expect(html).toContain(etiqueta);
    }
    expect(html).toContain("Guardar la dirección");
    expect(html).not.toContain("disabled=\"\"><legend"); // el formulario está habilitado
  });

  it("enviado: muestra el transportista y el seguimiento, y ofrece 'Ya me llegó'", () => {
    const html = render({ estado: "enviado", transportista: "Andreani", seguimiento: "AR123", seguimientoUrl: "https://seguimiento.example/AR123" });
    expect(html).toContain("En camino");
    expect(html).toContain("Andreani");
    expect(html).toContain("AR123");
    expect(html).toContain("https://seguimiento.example/AR123");
    expect(html).toContain("Ya me llegó");
  });

  it("en producción: la dirección queda en gris y dice por qué", () => {
    const html = render({ estado: "en_produccion", destinatarioNombre: "Martina", direccion: { linea1: "Pelliza 1234", ciudad: "Vicente López", cp: "1638", pais: "Argentina" } });
    expect(html).toContain("Lo estamos imprimiendo");
    expect(html).toContain("Ya entró en producción con esta dirección");
    expect(html).not.toContain("Guardar la dirección");
    expect(html).toMatch(/<fieldset[^>]*disabled/);
  });

  it("con un problema: se ve el motivo", () => {
    const html = render({ estado: "con_problema", problema: "La dirección no existe" });
    expect(html).toContain("Hubo un problema con el envío");
    expect(html).toContain("La dirección no existe");
  });
});
