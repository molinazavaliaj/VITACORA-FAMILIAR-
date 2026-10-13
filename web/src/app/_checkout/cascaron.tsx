import Link from "next/link";
import type { ReactNode } from "react";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { CABECERA } from "../_textos/checkout";
import { Toroide } from "../marca";

// El cascarón de las compras del rediseño (maqueta Checkout): fondo oscuro, una
// cabecera mínima y propia —el logo que vuelve a la portada de su idioma, «Pago
// seguro y cifrado» y «Ya compré · Entrar»— y el contenido. No usa la cabecera
// pública de la portada a propósito: en el checkout no hay menú del que
// escaparse. Componente de servidor: no suma JS.
//
// El botón de dudas por WhatsApp sale solo si está la variable
// NEXT_PUBLIC_WHATSAPP_DUDAS (E.164, B11): sin número, no se muestra.

/** El número de dudas listo para wa.me (solo dígitos), o null si no está configurado. */
export function numeroDeDudas(valor = process.env.NEXT_PUBLIC_WHATSAPP_DUDAS): string | null {
  const digitos = (valor ?? "").replace(/\D/g, "");
  return digitos.length >= 8 ? digitos : null;
}

export function CascaronCheckout({
  idioma,
  inicio = "/",
  viaje = false,
  children,
}: {
  idioma: IdiomaWeb;
  /** Adónde lleva el logo, sin el prefijo de idioma (la compra de viaje vuelve a /viaje). */
  inicio?: string;
  /** El tema azul de Viaje (.tema-viaje). */
  viaje?: boolean;
  children: ReactNode;
}) {
  const T = CABECERA[idioma];
  const dudas = numeroDeDudas();
  return (
    <div lang={langDeIdioma(idioma)} className={`tema-oscuro ${viaje ? "tema-viaje" : ""} flex min-h-dvh flex-1 flex-col`}>
      <header className="border-b border-[var(--linea-oscura)]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-6">
          <Link href={ruta(idioma, inicio)} aria-label={T.inicio} className="flex items-center gap-3 text-[var(--texto-oscuro)]">
            <Toroide className="h-7 w-auto" />
            <span aria-hidden className="text-[13px] font-medium tracking-[0.22em] [font-family:var(--fuente-micro)]">
              VITÁCORA
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]">
            <span className="flex items-center gap-2">
              <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {T.pagoSeguro}
            </span>
            {dudas ? (
              <a href={`https://wa.me/${dudas}`} target="_blank" rel="noreferrer" className="text-[var(--texto-oscuro)] underline-offset-4 hover:underline">
                {T.dudas}
              </a>
            ) : null}
            <Link href="/entrar" className="text-[var(--texto-oscuro)] underline decoration-[var(--borde-oscuro-fuerte)] underline-offset-4 hover:decoration-[var(--acento-oscuro)]">
              {T.yaCompre}
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
