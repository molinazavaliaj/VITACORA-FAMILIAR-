import type { ReactNode } from "react";

// La etiqueta en mayúsculas con letter-spacing .18–.2em de la guía. Suelta es
// solo texto en el color de acento («Paso 1 de 3», «Añade un detalle»);
// rellena es una pastilla («Para regalar»).

export function Etiqueta({
  children,
  rellena = false,
  className = "",
}: {
  children: ReactNode;
  rellena?: boolean;
  className?: string;
}) {
  const estilo = rellena
    ? "rounded-full bg-[var(--acento-oscuro)] px-2.5 py-1 text-[var(--sobre-boton)]"
    : "text-[var(--acento-oscuro)]";
  return (
    <span
      className={`inline-block text-[11px] font-medium uppercase leading-none tracking-[0.2em] [font-family:var(--fuente-micro)] ${estilo} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
