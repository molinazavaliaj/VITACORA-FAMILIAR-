import Link from "next/link";
import type { ReactNode } from "react";
import type { Foco } from "@/lib/encuadre";
import type { IdiomaLibro, ProductoTapa } from "@/lib/tapa";
import { TapaLibro } from "../../tapa-libro";
import { PANEL, type IdiomaPanel, type Quien } from "../../_textos/panel";
import type { PasoLinea, Titular } from "../momento";

// La cabecera de una historia (rediseño 2026-10, fase 2; maqueta Panel): su
// libro de verdad a la izquierda —la tapa con la foto que eligieron y el
// nombre, como sale impresa (tapa-libro.tsx)—, el saludo y el titular del
// momento en Playfair grande, las cifras de su voz y la línea de tiempo.
// Componente de servidor, sin estado. Las cifras llegan por un Suspense
// aparte (dependen de lo contado, que tarda más que esto).

export type DatosTapa = { titulo: string; fotoSrc: string | null; foco?: Foco; idioma: IdiomaLibro; producto?: ProductoTapa };

export function PortadaHistoria({
  idioma,
  quien,
  hola,
  titular,
  estado,
  tapa,
  pasos,
  cifras,
  hrefTapa,
}: {
  idioma: IdiomaPanel;
  quien: Quien;
  /** El primer nombre de quien compró: «Hola, Laura.». Sin nombre, no hay saludo. */
  hola: string | null;
  titular: Titular;
  /** La línea de arriba: cómo va, en palabras (estadoEnHumano). */
  estado: string;
  tapa: DatosTapa;
  pasos: PasoLinea[];
  /** Respuestas y minutos de su voz (CifrasHistoria), o nada. */
  cifras?: ReactNode;
  /** Adónde lleva tocar la tapa (Encargar libro, donde se elige). */
  hrefTapa?: string;
}) {
  const T = PANEL[idioma];
  const libro = (
    <div className="pnl-libro w-[88px] sm:w-[128px] lg:w-[148px]">
      <TapaLibro titulo={tapa.titulo} fotoSrc={tapa.fotoSrc} foco={tapa.foco} idioma={tapa.idioma} producto={tapa.producto} />
    </div>
  );
  return (
    <header className="flex flex-col gap-8 md:gap-10">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-5 gap-y-6 sm:gap-x-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-12">
        {hrefTapa ? (
          <Link href={hrefTapa} aria-label={T.libroDe(quien)} className="block">
            {libro}
          </Link>
        ) : (
          libro
        )}
        <div className="min-w-0 pb-1">
          <p className="pnl-dato max-w-[52ch]">{estado}</p>
          <h1 className="pnl-titular mt-3">
            {hola ? <span className="block italic text-[var(--texto-suave)]">{T.hola(hola)}</span> : null}
            {T.titular(titular, quien)}
          </h1>
        </div>
        {cifras ? <div className="col-span-2 lg:col-span-1 lg:pb-2">{cifras}</div> : null}
      </div>
      <LineaDeTiempo idioma={idioma} quien={quien} pasos={pasos} />
    </header>
  );
}

/** «11 respuestas · 34 min de su voz», en grande. Sin respuestas no se muestra nada. */
export function CifrasHistoria({ idioma, quien, respuestas, segundos, avance }: { idioma: IdiomaPanel; quien: Quien; respuestas: number; segundos: number; /** 0 a 100 (V3), o nada. */ avance?: number | null }) {
  if (respuestas <= 0) return null;
  const T = PANEL[idioma];
  const minutos = Math.round(segundos / 60);
  return (
    <dl className="flex gap-8 sm:gap-10">
      <div className="flex flex-col-reverse gap-1.5">
        <dt className="pnl-dato">{T.respuestas(respuestas)}</dt>
        <dd className="pnl-cifra">{respuestas}</dd>
      </div>
      {minutos > 0 ? (
        <div className="flex flex-col-reverse gap-1.5">
          <dt className="pnl-dato">{T.minutosDeVoz(quien)}</dt>
          <dd className="pnl-cifra">{minutos}</dd>
        </div>
      ) : null}
      {/* Cuánto del libro lleva (Naza, 25/10; lib/v3.ts, avanceV3). */}
      {typeof avance === "number" ? (
        <div className="flex flex-col-reverse gap-1.5">
          <dt className="pnl-dato">{T.delLibro}</dt>
          <dd className="pnl-cifra">{avance}%</dd>
        </div>
      ) : null}
    </dl>
  );
}

/** Pagado → Primer mensaje → Contándolo → Libro listo → Impreso en casa: un hilo por paso que se llena en orden. */
export function LineaDeTiempo({ idioma, quien, pasos, compacta = false }: { idioma: IdiomaPanel; quien: Quien; pasos: PasoLinea[]; compacta?: boolean }) {
  const T = PANEL[idioma];
  const nombres = T.pasos(quien);
  return (
    <ol aria-label={T.comoVa} className="pnl-linea" style={{ ["--n" as string]: pasos.length }}>
      {pasos.map((p, i) => (
        <li key={p.clave} className="pnl-paso" data-estado={p.estado} style={{ ["--i" as string]: i }} aria-current={p.estado === "actual" ? "step" : undefined}>
          <span aria-hidden className="pnl-paso-hilo">
            <span />
          </span>
          <span className={`pnl-paso-nombre ${compacta ? "sr-only sm:not-sr-only" : ""}`}>
            {nombres[p.clave]}
            {p.estado !== "pendiente" ? <span className="sr-only">, {p.estado === "hecho" ? T.hecho : T.ahora}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
