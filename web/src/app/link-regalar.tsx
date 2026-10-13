import Link from "next/link";
import type { TratoComprador } from "@/lib/regalo-textos";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";

// Los links a /regalar (Naza, 11/10): textos aprobados, de vos como el resto de
// la landing y de /comprar. El violeta queda para «Comprar el libro»: estos van
// sin color de botón.

// Con idioma (rediseño 2026-10), el link va a /regalar en ese idioma y el
// texto sale de acá; sin idioma, como siempre, por trato.
// ca: PENDIENTE REVISIÓN NATIVA
const REGALAR_POR_IDIOMA: Record<IdiomaWeb, string> = {
  es: "Regálalo con una tarjeta →",
  ca: "Regala-ho amb una targeta →",
  ar: "Regalalo con una tarjeta →",
};

/** Debajo de los botones del hero de la landing (fondo oscuro). España lee de tú (13/10). */
export function LinkRegalarLanding({ trato = "vos", idioma, className }: { trato?: TratoComprador; idioma?: IdiomaWeb; className?: string }) {
  const texto = idioma ? REGALAR_POR_IDIOMA[idioma] : trato === "tu" ? REGALAR_POR_IDIOMA.es : REGALAR_POR_IDIOMA.ar;
  return (
    <Link
      href={idioma ? ruta(idioma, "/regalar") : "/regalar"}
      className={
        className ??
        "self-start text-[15px] text-[#D4D4CE] underline decoration-[#5F5F55] underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white [font-family:var(--fuente-micro)]"
      }
    >
      {texto}
    </Link>
  );
}

/** En el paso 1 de /comprar, cuando la historia es de otra persona: la sorpresa no pide su WhatsApp. */
export function SugerenciaRegalo({ trato = "vos" }: { trato?: TratoComprador }) {
  const tu = trato === "tu";
  return (
    <p className="mt-4 text-[15px] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">
      {tu ? "¿Quieres que sea una sorpresa?" : "¿Querés que sea una sorpresa?"}{" "}
      <Link href="/regalar" className="text-[#14140F] underline underline-offset-4">{tu ? "Regálalo con una tarjeta" : "Regalalo con una tarjeta"}</Link>
      . No hace falta su WhatsApp.
    </p>
  );
}
