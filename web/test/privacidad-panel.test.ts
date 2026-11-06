import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/mail", () => ({ enviarMailSocios: vi.fn(async () => true), enviarMailInvitacion: vi.fn(async () => true) }));

// La regla sin depender de su definición de hoy: `null` usa la de verdad; un booleano simula sus dos respuestas.
const regla = vi.hoisted(() => ({ privado: null as boolean | null }));
vi.mock("@/lib/panel", async (original) => {
  const real = await original<typeof import("@/lib/panel")>();
  return { ...real, loContadoEsPrivado: (n: Parameters<typeof real.loContadoEsPrivado>[0]) => regla.privado ?? real.loContadoEsPrivado(n) };
});

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { createServerClient } from "@supabase/ssr";
import { enviarMailInvitacion, enviarMailSocios } from "@/lib/mail";
import { NextRequest } from "next/server";
import { loContadoEsPrivado, PUEDE } from "@/lib/panel";
import { GET as audio } from "../src/app/api/audio/[respuestaId]/route";
import { POST as fuera } from "../src/app/api/fuera-del-libro/route";
import { POST as sugeridas } from "../src/app/api/sugeridas/route";
import { GET as estructura } from "../src/app/api/estructura/route";
import { GET as previewPdf } from "../src/app/api/preview-pdf/route";
import { GET as previewAudio } from "../src/app/api/preview-audio/route";
import { POST as nombres } from "../src/app/api/nombres/route";
import { PATCH as edicion } from "../src/app/api/edicion/route";
import { GET as frasesGet, POST as frasesPost } from "../src/app/api/frases/route";
import { GET as fraseAudio } from "../src/app/api/frases/audio/[fraseId]/route";
import { GET as anticipoAudio } from "../src/app/api/anticipo/[token]/audio/route";
import { armarMuestra, primerParrafoDelLibro } from "@/lib/muestra";
import { createHmac } from "node:crypto";
import { verificarTokenRespuestas } from "@/lib/token-respuestas";
import { puedeSacarElNarrador } from "@/lib/fuera-del-libro";
import { GET as audioNarrador } from "../src/app/api/mis-respuestas/[token]/audio/[respuestaId]/route";
import { POST as fueraNarrador } from "../src/app/api/mis-respuestas/[token]/fuera/route";

// Privacidad del panel (Naza y Joaquín, 05/11). Lo que importa es el rechazo en el servidor, no los botones: quien
// regala y sus invitados no reciben audios ni transcripciones; el narrador que compró para sí, sí. Viaje y Kids igual.

type Fila = Record<string, unknown>;

function crearAdmin(tablas: Record<string, Fila[]>, archivos: Record<string, string> = {}) {
  const subidas: { ruta: string; contenido: string }[] = [];
  const consultas: { tabla: string; columnas: string }[] = [];
  function builder(tabla: string) {
    const filtros: ((f: Fila) => boolean)[] = [];
    const b: Record<string, unknown> = {};
    b.select = (columnas = "*") => { consultas.push({ tabla, columnas }); return b; };
    b.order = () => b;
    b.limit = () => b;
    b.eq = (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return b; };
    b.is = (c: string, v: unknown) => { filtros.push((f) => (f[c] ?? null) === v); return b; };
    b.in = (c: string, v: unknown[]) => { filtros.push((f) => v.includes(f[c])); return b; };
    b.ilike = (c: string, v: string) => { filtros.push((f) => String(f[c] ?? "").toLowerCase() === v.toLowerCase()); return b; };
    b.update = () => b;
    b.insert = () => b;
    let single = false;
    b.maybeSingle = () => { single = true; return b; };
    b.single = b.maybeSingle;
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      const filas = (tablas[tabla] ?? []).filter((f) => filtros.every((ok) => ok(f)));
      return Promise.resolve({ data: single ? filas[0] ?? null : filas, error: null }).then(res, rej);
    };
    return b;
  }
  const storage = {
    from: () => ({
      download: vi.fn(async (ruta: string) => (ruta in archivos ? { data: { text: async () => archivos[ruta] }, error: null } : { data: null, error: { message: "Object not found", statusCode: "404" } })),
      list: vi.fn(async (carpeta: string) => ({ data: Object.keys(archivos).filter((r) => r.startsWith(`${carpeta}/`)).map((r) => ({ name: r.slice(carpeta.length + 1) })), error: null })),
      upload: vi.fn(async (ruta: string, contenido: string) => { subidas.push({ ruta, contenido }); archivos[ruta] = contenido; return { error: null }; }),
      createSignedUrl: vi.fn(async (ruta: string) => ({ data: { signedUrl: `https://firmada/${ruta}` }, error: null })),
    }),
  };
  return { admin: { from: vi.fn(builder), storage }, subidas, consultas };
}

const compradora = { id: "u-compradora", email: "compradora@mail.com" };
const invitado = { id: "u-invitado", email: "invitado@mail.com" };

function sesion(u: { id: string; email: string }) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: u }, error: null }) } });
}

function base(contexto: Record<string, unknown>, extra: { pedido?: string; libro_aprobado_at?: string | null } = {}) {
  return {
    familias: [{ id: "f1", auth_user_id: compradora.id, email: compradora.email, nombre: "Laura", region: "AR" }],
    narradores: [{ id: "n1", nombre: "Marta", como_le_dicen: "Marta", familia_id: "f1", estado: "activo", dia_actual: 1, alerta_silencio: false, created_at: "2026-10-01", contexto, libro_aprobado_at: extra.libro_aprobado_at ?? null, edicion: {} }],
    respuestas: [{ id: "r1", narrador_id: "n1", audio_path: "n1/r1.ogg", transcripcion: "Lo que contó" }],
    invitados: [{ id: "i1", narrador_id: "n1", auth_user_id: invitado.id, email: invitado.email, rol: "invitado" }],
    pedidos: extra.pedido ? [{ id: "p1", narrador_id: "n1", familia_id: "f1", estado: extra.pedido, created_at: "2026-10-01" }] : [],
    entregas: [] as Fila[],
    preguntas: [] as Fila[],
    entrevistas_v3: [{ narrador_id: "n1", estado: {} }],
  };
}

const REGALO = { vinculoComprador: "hija", acceso: { elige: true } };
const PROPIA = { vinculoComprador: "yo mismo" };

function preparar(tablas: Record<string, Fila[]>, archivos: Record<string, string> = {}) {
  const r = crearAdmin(tablas, archivos);
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(r.admin);
  return r;
}
const pedir = (ruta: string, cuerpo?: unknown, metodo = cuerpo === undefined ? "GET" : "POST") =>
  new NextRequest(`https://x.test${ruta}`, { method: metodo, ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo), headers: { "Content-Type": "application/json" } }) });
const pedirAudio = () => audio(pedir("/api/audio/r1"), { params: Promise.resolve({ respuestaId: "r1" }) });

beforeEach(() => { vi.clearAllMocks(); regla.privado = null; sesion(compradora); });

describe("la regla", () => {
  it("venta nueva: privado, salvo que elija a su familia. Sin la marca (las entrevistas anteriores), para mí, viaje y kids: no", () => {
    expect(loContadoEsPrivado({ contexto: REGALO })).toBe(true);
    expect(loContadoEsPrivado({ contexto: { modo: "historia", vinculoComprador: "hijo", acceso: { elige: true, quien: "narrador" } } })).toBe(true);
    expect(loContadoEsPrivado({ contexto: { vinculoComprador: "hija", acceso: { elige: true, quien: "familia" } } })).toBe(false);
    expect(loContadoEsPrivado({ contexto: { vinculoComprador: "hija" } })).toBe(false);
    expect(loContadoEsPrivado({ contexto: null })).toBe(false);
    expect(loContadoEsPrivado({ contexto: {} })).toBe(false);
    expect(loContadoEsPrivado({ contexto: PROPIA })).toBe(false);
    expect(loContadoEsPrivado({ contexto: { modo: "historia", ...PROPIA } })).toBe(false);
    expect(loContadoEsPrivado({ contexto: { modo: "viaje", vinculoComprador: "le regala el viaje" } })).toBe(false);
    expect(loContadoEsPrivado({ contexto: { modo: "kids", vinculoComprador: "padre" } })).toBe(false);
  });
});

describe("los audios completos", () => {
  it("quien regala recibe 403, también con el libro listo", async () => {
    preparar(base(REGALO));
    expect((await pedirAudio()).status).toBe(403);
    preparar(base(REGALO, { pedido: "entregado" }));
    expect((await pedirAudio()).status).toBe(403);
  });

  it("un invitado de la familia recibe 403", async () => {
    sesion(invitado);
    preparar(base(REGALO));
    expect((await pedirAudio()).status).toBe(403);
  });

  it("el narrador que compró para sí escucha", async () => {
    preparar(base(PROPIA));
    const r = await pedirAudio();
    expect(r.status).toBe(302);
    expect(r.headers.get("location")).toContain("n1/r1.ogg");
  });

  it("viaje y kids quedan como estaban", async () => {
    preparar(base({ modo: "viaje", vinculoComprador: "le regala el viaje" }));
    expect((await pedirAudio()).status).toBe(302);
    preparar(base({ modo: "kids", vinculoComprador: "padre" }));
    expect((await pedirAudio()).status).toBe(302);
  });
});

describe("lo que sale de lo contado", () => {
  const q = "?narrador=n1";
  it("sacar del libro: quien regala 403, el dueño de su propia historia pasa", async () => {
    preparar(base(REGALO));
    expect((await fuera(pedir(`/api/fuera-del-libro${q}`, { accion: "sacar", respuestaId: "r1" }))).status).toBe(403);
    preparar(base(PROPIA));
    expect((await fuera(pedir(`/api/fuera-del-libro${q}`, { accion: "sacar", respuestaId: "r1" }))).status).not.toBe(403);
  });

  it("sugerencias, estructura y nombres: 403 si es privado", async () => {
    preparar(base(REGALO));
    expect((await sugeridas(pedir(`/api/sugeridas${q}`, {}))).status).toBe(403);
    expect((await estructura(pedir(`/api/estructura${q}`))).status).toBe(403);
    expect((await nombres(pedir(`/api/nombres${q}`, { correcciones: [] }))).status).toBe(403);
  });

  it("previsualización: 403 mientras cuenta, con el libro listo sí", async () => {
    preparar(base(REGALO, { pedido: "pagado" }), { "n1/paquete/preview.pdf": "x", "n1/paquete/muestra_audiolibro.mp3": "x" });
    expect((await previewPdf(pedir(`/api/preview-pdf${q}`))).status).toBe(403);
    expect((await previewAudio(pedir(`/api/preview-audio${q}`))).status).toBe(403);
    preparar(base(REGALO, { pedido: "entregado" }), { "n1/paquete/preview.pdf": "x", "n1/paquete/muestra_audiolibro.mp3": "x" });
    expect((await previewPdf(pedir(`/api/preview-pdf${q}`))).status).toBe(302);
    expect((await previewAudio(pedir(`/api/preview-audio${q}`))).status).toBe(302);
  });

  it("qué dejar afuera: quien regala no puede excluir respuestas", async () => {
    const t = base(REGALO);
    t.narradores[0].estado = "completado";
    preparar(t);
    expect((await edicion(pedir(`/api/edicion${q}`, { excluidas: ["r1"] }, "PATCH"))).status).toBe(403);
  });

  it("un link viejo del anticipo deja de abrir si es privado", async () => {
    process.env.FIRMA_TOKENS = "secreto";
    const { firmarTokenLibro } = await import("@/lib/token-libro");
    const { createHmac } = await import("node:crypto");
    const enc = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const pay = Buffer.from(JSON.stringify({ narradorId: "n1", tipo: "anticipo" })).toString("base64url");
    const token = `${enc}.${pay}.${createHmac("sha256", "secreto").update(`${enc}.${pay}`).digest("base64url")}`;
    expect(firmarTokenLibro).toBeTypeOf("function");
    preparar(base(REGALO));
    expect((await anticipoAudio(new Request("https://x.test"), { params: Promise.resolve({ token }) })).status).toBe(404);
    preparar(base(PROPIA));
    expect((await anticipoAudio(new Request("https://x.test"), { params: Promise.resolve({ token }) })).status).not.toBe(404);
  });
});

describe("la muestra pública", () => {
  const conLibro = { "n1/escritor/libro.md": "# Capítulo 1\n\nEste es el primer párrafo del libro escrito, con unas cuantas palabras.\n\nOtro." };
  it("privada: nada hasta el libro listo, y nunca la transcripción", async () => {
    preparar(base(REGALO, { pedido: "generando", libro_aprobado_at: "2026-11-01" }), conLibro);
    const { admin } = crearAdmin(base(REGALO, { pedido: "generando", libro_aprobado_at: "2026-11-01" }), conLibro);
    expect(await armarMuestra(admin as never, "n1")).toBeNull();
    const listo = crearAdmin(base(REGALO, { pedido: "entregado", libro_aprobado_at: "2026-11-01" }), conLibro);
    const m = await armarMuestra(listo.admin as never, "n1");
    expect(m?.primerParrafo).toBe("Este es el primer párrafo del libro escrito, con unas cuantas palabras.");
    expect(JSON.stringify(m)).not.toContain("Lo que contó");
    expect(listo.consultas.filter((c) => c.tabla === "respuestas").every((c) => !c.columnas.includes("transcripcion"))).toBe(true);
  });

  it("primerParrafoDelLibro salta títulos y párrafos cortos", () => {
    expect(primerParrafoDelLibro("# T\n\n---\n\nCorto.\n\nUn párrafo de verdad, con bastantes palabras para contar.")).toBe("Un párrafo de verdad, con bastantes palabras para contar.");
    expect(primerParrafoDelLibro(null)).toBeNull();
  });
});

describe("las dudas del escritor", () => {
  const q = "?narrador=n1";
  const dudas = JSON.stringify({ dudas: [
    { id: "D1", pregunta: "¿Cómo se escribe su apellido?", que: "Se oye de dos formas", citas: [{ id: "R1", texto: "lo que contó en secreto" }], opciones: ["Pérez", "Peres"] },
    { id: "D2", pregunta: "¿Quién era la mujer con la que se fue en 1962?", que: "x", citas: [{ id: "R2", texto: "otra cita" }] },
  ] });
  const correccion = JSON.stringify({ correcciones: [{ dudaId: "D1", texto: "Pérez" }] });

  it("cuantasDudasPendientes cuenta las que faltan; con el libro escrito, ninguna", async () => {
    const { cuantasDudasPendientes, hayDudasPendientes } = await import("@/lib/dudas-archivos");
    const narrador = { id: "n1" };
    const sinContestar = crearAdmin({}, { "n1/escritor/dudas-familia.json": dudas });
    expect(await cuantasDudasPendientes(sinContestar.admin as never, narrador)).toBe(2);
    expect(await hayDudasPendientes(sinContestar.admin as never, narrador)).toBe(true);
    const una = crearAdmin({}, { "n1/escritor/dudas-familia.json": dudas, "n1/escritor/correcciones.json": correccion });
    expect(await cuantasDudasPendientes(una.admin as never, narrador)).toBe(1);
    const escrito = crearAdmin({}, { "n1/escritor/dudas-familia.json": dudas, "n1/escritor/libro.md": "# L" });
    expect(await cuantasDudasPendientes(escrito.admin as never, narrador)).toBe(0);
    expect(await cuantasDudasPendientes(crearAdmin({}, {}).admin as never, narrador)).toBe(0);
    expect(await hayDudasPendientes(una.admin as never, narrador)).toBe(true);
  });

  it("quien regala y sus invitados: POST da 404 sin escribir", async () => {
    const { POST } = await import("../src/app/api/dudas/route");
    const t = base(REGALO);
    t.narradores[0].estado = "completado";
    const { subidas } = preparar(t, { "n1/escritor/dudas-familia.json": dudas });
    expect((await POST(pedir(`/api/dudas${q}`, { correcciones: [{ dudaId: "D1", texto: "Pérez" }] }))).status).toBe(404);
    sesion(invitado);
    expect((await POST(pedir(`/api/dudas${q}`, { correcciones: [{ dudaId: "D1", texto: "Pérez" }] }))).status).toBe(404);
    expect(subidas).toEqual([]);
  });

  it("«para mí», viaje y kids siguen contestando en el panel", async () => {
    const { POST } = await import("../src/app/api/dudas/route");
    for (const contexto of [PROPIA, { modo: "viaje", vinculoComprador: "le regala el viaje" }, { modo: "kids", vinculoComprador: "padre" }]) {
      const t = base(contexto);
      t.narradores[0].estado = "completado";
      preparar(t, { "n1/escritor/dudas-familia.json": dudas });
      expect((await POST(pedir(`/api/dudas${q}`, { correcciones: [{ dudaId: "D1", texto: "Pérez" }] }))).status).toBe(200);
    }
  });

  it("la pantalla: quien regala y sus invitados van a la historia, sin ver una pregunta", async () => {
    const { default: Pagina } = await import("../src/app/tablero/[narradorId]/dudas/page");
    const abrir = () => Pagina({ params: Promise.resolve({ narradorId: "n1" }) } as never);
    const t = base(REGALO);
    t.narradores[0].estado = "completado";
    preparar(t, { "n1/escritor/dudas-familia.json": dudas });
    await expect(abrir()).rejects.toThrow("NEXT_REDIRECT");
    sesion(invitado);
    await expect(abrir()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("invitar con la entrevista terminada: 400 si es privado, aunque queden dudas", async () => {
    const { POST } = await import("../src/app/api/invitados/route");
    const t = base(REGALO);
    t.narradores[0].estado = "completado";
    preparar(t, { "n1/escritor/dudas-familia.json": dudas });
    expect((await POST(pedir(`/api/invitados${q}`, { email: "tia@mail.com" }))).status).toBe(400);
  });

  describe("un regalo que no es privado sigue como hoy (la regla en false)", () => {
    const terminada = () => {
      const t = base(REGALO);
      t.narradores[0].estado = "completado";
      return t;
    };

    it("POST guarda, para la dueña y para sus invitados", async () => {
      regla.privado = false;
      const { POST } = await import("../src/app/api/dudas/route");
      const { subidas } = preparar(terminada(), { "n1/escritor/dudas-familia.json": dudas });
      expect((await POST(pedir(`/api/dudas${q}`, { correcciones: [{ dudaId: "D1", texto: "Pérez" }] }))).status).toBe(200);
      sesion(invitado);
      expect((await POST(pedir(`/api/dudas${q}`, { correcciones: [{ dudaId: "D2", texto: "Ana" }] }))).status).toBe(200);
      expect(subidas.map((s) => s.ruta)).toEqual(["n1/escritor/correcciones.json", "n1/escritor/correcciones.json"]);
    });

    it("la pantalla se abre, con las preguntas", async () => {
      regla.privado = false;
      const { default: Pagina } = await import("../src/app/tablero/[narradorId]/dudas/page");
      preparar(terminada(), { "n1/escritor/dudas-familia.json": dudas });
      const pantalla = await Pagina({ params: Promise.resolve({ narradorId: "n1" }) } as never);
      expect(JSON.stringify(pantalla)).toContain("¿Cómo se escribe su apellido?");
    });

    it("invitar para dudas funciona; sin dudas pendientes dice lo de siempre", async () => {
      regla.privado = false;
      const { POST } = await import("../src/app/api/invitados/route");
      preparar(terminada(), { "n1/escritor/dudas-familia.json": dudas });
      expect((await POST(pedir(`/api/invitados${q}`, { email: "tia@mail.com" }))).status).toBe(200);
      expect(enviarMailInvitacion).toHaveBeenCalledWith(expect.objectContaining({ paraDudas: true, privado: false }));
      preparar(terminada(), {});
      const r = await POST(pedir(`/api/invitados${q}`, { email: "prima@mail.com" }));
      expect(r.status).toBe(400);
      expect((await r.json()).error).toContain("Ya no quedan dudas para contestar.");
    });

    it("el próximo paso lleva a contestarlas", async () => {
      regla.privado = false;
      const { proximoPaso } = await import("../src/app/tablero/proximo-paso");
      const h = { rol: "duena", narrador: { id: "n1", estado: "completado", contexto: REGALO, nombre: "Marta", como_le_dicen: "Marta" } };
      const r = { respondidas: 3, total: 30, segundos: 0, tieneAnticipo: true, v3: true, dudasPendientes: true };
      expect(proximoPaso(h as never, r as never)).toEqual({ href: "/tablero/n1/dudas", texto: "Hay dudas sobre lo que contó Marta. Contestalas antes de que se escriba el libro." });
    });

    it("el helper: `loContadoEsPrivado` o `esPropia`, y nada más", async () => {
      const { dudasAQuienConto } = await import("@/lib/dudas-archivos");
      regla.privado = false;
      expect(dudasAQuienConto({ contexto: REGALO })).toBe(false);
      expect(dudasAQuienConto({ contexto: PROPIA })).toBe(true);
      regla.privado = true;
      expect(dudasAQuienConto({ contexto: { modo: "viaje", vinculoComprador: "hija" } })).toBe(true);
    });
  });

  it("el texto de cuántas faltan", async () => {
    const { textoQuedanPreguntas } = await import("../src/app/tablero/proximo-paso");
    expect(textoQuedanPreguntas("Marta", 1)).toBe("A Marta le queda una pregunta por contestar.");
    expect(textoQuedanPreguntas("Marta", 3)).toBe("A Marta le quedan 3 preguntas por contestar.");
  });
});

describe("las frases", () => {
  const frase = (id: string, elegida: boolean, estado = "cortada") => ({ id, texto: `Frase ${id}`, origen: "cita", grupo: null, respuesta_id: "r1", pregunta_orden: 3, por_que: "porque sí", elegida, elegida_por: "modelo", estado, audio_path: `n1/voz/${id}.mp3`, segundos: 5, inicio: 0, fin: 5 });
  const archivo = (o: { confirmado_at?: string | null; pendiente?: boolean } = {}) => JSON.stringify({ version: 1, narrador_id: "n1", pedido_id: "p1", confirmado_at: o.confirmado_at ?? null, capitulos: [{ numero: 1, capitulo: "Uno", candidatas: [frase("a", true, o.pendiente ? "pendiente" : "cortada"), frase("b", false)] }] });
  const RUTA = "n1/paquete/frases.json";
  const FRENO = "n1/paquete/frenar_imprenta.json";
  const q = "?narrador=n1";

  it("GET: privado solo con el libro listo, solo las elegidas, sin de dónde salieron", async () => {
    preparar(base(REGALO, { pedido: "pagado" }), { [RUTA]: archivo() });
    expect((await frasesGet(pedir(`/api/frases${q}`))).status).toBe(404);
    preparar(base(REGALO, { pedido: "entregado" }), { [RUTA]: archivo() });
    const j = await (await frasesGet(pedir(`/api/frases${q}`))).json();
    expect(j.capitulos[0].candidatas.map((f: { id: string }) => f.id)).toEqual(["a"]);
    expect(j.capitulos[0].candidatas[0]).toMatchObject({ respuesta_id: null, por_que: "", pregunta_orden: 0 });
  });

  it("GET propia: todas, como siempre", async () => {
    preparar(base(PROPIA), { [RUTA]: archivo() });
    const j = await (await frasesGet(pedir(`/api/frases${q}`))).json();
    expect(j.capitulos[0].candidatas.map((f: { id: string }) => f.id)).toEqual(["a", "b"]);
  });

  it("audio: una candidata no elegida da 404 a quien regala", async () => {
    preparar(base(REGALO, { pedido: "entregado" }), { [RUTA]: archivo() });
    expect((await fraseAudio(pedir(`/api/frases/audio/b${q}`), { params: Promise.resolve({ fraseId: "b" }) })).status).toBe(404);
    expect((await fraseAudio(pedir(`/api/frases/audio/a${q}`), { params: Promise.resolve({ fraseId: "a" }) })).status).toBe(302);
  });

  it("quien regala no cambia la selección, y el invitado tampoco confirma", async () => {
    preparar(base(REGALO, { pedido: "entregado" }), { [RUTA]: archivo() });
    expect((await frasesPost(pedir(`/api/frases${q}`, { seleccion: [{ numero: 1, elegidas: ["b"] }], confirmar: true }))).status).toBe(403);
    sesion(invitado);
    expect((await frasesPost(pedir(`/api/frases${q}`, { confirmar: true }))).status).toBe(403);
  });

  it("confirmar: con el libro listo deja la selección del biógrafo y anota la fecha", async () => {
    const { subidas } = preparar(base(REGALO, { pedido: "entregado" }), { [RUTA]: archivo() });
    expect((await frasesPost(pedir(`/api/frases${q}`, { confirmar: true }))).status).toBe(200);
    const guardado = JSON.parse(subidas.find((s) => s.ruta === RUTA)!.contenido);
    expect(guardado.confirmado_at).toBeTruthy();
    expect(guardado.capitulos[0].candidatas.filter((f: { elegida: boolean }) => f.elegida).map((f: { id: string }) => f.id)).toEqual(["a"]);
  });

  it("no se confirma antes del libro listo, ni con audios por recortar, ni con la imprenta frenada", async () => {
    preparar(base(REGALO, { pedido: "generando" }), { [RUTA]: archivo() });
    expect((await frasesPost(pedir(`/api/frases${q}`, { confirmar: true }))).status).toBe(409);
    preparar(base(REGALO, { pedido: "entregado" }), { [RUTA]: archivo({ pendiente: true }) });
    expect((await frasesPost(pedir(`/api/frases${q}`, { confirmar: true }))).status).toBe(409);
    preparar(base(REGALO, { pedido: "entregado" }), { [RUTA]: archivo(), [FRENO]: "{}" });
    expect((await frasesPost(pedir(`/api/frases${q}`, { confirmar: true }))).status).toBe(409);
  });

  it("«Hay un error, avisanos» frena la imprenta y avisa a los socios", async () => {
    const { subidas } = preparar(base(REGALO, { pedido: "entregado" }), { [RUTA]: archivo() });
    expect((await frasesPost(pedir(`/api/frases${q}`, { error: "Mi tía se llama Ofelia, no Ofelio" }))).status).toBe(200);
    expect(subidas.find((s) => s.ruta === FRENO)?.contenido).toContain("Ofelia");
    expect(enviarMailSocios).toHaveBeenCalledOnce();
    expect(vi.mocked(enviarMailSocios).mock.calls[0][1]).toContain("Ofelia");
  });

  it("con el libro ya en imprenta no promete frenarlo", async () => {
    const t = base(REGALO, { pedido: "entregado" });
    t.entregas = [{ narrador_id: "n1", estado: "en_produccion" }];
    const { subidas } = preparar(t, { [RUTA]: archivo() });
    expect((await frasesPost(pedir(`/api/frases${q}`, { error: "Un nombre mal escrito" }))).status).toBe(409);
    expect(subidas).toEqual([]);
    expect(enviarMailSocios).not.toHaveBeenCalled();
  });

  it("el dueño de su propia historia cambia y confirma como siempre", async () => {
    preparar(base(PROPIA), { [RUTA]: archivo() });
    expect((await frasesPost(pedir(`/api/frases${q}`, { seleccion: [{ numero: 1, elegidas: ["b"] }], confirmar: true }))).status).toBe(200);
  });
});

describe("el link del narrador", () => {
  const SECRETO = "secreto-de-prueba";
  const token = (o: { exp?: number; tipo?: string; narradorId?: string } = {}) => {
    const enc = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const pay = Buffer.from(JSON.stringify({ narradorId: o.narradorId ?? "n1", tipo: o.tipo ?? "respuestas", exp: o.exp ?? Date.now() + 86_400_000 })).toString("base64url");
    return `${enc}.${pay}.${createHmac("sha256", SECRETO).update(`${enc}.${pay}`).digest("base64url")}`;
  };
  beforeEach(() => { process.env.FIRMA_TOKENS = SECRETO; });

  it("verifica firma, tipo y vencimiento", () => {
    expect(verificarTokenRespuestas(token())).toEqual({ ok: true, narradorId: "n1" });
    expect(verificarTokenRespuestas(token({ exp: Date.now() - 1 }))).toEqual({ ok: false, motivo: "vencido", narradorId: "n1" });
    expect(verificarTokenRespuestas(token({ tipo: "voz" }))).toEqual({ ok: false, motivo: "invalido" });
    expect(verificarTokenRespuestas(`${token().slice(0, -3)}abc`)).toEqual({ ok: false, motivo: "invalido" });
    expect(verificarTokenRespuestas("nada")).toEqual({ ok: false, motivo: "invalido" });
  });

  it("el plazo: mientras cuenta sí; al terminar, 48 horas desde su último mensaje", () => {
    const ultima = "2026-11-01T12:00:00Z";
    const t0 = Date.parse(ultima);
    expect(puedeSacarElNarrador({ estado: "activo", ultima_respuesta_at: ultima }, t0 + 100 * 3_600_000)).toBe(true);
    expect(puedeSacarElNarrador({ estado: "completado", ultima_respuesta_at: ultima }, t0 + 47 * 3_600_000)).toBe(true);
    expect(puedeSacarElNarrador({ estado: "completado", ultima_respuesta_at: ultima }, t0 + 49 * 3_600_000)).toBe(false);
    expect(puedeSacarElNarrador({ estado: "cerrado_anticipado", ultima_respuesta_at: null }, t0)).toBe(false);
  });

  it("escucha sus audios sin sesión, y solo los suyos", async () => {
    preparar(base(REGALO));
    const r = await audioNarrador(pedir("/x"), { params: Promise.resolve({ token: token(), respuestaId: "r1" }) });
    expect(r.status).toBe(302);
    expect((await audioNarrador(pedir("/x"), { params: Promise.resolve({ token: token({ narradorId: "otro" }), respuestaId: "r1" }) })).status).toBe(404);
    expect((await audioNarrador(pedir("/x"), { params: Promise.resolve({ token: token({ exp: Date.now() - 1 }), respuestaId: "r1" }) })).status).toBe(403);
    expect((await audioNarrador(pedir("/x"), { params: Promise.resolve({ token: "basura", respuestaId: "r1" }) })).status).toBe(403);
  });

  const sacar = (t: string) => fueraNarrador(pedir("/x", { accion: "sacar", respuestaId: "r1", volverAPreguntar: true }), { params: Promise.resolve({ token: t }) });

  it("con el link saca sin sesión, sin usuario y sin volver a preguntar, aunque el libro ya esté encargado", async () => {
    const t = base(REGALO, { libro_aprobado_at: "2026-11-01" });
    Object.assign(t.narradores[0], { estado: "completado", ultima_respuesta_at: new Date(Date.now() - 3_600_000).toISOString() });
    t.entrevistas_v3 = [{ narrador_id: "n1", estado: { respuestas: [], charla: [{ de: "bio", partes: [{ id: "OR1", texto: "¿Dónde naciste?" }] }] } }];
    (t.respuestas[0] as Fila).clave_v3 = "OR1";
    const altas: Fila[] = [];
    const r = preparar(t);
    const original = r.admin.from;
    r.admin.from = vi.fn((tabla: string) => {
      const b = original(tabla) as Record<string, unknown>;
      b.upsert = async (fila: Fila) => { altas.push({ tabla, ...fila }); return { error: null }; };
      b.insert = async (fila: Fila) => { altas.push({ tabla, ...fila }); return { error: null }; };
      return b;
    }) as never;
    expect((await sacar(token())).status).toBe(200);
    expect(altas).toEqual([{ tabla: "respuestas_fuera", respuesta_id: "r1", narrador_id: "n1", marcada_por: null }]);
  });

  it("pasado el plazo, no; con un link vencido, tampoco", async () => {
    const t = base(REGALO);
    Object.assign(t.narradores[0], { estado: "completado", ultima_respuesta_at: new Date(Date.now() - 49 * 3_600_000).toISOString() });
    preparar(t);
    expect((await sacar(token())).status).toBe(400);
    expect((await sacar(token({ exp: Date.now() - 1 }))).status).toBe(403);
  });
});
