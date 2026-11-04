import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// GET /api/pago/vuelta (3t.20): adonde vuelve el proveedor después de cobrar.
// Verifica el pago con el proveedor (nunca con los query params), confirma el
// pedido con la misma confirmarPago del webhook, abre la sesión de la
// compradora sin mail ni código, y la deja en «Pedido confirmado» (una compra
// nueva, rediseño 2026-10) o en el panel del libro (un pedido de extras). Si
// algo falla, cae en /comprar/gracias sin narrador (la pantalla de respaldo).
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn(), usuarioDeLaSesion: vi.fn() }));
vi.mock("@/lib/confirmar-pago", () => ({ confirmarPago: vi.fn() }));
vi.mock("@/lib/mail", () => ({ enviarMailAcceso: vi.fn(), enviarMailRegalo: vi.fn() }));
const mp = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("mercadopago", () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn(function () { return { get: mp.get }; }),
}));
const stripeMock = vi.hoisted(() => ({ retrieve: vi.fn() }));
vi.mock("stripe", () => ({ default: vi.fn(function () { return { checkout: { sessions: { retrieve: stripeMock.retrieve } } }; }) }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion, usuarioDeLaSesion } from "@/lib/supabase/sesion";
import { confirmarPago } from "@/lib/confirmar-pago";
import { enviarMailRegalo } from "@/lib/mail";
import { firmarToken } from "@/lib/token-firmado";
import { GET } from "../src/app/api/pago/vuelta/route";

const PEDIDO = "11111111-2222-3333-4444-555555555555";
const auth = { createUser: vi.fn(), generateLink: vi.fn(), listUsers: vi.fn() };
const verifyOtp = vi.fn();

const tablasLeidas: string[] = [];
// Lo que ya hay en la base para ese correo: decide si la vuelta puede abrir sesión sin código.
let cuenta: { authUserId: string | null; otroPedido: boolean; otroNarrador: boolean; invitacion: boolean };
function admin(pedido: Record<string, unknown> | null, codigoRegalo?: string) {
  return {
    from: (tabla: string) => {
      tablasLeidas.push(tabla);
      const b: Record<string, unknown> = {};
      const enc = () => b;
      let otro = false;
      b.select = enc; b.eq = enc; b.in = enc; b.ilike = enc; b.limit = enc;
      b.neq = () => { otro = true; return b; };
      b.maybeSingle = async () => ({
        data: tabla === "pedidos" ? (otro ? (cuenta.otroPedido ? { id: "p-viejo" } : null) : pedido)
          : tabla === "familias" ? { email: "martina@test.com", auth_user_id: cuenta.authUserId }
          : tabla === "narradores" ? (cuenta.otroNarrador ? { id: "n-viejo" } : null)
          : tabla === "invitados" ? (cuenta.invitacion ? { id: "i1" } : null)
          : tabla === "regalos" && codigoRegalo ? { codigo: codigoRegalo }
          : null,
        error: null,
      });
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
  tablasLeidas.length = 0;
  cuenta = { authUserId: null, otroPedido: false, otroNarrador: false, invitacion: false };
  (usuarioDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: PEDIDO, proveedor: "mercadopago", estado: "pendiente", familia_id: "f1", narrador_id: "n1" }));
  (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ auth: { verifyOtp } });
  (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: false, email: "martina@test.com", codigoRegalo: null });
  mp.get.mockResolvedValue({ id: 987, status: "approved", external_reference: PEDIDO });
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

  it("(e) el webhook ganó (yaEstaba) y la cuenta es nueva: igual entra al panel", async () => {
    (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: true, email: null });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" }));
    expect(verifyOtp).toHaveBeenCalledTimes(1);
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

  // Rediseño 2026-10: el regalo ya no salta directo a la tarjeta; va a «Pedido
  // confirmado», que tiene «Descargar la tarjeta» (/tablero/<id>/regalo). El código
  // no viaja en ninguna URL.
  it("(g) regalo: confirma pasando enviarMailRegalo, abre sesión y va a «Pedido confirmado» con su narrador", async () => {
    (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: false, email: "martina@test.com", codigoRegalo: "VF-7K3M2Q" });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" }));
    expect(confirmarPago).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ enviarMailRegalo }));
    expect(verifyOtp).toHaveBeenCalledWith({ type: "magiclink", token_hash: "hash-1" });
    expect(destino(r)).toBe("/comprar/gracias?n=n1");
    expect(destino(r)).not.toContain("VF-7K3M2Q");
  });

  it("(h) regalo y el webhook ganó (yaEstaba): también va a «Pedido confirmado», sin leer el código", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: PEDIDO, proveedor: "mercadopago", estado: "pendiente", familia_id: "f1", narrador_id: "n1", extras: { pdf: true, regalo: true } }, "VF-AAAAAA"));
    (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: true, email: null, codigoRegalo: null });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" }));
    expect(destino(r)).toBe("/comprar/gracias?n=n1");
    expect(tablasLeidas).not.toContain("regalos");
  });

  it("(j) una compra nueva (con la base) va a «Pedido confirmado» y conserva el idioma de la web", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: PEDIDO, proveedor: "stripe", estado: "pendiente", familia_id: "f1", narrador_id: "n1", extras: { pdf: true, impreso: "color", copias: 1, marcos: 0 } }));
    stripeMock.retrieve.mockResolvedValue({ id: "cs_1", payment_status: "paid", metadata: { pedido_id: PEDIDO } });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), session_id: "cs_1", idioma: "ca" }));
    expect(destino(r)).toBe("/comprar/gracias?idioma=ca&n=n1");
  });

  it("(k) el idioma también llega a la pantalla de respaldo; uno que no existe no pasa", async () => {
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", "otro"), idioma: "ar" }));
    expect(destino(r)).toBe("/comprar/gracias?idioma=ar");
    const raro = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", "otro"), idioma: "fr" }));
    expect(destino(raro)).toBe("/comprar/gracias");
  });

  it("(i) pedido de extras (sin regalo) de un narrador regalado, yaEstaba: va al tablero y no lee regalos", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: PEDIDO, proveedor: "mercadopago", estado: "pendiente", familia_id: "f1", narrador_id: "n1", extras: { copias: 2 } }, "VF-AAAAAA"));
    (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: true, email: null, codigoRegalo: null });
    const r = await GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987" }));
    expect(destino(r)).toBe("/tablero/n1");
    expect(tablasLeidas).not.toContain("regalos");
  });

  // La toma de cuenta (04/11): /api/compra no comprueba el correo, así que quien
  // compra con el correo de otro volvía con la sesión de ese otro.
  describe("pagar no abre la sesión de una cuenta que ya existe", () => {
    const vuelta = () => GET(peticion({ pedido: PEDIDO, t: firmarToken("vuelta", PEDIDO), payment_id: "987", idioma: "es" }));
    const sinSesionAbierta = () => {
      expect(auth.generateLink).not.toHaveBeenCalled();
      expect(verifyOtp).not.toHaveBeenCalled();
    };

    it("la familia ya tiene cuenta: confirma el pago pero hay que entrar con el código", async () => {
      cuenta.authUserId = "u-duena";
      const r = await vuelta();
      expect(confirmarPago).toHaveBeenCalledTimes(1);
      sinSesionAbierta();
      expect(auth.createUser).not.toHaveBeenCalled();
      expect(destino(r)).toBe("/comprar/gracias?idioma=es&n=n1");
    });

    it("la familia ya pagó otro pedido, aunque nunca haya entrado", async () => {
      cuenta.otroPedido = true;
      const r = await vuelta();
      sinSesionAbierta();
      expect(auth.createUser).not.toHaveBeenCalled();
      expect(destino(r)).toBe("/comprar/gracias?idioma=es&n=n1");
    });

    it("la familia ya tiene otra historia (los pilotos no tienen pedido)", async () => {
      cuenta.otroNarrador = true;
      const r = await vuelta();
      sinSesionAbierta();
      expect(destino(r)).toBe("/comprar/gracias?idioma=es&n=n1");
    });

    it("ese correo tiene una invitación sin aceptar: entrar la vincularía a la historia de otra familia", async () => {
      cuenta.invitacion = true;
      const r = await vuelta();
      sinSesionAbierta();
      expect(destino(r)).toBe("/comprar/gracias?idioma=es&n=n1");
    });

    it("el usuario ya existe en Auth aunque no tenga familia vinculada", async () => {
      auth.createUser.mockResolvedValue({ data: { user: null }, error: { message: "A user with this email address has already been registered" } });
      const r = await vuelta();
      sinSesionAbierta();
      expect(destino(r)).toBe("/comprar/gracias?idioma=es&n=n1");
    });

    it("con la sesión de otro correo tampoco entra", async () => {
      cuenta.authUserId = "u-duena";
      (usuarioDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u-otro", email: "atacante@test.com" });
      const r = await vuelta();
      sinSesionAbierta();
      expect(destino(r)).toBe("/comprar/gracias?idioma=es&n=n1");
    });

    it("la dueña que ya tiene la sesión abierta sigue de largo, sin magic link", async () => {
      cuenta.authUserId = "u-duena";
      (usuarioDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u-duena", email: "Martina@Test.com" });
      const r = await vuelta();
      sinSesionAbierta();
      expect(destino(r)).toBe("/tablero/n1");
    });
  });
});
