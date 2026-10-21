import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { POST } from "../src/app/api/colabora/route";
import PaginaColabora, { metadata as metaColabora } from "../src/app/colabora/page";
import PaginaColaboraCa, { metadata as metaColaboraCa } from "../src/app/ca/colabora/page";
import PaginaColaboraAr from "../src/app/ar/colabora/page";
import CondicionesCreadores from "../src/app/legal/creadores/page";
import { PaginaLegal } from "../src/app/legal/pagina";
import { TEXTOS_COLABORA } from "../src/app/_textos/colabora";
import { CONDICIONES_CREADORES } from "../src/app/_textos/legal-creadores";
import { entradasSitemap } from "../src/lib/sitemap";

// /colabora (programa de creadores, 21/10): la página, el alta (que no revela
// si el correo ya estaba) y las condiciones. Todo 404 sin CREADORES=1. Los
// datos de prueba son inventados.

const texto = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");

type Op = { tabla: string; op: string; valores?: unknown };

/** La base falsa: `existe` = el correo ya estaba (el insert choca); `recientes` = altas de esa IP en la hora. */
function crearAdmin(opciones: { existe?: boolean; recientes?: number } = {}) {
  const ops: Op[] = [];
  const from = vi.fn((tabla: string) => {
    const op: Op = { tabla, op: "select" };
    const b: Record<string, unknown> = {};
    for (const t of ["eq", "gte", "in", "order", "limit"]) b[t] = () => b;
    b.select = () => b;
    b.insert = (valores: unknown) => {
      op.op = "insert";
      op.valores = valores;
      return b;
    };
    const fila = () => ({ id: "c1", created_at: "2026-10-21T10:00:00Z", ...(op.valores as object) });
    const resolver = () => {
      ops.push(op);
      if (op.op === "insert") {
        return Promise.resolve(
          opciones.existe ? { data: null, error: { code: "23505", message: 'duplicate key value violates unique constraint "creadores_email_key"' } } : { data: fila(), error: null },
        );
      }
      return Promise.resolve({ data: null, error: null, count: opciones.recientes ?? 0 });
    };
    b.single = resolver;
    b.maybeSingle = resolver;
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => resolver().then(res, rej);
    return b;
  });
  return { from, ops };
}

const usar = (admin: ReturnType<typeof crearAdmin>) => (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

const BUENA = { nombre: "Pruebalia Testina", email: "prueba@ejemplo.com", red: "tiktok", perfil: "tiktok.com/@pruebalia", seguidores: "4.000", mensaje: "Hago videos de recuerdos.", condiciones: true, mayor: true, idioma: "ca" };

const pedir = (cuerpo: unknown) =>
  POST(
    new Request("http://localhost/api/colabora", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.7", "user-agent": "prueba" },
      body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
    }) as never,
  );

let mails: { to: string[]; subject: string; html: string; text?: string }[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CREADORES = "1";
  process.env.RESEND_API_KEY = "re_prueba";
  process.env.MAIL_SOCIOS = "socios@ejemplo.com";
  process.env.URL_BASE = "https://vitacorafamiliar.com";
  mails = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: { body: string }) => {
      mails.push(JSON.parse(init.body));
      return { ok: true, text: async () => "" };
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CREADORES;
  delete process.env.MAIL_SOCIOS;
});

describe("POST /api/colabora", () => {
  it("anota al creador como pendiente, con la prueba del consentimiento, y avisa a los dos", async () => {
    const admin = crearAdmin();
    usar(admin);
    const r = await pedir(BUENA);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    const insert = admin.ops.find((o) => o.op === "insert")!.valores as Record<string, unknown>;
    expect(insert).toMatchObject({ nombre: "Pruebalia Testina", email: "prueba@ejemplo.com", red: "tiktok", region: "ES", idioma: "ca", ip: "203.0.113.7" });
    expect("estado" in insert).toBe(false); // nace pendiente por defecto de la base
    expect(insert.consentimiento).toMatchObject({
      textos: ["He llegit i accepto les condicions del programa i la privacitat.", "Soc major de 18 anys."],
      version: "2026-10-21-legal",
      userAgent: "prueba",
    });
    const alCreador = mails.find((m) => m.to[0] === "prueba@ejemplo.com")!;
    expect(alCreador.subject).toBe(TEXTOS_COLABORA.ca.mail.recibido.asunto);
    const aSocios = mails.find((m) => m.to[0] === "socios@ejemplo.com")!;
    expect(aSocios.html).toContain("https://vitacorafamiliar.com/admin/creadores");
    expect(aSocios.html).toContain("tiktok.com/@pruebalia");
  });

  it("si el correo ya estaba, contesta lo mismo y no manda nada (nadie averigua quién se anotó)", async () => {
    usar(crearAdmin({ existe: true }));
    const r = await pedir(BUENA);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(mails).toEqual([]);
  });

  it("frena 5 altas por IP y por hora, contestando lo mismo", async () => {
    const admin = crearAdmin({ recientes: 5 });
    usar(admin);
    const r = await pedir(BUENA);
    expect(await r.json()).toEqual({ ok: true });
    expect(admin.ops.some((o) => o.op === "insert")).toBe(false);
    expect(mails).toEqual([]);
  });

  it("al robot le contesta que salió, sin tocar nada", async () => {
    const admin = crearAdmin();
    usar(admin);
    const r = await pedir({ ...BUENA, sitio: "http://spam" });
    expect(r.status).toBe(200);
    expect(admin.ops).toEqual([]);
  });

  it("rebota lo que falta, sin la casilla o mal formado", async () => {
    usar(crearAdmin());
    expect(await (await pedir({ ...BUENA, condiciones: false })).json()).toEqual({ error: "condiciones" });
    expect(await (await pedir({ ...BUENA, mayor: false })).json()).toEqual({ error: "mayor" });
    expect(await (await pedir({ ...BUENA, mayor: undefined })).json()).toEqual({ error: "mayor" });
    expect(await (await pedir({ ...BUENA, email: "no" })).json()).toEqual({ error: "email" });
    expect((await pedir("{roto")).status).toBe(400);
  });

  it("desde Argentina, 404 por ahora y no toca la base (pagar comisiones allá no está resuelto)", async () => {
    const admin = crearAdmin();
    usar(admin);
    expect((await pedir({ ...BUENA, idioma: "ar" })).status).toBe(404);
    expect(admin.ops).toEqual([]);
    expect(mails).toEqual([]);
  });

  it("con CREADORES apagado, 404 y no toca la base", async () => {
    delete process.env.CREADORES;
    const admin = crearAdmin();
    usar(admin);
    expect((await pedir(BUENA)).status).toBe(404);
    expect(admin.ops).toEqual([]);
  });
});

describe("las páginas", () => {
  it("sin CREADORES=1, /colabora y las condiciones no existen", () => {
    delete process.env.CREADORES;
    for (const Pagina of [PaginaColabora, PaginaColaboraCa, PaginaColaboraAr, CondicionesCreadores]) expect(() => Pagina()).toThrow();
  });

  it("/ar/colabora está cerrada por ahora aunque el programa esté prendido", () => {
    expect(() => PaginaColaboraAr()).toThrow();
  });

  it("ni el hreflang ni el pie apuntan a /ar/colabora", () => {
    for (const meta of [metaColabora, metaColaboraCa]) {
      const languages = meta.alternates?.languages as Record<string, string>;
      expect(languages["es-ES"]).toBe("/colabora");
      expect(languages["ca-ES"]).toBe("/ca/colabora");
      expect("es-AR" in languages).toBe(false);
    }
    expect(renderToStaticMarkup(<PaginaColabora />)).not.toContain('href="/ar/colabora"');
  });

  it.each([
    ["es", PaginaColabora, "/legal/creadores"],
    ["ca", PaginaColaboraCa, "/ca/legal/creadores"],
  ] as const)("%s: el inicio, el formulario con la casilla y el link a las condiciones", (idioma, Pagina, condiciones) => {
    const h = renderToStaticMarkup(<Pagina />);
    const t = texto(h);
    expect(t).toContain(TEXTOS_COLABORA[idioma].titulo[0]);
    expect(t).toContain(TEXTOS_COLABORA[idioma].formulario.casilla.condiciones);
    expect(h).toContain(`href="${condiciones}"`);
    expect(h).toContain('name="condiciones"');
    expect(h).toContain('name="mayor"');
    expect(t).toContain(TEXTOS_COLABORA[idioma].formulario.mayor);
    // Sin cifras fijas: la comisión y el descuento son de cada creador.
    expect(t).not.toMatch(/\d+\s?%/);
  });

  it("no va al sitemap todavía", () => {
    process.env.URL_BASE = "https://vitacorafamiliar.com";
    expect(entradasSitemap().some((e) => e.url.includes("colabora"))).toBe(false);
  });

  it.each(["es", "ca", "ar"] as const)("%s: las condiciones, con el titular y sin porcentajes", (idioma) => {
    const t = texto(renderToStaticMarkup(<PaginaLegal idioma={idioma} documento="creadores" />));
    expect(t).toContain(CONDICIONES_CREADORES[idioma].titulo);
    expect(t).toContain("Joaquín Molina");
    expect(t).not.toMatch(/\d+\s?%/);
  });
});

describe("los textos de la casa", () => {
  // Sin dos puntos en lo que ve una persona (las horas y los links no cuentan) y sin «. Y».
  const todos = (o: unknown): string[] =>
    typeof o === "string" ? [o] : typeof o === "function" ? [String((o as (...a: unknown[]) => string)("CODIGO", 10))] : o && typeof o === "object" ? Object.values(o).flatMap(todos) : [];

  it.each(["es", "ca", "ar"] as const)("%s: sin dos puntos ni oraciones que empiezan con «Y»", (idioma) => {
    const frases = [...todos(TEXTOS_COLABORA[idioma]), ...todos(CONDICIONES_CREADORES[idioma])];
    for (const f of frases) {
      expect(f.replace(/https?:\/\/\S+/g, "").replace(/\{[a-z]+:[A-Z]{2}\}/g, ""), f).not.toMatch(/:/);
      expect(f, f).not.toMatch(/\.\s+Y\s/);
    }
  });

  it("nunca de usted, y vos solo en Argentina", () => {
    const es = todos(TEXTOS_COLABORA.es).join(" ");
    const ar = todos(TEXTOS_COLABORA.ar).join(" ");
    expect(`${es} ${ar}`).not.toMatch(/\busted\b/i);
    expect(es).not.toMatch(/\b(querés|tenés|escribinos|contanos|sos)\b/);
    expect(ar).not.toMatch(/\b(quieres|tienes|escríbenos|cuéntanos|eres)\b/);
  });
});
