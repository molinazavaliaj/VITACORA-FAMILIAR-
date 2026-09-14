import { describe, it, expect } from "vitest";
import { leerUbicacion } from "../src/app/tablero/nav";

// La navegación tiene tres secciones. Las sub-pantallas de una historia
// (/preguntas, /nombres, /descarga) marcan "Historias"; /libro marca el suyo.

const historias = [
  { id: "n1", nombre: "Roberto", comoLeDicen: "Abuelo", rol: "duena" as const },
  { id: "n2", nombre: "Dora", comoLeDicen: "Babu", rol: "invitado" as const },
];

describe("leerUbicacion", () => {
  it("/tablero es Inicio, con la primera historia como contexto", () => {
    expect(leerUbicacion("/tablero", historias)).toEqual({ historia: historias[0], seccion: "inicio" });
  });

  it("la historia y sus sub-pantallas marcan Historias", () => {
    expect(leerUbicacion("/tablero/n2", historias).seccion).toBe("historia");
    expect(leerUbicacion("/tablero/n2/preguntas", historias).seccion).toBe("historia");
    expect(leerUbicacion("/tablero/n2/nombres", historias).seccion).toBe("historia");
    expect(leerUbicacion("/tablero/n2", historias).historia?.id).toBe("n2");
  });

  it("/libro marca Encargar libro", () => {
    expect(leerUbicacion("/tablero/n1/libro", historias).seccion).toBe("libro");
  });

  it("/tablero/cuenta no marca ninguna sección", () => {
    expect(leerUbicacion("/tablero/cuenta", historias).seccion).toBe("cuenta");
  });

  it("un id desconocido cae en Inicio con la primera historia", () => {
    expect(leerUbicacion("/tablero/otro/libro", historias)).toEqual({ historia: historias[0], seccion: "inicio" });
  });
});
