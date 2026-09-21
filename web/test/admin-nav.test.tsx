import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Las cinco pantallas se tienen que poder recorrer sin escribir direcciones a mano, y la
// pestaña activa tiene que ser la de la pantalla donde estás (si no, el panel miente).

const { estado } = vi.hoisted(() => ({ estado: { ruta: "/admin" } }));
vi.mock("next/navigation", () => ({ usePathname: () => estado.ruta }));

import { NavegacionAdmin } from "../src/app/admin/nav";

const render = () => renderToStaticMarkup(<NavegacionAdmin />);

describe("la navegación del panel", () => {
  it("lleva a las cinco pantallas", () => {
    estado.ruta = "/admin";
    const html = render();
    for (const href of ["/admin", "/admin/familias", "/admin/plata", "/admin/gastos", "/admin/cerebros"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain("Cerebros");
  });

  it("marca como activa la pantalla donde estás, y sólo esa", () => {
    estado.ruta = "/admin/plata";
    const html = render();
    const activas = html.split('aria-current="page"').length - 1;
    expect(activas).toBe(1);
    // La activa es la de Plata: el nombre tiene que estar ADENTRO de ese enlace (entre su
    // aria-current y su cierre), no en cualquier lado del HTML.
    const desdeActiva = html.slice(html.indexOf('aria-current="page"'));
    expect(desdeActiva.slice(0, desdeActiva.indexOf("</a>"))).toContain("Plata");
  });

  it("con `/admin` a secas no marca ninguna hija como activa", () => {
    estado.ruta = "/admin";
    expect(render().split('aria-current="page"').length - 1).toBe(1);
    estado.ruta = "/admin/gastos";
    expect(render().split('aria-current="page"').length - 1).toBe(1);
  });

  it("tiene salida: el botón Salir lleva al único camino de salida del sitio", () => {
    estado.ruta = "/admin/plata";
    const html = render();
    expect(html).toContain('href="/api/auth/salir"');
    // El texto va adentro del propio enlace: un ícono suelto no se entiende.
    const desdeElEnlace = html.slice(html.indexOf('href="/api/auth/salir"'));
    expect(desdeElEnlace.slice(0, desdeElEnlace.indexOf("</a>"))).toContain("Salir");
  });

  it("la salida no es una pestaña más: no se marca como la pantalla donde estás", () => {
    // Si el enlace de salir contara como sección, en cualquier pantalla del panel
    // habría dos `aria-current="page"` y el panel mentiría sobre dónde estás.
    for (const ruta of ["/admin", "/admin/familias", "/admin/plata", "/admin/gastos", "/admin/cerebros"]) {
      estado.ruta = ruta;
      expect(render().split('aria-current="page"').length - 1).toBe(1);
    }
  });
});
