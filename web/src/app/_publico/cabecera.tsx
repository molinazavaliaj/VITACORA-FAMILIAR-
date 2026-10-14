import Link from "next/link";
import { Toroide } from "../marca";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { EnlaceIdioma, SugerenciaCatalan } from "./idioma-cliente";

// La cabecera pública del rediseño 2026-10 (maquetas Main/Movil, Ejemplo,
// Checkout): logo + VITÁCORA, las solapas Familiar · De viaje, «Entrar»,
// «Comprar el libro» y el selector ES · CA. La comparten la portada, /ejemplo
// y el checkout. Kids no aparece (DECISIONES D4).
//
// Es de servidor: lo único que corre en el navegador es el selector de idioma
// (deja la cookie antes de navegar) y la sugerencia de catalán.

export type Producto = "familiar" | "viaje";

export type PropsCabecera = {
  idioma: IdiomaWeb;
  /** La pantalla actual sin prefijo de idioma ("/", "/ejemplo", "/comprar"), para el selector. */
  camino: string;
  /** Qué solapa va marcada y adónde lleva «Comprar». Por defecto, Familiar. */
  producto?: Producto;
  /** Encima del hero de la portada: sin fondo ni línea, flotando sobre el vídeo. */
  sobreHero?: boolean;
  /** El checkout no repite «Comprar el libro» ni las solapas: ya está comprando. */
  compacta?: boolean;
};

export function Cabecera({ idioma, camino, producto = "familiar", sobreHero = false, compacta = false }: PropsCabecera) {
  const t = TEXTOS_PUBLICO[idioma];
  const comprar = ruta(idioma, producto === "viaje" ? "/comprar/viaje" : "/comprar");
  return (
    <header
      className={`relative z-20 text-[var(--texto-oscuro)] ${sobreHero ? "" : "border-b border-[var(--linea-oscura)] bg-[var(--fondo-oscuro)]"}`}
    >
      <div className="mx-auto flex w-full max-w-[1104px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-5 sm:px-6 md:py-7">
        <Link prefetch={false}
          href={ruta(idioma, "/")}
          aria-label={t.inicio}
          className="flex min-h-11 items-center gap-3 text-[var(--texto-oscuro)] hover:text-[var(--texto-oscuro-fuerte)]"
        >
          <Toroide className="h-7 w-auto" />
          <span className="text-[13px] font-medium tracking-[0.2em] [font-family:var(--fuente-micro)]">VITÁCORA</span>
        </Link>

        <div className="flex items-center gap-4 text-[14px] [font-family:var(--fuente-micro)] md:gap-6">
          {compacta ? null : (
            <div className="hidden md:block">
              <Solapas idioma={idioma} producto={producto} />
            </div>
          )}
          <SelectorIdioma idioma={idioma} camino={camino} etiqueta={t.idioma} />
          <Link prefetch={false}
            href="/entrar"
            className="flex min-h-11 items-center text-[var(--texto-oscuro)] underline decoration-[var(--borde-oscuro-fuerte)] underline-offset-4 hover:text-[var(--texto-oscuro-fuerte)]"
          >
            {t.entrar}
          </Link>
          {compacta ? null : (
            <Link prefetch={false}
              href={comprar}
              className="m-btn hidden min-h-11 items-center rounded-full bg-white px-5 font-medium text-[#14140f] sm:inline-flex"
            >
              {t.comprar}
            </Link>
          )}
        </div>

        {/* En el teléfono las solapas van en su propia fila, centradas. */}
        {compacta ? null : (
          <div className="flex w-full justify-center md:hidden">
            <Solapas idioma={idioma} producto={producto} />
          </div>
        )}
      </div>
      {idioma === "es" ? (
        <SugerenciaCatalan camino={camino} texto={t.sugerenciaCatalan} enlace={t.sugerenciaCatalanEnlace} cerrar={t.cerrar} />
      ) : null}
    </header>
  );
}

/**
 * Familiar · De viaje (MOTION.md patrón 4). La pastilla blanca está debajo de
 * la solapa activa y se desliza hasta la que se señala, solo con transform
 * (las dos solapas miden lo mismo: translateX(100%) es exacto, sin medir nada).
 * El texto va con mix-blend difference: blanco sobre el fondo, negro sobre la
 * pastilla, sin JS. Viaje lleva a /viaje de su idioma (/ca/viaje, /ar/viaje).
 */
export function Solapas({ idioma, producto = "familiar" }: { idioma: IdiomaWeb; producto?: Producto }) {
  const t = TEXTOS_PUBLICO[idioma];
  const solapa = "relative z-10 flex min-h-9 items-center justify-center rounded-full px-4 text-[14px] text-white mix-blend-difference [font-family:var(--fuente-micro)]";
  return (
    <nav
      aria-label={t.productos}
      data-activa={producto}
      className="m-solapas relative isolate grid grid-cols-2 rounded-full border border-[#2c2c28] bg-[var(--fondo-oscuro)] p-1"
    >
      <span aria-hidden className="m-pill absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white" />
      <Link prefetch={false} href={ruta(idioma, "/")} data-solapa="familiar" aria-current={producto === "familiar" ? "page" : undefined} className={solapa}>
        {t.familiar}
      </Link>
      <Link prefetch={false} href={ruta(idioma, "/viaje")} data-solapa="viaje" aria-current={producto === "viaje" ? "page" : undefined} className={solapa}>
        {t.viaje}
      </Link>
    </nav>
  );
}

/**
 * ES · CA. Solo en las versiones de España: en /ar no se ofrece el catalán (el
 * cambio de país va, discreto, en el pie).
 */
export function SelectorIdioma({ idioma, camino, etiqueta }: { idioma: IdiomaWeb; camino: string; etiqueta: string }) {
  if (idioma === "ar") return null;
  const opcion = (activo: boolean) =>
    `flex min-h-11 min-w-8 items-center justify-center text-[13px] tracking-[0.12em] ${
      activo ? "font-semibold text-[var(--texto-oscuro-fuerte)]" : "text-[var(--texto-oscuro-menor)] hover:text-[var(--texto-oscuro-fuerte)]"
    }`;
  return (
    <nav aria-label={etiqueta} className="flex items-center gap-1 [font-family:var(--fuente-micro)]">
      <EnlaceIdioma idioma="es" camino={camino} actual={idioma === "es"} etiqueta="Español" className={opcion(idioma === "es")}>
        ES
      </EnlaceIdioma>
      <span aria-hidden className="text-[var(--borde-oscuro-fuerte)]">·</span>
      <EnlaceIdioma idioma="ca" camino={camino} actual={idioma === "ca"} etiqueta="Català" className={opcion(idioma === "ca")}>
        CA
      </EnlaceIdioma>
    </nav>
  );
}
