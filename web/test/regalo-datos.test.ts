import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { leerRegalo, numeroPublico } from "../src/lib/regalo-datos";

// Gift card: lo que lee la página del QR. Doble propio (como confirmar-pago.test.ts):
// el select embebido narradores(...) devuelve la fila del narrador anidada.
type Fila = Record<string, unknown>;

function crearAdmin(filas: Fila[], error: { code?: string; message: string } | null = null) {
  const consultas: { tabla: string; columnas: string; filtros: Fila }[] = [];
  const admin = {
    from: vi.fn((tabla: string) => {
      const c = { tabla, columnas: "", filtros: {} as Fila };
      consultas.push(c);
      const b = {
        select: (cols: string) => { c.columnas = cols; return b; },
        eq: (col: string, v: unknown) => { c.filtros[col] = v; return b; },
        maybeSingle: async () => {
          if (error) return { data: null, error };
          const f = filas.find((x) => Object.entries(c.filtros).every(([k, v]) => x[k] === v));
          return { data: f ?? null, error: null };
        },
      };
      return b;
    }),
  };
  return { admin: admin as unknown as SupabaseClient, consultas, from: admin.from };
}

const filaBase = (extra: Fila = {}, estado = "regalo_pendiente"): Fila => ({
  codigo: "VF-7K3M2Q",
  quien_regala: "Lucía",
  mensaje: "Abuelo, quiero tu historia.",
  audio_path: null,
  usado_at: null,
  narradores: { nombre: "Osvaldo", como_le_dicen: "abuelo", estado },
  ...extra,
});

describe("leerRegalo", () => {
  it("un código que no normaliza devuelve null sin consultar la base", async () => {
    const { admin, from } = crearAdmin([filaBase()]);
    expect(await leerRegalo(admin, "hola")).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("un código que no existe devuelve null", async () => {
    const { admin } = crearAdmin([filaBase()]);
    expect(await leerRegalo(admin, "VF-2222AA")).toBeNull();
  });

  it("si el narrador sigue en pendiente_pago (no se pagó) devuelve null", async () => {
    const { admin } = crearAdmin([filaBase({}, "pendiente_pago")]);
    expect(await leerRegalo(admin, "VF-7K3M2Q")).toBeNull();
  });

  it("un regalo pendiente devuelve los datos públicos, buscando por el código normalizado", async () => {
    const { admin, consultas } = crearAdmin([filaBase()]);
    const r = await leerRegalo(admin, "vf 7k3-m2q");
    expect(r).toEqual({
      codigo: "VF-7K3M2Q",
      nombre: "Osvaldo",
      comoLeDicen: "abuelo",
      quienRegala: "Lucía",
      mensaje: "Abuelo, quiero tu historia.",
      tieneAudio: false,
      usado: false,
    });
    expect(consultas[0].tabla).toBe("regalos");
    expect(consultas[0].filtros).toEqual({ codigo: "VF-7K3M2Q" });
    expect(consultas[0].columnas).toContain("narradores(nombre, como_le_dicen, estado)");
  });

  it("con usado_at queda usado", async () => {
    const { admin } = crearAdmin([filaBase({ usado_at: "2026-10-08T10:00:00Z" }, "activo")]);
    expect((await leerRegalo(admin, "VF-7K3M2Q"))?.usado).toBe(true);
  });

  it("con audio_path tiene audio", async () => {
    const { admin } = crearAdmin([filaBase({ audio_path: "n1/regalo/mensaje" })]);
    expect((await leerRegalo(admin, "VF-7K3M2Q"))?.tieneAudio).toBe(true);
  });

  it("si la tabla todavía no existe (42P01) devuelve null y avisa con console.warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { admin } = crearAdmin([], { code: "42P01", message: "no existe" });
    expect(await leerRegalo(admin, "VF-7K3M2Q")).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("si la tabla todavía no existe con la forma de PostgREST (PGRST205) también es warn, no error", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { admin } = crearAdmin([], { code: "PGRST205", message: "Could not find the table 'public.regalos' in the schema cache" });
      expect(await leerRegalo(admin, "VF-7K3M2Q")).toBeNull();
      expect(warn).toHaveBeenCalled();
      expect(err).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
      err.mockRestore();
    }
  });

  it("otro error de la base devuelve null y queda en console.error", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { admin } = crearAdmin([], { code: "XX000", message: "se cayó" });
    expect(await leerRegalo(admin, "VF-7K3M2Q")).toBeNull();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe("numeroPublico", () => {
  const antes = process.env.WHATSAPP_NUMERO_PUBLICO;
  beforeEach(() => { delete process.env.WHATSAPP_NUMERO_PUBLICO; });
  afterEach(() => {
    if (antes === undefined) delete process.env.WHATSAPP_NUMERO_PUBLICO;
    else process.env.WHATSAPP_NUMERO_PUBLICO = antes;
  });

  it("sin la variable devuelve null", () => {
    expect(numeroPublico()).toBeNull();
  });

  it("un número argentino de 13 dígitos se agrupa para leer", () => {
    process.env.WHATSAPP_NUMERO_PUBLICO = "5491100000000";
    expect(numeroPublico()).toEqual({ digitos: "5491100000000", legible: "+54 9 11 0000 0000" });
  });

  it("cualquier otro largo va con + y los dígitos tal cual (sin lo que no es dígito)", () => {
    process.env.WHATSAPP_NUMERO_PUBLICO = "+34 600 000 000";
    expect(numeroPublico()).toEqual({ digitos: "34600000000", legible: "+34600000000" });
  });
});
