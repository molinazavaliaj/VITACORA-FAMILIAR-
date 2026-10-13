import type { ReactNode } from "react";

// Las piezas de los esqueletos de carga del panel (loading.tsx de /tablero y
// de una historia, RENDIMIENTO.md §3.1). Cajas grises con los mismos tokens que
// el panel (--hueco, --linea, --fondo), así el esqueleto sigue el tema claro u
// oscuro del cascarón sin hacer nada. Sin texto: solo la forma de lo que viene.
// El latido es de opacidad y se apaga si la persona pidió menos movimiento.

/** Una barra gris: un título, una línea de texto, un botón. */
export function Hueso({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-md bg-[var(--hueco)] motion-safe:animate-pulse ${className}`} />;
}

/** El contenedor del esqueleto: avisa a los lectores de pantalla que está cargando. */
export function Cargando({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div aria-busy="true" className={className}>
      <p role="status" className="sr-only">
        Cargando…
      </p>
      {children}
    </div>
  );
}

/** Una tarjeta vacía, con el mismo borde que la Tarjeta del panel (ui.tsx). */
export function TarjetaHueca({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-[var(--linea)] bg-[var(--fondo)] p-6">{children}</div>;
}
