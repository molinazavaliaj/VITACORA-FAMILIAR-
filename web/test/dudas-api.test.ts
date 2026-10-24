import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { createServerClient } from "@supabase/ssr";
import { POST } from "../src/app/api/dudas/route";

// La API de las dudas (revisión del PR #22): junta lo guardado con lo que llega
// en vez de reescribir el archivo, no acepta nada con el libro escrito, y el
// quién lo pone el servidor. Base falsa por tablas (como fotos-api.test.ts) y un
// Storage en memoria por ruta.
type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>, archivos: Record<string, string>, fallas: Record<string, unknown> = {}) {
  const subidas: { ruta: string; contenido: string }[] = [];
  function builder(tabla: string) {
    const filtros: [string, (f: Fila) => boolean][] = [];
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.order = () => b;
    b.eq = (c: string, v: unknown) => { filtros.push([c, (f) => f[c] === v]); return b; };
    b.is = (c: string, v: unknown) => { filtros.push([c, (f) => (f[c] ?? null) === v]); return b; };
    b.in = (c: string, v: unknown[]) => { filtros.push([c, (f) => v.includes(f[c])]); return b; };
    b.ilike = (c: string, v: string) => { filtros.push([c, (f) => String(f[c] ?? "").toLowerCase() === v.toLowerCase()]); return b; };
    b.update = () => b;
    let single = false;
    b.maybeSingle = () => { single = true; return b; };
    b.single = b.maybeSingle;
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      const filas = (tablas[tabla] ?? []).filter((f) => filtros.every(([, ok]) => ok(f)));
      return Promise.resolve({ data: single ? filas[0] ?? null : filas, error: null }).then(res, rej);
    };
    return b;
  }
  const storage = {
    from: () => ({
      download: vi.fn(async (ruta: string) => {
        if (fallas[ruta]) return { data: null, error: fallas[ruta] };
        if (!(ruta in archivos)) return { data: null, error: { message: "Object not found", statusCode: "404" } };
        const texto = archivos[ruta];
        return { data: { text: async () => texto }, error: null };
      }),
      list: vi.fn(async (carpeta: string) => ({
        data: Object.keys(archivos)
          .filter((r) => r.startsWith(`${carpeta}/`))
          .map((r) => ({ name: r.slice(carpeta.length + 1) })),
        error: null,
      })),
      upload: vi.fn(async (ruta: string, contenido: string) => {
        subidas.push({ ruta, contenido });
        archivos[ruta] = contenido;
        return { error: null };
      }),
    }),
  };
  return { admin: { from: vi.fn(builder), storage }, subidas };
}

const laura = { id: "u-laura", email: "laura@mail.com" };
const tio = { id: "u-tio", email: "tio.pedro@mail.com" };

function sesion(usuario: { id: string; email: string }) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: usuario }, error: null }) },
  });
}

const DUDAS = JSON.stringify({
  dudas: [
    { id: "D01", pregunta: "¿Cómo se llamaba la Negra?" },
    { id: "D02", pregunta: "¿En qué año se mudaron?" },
  ],
});
const RUTA_DUDAS = "n1/escritor/dudas-familia.json";
const RUTA_CORRECCIONES = "n1/escritor/correcciones.json";

function armar(archivos: Record<string, string>, fallas: Record<string, unknown> = {}, historias: Fila[] = []) {
  const armado = crearAdmin(
    {
      historias,
      familias: [{ id: "fam-laura", region: "AR", auth_user_id: "u-laura", nombre: "Laura", email: "laura@mail.com" }],
      narradores: [{
        id: "n1", nombre: "Alfredo", como_le_dicen: "Abuelo", estado: "completado", dia_actual: 30,
        alerta_silencio: false, familia_id: "fam-laura", created_at: "2026-09-10", contexto: {},
      }],
      invitados: [{ id: "i1", narrador_id: "n1", email: "tio.pedro@mail.com", auth_user_id: "u-tio", rol: "invitado" }],
    },
    archivos,
    fallas,
  );
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(armado.admin);
  return armado;
}

function pedido(correcciones: unknown) {
  return {
    nextUrl: new URL("http://localhost/api/dudas?narrador=n1"),
    json: async () => ({ correcciones }),
  } as never;
}

const guardado = (subidas: { contenido: string }[]) => JSON.parse(subidas[subidas.length - 1].contenido).correcciones;

beforeEach(() => vi.clearAllMocks());

describe("POST /api/dudas", () => {
  it("una historia (fila en historias) lee y guarda en la carpeta del escritor de historia", async () => {
    sesion(laura);
    const { subidas } = armar({ "n1/escritor-historia/dudas-familia.json": DUDAS }, {}, [{ narrador_id: "n1" }]);
    const r = await POST(pedido([{ dudaId: "D01", texto: "Ofelia" }]));
    expect(r.status).toBe(200);
    expect(subidas.map((x) => x.ruta)).toEqual(["n1/escritor-historia/correcciones.json"]);
  });

  it("junta con lo guardado: lo que contestó otro y lo que cargaron los socios no se pierde", async () => {
    sesion(tio);
    const { subidas } = armar({
      [RUTA_DUDAS]: DUDAS,
      [RUTA_CORRECCIONES]: JSON.stringify({
        correcciones: [
          { texto: "Nació en Salto." },
          { dudaId: "D01", texto: "Ofelia", quien: "Laura", cuando: "2026-10-11T09:00:00.000Z" },
        ],
      }),
    });
    const r = await POST(pedido([{ dudaId: "D02", texto: "1972" }]));
    expect(r.status).toBe(200);
    const lista = guardado(subidas);
    expect(lista).toHaveLength(3);
    expect(lista[0]).toEqual({ texto: "Nació en Salto." });
    expect(lista[1]).toEqual({ dudaId: "D01", texto: "Ofelia", quien: "Laura", cuando: "2026-10-11T09:00:00.000Z" });
    expect(lista[2]).toMatchObject({ dudaId: "D02", texto: "1972" });
  });

  it("la dueña queda con su nombre; el invitado sin nombre en la base, sin quien pero con su mail para los socios", async () => {
    sesion(laura);
    const a = armar({ [RUTA_DUDAS]: DUDAS });
    await POST(pedido([{ dudaId: "D01", texto: "Ofelia", quien: "inventado" }]));
    expect(guardado(a.subidas)[0]).toMatchObject({ dudaId: "D01", quien: "Laura", mail: "laura@mail.com" });

    sesion(tio);
    const b = armar({ [RUTA_DUDAS]: DUDAS });
    await POST(pedido([{ dudaId: "D01", texto: "Ofelia" }]));
    const deTio = guardado(b.subidas)[0];
    expect(deTio).not.toHaveProperty("quien");
    expect(deTio.mail).toBe("tio.pedro@mail.com");
  });

  it("con el libro escrito devuelve 409 y no escribe", async () => {
    sesion(laura);
    const { subidas } = armar({ [RUTA_DUDAS]: DUDAS, "n1/escritor/libro.md": "# El libro" });
    const r = await POST(pedido([{ dudaId: "D01", texto: "Ofelia" }]));
    expect(r.status).toBe(409);
    expect(subidas).toHaveLength(0);
  });

  it("si correcciones.json no se pudo leer (no es que no exista), no escribe: pisaría lo de los socios", async () => {
    sesion(laura);
    const { subidas } = armar({ [RUTA_DUDAS]: DUDAS }, { [RUTA_CORRECCIONES]: { message: "upstream timeout", statusCode: "500" } });
    const r = await POST(pedido([{ dudaId: "D01", texto: "Ofelia" }]));
    expect(r.status).toBe(500);
    expect(subidas).toHaveLength(0);
  });

  it("si correcciones.json está roto, no lo pisa", async () => {
    sesion(laura);
    const { subidas } = armar({ [RUTA_DUDAS]: DUDAS, [RUTA_CORRECCIONES]: "{roto" });
    const r = await POST(pedido([{ dudaId: "D01", texto: "Ofelia" }]));
    expect(r.status).toBe(500);
    expect(subidas).toHaveLength(0);
  });

  it("sin dudas-familia.json es 404; si la descarga falla por otra cosa, es un error y no un 'no hay dudas'", async () => {
    sesion(laura);
    armar({});
    expect((await POST(pedido([]))).status).toBe(404);

    armar({}, { [RUTA_DUDAS]: { message: "fetch failed" } });
    expect((await POST(pedido([]))).status).toBe(500);
  });

  it("dudas-familia.json con `dudas` que no es lista es un archivo roto", async () => {
    sesion(laura);
    const { subidas } = armar({ [RUTA_DUDAS]: '{"dudas": {"D01": "x"}}' });
    expect((await POST(pedido([{ dudaId: "D01", texto: "Ofelia" }]))).status).toBe(500);
    expect(subidas).toHaveLength(0);
  });
});
