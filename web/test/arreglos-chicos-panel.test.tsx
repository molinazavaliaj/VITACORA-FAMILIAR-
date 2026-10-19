import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Arreglos chicos del panel (rediseño 2026-10, 18/10; maqueta Panel):
// «Cambiar la fecha de inicio» de un regalo sin abrir, la tarjeta del marco,
// el aviso «✓ Guardado» y el aviso de foto chica para la tapa. El panel usa la
// base REAL de producción, así que lo que más se mira es qué escribe la API:
// solo `regalos.fecha_entrega`, con las trabas puestas, y nunca borra.

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, push() {} }), usePathname: () => "/tablero/n1", useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/supabase/sesion", () => ({ crearClienteSesion: vi.fn() }));
vi.mock("@/lib/panel", () => ({ narradorDeLaSesion: vi.fn() }));
vi.mock("@/lib/trato", () => ({ tratoDeLaFamilia: vi.fn(async () => "tu"), intenta: (t: string) => (t === "tu" ? "Intenta" : "Intentá") }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearClienteSesion } from "@/lib/supabase/sesion";
import { narradorDeLaSesion } from "@/lib/panel";
import { PATCH } from "../src/app/api/regalo/fecha/route";
import { errorDeNuevaFecha, fechaCambiable, type RegaloConFecha } from "@/lib/regalo-fecha";
import { MENSAJE_FECHA_INVALIDA, MENSAJE_FECHA_PASADA } from "@/lib/regalo-reglas";
import { chicaParaTapa } from "@/lib/guion";
import { HojaPedido, TarjetaMarco } from "../src/app/tablero/_historia/lateral";
import { CambiarFecha } from "../src/app/tablero/_historia/fecha";
import { AvisoGuardado } from "../src/app/_ui/aviso-guardado";
import { SubirFoto } from "../src/app/tablero/[narradorId]/preguntas/acciones";
import { PANEL, type Quien } from "../src/app/_textos/panel";

const HOY = new Date("2026-10-18T12:00:00Z");
const el: Quien = { como: "Antonio", propia: false, ella: false, viaje: false };
const contacto = { whatsapp: null, correo: "hola@vitacorafamiliar.com" };
const escapar = (s: string) => renderToStaticMarkup(<>{s}</>);

const regaloBase = (cambios: Partial<RegaloConFecha> = {}): RegaloConFecha => ({
  id: "r1",
  fecha_entrega: "2026-12-24",
  usado_at: null,
  entrega_canal: null,
  entrega_hora: null,
  entrega_zona: null,
  entrega_enviada_at: null,
  ...cambios,
});

describe("qué regalo deja cambiar la fecha", () => {
  it("solo sin abrir y sin mandar", () => {
    expect(fechaCambiable("regalo_pendiente", regaloBase())).toBe(true);
    expect(fechaCambiable("regalo_pendiente", null)).toBe(false);
    expect(fechaCambiable("invitado", regaloBase())).toBe(false);
    expect(fechaCambiable("activo", regaloBase())).toBe(false);
    expect(fechaCambiable("regalo_pendiente", regaloBase({ usado_at: "2026-10-01T10:00:00Z" }))).toBe(false);
    expect(fechaCambiable("regalo_pendiente", regaloBase({ entrega_canal: "mail", entrega_enviada_at: "2026-10-17T10:00:00Z" }))).toBe(false);
  });

  it("las reglas del checkout: fecha real, no pasada", () => {
    expect(errorDeNuevaFecha("2026-12-31", regaloBase(), HOY)).toBeNull();
    // Desde ayer en UTC (quien regala puede estar en Argentina a la noche), como al comprar.
    expect(errorDeNuevaFecha("2026-10-17", regaloBase(), HOY)).toBeNull();
    expect(errorDeNuevaFecha("2026-10-10", regaloBase(), HOY)).toBe(MENSAJE_FECHA_PASADA);
    expect(errorDeNuevaFecha("2026-02-31", regaloBase(), HOY)).toBe(MENSAJE_FECHA_INVALIDA);
    expect(errorDeNuevaFecha("", regaloBase(), HOY)).toBe(MENSAJE_FECHA_INVALIDA);
    expect(errorDeNuevaFecha(20261224, regaloBase(), HOY)).toBe(MENSAJE_FECHA_INVALIDA);
    expect(errorDeNuevaFecha(undefined, regaloBase(), HOY)).toBe(MENSAJE_FECHA_INVALIDA);
  });

  it("si se manda solo ese día, la hora de ese día tiene que estar por venir", () => {
    const porMail = regaloBase({ entrega_canal: "mail", entrega_hora: 10, entrega_zona: "Europe/Madrid" });
    // 18/10 a las 10 en Madrid = 08:00 UTC: ya pasó a las 12 UTC.
    expect(errorDeNuevaFecha("2026-10-18", porMail, HOY)).toBe(MENSAJE_FECHA_PASADA);
    expect(errorDeNuevaFecha("2026-10-19", porMail, HOY)).toBeNull();
    const aLaNoche = { ...porMail, entrega_hora: 21 };
    expect(errorDeNuevaFecha("2026-10-18", aLaNoche, HOY)).toBeNull();
  });
});

// ── PATCH /api/regalo/fecha ────────────────────────────────────────────

type Escritura = { tabla: string; op: string; valores?: Record<string, unknown>; filtros: Record<string, unknown> };
const escrituras: Escritura[] = [];

/** Una base con una sola fila de `regalos`. El update aplica los filtros de verdad y devuelve las filas que tocó. */
function base(regalo: RegaloConFecha | null, o: { fallaLectura?: boolean } = {}) {
  const filas = regalo ? [{ ...regalo, narrador_id: "n1" }] : [];
  return {
    from: (tabla: string) => {
      const filtros: Record<string, unknown> = {};
      let op = "select";
      let valores: Record<string, unknown> | undefined;
      const b: Record<string, unknown> = {};
      const coinciden = () => filas.filter((f) => Object.entries(filtros).every(([k, v]) => (v === null ? f[k as keyof typeof f] == null : f[k as keyof typeof f] === v)));
      b.select = () => b;
      b.eq = (k: string, v: unknown) => { filtros[k] = v; return b; };
      b.is = (k: string, v: unknown) => { filtros[k] = v; return b; };
      b.update = (v: Record<string, unknown>) => { op = "update"; valores = v; return b; };
      b.delete = () => { op = "delete"; return b; };
      b.maybeSingle = async () => (o.fallaLectura ? { data: null, error: { message: "caída" } } : { data: coinciden()[0] ?? null, error: null });
      b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
        const tocadas = coinciden();
        if (op !== "select") escrituras.push({ tabla, op, valores, filtros: { ...filtros } });
        return Promise.resolve({ data: op === "update" ? tocadas.map((f) => ({ id: f.id })) : tocadas, error: null }).then(res, rej);
      };
      return b;
    },
  };
}

const peticion = (body: unknown) => ({ json: async () => body, nextUrl: { searchParams: new URLSearchParams("narrador=n1") } }) as never;
const usar = (regalo: RegaloConFecha | null, o?: { fallaLectura?: boolean }) =>
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(base(regalo, o));
const acceso = (v: unknown) => (narradorDeLaSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(v);

describe("PATCH /api/regalo/fecha", () => {
  beforeEach(() => {
    escrituras.length = 0;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(HOY);
    (crearClienteSesion as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({});
    acceso({ ok: true, narrador: { id: "n1", estado: "regalo_pendiente", familia_id: "f1" }, rol: "duena", user: { id: "u1" } });
    usar(regaloBase());
  });

  it("guarda solo fecha_entrega, con las trabas de abierto y mandado", async () => {
    const r = await PATCH(peticion({ fecha: "2026-12-31" }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, fecha: "2026-12-31" });
    expect(escrituras).toEqual([{ tabla: "regalos", op: "update", valores: { fecha_entrega: "2026-12-31" }, filtros: { id: "r1", usado_at: null } }]);
  });

  it("si se manda solo, la traba de mandado también va en el update", async () => {
    usar({ ...regaloBase({ entrega_canal: "mail", entrega_hora: 10, entrega_zona: "Europe/Madrid" }), entrega_contacto: "a@b.com" } as RegaloConFecha);
    const r = await PATCH(peticion({ fecha: "2026-12-31" }));
    expect(r.status).toBe(200);
    expect(escrituras[0].filtros).toEqual({ id: "r1", usado_at: null, entrega_enviada_at: null });
    // La entrega no se toca: canal, contacto y hora siguen.
    expect(Object.keys(escrituras[0].valores ?? {})).toEqual(["fecha_entrega"]);
  });

  it("solo la dueña: la sesión lo pide con soloDuena", async () => {
    acceso({ ok: false, status: 403, error: "Solo quien compró el libro puede hacer esto." });
    const r = await PATCH(peticion({ fecha: "2026-12-31" }));
    expect(r.status).toBe(403);
    expect(escrituras).toEqual([]);
    expect((narradorDeLaSesion as unknown as ReturnType<typeof vi.fn>).mock.calls[0][3]).toMatchObject({ soloDuena: true });
  });

  it("sin sesión, 401", async () => {
    acceso({ ok: false, status: 401, error: "No hay sesión activa." });
    expect((await PATCH(peticion({ fecha: "2026-12-31" }))).status).toBe(401);
    expect(escrituras).toEqual([]);
  });

  it("un regalo ya abierto o una historia en marcha: 409 y no escribe", async () => {
    usar(regaloBase({ usado_at: "2026-10-10T10:00:00Z" }));
    expect((await PATCH(peticion({ fecha: "2026-12-31" }))).status).toBe(409);
    usar(regaloBase());
    acceso({ ok: true, narrador: { id: "n1", estado: "activo", familia_id: "f1" }, rol: "duena", user: { id: "u1" } });
    expect((await PATCH(peticion({ fecha: "2026-12-31" }))).status).toBe(409);
    expect(escrituras).toEqual([]);
  });

  it("ya mandado por mail o WhatsApp: 409", async () => {
    usar(regaloBase({ entrega_canal: "whatsapp", entrega_hora: 10, entrega_zona: "Europe/Madrid", entrega_enviada_at: "2026-10-18T08:00:00Z" }));
    expect((await PATCH(peticion({ fecha: "2026-12-31" }))).status).toBe(409);
    expect(escrituras).toEqual([]);
  });

  it("una fecha pasada o rota: 400 con el mensaje del checkout y no escribe", async () => {
    const r = await PATCH(peticion({ fecha: "2026-10-01" }));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: MENSAJE_FECHA_PASADA });
    expect((await PATCH(peticion({ fecha: "mañana" }))).status).toBe(400);
    expect((await PATCH(peticion({}))).status).toBe(400);
    expect((await PATCH(peticion(null))).status).toBe(400);
    expect(escrituras).toEqual([]);
  });

  it("sin regalo, 404; si la base falla, 500; y nunca borra", async () => {
    usar(null);
    expect((await PATCH(peticion({ fecha: "2026-12-31" }))).status).toBe(404);
    usar(regaloBase(), { fallaLectura: true });
    expect((await PATCH(peticion({ fecha: "2026-12-31" }))).status).toBe(500);
    expect(escrituras.filter((e) => e.op === "delete")).toEqual([]);
    expect(escrituras).toEqual([]);
  });

  it("si se abrió justo en el medio, el update no toca nada y avisa", async () => {
    // La lectura ve el regalo sin abrir; el update, con la traba, no encuentra la fila.
    const sinAbrir = base(regaloBase());
    const abierto = base(regaloBase({ usado_at: "2026-10-18T11:59:00Z" }));
    let vez = 0;
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ from: (t: string) => (vez++ === 0 ? sinAbrir.from(t) : abierto.from(t)) });
    const r = await PATCH(peticion({ fecha: "2026-12-31" }));
    expect(r.status).toBe(409);
  });
});

// ── Las piezas del panel ───────────────────────────────────────────────

describe("la fila y la hoja de la fecha", () => {
  const textos = (idioma: "es" | "ar") => {
    const T = PANEL[idioma];
    return { fila: T.cambiarFecha, titulo: T.cambiarFecha, texto: T.fechaTexto, campo: T.fechaCampo, guardar: T.guardarFecha, guardando: T.guardando, guardado: T.guardado, cerrar: T.cerrarHoja, error: T.errorFecha };
  };

  it("va primera en «Tu pedido», solo si la página la pasa", () => {
    const con = renderToStaticMarkup(
      <HojaPedido idioma="es" quien={el} momento="antes" lineas={{ impresos: 0, marcos: 0 }} fecha={<CambiarFecha narradorId="n1" fecha="2026-12-24" textos={textos("es")} />} contacto={contacto} />,
    );
    expect(con).toContain("Cambiar la fecha de inicio");
    expect(con.indexOf("Cambiar la fecha de inicio")).toBeLessThan(con.indexOf("Cancelar el pedido"));
    // La hoja está cerrada: no hay diálogo ni campo hasta que se toca.
    expect(con).not.toContain('role="dialog"');
    const sin = renderToStaticMarkup(<HojaPedido idioma="es" quien={el} momento="antes" lineas={{ impresos: 0, marcos: 0 }} contacto={contacto} />);
    expect(sin).not.toContain("Cambiar la fecha");
  });

  it("España de tú y Argentina de vos, sin dos puntos", () => {
    expect(PANEL.es.fechaTexto).toContain("Puedes cambiarla");
    expect(PANEL.ar.fechaTexto).toContain("Podés cambiarla");
    expect(PANEL.ar.errorFecha).toContain("Intentá");
    for (const t of [PANEL.es.fechaTexto, PANEL.ar.fechaTexto, PANEL.es.marcoTexto(el), PANEL.ar.marcoTexto(el)]) expect(t).not.toContain(":");
  });

  it("el aviso «Guardado» tiene su región de estado siempre puesta y vacía hasta guardar", () => {
    const html = renderToStaticMarkup(<AvisoGuardado vez={0} texto="Guardado" />);
    expect(html).toContain('role="status"');
    expect(html).not.toContain("Guardado");
  });
});

describe("la tarjeta del marco", () => {
  it("la foto del marco en casa, qué es y el enlace a Encargar libro", () => {
    const html = renderToStaticMarkup(<TarjetaMarco idioma="es" quien={el} href="/tablero/n1/libro" />);
    expect(html).toContain("marco-en-casa.jpg");
    for (const t of ["Su foto enmarcada", "Acercas el móvil al marco y se abre su libro, con su voz.", "Añadir el marco"]) expect(html, t).toContain(escapar(t));
    expect(html).toContain('href="/tablero/n1/libro"');
    const ar = renderToStaticMarkup(<TarjetaMarco idioma="ar" quien={el} href="/x" />);
    for (const t of ["Sumar el marco", "Acercás el celular al marco"]) expect(ar, t).toContain(escapar(t));
    expect(ar).not.toMatch(/móvil|Añadir/);
  });

  it("de quien cuenta su propia historia o su viaje, en segunda persona", () => {
    expect(renderToStaticMarkup(<TarjetaMarco idioma="es" quien={{ ...el, propia: true }} href="/x" />)).toContain("Tu foto enmarcada");
    expect(renderToStaticMarkup(<TarjetaMarco idioma="es" quien={{ como: "Sara", propia: true, ella: true, viaje: true }} href="/x" />)).toContain("el libro del viaje, con tu voz");
  });
});

describe("foto chica para la tapa", () => {
  it("el umbral es el de la tapa en Encargar libro (página entera, 1200×1800)", () => {
    expect(chicaParaTapa({ ancho: 800, alto: 600 })).toBe(true); // baja
    expect(chicaParaTapa({ ancho: 1000, alto: 1400 })).toBe(true); // chica: alcanza entre el texto, no en la tapa
    expect(chicaParaTapa({ ancho: 1200, alto: 1800 })).toBe(false); // libro
    expect(chicaParaTapa({ ancho: 1800, alto: 1200 })).toBe(false); // apaisada: se mide el lado largo
    expect(chicaParaTapa({ ancho: 3000, alto: 4000 })).toBe(false); // marco
    expect(chicaParaTapa(null)).toBe(false); // sin medir no se asusta a nadie
  });

  it("el botón de subir sigue igual con o sin tapa pendiente", () => {
    const a = renderToStaticMarkup(<SubirFoto narradorId="n1" capitulos={[]} variante="barra" trato="tu" paraTapa>Agregar fotos</SubirFoto>);
    const b = renderToStaticMarkup(<SubirFoto narradorId="n1" capitulos={[]} variante="barra" trato="tu">Agregar fotos</SubirFoto>);
    expect(a).toBe(b);
  });
});
