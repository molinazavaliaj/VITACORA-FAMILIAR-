"use client";

import { useEffect, useMemo, useState } from "react";
import { Toroide } from "../../../marca";

// El libro en miniatura (docs/panel-usuario.md §15.4): se hojea página por
// página y muestra cómo va a quedar — la tapa elegida, dónde caen las fotos,
// los capítulos, el texto con lo que contó hasta hoy. Se arma acá, en el
// navegador, con la misma lógica de la fábrica (foto principal abre el
// capítulo, las demás lo cierran). Pendiente 3t.8 (Naza): cuando la fábrica
// exponga su HTML paginado, esta pieza lo muestra en vez de armarlo.

export type FotoLibro = { id: string; epigrafe: string | null; principal: boolean };
export type CapituloLibro = { nombre: string; fotos: FotoLibro[]; textos: { pregunta: string; texto: string }[] };
export type LibroDatos = {
  titulo: string;
  subtitulo: string;
  portadaFotoId: string | null;
  contratapaFotoId: string | null;
  capitulos: CapituloLibro[];
  /** Solo si compró el impreso en blanco y negro: la miniatura se ve en gris, como se imprime (18/09). El PDF y el lector siempre a color. */
  blancoYNegro?: boolean;
};

const CARACTERES_POR_PAGINA = 720;

/** Corta un texto largo en páginas, en puntos de oración cuando puede. */
export function paginar(texto: string): string[] {
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (!limpio) return [];
  const paginas: string[] = [];
  let resto = limpio;
  while (resto.length > CARACTERES_POR_PAGINA) {
    let corte = resto.lastIndexOf(". ", CARACTERES_POR_PAGINA);
    if (corte < CARACTERES_POR_PAGINA * 0.5) corte = resto.lastIndexOf(" ", CARACTERES_POR_PAGINA);
    if (corte <= 0) corte = CARACTERES_POR_PAGINA;
    paginas.push(resto.slice(0, corte + 1).trim());
    resto = resto.slice(corte + 1).trim();
  }
  if (resto) paginas.push(resto);
  return paginas;
}

export type Pagina =
  | { tipo: "tapa" }
  | { tipo: "indice" }
  | { tipo: "capitulo"; indice: number }
  | { tipo: "texto"; capitulo: number; pregunta: string; texto: string; continua: boolean }
  | { tipo: "fotos"; capitulo: number; fotos: FotoLibro[] }
  | { tipo: "contratapa" }
  | { tipo: "blanca" };

export function armarPaginas(d: LibroDatos): Pagina[] {
  // Como un libro de verdad: la tapa sola a la derecha, el índice a la derecha,
  // cada capítulo abre a la derecha, y la contratapa sola a la izquierda.
  const paginas: Pagina[] = [{ tipo: "blanca" }, { tipo: "tapa" }, { tipo: "blanca" }, { tipo: "indice" }];
  d.capitulos.forEach((cap, i) => {
    // Un capítulo arranca siempre en página derecha (impar en el arreglo).
    if (paginas.length % 2 === 0) paginas.push({ tipo: "blanca" });
    paginas.push({ tipo: "capitulo", indice: i });
    for (const t of cap.textos) {
      paginar(t.texto).forEach((trozo, j) => paginas.push({ tipo: "texto", capitulo: i, pregunta: t.pregunta, texto: trozo, continua: j > 0 }));
    }
    const cierran = cap.fotos.filter((f) => !f.principal);
    if (cierran.length > 0) paginas.push({ tipo: "fotos", capitulo: i, fotos: cierran.slice(0, 4) });
  });
  if (paginas.length % 2 === 1) paginas.push({ tipo: "blanca" });
  paginas.push({ tipo: "contratapa" }, { tipo: "blanca" });
  return paginas;
}

// Las fotos son a color: el gris solo cuando el impreso comprado es en blanco y negro
// (se hereda del contenedor con `[&_img]:grayscale`, no por foto). Antes era gris siempre,
// una decisión estética de la miniatura que confundía: "¿mis fotos quedan en gris?" (Naza, 17/09).
function Foto({ id, className = "" }: { id: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/fotos/${id}`} alt="" loading="lazy" className={`object-cover ${className}`} />;
}

function PaginaVista({ p, d, numero }: { p: Pagina; d: LibroDatos; numero: number }) {
  const folio = <p className="mt-auto pt-2 text-center text-[8px] text-[var(--linea-fuerte)] [font-family:var(--fuente-micro)]">{numero}</p>;
  switch (p.tipo) {
    case "tapa":
      return (
        <div className="flex h-full flex-col justify-between bg-[#14140F] p-5 text-white">
          <Toroide className="h-5 w-auto text-[#AEAEA6]" />
          {d.portadaFotoId ? <Foto id={d.portadaFotoId} className="my-3 aspect-square w-full rounded-sm" /> : <span />}
          <div>
            <p className="text-[18px] leading-[1.1] [font-family:var(--fuente-titulo)] [text-wrap:balance]">{d.titulo}</p>
            <p className="mt-2 text-[9px] italic text-[#D4D4CE] [font-family:var(--fuente-cuerpo)]">{d.subtitulo}</p>
          </div>
        </div>
      );
    case "contratapa":
      return (
        <div className="flex h-full flex-col justify-between bg-[#14140F] p-5 text-white">
          {d.contratapaFotoId ? <Foto id={d.contratapaFotoId} className="aspect-[4/5] w-full rounded-sm" /> : <span />}
          <div className="flex items-end justify-between gap-3">
            <p className="text-[8px] leading-relaxed text-[#AEAEA6] [font-family:var(--fuente-micro)]">Acercá el teléfono al código y escuchá su voz.</p>
            <span aria-hidden className="h-9 w-9 shrink-0 rounded-sm border border-[#83837A] bg-[repeating-linear-gradient(0deg,#83837A_0_2px,transparent_2px_4px)]" />
          </div>
        </div>
      );
    case "indice":
      return (
        <div className="flex h-full flex-col p-5">
          <p className="text-[8px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.28em]">Índice</p>
          <ol className="mt-3 flex flex-col gap-1.5">
            {d.capitulos.map((c, i) => (
              <li key={c.nombre} className="flex items-baseline gap-2 text-[10px]">
                <span className="text-[var(--texto-menor)] tabular-nums [font-family:var(--fuente-micro)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="[font-family:var(--fuente-titulo)]">{c.nombre}</span>
              </li>
            ))}
          </ol>
          {folio}
        </div>
      );
    case "capitulo": {
      const cap = d.capitulos[p.indice];
      const principal = cap.fotos.find((f) => f.principal) ?? null;
      return (
        <div className="flex h-full flex-col p-5">
          {principal ? <Foto id={principal.id} className="mb-3 aspect-[4/3] w-full rounded-sm" /> : null}
          <p className="text-[8px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.28em]">Capítulo {p.indice + 1}</p>
          <p className="mt-1 text-[20px] leading-tight [font-family:var(--fuente-titulo)]">{cap.nombre}</p>
          {principal?.epigrafe ? <p className="mt-2 text-[8px] italic text-[var(--texto-menor)]">{principal.epigrafe}</p> : null}
          {cap.textos.length === 0 ? <p className="mt-4 text-[9px] italic text-[var(--texto-menor)]">Todavía no contó nada de esta época.</p> : null}
          {folio}
        </div>
      );
    }
    case "texto":
      return (
        <div className="flex h-full flex-col p-5">
          {!p.continua ? <p className="mb-2 text-[8px] italic leading-snug text-[var(--texto-menor)]">{p.pregunta}</p> : null}
          <p className="text-[9.5px] leading-[1.65] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">
            {!p.continua ? <span className="float-left mr-1 mt-[1px] text-[24px] leading-[0.8] text-[var(--texto)] [font-family:var(--fuente-titulo)]">{p.texto[0]}</span> : null}
            {!p.continua ? p.texto.slice(1) : p.texto}
          </p>
          {folio}
        </div>
      );
    case "fotos":
      return (
        <div className="flex h-full flex-col gap-2 p-5">
          <div className={`grid gap-2 ${p.fotos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {p.fotos.map((f) => (
              <figure key={f.id} className="flex flex-col gap-1">
                <Foto id={f.id} className="aspect-square w-full rounded-sm" />
                {f.epigrafe ? <figcaption className="text-[7px] italic text-[var(--texto-menor)]">{f.epigrafe}</figcaption> : null}
              </figure>
            ))}
          </div>
          {folio}
        </div>
      );
    case "blanca":
      return <div className="h-full" />;
  }
}

export function LibroMiniatura({ datos }: { datos: LibroDatos }) {
  const paginas = useMemo(() => armarPaginas(datos), [datos]);
  // `pliego` es el índice de la página izquierda del par abierto (siempre par).
  const [pliego, setPliego] = useState(0);
  const ultimo = paginas.length - 2;

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setPliego((p) => Math.min(ultimo, p + 2));
      if (e.key === "ArrowLeft") setPliego((p) => Math.max(0, p - 2));
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [ultimo]);

  const izq = paginas[pliego];
  const der = paginas[pliego + 1];
  const capituloActual = (() => {
    for (let i = pliego + 1; i >= 0; i--) {
      const p = paginas[i];
      if (p?.tipo === "capitulo") return datos.capitulos[p.indice]?.nombre ?? null;
      if (p?.tipo === "texto" || p?.tipo === "fotos") return datos.capitulos[p.capitulo]?.nombre ?? null;
    }
    return null;
  })();

  const flecha = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--linea-fuerte)] text-[var(--texto)] transition-colors hover:bg-[var(--hueco)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] disabled:opacity-30 [touch-action:manipulation]";

  return (
    <figure className="flex flex-col items-center gap-5">
      <div className="flex w-full items-center justify-center gap-3 sm:gap-6">
        <button type="button" className={flecha} aria-label="Página anterior" disabled={pliego <= 0} onClick={() => setPliego((p) => Math.max(0, p - 2))}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <div className={`flex max-w-full drop-shadow-[0_24px_40px_rgba(20,20,15,0.25)] ${datos.blancoYNegro ? "[&_img]:grayscale" : ""}`} style={{ width: "min(100%, 520px)" }}>
          <div className="aspect-[2/3] w-1/2 overflow-hidden rounded-l-[3px] border border-r-0 border-[var(--linea)] bg-[var(--fondo)] shadow-[inset_-12px_0_20px_-16px_rgba(20,20,15,0.3)]">
            {izq ? <PaginaVista p={izq} d={datos} numero={pliego - 1} /> : null}
          </div>
          <div className="aspect-[2/3] w-1/2 overflow-hidden rounded-r-[3px] border border-l-0 border-[var(--linea)] bg-[var(--fondo)] shadow-[inset_12px_0_20px_-16px_rgba(20,20,15,0.3)]">
            {der ? <PaginaVista p={der} d={datos} numero={pliego} /> : null}
          </div>
        </div>
        <button type="button" className={flecha} aria-label="Página siguiente" disabled={pliego >= ultimo} onClick={() => setPliego((p) => Math.min(ultimo, p + 2))}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
      <figcaption className="flex gap-4 text-[12px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">
        <span>{pliego === 0 ? "la tapa" : pliego >= ultimo ? "la contratapa" : `páginas ${pliego - 1}–${pliego} de ${paginas.length - 4}`}</span>
        {capituloActual ? <><span aria-hidden>·</span><span>{capituloActual}</span></> : null}
      </figcaption>
      <p className="max-w-md text-center text-[12px] leading-relaxed text-[var(--texto-menor)]">
        {datos.blancoYNegro
          ? "Las fotos se ven en gris porque el libro impreso que elegiste es en blanco y negro. En el PDF y en el lector van a color."
          : "Vista estimada: el libro real lo escribe el biógrafo después de encargarlo, y la paginación puede cambiar."}
      </p>
    </figure>
  );
}
