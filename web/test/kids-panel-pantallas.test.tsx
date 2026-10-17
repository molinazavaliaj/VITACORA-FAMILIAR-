import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// El panel de Kids en pantalla (K5): qué ve el padre, las rutas que guardan
// (solo quien compró), la página que elige entre Kids y biografía, el
// estante del Inicio y el panel de Naza.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/admin/kids",
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (a: string) => {
    throw new Error(`NEXT_REDIRECT ${a}`);
  },
}));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn(async () => ({})), usuarioDeLaSesion: vi.fn() }));
vi.mock("@/lib/panel", async (original) => ({ ...(await original<typeof import("@/lib/panel")>()), narradorDeLaSesion: vi.fn(), historiaAccesible: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { historiaAccesible, narradorDeLaSesion } from "@/lib/panel";
import { loQueCuenta, type FilaKids } from "@/lib/kids-panel";
import { PanelKids } from "../src/app/tablero/[narradorId]/kids";
import { filasIniciales, preguntasParaGuardar } from "../src/app/tablero/[narradorId]/kids-acciones";
import PaginaHistoria from "../src/app/tablero/[narradorId]/page";
import { MarcoHistoria } from "../src/app/tablero/_historia/marco";
import { LibroDelEstante } from "../src/app/tablero/_historia/estante";
import { PATCH } from "../src/app/api/kids/panel/route";
import { POST } from "../src/app/api/kids/correcciones/route";
import PantallaKids from "../src/app/admin/kids/page";
import { ordenarChicos } from "@/lib/admin/kids";
import { NavegacionAdmin } from "../src/app/admin/nav";
import { LEE_TODO, PANEL_CASILLA, PANEL_GUIA, QUIEN_LA_MANDA } from "../src/app/_textos/panel-kids";
import { FICHA, baseFalsa, fila, resp } from "./kids-datos";

const esc = (s: string) => renderToStaticMarkup(<>{s}</>);
const N = { id: "n1", nombre: "Tomás Pérez", como_le_dicen: "Tomi", estado: "activo" };

function pantalla(f: FilaKids, respuestas = [resp("K1"), resp("K12-R1"), resp("K41", { transcripcion: "del sobre" })]) {
  return renderToStaticMarkup(<PanelKids n={N} fila={f} capitulos={loQueCuenta(respuestas, [], f.fichaMotor ?? f.ficha, f.correcciones ?? [])} />);
}

describe("el panel de Kids del padre", () => {
  it("lo que cuenta por parte, la cápsula marcada, con la paleta de Kids y los textos aprobados literales", () => {
    const html = pantalla(fila({ fichaMotor: FICHA, avance: { capitulo: 2, preguntasPadreAbiertas: true } }));
    expect(html).toContain('data-producto="kids"');
    expect(html).toContain(esc("El libro de Tomi"));
    expect(html).toContain(esc("Va por la parte 2, «Mi gente»."));
    expect(html).toContain(esc(LEE_TODO));
    expect(html).toContain(esc("De chiquito"));
    expect(html).toContain(esc("Del sobre cerrado"));
    expect(html).toContain(esc("del sobre"));
    expect(html).toContain('src="/api/audio/');
    // Tus preguntas: guía, casilla y «¿Quién se la manda?» con quién se lo regala de entrada.
    expect(html).toContain(esc(PANEL_GUIA.titulo));
    expect(html).toContain(esc(PANEL_GUIA.p1("Tomi")));
    expect(html).toContain(esc(PANEL_GUIA.p5));
    for (const e of PANEL_GUIA.ejemplos) expect(html).toContain(esc(e));
    expect(html).toContain(esc(PANEL_CASILLA));
    expect(html).toContain(esc(QUIEN_LA_MANDA));
    expect(html).toContain('value="tu mamá"');
    // La hora y los temas, con los textos de la compra.
    expect(html).toContain(esc("A qué hora le escribimos"));
    expect(html).toContain(esc("Un abuelo o abuela que murió"));
    expect(html).toContain(esc("Corregir un nombre"));
    for (const p of ["undefined", "NaN", "tu hijo", "amor"]) expect(html).not.toContain(p);
  });

  it("los textos aprobados son los de mensajes.md §6, letra por letra", () => {
    expect(PANEL_GUIA.p1("Tomi")).toBe(
      "Podés agregar hasta tres preguntas tuyas. Le llegan a Tomi cerca del final, entre la cuarta parte y el sobre cerrado. Antes de cada una le decimos que viene de vos, salvo que prefieras que le llegue como una pregunta más.",
    );
    expect(PANEL_GUIA.p3).toBe('Funciona mejor pedirle una vez concreta que una opinión. "Contame la vez que…" saca mucho más que "¿Qué sentís?" o "¿Qué pensás de…?".');
    expect(PANEL_CASILLA).toBe("Que le llegue como una pregunta más, sin decir que es mía");
  });

  it("con las preguntas cerradas no hay formulario: muestra las que quedaron y cómo le llegan", () => {
    const motor = { ...FICHA, preguntasPadre: [{ texto: "Contame la bici.", conLinea: true }, { texto: "Contame el diente.", conLinea: false }] };
    const html = pantalla(fila({ fichaMotor: motor, avance: { capitulo: 4, preguntasPadreAbiertas: false } }));
    expect(html).toContain(esc("Ya empezó la cuarta parte, así que tus preguntas no se cambian más."));
    expect(html).toContain(esc("Contame la bici."));
    expect(html).toContain(esc("Antes le llega «Esta pregunta te la manda tu mamá, con sus palabras.»"));
    expect(html).toContain(esc("Le llega como una pregunta más."));
    expect(html).not.toContain(esc(PANEL_CASILLA));
  });

  it("lo pendiente se ve como pendiente, y el error del motor, claro", () => {
    const html = pantalla(fila({ cambios_panel: { hora: "10:00", preguntasPadre: [{ texto: "Contame la vez que llovió.", conLinea: true }], pedido_at: "x" }, cambios_error: "preguntas-cerradas" }));
    expect(html).toContain(esc("Guardado. Se aplica antes de la próxima pregunta."));
    expect(html).toContain(esc("Contame la vez que llovió."));
    expect(html).toContain('<option value="10:00" selected="">');
    expect(html).toContain('role="alert"');
    expect(html).toContain(esc("Tus preguntas no llegaron a tiempo."));
    const otro = pantalla(fila({ cambios_error: "Ficha: hora 23:00 fuera de 09:00–21:59" }));
    expect(otro).toContain(esc("No pudimos aplicar tu último cambio."));
    expect(otro).not.toContain("Ficha:");
  });

  it("al terminar, ni preguntas ni ajustes; sin respuestas, el vacío", () => {
    const html = pantalla(fila({ termino_at: "2026-10-15T00:00:00Z" }), []);
    expect(html).toContain(esc("Tomi terminó de contar."));
    expect(html).not.toContain(esc("A qué hora le escribimos"));
    expect(html).toContain(esc("Cuando Tomi conteste la primera pregunta, lo que cuente aparece acá."));
  });

  it("el formulario de preguntas: tres filas, casilla = sin línea", () => {
    const filas = filasIniciales([{ texto: "Contame la bici.", conLinea: false, quien: "tu papá" }], "tu mamá");
    expect(filas).toEqual([
      { texto: "Contame la bici.", quien: "tu papá", sinLinea: true },
      { texto: "", quien: "tu mamá", sinLinea: false },
      { texto: "", quien: "tu mamá", sinLinea: false },
    ]);
    expect(preguntasParaGuardar([...filas.slice(0, 2), { texto: " Otra ", quien: "", sinLinea: false }])).toEqual([
      { texto: "Contame la bici.", conLinea: false, quien: "tu papá" },
      { texto: "Otra", conLinea: true },
    ]);
  });
});

// ── Las rutas ────────────────────────────────────────────────────────────

const peticion = (body: unknown) => ({ json: async () => body, nextUrl: { searchParams: new URLSearchParams("narrador=n1") } }) as never;
const FILA = { narrador_id: "n1", canal: "A", ficha: FICHA, fichaMotor: null, cambios_panel: null, cambios_error: null, avance: {}, correcciones: [], termino_at: null };

describe("las rutas del panel de Kids", () => {
  beforeEach(() => {
    vi.mocked(narradorDeLaSesion).mockReset();
  });

  it("solo quien compró: pide soloDuena y devuelve el 403 sin tocar la base", async () => {
    const base = baseFalsa({});
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    vi.mocked(narradorDeLaSesion).mockResolvedValue({ ok: false, status: 403, error: "Solo quien compró el libro puede hacer esto." });
    expect((await PATCH(peticion({ hora: "10:00" }))).status).toBe(403);
    expect((await POST(peticion({ respuestaId: "r1", dice: "a", es: "b" }))).status).toBe(403);
    expect(vi.mocked(narradorDeLaSesion).mock.calls.every((c) => (c[3] as { soloDuena?: boolean }).soloDuena === true)).toBe(true);
    expect(base.llamadas).toEqual([]);
  });

  it("PATCH guarda y contesta lo pendiente; un cuerpo malo, 400 con su texto", async () => {
    vi.mocked(narradorDeLaSesion).mockResolvedValue({ ok: true, narrador: { id: "n1" } as never, rol: "duena", user: { id: "u1" } });
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa({ kids_v2: [{ data: FILA, error: null }, { data: [{ narrador_id: "n1" }], error: null }] }).admin);
    const r = await PATCH(peticion({ hora: "10:00" }));
    expect(r.status).toBe(200);
    expect((await r.json()).pendiente).toMatchObject({ hora: "10:00" });
    const mala = await PATCH(peticion({ hora: "03:00" }));
    expect(mala.status).toBe(400);
    expect((await mala.json()).error).toBe("Elegí una hora de la lista.");
  });

  it("PATCH con las preguntas cerradas da 409 con el texto claro", async () => {
    vi.mocked(narradorDeLaSesion).mockResolvedValue({ ok: true, narrador: { id: "n1" } as never, rol: "duena", user: { id: "u1" } });
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa({ kids_v2: [{ data: { ...FILA, fichaMotor: FICHA, avance: { capitulo: 4, preguntasPadreAbiertas: false } }, error: null }] }).admin);
    const r = await PATCH(peticion({ preguntasPadre: [{ texto: "hola", conLinea: true }] }));
    expect(r.status).toBe(409);
    expect((await r.json()).error).toContain("cuarta parte");
  });

  it("POST de una corrección que no está en la respuesta, 400", async () => {
    vi.mocked(narradorDeLaSesion).mockResolvedValue({ ok: true, narrador: { id: "n1" } as never, rol: "duena", user: { id: "u1" } });
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa({ respuestas: [{ data: { id: "r1", transcripcion: "con Yaco", texto_directo: null }, error: null }] }).admin);
    const r = await POST(peticion({ respuestaId: "r1", dice: "Pepe", es: "Pepa" }));
    expect(r.status).toBe(400);
    expect((await r.json()).falla).toBe("no-esta");
  });
});

// ── La página: Kids o biografía ──────────────────────────────────────────

describe("/tablero/<id> elige el panel", () => {
  const params = (id: string) => ({ params: Promise.resolve({ narradorId: id }), searchParams: Promise.resolve({}) }) as never;
  const narrador = (contexto: Record<string, unknown> | null) => ({
    id: "n1", nombre: "Tomás", como_le_dicen: "Tomi", estado: "activo", dia_actual: 3, alerta_silencio: false, familia_id: "f1", created_at: "2026-10-01", contexto,
  });

  beforeEach(() => {
    vi.mocked(usuarioDeLaSesion).mockResolvedValue({ id: "u1", email: "laura@ejemplo.com" } as never);
  });

  it("una biografía no consulta kids_v2 y sale el marco de siempre", async () => {
    const base = baseFalsa({});
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    vi.mocked(historiaAccesible).mockResolvedValue({ historia: { narrador: narrador({ vinculoComprador: "su hija" }), rol: "duena" }, error: null });
    const el = (await PaginaHistoria(params("n1"))) as { type: unknown };
    expect(el.type).toBe(MarcoHistoria);
    expect(base.llamadas.some((l) => l.tabla === "kids_v2")).toBe(false);
  });

  it("un chico con fila en kids_v2 ve el panel de Kids", async () => {
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa({ kids_v2: [{ data: FILA, error: null }], respuestas: [{ data: [], error: null }], fotos: [{ data: [], error: null }] }).admin);
    vi.mocked(historiaAccesible).mockResolvedValue({ historia: { narrador: narrador({ modo: "kids" }), rol: "duena" }, error: null });
    const el = (await PaginaHistoria(params("n1"))) as { type: unknown };
    expect(el.type).toBe(PanelKids);
  });

  it("un invitado a un chico de Kids no lo ve", async () => {
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa({ kids_v2: [{ data: FILA, error: null }], respuestas: [{ data: [], error: null }], fotos: [{ data: [], error: null }] }).admin);
    vi.mocked(historiaAccesible).mockResolvedValue({ historia: { narrador: narrador({ modo: "kids" }), rol: "invitado" }, error: null });
    await expect(PaginaHistoria(params("n1"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("marcado como Kids pero sin la tabla (migración sin aplicar), sale como hoy", async () => {
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa({ kids_v2: [{ data: null, error: { code: "42P01", message: 'relation "kids_v2" does not exist' } }] }).admin);
    vi.mocked(historiaAccesible).mockResolvedValue({ historia: { narrador: narrador({ modo: "kids" }), rol: "duena" }, error: null });
    const el = (await PaginaHistoria(params("n1"))) as { type: unknown };
    expect(el.type).toBe(MarcoHistoria);
  });
});

// ── El estante del Inicio ───────────────────────────────────────────────

describe("el chico en el Inicio", () => {
  const h = { narrador: { id: "n1", nombre: "Tomás", como_le_dicen: "Tomi", estado: "activo", dia_actual: 0, alerta_silencio: false, familia_id: "f1", created_at: "x", contexto: { modo: "kids" } }, rol: "duena" as const };
  const r = { respondidas: 0, total: 30, segundos: 0, tieneAnticipo: false, aprobado: false, portadaFotoId: null, titulo: null, pedido: { impresos: 0, marcos: 0, libroEntregado: false, impresoEnCasa: false, direccionEditable: false } as never };

  it("con su título, cómo va y sus preguntas como próximo paso; sin «de 30 respuestas»", () => {
    const html = renderToStaticMarkup(<LibroDelEstante h={h} r={{ ...r, kids: { canal: "A", arranco: true, capitulo: 3, terminado: false, abiertas: true } }} region="AR" />);
    expect(html).toContain('data-producto="kids"');
    expect(html).toContain(esc("El libro de Tomi"));
    expect(html).toContain(esc("Va por la parte 3, «Mi mundo ahora»."));
    expect(html).toContain(esc("Escribí tus preguntas para el libro"));
    expect(html).toContain('href="/tablero/n1#tus-preguntas"');
    expect(html).not.toContain("de 30 respuestas");
  });

  it("sin kids, la tarjeta de siempre", () => {
    const html = renderToStaticMarkup(<LibroDelEstante h={{ ...h, narrador: { ...h.narrador, contexto: {} } }} r={{ ...r, kids: null }} region="AR" />);
    expect(html).toContain("de 30 respuestas");
    expect(html).not.toContain('data-producto="kids"');
  });
});

// ── El panel de Naza ─────────────────────────────────────────────────────

describe("/admin/kids", () => {
  const chico = (nombre: string, marcas: { motivo: string; detalle?: string; at: string }[], creada: string) => ({
    narrador_id: nombre, canal: "A", avance: { capitulo: 2 }, marcas, creada_at: creada, empezo_at: creada, termino_at: null,
    narradores: { nombre, como_le_dicen: nombre.slice(0, 3), estado: "activo", ultima_respuesta_at: null },
  });

  it("ordena lo preocupante primero, después los silencios, después el resto", () => {
    const lista = ordenarChicos([
      { marcas: [], creadaAt: "2026-10-03" },
      { marcas: [{ motivo: "silencio-8-dias", at: "2026-10-10" }], creadaAt: "2026-10-01" },
      { marcas: [{ motivo: "escribio-despues-del-final", at: "2026-10-12" }, { motivo: "preocupante", at: "2026-10-05" }], creadaAt: "2026-10-02" },
      { marcas: [{ motivo: "silencio-8-dias", at: "2026-10-14" }], creadaAt: "2026-10-01" },
    ]);
    expect(lista.map((c) => c.marcas[0]?.at ?? c.creadaAt)).toEqual(["2026-10-12", "2026-10-14", "2026-10-10", "2026-10-03"]);
  });

  it("muestra cada chico con su avance y sus marcas (motivo, detalle, fecha), lo preocupante arriba", async () => {
    vi.mocked(crearClienteServidor).mockReturnValue(
      baseFalsa({
        kids_v2: [{ data: [chico("Lucía", [], "2026-10-05"), chico("Mateo", [{ motivo: "preocupante", detalle: "dijo «me pegan»", at: "2026-10-14T10:00:00Z" }], "2026-10-01")], error: null }],
      }).admin,
    );
    const html = renderToStaticMarkup(await PantallaKids());
    expect(html.indexOf("Mateo")).toBeLessThan(html.indexOf("Lucía"));
    expect(html).toContain("algo preocupante");
    expect(html).toContain(esc("dijo «me pegan»"));
    expect(html).toContain("14/10/2026");
    expect(html).toContain("parte 2 de 5");
    expect(html).not.toContain("undefined");
  });

  it("sin la tabla, lo dice en vez de romperse", async () => {
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa({ kids_v2: [{ data: null, error: { code: "42P01", message: 'relation "kids_v2" does not exist' } }] }).admin);
    expect(renderToStaticMarkup(await PantallaKids())).toContain("todavía no existe");
  });

  it("la pestaña está en la navegación", () => {
    expect(renderToStaticMarkup(<NavegacionAdmin />)).toContain('href="/admin/kids"');
  });
});
