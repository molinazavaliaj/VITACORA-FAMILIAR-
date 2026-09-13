"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Toroide } from "../marca";

// La navegación del panel: sidebar en desktop, pestañas abajo en el
// celular. Cliente porque necesita saber en qué historia está parado (lo lee
// de la URL) para que Historias / Preguntas / Encargar libro apunten a ella.
//
// Cada sección lleva ícono + nombre (un ícono solo no se entiende; un nombre
// solo, en el celular, se pierde). Los íconos son SVG de línea, un solo
// grosor, como manda docs/design.md: nada de emojis.

export type HistoriaNav = {
  id: string;
  nombre: string;
  comoLeDicen: string;
  rol: "duena" | "invitado" | "visitante";
};

// Tres secciones (decisión del 13/09): "Preguntas" dejó de ser una sección —
// el guion se edita desde la historia.
type Clave = "inicio" | "historia" | "libro";

const SECCIONES: ReadonlyArray<{ clave: Clave; nombre: string; corto: string; ruta: (id: string) => string }> = [
  { clave: "inicio", nombre: "Inicio", corto: "Inicio", ruta: () => "/tablero" },
  { clave: "historia", nombre: "Historias", corto: "Historias", ruta: (id) => `/tablero/${id}` },
  { clave: "libro", nombre: "Encargar libro", corto: "Libro", ruta: (id) => `/tablero/${id}/libro` },
];

/** Qué sección y qué historia describe esta URL. */
export function leerUbicacion(pathname: string, historias: HistoriaNav[]) {
  const partes = pathname.split("/").filter(Boolean); // ['tablero', id?, seccion?]
  const idEnUrl = partes[1];
  const historia = historias.find((h) => h.id === idEnUrl) ?? historias[0] ?? null;
  let seccion: Clave = "inicio";
  if (idEnUrl && historias.some((h) => h.id === idEnUrl)) {
    const tercera = partes[2];
    // /preguntas, /nombres y /descarga son sub-pantallas de la historia.
    seccion = tercera === "libro" ? "libro" : "historia";
  }
  return { historia, seccion };
}

function Icono({ clave, className = "" }: { clave: Clave; className?: string }) {
  const comun = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (clave) {
    case "inicio":
      return (
        <svg {...comun}>
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6.5 10v9h11v-9" />
        </svg>
      );
    case "historia":
      return (
        <svg {...comun}>
          <path d="M5 4.5h5.5a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H5z" />
          <path d="M19 4.5h-5.5a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5H19z" />
        </svg>
      );
    case "libro":
      return (
        <svg {...comun}>
          <path d="M6 3.5h12v17H6z" />
          <path d="M6 3.5v17M9 8h6M9 11h6" />
        </svg>
      );
  }
}

function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function etiquetaDeRol(h: HistoriaNav | null) {
  if (!h) return "Historia";
  return h.rol === "invitado" ? "Te invitaron a" : h.rol === "visitante" ? "Guardaste" : "Historia";
}

const foco = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)]";

export function Navegacion({ historias, tema }: { historias: HistoriaNav[]; tema?: ReactNode }) {
  const pathname = usePathname();
  const { historia, seccion } = leerUbicacion(pathname, historias);
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  // El selector se cierra al navegar, al tocar afuera y con Escape.
  useEffect(() => setSelectorAbierto(false), [pathname]);
  useEffect(() => {
    if (!selectorAbierto) return;
    const alClic = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-selector]")) setSelectorAbierto(false);
    };
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && setSelectorAbierto(false);
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [selectorAbierto]);

  const rutaDe = (s: (typeof SECCIONES)[number]) =>
    s.clave === "inicio" ? s.ruta("") : historia ? s.ruta(historia.id) : "/tablero";

  const listaHistorias = (
    <ul className="flex flex-col gap-0.5 p-1.5" role="list">
      {historias.map((h) => {
        const actual = h.id === historia?.id;
        return (
          <li key={h.id}>
            <Link
              href={`/tablero/${h.id}`}
              aria-current={actual ? "true" : undefined}
              className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors hover:bg-[var(--linea)] ${foco} ${actual ? "bg-[var(--linea)]" : ""}`}
            >
              <span className="truncate [font-family:var(--fuente-titulo)]">La historia de {h.nombre}</span>
              {h.rol !== "duena" ? (
                <span className="shrink-0 text-[10px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
                  {h.rol === "invitado" ? "invitado" : "muestra"}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
      <li className="mt-1 border-t border-[var(--linea)] pt-1">
        <Link href="/comprar" className={`block rounded-md px-3 py-2.5 text-[14px] text-[var(--acento)] transition-colors hover:bg-[var(--linea)] ${foco} [font-family:var(--fuente-micro)]`}>
          + Empezar otra historia
        </Link>
      </li>
    </ul>
  );

  return (
    <>
      {/* ── Desktop: sidebar ─────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--linea)] bg-[var(--fondo)] text-[var(--texto)] md:flex">
        <Link href="/tablero" className={`flex items-center gap-3 px-6 pb-6 pt-7 ${foco}`} aria-label="Vitácora Familiar, inicio del panel">
          <Toroide className="h-9 w-9" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</span>
        </Link>

        {/* Selector de historia */}
        <div className="relative px-4" data-selector>
          <button
            type="button"
            onClick={() => setSelectorAbierto((v) => !v)}
            aria-expanded={selectorAbierto}
            aria-haspopup="listbox"
            className={`flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--linea)] px-4 py-3 text-left transition-colors hover:border-[var(--linea-fuerte)] ${foco}`}
          >
            <span className="min-w-0">
              <span className="block text-[10px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                {etiquetaDeRol(historia)}
              </span>
              <span className="block truncate text-[15px] [font-family:var(--fuente-titulo)]">
                {historia ? `La historia de ${historia.nombre}` : "Sin historias todavía"}
              </span>
            </span>
            <Chevron abierto={selectorAbierto} />
          </button>

          {selectorAbierto ? (
            <div className="absolute inset-x-4 top-full z-20 mt-2 rounded-lg border border-[var(--linea-fuerte)] bg-[var(--fondo)] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]">
              {listaHistorias}
            </div>
          ) : null}
        </div>

        <nav className="mt-6 flex flex-col gap-0.5 px-4" aria-label="Secciones del panel">
          {SECCIONES.map((s) => {
            const activa = s.clave === seccion;
            return (
              <Link
                key={s.clave}
                href={rutaDe(s)}
                aria-current={activa ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-md px-4 py-2.5 text-[15px] transition-colors [font-family:var(--fuente-micro)] ${foco} ${
                  activa
                    ? "bg-[var(--linea)] text-[var(--texto)]"
                    : "text-[var(--texto-suave)] hover:bg-[var(--linea)] hover:text-[var(--texto)]"
                }`}
              >
                {activa ? <span aria-hidden className="absolute -left-4 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-[var(--texto)]" /> : null}
                <Icono clave={s.clave} className={`h-5 w-5 shrink-0 ${activa ? "" : "opacity-70"}`} />
                {s.nombre}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 pb-6">
          <p className="text-[11px] italic leading-relaxed text-[var(--texto-menor)] [font-family:var(--fuente-cuerpo)]">
            Para las vidas que merecen su propio libro
          </p>
        </div>
      </aside>

      {/* ── Mobile: cabecera con la historia + pestañas abajo ───────── */}
      <header className="sticky top-0 z-20 border-b border-[var(--linea)] bg-[var(--fondo)] text-[var(--texto)] md:hidden" data-selector>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/tablero" className={`flex shrink-0 items-center rounded-full p-1 ${foco}`} aria-label="Inicio del panel">
            <Toroide className="h-7 w-7" />
          </Link>
          {historias.length > 1 ? (
            <button
              type="button"
              onClick={() => setSelectorAbierto((v) => !v)}
              aria-expanded={selectorAbierto}
              className={`flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 ${foco}`}
            >
              <span className="truncate text-[15px] [font-family:var(--fuente-titulo)]">
                {historia ? `La historia de ${historia.nombre}` : "Vitácora"}
              </span>
              <Chevron abierto={selectorAbierto} />
            </button>
          ) : (
            <p className="min-w-0 flex-1 truncate text-center text-[15px] [font-family:var(--fuente-titulo)]">
              {historia ? `La historia de ${historia.nombre}` : "Vitácora"}
            </p>
          )}
          <span className="shrink-0">{tema}</span>
        </div>
        {selectorAbierto && historias.length > 1 ? (
          <div className="border-t border-[var(--linea)] px-2 pb-2">{listaHistorias}</div>
        ) : null}
      </header>

      <nav
        aria-label="Secciones del panel"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-[var(--linea)] bg-[var(--fondo)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {SECCIONES.map((s) => {
          const activa = s.clave === seccion;
          return (
            <Link
              key={s.clave}
              href={rutaDe(s)}
              aria-current={activa ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] [font-family:var(--fuente-micro)] [touch-action:manipulation] ${foco} ${
                activa ? "text-[var(--texto)]" : "text-[var(--texto-menor)]"
              }`}
            >
              <Icono clave={s.clave} className="h-5.5 w-5.5" />
              <span className={activa ? "font-medium" : ""}>{s.corto}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
