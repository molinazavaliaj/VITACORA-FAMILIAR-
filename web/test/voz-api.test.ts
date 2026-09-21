import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { firmarTokenVoz, firmarTokenLibro } from "../src/lib/token-libro";
import { GET as GET_AUDIO } from "../src/app/api/voz/[token]/audio/[fraseId]/route";

// La página del código impreso y del chip (spec "Su voz"): sin sesión, el token
// 'voz' es el permiso. Solo suenan las ELEGIDAS con audio: lo que la familia
// sacó no se publica por ningún link.

const FRASES = {
  version: 1, narrador_id: "n-1", pedido_id: "p-1", confirmado_at: null,
  capitulos: [{
    numero: 1, capitulo: "La infancia", candidatas: [
      { id: "c01-01", texto: "a", elegida: true, estado: "cortada", audio_path: "n-1/voz/frases/c01_01.mp3", segundos: 12 },
      { id: "c01-02", texto: "b", elegida: false, estado: "cortada", audio_path: "n-1/voz/frases/c01_02.mp3", segundos: 9 },
      { id: "c01-03", texto: "c", elegida: true, estado: "pendiente", audio_path: null, segundos: null },
    ],
  }],
};

function admin(opciones: { cerrado?: boolean; frases?: unknown } = {}) {
  const builder: Record<string, unknown> = {
    select: () => builder, eq: () => builder,
    maybeSingle: () => Promise.resolve({ data: { libro_aprobado_at: opciones.cerrado === false ? null : "2026-09-20T00:00:00Z" }, error: null }),
  };
  const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.example/f" }, error: null });
  const download = vi.fn().mockResolvedValue({ data: { text: async () => JSON.stringify(opciones.frases ?? FRASES) }, error: null });
  return { from: vi.fn(() => builder), storage: { from: vi.fn(() => ({ createSignedUrl, download })) }, createSignedUrl };
}

const params = (token: string, fraseId: string) => ({ params: Promise.resolve({ token, fraseId }) });
const req = {} as never;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "secreto-de-prueba";
});

describe("GET /api/voz/[token]/audio/[fraseId]", () => {
  it("una elegida con audio redirige al mp3 firmado", async () => {
    const a = admin();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(a);
    const r = await GET_AUDIO(req, params(firmarTokenVoz("n-1"), "c01-01"));
    expect(r.status).toBe(302);
    expect(a.createSignedUrl).toHaveBeenCalledWith("n-1/voz/frases/c01_01.mp3", 3600);
  });
  it("una alternativa NO elegida no suena por el link público, aunque tenga audio", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin());
    const r = await GET_AUDIO(req, params(firmarTokenVoz("n-1"), "c01-02"));
    expect(r.status).toBe(404);
  });
  it("una elegida sin cortar todavía da 404", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin());
    const r = await GET_AUDIO(req, params(firmarTokenVoz("n-1"), "c01-03"));
    expect(r.status).toBe(404);
  });
  it("el token de la muestra ('libro') no abre las frases; un libro sin cerrar tampoco", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin());
    expect((await GET_AUDIO(req, params(firmarTokenLibro("n-1"), "c01-01"))).status).toBe(404);
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ cerrado: false }));
    expect((await GET_AUDIO(req, params(firmarTokenVoz("n-1"), "c01-01"))).status).toBe(404);
  });
});
