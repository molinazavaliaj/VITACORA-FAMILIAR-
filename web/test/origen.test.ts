import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CLAVE_ORIGEN,
  leerOrigen,
  limpiarOrigen,
  registrarVisita,
  toqueDeUrl,
  type AlmacenOrigen,
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

// F4-5: de qué anuncio vino cada compra. Sin jsdom: el almacén es un Map.

function almacenFalso() {
  const datos = new Map<string, string>();
  const a: AlmacenOrigen = {
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => void datos.set(k, v),
    removeItem: (k) => void datos.delete(k),
  };
  return { datos, almacen: () => a };
}

const DIA = 24 * 60 * 60 * 1000;
const HOY = new Date("2026-10-14T12:00:00Z");
const despues = (dias: number) => new Date(HOY.getTime() + dias * DIA);

describe("captura del origen", () => {
  it("una visita sin parámetros de campaña no guarda nada", () => {
    const { datos, almacen } = almacenFalso();
    registrarVisita(almacen, "?ref=amigo&x=1", "/", HOY);
    registrarVisita(almacen, "", "/comprar", HOY);
    expect(datos.size).toBe(0);
  });

  it("guarda el primer toque con los parámetros, la página sin query y la fecha", () => {
    const { datos, almacen } = almacenFalso();
    registrarVisita(
      almacen,
      "?utm_source=facebook&utm_medium=paid&utm_campaign=padre-oct&utm_content=video1&utm_term=libro&fbclid=AbC&gclid=G1&otro=no",
      "/regalo-para-tu-padre",
      HOY,
    );
    expect(JSON.parse(datos.get(CLAVE_ORIGEN)!)).toEqual({
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

  it("una visita posterior sin parámetros no pisa el primer toque; una con parámetros queda como último", () => {
    const { datos, almacen } = almacenFalso();
    registrarVisita(almacen, "?utm_campaign=uno", "/", HOY);
    registrarVisita(almacen, "", "/comprar", despues(1));
    expect(leerOrigen(almacen, despues(1))).toEqual({ primero: { utm_campaign: "uno", pagina: "/", fecha: HOY.toISOString() } });

    registrarVisita(almacen, "?gclid=xyz", "/ar/su-voz", despues(2));
    registrarVisita(almacen, "?utm_campaign=tres", "/ca", despues(3));
    const o = JSON.parse(datos.get(CLAVE_ORIGEN)!);
    expect(o.primero).toMatchObject({ utm_campaign: "uno", pagina: "/" });
    expect(o.ultimo).toEqual({ utm_campaign: "tres", pagina: "/ca", fecha: despues(3).toISOString() });
  });

  it("a los 30 días del primer toque caduca: se borra y la próxima visita con parámetros es el nuevo primero", () => {
    const { datos, almacen } = almacenFalso();
    registrarVisita(almacen, "?utm_campaign=viejo", "/", HOY);
    expect(leerOrigen(almacen, despues(29))).not.toBeNull();
    expect(leerOrigen(almacen, despues(31))).toBeNull();
    expect(datos.has(CLAVE_ORIGEN)).toBe(false);

    registrarVisita(almacen, "?utm_campaign=viejo", "/", HOY);
    registrarVisita(almacen, "?utm_campaign=nuevo", "/viaje", despues(31));
    expect(JSON.parse(datos.get(CLAVE_ORIGEN)!)).toEqual({
      primero: { utm_campaign: "nuevo", pagina: "/viaje", fecha: despues(31).toISOString() },
    });
  });

  it("con el almacenamiento roto no tira nunca", () => {
    const roto = () => {
      throw new Error("SecurityError");
    };
    expect(() => registrarVisita(roto, "?utm_source=x", "/", HOY)).not.toThrow();
    expect(leerOrigen(roto, HOY)).toBeNull();

    const tiraAlEscribir: AlmacenOrigen = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    };
    expect(() => registrarVisita(() => tiraAlEscribir, "?utm_source=x", "/", HOY)).not.toThrow();
  });

  it("lo guardado corrupto o manipulado se borra y no se manda", () => {
    const { datos, almacen } = almacenFalso();
    datos.set(CLAVE_ORIGEN, "{no es json");
    expect(leerOrigen(almacen, HOY)).toBeNull();
    expect(datos.has(CLAVE_ORIGEN)).toBe(false);
    datos.set(CLAVE_ORIGEN, JSON.stringify({ primero: { pagina: "/", fecha: HOY.toISOString() } }));
    expect(leerOrigen(almacen, HOY)).toBeNull();
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
