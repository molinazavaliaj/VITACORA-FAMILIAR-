import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((ruta: string) => { throw new Error(`REDIRECT:${ruta}`); }),
  useRouter: () => ({ refresh() {}, push() {} }),
  usePathname: () => "/",
}));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import PaginaMiHistoria, { metadata } from "../src/app/mi-historia/[token]/page";
import { POST } from "../src/app/api/mi-historia/[token]/dudas/route";
import * as rutaDudas from "../src/app/api/mi-historia/[token]/dudas/route";
import { PantallaDudas } from "../src/app/mi-historia/[token]/pantalla";
import { NO_ME_ACUERDO, textosMiHistoria } from "@/lib/mi-historia-textos";
import { hayDudasSinContestar } from "@/lib/dudas";

// La pantalla de dudas de quien contó (Naza, 06/11): sin contraseña, con el link firmado. Un GET nunca escribe (WhatsApp
// abre el link solo, para la vista previa) y sin token válido no se muestra ni un dato.

const SECRETO = "secreto-de-prueba";
const token = (o: { exp?: number; tipo?: string; narradorId?: string } = {}) => {
  const enc = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const pay = Buffer.from(JSON.stringify({ narradorId: o.narradorId ?? "n1", tipo: o.tipo ?? "respuestas", exp: o.exp ?? Date.now() + 86_400_000 })).toString("base64url");
  return `${enc}.${pay}.${createHmac("sha256", SECRETO).update(`${enc}.${pay}`).digest("base64url")}`;
};

type Fila = Record<string, unknown>;

function preparar(archivos: Record<string, string>, narrador: Fila = {}, tablas: Record<string, Fila[]> = {}) {
  const subidas: { ruta: string; contenido: string }[] = [];
  const todas: Record<string, Fila[]> = {
    narradores: [{ id: "n1", como_le_dicen: "Marta", contexto: { vinculoComprador: "hija", acceso: { elige: true } }, libro_aprobado_at: null, ...narrador }],
    entrevistas_v3: [{ narrador_id: "n1", estado: {}, idioma: "es-AR" }],
    historias: [],
    ...tablas,
  };
  const builder = (tabla: string) => {
    const filtros: ((f: Fila) => boolean)[] = [];
    const b: Record<string, unknown> = {};
    b.select = () => b;
    b.eq = (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return b; };
    let unica = false;
    b.maybeSingle = () => { unica = true; return b; };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      const filas = (todas[tabla] ?? []).filter((f) => filtros.every((ok) => ok(f)));
      return Promise.resolve({ data: unica ? filas[0] ?? null : filas, error: null }).then(res, rej);
    };
    return b;
  };
  const admin = {
    from: vi.fn(builder),
    storage: {
      from: () => ({
        download: vi.fn(async (ruta: string) => (ruta in archivos ? { data: { text: async () => archivos[ruta] }, error: null } : { data: null, error: { message: "Object not found", statusCode: "404" } })),
        list: vi.fn(async (carpeta: string) => ({ data: Object.keys(archivos).filter((r) => r.startsWith(`${carpeta}/`)).map((r) => ({ name: r.slice(carpeta.length + 1) })), error: null })),
        upload: vi.fn(async (ruta: string, contenido: string) => { subidas.push({ ruta, contenido }); archivos[ruta] = contenido; return { error: null }; }),
      }),
    },
  };
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
  return { subidas };
}

const DUDAS = JSON.stringify({ dudas: [
  { id: "D1", tipo: "nombre", que: "SECRETO-QUE", ids: ["R-INTERNA"], pregunta: "¿Cómo se llamaba tu maestra?", citas: [{ id: "R-INTERNA", texto: "La señorita Ofelia me enseñó a leer." }], opciones: ["Ofelia", "Otilia"] },
  { id: "D2", pregunta: "¿En qué año se mudaron?" },
  { id: "D3", pregunta: "¿Quién manejaba el camión?" },
] });
const AQUI = "n1/escritor";
const conDudas = { [`${AQUI}/carpeta-A.json`]: "{}", [`${AQUI}/dudas-familia.json`]: DUDAS };
const contestadas = (...ids: string[]) => JSON.stringify({ correcciones: ids.map((dudaId) => ({ dudaId, texto: "Sí", mail: "secreto@mail.com", quien: "Otra persona" })) });

const abrir = async (t = token()) => renderToStaticMarkup(await PaginaMiHistoria({ params: Promise.resolve({ token: t }) }));
const enviar = (t: string, cuerpo: unknown) => POST(new Request("https://x.test", { method: "POST", body: JSON.stringify(cuerpo), headers: { "Content-Type": "application/json" } }) as never, { params: Promise.resolve({ token: t }) });

beforeEach(() => { vi.clearAllMocks(); process.env.FIRMA_TOKENS = SECRETO; });

describe("la puerta /mi-historia/<token>", () => {
  it("sin token válido no muestra ni un dato, y el mensaje es el de /mis-respuestas", async () => {
    preparar(conDudas);
    const basura = await abrir("basura");
    expect(basura).toContain("Este link no sirve");
    expect(basura).not.toContain("maestra");
    const vencido = await abrir(token({ exp: Date.now() - 1 }));
    expect(vencido).toContain("Este link ya venció");
    expect(vencido).not.toContain("maestra");
    expect(await abrir(token({ tipo: "voz" }))).toContain("Este link no sirve");
  });

  it("el link vencido con firma válida sale en el idioma de su entrevista", async () => {
    const vencido = token({ exp: Date.now() - 1 });
    preparar(conDudas, {}, { entrevistas_v3: [{ narrador_id: "n1", estado: {}, idioma: "es-ES" }] });
    const es = await abrir(vencido);
    expect(es).toContain("Este enlace ya ha caducado");
    expect(es).not.toContain("maestra");
    preparar(conDudas, {}, { entrevistas_v3: [], historias: [{ narrador_id: "n1", estado: {}, idioma: "ca" }] });
    expect(await abrir(vencido)).toContain("Aquest enllaç ja ha caducat");
    preparar(conDudas, {}, { entrevistas_v3: [] });
    expect(await abrir(vencido)).toContain("Este link ya venció");
  });

  it("una firma mala no lee nada: sale en es-AR", async () => {
    preparar(conDudas, {}, { entrevistas_v3: [{ narrador_id: "n1", estado: {}, idioma: "ca" }] });
    const malo = `${token({ exp: Date.now() - 1 }).slice(0, -3)}abc`;
    expect(await abrir(malo)).toContain("Este link no sirve");
    expect(crearClienteServidor).not.toHaveBeenCalled();
  });

  it("no se indexa ni manda referrer", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.referrer).toBe("no-referrer");
  });

  it("con dudas sin contestar y carpeta-A.json muestra la primera, con sus frases y opciones", async () => {
    preparar(conDudas);
    const html = await abrir();
    expect(html).toContain("Unas últimas preguntas");
    expect(html).toContain("Pregunta 1 de 3");
    expect(html).toContain("¿Cómo se llamaba tu maestra?");
    expect(html).toContain("La señorita Ofelia me enseñó a leer.");
    expect(html).toContain("Otilia");
    expect(html).toContain("No me acuerdo");
    expect(html).toContain("Seguir");
  });

  it("al volver abre en la primera sin contestar", async () => {
    preparar({ ...conDudas, [`${AQUI}/correcciones.json`]: contestadas("D1") });
    const html = await abrir();
    expect(html).toContain("Pregunta 2 de 3");
    expect(html).toContain("¿En qué año se mudaron?");
    expect(html).not.toContain("¿Cómo se llamaba tu maestra?");
  });

  it("lo interno no sale al navegador: ni qué quedó sin resolver, ni ids, ni quién contestó, ni su mail", async () => {
    preparar({ ...conDudas, [`${AQUI}/correcciones.json`]: contestadas("D2") });
    const html = await abrir();
    for (const nada of ["SECRETO-QUE", "R-INTERNA", "secreto@mail.com", "Otra persona"]) expect(html).not.toContain(nada);
  });

  it("con libro.md, «Tu libro ya está escrito.», aunque queden dudas", async () => {
    preparar({ ...conDudas, [`${AQUI}/libro.md`]: "# Libro" });
    const html = await abrir();
    expect(html).toContain("Tu libro ya está escrito.");
    expect(html).not.toContain("maestra");
  });

  it("terminadas, gracias; en un regalo no ofrece encargar", async () => {
    preparar({ ...conDudas, [`${AQUI}/correcciones.json`]: contestadas("D1", "D2", "D3") });
    const html = await abrir();
    expect(html).toContain("Eso es todo. Gracias.");
    expect(html).not.toContain("/libro");
  });

  it("«para mí»: al final, el botón a encargar; ya encargado, no", async () => {
    const archivos = { ...conDudas, [`${AQUI}/correcciones.json`]: contestadas("D1", "D2", "D3") };
    preparar({ ...archivos }, { contexto: { vinculoComprador: "yo mismo" } });
    const html = await abrir();
    expect(html).toContain("/tablero/n1/libro");
    expect(html).toContain("Elegir la tapa y encargar el libro");
    preparar({ ...archivos }, { contexto: { vinculoComprador: "yo mismo" }, libro_aprobado_at: "2026-11-01" });
    expect(await abrir()).not.toContain("/tablero/n1/libro");
  });

  it("en cualquier otro caso va a /mis-respuestas: sin carpeta-A, sin dudas, lista vacía, viaje o kids", async () => {
    const t = token();
    const destino = `REDIRECT:/mis-respuestas/${t}`;
    preparar({ [`${AQUI}/dudas-familia.json`]: DUDAS });
    await expect(abrir(t)).rejects.toThrow(destino);
    preparar({});
    await expect(abrir(t)).rejects.toThrow(destino);
    preparar({ [`${AQUI}/carpeta-A.json`]: "{}", [`${AQUI}/dudas-familia.json`]: JSON.stringify({ dudas: [] }) });
    await expect(abrir(t)).rejects.toThrow(destino);
    preparar(conDudas, { contexto: { modo: "viaje" } });
    await expect(abrir(t)).rejects.toThrow(destino);
    preparar(conDudas, { contexto: { modo: "kids" } });
    await expect(abrir(t)).rejects.toThrow(destino);
  });

  it.each([
    ["sin la marca", { vinculoComprador: "hija" }],
    ["con «Mi familia»", { vinculoComprador: "hija", acceso: { elige: true, quien: "familia" } }],
  ])("un regalo %s no muestra dudas y va a /mis-respuestas", async (_caso, contexto) => {
    const t = token();
    preparar(conDudas, { contexto });
    await expect(abrir(t)).rejects.toThrow(`REDIRECT:/mis-respuestas/${t}`);
    preparar({ ...conDudas, [`${AQUI}/libro.md`]: "# L" }, { contexto });
    await expect(abrir(t)).rejects.toThrow(`REDIRECT:/mis-respuestas/${t}`);
  });

  it("«para mí» sigue viendo sus dudas", async () => {
    preparar(conDudas, { contexto: { vinculoComprador: "yo mismo" } });
    expect(await abrir()).toContain("¿Cómo se llamaba tu maestra?");
  });

  it("Viaje y Kids «para mí» no ven dudas por acá", async () => {
    for (const modo of ["viaje", "kids"]) {
      const t = token();
      preparar(conDudas, { contexto: { modo, vinculoComprador: "yo mismo" } });
      await expect(abrir(t)).rejects.toThrow(`REDIRECT:/mis-respuestas/${t}`);
    }
  });

  it("«Prefiero yo» muestra las dudas", async () => {
    preparar(conDudas, { contexto: { acceso: { elige: true, quien: "narrador" } } });
    expect(await abrir()).toContain("¿Cómo se llamaba tu maestra?");
  });

  it("un GET nunca escribe", async () => {
    const { subidas } = preparar(conDudas);
    await abrir();
    expect(subidas).toEqual([]);
    expect("GET" in rutaDudas).toBe(false);
  });

  it("una historia lee de su carpeta y usa su idioma", async () => {
    preparar({ "n1/escritor-historia/carpeta-A.json": "{}", "n1/escritor-historia/dudas-familia.json": DUDAS }, {}, { historias: [{ narrador_id: "n1", estado: {}, idioma: "ca" }] });
    const html = await abrir();
    expect(html).toContain("Unes últimes preguntes");
    expect(html).toContain("No me&#x27;n recordo");
  });
});

describe("POST /api/mi-historia/<token>/dudas", () => {
  const guardado = (s: { contenido: string }[]) => JSON.parse(s[s.length - 1].contenido).correcciones;

  it("verifica el token cada vez: sin uno válido no escribe", async () => {
    const { subidas } = preparar(conDudas);
    const cuerpo = { correcciones: [{ dudaId: "D1", texto: "Ofelia" }] };
    expect((await enviar("basura", cuerpo)).status).toBe(403);
    expect((await enviar(token({ exp: Date.now() - 1 }), cuerpo)).status).toBe(403);
    expect((await enviar(token({ tipo: "voz" }), cuerpo)).status).toBe(403);
    expect((await enviar(token({ narradorId: "otro" }), cuerpo)).status).toBe(404);
    expect(subidas).toEqual([]);
  });

  it("guarda con el nombre de quien contó, sin mail, y conserva lo de los socios", async () => {
    const socios = { texto: "Corrección de los socios" };
    const { subidas } = preparar({ ...conDudas, [`${AQUI}/correcciones.json`]: JSON.stringify({ correcciones: [socios] }) });
    expect((await enviar(token(), { correcciones: [{ dudaId: "D1", texto: "Ofelia", mail: "x@x.com", quien: "Otro" }] })).status).toBe(200);
    const lista = guardado(subidas);
    expect(subidas[0].ruta).toBe(`${AQUI}/correcciones.json`);
    expect(lista[0]).toEqual(socios);
    expect(lista[1]).toMatchObject({ dudaId: "D1", texto: "Ofelia", quien: "Marta" });
    expect(lista[1].mail).toBeUndefined();
  });

  it("«No me acuerdo» cuenta como contestada", async () => {
    const { subidas } = preparar(conDudas);
    expect(NO_ME_ACUERDO).toBe("No se acuerda. Queda como lo contó.");
    await enviar(token(), { correcciones: [{ dudaId: "D1", texto: NO_ME_ACUERDO }, { dudaId: "D2", texto: NO_ME_ACUERDO }, { dudaId: "D3", texto: NO_ME_ACUERDO }] });
    expect(hayDudasSinContestar(JSON.parse(DUDAS).dudas, guardado(subidas))).toBe(false);
  });

  it("una duda inventada es 400, y con el libro escrito 409, sin escribir", async () => {
    const a = preparar(conDudas);
    expect((await enviar(token(), { correcciones: [{ dudaId: "D9", texto: "x" }] })).status).toBe(400);
    expect(a.subidas).toEqual([]);
    const b = preparar({ ...conDudas, [`${AQUI}/libro.md`]: "# L" });
    expect((await enviar(token(), { correcciones: [{ dudaId: "D1", texto: "x" }] })).status).toBe(409);
    expect(b.subidas).toEqual([]);
  });

  it("«Mi familia» no contesta por acá", async () => {
    const { subidas } = preparar(conDudas, { contexto: { vinculoComprador: "hija", acceso: { elige: true, quien: "familia" } } });
    expect((await enviar(token(), { correcciones: [{ dudaId: "D1", texto: "x" }] })).status).toBe(404);
    expect(subidas).toEqual([]);
  });

  it("viaje y kids no contestan por acá", async () => {
    const { subidas } = preparar(conDudas, { contexto: { modo: "viaje" } });
    expect((await enviar(token(), { correcciones: [{ dudaId: "D1", texto: "x" }] })).status).toBe(404);
    expect(subidas).toEqual([]);
  });

  it("un cuerpo que no es JSON es 400", async () => {
    preparar(conDudas);
    const r = await POST(new Request("https://x.test", { method: "POST", body: "{roto" }) as never, { params: Promise.resolve({ token: token() }) });
    expect(r.status).toBe(400);
  });
});

describe("la pantalla", () => {
  const preguntas = [{ id: "D1", numero: 2, pregunta: "¿Cómo se llamaba?", citas: ["Una frase."], opciones: ["Ofelia"] }];

  it("los botones miden al menos 48 px", () => {
    const html = renderToStaticMarkup(<PantallaDudas idioma="es-AR" token="t" total={8} preguntas={preguntas} linkLibro={null} />);
    expect(html).toContain("Pregunta 2 de 8");
    const botones = html.match(/<button[^>]*>/g) ?? [];
    expect(botones.length).toBe(3);
    for (const b of botones) expect(b).toContain("min-h-12");
    expect(html).toContain("Escribí acá, o tocá el micrófono del teclado y dictalo.");
    expect(html).toContain("Lo que dijiste");
  });

  it("sin frases no muestra «Lo que dijiste»", () => {
    const html = renderToStaticMarkup(<PantallaDudas idioma="es-AR" token="t" total={1} preguntas={[{ ...preguntas[0], citas: [], opciones: [] }]} linkLibro={null} />);
    expect(html).not.toContain("Lo que dijiste");
  });
});

describe("los textos", () => {
  it("es-AR, como en el plan", () => {
    const T = textosMiHistoria("es-AR");
    expect(T.titulo).toBe("Unas últimas preguntas");
    expect(T.intro).toBe("Son cosas que no entendimos bien. Lo que nos digas entra al libro.");
    expect(T.pregunta(2, 8)).toBe("Pregunta 2 de 8");
    expect(T.loQueDijiste).toBe("Lo que dijiste");
    expect(T.campo).toBe("Escribí acá, o tocá el micrófono del teclado y dictalo.");
    expect(T.noMeAcuerdo).toBe("No me acuerdo");
    expect(T.seguir).toBe("Seguir");
    expect(T.gracias).toBe("Eso es todo. Gracias.");
    expect(textosMiHistoria("es-ES").gracias).toBe("Eso es todo. Gracias.");
    expect(textosMiHistoria("ca").gracias).toBe("Això és tot. Gràcies.");
    expect(T.botonLibro).toBe("Elegir la tapa y encargar el libro");
    expect(T.libroEscrito).toBe("Tu libro ya está escrito.");
  });

  it("los tres idiomas, sin dos puntos ni oraciones que empiecen con Y o I, y sin voseo en España", () => {
    for (const idioma of ["es-AR", "es-ES", "ca"] as const) {
      const T = textosMiHistoria(idioma);
      for (const s of [T.titulo, T.intro, T.pregunta(1, 2), T.loQueDijiste, T.campo, T.noMeAcuerdo, T.seguir, T.gracias, T.botonLibro, T.libroEscrito, T.errorGuardar]) {
        expect(s.length, idioma).toBeGreaterThan(0);
        expect(s, s).not.toContain(":");
        expect(s, s).not.toMatch(/(^|[.?!]\s+)[YI]\s/);
      }
    }
    expect(textosMiHistoria("es-ES").campo).not.toMatch(/Escribí|tocá|acá/);
  });
});
