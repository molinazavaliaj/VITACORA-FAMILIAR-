import type { ReactNode } from "react";
import { Toroide } from "../marca";

// Las piezas de los esqueletos de carga del panel (loading.tsx de /tablero y
// de una historia, y el del cascarón entero al entrar desde afuera,
// RENDIMIENTO.md §3.1). Cajas con los mismos tokens que el panel (--hueco,
// --linea, --relieve), así el esqueleto sigue el tema papel o tinta sin hacer
// nada. Sin texto: solo la forma de lo que viene. El latido es de opacidad y se
// apaga si la persona pidió menos movimiento.

/** Una barra gris: un título, una línea de texto, un botón. */
export function Hueso({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`rounded-[3px] bg-[var(--hueco)] motion-safe:animate-pulse ${className}`} />;
}

/** El contenedor del esqueleto: avisa a los lectores de pantalla que está cargando. */
export function Cargando({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div aria-busy="true" className={className}>
      <p role="status" className="sr-only">
        Cargando…
      </p>
      {children}
    </div>
  );
}

/** Una hoja vacía, con el mismo borde que las hojas del panel (panel.css). */
export function TarjetaHueca({ children }: { children: ReactNode }) {
  return <div className="pnl-hoja p-6">{children}</div>;
}

/** La cabecera de una historia mientras llega: la tapa, el titular y la línea de tiempo. */
export function CabeceraHueca() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-5 sm:gap-8">
        <Hueso className="aspect-[148/210] w-[92px] shrink-0 rounded-[2px] sm:w-[124px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Hueso className="h-3 w-40" />
          <Hueso className="h-9 w-full max-w-[520px] md:h-12" />
          <Hueso className="h-9 w-3/4 max-w-[380px] md:h-12" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Hueso className="h-[2px] w-full" />
            <Hueso className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Lo contado mientras llega: el título de un capítulo y tres respuestas. */
export function CuerpoHueco() {
  return (
    <div aria-hidden className="flex min-w-0 flex-col gap-4">
      <Hueso className="h-7 w-56" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 border-t border-[var(--linea)] pt-5">
          <Hueso className="h-5 w-3/4" />
          <Hueso className="h-4 w-full" />
          <Hueso className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

/** Una hoja del lateral mientras llega. */
export function HojaHueca() {
  return (
    <TarjetaHueca>
      <Hueso className="h-6 w-32" />
      <Hueso className="mt-5 h-4 w-full" />
      <Hueso className="mt-3 h-4 w-4/5" />
      <Hueso className="mt-6 h-11 w-40 rounded-full" />
    </TarjetaHueca>
  );
}

/** La página de una historia mientras carga: cabecera, lo contado y el lateral. */
export function HistoriaHueca() {
  return (
    <Cargando className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-8 sm:px-8 md:pt-12">
      <CabeceraHueca />
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <CuerpoHueco />
        <div className="flex flex-col gap-6">
          <HojaHueca />
          <HojaHueca />
        </div>
      </div>
    </Cargando>
  );
}

/**
 * El panel entero antes de saber quién es (Suspense del layout): la cabecera de
 * tinta con el logo, el borde de la hoja y una historia hueca. Es lo que pinta
 * el navegador apenas llega la primera respuesta del servidor.
 */
export function CascaronHueco() {
  return (
    <>
      <div className="pnl-cabecera">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-8 md:h-[72px]">
          <span className="flex items-center gap-3 text-[var(--dir-sobre-tinta)]">
            <Toroide className="h-6 w-auto" />
            <span aria-hidden className="pnl-marca hidden sm:inline">
              VITÁCORA
            </span>
          </span>
          <span className="ml-auto h-10 w-10 rounded-full border border-[rgba(238,234,225,0.2)]" aria-hidden />
          <span className="h-10 w-10 rounded-full border border-[rgba(238,234,225,0.2)]" aria-hidden />
        </div>
      </div>
      <div aria-hidden className="pnl-deckle" />
      <HistoriaHueca />
    </>
  );
}
