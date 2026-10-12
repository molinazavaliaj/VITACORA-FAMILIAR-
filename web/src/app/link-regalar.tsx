import Link from "next/link";

// Los links a /regalar (Naza, 11/10): textos aprobados, de vos como el resto de
// la landing y de /comprar. El violeta queda para «Comprar el libro»: estos van
// sin color de botón.

/** Debajo de los botones del hero de la landing (fondo oscuro). */
export function LinkRegalarLanding() {
  return (
    <Link
      href="/regalar"
      className="self-start text-[15px] text-[#D4D4CE] underline decoration-[#5F5F55] underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [font-family:var(--fuente-micro)]"
    >
      Regalalo con una tarjeta →
    </Link>
  );
}

/** En el paso 1 de /comprar, cuando la historia es de otra persona: la sorpresa no pide su WhatsApp. */
export function SugerenciaRegalo() {
  return (
    <p className="mt-4 text-[15px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
      ¿Querés que sea una sorpresa?{" "}
      <Link href="/regalar" className="text-[#14140F] underline underline-offset-4">Regalalo con una tarjeta</Link>
      . No hace falta su WhatsApp.
    </p>
  );
}
