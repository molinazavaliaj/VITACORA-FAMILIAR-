import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { POST } from "../src/app/api/regalo/audio/route";
import { GET } from "../src/app/api/regalo/[codigo]/audio/route";
import { firmarTokenFotos } from "../src/lib/token-fotos";

// Gift card: el audio de quien regala. Base falsa por tablas (como fotos-api.test.ts),
// con Storage que registra subidas, borrados y URLs firmadas.
type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>, opciones: { falloUpdate?: boolean; falloSubida?: boolean } = {}) {
  const escrituras: { tabla: string; op: string; valores: Fila; filtros: Fila }[] = [];
  const subidas: { path: string; opciones: Fila }[] = [];
  const borrados: string[][] = [];
  const firmadas: { path: string; segundos: number }[] = [];
  const consultas: string[] = [];
  function builder(tabla: string) {
    consultas.push(tabla);
    const filtros: Fila = {};
    let op = "select";
    let valores: Fila = {};
    let single = false;
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.update = (v: Fila) => { op = "update"; valores = v; return b; };
    b.maybeSingle = () => { single = true; return b; };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      let r: { data: unknown; error: unknown };
      if (op !== "select") {
        escrituras.push({ tabla, op, valores, filtros });
        r = opciones.falloUpdate ? { data: null, error: { message: "falló" } } : { data: null, error: null };
      } else {
        const filas = (tablas[tabla] ?? []).filter((f) => Object.entries(filtros).every(([k, v]) => f[k] === v));
        r = { data: single ? (filas[0] ?? null) : filas, error: null };
      }
      return Promise.resolve(r).then(res, rej);
    };
    return b;
  }
  const storage = {
    from: () => ({
      upload: vi.fn(async (path: string, _bytes: unknown, opts: Fila) => {
        subidas.push({ path, opciones: opts });
        return { error: opciones.falloSubida ? { message: "no" } : null };
      }),
      remove: vi.fn(async (paths: string[]) => { borrados.push(paths); return { error: null }; }),
      createSignedUrl: vi.fn(async (path: string, segundos: number) => {
        firmadas.push({ path, segundos });
        return { data: { signedUrl: `https://storage.test/firmada/${path}` }, error: null };
      }),
    }),
  };
  const admin = { from: vi.fn(builder), storage };
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
  return { admin, escrituras, subidas, borrados, firmadas, consultas };
}

function armarPendiente(opciones: { falloUpdate?: boolean; falloSubida?: boolean } = {}, estado = "pendiente_pago") {
  return crearAdmin({
    narradores: [{ id: "n-regalo", estado }],
    regalos: [{ codigo: "VF-7K3M2Q", narrador_id: "n-regalo", audio_path: null }],
  }, opciones);
}

function requestConAudio(token: string | null, archivo: File | null, narrador = "n-regalo") {
  const form = new FormData();
  if (archivo) form.set("audio", archivo);
  const q = new URLSearchParams({ narrador });
  if (token !== null) q.set("token", token);
  return { nextUrl: new URL(`http://localhost/api/regalo/audio?${q}`), formData: async () => form } as never;
}

const audioWebm = () => new File([new Uint8Array([1, 2, 3])], "mensaje.webm", { type: "audio/webm;codecs=opus" });

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba"; // firma el token de fotos

beforeEach(() => { vi.clearAllMocks(); });

describe("POST /api/regalo/audio — la puerta", () => {
  it("sin token → 403 y no sube nada", async () => {
    const { subidas } = armarPendiente();
    const r = await POST(requestConAudio(null, audioWebm()));
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: "No autorizado." });
    expect(subidas).toEqual([]);
  });

  it("token de otro narrador → 403", async () => {
    const { subidas } = armarPendiente();
    const r = await POST(requestConAudio(firmarTokenFotos("n-ajeno"), audioWebm()));
    expect(r.status).toBe(403);
    expect(subidas).toEqual([]);
  });

  it("token vencido → 403", async () => {
    armarPendiente();
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo", Date.now() - 2 * 60 * 60 * 1000), audioWebm()));
    expect(r.status).toBe(403);
  });

  it("narrador que ya no está en pendiente_pago → 403", async () => {
    const { subidas } = armarPendiente({}, "regalo_pendiente");
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo"), audioWebm()));
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: "No autorizado." });
    expect(subidas).toEqual([]);
  });
});

describe("POST /api/regalo/audio — el archivo", () => {
  it("sin archivo → 400", async () => {
    const { subidas } = armarPendiente();
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo"), null));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Falta el audio." });
    expect(subidas).toEqual([]);
  });

  it("una imagen (image/png) → 400", async () => {
    const { subidas } = armarPendiente();
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo"), new File([new Uint8Array([1])], "x.png", { type: "image/png" })));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Ese archivo no es un audio." });
    expect(subidas).toEqual([]);
  });

  it("más de 10 MB → 400", async () => {
    const { subidas } = armarPendiente();
    const grande = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "largo.webm", { type: "audio/webm" });
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo"), grande));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "El audio es muy largo." });
    expect(subidas).toEqual([]);
  });

  it("audio/webm entra: se sube a <id>/regalo/mensaje.webm con upsert y se guarda el path en regalos", async () => {
    const { subidas, escrituras } = armarPendiente();
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo"), audioWebm()));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(subidas).toEqual([{ path: "n-regalo/regalo/mensaje.webm", opciones: { contentType: "audio/webm", upsert: true } }]);
    expect(escrituras).toEqual([{
      tabla: "regalos", op: "update", valores: { audio_path: "n-regalo/regalo/mensaje.webm" }, filtros: { narrador_id: "n-regalo" },
    }]);
  });

  it("si falla la subida → 500 y no toca regalos", async () => {
    const { escrituras } = armarPendiente({ falloSubida: true });
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo"), audioWebm()));
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: "No pudimos guardar el audio." });
    expect(escrituras).toEqual([]);
  });

  it("si falla guardar el path → borra el archivo subido y 500", async () => {
    const { borrados } = armarPendiente({ falloUpdate: true });
    const r = await POST(requestConAudio(firmarTokenFotos("n-regalo"), audioWebm()));
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: "No pudimos guardar el audio." });
    expect(borrados).toEqual([["n-regalo/regalo/mensaje.webm"]]);
  });
});

describe("GET /api/regalo/[codigo]/audio", () => {
  const ctx = (codigo: string) => ({ params: Promise.resolve({ codigo }) });
  const req = new Request("http://localhost/api/regalo/x/audio");

  it("un código que no normaliza → 404 sin tocar la base", async () => {
    const { consultas, firmadas } = armarPendiente();
    const r = await GET(req, ctx("no-es-codigo"));
    expect(r.status).toBe(404);
    expect(consultas).toEqual([]);
    expect(firmadas).toEqual([]);
  });

  it("un regalo sin audio → 404", async () => {
    const { firmadas } = armarPendiente();
    const r = await GET(req, ctx("VF-7K3M2Q"));
    expect(r.status).toBe(404);
    expect(firmadas).toEqual([]);
  });

  it("un código que no existe → 404", async () => {
    armarPendiente();
    const r = await GET(req, ctx("VF-222222"));
    expect(r.status).toBe(404);
  });

  it("con audio → 302 a la URL firmada por una hora; el código llega escrito como sea", async () => {
    const { firmadas } = crearAdmin({
      regalos: [{ codigo: "VF-7K3M2Q", narrador_id: "n-regalo", audio_path: "n-regalo/regalo/mensaje.webm" }],
    });
    const r = await GET(req, ctx(encodeURIComponent("vf 7k3-m2q")));
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toBe("https://storage.test/firmada/n-regalo/regalo/mensaje.webm");
    expect(firmadas).toEqual([{ path: "n-regalo/regalo/mensaje.webm", segundos: 3600 }]);
  });
});
