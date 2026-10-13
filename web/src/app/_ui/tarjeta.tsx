import type { HTMLAttributes, ReactNode } from "react";

// La tarjeta del rediseño: superficie apenas más clara que el fondo, borde
// fino y radio de 20 px (la guía pide 18–22). Sin movimiento propio: si es
// pulsable, se usa Opcion o se le suma m-card.

export function Tarjeta({
  children,
  className = "",
  ...resto
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...resto}
      className={`rounded-[20px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
