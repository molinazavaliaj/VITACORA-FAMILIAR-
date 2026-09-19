import Link from "next/link";

/**
 * Los dos productos de Vitácora (19/09): Familiar (la home) y de viaje (/viaje).
 * Dos pastillas, siempre visibles; la activa en blanco. Exportado para /viaje.
 */
export function SelectorProducto({ actual }: { actual: "familiar" | "viaje" }) {
  const pastilla = (activa: boolean) =>
    `inline-flex h-8 items-center rounded-full px-3 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [font-family:var(--fuente-micro)] ${
      activa ? "bg-white text-[#14140F]" : "text-[#D4D4CE] hover:text-white"
    }`;
  return (
    <nav aria-label="Productos" className="flex items-center rounded-full border border-[#45453C] p-0.5">
      <Link href="/" className={pastilla(actual === "familiar")} aria-current={actual === "familiar" ? "page" : undefined}>Familiar</Link>
      <Link href="/viaje" className={pastilla(actual === "viaje")} aria-current={actual === "viaje" ? "page" : undefined}>De viaje</Link>
    </nav>
  );
}
