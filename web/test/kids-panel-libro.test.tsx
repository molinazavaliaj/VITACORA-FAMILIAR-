import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// El libro de Kids ya escrito en el panel del padre (decisión 9 de Naza, 15/10):
// se ve solo con listo.json, se baja con URL firmada y se aprueba una sola vez,
// solo quien compró y solo un chico de Kids.

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/tablero/n1",
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
import { kidsConImpreso, leerListoKids } from "@/lib/kids-panel";
import { PanelKids } from "../src/app/tablero/[narradorId]/kids";
import PaginaHistoria from "../src/app/tablero/[narradorId]/page";
import { GET, POST } from "../src/app/api/kids/libro/route";
import { PANEL_KIDS } from "../src/app/_textos/panel-kids";
import { FICHA, baseFalsa, fila } from "./kids-datos";

const esc = (s: string) => renderToStaticMarkup(<>{s}</>);
const N = { id: "n1", nombre: "Tomás Pérez", como_le_dicen: "Tomi", estado: "completado" };
const L = PANEL_KIDS.libro;
const LISTO = { "n1/escritor-kids/listo.json": JSON.stringify({ at: "2026-10-20T10:00:00Z", paginas: 48, sobrePaginas: 6 }) };
const FILA = fila({ fichaMotor: FICHA, avance: { capitulo: 5, terminado: true }, termino_at: "2026-10-19T10:00:00Z" });

const conLibro = (aprobadoAt: string | null, impreso = false) =>
  renderToStaticMarkup(<PanelKids n={N} fila={FILA} capitulos={[]} libro={{ listo: { at: "2026-10-20T10:00:00Z", paginas: 48, sobrePaginas: 6 }, aprobadoAt, impreso }} />);

describe("el libro en el panel de Kids", () => {
  it("sin listo.json no se ve nada del libro", () => {
    const html = renderToStaticMarkup(<PanelKids n={N} fila={FILA} capitulos={[]} />);
    expect(html).not.toContain('id="tu-libro"');
    expect(html).not.toContain(esc(L.aprobar));
    expect(html).not.toContain("/api/kids/libro");
  });

  it("con listo.json se ve, con el libro y el sobre para ver y bajar, y el botón de aprobar", () => {
    const html = conLibro(null);
    expect(html).toContain('id="tu-libro"');
    expect(html).toContain(esc(L.titulo));
    expect(html).toContain(esc(L.texto("Tomi")));
    expect(html).toContain("/api/kids/libro?narrador=n1&amp;archivo=libro");
    expect(html).toContain("/api/kids/libro?narrador=n1&amp;archivo=libro&amp;descargar=1");
    expect(html).toContain("/api/kids/libro?narrador=n1&amp;archivo=sobre");
    expect(html).toContain(esc(L.aprobar));
    expect(html).not.toContain(esc(L.aprobado(false)));
  });

  it("los textos aprobados del libro van literales (tanda 4, 16/10)", () => {
    expect(L.titulo).toBe("El libro ya está escrito");
    expect(L.texto("Tomi")).toBe("Acá está el libro de Tomi, con lo que contó. Leelo antes de aprobarlo. El sobre cerrado va aparte.");
    expect(L.algoMal).toBe("Si algo no está bien, escribinos antes de aprobarlo.");
    expect(L.confirmar).toBe("Cuando lo aprobás, queda así y ya no se cambia.");
    expect(L.aprobado(false)).toBe("Aprobaste el libro.");
    expect(L.aprobado(true)).toBe("Aprobaste el libro. Ahora lo mandamos a imprimir.");
    expect([L.ver, L.bajar, L.verSobre, L.bajarSobre, L.aprobar, L.si, L.no]).toEqual([
      "Ver el libro",
      "Descargar el libro",
      "Ver el sobre",
      "Descargar el sobre",
      "Aprobar el libro",
      "Sí, aprobarlo",
      "Todavía no",
    ]);
    expect("sobre" in L).toBe(false);
  });

  it("ya aprobado dice que está aprobado y no deja aprobar de nuevo; sin impreso no promete imprimir", () => {
    const html = conLibro("2026-10-21T10:00:00Z");
    expect(html).toContain(esc(L.aprobado(false)));
    expect(html).not.toContain("imprimir");
    expect(html).not.toContain(esc(L.aprobar));
  });

  it("ya aprobado y con impreso, suma que lo mandamos a imprimir", () => {
    const html = conLibro("2026-10-21T10:00:00Z", true);
    expect(html).toContain(esc(L.aprobado(true)));
  });

  it("cuenta como impreso si extras.impreso no es null o hay copias, en un pedido no pendiente", () => {
    expect(kidsConImpreso([])).toBe(false);
    expect(kidsConImpreso([{ estado: "pagado", extras: { tipo: "kids", impreso: null, copias: 0 } }])).toBe(false);
    expect(kidsConImpreso([{ estado: "pagado", extras: { tipo: "kids", impreso: "color", copias: 1 } }])).toBe(true);
    expect(kidsConImpreso([{ estado: "pagado", extras: { tipo: "kids", impreso: null, copias: 2 } }])).toBe(true);
    expect(kidsConImpreso([{ estado: "entregado", extras: { impreso: "color" } }])).toBe(true);
    expect(kidsConImpreso([{ estado: "pendiente", extras: { impreso: "color", copias: 1 } }])).toBe(false);
    expect(kidsConImpreso([{ estado: "pagado", extras: null }])).toBe(false);
    expect(kidsConImpreso([{ estado: "pagado", extras: { tipo: "kids", impreso: null, copias: 0 } }, { estado: "pagado", extras: { copias: 1 } }])).toBe(true);
  });

  it("listo.json roto o sin fecha no cuenta como listo", () => {
    expect(leerListoKids("{")).toBeNull();
    expect(leerListoKids(JSON.stringify({ paginas: 3 }))).toBeNull();
    expect(leerListoKids(JSON.stringify({ at: "x", paginas: "3" }))).toEqual({ at: "x", paginas: null, sobrePaginas: null });
  });
});

describe("la página lee listo.json", () => {
  const params = { params: Promise.resolve({ narradorId: "n1" }), searchParams: Promise.resolve({}) } as never;
  const narrador = { id: "n1", nombre: "Tomás", como_le_dicen: "Tomi", estado: "completado", dia_actual: 3, alerta_silencio: false, familia_id: "f1", created_at: "2026-10-01", contexto: { modo: "kids" } };
  const guion = (aprobado: string | null, pedidos: unknown[] = [{ estado: "pagado", extras: { tipo: "kids", impreso: null, copias: 0 } }]) => ({
    kids_v2: [{ data: FILA, error: null }],
    respuestas: [{ data: [], error: null }],
    fotos: [{ data: [], error: null }],
    narradores: [{ data: { libro_aprobado_at: aprobado }, error: null }],
    pedidos: [{ data: pedidos, error: null }],
  });
  beforeEach(() => {
    vi.mocked(usuarioDeLaSesion).mockResolvedValue({ id: "u1", email: "laura@ejemplo.com" } as never);
    vi.mocked(historiaAccesible).mockResolvedValue({ historia: { narrador, rol: "duena" }, error: null });
  });

  it("sin listo.json, el panel va sin libro", async () => {
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa(guion(null)).admin);
    const el = (await PaginaHistoria(params)) as { type: unknown; props: { libro: unknown } };
    expect(el.type).toBe(PanelKids);
    expect(el.props.libro).toBeNull();
  });

  it("con listo.json, el panel va con el libro y si ya se aprobó", async () => {
    vi.mocked(crearClienteServidor).mockReturnValue(baseFalsa(guion("2026-10-21T10:00:00Z"), LISTO).admin);
    const el = (await PaginaHistoria(params)) as { type: unknown; props: { libro: unknown } };
    expect(el.props.libro).toEqual({ listo: { at: "2026-10-20T10:00:00Z", paginas: 48, sobrePaginas: 6 }, aprobadoAt: "2026-10-21T10:00:00Z", impreso: false });
  });

  it("lee el pedido del narrador para saber si trae impreso", async () => {
    const base = baseFalsa(guion("2026-10-21T10:00:00Z", [{ estado: "pagado", extras: { tipo: "kids", impreso: "color", copias: 1 } }]), LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    const el = (await PaginaHistoria(params)) as { type: unknown; props: { libro: { impreso: boolean } } };
    expect(el.props.libro.impreso).toBe(true);
    expect(base.llamadas).toContainEqual({ tabla: "pedidos", metodo: "eq", args: ["narrador_id", "n1"] });
  });
});

describe("/api/kids/libro", () => {
  const peticion = (body: unknown) => ({ json: async () => body, nextUrl: { searchParams: new URLSearchParams("narrador=n1") } }) as never;
  const get = (q: string) => ({ nextUrl: { searchParams: new URLSearchParams(`narrador=n1&${q}`) } }) as never;
  const duena = (contexto: Record<string, unknown> = { modo: "kids" }) =>
    vi.mocked(narradorDeLaSesion).mockResolvedValue({ ok: true, narrador: { id: "n1", contexto } as never, rol: "duena", user: { id: "u1" } });
  const updates = (llamadas: { tabla: string; metodo: string }[]) => llamadas.filter((l) => l.tabla === "narradores" && l.metodo === "update");
  beforeEach(() => vi.mocked(narradorDeLaSesion).mockReset());

  it("aprueba una vez, con compare-and-swap; la segunda no pisa la fecha", async () => {
    duena();
    const base = baseFalsa({ kids_v2: [{ data: FILA, error: null }], narradores: [{ data: [{ libro_aprobado_at: "2026-10-21T10:00:00Z" }], error: null }] }, LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    const r = await POST(peticion({ confirmo: true }));
    expect(r.status).toBe(200);
    expect((await r.json()).aprobadoAt).toBe("2026-10-21T10:00:00Z");
    expect(updates(base.llamadas)).toHaveLength(1);
    expect(base.llamadas).toContainEqual({ tabla: "narradores", metodo: "eq", args: ["id", "n1"] });
    expect(base.llamadas).toContainEqual({ tabla: "narradores", metodo: "is", args: ["libro_aprobado_at", null] });

    // Ya estaba aprobado: el update no devuelve fila y no se pisa nada.
    const otra = baseFalsa({ kids_v2: [{ data: FILA, error: null }], narradores: [{ data: [], error: null }] }, LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(otra.admin);
    const r2 = await POST(peticion({ confirmo: true }));
    expect(r2.status).toBe(409);
    expect((await r2.json()).error).toBe(L.errores.yaAprobado);
  });

  it("sin la confirmación no aprueba", async () => {
    duena();
    const base = baseFalsa({ kids_v2: [{ data: FILA, error: null }] }, LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    expect((await POST(peticion({}))).status).toBe(400);
    expect(updates(base.llamadas)).toHaveLength(0);
  });

  it("otra persona no aprueba ni ve el libro (solo quien compró)", async () => {
    const base = baseFalsa({}, LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    vi.mocked(narradorDeLaSesion).mockResolvedValue({ ok: false, status: 403, error: "Solo quien compró el libro puede hacer esto." });
    expect((await POST(peticion({ confirmo: true }))).status).toBe(403);
    expect((await GET(get("archivo=libro"))).status).toBe(403);
    expect(vi.mocked(narradorDeLaSesion).mock.calls.every((c) => (c[3] as { soloDuena?: boolean }).soloDuena === true)).toBe(true);
    expect(base.llamadas).toEqual([]);
  });

  it("sin listo.json no aprueba ni firma", async () => {
    duena();
    const base = baseFalsa({ kids_v2: [{ data: FILA, error: null }, { data: FILA, error: null }] });
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    const r = await POST(peticion({ confirmo: true }));
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe(L.errores.noListo);
    expect((await GET(get("archivo=libro"))).status).toBe(409);
    expect(updates(base.llamadas)).toHaveLength(0);
    expect(base.llamadas.some((l) => l.metodo === "createSignedUrl")).toBe(false);
  });

  it("una biografía no se aprueba por acá", async () => {
    duena({ vinculoComprador: "su hija" });
    const base = baseFalsa({}, LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    expect((await POST(peticion({ confirmo: true }))).status).toBe(404);
    expect(base.llamadas).toEqual([]);
    // Marcada como Kids pero sin fila en kids_v2: tampoco.
    duena();
    const sinFila = baseFalsa({ kids_v2: [{ data: null, error: null }] }, LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(sinFila.admin);
    expect((await POST(peticion({ confirmo: true }))).status).toBe(404);
    expect(updates(sinFila.llamadas)).toHaveLength(0);
  });

  it("con listo.json firma el libro o el sobre y redirige; descargar pide el nombre del archivo", async () => {
    duena();
    const base = baseFalsa({ kids_v2: [{ data: FILA, error: null }, { data: FILA, error: null }] }, LISTO);
    vi.mocked(crearClienteServidor).mockReturnValue(base.admin);
    const r = await GET(get("archivo=sobre"));
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe("https://firmada.test/n1/paquete/sobre.pdf");
    await GET(get("archivo=libro&descargar=1"));
    expect(base.llamadas).toContainEqual({ tabla: "storage:audios", metodo: "createSignedUrl", args: ["n1/paquete/libro.pdf", 3600, { download: "libro.pdf" }] });
    expect((await GET(get("archivo=otro"))).status).toBe(400);
  });
});
