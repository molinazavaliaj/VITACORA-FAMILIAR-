import Link from "next/link";

// El camino del libro, visible en cada pantalla de la etapa final para que la
// familia siempre sepa dónde está parada y qué le falta. Los números son 1-4.
const PASOS = ["Su historia", "Los nombres", "Vista previa y pago", "Su libro"] as const;

export type PasoActual = 1 | 2 | 3 | 4;

export function PasosDelLibro({ actual }: { actual: PasoActual }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {PASOS.map((nombre, indice) => {
        const numero = (indice + 1) as PasoActual;
        const hecho = numero < actual;
        const esActual = numero === actual;
        return (
          <li key={nombre} className="flex items-center gap-x-2">
            {indice > 0 ? <span className="text-zinc-300">—</span> : null}
            <span
              className={
                esActual
                  ? "font-semibold text-zinc-900"
                  : hecho
                    ? "text-zinc-500"
                    : "text-zinc-400"
              }
            >
              {hecho ? "✓ " : `${numero}. `}
              {nombre}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function VolverAlTablero() {
  return (
    <Link
      href="/tablero"
      className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
    >
      ← Volver al tablero
    </Link>
  );
}
