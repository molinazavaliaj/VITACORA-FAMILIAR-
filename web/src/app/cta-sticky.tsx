"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// La barra con el botón de compra que aparece al pasar el hero, solo en el
// teléfono (en escritorio el botón del encabezado ya está siempre a la vista).
// Martina llega de Instagram, de noche: si decide en la sección 6, el botón
// tiene que estar a un dedo. Se esconde otra vez sobre el precio y el pie,
// que ya tienen el suyo — dos botones iguales en pantalla no ayudan.

export function CtaSticky({ precio }: { precio: string }) {
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

  return (
    <div
      ref={centinela}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#2B2B24] bg-[#14140F]/95 px-4 pt-3 text-white backdrop-blur transition-[transform,opacity] duration-300 ease-out lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] tabular-nums [font-family:var(--fuente-titulo)]">desde {precio}</p>
          <p className="truncate text-[11px] text-[#AEAEA6] [font-family:var(--fuente-micro)]">Pago único · PDF, audiolibro o impreso</p>
        </div>
        <Link
          href="/comprar"
          tabIndex={visible ? 0 : -1}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#8F7BE0] px-6 text-[15px] font-medium text-[#14140F] transition-colors hover:bg-[#A296E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [font-family:var(--fuente-micro)] [touch-action:manipulation]"
        >
          Comprar el libro
        </Link>
      </div>
    </div>
  );
}
