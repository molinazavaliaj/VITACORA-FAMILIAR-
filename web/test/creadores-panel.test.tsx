import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

// El panel privado del creador (/creador/<token>) y el resumen mensual a los
// socios (/api/creadores/resumen), 21/10.

type Op = { tabla: string; op: string; filtros: [string, string, unknown][] };

const { estado } = vi.hoisted(() => ({
  estado: { ops: [] as Op[], responder: (() => undefined) as (op: Op) => { data: unknown; error: unknown } | undefined },
}));

vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: () => ({
    from: (tabla: string) => {
      const op: Op = { tabla, op: "select", filtros: [] };
      const b: Record<string, unknown> = {};
      for (const t of ["eq", "in", "order", "limit"]) {
        b[t] = (col: string, val: unknown) => {
          op.filtros.push([t, col, val]);
          return b;
        };
      }
      b.select = () => b;
      const resolver = () => {
        estado.ops.push(op);
        return Promise.resolve(estado.responder(op) ?? { data: null, error: null });
      };
      b.maybeSingle = resolver;
      b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => resolver().then(res, rej);
      return b;
    },
  }),
}));

import PanelCreador from "../src/app/creador/[token]/page";
import { GET as resumen } from "../src/app/api/creadores/resumen/route";
import { textoResumenMensual } from "../src/lib/creadores-base";
import { armarMailBienvenidaCreador, armarMailCreadorRecibido } from "../src/lib/mail-creadores";
import type { FilaCreador } from "../src/lib/creadores";

const TOKEN = "a".repeat(43);

function creador(cambios: Partial<FilaCreador> = {}): FilaCreador {
  return {
    id: "c1",
    created_at: "2026-10-21T10:00:00Z",
    nombre: "Lucía",
    email: "lucia@ejemplo.com",
    red: "instagram",
    perfil: "instagram.com/lucia",
    seguidores: null,
    mensaje: null,
    region: "AR",
    idioma: "ar",
    estado: "activo",
    codigo: "LUCIA",
    comision: 20,
    descuento: 10,
    token_panel: TOKEN,
    aprobado_at: "2026-10-21T11:00:00Z",
    notas: "secreto de los socios",
    ...cambios,
  };
}

const VENTAS = [
  { created_at: "2026-10-21T12:00:00Z", moneda: "ARS", importe: 15435, estado: "pendiente" },
  { created_at: "2026-10-01T12:00:00Z", moneda: "ARS", importe: 10000, estado: "pagada" },
];

const abrir = async (token = TOKEN) => renderToStaticMarkup(await PanelCreador({ params: Promise.resolve({ token }) } as never));

beforeEach(() => {
  estado.ops = [];
  estado.responder = () => undefined;
  process.env.CREADORES = "1";
  process.env.URL_BASE = "https://vitacorafamiliar.com";
  process.env.CRON_SECRET = "secreto-del-cron";
  process.env.RESEND_API_KEY = "re_prueba";
  process.env.MAIL_SOCIOS = "socios@ejemplo.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CREADORES;
  delete process.env.MAIL_SOCIOS;
});

describe("el panel del creador", () => {
  const conDatos = (c: FilaCreador | null) => {
    estado.responder = (op) => {
      if (op.tabla === "creadores") {
        // Como PostgREST: solo activos o pausados.
        const ok = c && (op.filtros.find(([t, col]) => t === "in" && col === "estado")?.[2] as string[]).includes(c.estado);
        return { data: ok ? c : null, error: null };
      }
      if (op.tabla === "comisiones_creadores") return { data: VENTAS, error: null };
      return undefined;
    };
  };

  it("muestra su código, su link, el descuento y sus ventas, sin datos del cliente ni las notas", async () => {
    conDatos(creador());
    const h = await abrir();
    expect(h).toContain("LUCIA");
    expect(h).toContain("https://vitacorafamiliar.com/ar/comprar?cupon=LUCIA");
    expect(h).toContain("10 % de descuento");
    expect(h).toMatch(/15\.435/);
    expect(h).toContain("Por cobrar");
    expect(h).toContain("Cobrada");
    expect(h).not.toContain("secreto de los socios");
    expect(h).not.toContain("lucia@ejemplo.com");
    // Lo que se le pide a la base no trae ni el pedido ni el total del cliente.
    const consulta = estado.ops.find((o) => o.tabla === "comisiones_creadores")!;
    expect(consulta.filtros).toContainEqual(["eq", "creador_id", "c1"]);
  });

  it("pausado ve el panel con el aviso", async () => {
    conDatos(creador({ estado: "pausado" }));
    expect(await abrir()).toContain("Tu código está en pausa");
  });

  it.each(["pendiente", "rechazado"] as const)("%s: 404", async (e) => {
    conDatos(creador({ estado: e }));
    await expect(abrir()).rejects.toThrow();
  });

  it("un token sin forma ni se busca", async () => {
    await expect(abrir("corto")).rejects.toThrow();
    expect(estado.ops).toEqual([]);
  });

  it("con CREADORES apagado, 404 sin tocar la base", async () => {
    delete process.env.CREADORES;
    conDatos(creador());
    await expect(abrir()).rejects.toThrow();
    expect(estado.ops).toEqual([]);
  });

  it("habla en su idioma", async () => {
    conDatos(creador({ idioma: "ca", region: "ES" }));
    const h = await abrir();
    expect(h).toContain("El teu codi");
    expect(h).toContain("/ca/comprar?cupon=LUCIA");
  });
});

describe("el resumen mensual", () => {
  const pedir = (auth?: string) => resumen(new Request("http://localhost/api/creadores/resumen", { headers: auth ? { authorization: auth } : {} }) as never);

  it("arma el texto por creador, con lo pendiente, las ventas y el correo", () => {
    const t = textoResumenMensual(
      [
        { id: "c1", nombre: "Lucía", email: "lucia@ejemplo.com", codigo: "LUCIA" },
        { id: "c2", nombre: "Pau", email: "pau@ejemplo.com", codigo: "PAU" },
      ],
      [
        { creador_id: "c1", estado: "pendiente", moneda: "ARS", importe: 15435 },
        { creador_id: "c1", estado: "pendiente", moneda: "ARS", importe: 10000 },
        { creador_id: "c2", estado: "pendiente", moneda: "EUR", importe: 8.82 },
      ],
    )!;
    expect(t).toContain("Lucía (código LUCIA)");
    expect(t).toContain("25.435 ARS");
    expect(t).toContain("Ventas: 2");
    expect(t).toContain("lucia@ejemplo.com");
    expect(t).toContain("8,82 EUR");
    expect(t).toContain("/admin/creadores");
  });

  it("sin pendientes no hay texto", () => {
    expect(textoResumenMensual([{ id: "c1", nombre: "Lucía", email: "l@e.com", codigo: "LUCIA" }], [])).toBeNull();
  });

  it("sin CRON_SECRET o con otra clave, 401", async () => {
    expect((await pedir()).status).toBe(401);
    expect((await pedir("Bearer otra")).status).toBe(401);
    delete process.env.CRON_SECRET;
    expect((await pedir("Bearer ")).status).toBe(401);
    expect(estado.ops).toEqual([]);
  });

  it("con CREADORES apagado no hace nada", async () => {
    delete process.env.CREADORES;
    expect(await (await pedir("Bearer secreto-del-cron")).json()).toEqual({ apagado: true });
    expect(estado.ops).toEqual([]);
  });

  it("manda el mail a los socios si hay pendientes, y no si no hay", async () => {
    const mails: { to: string[]; subject: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: { body: string }) => {
        mails.push(JSON.parse(init.body));
        return { ok: true, text: async () => "" };
      }),
    );
    estado.responder = (op) => {
      if (op.tabla === "comisiones_creadores") return { data: [{ creador_id: "c1", estado: "pendiente", moneda: "EUR", importe: 8.82 }], error: null };
      if (op.tabla === "creadores") return { data: [{ id: "c1", nombre: "Lucía", email: "lucia@ejemplo.com", codigo: "LUCIA" }], error: null };
      return undefined;
    };
    expect(await (await pedir("Bearer secreto-del-cron")).json()).toEqual({ creadores: 1, enviado: true });
    expect(mails).toEqual([expect.objectContaining({ to: ["socios@ejemplo.com"], subject: "Comisiones de creadores pendientes" })]);

    mails.length = 0;
    estado.responder = (op) => (op.tabla === "comisiones_creadores" ? { data: [], error: null } : undefined);
    expect(await (await pedir("Bearer secreto-del-cron")).json()).toEqual({ creadores: 0, enviado: false });
    expect(mails).toEqual([]);
  });
});

describe("los mails al creador", () => {
  it("«lo recibimos» no promete código ni fecha", () => {
    const m = armarMailCreadorRecibido(creador({ idioma: "es", region: "ES" }));
    expect(m.asunto).toBe("Recibimos tu solicitud para colaborar con Vitácora");
    expect(m.texto).not.toContain("LUCIA");
    expect(m.texto).toContain("/legal/creadores");
  });

  it("la bienvenida sin descuento lo dice, y lleva su comisión, el link y el panel", () => {
    const m = armarMailBienvenidaCreador({ ...creador({ idioma: "es", region: "ES", descuento: 0 }), codigo: "LUCIA", comision: 15, descuento: 0, token_panel: TOKEN });
    expect(m.texto).toContain("Tu código no lleva descuento");
    expect(m.texto).toContain("15 % de lo que pagó");
    expect(m.texto).toContain("https://vitacorafamiliar.com/comprar?cupon=LUCIA");
    expect(m.texto).toContain(`https://vitacorafamiliar.com/creador/${TOKEN}`);
    expect(m.html).not.toContain("<script");
  });
});
