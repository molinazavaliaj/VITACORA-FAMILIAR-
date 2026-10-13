import type { ReactNode } from "react";

// Una pregunta desplegable (MOTION.md patrón 5) con <details>/<summary>
// nativos: se abre con teclado y lector de pantalla sin una línea de JS, y el
// buscador del navegador encuentra el texto aunque esté cerrada. Con «grupo»
// (el atributo name de <details>) solo queda una abierta a la vez.

export function Acordeon({
  pregunta,
  children,
  abierta = false,
  grupo,
}: {
  pregunta: ReactNode;
  children: ReactNode;
  abierta?: boolean;
  grupo?: string;
}) {
  return (
    <details className="m-acc-item border-b border-[var(--linea-oscura)]" open={abierta} name={grupo}>
      <summary className="flex min-h-11 items-center justify-between gap-6 py-5 text-left text-lg leading-snug text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">
        <span>{pregunta}</span>
        <span aria-hidden className="m-plus shrink-0 text-2xl leading-none text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">
          +
        </span>
      </summary>
      <div className="m-acc">
        <div>
          <div className="pb-6 pr-10 text-base leading-relaxed text-[var(--texto-oscuro-suave)]">{children}</div>
        </div>
      </div>
    </details>
  );
}
