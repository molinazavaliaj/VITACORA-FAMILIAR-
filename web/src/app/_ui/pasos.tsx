import type { ReactNode } from "react";

// El indicador de pasos del checkout (MOTION.md patrones 2 y 2b): los
// números con su nombre y, debajo, una barra que se llena con scaleX (nunca
// width). Recibe los nombres de los pasos y cuál es el actual (desde 1).

export function Pasos({
  pasos,
  actual,
  etiqueta,
}: {
  pasos: string[];
  actual: number;
  /** Nombre accesible de la lista, p. ej. «Pasos de la compra». */
  etiqueta: string;
}) {
  const total = Math.max(pasos.length, 1);
  const paso = Math.min(Math.max(actual, 1), total);
  return (
    <nav aria-label={etiqueta} className="[font-family:var(--fuente-micro)]">
      <ol className="flex items-center justify-between gap-3">
        {pasos.map((nombre, i) => {
          const numero = i + 1;
          const hecho = numero < paso;
          const esActual = numero === paso;
          return (
            <li
              key={`${numero}-${nombre}`}
              aria-current={esActual ? "step" : undefined}
              className={`flex min-w-0 items-center gap-3 text-[15px] ${esActual ? "flex-1" : "sm:flex-1"}`}
            >
              <span
                aria-hidden
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] transition-colors duration-[var(--d-base)] ${
                  esActual || hecho
                    ? "border-[var(--boton)] bg-[var(--boton)] text-[var(--sobre-boton)]"
                    : "border-[var(--borde-oscuro-fuerte)] text-[var(--texto-oscuro-menor)]"
                }`}
              >
                {numero}
              </span>
              <span
                // En el móvil solo se lee el nombre del paso actual (maqueta CheckoutMovil); los otros quedan para lectores de pantalla.
                className={`truncate ${esActual ? "text-[var(--texto-oscuro-fuerte)]" : "text-[var(--texto-oscuro-menor)] max-sm:sr-only"}`}
              >
                {nombre}
              </span>
            </li>
          );
        })}
      </ol>
      <div aria-hidden className="mt-4 h-[3px] overflow-hidden rounded-full bg-[var(--borde-oscuro)]">
        <div
          className="m-progreso h-full w-full rounded-full bg-[var(--boton)]"
          style={{ transform: `scaleX(${paso / total})` }}
        />
      </div>
    </nav>
  );
}

// El contenido de un paso: entra desde la derecha (checkout) o desde abajo
// (panel y hojas). Para que la entrada se repita al cambiar de paso, el que lo
// usa le pone key={paso}. `animar={false}` para el primer pintado de la página:
// lo que llega del servidor no entra animado (empezaría transparente y
// retrasaría el LCP, RENDIMIENTO.md §4); se anima recién al cambiar de paso.
export function ContenidoPaso({
  children,
  desde = "derecha",
  animar = true,
  className = "",
}: {
  children: ReactNode;
  desde?: "derecha" | "abajo";
  animar?: boolean;
  className?: string;
}) {
  const movimiento = animar ? `m-step ${desde === "abajo" ? "m-step-abajo" : ""}` : "";
  return <div className={`${movimiento} ${className}`.replace(/\s+/g, " ").trim()}>{children}</div>;
}
