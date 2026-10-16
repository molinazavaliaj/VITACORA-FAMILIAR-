import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// «Su voz» de Kids (16/10): la página que abre cada QR del libro de un chico.
// Abre desde que la fábrica dejó listo.json (el padre la prueba en el PDF que
// revisa), con el mismo token firmado de siempre. La casa no cambia: solo con
// el libro cerrado.

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { firmarTokenLibro, firmarTokenVoz } from "../src/lib/token-libro";
import { accesoVoz } from "../src/lib/voz-acceso";
import { GET as GET_AUDIO } from "../src/app/api/voz/[token]/audio/[fraseId]/route";
import { GET as GET_LIBRO } from "../src/app/api/voz/[token]/libro/route";
import PaginaVoz from "../src/app/voz/[token]/page";
import { VOZ_KIDS } from "../src/app/_textos/voz-kids";
import { PANEL_KIDS } from "../src/app/_textos/panel-kids";
import { FICHA, fila } from "./kids-datos";

const esc = (s: string) => renderToStaticMarkup(<>{s}</>);

// Lo que publica la fábrica de Kids: una candidata por respuesta elegida, entera, con su audio.
const FRASES_KIDS = {
  version: 1, narrador_id: "n1", pedido_id: "p1", confirmado_at: "2026-10-20T10:00:00Z",
  capitulos: [{
    numero: 1, capitulo: "Quién soy", candidatas: [
      { id: "R03", texto: "Me gusta el fútbol porque juego con mis amigos.", elegida: true, estado: "cortada", audio_path: "n1/dia_03.ogg", segundos: null },
    ],
  }],
};
const LISTO = JSON.stringify({ at: "2026-10-20T10:00:00Z", paginas: 48, sobrePaginas: 6 });

const NARRADOR_KIDS = { nombre: "Tomás Pérez", como_le_dicen: "Tomi", libro_aprobado_at: null, contexto: { modo: "kids" } };
const NARRADOR_CASA = { nombre: "Osvaldo Gómez", como_le_dicen: "el Negro", libro_aprobado_at: "2026-09-20T00:00:00Z", contexto: null };

function base(o: { narrador: unknown; kids?: unknown; archivos?: Record<string, string> }) {
  const archivos = o.archivos ?? {};
  const createSignedUrl = vi.fn(async (ruta: string) => ({ data: { signedUrl: `https://firmada.test/${ruta}` }, error: null }));
  const from = (tabla: string) => {
    const data = tabla === "narradores" ? o.narrador : tabla === "kids_v2" ? (o.kids ?? null) : null;
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "order"]) b[m] = () => b;
    b.maybeSingle = () => Promise.resolve({ data, error: null });
    return b;
  };
  const storage = {
    from: () => ({
      download: async (ruta: string) => (ruta in archivos ? { data: { text: async () => archivos[ruta] }, error: null } : { data: null, error: { message: "Object not found" } }),
      list: async (carpeta: string) => ({
        data: Object.keys(archivos).filter((r) => r.startsWith(`${carpeta}/`)).map((r) => ({ name: r.slice(carpeta.length + 1) })),
        error: null,
      }),
      createSignedUrl,
    }),
  };
  const admin = { from, storage };
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
  return { admin: admin as never, createSignedUrl };
}

const kidsSinListo = () => base({ narrador: NARRADOR_KIDS, kids: fila({ fichaMotor: FICHA }), archivos: { "n1/paquete/frases.json": JSON.stringify(FRASES_KIDS) } });
const kidsConListo = () =>
  base({
    narrador: NARRADOR_KIDS,
    kids: fila({ fichaMotor: FICHA }),
    archivos: { "n1/paquete/frases.json": JSON.stringify(FRASES_KIDS), "n1/escritor-kids/listo.json": LISTO, "n1/paquete/libro.html": "<html>libro</html>" },
  });

const audio = (token: string, fraseId: string) => GET_AUDIO({} as never, { params: Promise.resolve({ token, fraseId }) });
const libro = (token: string) => GET_LIBRO({} as never, { params: Promise.resolve({ token }) });
const pagina = async (token: string) => renderToStaticMarkup(await PaginaVoz({ params: Promise.resolve({ token }) } as never));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "secreto-de-prueba";
});

describe("«Su voz» de Kids: cuándo abre", () => {
  it("antes de listo.json no abre: ni la página, ni el audio, ni el libro", async () => {
    const { createSignedUrl } = kidsSinListo();
    await expect(pagina(firmarTokenVoz("n1"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect((await audio(firmarTokenVoz("n1"), "R03")).status).toBe(404);
    expect((await libro(firmarTokenVoz("n1"))).status).toBe(404);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("con listo.json abre sin que el padre haya aprobado: la página, el audio entero y el libro", async () => {
    const { createSignedUrl } = kidsConListo();
    const html = await pagina(firmarTokenVoz("n1"));
    expect(html).toContain('id="f-R03"');
    const r = await audio(firmarTokenVoz("n1"), "R03");
    expect(r.status).toBe(302);
    expect(createSignedUrl).toHaveBeenCalledWith("n1/dia_03.ogg", 3600);
    expect((await libro(firmarTokenVoz("n1"))).status).toBe(200);
  });

  it("ya aprobado abre aunque falte listo.json (el impreso tiene los códigos)", async () => {
    base({ narrador: { ...NARRADOR_KIDS, libro_aprobado_at: "2026-10-21T10:00:00Z" }, kids: fila({ fichaMotor: FICHA }), archivos: { "n1/paquete/frases.json": JSON.stringify(FRASES_KIDS) } });
    expect((await audio(firmarTokenVoz("n1"), "R03")).status).toBe(302);
  });

  it("sin el token de voz no abre nada, aunque esté listo.json", async () => {
    const { createSignedUrl } = kidsConListo();
    for (const token of ["", "cualquiera", firmarTokenLibro("n1"), `${firmarTokenVoz("n1")}x`]) {
      await expect(pagina(token)).rejects.toThrow("NEXT_NOT_FOUND");
      expect((await audio(token, "R03")).status).toBe(404);
      expect((await libro(token)).status).toBe(404);
    }
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("modo kids sin fila en kids_v2 sigue la regla de la casa (libro cerrado)", async () => {
    const { admin } = base({ narrador: NARRADOR_KIDS, kids: null, archivos: { "n1/escritor-kids/listo.json": LISTO } });
    expect(await accesoVoz(admin, "n1")).toEqual({ abre: false });
  });
});

describe("«Su voz» de Kids: lo que muestra", () => {
  it("los textos de Kids, no los de la casa", async () => {
    kidsConListo();
    const html = await pagina(firmarTokenVoz("n1"));
    expect(html).toContain(esc(PANEL_KIDS.titulo("Tomi")));
    expect(html).toContain(esc(PANEL_KIDS.etiqueta));
    expect(html).toContain(esc(VOZ_KIDS.bajada));
    expect(html).toContain(">Su voz<");
    expect(html).toContain(">Escuchala<");
    expect(html).toContain(esc("«Me gusta el fútbol porque juego con mis amigos.»"));
    expect(html).toContain('data-producto="kids"');
    expect(html).not.toContain("La historia de");
    expect(html).not.toContain("El libro de una vida");
    expect(html).not.toContain(">Vitácora Familiar<");
    expect(html).not.toContain("Mandar por WhatsApp");
  });

  it("los aprobados van literales", () => {
    expect(VOZ_KIDS.suVoz).toBe("Su voz");
    expect(VOZ_KIDS.escuchala).toBe("Escuchala");
    expect(VOZ_KIDS.titulo("Tomi")).toBe("El libro de Tomi");
    expect(VOZ_KIDS.etiqueta).toBe("Vitácora Kids");
  });

  it("los textos nuevos, sin dos puntos ni «tu hijo» ni «él»", () => {
    for (const t of [VOZ_KIDS.bajada, VOZ_KIDS.sinAudios, VOZ_KIDS.libro, VOZ_KIDS.libroNoEsta, VOZ_KIDS.etiquetaAudio("hola")]) {
      expect(t).not.toContain(":");
      expect(t).not.toMatch(/tu hij|\bél\b/i);
    }
  });
});

describe("«Su voz» de la casa, igual que hoy", () => {
  const FRASES_CASA = {
    version: 1, narrador_id: "n1", pedido_id: "p1", confirmado_at: null,
    capitulos: [{ numero: 1, capitulo: "La infancia", candidatas: [{ id: "c01-01", texto: "a", elegida: true, estado: "cortada", audio_path: "n1/voz/frases/c01_01.mp3", segundos: 12 }] }],
  };

  it("con el libro cerrado abre con sus textos de siempre; listo.json no cambia nada", async () => {
    const { createSignedUrl } = base({ narrador: NARRADOR_CASA, archivos: { "n1/paquete/frases.json": JSON.stringify(FRASES_CASA), "n1/escritor-kids/listo.json": LISTO } });
    const html = await pagina(firmarTokenVoz("n1"));
    expect(html).toContain("La historia de Osvaldo Gómez");
    expect(html).toContain("El libro de una vida");
    expect(html).toContain("Mandar por WhatsApp");
    expect(html).not.toContain('data-producto="kids"');
    expect((await audio(firmarTokenVoz("n1"), "c01-01")).status).toBe(302);
    expect(createSignedUrl).toHaveBeenCalledWith("n1/voz/frases/c01_01.mp3", 3600);
  });

  it("sin cerrar no abre, aunque haya listo.json", async () => {
    base({ narrador: { ...NARRADOR_CASA, libro_aprobado_at: null }, archivos: { "n1/paquete/frases.json": JSON.stringify(FRASES_CASA), "n1/escritor-kids/listo.json": LISTO } });
    await expect(pagina(firmarTokenVoz("n1"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect((await audio(firmarTokenVoz("n1"), "c01-01")).status).toBe(404);
    expect((await libro(firmarTokenVoz("n1"))).status).toBe(404);
  });
});
