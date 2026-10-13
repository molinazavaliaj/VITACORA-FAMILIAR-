"use client";

import { forwardRef, type ReactNode } from "react";
import type { Compra } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { formatearPrecio } from "../comprar/productos-ui";
import type { TextosFallo, TextosResumen } from "../_textos/checkout";

// Las piezas que comparten las tres compras del rediseño (/comprar,
// /comprar/viaje y /regalar), sobre el tema oscuro. Ninguna trae texto propio:
// todo llega de los diccionarios de _textos.

export const CAMPO =
  "h-[52px] w-full rounded-[14px] border border-[var(--borde-oscuro-fuerte)] bg-[var(--fondo-oscuro)] px-4 text-[16px] text-[var(--texto-oscuro-fuerte)] outline-none transition-colors placeholder:text-[var(--punto-vacio)] focus:border-[var(--acento-oscuro)] aria-invalid:border-[#f0a37a] [font-family:var(--fuente-micro)]";
export const AREA =
  "w-full rounded-[14px] border border-[var(--borde-oscuro-fuerte)] bg-[var(--fondo-oscuro)] px-4 py-3 text-[16px] text-[var(--texto-oscuro-fuerte)] outline-none transition-colors placeholder:text-[var(--punto-vacio)] focus:border-[var(--acento-oscuro)] aria-invalid:border-[#f0a37a] [font-family:var(--fuente-cuerpo)]";
export const ETIQUETA = "block text-[13px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]";
export const AYUDA = "mt-2 text-[13px] leading-snug text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]";
export const ERROR = "text-[14px] text-[#f0a37a] [font-family:var(--fuente-micro)]";
export const ID_ERROR = "error-paso";

/** El título de cada paso: «Paso 1 de 3», el h1 (recibe el foco al cambiar de paso) y la bajada. */
export const TituloPaso = forwardRef<HTMLHeadingElement, { antetitulo: string; titulo: ReactNode; bajada?: ReactNode }>(
  function TituloPaso({ antetitulo, titulo, bajada }, ref) {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-[12px] uppercase tracking-[0.18em] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{antetitulo}</span>
        <h1
          ref={ref}
          tabIndex={-1}
          className="text-[32px] font-medium leading-[1.1] text-[var(--texto-oscuro-fuerte)] outline-none [font-family:var(--fuente-titulo)] [text-wrap:balance] sm:text-[38px]"
        >
          {titulo}
        </h1>
        {bajada ? <p className="text-[17px] leading-[1.55] text-[var(--texto-oscuro-suave)]">{bajada}</p> : null}
      </div>
    );
  },
);

/** El error del paso, atado a los campos marcados con aria-describedby. */
export function ErrorPaso({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p id={ID_ERROR} role="alert" className={ERROR}>
      {texto}
    </p>
  );
}

/** Casos 2: la pasarela volvió sin cobrar. Entra desde abajo (MOTION.md patrón 2). */
export function AvisoFallo({ textos: T, guardado }: { textos: TextosFallo; guardado: boolean }) {
  return (
    <div role="alert" className="m-step m-step-abajo flex flex-col gap-2 rounded-[16px] border border-[#5a3a24] bg-[#1f1510] px-5 py-4">
      <p className="flex items-start gap-3 text-[15px] font-medium text-[#f6d9c6] [font-family:var(--fuente-micro)]">
        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0a37a] text-[14px] font-semibold text-[#1f1510]">
          !
        </span>
        <span>{T.titulo}</span>
      </p>
      <p className="pl-9 text-[15px] leading-relaxed text-[var(--texto-oscuro-suave)]">
        <strong className="font-medium text-[var(--texto-oscuro-fuerte)]">{T.otraVez}</strong> {T.porQue}
        {guardado ? ` ${T.guardado}` : ""}
      </p>
    </div>
  );
}

/** Un contador − n + (copias extra, marcos adicionales). */
export function Contador({
  titulo,
  detalle,
  valor,
  onCambio,
  max = 20,
  menos,
  mas,
}: {
  titulo: string;
  detalle: string;
  valor: number;
  onCambio: (n: number) => void;
  max?: number;
  menos: string;
  mas: string;
}) {
  const boton =
    "m-ghost flex h-11 w-11 items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] text-lg text-[var(--texto-oscuro-fuerte)] disabled:opacity-40 [touch-action:manipulation]";
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] px-5 py-4">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">{titulo}</p>
        <p className="mt-1 text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{detalle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={menos} disabled={valor <= 0} onClick={() => onCambio(Math.max(0, valor - 1))} className={boton}>
          −
        </button>
        <span className="w-6 text-center text-[16px] tabular-nums text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">{valor}</span>
        <button type="button" aria-label={mas} disabled={valor >= max} onClick={() => onCambio(Math.min(max, valor + 1))} className={boton}>
          +
        </button>
      </div>
    </div>
  );
}

/**
 * «Pagar»: al pulsar se deshabilita y muestra «Procesando…» con un punto que
 * late hasta que llega la pasarela (MOTION.md §5 regla 6). El que lo usa además
 * corta el segundo envío con una ref, porque dos clics en el mismo instante
 * llegan antes de que React pinte el disabled.
 */
export function BotonPagar({ enviando, texto, procesando }: { enviando: boolean; texto: string; procesando: string }) {
  return (
    <button
      type="submit"
      disabled={enviando}
      aria-busy={enviando || undefined}
      className="m-btn inline-flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-full bg-[var(--boton)] px-8 text-[17px] font-semibold text-[var(--sobre-boton)] disabled:cursor-progress disabled:opacity-80 [font-family:var(--fuente-micro)] [touch-action:manipulation] sm:w-auto"
    >
      {enviando ? (
        <>
          <span aria-hidden className="m-latido h-2 w-2 rounded-full bg-current" />
          {procesando}
        </>
      ) : (
        <>
          <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          {texto}
        </>
      )}
    </button>
  );
}

/**
 * El resumen de la derecha: arriba lo que se compra (la tapa, el título, para
 * quién), el ticket en vivo con la misma cuenta que cobra el servidor, y el
 * total, que se anima en cada cambio (MOTION.md patrón 7, `key={total}`).
 */
export function Resumen({
  compra,
  region,
  textos: T,
  cabeza,
  incluye,
  tachado,
}: {
  compra: Compra;
  region: Region;
  textos: TextosResumen;
  cabeza: ReactNode;
  incluye: string[];
  /** El precio de lista de la promo, si hay (se muestra tachado junto al total). */
  tachado?: string | null;
}) {
  const f = (n: number) => formatearPrecio(n, compra.moneda, region);
  const total = f(compra.total);
  return (
    <aside aria-label={T.etiqueta} className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-8">
      <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
        {cabeza}
        <div className="flex flex-col gap-2.5 border-t border-[var(--tarjeta-alta)] pt-4 text-[15px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]">
          {compra.lineas.map((l) => (
            <div key={l.id} className="flex justify-between gap-3">
              <span>
                {T.lineas[l.id]}
                {l.cantidad > 1 ? ` × ${l.cantidad}` : ""}
              </span>
              <span className="tabular-nums text-[var(--texto-oscuro-fuerte)]">
                {l.id === "pdf" || l.id === "viaje" ? "" : "+"}
                {f(l.cantidad * l.precioUnitario)}
              </span>
            </div>
          ))}
          <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-[var(--tarjeta-alta)] pt-3.5 text-[18px] font-semibold text-[var(--texto-oscuro-fuerte)]">
            <span>{T.total}</span>
            <span className="flex items-baseline gap-2">
              {tachado ? <s className="text-[13px] font-normal text-[var(--texto-oscuro-menor)]">{tachado}</s> : null}
              <span key={compra.total} className="m-price tabular-nums" aria-live="polite">
                {total}
              </span>
            </span>
          </div>
          <span className="text-[12px] text-[var(--texto-oscuro-menor)]">{T.pagoUnico}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-3 rounded-[22px] border border-[var(--borde-oscuro)] px-6 py-5 text-[15px] leading-snug text-[var(--texto-oscuro-suave)]">
        {incluye.map((i) => (
          <li key={i} className="flex gap-2.5">
            <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" className="mt-0.5 shrink-0 text-[var(--acento-oscuro)]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
            {i}
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Lleva arriba del todo al cambiar de paso (la maqueta lo hace con `top()`). */
export function arriba() {
  try {
    window.scrollTo(0, 0);
  } catch {
    // sin ventana (tests)
  }
}
