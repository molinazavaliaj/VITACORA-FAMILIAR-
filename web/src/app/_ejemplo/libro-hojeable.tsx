"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import type { TextosEjemplo } from "../_textos/ejemplo";

// El libro de ejemplo que se hojea (maquetas Ejemplo/EjemploMovil, MOTION.md
// patrón 10). Ocho páginas: en escritorio se ven de a dos (cinco pliegos,
// como un libro abierto) y en el teléfono de a una. El estado es la página;
// el pliego sale de ahí. Pasar página es CSS (la hoja gira sobre el lomo en
// 700 ms) y con «menos movimiento» el cambio es instantáneo (regla global de
// globals.css). Las dos vistas están en el HTML y el CSS elige cuál se ve:
// nada depende de medir la pantalla al pintar (sin saltos de diseño).
//
// La tapa y la contratapa llegan ya pintadas del servidor (`tapa`,
// `contratapa`: el libro 3D del prototipo, quieto); las páginas de adentro son
// del mismo papel que ese libro (ejemplo.css).

type Libro = TextosEjemplo["libro"];

// Qué páginas van en cada pliego del escritorio (null = el lado vacío de la tapa).
const PLIEGOS: ReadonlyArray<readonly [number | null, number | null]> = [
  [null, 0],
  [1, 2],
  [3, 4],
  [5, 6],
  [7, null],
];
const TOTAL_PAGINAS = 8;
const pliegoDe = (pagina: number) => PLIEGOS.findIndex(([i, d]) => i === pagina || d === pagina);
const primeraDe = (pliego: number) => PLIEGOS[pliego][0] ?? PLIEGOS[pliego][1] ?? 0;
const ESCRITORIO = "(min-width: 1024px)";

const ONDA = [10, 18, 28, 14, 24, 32, 16, 12, 26, 30, 14, 20, 28, 10, 22, 30, 16, 8, 24, 18, 12, 26];

export function LibroHojeable({
  libro,
  fotos,
  tapa,
  contratapa,
  anterior,
  siguiente,
  posicionesPliegos,
  posicionesPaginas,
}: {
  libro: Libro;
  fotos: { juventud: string };
  /** La tapa, ya armada en el servidor (el libro 3D de frente). */
  tapa: ReactNode;
  /** La contratapa, igual (el libro 3D de espaldas, con el QR). */
  contratapa: ReactNode;
  anterior: string;
  siguiente: string;
  /** «1 de 5 · Portada», ya armado en el servidor, uno por pliego. */
  posicionesPliegos: string[];
  /** Lo mismo, uno por página, para el teléfono. */
  posicionesPaginas: string[];
}) {
  const [pagina, setPagina] = useState(0);
  const [sentido, setSentido] = useState<1 | -1 | 0>(0);
  const toque = useRef<number | null>(null);
  const pliego = pliegoDe(pagina);

  function ir(destino: number) {
    if (destino < 0 || destino >= TOTAL_PAGINAS || destino === pagina) return;
    setSentido(destino > pagina ? 1 : -1);
    setPagina(destino);
  }
  // En escritorio se salta de pliego en pliego; en el teléfono, de página en página.
  function pasar(paso: 1 | -1) {
    if (window.matchMedia(ESCRITORIO).matches) {
      const otro = pliego + paso;
      if (otro >= 0 && otro < PLIEGOS.length) ir(primeraDe(otro));
    } else {
      ir(pagina + paso);
    }
  }

  // El primer pliego y la primera página son la tapa; el último pliego y la
  // última página, la contratapa: las mismas condiciones sirven para las dos vistas.
  const hayAnterior = pagina > 0;
  const haySiguiente = pagina < TOTAL_PAGINAS - 1;
  const claseDer = sentido === 1 ? "m-pasa-der" : sentido === -1 ? "m-aparece-hoja" : "";
  const claseIzq = sentido === -1 ? "m-pasa-izq" : sentido === 1 ? "m-aparece-hoja" : "";

  return (
    <div
      className="flex w-full flex-col items-center gap-7"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") pasar(1);
        if (e.key === "ArrowLeft") pasar(-1);
      }}
    >
      <div
        className="m-libro relative w-full"
        onTouchStart={(e) => {
          toque.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const desde = toque.current;
          const hasta = e.changedTouches[0]?.clientX;
          toque.current = null;
          if (desde === null || hasta === undefined || Math.abs(hasta - desde) < 40) return;
          pasar(hasta < desde ? 1 : -1);
        }}
      >
        {/* Escritorio: el libro abierto, dos páginas. */}
        <div aria-live="polite" className="relative mx-auto hidden w-[860px] justify-center pb-10 lg:flex">
          <span aria-hidden className="absolute bottom-2 left-1/2 h-[60px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(52,40,24,.32),rgba(52,40,24,0)_70%)] blur-[6px]" />
          <div className="relative flex [transform:rotateX(9deg)] [transform-style:preserve-3d]">
            <div key={`i-${pliego}`} className={`m-hoja-izq relative w-[420px] ${claseIzq}`}>
              <Pagina n={PLIEGOS[pliego][0]} lado="izq" libro={libro} fotos={fotos} tapa={tapa} contratapa={contratapa} />
            </div>
            <div key={`d-${pliego}`} className={`m-hoja-der relative w-[420px] ${claseDer}`}>
              <Pagina n={PLIEGOS[pliego][1]} lado="der" libro={libro} fotos={fotos} tapa={tapa} contratapa={contratapa} />
            </div>
            {PLIEGOS[pliego][0] !== null && PLIEGOS[pliego][1] !== null ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-1/2 w-[90px] -translate-x-1/2 bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(60,40,20,.10)_30%,rgba(40,25,10,.38)_50%,rgba(60,40,20,.10)_70%,rgba(0,0,0,0)_100%)]"
              />
            ) : null}
          </div>
        </div>

        {/* Teléfono: una página que ocupa el ancho. */}
        <div aria-live="polite" className="mx-auto w-full max-w-[350px] lg:hidden">
          <div key={`m-${pagina}`} className={`m-hoja-der ${sentido === -1 ? "m-pasa-izq" : sentido === 1 ? "m-pasa-der" : ""}`}>
            <Pagina n={pagina} lado={pagina === 7 ? "izq" : "der"} libro={libro} fotos={fotos} tapa={tapa} contratapa={contratapa} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <BotonPagina etiqueta={anterior} activo={hayAnterior} onClick={() => pasar(-1)}>
          ←
        </BotonPagina>
        <div className="flex w-[230px] flex-col items-center gap-2.5">
          <Puntos total={PLIEGOS.length} actual={pliego} onIr={(k) => ir(primeraDe(k))} nombres={posicionesPliegos} className="hidden lg:flex" />
          <Puntos total={TOTAL_PAGINAS} actual={pagina} onIr={ir} nombres={posicionesPaginas} className="flex lg:hidden" />
          <span className="hidden text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)] lg:inline">{posicionesPliegos[pliego]}</span>
          <span className="text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)] lg:hidden">{posicionesPaginas[pagina]}</span>
        </div>
        <BotonPagina etiqueta={siguiente} activo={haySiguiente} onClick={() => pasar(1)}>
          →
        </BotonPagina>
      </div>
    </div>
  );
}

function BotonPagina({ etiqueta, activo, onClick, children }: { etiqueta: string; activo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-disabled={!activo}
      className="m-ghost flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] text-[20px] text-[var(--texto-oscuro)] aria-disabled:opacity-30 [touch-action:manipulation]"
    >
      {children}
    </button>
  );
}

function Puntos({
  total,
  actual,
  onIr,
  nombres,
  className,
}: {
  total: number;
  actual: number;
  onIr: (k: number) => void;
  nombres: string[];
  className: string;
}) {
  return (
    <div className={`gap-1 ${className}`}>
      {Array.from({ length: total }, (_, k) => (
        <button
          key={k}
          type="button"
          onClick={() => onIr(k)}
          aria-label={nombres[k]}
          aria-current={k === actual ? "true" : undefined}
          className="flex h-6 items-center justify-center px-[3px]"
        >
          {/* La marca de la actual es más larga; cambia de golpe (animar el
              ancho movería el diseño) y solo el color hace transición. */}
          <span
            className={`block h-2 rounded-full transition-colors duration-[var(--d-base)] ${
              k === actual ? "w-[22px] bg-[var(--acento-oscuro)]" : "w-2 bg-[var(--borde-oscuro-fuerte)]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────── las páginas ───────────────────────── */

// Las letras van en unidades del contenedor (cqw): la página es la misma a
// 420 px en escritorio y a 350 en el teléfono, y todo escala junto.

// El papel es el contenedor (cqw); el contenido va en una capa adentro, así
// los márgenes en cqw se miden contra la página y no contra la pantalla.
function Papel({ lado, className, children }: { lado: "izq" | "der"; className: string; children: ReactNode }) {
  return (
    <div className={`ejm-papel relative aspect-[420/580] w-full [container-type:inline-size] ${lado === "izq" ? "ejm-papel--izq" : "ejm-papel--der"}`}>
      <div className={`absolute inset-0 flex flex-col overflow-hidden px-[11.4cqw] pb-[9.5cqw] pt-[12.9cqw] ${className}`}>{children}</div>
    </div>
  );
}

function Pagina({
  n,
  lado,
  libro,
  fotos,
  tapa,
  contratapa,
}: {
  n: number | null;
  lado: "izq" | "der";
  libro: Libro;
  fotos: { juventud: string };
  tapa: ReactNode;
  contratapa: ReactNode;
}) {
  const marco = "relative aspect-[420/580] w-full [container-type:inline-size]";
  if (n === null) return <div aria-hidden className={marco} />;

  // Cerrado, en escritorio el libro va al centro (sobre el lomo), no en su mitad del pliego.
  if (n === 0 || n === 7) return <div className={`${marco} ${n === 0 ? "lg:-translate-x-1/2" : "lg:translate-x-1/2"}`}>{n === 0 ? tapa : contratapa}</div>;

  const folio = (numero: number) => (
    <span
      className={`absolute bottom-[5.2cqw] text-[2.6cqw] text-[#8a7d68] [font-family:var(--fuente-micro)] ${lado === "izq" ? "left-[11.4cqw]" : "right-[11.4cqw]"}`}
    >
      {numero}
    </span>
  );
  const etiqueta = "text-[2.6cqw] uppercase tracking-[0.24em] text-[#8a7350] [font-family:var(--fuente-micro)]";

  if (n === 1)
    return (
      <Papel lado={lado} className="items-center justify-center gap-[3.3cqw] text-center">
        <p className="text-[5.2cqw] italic leading-[1.4] [font-family:var(--fuente-titulo)]">
          {libro.dedicatoria[0]}
          <br />
          {libro.dedicatoria[1]}
          <br />
          {libro.dedicatoria[2]}
        </p>
        <span className={etiqueta}>{libro.firma}</span>
        {folio(4)}
      </Papel>
    );

  if (n === 2)
    return (
      <Papel lado={lado} className="gap-[1.4cqw]">
        <span className={`${etiqueta} mb-[4.3cqw]`}>{libro.indice}</span>
        <ol className="flex flex-col">
          {libro.capitulos.map((cap, i) => (
            <li key={cap} className="flex items-baseline gap-[2.4cqw] border-b border-[#d9cdb6] py-[2.1cqw]">
              <span className="w-[5.2cqw] text-[2.6cqw] text-[#8a7350] [font-family:var(--fuente-micro)]">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[4.5cqw] font-medium [font-family:var(--fuente-titulo)]">{cap}</span>
              <span aria-hidden className="mx-[1.4cqw] flex-1 -translate-y-[1cqw] border-b border-dotted border-[#b9ad9a]" />
              <span className="text-[2.9cqw] text-[#6f6250] [font-family:var(--fuente-micro)]">{7 + i * 11}</span>
            </li>
          ))}
        </ol>
        <span className="mt-auto text-[3.1cqw] italic text-[#6f6250]">{libro.frases}</span>
        {folio(5)}
      </Papel>
    );

  if (n === 3)
    return (
      <Papel lado={lado} className="justify-between">
        <span className="ejm-cap-numero text-[5.2cqw]">{libro.capitulo}</span>
        <div className="flex flex-col gap-[5.2cqw]">
          <span className="text-[12.9cqw] font-medium leading-none [font-family:var(--fuente-titulo)]">{libro.tituloCapitulo}</span>
          <span aria-hidden className="h-px w-[11.4cqw] bg-[#8a7350]" />
          <span className="text-[5cqw] italic leading-[1.4] text-[#4a4236] [font-family:var(--fuente-titulo)]">{libro.citaCapitulo}</span>
        </div>
        <span />
        {folio(6)}
      </Papel>
    );

  if (n === 4)
    return (
      <Papel lado={lado} className="gap-[3.3cqw]">
        {libro.parrafos.map((p, i) => (
          <p key={i} className="text-justify text-[3.55cqw] leading-[1.62] text-[#2e2922] [hyphens:auto]">
            {i === 0 ? (
              <>
                <span className="float-left mr-[1.9cqw] mt-[1.4cqw] text-[13.8cqw] font-medium leading-[0.82] text-[#8a7350] [font-family:var(--fuente-titulo)]">
                  {p.charAt(0)}
                </span>
                {p.slice(1)}
              </>
            ) : (
              p
            )}
          </p>
        ))}
        {folio(7)}
      </Papel>
    );

  if (n === 5)
    return (
      <Papel lado={lado} className="items-center gap-[3.8cqw] pt-[10.5cqw]!">
        <div className="ejm-foto w-[71%] -rotate-[1.5deg] bg-[#fbf8f1] p-[2.9cqw] pb-[8cqw] shadow-[0_6px_14px_rgba(60,40,20,.18)]">
          <Image
            src={fotos.juventud}
            alt={libro.altFoto}
            width={700}
            height={870}
            sizes="(min-width: 1024px) 300px, 250px"
            className="aspect-[4/5] h-auto w-full object-cover"
          />
        </div>
        <span className="text-center text-[3.1cqw] italic leading-[1.45] text-[#5c5446]">{libro.pieFoto}</span>
        {folio(8)}
      </Papel>
    );

  // n === 6: su voz. La onda está quieta: es la ilustración de un audio que en
  // el libro de verdad suena; este ejemplo no tiene voz grabada que poner.
  return (
    <Papel lado={lado} className="gap-[3.8cqw]">
      <span className={etiqueta}>{libro.voz}</span>
      <span className="text-[7.1cqw] font-medium leading-[1.15] [font-family:var(--fuente-titulo)]">{libro.vozTitulo}</span>
      <p className="text-[3.55cqw] leading-[1.62] text-[#2e2922]">{libro.vozTexto}</p>
      <div aria-hidden className="flex items-center gap-[2.9cqw] rounded-[3.3cqw] bg-[#ebe2d1] p-[3.3cqw]">
        <span className="flex h-[10.5cqw] w-[10.5cqw] flex-none items-center justify-center rounded-full border border-[#8a7350] text-[#8a7350]">
          <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M4 12h1M7 9v6M10 6v12M13 8v8M16 10v4M19 11.5v1" />
          </svg>
        </span>
        <span className="flex h-[8cqw] min-w-0 flex-1 items-center gap-[0.7cqw] overflow-hidden">
          {ONDA.map((alto, i) => (
            <span key={i} className="block w-[0.7cqw] flex-none rounded-full bg-[#8a7350]" style={{ height: `${alto / 4.2}cqw` }} />
          ))}
        </span>
        <span className="text-[2.9cqw] text-[#6f6250] [font-family:var(--fuente-micro)]">{libro.vozDuracion}</span>
      </div>
      <span className="text-[4.5cqw] italic leading-[1.45] text-[#4a4236] [font-family:var(--fuente-titulo)]">{libro.vozCita}</span>
      {folio(9)}
    </Papel>
  );
}
