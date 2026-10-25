"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// La barra con el botón de compra que aparece al pasar el hero, solo en el
// teléfono (en escritorio el botón del encabezado ya está siempre a la vista).
// Martina llega de Instagram, de noche: si decide en la sección 6, el botón
// tiene que estar a un dedo. Se esconde otra vez sobre el precio y el pie,
// que ya tienen el suyo — dos botones iguales en pantalla no ayudan.

// Colores de la dirección nueva (14/10): tinta y papel, sin violeta. La usan la
// portada, las landings, Viaje, Historia y (con su paleta clara) Kids.
//
// Los textos y el destino llegan por props para las versiones por idioma del
// rediseño (/, /ca, /ar); sin ellos, dice lo de siempre y va a /comprar. La
// portada la usa sin «desde» (desde vacío): el precio del libro impreso, el
// mismo de su bloque del libro, y «Iniciar Vitácora».
type TextosCta = { desde: string; conImpreso: string; sinImpreso: string; boton: string };
const TEXTOS_CTA: TextosCta = {
  desde: "desde",
  conImpreso: "Pago único · Libro impreso + PDF con «Su voz»",
  sinImpreso: "Pago único · PDF con «Su voz»",
  boton: "Iniciar Vitácora",
};

export function CtaSticky({
  precio,
  conImpreso = true,
  href = "/comprar",
  textos = TEXTOS_CTA,
  variante = "tinta",
}: {
  precio: string;
  /** Si el impreso se vende en la región (si no, no se promete). */
  conImpreso?: boolean;
  href?: string;
  textos?: TextosCta;
  /** «kids»: la barra en el papel y el botón de Kids (su paleta es clara). */
  variante?: "tinta" | "kids";
}) {
  const [visible, setVisible] = useState(false);
  const centinela = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const tapados = Array.from(document.querySelectorAll<HTMLElement>("[data-cta-propio]"));
    if (!hero) return;

    let pasoElHero = false;
    const sobreUnCta = new Set<Element>();
    const decidir = () => setVisible(pasoElHero && sobreUnCta.size === 0);

    const obsHero = new IntersectionObserver(
      ([e]) => {
        pasoElHero = !e.isIntersecting && e.boundingClientRect.bottom < 0;
        decidir();
      },
      { threshold: 0 },
    );
    obsHero.observe(hero);

    const obsCtas = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) sobreUnCta.add(e.target);
          else sobreUnCta.delete(e.target);
        }
        decidir();
      },
      { threshold: 0.2 },
    );
    tapados.forEach((t) => obsCtas.observe(t));

    return () => {
      obsHero.disconnect();
      obsCtas.disconnect();
    };
  }, []);

  // Mientras la barra se ve, el WhatsApp flotante se esconde en el teléfono
  // (globals.css, «.wa-flotante»): eran tres cosas pegadas a la pantalla
  // (revisión del 25/10, A4). Ya hay WhatsApp en «¿Te queda alguna duda?».
  useEffect(() => {
    const raiz = document.documentElement;
    if (visible) raiz.setAttribute("data-barra-compra", "");
    else raiz.removeAttribute("data-barra-compra");
    return () => raiz.removeAttribute("data-barra-compra");
  }, [visible]);

  const kids = variante === "kids";

  return (
    <div
      ref={centinela}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 backdrop-blur transition-[transform,opacity] duration-[var(--d-base)] ease-out lg:hidden ${
        kids ? "border-[var(--kids-hilo)] bg-[var(--kids-fondo)]/95 text-[var(--kids-texto)]" : "border-[rgba(238,234,225,0.16)] bg-[#070706]/95 text-[#eeeae1]"
      } ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] tabular-nums [font-family:var(--fuente-titulo)]">{textos.desde ? `${textos.desde} ${precio}` : precio}</p>
          <p className={`truncate text-[11px] [font-family:var(--fuente-micro)] ${kids ? "opacity-70" : "text-[#a39f96]"}`}>{conImpreso ? textos.conImpreso : textos.sinImpreso}</p>
        </div>
        <Link prefetch={false}
          href={href}
          tabIndex={visible ? 0 : -1}
          style={kids ? { minHeight: 44, padding: "0 24px" } : undefined}
          className={
            kids
              ? "kids-boton h-11 shrink-0 px-6 text-[15px]"
              : "inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#eeeae1] px-6 text-[15px] font-semibold text-[#070706] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [font-family:var(--fuente-micro)] [touch-action:manipulation]"
          }
        >
          {textos.boton}
        </Link>
      </div>
    </div>
  );
}
