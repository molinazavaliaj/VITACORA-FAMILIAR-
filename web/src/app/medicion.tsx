"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { medicionConfigurada } from "@/lib/medicion";
import {
  EVENTO_ABRIR_COOKIES,
  borrarCookiesDeMedicion,
  cargarMedicion,
  decisionGuardada,
  guardarDecision,
  medirVisita,
} from "@/lib/medicion-cliente";
import { idiomaDeRuta, ruta } from "@/lib/idioma-web";
import { TEXTOS_MEDICION } from "./_textos/medicion";

// El aviso de cookies y la carga del píxel (medición de anuncios, 26/10; reglas
// en lib/medicion.ts). Va en el layout raíz, junto a OrigenVisita. Sin un id de
// Meta o Google en Vercel no pinta nada ni carga nada: la web queda como antes.
//
// Sin decisión guardada, el aviso abajo, con «Aceptar» y «Rechazar» iguales.
// Con «sí», se cargan Meta y Google y cuenta cada página. Con «no», nada; si
// antes había aceptado, se borran sus cookies y se recarga para descargarlos.
// «Cookies», al pie, lo vuelve a abrir (EVENTO_ABRIR_COOKIES).

export function Medicion() {
  const pathname = usePathname() ?? "/";
  const [abierto, setAbierto] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const configurada = medicionConfigurada();
  const aviso = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!configurada) return;
    const decision = decisionGuardada();
    if (decision === "si") {
      cargarMedicion();
      setAcepto(true);
    } else if (decision === null) {
      setAbierto(true);
    }
    const abrir = () => setAbierto(true);
    window.addEventListener(EVENTO_ABRIR_COOKIES, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR_COOKIES, abrir);
  }, [configurada]);

  // Una visita por página, también al moverse con los `Link` de Next.
  useEffect(() => {
    if (acepto) medirVisita();
  }, [acepto, pathname]);

  // Mientras el aviso está abierto publica su alto en --alto-aviso (la barra del checkout se apoya encima); al cerrarse, lo borra.
  useEffect(() => {
    const raiz = document.documentElement;
    const nodo = aviso.current;
    if (!abierto || !nodo) return;
    const poner = () => raiz.style.setProperty("--alto-aviso", `${nodo.offsetHeight}px`);
    poner();
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(poner);
      ro.observe(nodo);
    } catch {
      // sin ResizeObserver, queda el alto de ahora
    }
    return () => {
      ro?.disconnect();
      raiz.style.removeProperty("--alto-aviso");
    };
  }, [abierto, configurada]);

  if (!configurada || !abierto) return null;
  const { idioma } = idiomaDeRuta(pathname);
  const t = TEXTOS_MEDICION[idioma];

  function decidir(si: boolean) {
    const antes = decisionGuardada();
    guardarDecision(si ? "si" : "no");
    setAbierto(false);
    if (si) {
      cargarMedicion();
      setAcepto(true);
    } else if (antes === "si") {
      borrarCookiesDeMedicion();
      window.location.reload();
    }
  }

  const boton =
    "min-h-11 flex-1 rounded-full border border-[#7a1f2e] px-5 text-[13px] uppercase tracking-[0.14em] text-[#7a1f2e] [font-family:var(--fuente-micro)] hover:bg-[#7a1f2e]/10 sm:flex-none";
  return (
    <div
      ref={aviso}
      role="dialog"
      aria-live="polite"
      aria-label={t.cookies}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(90,40,45,0.17)] bg-[#fffdfa] text-[#5c4d4a] shadow-[0_-10px_30px_-20px_rgba(90,40,45,0.5)]"
    >
      <div className="mx-auto flex w-full max-w-[1104px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[14px] leading-snug">
          {t.aviso}{" "}
          <Link prefetch={false} href={`${ruta(idioma, "/legal/privacidad")}#cookies`} className="underline underline-offset-2">
            {t.masInformacion}
          </Link>
        </p>
        <div className="flex gap-3">
          <button type="button" className={boton} onClick={() => decidir(false)}>
            {t.rechazar}
          </button>
          <button type="button" className={boton} onClick={() => decidir(true)}>
            {t.aceptar}
          </button>
        </div>
      </div>
    </div>
  );
}

/** «Cookies», al pie: vuelve a abrir el aviso. Solo existe si hay algo que medir. */
export function BotonCookies({ texto, className }: { texto: string; className?: string }) {
  if (!medicionConfigurada()) return null;
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_COOKIES))}>
      {texto}
    </button>
  );
}
