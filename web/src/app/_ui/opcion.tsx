import type { InputHTMLAttributes, ReactNode } from "react";

// Una opción elegible (MOTION.md patrón 3): toda la tarjeta es el <label> de
// un input nativo escondido, así se elige con el dedo, con el teclado (flechas
// en un grupo de radios) y con lector de pantalla, sin JS. El borde, el fondo y
// el punto cambian con CSS (:has(:checked)). Sirve de radio o de casilla.

export function Opcion({
  titulo,
  detalle,
  precio,
  etiqueta,
  tipo = "radio",
  className = "",
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  titulo: ReactNode;
  detalle?: ReactNode;
  precio?: ReactNode;
  /** Una Etiqueta arriba del título, p. ej. una pastilla. */
  etiqueta?: ReactNode;
  tipo?: "radio" | "checkbox";
  className?: string;
}) {
  return (
    <label
      className={`m-card flex cursor-pointer items-center gap-4 rounded-[18px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] px-5 py-5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${className}`.trim()}
    >
      <input {...input} type={tipo} className="sr-only" />
      <span
        aria-hidden
        className={`m-dot h-5 w-5 shrink-0 ${tipo === "radio" ? "rounded-full" : "rounded-[6px]"}`}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {etiqueta ? <span className="mb-1">{etiqueta}</span> : null}
        <span className="text-[16px] font-semibold leading-snug text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">
          {titulo}
        </span>
        {detalle ? (
          <span className="text-[15px] leading-relaxed text-[var(--texto-oscuro-suave)]">{detalle}</span>
        ) : null}
      </span>
      {precio ? (
        <span className="shrink-0 text-[16px] font-semibold text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)] tabular-nums">
          {precio}
        </span>
      ) : null}
    </label>
  );
}
