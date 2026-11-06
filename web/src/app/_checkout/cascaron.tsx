import Link from "next/link";
import type { ReactNode } from "react";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { CABECERA } from "../_textos/checkout";
import { Toroide } from "../marca";
import "../_direccion/tokens.css";
import "../_portada/acuarela.css";
import "./checkout.css";

// El cascarón de las compras, en Acuarela (06/11): una franja fina con las manchas
// —el logo que vuelve a la portada de su idioma, «Pago seguro y cifrado» y «Ya
// compré · Entrar» (estos dos solo desde 640 px; en el celular, un solo renglón con
// el logo y las dudas)— y el contenido sobre el blanco cálido, con el acento de cada
// producto (acu-acento-*). No usa la cabecera pública a propósito: en el checkout no
// hay menú del que escaparse.
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
  kids = false,
  historia = false,
  children,
}: {
  idioma: IdiomaWeb;
  /** Adónde lleva el logo, sin el prefijo de idioma (la compra de viaje vuelve a /viaje). */
  inicio?: string;
  /** La compra de Viaje: el acento azul. */
  viaje?: boolean;
  /** La compra de Kids: el acento terracota (y .kids-chk, lo propio de esa compra en _kids/kids.css). */
  kids?: boolean;
  /** «Vitácora de una historia»: el acento verde. */
  historia?: boolean;
  children: ReactNode;
}) {
  const T = CABECERA[idioma];
  const dudas = numeroDeDudas();
  const producto = kids ? "kids" : viaje ? "viaje" : historia ? "historia" : "familiar";
  return (
    <div lang={langDeIdioma(idioma)} data-producto={producto} className={`dir-pagina chk acu-tema acu-acento-${producto} ${kids ? "kids-chk " : ""}flex min-h-dvh flex-1 flex-col`}>
      <header className="chk-cabecera">
        <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-x-6 px-4 py-1 sm:px-8 sm:py-2">
          <Link href={ruta(idioma, inicio)} aria-label={T.inicio} className="flex min-h-11 items-center gap-3 text-[var(--dir-sobre-tinta)]">
            <Toroide className="h-6 w-auto" />
            <span aria-hidden className="dir-micro tracking-[0.22em]">
              VITÁCORA
            </span>
          </Link>
          <div className="flex items-center gap-x-5">
            <span className="chk-cabecera-dato hidden items-center gap-2 sm:flex">
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
            <Link href="/entrar" className="dir-enlace hidden min-h-11 items-center text-[13.5px] sm:flex">
              {T.yaCompre}
            </Link>
          </div>
        </div>
      </header>
      <div className="chk-hoja flex flex-col">{children}</div>
    </div>
  );
}
