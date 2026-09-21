import { describe, it, expect, vi, beforeEach } from "vitest";

// T3.7 — entrar al panel desde /admin tiene que volver a /admin.
//
// Hallazgo de Naza probando producción (2026-09-21): pega /admin en un navegador nuevo,
// le pide mail y código, y al entrar lo deja en el carrito. La cadena era: (1) el que
// manda a /entrar no dice a dónde volver; (2) /entrar, sin vuelta, cae en su destino de
// siempre (/tablero); (3) el tablero de un admin que nunca compró —sin familia ni
// historias— manda a /comprar. Estas pruebas sujetan los dos extremos de la cadena: el
// que manda a entrar (el proxy de sesión y el layout del panel) y el que decide la
// vuelta (lib/destino, el formulario de /entrar y el callback del enlace mágico).

const { estado } = vi.hoisted(() => ({
  estado: {
    usuario: null as { id: string; email?: string } | null,
    refresco: [] as { name: string; value: string }[],
    intercambio: { data: null, error: null } as { data: unknown; error: unknown },
    familia: { familia: null, error: null } as { familia: unknown; error: unknown },
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _clave: string,
    opciones: { cookies: { setAll: (c: { name: string; value: string }[]) => void } },
  ) => {
    // El proxy refresca el token por acá; el doble avisa con el mismo camino.
    if (estado.refresco.length) opciones.cookies.setAll(estado.refresco);
    return { auth: { getUser: async () => ({ data: { user: estado.usuario } }) } };
  },
}));

vi.mock("@/lib/supabase/sesion", () => ({
  crearClienteSesion: async () => ({
    auth: {
      getUser: async () => ({ data: { user: estado.usuario } }),
      exchangeCodeForSession: async () => estado.intercambio,
    },
  }),
}));

vi.mock("@/lib/supabase/servidor", () => ({ crearClienteServidor: () => ({}) }));
vi.mock("@/lib/familia", () => ({ familiaDelUsuario: async () => estado.familia }));

// `redirect` de un componente de servidor corta la ejecución tirando: acá se atrapa el
// destino en el mensaje, que es la única forma de leerlo sin un navegador.
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`REDIRECT ${destino}`);
  },
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("next/font/google", () => ({
  Playfair_Display: () => ({ variable: "--fuente-titulo" }),
  Archivo: () => ({ variable: "--fuente-micro" }),
  Source_Serif_4: () => ({ variable: "--fuente-cuerpo" }),
}));

import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import { destinoSeguro, pideSesion, rutaDeEntrada, rutaDeVuelta } from "../src/lib/destino";
import { GET as callback } from "../src/app/api/auth/callback/route";
import LayoutAdmin from "../src/app/admin/layout";

const volverDe = (respuesta: Response) =>
  new URL(respuesta.headers.get("location") ?? "/sin-location", "http://localhost");

const sinSesion = () => {
  estado.usuario = null;
  estado.refresco = [];
};

beforeEach(sinSesion);

describe("qué rutas piden sesión", () => {
  it("son el panel del cliente y el de la empresa, con todo lo que cuelga", () => {
    for (const ruta of ["/admin", "/admin/plata", "/admin/", "/tablero", "/tablero/n1/libro"]) {
      expect(pideSesion(ruta), ruta).toBe(true);
    }
  });

  it("el resto del sitio se mira sin sesión (y una ruta parecida no se confunde)", () => {
    for (const ruta of ["/", "/comprar", "/entrar", "/libro/tok", "/tableros", "/admincito", "/administracion"]) {
      expect(pideSesion(ruta), ruta).toBe(false);
    }
  });
});

describe("sin sesión, el proxy manda a /entrar con la vuelta puesta", () => {
  it("desde /admin, que es el caso del hallazgo", async () => {
    const respuesta = await middleware(new NextRequest("http://localhost/admin"));

    expect(respuesta.status).toBe(307);
    const destino = volverDe(respuesta);
    expect(destino.pathname).toBe("/entrar");
    expect(destino.searchParams.get("volver")).toBe("/admin");
  });

  it("desde adentro del panel, y desde el tablero con su query", async () => {
    const panel = await middleware(new NextRequest("http://localhost/admin/plata"));
    expect(volverDe(panel).searchParams.get("volver")).toBe("/admin/plata");

    const tablero = await middleware(new NextRequest("http://localhost/tablero/n1/libro?paso=3"));
    expect(volverDe(tablero).searchParams.get("volver")).toBe("/tablero/n1/libro?paso=3");
  });

  it("con sesión no se mete en el camino", async () => {
    estado.usuario = { id: "u1", email: "naza@ejemplo.com" };

    const respuesta = await middleware(new NextRequest("http://localhost/admin"));

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("location")).toBeNull();
  });

  it("el refresh de la sesión sobrevive al redirect", async () => {
    estado.refresco = [{ name: "sb-refresco", value: "1" }];

    const respuesta = await middleware(new NextRequest("http://localhost/admin"));

    expect(respuesta.headers.getSetCookie().join(" ")).toContain("sb-refresco=1");
  });

  it("lo que se compra sin cuenta no se toca", async () => {
    for (const ruta of ["http://localhost/comprar", "http://localhost/entrar"]) {
      const respuesta = await middleware(new NextRequest(ruta));
      expect(respuesta.status, ruta).toBe(200);
      expect(respuesta.headers.get("location"), ruta).toBeNull();
    }
  });
});

describe("la vuelta que se pide", () => {
  it("solo acepta rutas propias, nunca otro sitio", () => {
    expect(rutaDeVuelta("/admin")).toBe("/admin");
    expect(rutaDeVuelta("/tablero/n1?paso=3")).toBe("/tablero/n1?paso=3");

    for (const ajena of ["https://malo.example/admin", "//malo.example", "javascript:alert(1)", "", null]) {
      expect(rutaDeVuelta(ajena), String(ajena)).toBeNull();
    }
  });

  it("no deja volver a la pantalla de entrar", () => {
    expect(rutaDeVuelta("/entrar")).toBeNull();
    expect(rutaDeVuelta("/entrar?volver=/admin")).toBeNull();
  });

  it("sin vuelta usable se cae en el destino de siempre, que el que llama elige", () => {
    expect(destinoSeguro("/admin")).toBe("/admin");
    expect(destinoSeguro(null)).toBe("/tablero");
    expect(destinoSeguro("https://malo.example")).toBe("/tablero");
    expect(destinoSeguro(null, "/comprar")).toBe("/comprar");
    expect(destinoSeguro("https://malo.example", "/comprar")).toBe("/comprar");
  });

  it("la vuelta viaja escapada en la dirección de /entrar", () => {
    expect(rutaDeEntrada("/admin")).toBe("/entrar?volver=%2Fadmin");
    expect(rutaDeEntrada("/tablero/n1?paso=3")).toBe("/entrar?volver=%2Ftablero%2Fn1%3Fpaso%3D3");
  });
});

describe("el panel de la empresa no deja al socio en la calle", () => {
  it("sin sesión, el layout vuelve a /admin (no a /tablero)", async () => {
    sinSesion();

    await expect(LayoutAdmin({ children: null } as never)).rejects.toThrow(
      "REDIRECT /entrar?volver=%2Fadmin",
    );
  });
});

describe("el callback del enlace mágico respeta la vuelta", () => {
  const conUsuario = () => {
    estado.intercambio = { data: { user: { id: "u1", email: "naza@ejemplo.com" } }, error: null };
  };

  it("vuelve al panel aunque el que entró nunca haya comprado", async () => {
    conUsuario();
    estado.familia = { familia: null, error: null };

    const respuesta = await callback(
      new NextRequest("http://localhost/api/auth/callback?code=abc&volver=%2Fadmin"),
    );

    expect(respuesta.status).toBe(307);
    expect(volverDe(respuesta).pathname).toBe("/admin");
  });

  it("sin vuelta, el que nunca compró sigue yendo al carrito", async () => {
    conUsuario();
    estado.familia = { familia: null, error: null };

    const respuesta = await callback(new NextRequest("http://localhost/api/auth/callback?code=abc"));

    expect(volverDe(respuesta).pathname).toBe("/comprar");
  });

  it("con familia, sin vuelta, va a su tablero", async () => {
    conUsuario();
    estado.familia = { familia: { id: "f1", region: "ES" }, error: null };

    const respuesta = await callback(new NextRequest("http://localhost/api/auth/callback?code=abc"));

    expect(volverDe(respuesta).pathname).toBe("/tablero");
  });

  it("una vuelta de otro sitio no saca a nadie del sitio", async () => {
    conUsuario();
    estado.familia = { familia: null, error: null };

    const respuesta = await callback(
      new NextRequest("http://localhost/api/auth/callback?code=abc&volver=https%3A%2F%2Fmalo.example"),
    );

    expect(volverDe(respuesta).host).toBe("localhost");
    expect(volverDe(respuesta).pathname).toBe("/comprar");
  });

  it("si el código no sirve, se vuelve a pedir uno (como siempre)", async () => {
    estado.intercambio = { data: null, error: { message: "código vencido" } };
    estado.familia = { familia: null, error: null };

    const respuesta = await callback(
      new NextRequest("http://localhost/api/auth/callback?code=vencido&volver=%2Fadmin"),
    );

    expect(volverDe(respuesta).pathname).toBe("/entrar");
    expect(volverDe(respuesta).searchParams.get("error")).toBe("auth");
  });
});
