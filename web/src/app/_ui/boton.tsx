import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

// El botón del rediseño (MOTION.md patrones 1 y 1b): una pastilla de 44 px de
// alto como mínimo. El primario es el del color de la marca y sube al pasar el
// ratón; el fantasma es solo un borde. Si recibe href es un <Link>; si no, un
// <button>. No trae texto propio: lo que dice viene en children.

type Variante = "primario" | "fantasma";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-7 py-2.5 text-center text-[15px] leading-tight [font-family:var(--fuente-micro)] [touch-action:manipulation] disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

const VARIANTES: Record<Variante, string> = {
  primario: "m-btn bg-[var(--boton)] font-semibold text-[var(--sobre-boton)]",
  fantasma: "m-ghost border border-[var(--borde-oscuro-fuerte)] font-medium text-[var(--texto-oscuro-fuerte)]",
};

export function clasesBoton(variante: Variante = "primario", extra = "") {
  return [BASE, VARIANTES[variante], extra].filter(Boolean).join(" ");
}

type ComoEnlace = Omit<ComponentProps<typeof Link>, "className"> & {
  variante?: Variante;
  className?: string;
  children: ReactNode;
};

type ComoBoton = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  href?: undefined;
  variante?: Variante;
  className?: string;
  children: ReactNode;
};

export function Boton(props: ComoEnlace | ComoBoton) {
  if (props.href !== undefined) {
    const { variante, className, children, ...resto } = props;
    return (
      <Link {...resto} className={clasesBoton(variante, className)}>
        {children}
      </Link>
    );
  }
  const { variante, className, children, type, ...resto } = props;
  return (
    <button {...resto} type={type ?? "button"} className={clasesBoton(variante, className)}>
      {children}
    </button>
  );
}
