import { describe, expect, it } from "vitest";
import { claveMadre, entrevistaV3, respuestasV3ParaCerrar } from "@/lib/v3";

// 10/10: el cierre del libro de un narrador V3 ofrecía el guion viejo. «Qué dejar afuera» ahora lista lo que
// contó de verdad, por pregunta, y destildar una pregunta saca todas sus filas (la fábrica la saca entera).

const charla = [
  { de: "bloque", bloque: 1, nombre: "Origen y raíces" },
  { de: "bio", partes: [{ id: "M3.1", texto: "Gracias." }, { id: "OR1", texto: "¿Dónde naciste?" }] },
  { de: "persona", pregunta: "OR1", texto: "En Jujuy." },
  { de: "bio", partes: [{ id: "OR6-con-apodo", texto: "¿Por qué te pusieron Babu?" }] },
  { de: "bio", partes: [{ id: "CA6", texto: "¿Tuviste hermanos?" }] },
];

describe("lo que se puede dejar afuera en el cierre V3", () => {
  it("agrupa por pregunta (con su repregunta), con el texto de la pregunta como salió y todas sus filas", () => {
    const estado = {
      respuestas: [["OR1", "En Jujuy."], ["RP~OR1", "En una casa chica."], ["OR6", "Me lo puse yo."], ["CA6", "⟦botón:Sí, tuve⟧ Éramos cuatro."]] as [string, string][],
      charla,
    };
    const filas = [
      { id: "a", clave_v3: "OR1" }, { id: "b", clave_v3: "RP~OR1" }, { id: "c", clave_v3: "OR6" }, { id: "d", clave_v3: "CA6" }, { id: "e", clave_v3: "CA6" },
    ];
    expect(respuestasV3ParaCerrar(estado, filas)).toEqual([
      { clave: "OR1", pregunta: "¿Dónde naciste?", fragmento: "En Jujuy. En una casa chica.", ids: ["a", "b"] },
      { clave: "OR6", pregunta: "¿Por qué te pusieron Babu?", fragmento: "Me lo puse yo.", ids: ["c"] },
      { clave: "CA6", pregunta: "¿Tuviste hermanos?", fragmento: "Éramos cuatro.", ids: ["d", "e"] },
    ]);
  });

  it("no muestra marcas del sistema solas (inferidas, foto sin texto), ni filas ∅, ni respuestas sin fila", () => {
    const estado = { respuestas: [["CA2", "Mi mamá era buena."], ["CA3", "⟦inferida:CA2⟧"], ["FO1", "⟦foto⟧"], ["OR2", "Algo sin fila."]] as [string, string][], charla: [] };
    const filas = [{ id: "x", clave_v3: "CA2" }, { id: "y", clave_v3: "FO1" }, { id: "z", clave_v3: "∅" }, { id: "w", clave_v3: null }];
    const r = respuestasV3ParaCerrar(estado, filas);
    expect(r.map((x) => x.clave)).toEqual(["CA2"]);
    expect(r[0].pregunta).toBe("Algo que contó");
  });

  it("corta el fragmento largo y aguanta un estado roto", () => {
    const largo = "a".repeat(200);
    expect(respuestasV3ParaCerrar({ respuestas: [["OR1", largo]] }, [{ id: "a", clave_v3: "OR1" }])[0].fragmento).toHaveLength(141);
    expect(respuestasV3ParaCerrar(null, [])).toEqual([]);
    expect(respuestasV3ParaCerrar({ respuestas: "roto" as never, charla: "roto" as never }, [])).toEqual([]);
  });

  it("claveMadre", () => {
    expect(["OR1", "RP~OR1", "OR1~2"].map(claveMadre)).toEqual(["OR1", "OR1", "OR1"]);
  });
});

describe("entrevistaV3", () => {
  const cliente = (r: { data: unknown; error: unknown }) => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => r }) }) }) });
  it("con fila es V3; sin fila, null; un error de la base tira (no se toma por viejo)", async () => {
    expect(await entrevistaV3(cliente({ data: { estado: { respuestas: [] } }, error: null }), "n1")).toEqual({ estado: { respuestas: [] } });
    expect(await entrevistaV3(cliente({ data: null, error: null }), "n1")).toBeNull();
    await expect(entrevistaV3(cliente({ data: null, error: { message: "x" } }), "n1")).rejects.toThrow();
  });
});

describe("lo que el narrador ya reservó por WhatsApp", () => {
  it("no aparece (ya está afuera): ni por estado.reservadas ni por la fila reservada entera; un tramo o una repregunta reservada sí aparece", () => {
    const estado = { respuestas: [["OR1", "Secreto."], ["OR2", "Otro secreto."], ["OR3", "Algo con un tramo."], ["OR4", "Normal."]] as [string, string][], reservadas: ["OR1"] };
    const filas = [
      { id: "a", clave_v3: "OR1" },
      { id: "b", clave_v3: "RP~OR2", reservada: true },
      { id: "b2", clave_v3: "OR2" },
      { id: "c", clave_v3: "OR3", reservada: true, reservado_tramo: "un tramo" },
      { id: "d", clave_v3: "OR4", reservada: false },
    ];
    // RP~OR2 reservada sola: OR2 sigue en el libro, así que se puede dejar afuera desde acá.
    expect(respuestasV3ParaCerrar(estado, filas).map((r) => r.clave)).toEqual(["OR2", "OR3", "OR4"]);
  });
});
