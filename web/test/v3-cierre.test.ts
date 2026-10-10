import { describe, expect, it } from "vitest";
import { claveMadre, entrevistaV3, historiaV3, llegoAlFinalV3, respuestasV3ParaCerrar, type FilaHistoriaV3 } from "@/lib/v3";

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

describe("historiaV3: la entrevista en el panel", () => {
  const fila = (id: string, clave: string, extra: Partial<FilaHistoriaV3> = {}): FilaHistoriaV3 => ({
    id, clave_v3: clave, audio_path: `n/${id}.ogg`, transcripcion: `dicho ${id}`, texto_directo: null, duracion_segundos: 30, recibido_at: "2026-10-08T10:00:00Z", ...extra,
  });
  const charla = [
    { de: "bio", partes: [{ id: "M0", texto: "Hola." }, { id: "CA1", texto: "¿Cómo era tu casa?" }] },
    { de: "persona", pregunta: "CA1", texto: "dicho a" },
    { de: "bloque", bloque: 1, nombre: "Origen y raíces" },
    { de: "bio", partes: [{ id: "M3.1", texto: "Gracias." }, { id: "EN1", texto: "Vamos a los orígenes." }] },
    { de: "bio", partes: [{ id: "OR6-con-apodo", texto: "¿Por qué te pusieron Babu?" }] },
    { de: "bio", partes: [{ id: "OR6.2", texto: "¿Tenés apodo?" }, { id: "RP~CA1", texto: "¿Y la cocina?" }] },
    { de: "bio", partes: [{ id: "CA6", texto: "¿Hermanos?" }] },
    { de: "bio", partes: [{ id: "F:p1", texto: "¿Qué te acordás de la abuela?" }] },
    { de: "bio", partes: [{ id: "OR7", texto: "¿Y el barrio?" }] },
    { de: "bio", partes: [{ id: "OR7", texto: "¿Y el barrio? (de nuevo)" }] },
  ];
  const estado = {
    charla, esperando: "OR7", reservadas: ["CA6"],
    respuestas: [["CA1", "dicho a"], ["OR6", "dicho b"], ["OR6.2", "x"], ["RP~CA1", "y"], ["CA6", "secreto"], ["F:p1", "⟦botón:No⟧"]] as [string, string][],
  };
  const filas = [
    fila("a", "CA1"), fila("b", "OR6"), fila("z", "∅"), fila("c", "RP~CA1"), fila("s", "CA6", { transcripcion: "secreto" }),
    fila("f", "F:p1", { audio_path: null, transcripcion: null, texto_directo: "⟦botón:No⟧" }),
  ];
  const h = historiaV3(estado, filas);

  it("arma los bloques en orden, sin mensajes ni entradas, y lo de antes del primer bloque va sin nombre", () => {
    expect(h.map((b) => b.nombre)).toEqual([null, "Origen y raíces"]);
    expect(h[0].preguntas.map((p) => p.clave)).toEqual(["CA1"]);
    expect(h[1].preguntas.map((p) => p.clave)).toEqual(["OR6", "OR6.2", "RP~CA1", "CA6", "F:p1", "OR7"]);
  });

  it("la pregunta va como le llegó (con apodo, la última vez que salió), con sus respuestas y audios; ∅ no aparece", () => {
    const or6 = h[1].preguntas[0];
    expect(or6).toMatchObject({ pregunta: "¿Por qué te pusieron Babu?", estado: "contestada" });
    expect(or6.respuestas).toEqual([{ id: "b", texto: "dicho b", audio: true, duracion: 30, recibidoAt: "2026-10-08T10:00:00Z" }]);
    expect(h[1].preguntas.find((p) => p.clave === "OR7")).toMatchObject({ pregunta: "¿Y el barrio? (de nuevo)", estado: "esperando", respuestas: [] });
    expect(h.flatMap((b) => b.preguntas).flatMap((p) => p.respuestas).map((r) => r.id)).not.toContain("z");
  });

  it("lo reservado se marca y no se muestra; un botón se ve como lo que tocó; sin fila, contestada igual si está en el estado", () => {
    expect(h[1].preguntas.find((p) => p.clave === "CA6")).toMatchObject({ reservada: true, respuestas: [], estado: "contestada" });
    expect(h[1].preguntas.find((p) => p.clave === "F:p1")?.respuestas[0].texto).toBe("«No»");
    expect(h[1].preguntas.find((p) => p.clave === "OR6.2")).toMatchObject({ estado: "contestada", respuestas: [] });
  });

  it("aguanta un estado vacío o roto", () => {
    expect(historiaV3(null, [])).toEqual([]);
    expect(historiaV3({ charla: "x" as never }, [])).toEqual([]);
  });
});

describe("historiaV3: las preguntas de verdad (revisión 10/10)", () => {
  const f = (id: string, clave: string, extra: Partial<FilaHistoriaV3> = {}): FilaHistoriaV3 => ({
    id, clave_v3: clave, audio_path: null, transcripcion: `dicho ${id}`, texto_directo: null, duracion_segundos: null, recibido_at: "2026-10-08T10:00:00Z", ...extra,
  });
  it("muestra G1, AMH, AD2b y FO1; no muestra AV11, FIN, M3.1 ni EN3", () => {
    const charla = [{ de: "bio", partes: ["G1", "AMH", "AD2b", "AV11", "FO1", "FIN", "M3.1", "EN3"].map((id) => ({ id, texto: `¿${id}?` })) }];
    expect(historiaV3({ charla }, [])[0].preguntas.map((p) => p.clave)).toEqual(["G1", "AMH", "AD2b", "FO1"]);
  });
  it("un tramo reservado oculta la respuesta entera; reservar solo RP~X deja a X", () => {
    const charla = [{ de: "bio", partes: [{ id: "CA6", texto: "¿Hermanos?" }, { id: "OR1", texto: "¿Dónde?" }, { id: "RP~OR1", texto: "¿Y?" }] }];
    const h = historiaV3({ charla, reservadas: ["RP~OR1"] }, [f("a", "CA6", { reservado_tramo: "lo de Rubén" }), f("b", "OR1"), f("c", "RP~OR1")]);
    const p = Object.fromEntries(h[0].preguntas.map((x) => [x.clave, x]));
    expect(p.CA6).toMatchObject({ reservada: true, respuestas: [] });
    expect(p.OR1).toMatchObject({ reservada: false });
    expect(p.OR1.respuestas).toHaveLength(1);
    expect(p["RP~OR1"]).toMatchObject({ reservada: true, respuestas: [] });
  });
  it("llegoAlFinalV3: con FO1 en la charla, abierta, contestada o terminada", () => {
    expect(llegoAlFinalV3({ charla: [{ de: "bio", partes: [{ id: "OR1", texto: "x" }] }] })).toBe(false);
    expect(llegoAlFinalV3({ charla: [{ de: "bio", partes: [{ id: "FO1", texto: "x" }] }] })).toBe(true);
    expect(llegoAlFinalV3({ esperando: "FO1" })).toBe(true);
    expect(llegoAlFinalV3({ respuestas: [["FO1", "⟦foto⟧"]] })).toBe(true);
    expect(llegoAlFinalV3({ terminada: true })).toBe(true);
    expect(llegoAlFinalV3(null)).toBe(false);
  });
});

describe("respuestasV3ParaCerrar no muestra lo reservado (revisión 10/10)", () => {
  it("una repregunta reservada no aporta texto a X; un tramo reservado tampoco, pero la pregunta queda para poder sacarla", () => {
    const estado = { respuestas: [["OR1", "Lo de mamá."], ["RP~OR1", "El secreto."], ["CA6", "Con un tramo secreto."]] as [string, string][], reservadas: ["RP~OR1"] };
    const filas = [{ id: "a", clave_v3: "OR1" }, { id: "b", clave_v3: "RP~OR1" }, { id: "c", clave_v3: "CA6", reservada: true, reservado_tramo: "secreto" }];
    const r = respuestasV3ParaCerrar(estado, filas);
    expect(r.find((x) => x.clave === "OR1")?.fragmento).toBe("Lo de mamá.");
    expect(r.find((x) => x.clave === "CA6")?.fragmento).toBe("Pidió que una parte no vaya al libro.");
    expect(JSON.stringify(r)).not.toContain("secreto");
  });
});
