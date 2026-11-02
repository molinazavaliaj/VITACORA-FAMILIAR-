"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GRUPOS, Icono, SECCIONES } from "./secciones";

// Las pantallas del panel de la empresa, en el lomo (panel.css, .adm-lomo). Cliente porque
// necesita saber en cuál está parado (lo lee de la URL) para marcar la pestaña activa: sin
// esto hay que escribir cada dirección a mano, que es lo mismo que no tener panel.
//
// Es UNA sola lista para el teléfono y la computadora: en el teléfono es una franja que se
// desliza de costado; en la computadora, la barra lateral con los grupos y una pista de qué
// contesta cada pantalla. Una sola lista quiere decir un solo `aria-current`.

/** `sinVer`: los avisos que nadie marcó como vistos (lo cuenta el layout); null si no se pudo saber. */
export function NavegacionAdmin({ sinVer = null }: { sinVer?: number | null } = {}) {
  const ruta = usePathname();

  return (
    <nav className="adm-nav" aria-label="Pantallas del panel">
      {GRUPOS.map((grupo) => (
        <div key={grupo} className="contents">
          <p className="adm-grupo" aria-hidden>
            {grupo}
          </p>
          {SECCIONES.filter((s) => s.grupo === grupo).map((seccion) => {
            // `/admin` a secas es la primera; las otras son sus hijas.
            const activa = seccion.href === "/admin" ? ruta === "/admin" : ruta.startsWith(seccion.href);
            return (
              <Link key={seccion.href} href={seccion.href} aria-current={activa ? "page" : undefined} className="adm-enlace">
                <Icono nombre={seccion.icono} />
                <span className="min-w-0">
                  <span className="block leading-tight">{seccion.nombre}</span>
                  <span className="adm-enlace-pista">{seccion.pista}</span>
                </span>
                {seccion.href === "/admin/notificaciones" && sinVer ? (
                  <span aria-label={`${sinVer} sin ver`} className="adm-insignia">
                    {sinVer > 99 ? "99+" : sinVer}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
      {/* La salida, al final y separada de las pantallas: sin esto el panel
          queda pegajoso (hallazgo de Naza, 2026-09-21: con la sesión abierta no
          había forma de desloguearse desde acá; el único Salir del sitio estaba
          en /tablero). Es un `<a>` a un Route Handler GET, igual que en el panel
          del cliente, y no un `<Link>`: así la navegación de Next no lo
          prefetchea ni lo trata como una pantalla más. */}
      <a href="/api/auth/salir" className="adm-enlace adm-salir">
        <Icono nombre="salir" />
        <span>Salir</span>
      </a>
    </nav>
  );
}
