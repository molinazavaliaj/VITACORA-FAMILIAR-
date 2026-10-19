import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CLAVE_ORIGEN_VIEJA,
  alCargarLaWeb,
  limpiarOrigen,
  olvidarOrigen,
  origenDeLaVisita,
  origenDelNavegador,
  registrarVisita,
  toqueDeUrl,
} from "../src/lib/origen";
import { OrigenVisita } from "../src/app/origen-visita";
import { crearPagador } from "../src/app/_checkout/pagador";
import { enviarRegalo, type PedidoRegalo } from "../src/app/regalar/enviar";

process.env.SUPABASE_SERVICE_ROLE_KEY ??= "clave-de-prueba";

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));
vi.mock("@/lib/pagos", () => ({ crearCheckout: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { crearCheckout } from "@/lib/pagos";
import { POST } from "../src/app/api/compra/route";

// F4-5: de qué anuncio vino cada compra. Desde el 19/10 solo en memoria,
// durante la visita: nada en localStorage, sessionStorage ni cookies. Sin
// jsdom: la ventana es un objeto falso con espías.

const DIA = 24 * 60 * 60 * 1000;
const HOY = new Date("2026-10-14T12:00:00Z");
const despues = (dias: number) => new Date(HOY.getTime() + dias * DIA);

/** Un almacén que anota todo lo que se le pide. */
function almacenEspia(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    datos,
    getItem: vi.fn((k: string) => datos.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void datos.set(k, v)),
    removeItem: vi.fn((k: string) => void datos.delete(k)),
  };
}

/** Una ventana falsa: URL que se puede cambiar (como un `Link`), almacenes y cookie con espías. */
function ventanaFalsa(url: string, local: Record<string, string> = {}) {
  const location = { search: "", pathname: "/" };
  const ir = (u: string) => {
    const x = new URL(u, "https://vitacorafamiliar.com");
    location.search = x.search;
    location.pathname = x.pathname;
  };
  ir(url);
  const escrituraCookie = vi.fn();
  const document = {};
  Object.defineProperty(document, "cookie", { get: () => "", set: escrituraCookie });
  const indexedDB = { open: vi.fn() };
  return {
    ventana: { location, localStorage: almacenEspia(local), sessionStorage: almacenEspia(), document, indexedDB },
    ir,
    escrituraCookie,
  };
}

beforeEach(() => olvidarOrigen());
afterEach(() => vi.unstubAllGlobals());

describe("captura del origen (solo en memoria)", () => {
  it("una visita sin parámetros de campaña no recuerda nada", () => {
    registrarVisita("?ref=amigo&x=1", "/", HOY);
    registrarVisita("", "/comprar", HOY);
    expect(origenDeLaVisita(HOY)).toBeNull();
  });

  it("recuerda el primer toque con los parámetros, la página sin query y la fecha", () => {
    registrarVisita(
      "?utm_source=facebook&utm_medium=paid&utm_campaign=padre-oct&utm_content=video1&utm_term=libro&fbclid=AbC&gclid=G1&otro=no",
      "/regalo-para-tu-padre",
      HOY,
    );
    expect(origenDeLaVisita(HOY)).toEqual({
      primero: {
        utm_source: "facebook",
        utm_medium: "paid",
        utm_campaign: "padre-oct",
        utm_content: "video1",
        utm_term: "libro",
        fbclid: "AbC",
        gclid: "G1",
        pagina: "/regalo-para-tu-padre",
        fecha: HOY.toISOString(),
      },
    });
  });

  it("una página sin parámetros no pisa el primer toque; una con otros parámetros queda como último", () => {
    registrarVisita("?utm_campaign=uno", "/", HOY);
    registrarVisita("", "/comprar", HOY);
    expect(origenDeLaVisita(HOY)).toEqual({ primero: { utm_campaign: "uno", pagina: "/", fecha: HOY.toISOString() } });

    registrarVisita("?gclid=xyz", "/ar/su-voz", HOY);
    registrarVisita("?utm_campaign=tres", "/ca", HOY);
    const o = origenDeLaVisita(HOY)!;
    expect(o.primero).toMatchObject({ utm_campaign: "uno", pagina: "/" });
    expect(o.ultimo).toEqual({ utm_campaign: "tres", pagina: "/ca", fecha: HOY.toISOString() });
  });

  it("volver a leer la misma URL no la cuenta como otro toque", () => {
    registrarVisita("?utm_campaign=uno", "/comprar", HOY);
    registrarVisita("?utm_campaign=uno", "/comprar", HOY);
    expect(origenDeLaVisita(HOY)).toEqual({ primero: { utm_campaign: "uno", pagina: "/comprar", fecha: HOY.toISOString() } });
  });

  it("una carga nueva de la página (recargar, otra pestaña) empieza sin origen", () => {
    registrarVisita("?utm_campaign=uno", "/", HOY);
    olvidarOrigen();
    expect(origenDeLaVisita(despues(1))).toBeNull();
  });

  it("limpia los valores: sin HTML, recortados a 200", () => {
    const t = toqueDeUrl(`?utm_campaign=${encodeURIComponent("<script>alert(1)</script>")}&utm_term=${"a".repeat(500)}`, "/", HOY);
    expect(t?.utm_campaign).toBe("scriptalert(1)/script");
    expect(t?.utm_term).toHaveLength(200);
  });

  it("el componente no pinta nada (va en el layout raíz)", () => {
    expect(renderToStaticMarkup(createElement(OrigenVisita))).toBe("");
  });
});

describe("en el navegador: nada guardado, sobrevive al cambio de página", () => {
  it("al cargar y al pagar no escribe en localStorage, sessionStorage, cookies ni IndexedDB", () => {
    const { ventana, ir, escrituraCookie } = ventanaFalsa("/regalo-para-tu-padre?utm_source=facebook&fbclid=AbC");
    vi.stubGlobal("window", ventana);
    vi.stubGlobal("document", ventana.document);
    vi.stubGlobal("indexedDB", ventana.indexedDB);

    alCargarLaWeb(() => ventana, HOY);
    ir("/comprar?utm_campaign=otra");
    expect(origenDelNavegador()).not.toBeNull();

    expect(ventana.localStorage.setItem).not.toHaveBeenCalled();
    expect(ventana.localStorage.getItem).not.toHaveBeenCalled();
    expect(ventana.sessionStorage.setItem).not.toHaveBeenCalled();
    expect(ventana.sessionStorage.getItem).not.toHaveBeenCalled();
    expect(ventana.sessionStorage.removeItem).not.toHaveBeenCalled();
    expect(escrituraCookie).not.toHaveBeenCalled();
    expect(ventana.indexedDB.open).not.toHaveBeenCalled();
  });

  it("el código del origen no nombra sessionStorage, cookies ni IndexedDB, y localStorage solo para borrar", () => {
    for (const archivo of ["../src/lib/origen.ts", "../src/app/origen-visita.tsx"]) {
      const codigo = readFileSync(new URL(archivo, import.meta.url), "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      expect(codigo).not.toMatch(/sessionStorage|cookie|indexedDB|setItem|getItem/i);
      expect(codigo.match(/localStorage\.\w+/g) ?? []).toEqual(archivo.endsWith("origen.ts") ? ["localStorage.removeItem"] : []);
    }
  });

  it("lo que trajo la página de llegada sigue ahí al llegar al checkout por un Link (sin parámetros)", () => {
    const { ventana, ir } = ventanaFalsa("/regalo-para-tu-padre?utm_campaign=padre-oct&gclid=G1");
    vi.stubGlobal("window", ventana);
    alCargarLaWeb(() => ventana, HOY);
    ir("/como-funciona");
    ir("/comprar");
    const o = origenDelNavegador();
    expect(o).toMatchObject({ primero: { utm_campaign: "padre-oct", gclid: "G1", pagina: "/regalo-para-tu-padre" } });
    expect(o).not.toHaveProperty("ultimo");
  });

  it("si se llega directo al checkout desde un anuncio, toma la URL actual", () => {
    const { ventana } = ventanaFalsa("/comprar?utm_source=google&gclid=G9");
    vi.stubGlobal("window", ventana);
    expect(origenDelNavegador()).toMatchObject({ primero: { utm_source: "google", gclid: "G9", pagina: "/comprar" } });
  });

  it("sin anuncio, el checkout no manda origen", () => {
    const { ventana, ir } = ventanaFalsa("/");
    vi.stubGlobal("window", ventana);
    alCargarLaWeb(() => ventana, HOY);
    ir("/comprar");
    expect(origenDelNavegador()).toBeNull();
  });

  it("borra una vez la clave vieja vitacora-origen, sin leerla, y no la usa", () => {
    const viejo = JSON.stringify({ primero: { utm_campaign: "viejo", pagina: "/", fecha: HOY.toISOString() } });
    const { ventana } = ventanaFalsa("/", { [CLAVE_ORIGEN_VIEJA]: viejo });
    vi.stubGlobal("window", ventana);
    alCargarLaWeb(() => ventana, HOY);
    expect(CLAVE_ORIGEN_VIEJA).toBe("vitacora-origen");
    expect(ventana.localStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(ventana.localStorage.removeItem).toHaveBeenCalledWith("vitacora-origen");
    expect(ventana.localStorage.datos.has("vitacora-origen")).toBe(false);
    expect(ventana.localStorage.getItem).not.toHaveBeenCalled();
    expect(origenDelNavegador()).toBeNull();
  });

  it("con el almacenamiento bloqueado o sin window no tira nunca", () => {
    const roto = () => {
      throw new Error("SecurityError");
    };
    expect(() => alCargarLaWeb(roto, HOY)).not.toThrow();
    const bloqueado = {
      location: { search: "?utm_source=x", pathname: "/" },
      localStorage: {
        removeItem: () => {
          throw new Error("SecurityError");
        },
      },
    };
    expect(() => alCargarLaWeb(() => bloqueado, HOY)).not.toThrow();
    expect(origenDeLaVisita(HOY)).toMatchObject({ primero: { utm_source: "x" } });
    expect(origenDelNavegador()).toBeNull(); // en el servidor (sin window) no hay origen
  });
});

describe("limpiarOrigen (lo que acepta el servidor)", () => {
  const primero = { utm_source: "facebook", utm_campaign: "padre", pagina: "/", fecha: HOY.toISOString() };

  it("se queda solo con las claves conocidas", () => {
    expect(limpiarOrigen({ primero: { ...primero, email: "a@b.com", precio: 1 }, extra: 1 }, HOY)).toEqual({ primero });
  });

  it("descarta lo que no sirve", () => {
    for (const malo of [
      null,
      "texto",
      [],
      { primero: "x" },
      { primero: { ...primero, fecha: "ayer" } },
      { primero: { ...primero, fecha: despues(5).toISOString() } },
      { primero: { ...primero, pagina: "https://otro.com" } },
      { primero: { ...primero, pagina: "//otro.com" } },
      { primero: { pagina: "/", fecha: HOY.toISOString(), utm_source: 3 } },
      { primero: { pagina: "/", fecha: HOY.toISOString(), utm_source: "<>" } },
    ]) {
      expect(limpiarOrigen(malo, HOY)).toBeNull();
    }
  });

  it("un último toque malo se cae sin llevarse al primero", () => {
    expect(limpiarOrigen({ primero, ultimo: { pagina: "/" } }, HOY)).toEqual({ primero });
  });
});

describe("el checkout manda el origen", () => {
  const T = {
    errorPago: "error",
    errorConexion: "conexion",
    subiendoFoto: () => "",
    noSubio: () => "",
    sacalaOIntenta: "",
  };
  const ORIGEN = { primero: { utm_campaign: "padre", pagina: "/", fecha: HOY.toISOString() } };

  function fetchFalso() {
    const cuerpos: unknown[] = [];
    const fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      cuerpos.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ urlPago: "https://pago/x", narradorId: "n", tokenFotos: "t" }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;
    return { fetch, cuerpos };
  }

  it("/comprar y /comprar/viaje (pagador): con origen lo suma al cuerpo", async () => {
    const { fetch, cuerpos } = fetchFalso();
    await crearPagador({ fetch, asignar: () => {}, origen: () => ORIGEN }, T).pagar({ email: "a@b.com" }, []);
    expect(cuerpos[0]).toEqual({ email: "a@b.com", origen: ORIGEN });
  });

  it("pagador con origenDelNavegador: manda lo que se recordó en la página de llegada", async () => {
    const { ventana, ir } = ventanaFalsa("/regalo-para-tu-padre?utm_campaign=padre");
    vi.stubGlobal("window", ventana);
    alCargarLaWeb(() => ventana, HOY);
    ir("/comprar");
    const { fetch, cuerpos } = fetchFalso();
    await crearPagador({ fetch, asignar: () => {}, origen: origenDelNavegador }, T).pagar({ email: "a@b.com" }, []);
    expect(cuerpos[0]).toEqual({
      email: "a@b.com",
      origen: { primero: { utm_campaign: "padre", pagina: "/regalo-para-tu-padre", fecha: HOY.toISOString() } },
    });
    expect(ventana.localStorage.setItem).not.toHaveBeenCalled();
  });

  it("pagador: sin origen, o si leerlo tira, el cuerpo es el de siempre", async () => {
    for (const origen of [undefined, () => null, () => { throw new Error("x"); }]) {
      const { fetch, cuerpos } = fetchFalso();
      await crearPagador({ fetch, asignar: () => {}, origen }, T).pagar({ email: "a@b.com" }, []);
      expect(cuerpos[0]).toEqual({ email: "a@b.com" });
    }
  });

  const pedido: PedidoRegalo = {
    nombre: "Osvaldo",
    comoLeDicen: "abuelo",
    genero: "varon",
    mensaje: "Hola",
    fechaEntrega: "",
    nombreComprador: "Lucía",
    vinculoComprador: "nieta",
    email: "lucia@example.com",
    region: "ES",
    idioma: "es-ES",
    audio: null,
    entrega: null,
    idiomaWeb: "es",
  };

  it("/regalar: con origen lo suma; sin origen, el cuerpo de siempre", async () => {
    const con = fetchFalso();
    await enviarRegalo(pedido, { fetch: con.fetch, asignar: () => {}, origen: () => ORIGEN });
    expect((con.cuerpos[0] as { origen?: unknown }).origen).toEqual(ORIGEN);

    const sin = fetchFalso();
    await enviarRegalo(pedido, { fetch: sin.fetch, asignar: () => {}, origen: () => { throw new Error("x"); } });
    expect(sin.cuerpos[0]).not.toHaveProperty("origen");
  });
});

// /api/compra: el mismo admin falso que test/compra.test.ts, reducido.
function crearAdmin(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const inserts: Record<string, unknown[]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx] ?? { data: null, error: null };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "ilike", "is", "single", "maybeSingle", "update"]) b[m] = () => b;
    b.insert = (valores: unknown) => {
      (inserts[tabla] ??= []).push(valores);
      return b;
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(resultado).then(res, rej);
    return b;
  });
  return { from, inserts };
}

describe("POST /api/compra guarda el origen en pedidos.extras", () => {
  const CUERPO = {
    nombreComprador: "Martina",
    vinculoComprador: "hija",
    region: "AR",
    email: "martina@ejemplo.com",
    narrador: { nombre: "Roberto", comoLeDicen: "Beto", telefonoWhatsapp: "11 5555 1234", horaPreferida: "09:00" },
    productos: { impresos: 0, marcos: 0 },
  };
  const EXTRAS_DE_SIEMPRE = { pdf: true, audiolibro: null, impreso: null, copias: 0, marcos: 0 };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PRECIO_ARS = "65000";
    (crearCheckout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ urlPago: "https://pago.example/x" });
  });

  async function comprar(body: unknown) {
    const admin = crearAdmin({
      familias: [{ data: null, error: null }, { data: { id: "fam-1" }, error: null }],
      narradores: [{ data: null, error: null }, { data: { id: "nar-1" }, error: null }],
      pedidos: [{ data: { id: "ped-1" }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    const r = await POST({ json: async () => body } as never);
    return { r, extras: (admin.inserts.pedidos?.[0] as { extras: unknown } | undefined)?.extras };
  }

  it("con origen válido lo limpia y lo guarda junto a los productos", async () => {
    const fecha = new Date(Date.now() - DIA).toISOString();
    const { r, extras } = await comprar({
      ...CUERPO,
      origen: {
        primero: { utm_source: " facebook ", utm_campaign: "padre<b>", pagina: "/regalo-para-tu-padre", fecha, cuit: "20-1" },
        ultimo: { gclid: "g".repeat(300), pagina: "/ar", fecha },
        otra: "cosa",
      },
    });
    expect(r.status).toBe(200);
    expect(extras).toEqual({
      ...EXTRAS_DE_SIEMPRE,
      origen: {
        primero: { utm_source: "facebook", utm_campaign: "padreb", pagina: "/regalo-para-tu-padre", fecha },
        ultimo: { gclid: "g".repeat(200), pagina: "/ar", fecha },
      },
    });
  });

  it("con origen basura la compra sigue igual y sin origen", async () => {
    for (const origen of ["<script>", 42, { primero: { pagina: "/", fecha: "mañana" } }, { primero: null }, [1, 2]]) {
      const { r, extras } = await comprar({ ...CUERPO, origen });
      expect(r.status).toBe(200);
      expect(extras).toEqual(EXTRAS_DE_SIEMPRE);
    }
  });

  it("sin origen, los extras de siempre", async () => {
    const { r, extras } = await comprar(CUERPO);
    expect(r.status).toBe(200);
    expect(extras).toEqual(EXTRAS_DE_SIEMPRE);
  });
});
