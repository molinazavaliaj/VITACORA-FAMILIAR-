import type { InputHTMLAttributes, ReactNode } from "react";

// Una pastilla elegible (MOTION.md patrón 3, la variante chica de Opcion: «Mi
// padre», «Él / Ella», «Navidad · 24 dic»). Igual que Opcion, es el <label> de
// un input nativo escondido: se elige con el dedo, con el teclado y con lector
// de pantalla, y el color cambia con CSS (.m-chip:has(:checked)), sin JS.

export function Pastilla({
  children,
  tipo = "radio",
  className = "",
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "children"> & {
  children: ReactNode;
  tipo?: "radio" | "checkbox";
  className?: string;
}) {
  return (
    <label
      className={`m-card m-chip inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-5 text-[15px] text-[var(--texto-oscuro)] [font-family:var(--fuente-micro)] [touch-action:manipulation] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${className}`.trim()}
    >
      <input {...input} type={tipo} className="sr-only" />
      {children}
    </label>
  );
}
