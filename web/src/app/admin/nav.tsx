"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Las cinco pantallas del panel de la empresa. Cliente porque necesita saber en cuál está
// parado (lo lee de la URL) para marcar la pestaña activa: sin esto hay que escribir cada
// dirección a mano, que es lo mismo que no tener panel.
//
// El número va adelante, chico y apagado, como en el mockup (docs/panel-interno.html):
// ordena las pantallas en el orden en que se miran, de la más urgente a la más tranquila.

const SECCIONES = [
  { href: "/admin", numero: "01", nombre: "Estado" },
  { href: "/admin/familias", numero: "02", nombre: "Familias" },
  { href: "/admin/plata", numero: "03", nombre: "Plata" },
  { href: "/admin/gastos", numero: "04", nombre: "Gastos" },
  { href: "/admin/cerebros", numero: "05", nombre: "Cerebros" },
];

export function NavegacionAdmin() {
  const ruta = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-[var(--linea)] px-5 py-2">
      {SECCIONES.map((seccion) => {
        // `/admin` a secas es la primera; las otras son sus hijas.
        const activa = seccion.href === "/admin" ? ruta === "/admin" : ruta.startsWith(seccion.href);
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            aria-current={activa ? "page" : undefined}
            className={`rounded px-3 py-1 text-sm ${
              activa
                ? "bg-[var(--acento)] text-[var(--sobre-acento)]"
                : "text-[var(--texto-suave)] hover:bg-[var(--hueco)]"
            }`}
          >
            <span className="mr-2 text-xs opacity-70 [font-family:var(--fuente-micro)]">{seccion.numero}</span>
            {seccion.nombre}
          </Link>
        );
      })}
    </nav>
  );
}
