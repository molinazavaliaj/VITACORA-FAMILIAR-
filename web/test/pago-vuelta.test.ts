import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// GET /api/pago/vuelta (3t.20): adonde vuelve el proveedor después de cobrar.
// Verifica el pago con el proveedor (nunca con los query params), confirma el
// pedido con la misma confirmarPago del webhook, abre la sesión de la
// compradora sin mail ni código, y la deja en el panel del libro. Si algo
// falla, cae en /comprar/gracias (la pantalla de siempre).
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/confirmar-pago", () => ({ confirmarPago: vi.fn() }));
vi.mock("@/lib/mail", () => ({ enviarMailAcceso: vi.fn() }));
const mp = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn(function () { return { get: mp.get }; }),
}));
const stripeMock = vi.hoisted(() => ({ retrieve: vi.fn() }));
vi.mock("stripe", () => ({ default: vi.fn(function () { return { checkout: { sessions: { retrieve: stripeMock.retrieve } } }; }) }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { confirmarPago } from "@/lib/confirmar-pago";
import { firmarToken } from "@/lib/token-firmado";
import { GET } from "../src/app/api/pago/vuelta/route";

const PEDIDO = "11111111-2222-3333-4444-555555555555";
const auth = { createUser: vi.fn(), generateLink: vi.fn(), listUsers: vi.fn() };
const verifyOtp = vi.fn();

function admin(pedido: Record<string, unknown> | null) {
  return {
    from: (tabla: string) => {
      const b: Record<string, unknown> = {};
      const enc = () => b;
      b.select = enc; b.eq = enc;
      b.maybeSingle = async () => ({ data: tabla === "pedidos" ? pedido : tabla === "familias" ? { email: "martina@test.com" } : null, error: null });
      return b;
    },
    auth: { admin: auth },
  };
}
function peticion(params: Record<string, string>) {
  const url = new URL("https://vitacorafamiliar.com/api/pago/vuelta");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return { nextUrl: url, url: url.toString() } as never;
}
const destino = (r: Response) => new URL(r.headers.get("location")!).pathname + new URL(r.headers.get("location")!).search;

beforeAll(() => { process.env.SUPABASE_SERVICE_ROLE_KEY = "clave-de-prueba"; process.env.MP_ACCESS_TOKEN = "TEST"; process.env.STRIPE_SECRET_KEY = "sk"; process.env.URL_BASE = "https://vitacorafamiliar.com"; });
beforeEach(() => {
  vi.clearAllMocks();
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: PEDIDO, proveedor: "mercadopago", estado: "pendiente", familia_id: "f1", narrador_id: "n1" }));
  (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ auth: { verifyOtp } });
  (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: false, email: "martina@test.com" });
  mp.get.mockResolvedValue({ id: 987, status: "approved", external_reference: PEDIDO });
  auth.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
  auth.createUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  auth.generateLink.mockResolvedValue({ data: { properties: { hashed_token: "hash-1" } }, error: null });
  verifyOtp.mockResolvedValue({ data: { session: { access_token: "x" } }, error: null });
});

describe("GET /api/pago/vuelta", () => {
  it("(a) MP aprobado: confirma el pedido, abre sesión con el token del servidor y va al panel del libro", async () => {
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987", status: "approved" }));
    expect(mp.get).toHaveBeenCalledWith({ id: "987" });
    expect(confirmarPago).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ pedidoId: PEDIDO, referenciaExterna: "987" }));
    expect(auth.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "martina@test.com", email_confirm: true }));
    expect(auth.generateLink).toHaveBeenCalledWith({ type: "magiclink", email: "martina@test.com" });
    expect(verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "hash-1" });
    expect(destino(r)).toBe("/tablero/n1");
  });

  it("(b) token inválido o de otro pedido: no consulta a nadie y va a gracias", async () => {
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", "otro-pedido"), payment_id: "987" }));
    expect(mp.get).not.toHaveBeenCalled();
    expect(confirmarPago).not.toHaveBeenCalled();
    expect(destino(r)).toBe("/comprar/gracias");
  });

  it("(c) el pago no está aprobado (o es de otro pedido): no confirma y va a gracias", async () => {
    mp.get.mockResolvedValue({ id: 987, status: "pending", external_reference: PEDIDO });
    expect(destino(await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" })))).toBe("/comprar/gracias");
    mp.get.mockResolvedValue({ id: 987, status: "approved", external_reference: "otro" });
    expect(destino(await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" })))).toBe("/comprar/gracias");
    expect(confirmarPago).not.toHaveBeenCalled();
  });

  it("(d) el pedido se confirma pero la sesión falla: gracias, con el pedido ya pagado", async () => {
    verifyOtp.mockResolvedValue({ data: { session: null }, error: { message: "no" } });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" }));
    expect(confirmarPago).toHaveBeenCalledTimes(1);
    expect(destino(r)).toBe("/comprar/gracias");
  });

  it("(e) el webhook ganó (yaEstaba): igual entra al panel; la cuenta existente no se vuelve a crear", async () => {
    (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: true, email: null });
    auth.listUsers.mockResolvedValue({ data: { users: [{ id: "u1", email: "martina@test.com" }] }, error: null });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" }));
    expect(auth.createUser).not.toHaveBeenCalled();
    expect(destino(r)).toBe("/tablero/n1");
  });

  it("(f) viaje: la vuelta conserva ?viaje=1 en gracias, y Stripe se verifica por session_id", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: PEDIDO, proveedor: "stripe", estado: "pendiente", familia_id: "f1", narrador_id: "n1" }));
    stripeMock.retrieve.mockResolvedValue({ id: "cs_1", payment_status: "paid", metadata: { pedido_id: PEDIDO } });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), session_id: "cs_1", viaje: "1" }));
    expect(stripeMock.retrieve).toHaveBeenCalledWith("cs_1");
    expect(confirmarPago).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ referenciaExterna: "cs_1" }));
    expect(destino(r)).toBe("/tablero/n1");
    stripeMock.retrieve.mockResolvedValue({ id: "cs_1", payment_status: "unpaid", metadata: { pedido_id: PEDIDO } });
    expect(destino(await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), session_id: "cs_1", viaje: "1" })))).toBe("/comprar/gracias?viaje=1");
  });
});
