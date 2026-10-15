import Link from "next/link";
import type { ReactNode } from "react";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { CABECERA } from "../_textos/checkout";
import { Toroide } from "../marca";
import "../_direccion/tokens.css";
import "./checkout.css";

// El cascarón de las compras (dirección «la web es un libro», 14/10): la
// cabecera mínima y propia en tinta —el logo que vuelve a la portada de su
// idioma, «Pago seguro y cifrado» y «Ya compré · Entrar»— y el contenido en una
// hoja de papel crema que la tapa con el borde cortado a mano. No usa la
// cabecera pública a propósito: en el checkout no hay menú del que escaparse.
// Componente de servidor: no suma JS. Los estilos, en ./checkout.css.
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
  /** La compra de Viaje: data-producto="viaje" le da su paleta, noche y azul (checkout.css y _direccion/viaje.css). */
  viaje?: boolean;
  children: ReactNode;
}) {
  const T = CABECERA[idioma];
  const dudas = numeroDeDudas();
  return (
    <div lang={langDeIdioma(idioma)} data-producto={viaje ? "viaje" : "familiar"} className="dir-pagina chk flex min-h-dvh flex-1 flex-col">
      <header className="dir-tinta chk-cabecera">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pb-4 pt-5 sm:px-8 sm:pb-6 sm:pt-6">
          <Link href={ruta(idioma, inicio)} aria-label={T.inicio} className="flex min-h-11 items-center gap-3 text-[var(--dir-sobre-tinta)]">
            <Toroide className="h-6 w-auto" />
            <span aria-hidden className="dir-micro tracking-[0.22em]">
              VITÁCORA
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="chk-cabecera-dato flex items-center gap-2">
              <svg aria-hidden viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {T.pagoSeguro}
            </span>
            {dudas ? (
              <a href={`https://wa.me/${dudas}`} target="_blank" rel="noreferrer" className="dir-enlace flex min-h-11 items-center text-[13.5px]">
                {T.dudas}
              </a>
            ) : null}
            <Link href="/entrar" className="dir-enlace flex min-h-11 items-center text-[13.5px]">
              {T.yaCompre}
            </Link>
          </div>
        </div>
      </header>
      <div className="dir-deckle chk-hoja flex flex-col">{children}</div>
    </div>
  );
}
