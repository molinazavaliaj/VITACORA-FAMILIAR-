import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// «Su voz» de la casa con el diseño de la maqueta SuVoz (18/10): la foto a
// pantalla entera con «Toca y escucha su voz», los capítulos en acordeón con
// sus audios, el carrusel de sus frases de siempre, «Compartir con la familia»
// y el cierre a la portada. Los datos y los permisos son los de siempre; el
// idioma sale de quien la abre (cookie o país), en es, ar y ca.

const cabeceras = { pais: "", cookie: undefined as string | undefined };
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(cabeceras.pais ? { "x-vercel-ip-country": cabeceras.pais } : {}),
  cookies: async () => ({ get: (nombre: string) => (nombre === "idioma" && cabeceras.cookie ? { value: cabeceras.cookie } : undefined) }),
}));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: vi.fn() }));

import { crearClienteServidor } from "@/lib/supabase/servidor";
import { firmarTokenLibro, firmarTokenVoz } from "../src/lib/token-libro";
import { GET as GET_PORTADA } from "../src/app/api/voz/[token]/portada/route";
import PaginaVoz from "../src/app/voz/[token]/page";
import { TEXTOS_VOZ } from "../src/app/_textos/voz";
import { COOKIE_IDIOMA } from "../src/lib/idioma-web";

const esc = (s: string) => renderToStaticMarkup(<>{s}</>);

const frase = (id: string, texto: string, origen: "cita" | "sus-frases", extra: Record<string, unknown> = {}) => ({
  id, texto, origen, elegida: true, estado: "cortada", audio_path: `n1/voz/frases/${id}.mp3`, segundos: 30, ...extra,
});
const FRASES = {
  version: 1, narrador_id: "n1", pedido_id: "p1", confirmado_at: null,
  capitulos: [
    { numero: 1, capitulo: "La infancia", candidatas: [frase("c01-01", "Éramos cuatro en dos habitaciones.", "cita"), frase("c01-02", "En casa no sobraba nada, pero nunca faltó la risa.", "sus-frases")] },
    { numero: 2, capitulo: "Las raíces", candidatas: [frase("c02-01", "Lo que se hace con las manos no se olvida.", "sus-frases"), frase("c02-02", "Esta no la eligieron.", "cita", { elegida: false })] },
    { numero: 3, capitulo: "La juventud", candidatas: [frase("c03-01", "Todavía sin cortar.", "cita", { estado: "pendiente", audio_path: null })] },
  ],
};

const NARRADOR = { nombre: "Osvaldo Gómez", como_le_dicen: "Osvaldo", libro_aprobado_at: "2026-09-20T00:00:00Z", contexto: null, edicion: { portadaFotoId: "foto-1" } };

function base(o: { narrador?: unknown; archivos?: Record<string, string>; foto?: unknown } = {}) {
  const archivos = o.archivos ?? { "n1/paquete/frases.json": JSON.stringify(FRASES), "n1/paquete/libro.html": "<html></html>" };
  const createSignedUrl = vi.fn(async (ruta: string) => ({ data: { signedUrl: `https://firmada.test/${ruta}` }, error: null }));
  const from = (tabla: string) => {
    const data = tabla === "narradores" ? (o.narrador ?? NARRADOR) : tabla === "fotos" ? (o.foto === undefined ? { storage_path: "n1/fotos/portada.jpg" } : o.foto) : null;
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
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ from, storage });
  return { createSignedUrl };
}

const pagina = async (token = firmarTokenVoz("n1")) => renderToStaticMarkup(await PaginaVoz({ params: Promise.resolve({ token }) } as never));
const portada = (token: string) => GET_PORTADA({} as never, { params: Promise.resolve({ token }) });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "secreto-de-prueba";
  cabeceras.pais = "";
  cabeceras.cookie = undefined;
});

describe("«Su voz» de la casa: lo que muestra", () => {
  it("la foto con el botón, su nombre, los capítulos con sus audios y las anclas de cada frase", async () => {
    base();
    const token = firmarTokenVoz("n1");
    const html = await pagina(token);
    expect(html).toContain(`/api/voz/${token}/portada`);
    expect(html).toContain('aria-label="Escuchar a Osvaldo"');
    expect(html).toContain(esc(TEXTOS_VOZ.ar.tocaYEscucha));
    expect(html).toContain(">Osvaldo Gómez</h1>");
    expect(html).toContain(esc(TEXTOS_VOZ.ar.datos(3, 2)));
    expect(html).toContain("La infancia");
    expect(html).toContain("Las raíces");
    expect(html).toContain('id="f-c01-01"');
    expect(html).toContain('id="f-c02-01"');
    expect(html).toContain('id="frases"');
    expect(html).toContain('id="libro"');
    expect(html).toContain(`/api/voz/${token}/libro`);
  });

  it("solo las elegidas con audio; un capítulo sin ninguna no aparece", async () => {
    base();
    const html = await pagina();
    expect(html).not.toContain("Esta no la eligieron");
    expect(html).not.toContain("Todavía sin cortar");
    expect(html).not.toContain("La juventud");
  });

  it("el carrusel lleva sus frases de siempre (las de «sus frases»), no las citas", async () => {
    base();
    const html = await pagina();
    const carrusel = html.slice(html.indexOf(esc(TEXTOS_VOZ.ar.frasesDeSiempre)));
    expect(carrusel).toContain(esc("«En casa no sobraba nada, pero nunca faltó la risa.»"));
    expect(carrusel).toContain(esc("«Lo que se hace con las manos no se olvida.»"));
    expect(carrusel.slice(0, carrusel.indexOf('id="libro"'))).not.toContain("Éramos cuatro");
  });

  it("sin frases de «sus frases» no hay carrusel; sin libro online no hay «Leer su libro»", async () => {
    const soloCitas = { ...FRASES, capitulos: [FRASES.capitulos[0]].map((c) => ({ ...c, candidatas: [c.candidatas[0]] })) };
    base({ archivos: { "n1/paquete/frases.json": JSON.stringify(soloCitas) } });
    const html = await pagina();
    expect(html).not.toContain(esc(TEXTOS_VOZ.ar.frasesDeSiempre));
    expect(html).not.toContain(esc(TEXTOS_VOZ.ar.leer));
    expect(html).toContain(esc(TEXTOS_VOZ.ar.libroNoEsta));
  });

  it("sin ningún audio todavía, la foto lleva su nombre sin botón y lo dice", async () => {
    base({ archivos: {} });
    const html = await pagina();
    expect(html).not.toContain("Escuchar a Osvaldo");
    expect(html).toContain(esc(TEXTOS_VOZ.ar.sinFrases));
  });

  it("para la familia y el cierre a la portada", async () => {
    base();
    const html = await pagina();
    expect(html).toContain(esc(TEXTOS_VOZ.ar.familiaTexto));
    expect(html).toContain(esc(TEXTOS_VOZ.ar.compartir));
    expect(html).toContain(`href="/ar">${esc(TEXTOS_VOZ.ar.cierreBoton)}`);
  });
});

describe("«Su voz» de la casa: el idioma de quien la abre", () => {
  it("desde España, de tú; desde Argentina, de vos", async () => {
    base();
    cabeceras.pais = "ES";
    let html = await pagina();
    expect(html).toContain("Toca y escucha su voz");
    expect(html).toContain("Puedes compartirla");
    expect(html).toContain('href="/">');
    expect(html).toContain('lang="es-ES"');
    cabeceras.pais = "AR";
    html = await pagina();
    expect(html).toContain("Tocá y escuchá su voz");
    expect(html).toContain("Podés compartirla");
    expect(html).toContain('lang="es-AR"');
  });

  it("con la cookie del catalán, en catalán", async () => {
    base();
    cabeceras.pais = "AR";
    cabeceras.cookie = "ca";
    const html = await pagina();
    expect(COOKIE_IDIOMA).toBe("idioma");
    expect(html).toContain("Toca i escolta la seva veu");
    expect(html).toContain('href="/ca">');
    expect(html).toContain('lang="ca-ES"');
  });

  it("los textos, sin dos puntos, sin «él» ni «padre», y la misma forma en los tres idiomas", () => {
    for (const idioma of ["es", "ar", "ca"] as const) {
      const T = TEXTOS_VOZ[idioma];
      expect(Object.keys(T).sort()).toEqual(Object.keys(TEXTOS_VOZ.es).sort());
      const textos = Object.values(T).map((v) => (typeof v === "function" ? (v as (...a: unknown[]) => string)("Osvaldo", 3) : v));
      for (const t of textos) {
        expect(t).not.toMatch(/:/);
        expect(t).not.toMatch(/\bél\b|\bpadre\b|\bpapá\b|\bpare\b/i);
        expect(t).not.toMatch(/\. Y /);
      }
    }
  });
});

describe("GET /api/voz/[token]/portada", () => {
  it("con el libro cerrado, redirige a la foto que eligieron como portada", async () => {
    const { createSignedUrl } = base();
    const r = await portada(firmarTokenVoz("n1"));
    expect(r.status).toBe(302);
    expect(createSignedUrl).toHaveBeenCalledWith("n1/fotos/portada.jpg", 3600);
  });

  it("sin cerrar, sin portada elegida, o con el token de la muestra, 404", async () => {
    base({ narrador: { ...NARRADOR, libro_aprobado_at: null } });
    expect((await portada(firmarTokenVoz("n1"))).status).toBe(404);
    base({ narrador: { ...NARRADOR, edicion: null } });
    expect((await portada(firmarTokenVoz("n1"))).status).toBe(404);
    base({ foto: null });
    expect((await portada(firmarTokenVoz("n1"))).status).toBe(404);
    base();
    expect((await portada(firmarTokenLibro("n1"))).status).toBe(404);
    expect((await portada("cualquiera")).status).toBe(404);
  });
});
