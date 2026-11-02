import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 02/11: cada aviso a los socios de la web (enviarMailSocios) queda también en `avisos`,
// para verlo en /admin/notificaciones, salga o no el mail. Y anotarlo nunca tira: un
// aviso que no se pudo anotar no puede frenar el pago que lo disparó.

const { filas, estado } = vi.hoisted(() => ({
  filas: [] as Record<string, unknown>[],
  estado: { falla: false },
}));

vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: () => ({
    from: (tabla: string) => ({
      insert: async (fila: Record<string, unknown>) => {
        if (estado.falla) throw new Error("sin red");
        filas.push({ tabla, ...fila });
        return { error: null };
      },
    }),
  }),
}));

import { enviarMailSocios } from "../src/lib/mail";

beforeEach(() => {
  filas.length = 0;
  estado.falla = false;
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("los avisos de la web quedan en el panel", () => {
  it("el que salió, con salio_mail true", async () => {
    vi.stubEnv("MAIL_SOCIOS", "uno@ejemplo.com");
    vi.stubEnv("RESEND_API_KEY", "clave");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    expect(await enviarMailSocios("Pago confirmado", "49 €")).toBe(true);
    expect(filas).toEqual([{ tabla: "avisos", servicio: "web", asunto: "Pago confirmado", detalle: "49 €", salio_mail: true }]);
  });

  it("el que Resend rechazó, con salio_mail false", async () => {
    vi.stubEnv("MAIL_SOCIOS", "uno@ejemplo.com");
    vi.stubEnv("RESEND_API_KEY", "clave");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    expect(await enviarMailSocios("a", "b")).toBe(false);
    expect(filas.map((f) => f.salio_mail)).toEqual([false]);
  });

  it("sin MAIL_SOCIOS, con salio_mail null", async () => {
    vi.stubEnv("MAIL_SOCIOS", "");
    expect(await enviarMailSocios("a", "b")).toBe(false);
    expect(filas.map((f) => f.salio_mail)).toEqual([null]);
  });

  it("si no se puede anotar, el aviso sigue igual", async () => {
    estado.falla = true;
    vi.stubEnv("MAIL_SOCIOS", "");
    await expect(enviarMailSocios("a", "b")).resolves.toBe(false);
  });
});
