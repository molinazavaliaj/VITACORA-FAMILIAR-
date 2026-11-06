import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Con el modo privado se cierra en el servidor, no solo en la pantalla: cada ruta que
// entrega lo que cuenta el narrador responde 403 a la dueña y a los invitados, aunque
// alguien arme la URL a mano. Sin la marca, las mismas rutas siguen como siempre.

const m = vi.hoisted(() => ({
  acceso: null as unknown,
  tablas: {} as Record<string, Record<string, unknown>[]>,
}));

vi.mock("@/lib/supabase/sesion", () => ({
  crearClienteSesion: vi.fn(async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u1" } }, error: null }) } })),
}));
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: vi.fn(() => {
    function builder(tabla: string) {
      const filtros: Record<string, unknown> = {};
      let uno = false;
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
      b.order = () => b; b.limit = () => b; b.in = () => b; b.is = () => b; b.not = () => b; b.neq = () => b;
      b.maybeSingle = () => { uno = true; return b; };
      b.single = () => { uno = true; return b; };
      b.then = (ok: (v: unknown) => unknown) => {
        const filas = (m.tablas[tabla] ?? []).filter((f) => Object.entries(filtros).every(([k, v]) => f[k] === undefined || f[k] === v));
        return Promise.resolve({ data: uno ? (filas[0] ?? null) : filas, error: null }).then(ok);
      };
      return b;
    }
    return {
      from: builder,
      storage: { from: () => ({
        download: async () => ({ data: null, error: { message: "not found" } }),
        createSignedUrl: async () => ({ data: { signedUrl: "https://firmada/x" }, error: null }),
        list: async () => ({ data: [], error: null }),
      }) },
    };
  }),
}));
vi.mock("@/lib/panel", async (original) => ({
  ...(await original<typeof import("../src/lib/panel")>()),
  narradorDeLaSesion: vi.fn(async () => m.acceso),
}));

import { GET as audioOriginal } from "../src/app/api/audio/[respuestaId]/route";
import { POST as fuera } from "../src/app/api/fuera-del-libro/route";
import { GET as nombres } from "../src/app/api/nombres/route";
import { GET as frases, POST as confirmarFrases } from "../src/app/api/frases/route";
import { GET as audioFrase } from "../src/app/api/frases/audio/[fraseId]/route";
import { GET as libroHtml } from "../src/app/api/libro/html/route";
import { GET as libroAudio } from "../src/app/api/libro/audio/[indice]/route";
import { armarMuestra } from "../src/lib/muestra";
import { accesoVoz } from "../src/lib/voz-acceso";
import { crearClienteServidor } from "../src/lib/supabase/servidor";
import type { SupabaseClient } from "@supabase/supabase-js";

const PRIVADO = { acceso: { elige: true } };
const PREFIERE_EL = { acceso: { elige: true, quien: "narrador" } };
const FAMILIA = { acceso: { elige: true, quien: "familia" } };

const pedir = (url = "http://x/api?narrador=n1", init?: ConstructorParameters<typeof NextRequest>[1]) => new NextRequest(url, init);
const post = (cuerpo: unknown) => pedir("http://x/api?narrador=n1", { method: "POST", body: JSON.stringify(cuerpo) });

function preparar(contexto: Record<string, unknown>, rol: "duena" | "invitado" = "duena") {
  const narrador = { id: "n1", familia_id: "f1", nombre: "Marta", como_le_dicen: "Marta", estado: "completado", contexto, libro_aprobado_at: "2026-11-01T00:00:00Z", edicion: null };
  m.acceso = { ok: true, narrador, rol, user: { id: "u1" } };
  m.tablas = {
    narradores: [narrador],
    familias: [{ id: "f1", auth_user_id: "u1", region: "AR" }],
    respuestas: [{ id: "r1", audio_path: "n1/a.ogg", narrador_id: "n1" }],
    pedidos: [{ id: "p1", narrador_id: "n1", familia_id: "f1", estado: "entregado", extras: { pdf: true, impreso: "color" } }],
    entregas: [{ narrador_id: "n1", familia_id: "f1", estado: "en_produccion" }],
    invitados: [],
  };
}

const RUTAS: [string, () => Promise<Response>][] = [
  ["el audio original", () => audioOriginal(pedir(), { params: Promise.resolve({ respuestaId: "r1" }) })],
  ["sacar del libro", () => fuera(post({}))],
  ["los nombres", () => nombres(pedir())],
  ["las frases", () => frases(pedir())],
  ["el audio de una frase", () => audioFrase(pedir(), { params: Promise.resolve({ fraseId: "f1" }) })],
  ["el libro", () => libroHtml(pedir())],
  ["el audio del libro", () => libroAudio(pedir(), { params: Promise.resolve({ indice: "1" }) })],
];

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));

describe("modo privado: cada ruta dice que no", () => {
  it.each(RUTAS)("%s, a la dueña", async (_n, llamar) => {
    preparar(PRIVADO);
    expect([403, 404]).toContain((await llamar()).status);
  });
  it.each(RUTAS)("%s, con «Prefiero yo»", async (_n, llamar) => {
    preparar(PREFIERE_EL);
    expect([403, 404]).toContain((await llamar()).status);
  });
  it.each(RUTAS.filter(([n]) => !["sacar del libro", "los nombres", "el audio original"].includes(n)))("%s, a un invitado", async (_n, llamar) => {
    preparar(PRIVADO, "invitado");
    expect([403, 404]).toContain((await llamar()).status);
  });
  it("confirmar las frases es el portón de imprenta: la dueña no lo puede abrir", async () => {
    preparar(PRIVADO);
    expect((await confirmarFrases(post({ confirmar: true }))).status).toBe(409);
  });
  it("con la revisión que abre soporte, quien compró lee el libro, pero los audios siguen cerrados", async () => {
    preparar({ acceso: { elige: true, revisa_familia_at: "2026-11-20T00:00:00Z" } });
    expect((await frases(pedir())).status).not.toBe(403);
    expect((await audioOriginal(pedir(), { params: Promise.resolve({ respuestaId: "r1" }) })).status).toBe(403);
    preparar({ acceso: { elige: true, revisa_familia_at: "2026-11-20T00:00:00Z" } }, "invitado");
    expect((await frases(pedir())).status).toBe(404);
  });
});

describe("sin la marca, o con «Mi familia», las mismas rutas siguen como siempre", () => {
  it.each([["sin la marca", {}], ["con «Mi familia»", FAMILIA]])("%s", async (_n, contexto) => {
    for (const [, llamar] of RUTAS) {
      preparar(contexto);
      expect((await llamar()).status).not.toBe(403);
    }
  });
});

describe("los enlaces sin sesión", () => {
  const admin = () => crearClienteServidor() as unknown as SupabaseClient;

  it("la muestra pública no existe mientras el libro está cerrado", async () => {
    preparar(PRIVADO);
    expect(await armarMuestra(admin(), "n1")).toBeNull();
  });

  it("el código impreso no abre antes de imprenta, y sí con el libro ya impreso", async () => {
    preparar(PRIVADO);
    expect((await accesoVoz(admin(), "n1")).abre).toBe(false);
    m.tablas.entregas = [{ narrador_id: "n1", estado: "enviado" }];
    expect((await accesoVoz(admin(), "n1")).abre).toBe(true);
  });

  it("sin la marca, el código abre como siempre", async () => {
    preparar({});
    expect((await accesoVoz(admin(), "n1")).abre).toBe(true);
  });
});
