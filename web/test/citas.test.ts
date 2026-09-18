import { describe, it, expect } from "vitest";
import { citasDeNombre, oraciones, resaltar } from "../src/lib/citas";

const respuestas = [
  { pregunta_orden: 3, transcripcion: "Me acuerdo de mi viejo llegando de laburar. Vivíamos en Pelliza, en la casa de la calle Roca. Los perros eran galguitos." },
  { pregunta_orden: 1, transcripcion: "Bueno, yo si me tengo que imaginar la casa de pelliza, donde viví de chico… era grande.\nMi abuela Dora cocinaba." },
  { pregunta_orden: 7, transcripcion: null, texto_directo: "Con Dora íbamos a la feria." },
];

describe("citasDeNombre — la frase textual donde se dijo el nombre", () => {
  it("devuelve las oraciones donde aparece, en orden de pregunta, sin importar mayúsculas ni acentos", () => {
    expect(citasDeNombre("Pelliza", respuestas)).toEqual([
      { orden: 1, frase: "Bueno, yo si me tengo que imaginar la casa de pelliza, donde viví de chico… era grande." },
      { orden: 3, frase: "Vivíamos en Pelliza, en la casa de la calle Roca." },
    ]);
  });

  it("usa el texto directo cuando no hay transcripción, y respeta el máximo", () => {
    expect(citasDeNombre("Dora", respuestas, 1)).toEqual([{ orden: 1, frase: "Mi abuela Dora cocinaba." }]);
    expect(citasDeNombre("Dora", respuestas)).toHaveLength(2);
  });

  it("palabra entera: 'Roca' no encuentra 'Rocamora', y un nombre que no está da vacío", () => {
    expect(citasDeNombre("Roca", [{ pregunta_orden: 1, transcripcion: "Fuimos a Rocamora." }])).toEqual([]);
    expect(citasDeNombre("Martina", respuestas)).toEqual([]);
  });

  it("oraciones: corta en . ! ? y saltos de línea; los puntos suspensivos son una pausa", () => {
    expect(oraciones("Hola. ¿Cómo va? Bien… creo\nOtra")).toEqual(["Hola.", "¿Cómo va?", "Bien… creo", "Otra"]);
  });

  it("resaltar: parte la frase alrededor del nombre tal como se dijo", () => {
    expect(resaltar("Vivíamos en Pellíza, cerca.", "Pelliza")).toEqual(["Vivíamos en ", "Pellíza", ", cerca."]);
    expect(resaltar("Nada que ver.", "Pelliza")).toBeNull();
  });
});
