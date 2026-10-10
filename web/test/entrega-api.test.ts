import { describe, it, expect, vi, beforeEach } from "vitest";

// PATCH /api/entrega (3t.26): la familia carga o corrige la dirección de envío.
// Solo quien compró ese pedido, y solo hasta que entre en producción.
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/panel", () => ({ narradorDeLaSesion: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { narradorDeLaSesion } from "@/lib/panel";
import { PATCH } from "../src/app/api/entrega/route";

const DIRECCION = { linea1: "Pelliza 1234", ciudad: "Vicente López", cp: "1638", pais: "Argentina" };
const escrituras: { tabla: string; valores: Record<string, unknown> }[] = [];

function admin(entrega: Record<string, unknown> | null, familia: { id: string } | null = { id: "fam-1" }) {
  return {
    from: (tabla: string) => {
      const b: Record<string, unknown> = {};
      const enc = () => b;
      b.select = enc; b.eq = enc; b.ilike = enc; b.order = enc; b.limit = enc;
      b.maybeSingle = async () => ({ data: tabla === "entregas" ? entrega : familia, error: null });
      b.update = (valores: Record<string, unknown>) => { escrituras.push({ tabla, valores }); return { eq: async () => ({ error: null }) }; };
      return b;
    },
  };
}
const peticion = (body: unknown, entregaId = "ent-1") =>
  ({ json: async () => body, nextUrl: { searchParams: new URLSearchParams(`narrador=n1&entrega=${entregaId}`) } }) as never;

beforeEach(() => {
  escrituras.length = 0;
  (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: "ent-1", familia_id: "fam-1", estado: "sin_direccion" }));
  (narradorDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, narrador: { id: "n1" }, user: { id: "u1", email: "martina@ejemplo.com" } });
});

describe("PATCH /api/entrega", () => {
  it("guarda la dirección y pasa el estado a 'lista'", async () => {
    const r = await PATCH(peticion({ destinatarioNombre: "  Martina  ", destinatarioTelefono: "11 5555 1234", direccion: DIRECCION, nota: "timbre roto" }));
    expect(r.status).toBe(200);
    expect(escrituras[0].valores).toMatchObject({
      destinatario_nombre: "Martina",
      destinatario_telefono: "11 5555 1234",
      direccion: DIRECCION,
      nota: "timbre roto",
      estado: "lista",
    });
    expect(escrituras[0].valores).toHaveProperty("direccion_at");
  });

  it("una dirección incompleta da 400 y no escribe", async () => {
    const r = await PATCH(peticion({ destinatarioNombre: "Martina", destinatarioTelefono: "11 5555 1234", direccion: { ...DIRECCION, cp: "" } }));
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("sin nombre o sin teléfono de quien recibe, 400", async () => {
    expect((await PATCH(peticion({ destinatarioNombre: "", destinatarioTelefono: "11 5555 1234", direccion: DIRECCION }))).status).toBe(400);
    expect((await PATCH(peticion({ destinatarioNombre: "Martina", destinatarioTelefono: " ", direccion: DIRECCION }))).status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("ya en producción: no se cambia más", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: "ent-1", familia_id: "fam-1", estado: "en_produccion" }));
    const r = await PATCH(peticion({ destinatarioNombre: "Martina", destinatarioTelefono: "11 5555 1234", direccion: DIRECCION }));
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("la entrega de otra familia no se toca (403)", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: "ent-1", familia_id: "otra", estado: "sin_direccion" }));
    const r = await PATCH(peticion({ destinatarioNombre: "Martina", destinatarioTelefono: "11 5555 1234", direccion: DIRECCION }));
    expect(r.status).toBe(403);
    expect(escrituras).toEqual([]);
  });

  it("'ya me llegó': la familia marca entregado cuando está enviado", async () => {
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin({ id: "ent-1", familia_id: "fam-1", estado: "enviado" }));
    const r = await PATCH(peticion({ accion: "ya_llego" }));
    expect(r.status).toBe(200);
    expect(escrituras[0].valores).toMatchObject({ estado: "entregado" });
    expect(escrituras[0].valores).toHaveProperty("entregado_at");
  });

  it("'ya me llegó' antes de que se despache: 400", async () => {
    const r = await PATCH(peticion({ accion: "ya_llego" }));
    expect(r.status).toBe(400);
    expect(escrituras).toEqual([]);
  });
});
