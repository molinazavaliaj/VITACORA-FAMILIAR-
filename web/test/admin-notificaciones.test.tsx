import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

// 08 · Notificaciones: los avisos a los socios, también en el panel. Lo que se rompe sin
// que se vea: el filtro de la URL, el día (en la hora de Madrid, no en UTC), el aviso que
// no salió por mail sin marcar en rojo, la tabla sin migrar como página rota, y la
// acción de marcar visto sin pedir ser admin.

const { estado, tocadas, avisosFalsos } = vi.hoisted(() => ({
  estado: { email: "socio@vitacora.com" as string | null, errorTabla: false },
  tocadas: [] as string[],
  avisosFalsos: [
    { id: "a1", creado_at: "2026-11-02T10:00:00Z", servicio: "fabrica", asunto: "Etapa A sin pasar", detalle: "El libro de Osvaldo\nno pasó", clave: null, salio_mail: false, visto_at: null },
    { id: "a2", creado_at: "2026-11-01T23:30:00Z", servicio: "web", asunto: "Pago confirmado", detalle: "49 €", clave: null, salio_mail: true, visto_at: null },
    { id: "a3", creado_at: "2026-10-30T09:00:00Z", servicio: "entrevistador", asunto: "Falta la plantilla", detalle: null, clave: "k", salio_mail: null, visto_at: "2026-10-30T10:00:00Z" },
  ],
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({
  crearClienteSesion: async () => ({ auth: { getUser: async () => ({ data: { user: estado.email ? { email: estado.email } : null } }) } }),
}));
vi.mock("@/lib/supabase/servidor", () => ({
  crearClienteServidor: () => {
    const q: Record<string, unknown> = {};
    const cadena = () => q;
    Object.assign(q, {
      select: cadena, order: cadena, limit: cadena, eq: cadena,
      is: () => {
        // El conteo de sin ver (head: true) y la lista terminan acá.
        const r = Object.assign(Promise.resolve(estado.errorTabla
          ? { data: null, count: null, error: { message: 'relation "avisos" does not exist' } }
          : { data: avisosFalsos.filter((a) => a.visto_at === null), count: 2, error: null }), q);
        return r;
      },
      then: (ok: (v: unknown) => void) => ok(estado.errorTabla
        ? { data: null, error: { message: 'relation "avisos" does not exist' } }
        : { data: avisosFalsos, error: null }),
      update: (v: unknown) => { tocadas.push(`update ${Object.keys(v as object).join(",")}`); return { eq: () => ({ is: async () => ({ error: null }) }), is: async () => ({ error: null }) }; },
    });
    return { from: () => q };
  },
}));

import { diaDe, estadoDelMail, filtroDe, horaDe, porDia } from "../src/lib/admin/notificaciones";
import PantallaNotificaciones from "../src/app/admin/notificaciones/page";
import { marcarTodosVistos, marcarVisto } from "../src/app/admin/notificaciones/acciones";
import { NavegacionAdmin } from "../src/app/admin/nav";
import type { FilaAviso } from "../src/lib/avisos";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/notificaciones" }));

beforeEach(() => {
  tocadas.length = 0;
  estado.email = "socio@vitacora.com";
  estado.errorTabla = false;
  process.env.ADMIN_EMAILS = "socio@vitacora.com";
});

describe("las piezas puras", () => {
  it("el filtro de la URL ignora lo que no entiende", () => {
    expect(filtroDe({ de: "fabrica", ver: "sin-ver" })).toEqual({ de: "fabrica", soloSinVer: true });
    expect(filtroDe({ de: "hackers" })).toEqual({ de: null, soloSinVer: false });
    expect(filtroDe({ de: ["web"] })).toEqual({ de: null, soloSinVer: false });
  });

  it("el día y la hora son los de Madrid: las 23:30 UTC del 01/11 ya son el 02/11", () => {
    expect(diaDe("2026-11-01T23:30:00Z")).toBe("2026-11-02");
    expect(horaDe("2026-11-01T23:30:00Z")).toBe("00:30");
    expect(diaDe("cualquier cosa")).toBe("—");
  });

  it("agrupa por día sin desordenar", () => {
    const grupos = porDia(avisosFalsos as FilaAviso[]);
    expect(grupos.map((g) => [g.dia, g.avisos.map((a) => a.id)])).toEqual([
      ["2026-11-02", ["a1", "a2"]],
      ["2026-10-30", ["a3"]],
    ]);
  });

  it("el mail que no salió va en rojo", () => {
    expect(estadoDelMail(false).color).toBe("rojo");
    expect(estadoDelMail(true).color).toBe("verde");
    expect(estadoDelMail(null).color).toBe("neutro");
  });
});

const render = async (params: Record<string, string> = {}) =>
  renderToStaticMarkup((await PantallaNotificaciones({ searchParams: Promise.resolve(params) } as never)) as ReactElement);

describe("la pantalla", () => {
  it("muestra los avisos con su detalle, sin NaN ni undefined", async () => {
    const html = await render();
    expect(html).toContain("Notificaciones");
    expect(html).toContain("Etapa A sin pasar");
    expect(html).toContain("el mail no salió");
    expect(html).toContain("La fábrica");
    expect(html).toContain("marcar los 2 como vistos");
    expect(html).not.toMatch(/NaN|undefined/);
  });

  it("con la tabla sin migrar dice qué falta, no se rompe", async () => {
    estado.errorTabla = true;
    const html = await render();
    expect(html).toContain("20261102000000_avisos_y_contenido.sql");
  });
});

describe("la pestaña", () => {
  it("lleva a Notificaciones y a Contenido, con el número de sin ver", () => {
    const html = renderToStaticMarkup(<NavegacionAdmin sinVer={3} />);
    expect(html).toContain('href="/admin/notificaciones"');
    expect(html).toContain('href="/admin/contenido"');
    expect(html).toContain('aria-label="3 sin ver"');
  });

  it("sin avisos (o sin poder saberlo) no muestra número", () => {
    expect(renderToStaticMarkup(<NavegacionAdmin sinVer={0} />)).not.toContain("sin ver");
    expect(renderToStaticMarkup(<NavegacionAdmin />)).not.toContain("sin ver");
  });
});

describe("marcar como visto pide ser admin", () => {
  it.each([
    ["sin sesión", null],
    ["con un mail que no está en ADMIN_EMAILS", "intruso@ejemplo.com"],
  ])("%s no toca la base", async (_caso, email) => {
    estado.email = email;
    expect((await marcarVisto("8b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d")).error).toBeTruthy();
    expect((await marcarTodosVistos()).error).toBeTruthy();
    expect(tocadas).toEqual([]);
  });

  it("como admin, sólo pone visto_at", async () => {
    expect((await marcarVisto("8b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d")).error).toBeNull();
    expect((await marcarTodosVistos()).error).toBeNull();
    expect(tocadas).toEqual(["update visto_at", "update visto_at"]);
    expect((await marcarVisto("no-es-un-id")).error).toBeTruthy();
  });
});
