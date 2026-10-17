"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { COOKIE_IDIOMA, ruta, type IdiomaWeb } from "@/lib/idioma-web";

// Lo poco del idioma que necesita el navegador (las páginas son estáticas):
// guardar la elección en la cookie `idioma` antes de navegar, así el CDN no la
// vuelve a mover por país (next.config.ts), y sugerir el catalán a quien lo
// tiene en el navegador. Nunca se redirige a la fuerza (DECISIONES D2).

const UN_ANO = 60 * 60 * 24 * 365;

export function guardarIdioma(idioma: IdiomaWeb) {
  document.cookie = `${COOKIE_IDIOMA}=${idioma}; path=/; max-age=${UN_ANO}; samesite=lax`;
}

/** Un enlace a la misma pantalla en otro idioma (o país) que deja la cookie puesta. */
export function EnlaceIdioma({
  idioma,
  camino,
  className,
  children,
  actual = false,
  etiqueta,
}: {
  idioma: IdiomaWeb;
  /** La pantalla sin prefijo de idioma: "/", "/ejemplo". */
  camino: string;
  className?: string;
  children: ReactNode;
  actual?: boolean;
  /** Nombre accesible, cuando el texto visible es una sigla («CA»). */
  etiqueta?: string;
}) {
  return (
    <Link prefetch={false}
      href={ruta(idioma, camino)}
      hrefLang={idioma === "ca" ? "ca-ES" : idioma === "ar" ? "es-AR" : "es-ES"}
      aria-current={actual ? "true" : undefined}
      aria-label={etiqueta}
      onClick={() => guardarIdioma(idioma)}
      className={className}
    >
      {children}
    </Link>
  );
}

function tieneCookieIdioma() {
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE_IDIOMA}=`));
}

/**
 * Un aviso chico, abajo, para quien tiene el navegador en catalán y llegó a la
 * versión en castellano sin haber elegido idioma. Va fijo (no empuja nada: sin
 * saltos de diseño) y se cierra; al cerrarlo se guarda «es» y no sale más.
 */
export function SugerenciaCatalan({
  camino,
  texto,
  enlace,
  cerrar,
}: {
  camino: string;
  texto: string;
  enlace: string;
  cerrar: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const pide = (navigator.languages ?? [navigator.language]).slice(0, 1).some((l) => l.toLowerCase().startsWith("ca"));
    if (pide && !tieneCookieIdioma()) setVisible(true);
  }, []);

  if (!visible) return null;
  return (
    <div
      role="status"
      lang="ca-ES"
      className="m-step m-step-abajo fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[var(--borde-oscuro-fuerte)] bg-[var(--tarjeta)] px-4 py-3 text-[14px] text-[var(--texto-oscuro)] shadow-[0_20px_50px_rgba(0,0,0,0.5)] [font-family:var(--fuente-micro)] lg:bottom-6"
    >
      <p className="min-w-0 flex-1">
        {texto}{" "}
        <EnlaceIdioma idioma="ca" camino={camino} className="text-[var(--acento-oscuro)] underline underline-offset-4">
          {enlace}
        </EnlaceIdioma>
      </p>
      <button
        type="button"
        onClick={() => {
          guardarIdioma("es");
          setVisible(false);
        }}
        aria-label={cerrar}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-[var(--texto-oscuro-menor)] hover:text-[var(--texto-oscuro-fuerte)]"
      >
        ×
      </button>
    </div>
  );
}
