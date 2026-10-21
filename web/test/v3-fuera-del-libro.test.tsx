import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// «Que esto no vaya al libro» por respuesta (Naza, 21/10): el padre contestó desde el celular de la madre una
// pregunta que era para ella. La dueña saca esa respuesta sola desde la historia y puede pedir que se la
// volvamos a hacer. Lo demás que contó en esa pregunta sigue en el libro.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/tablero/n1", useSearchParams: () => new URLSearchParams() }));

import { HistoriaV3 } from "../src/app/tablero/[narradorId]/v3";
import { aplicarFueraDelLibro, leerPedido, puedeVolverAPreguntar } from "@/lib/fuera-del-libro";
import { idiomaFueraDelLibro, textosFueraDelLibro, type IdiomaFueraDelLibro } from "@/lib/fuera-del-libro-textos";
import { historiaV3, preguntaDeLaFila, respuestasFuera, respuestasV3ParaCerrar, sinLoSacado, type BloqueHistoriaV3, type FilaHistoriaV3 } from "@/lib/v3";

const padre = "Soy el marido, ella está en la cocina. Nos conocimos en un baile.";
const madre = "Nos conocimos en el club, yo tenía diecisiete.";
const charla = [
  { de: "bloque", bloque: 1, nombre: "Pareja" },
  { de: "bio", partes: [{ id: "PA3", texto: "¿Cómo conociste a tu marido?" }] },
  { de: "bio", partes: [{ id: "PA4", texto: "¿Dónde trabajaste?" }] },
];
const estado = { respuestas: [["PA3", `${padre} ${madre}`], ["PA4", "En el banco."]] as [string, string][], charla };
const filaH = (id: string, clave: string, transcripcion: string): FilaHistoriaV3 => ({
  id, clave_v3: clave, audio_path: `n1/${id}.ogg`, transcripcion, texto_directo: null, duracion_segundos: 30, recibido_at: "2026-10-21T13:00:00Z",
});
const filas = [filaH("r-padre", "PA3", padre), filaH("r-madre", "PA3", madre), filaH("r-banco", "PA4", "En el banco.")];

describe("las reglas en la web", () => {
  it("sinLoSacado deja lo de la madre (y rearma si no está tal cual)", () => {
    expect(sinLoSacado(`${padre} ${madre}`, [{ texto: padre, fuera: true }, { texto: madre, fuera: false }])).toBe(madre);
    expect(sinLoSacado("otra cosa", [{ texto: padre, fuera: true }, { texto: madre, fuera: false }])).toBe(madre);
    expect(sinLoSacado(padre, [{ texto: padre, fuera: true }])).toBeNull();
  });

  it("la historia marca la fila sacada y la sigue mostrando", () => {
    const p = historiaV3(estado, filas, new Set(["r-padre"]))[0].preguntas[0];
    expect(p.respuestas.map((r) => [r.id, r.fuera])).toEqual([["r-padre", true], ["r-madre", false]]);
    expect(historiaV3(estado, filas)[0].preguntas[0].respuestas.every((r) => !r.fuera)).toBe(true);
  });

  it("«Qué dejar afuera» arma el fragmento sin lo sacado y no muestra la pregunta si se sacó todo", () => {
    const conPadre = respuestasV3ParaCerrar(estado, filas, new Set(["r-padre"]));
    expect(conPadre.find((r) => r.clave === "PA3")?.fragmento).toBe(madre);
    const todo = respuestasV3ParaCerrar(estado, filas, new Set(["r-padre", "r-madre"]));
    expect(todo.map((r) => r.clave)).toEqual(["PA4"]);
  });

  it("el texto para volver a hacerla es el que le llegó (el de X para una X~2)", () => {
    expect(preguntaDeLaFila("PA3", charla)).toBe("¿Cómo conociste a tu marido?");
    expect(preguntaDeLaFila("PA3~2", charla)).toBe("¿Cómo conociste a tu marido?");
    expect(preguntaDeLaFila("ZZ9", charla)).toBeNull();
  });

  it("volver a hacerla solo si sigue la entrevista y hay lugar", () => {
    expect(puedeVolverAPreguntar({ estadoNarrador: "activo", alFinal: false, preguntasFamilia: 9 })).toBe(true);
    expect(puedeVolverAPreguntar({ estadoNarrador: "activo", alFinal: false, preguntasFamilia: 10 })).toBe(false);
    expect(puedeVolverAPreguntar({ estadoNarrador: "activo", alFinal: true, preguntasFamilia: 0 })).toBe(false);
    expect(puedeVolverAPreguntar({ estadoNarrador: "completado", alFinal: false, preguntasFamilia: 0 })).toBe(false);
  });

  it("leerPedido acepta solo lo que conoce", () => {
    expect(leerPedido({ accion: "sacar", respuestaId: "r1", volverAPreguntar: true })).toEqual({ accion: "sacar", respuestaId: "r1", volverAPreguntar: true });
    expect(leerPedido({ accion: "sacar", respuestaId: "r1", volverAPreguntar: "sí" })).toEqual({ accion: "sacar", respuestaId: "r1", volverAPreguntar: false });
    expect(leerPedido({ accion: "poner", respuestaId: "r1" })).toEqual({ accion: "poner", respuestaId: "r1" });
    expect(leerPedido({ accion: "borrar", respuestaId: "r1" })).toBeNull();
    expect(leerPedido({ accion: "sacar" })).toBeNull();
    expect(leerPedido(null)).toBeNull();
  });
});

// ── La base falsa: lo que usan respuestasFuera y aplicarFueraDelLibro ──

type Fila = Record<string, unknown>;
function baseFalsa(tablas: Record<string, Fila[]>, errores: Record<string, { code: string; message: string }> = {}) {
  const escrituras: { tabla: string; op: string; valores?: Fila; filtros: Fila }[] = [];
  const from = (tabla: string) => {
    const filtros: Fila = {};
    let op = "select";
    let valores: Fila | undefined;
    let uno = false;
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.maybeSingle = () => { uno = true; return b; };
    b.delete = () => { op = "delete"; return b; };
    b.upsert = (v: Fila) => { op = "upsert"; valores = v; return b; };
    b.insert = (v: Fila) => { op = "insert"; valores = v; return b; };
    b.then = (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => {
      if (errores[tabla]) return Promise.resolve({ data: null, error: errores[tabla] }).then(ok, ko);
      const t = (tablas[tabla] ??= []);
      if (op !== "select") {
        escrituras.push({ tabla, op, valores, filtros: { ...filtros } });
        if (op === "delete") tablas[tabla] = t.filter((f) => !Object.entries(filtros).every(([k, v]) => f[k] === v));
        if ((op === "upsert" || op === "insert") && valores) t.push(valores);
        return Promise.resolve({ data: null, error: null }).then(ok, ko);
      }
      const lista = t.filter((f) => Object.entries(filtros).every(([k, v]) => f[k] === v));
      return Promise.resolve({ data: uno ? (lista[0] ?? null) : lista, error: null }).then(ok, ko);
    };
    return b;
  };
  return { admin: { from }, escrituras, tablas };
}

const armar = (extra: { narrador?: Fila; estado?: Fila; preguntas?: Fila[] } = {}) => baseFalsa({
  narradores: [{ id: "n1", estado: "activo", libro_aprobado_at: null, ...extra.narrador }],
  entrevistas_v3: [{ narrador_id: "n1", estado: extra.estado ?? estado, idioma: "es-AR" }],
  respuestas: [{ id: "r-padre", narrador_id: "n1", clave_v3: "PA3" }, { id: "r-nada", narrador_id: "n1", clave_v3: "∅" }, { id: "r-otro", narrador_id: "n2", clave_v3: "PA3" }],
  preguntas: extra.preguntas ?? [],
  respuestas_fuera: [],
});
const ERROR = "No pudimos guardar. Probá de nuevo.";
const aplicar = (b: ReturnType<typeof armar>, pedido: Parameters<typeof aplicarFueraDelLibro>[1]["pedido"], rol: "duena" | "invitado" = "duena") =>
  aplicarFueraDelLibro(b.admin, { narradorId: "n1", rol, usuarioId: "u1", pedido, error: ERROR });

describe("aplicarFueraDelLibro", () => {
  beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); });

  it("saca la respuesta y, deshecho, vuelve a ponerla", async () => {
    const b = armar();
    expect(await aplicar(b, { accion: "sacar", respuestaId: "r-padre" })).toEqual({ status: 200, cuerpo: { ok: true, volvemosAPreguntar: false } });
    expect(b.tablas.respuestas_fuera).toEqual([{ respuesta_id: "r-padre", narrador_id: "n1", marcada_por: "u1" }]);
    expect(await aplicar(b, { accion: "poner", respuestaId: "r-padre" })).toEqual({ status: 200, cuerpo: { ok: true } });
    expect(b.tablas.respuestas_fuera).toEqual([]);
  });

  it("si pide volver a hacerla, suma una pregunta de la familia con el texto que le llegó, una sola vez", async () => {
    const b = armar({ preguntas: [{ narrador_id: "n1", orden: 200, tipo: "familia", texto: "¿Y el perro?" }] });
    expect((await aplicar(b, { accion: "sacar", respuestaId: "r-padre", volverAPreguntar: true })).cuerpo).toEqual({ ok: true, volvemosAPreguntar: true });
    const nueva = b.tablas.preguntas.at(-1);
    expect(nueva).toMatchObject({ narrador_id: "n1", orden: 201, texto: "¿Cómo conociste a tu marido?", tipo: "familia", capitulo: "Preguntas de la familia", agregada_por: "u1" });
    await aplicar(b, { accion: "sacar", respuestaId: "r-padre", volverAPreguntar: true });
    expect(b.tablas.preguntas.filter((p) => p.texto === "¿Cómo conociste a tu marido?")).toHaveLength(1);
  });

  it("si ya no llega a tiempo, la saca igual y no suma la pregunta", async () => {
    const b = armar({ estado: { ...estado, terminada: true } });
    expect((await aplicar(b, { accion: "sacar", respuestaId: "r-padre", volverAPreguntar: true })).cuerpo).toEqual({ ok: true, volvemosAPreguntar: false });
    expect(b.tablas.preguntas).toEqual([]);
    expect(b.tablas.respuestas_fuera).toHaveLength(1);
  });

  it("solo la dueña, con el libro sin cerrar, sobre una respuesta V3 suya", async () => {
    expect((await aplicar(armar(), { accion: "sacar", respuestaId: "r-padre" }, "invitado")).status).toBe(403);
    expect((await aplicar(armar({ narrador: { libro_aprobado_at: "2026-10-20T00:00:00Z" } }), { accion: "sacar", respuestaId: "r-padre" })).status).toBe(400);
    for (const id of ["r-nada", "r-otro", "no-existe"]) {
      const b = armar();
      expect((await aplicar(b, { accion: "sacar", respuestaId: id })).status, id).toBe(404);
      expect(b.escrituras).toEqual([]);
    }
  });

  it("un narrador que no es V3 no se toca", async () => {
    const b = armar();
    b.tablas.entrevistas_v3 = [];
    expect((await aplicar(b, { accion: "sacar", respuestaId: "r-padre" })).status).toBe(400);
  });

  it("si la base falla, error con el texto aprobado", async () => {
    const b = baseFalsa({ narradores: [{ id: "n1", estado: "activo", libro_aprobado_at: null }], entrevistas_v3: [{ narrador_id: "n1", estado }], respuestas: [{ id: "r-padre", narrador_id: "n1", clave_v3: "PA3" }] }, { respuestas_fuera: { code: "42P01", message: "no existe" } });
    expect(await aplicarFueraDelLibro(b.admin, { narradorId: "n1", rol: "duena", usuarioId: "u1", pedido: { accion: "sacar", respuestaId: "r-padre" }, error: ERROR })).toEqual({ status: 500, cuerpo: { error: ERROR } });
  });
});

describe("respuestasFuera", () => {
  it("lee los ids; sin la tabla, ninguno; otro error tira", async () => {
    expect(await respuestasFuera(baseFalsa({ respuestas_fuera: [{ respuesta_id: "r1", narrador_id: "n1" }, { respuesta_id: "r2", narrador_id: "n2" }] }).admin, "n1")).toEqual(new Set(["r1"]));
    for (const code of ["42P01", "PGRST205"]) expect((await respuestasFuera(baseFalsa({}, { respuestas_fuera: { code, message: "x" } }).admin, "n1")).size).toBe(0);
    await expect(respuestasFuera(baseFalsa({}, { respuestas_fuera: { code: "08006", message: "x" } }).admin, "n1")).rejects.toThrow();
  });
});

describe("en la página de la historia", () => {
  const bloques = (fuera: boolean): BloqueHistoriaV3[] => [{ nombre: "Pareja", preguntas: [{
    clave: "PA3", pregunta: "¿Cómo conociste a tu marido?", estado: "contestada", reservada: false,
    respuestas: [{ id: "r-padre", texto: padre, audio: false, duracion: null, recibidoAt: "2026-10-21T13:00:00Z", fuera }],
  }] }];
  const props = {
    n: { id: "n1", nombre: "Amelia", como_le_dicen: "Amelia", estado: "activo", alerta_silencio: false },
    rol: "duena" as const, propia: false, fotos: [], usuarioId: "u1", historiasRiel: [],
    aprobado: false, historiaCerrada: false, linkPublico: null, invitados: [], ritmo: "diario" as const, alFinal: false, trato: "vos" as const, enMarco: true,
  };
  const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

  it("la dueña ve «Que esto no vaya al libro» en cada respuesta", () => {
    expect(renderToStaticMarkup(<HistoriaV3 {...props} bloques={bloques(false)} />)).toContain("Que esto no vaya al libro");
  });

  it("los invitados no lo ven, y con el libro cerrado tampoco", () => {
    expect(renderToStaticMarkup(<HistoriaV3 {...props} rol="invitado" bloques={bloques(false)} />)).not.toContain("Que esto no vaya al libro");
    expect(renderToStaticMarkup(<HistoriaV3 {...props} aprobado bloques={bloques(false)} />)).not.toContain("Que esto no vaya al libro");
  });

  it("la sacada sigue a la vista, con «No va al libro» y «Volver a ponerla»", () => {
    const html = renderToStaticMarkup(<HistoriaV3 {...props} bloques={bloques(true)} />);
    expect(html).toContain(escapar(padre));
    expect(html).toContain("No va al libro");
    expect(html).toContain("Volver a ponerla");
    expect(html).not.toContain("Que esto no vaya al libro");
    const invitado = renderToStaticMarkup(<HistoriaV3 {...props} rol="invitado" bloques={bloques(true)} />);
    expect(invitado).toContain("No va al libro");
    expect(invitado).not.toContain("Volver a ponerla");
  });

  it("en tú, el mismo link", () => {
    expect(renderToStaticMarkup(<HistoriaV3 {...props} trato="tu" bloques={bloques(false)} />)).toContain("Que esto no vaya al libro");
  });
});

describe("los textos aprobados", () => {
  const idiomas: IdiomaFueraDelLibro[] = ["ar", "es", "ca"];
  it("vos y tú según el trato", () => {
    expect(idiomaFueraDelLibro("vos")).toBe("ar");
    expect(idiomaFueraDelLibro("tu")).toBe("es");
    expect(textosFueraDelLibro("ar").pregunta).toBe("¿Sacamos esta respuesta del libro?");
    expect(textosFueraDelLibro("es").pregunta).toBe("¿Quitamos esta respuesta del libro?");
    expect(textosFueraDelLibro("ca").pregunta).toBe("Traiem aquesta resposta del llibre?");
  });

  it("sin dos puntos, sin oraciones que empiecen con «Y» y sin voseo en tú ni catalán", () => {
    for (const i of idiomas) {
      const T = textosFueraDelLibro(i);
      const todos = [T.sacar, T.pregunta, T.confirmar, T.cancelar, T.marca, T.deshacer, T.error, T.volverNo,
        ...[true, false].flatMap((p) => [T.explicacion(p), T.volverPregunta(p), T.volverExplicacion(p), T.volverSi(p)])];
      for (const t of todos) {
        expect(t, t).not.toContain(":");
        expect(t, t).not.toMatch(/(^|[.?!]\s)Y\s/);
        if (i !== "ar") expect(t, t).not.toMatch(/\b(querés|probá|contaste|equivocaste)\b/);
      }
    }
  });
});
