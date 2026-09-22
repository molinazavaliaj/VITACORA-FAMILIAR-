import Link from "next/link";

/**
 * Los tres productos de Vitácora: Familiar (la home), de viaje (/viaje, 19/09) y
 * Kids (/kids, 22/09 — «Mi Primer Capítulo»). Pastillas siempre visibles; la
 * activa en blanco. Exportado para /viaje y /kids.
 */
export function SelectorProducto({ actual }: { actual: "familiar" | "viaje" | "kids" }) {
  const pastilla = (activa: boolean) =>
    `inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-3 sm:text-[12px] [font-family:var(--fuente-micro)] ${
      activa ? "bg-white text-[#14140F]" : "text-[#D4D4CE] hover:text-white"
    }`;
  return (
    <nav aria-label="Productos" className="flex shrink-0 items-center rounded-full border border-[#45453C] p-0.5">
      <Link href="/" className={pastilla(actual === "familiar")} aria-current={actual === "familiar" ? "page" : undefined}>Familiar</Link>
      <Link href="/viaje" className={pastilla(actual === "viaje")} aria-current={actual === "viaje" ? "page" : undefined}>Viaje</Link>
      <Link href="/kids" className={pastilla(actual === "kids")} aria-current={actual === "kids" ? "page" : undefined}>Kids</Link>
    </nav>
  );
}
