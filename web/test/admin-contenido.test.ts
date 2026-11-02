import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  errorDeArchivo,
  grillaDelMes,
  mesDe,
  mesVecino,
  mover,
  rangoDeLaGrilla,
  rutaDeContenido,
  TAMANO_MAXIMO_CONTENIDO,
} from "../src/lib/admin/contenido";

// 09 · Contenido: lo que se rompe sin que se vea es la grilla (un mes que empieza en
// domingo, un diciembre que salta de año) y el orden al mover (que se pierda una pieza o
// que dos queden con el mismo lugar). Y las acciones, que piden ser admin.

describe("el mes", () => {
  const hoy = new Date("2026-11-02T12:00:00Z");

  it("?mes=2026-02 se entiende; lo que no se entiende es el mes de hoy", () => {
    expect(mesDe("2026-02", hoy)).toEqual({ anio: 2026, mes: 2 });
    expect(mesDe(undefined, hoy)).toEqual({ anio: 2026, mes: 11 });
    expect(mesDe("2026-13", hoy)).toEqual({ anio: 2026, mes: 11 });
    expect(mesDe(["2026-02"], hoy)).toEqual({ anio: 2026, mes: 11 });
  });

  it("diciembre sigue en enero del año siguiente, y enero vuelve a diciembre", () => {
    expect(mesVecino({ anio: 2026, mes: 12 }, 1)).toEqual({ anio: 2027, mes: 1 });
    expect(mesVecino({ anio: 2026, mes: 1 }, -1)).toEqual({ anio: 2025, mes: 12 });
  });

  it("noviembre de 2026 empieza en domingo: la grilla arranca el lunes 26/10", () => {
    const g = grillaDelMes({ anio: 2026, mes: 11 });
    expect(g[0][0]).toEqual({ dia: "2026-10-26", delMes: false });
    expect(g[0][6]).toEqual({ dia: "2026-11-01", delMes: true });
    expect(g.every((s) => s.length === 7)).toBe(true);
    const delMes = g.flat().filter((d) => d.delMes).map((d) => d.dia);
    expect(delMes).toHaveLength(30);
    expect(delMes.at(-1)).toBe("2026-11-30");
    expect(rangoDeLaGrilla({ anio: 2026, mes: 11 })).toEqual({ desde: "2026-10-26", hasta: "2026-12-06" });
  });

  it("un mes que empieza en lunes no suma una semana vacía adelante", () => {
    const g = grillaDelMes({ anio: 2027, mes: 2 }); // 01/02/2027 es lunes
    expect(g[0][0]).toEqual({ dia: "2027-02-01", delMes: true });
    expect(g).toHaveLength(4);
  });
});

describe("mover", () => {
  const p = (id: string, fecha: string | null, orden: number) => ({ id, fecha, orden });
  const base = [p("a", null, 0), p("b", null, 1), p("c", "2026-11-03", 0), p("d", "2026-11-03", 1)];

  it("de la carpeta a un día, al final: renumera el día y la carpeta", () => {
    const { piezas, cambios } = mover(base, "a", "2026-11-03", 99);
    expect(piezas.find((x) => x.id === "a")).toEqual(p("a", "2026-11-03", 2));
    expect(cambios).toEqual(expect.arrayContaining([{ id: "a", fecha: "2026-11-03", orden: 2 }, { id: "b", fecha: null, orden: 0 }]));
    expect(cambios).toHaveLength(2);
  });

  it("antes de otra en el mismo día: sólo cambia el orden", () => {
    const { piezas, cambios } = mover(base, "d", "2026-11-03", 0);
    expect(piezas.filter((x) => x.fecha === "2026-11-03").sort((x, y) => x.orden - y.orden).map((x) => x.id)).toEqual(["d", "c"]);
    expect(cambios).toHaveLength(2);
  });

  it("de vuelta a la carpeta, y en el mismo lugar no guarda nada", () => {
    expect(mover(base, "c", null, 0).piezas.find((x) => x.id === "c")).toEqual(p("c", null, 0));
    expect(mover(base, "c", "2026-11-03", 0).cambios).toEqual([]);
    expect(mover(base, "nadie", null, 0).cambios).toEqual([]);
  });

  it("no se pierde ninguna pieza y nadie comparte lugar", () => {
    const { piezas } = mover(base, "b", "2026-11-03", 1);
    expect(piezas).toHaveLength(4);
    const del3 = piezas.filter((x) => x.fecha === "2026-11-03").map((x) => x.orden).sort();
    expect(del3).toEqual([0, 1, 2]);
  });
});

describe("qué archivo entra", () => {
  it("fotos, videos, audios y PDF; hasta 500 MB", () => {
    expect(errorDeArchivo("image/jpeg", 1000)).toBeNull();
    expect(errorDeArchivo("video/mp4", 1000)).toBeNull();
    expect(errorDeArchivo("audio/mpeg", 1000)).toBeNull();
    expect(errorDeArchivo("application/pdf", 1000)).toBeNull();
    expect(errorDeArchivo("application/x-msdownload", 1000)).toMatch(/no entra/);
    expect(errorDeArchivo("video/mp4", TAMANO_MAXIMO_CONTENIDO + 1)).toMatch(/500 MB/);
    expect(errorDeArchivo("image/png", 0)).toMatch(/vacío/);
  });

  it("la ruta lleva el id y la extensión, nunca el nombre", () => {
    expect(rutaDeContenido("abc", "Reel abuelo FINAL.MP4")).toBe("carpeta/abc.mp4");
    expect(rutaDeContenido("abc", "sin-extension")).toBe("carpeta/abc");
  });
});

// ── Las acciones piden ser admin ─────────────────────────────────────────────

const { estado, tocadas } = vi.hoisted(() => ({
  estado: { email: "socio@vitacora.com" as string | null },
  tocadas: [] as string[],
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
      select: cadena, eq: cadena, is: cadena, order: cadena, limit: cadena,
      maybeSingle: async () => ({ data: { fecha: null, archivo_path: "carpeta/x.jpg" }, error: null }),
      update: (v: unknown) => { tocadas.push(`update ${JSON.stringify(v)}`); return { eq: async () => ({ error: null }) }; },
      delete: () => { tocadas.push("delete"); return { eq: async () => ({ error: null }) }; },
      insert: async () => { tocadas.push("insert"); return { error: null }; },
    });
    return {
      from: () => q,
      storage: {
        from: () => ({
          createSignedUploadUrl: async () => { tocadas.push("firmar"); return { data: { token: "t" }, error: null }; },
          remove: async () => { tocadas.push("remove"); return { error: null }; },
          list: async () => ({ data: [], error: null }),
        }),
      },
    };
  },
}));

import { borrarContenido, editarContenido, guardarOrden, pedirSubida } from "../src/app/admin/contenido/acciones";

const ID = "8b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d";

beforeEach(() => {
  tocadas.length = 0;
  estado.email = "socio@vitacora.com";
  process.env.ADMIN_EMAILS = "socio@vitacora.com";
});

describe("las acciones de Contenido", () => {
  it.each([
    ["sin sesión", null],
    ["con un mail que no está en ADMIN_EMAILS", "intruso@ejemplo.com"],
  ])("%s no tocan nada", async (_caso, email) => {
    estado.email = email;
    const form = new FormData();
    form.set("id", ID);
    expect((await pedirSubida({ nombre: "a.jpg", tipo: "image/jpeg", tamano: 10 })).error).toBeTruthy();
    expect((await guardarOrden([{ id: ID, fecha: null, orden: 0 }])).error).toBeTruthy();
    expect((await editarContenido(form)).error).toBeTruthy();
    expect((await borrarContenido(ID)).error).toBeTruthy();
    expect(tocadas).toEqual([]);
  });

  it("pedir la subida rebota lo que no entra antes de firmar nada", async () => {
    expect((await pedirSubida({ nombre: "a.exe", tipo: "application/x-msdownload", tamano: 10 })).error).toMatch(/no entra/);
    expect(tocadas).toEqual([]);
    expect((await pedirSubida({ nombre: "a.jpg", tipo: "image/jpeg", tamano: 10 })).error).toBeNull();
    expect(tocadas).toEqual(["firmar"]);
  });

  it("guardar el orden rebota un cambio que no se entiende", async () => {
    expect((await guardarOrden([{ id: "no-es-un-id", fecha: null, orden: 0 }])).error).toBeTruthy();
    expect((await guardarOrden([{ id: ID, fecha: "3 de noviembre", orden: 0 }])).error).toBeTruthy();
    expect((await guardarOrden([{ id: ID, fecha: null, orden: -1 }])).error).toBeTruthy();
    expect(tocadas).toEqual([]);
    expect((await guardarOrden([{ id: ID, fecha: "2026-11-03", orden: 2 }])).error).toBeNull();
    expect(tocadas).toEqual([`update ${JSON.stringify({ fecha: "2026-11-03", orden: 2 })}`]);
  });

  it("editar valida la hora, la red y el estado", async () => {
    const form = (campos: Record<string, string>) => {
      const f = new FormData();
      f.set("id", ID);
      for (const [k, v] of Object.entries(campos)) f.set(k, v);
      return f;
    };
    expect((await editarContenido(form({ hora: "25:00" }))).error).toMatch(/hora/);
    expect((await editarContenido(form({ red: "myspace" }))).error).toMatch(/red/);
    expect((await editarContenido(form({ estado: "viral" }))).error).toMatch(/estado/);
    expect(tocadas).toEqual([]);
    expect((await editarContenido(form({ titulo: "Reel", red: "instagram", hora: "19:30", estado: "listo" }))).error).toBeNull();
  });

  it("sacar una pieza borra la fila y el archivo", async () => {
    expect((await borrarContenido(ID)).error).toBeNull();
    expect(tocadas).toEqual(["delete", "remove"]);
  });
});
