"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Toroide } from "../marca";

// La navegación del panel (rediseño 2026-10, fase 2): una cabecera de tinta
// arriba, en los dos temas, con el logo, las tres secciones, el selector de
// historia, el tema y la cuenta. En el celular las secciones siguen abajo en
// pestañas, como antes. Cliente porque necesita saber en qué historia está
// parado (lo lee de la URL) para que Historias / Encargar libro apunten a ella.
//
// Al cambiar de historia se queda en la misma pantalla (la historia, Encargar
// libro, el lector, las frases), como hacía el riel. El enlace marca «cargando»
// al instante (useLinkStatus) mientras llega el esqueleto de la otra.

export type HistoriaNav = {
  id: string;
  nombre: string;
  comoLeDicen: string;
  rol: "duena" | "invitado" | "visitante";
  propia?: boolean;
  /** Cómo va, en pocas palabras (lo del riel de antes). */
  estadoCorto?: string;
};

// Tres secciones (decisión del 13/09): "Preguntas" dejó de ser una sección —
// el guion se edita desde la historia.
type Clave = "inicio" | "historia" | "libro" | "cuenta";

const SECCIONES: ReadonlyArray<{ clave: Clave; nombre: string; corto: string; ruta: (id: string) => string }> = [
  { clave: "inicio", nombre: "Inicio", corto: "Inicio", ruta: () => "/tablero" },
  { clave: "historia", nombre: "Historias", corto: "Historias", ruta: (id) => `/tablero/${id}` },
  { clave: "libro", nombre: "Encargar libro", corto: "Libro", ruta: (id) => `/tablero/${id}/libro` },
];

/** Las pantallas de una historia que se conservan al cambiar de historia. */
const SUFIJOS_QUE_SIGUEN = ["libro", "leer", "frases"];

/** Qué sección y qué historia describe esta URL. */
export function leerUbicacion(pathname: string, historias: HistoriaNav[]) {
  const partes = pathname.split("/").filter(Boolean); // ['tablero', id?, seccion?]
  const idEnUrl = partes[1];
  const historia = historias.find((h) => h.id === idEnUrl) ?? historias[0] ?? null;
  let seccion: Clave = idEnUrl === "cuenta" ? "cuenta" : "inicio";
  if (idEnUrl && historias.some((h) => h.id === idEnUrl)) {
    const tercera = partes[2];
    // /preguntas, /nombres y /leer son sub-pantallas de la historia.
    seccion = tercera === "libro" ? "libro" : "historia";
  }
  return { historia, seccion };
}

/** Adónde lleva otra historia desde esta URL: la misma pantalla si existe en todas, si no, la historia. */
export function rutaDeOtraHistoria(pathname: string, id: string): string {
  const tercera = pathname.split("/").filter(Boolean)[2];
  return tercera && SUFIJOS_QUE_SIGUEN.includes(tercera) ? `/tablero/${id}/${tercera}` : `/tablero/${id}`;
}

const nombreDe = (h: HistoriaNav) => (h.propia ? "Tu historia" : `La historia de ${h.nombre}`);

function Icono({ clave, className = "" }: { clave: Clave; className?: string }) {
  const comun = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
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
    <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** El punto que late mientras la otra historia carga (adentro de su <Link>). */
function Cargando() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current transition-opacity ${pending ? "opacity-80 motion-safe:animate-pulse" : "opacity-0"}`} />;
}

/** Cierra un menú al tocar afuera y con Escape. */
function useCerrarAfuera(abierto: boolean, cerrar: () => void, marca: string) {
  useEffect(() => {
    if (!abierto) return;
    const alClic = (e: MouseEvent) => {
      if (!(e.target as Element).closest(`[data-${marca}]`)) cerrar();
    };
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto, cerrar, marca]);
}

const itemMenu = "flex min-h-11 items-center justify-between gap-3 rounded-[4px] px-3 py-2 text-[14px] text-[var(--dir-sobre-tinta)] transition-colors hover:bg-[rgba(238,234,225,0.07)] [font-family:var(--fuente-micro)]";

export function Navegacion({
  historias,
  tema,
  correo,
  inicial,
}: {
  historias: HistoriaNav[];
  tema?: ReactNode;
  /** El correo con el que entró: va arriba del menú de la cuenta. */
  correo?: string | null;
  /** La letra del círculo de la cuenta. */
  inicial?: string;
}) {
  const pathname = usePathname();
  const { historia, seccion } = leerUbicacion(pathname, historias);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [cuentaAbierta, setCuentaAbierta] = useState(false);

  // Los menús se cierran al navegar, al tocar afuera y con Escape.
  useEffect(() => {
    setSelectorAbierto(false);
    setCuentaAbierta(false);
  }, [pathname]);
  useCerrarAfuera(selectorAbierto, () => setSelectorAbierto(false), "selector");
  useCerrarAfuera(cuentaAbierta, () => setCuentaAbierta(false), "cuenta");

  const rutaDe = (s: (typeof SECCIONES)[number]) =>
    s.clave === "inicio" ? s.ruta("") : historia ? s.ruta(historia.id) : "/tablero";

  const listaHistorias = (
    <ul className="flex flex-col gap-0.5 p-1.5" role="list">
      {historias.map((h) => {
        const actual = h.id === historia?.id;
        return (
          <li key={h.id}>
            <Link href={rutaDeOtraHistoria(pathname, h.id)} aria-current={actual ? "true" : undefined} className={`${itemMenu} ${actual ? "bg-[rgba(238,234,225,0.07)]" : ""}`}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] [font-family:var(--fuente-titulo)]">{nombreDe(h)}</span>
                {h.estadoCorto || h.rol !== "duena" ? (
                  <span className="truncate text-[12px] text-[var(--dir-sobre-tinta-suave)]">
                    {h.rol === "invitado" ? "te invitaron · " : h.rol === "visitante" ? "la guardaste · " : ""}
                    {h.estadoCorto ?? ""}
                  </span>
                ) : null}
              </span>
              <Cargando />
            </Link>
          </li>
        );
      })}
      <li className="mt-1 border-t border-[rgba(238,234,225,0.12)] pt-1">
        <Link href="/comprar" className={itemMenu}>
          + Empezar otra historia
        </Link>
      </li>
    </ul>
  );

  const etiquetaHistoria = historia ? nombreDe(historia) : "Vitácora";

  return (
    <>
      <header className="pnl-cabecera">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-2 px-4 sm:gap-3 sm:px-8 md:h-[72px] md:gap-8">
          <Link href="/tablero" className="flex min-h-11 shrink-0 items-center gap-3 text-[var(--dir-sobre-tinta)]" aria-label="Vitácora, inicio del panel">
            <Toroide className="h-6 w-auto" />
            <span aria-hidden className="pnl-marca hidden sm:inline">
              VITÁCORA
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Secciones del panel">
            {SECCIONES.map((s) => (
              <Link key={s.clave} href={rutaDe(s)} aria-current={s.clave === seccion ? "page" : undefined} className="pnl-nav-enlace">
                {s.nombre}
              </Link>
            ))}
          </nav>

          <div className="relative flex min-w-0 flex-1 justify-center md:justify-end" data-selector>
            {historias.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectorAbierto((v) => !v)}
                aria-expanded={selectorAbierto}
                aria-label={`Cambiar de historia. Ahora, ${etiquetaHistoria}`}
                className="flex min-h-11 min-w-0 items-center gap-2 rounded-full px-3 text-[var(--dir-sobre-tinta)] transition-colors hover:bg-[rgba(238,234,225,0.06)]"
              >
                <span className="truncate text-[15px] italic [font-family:var(--fuente-titulo)]">{etiquetaHistoria}</span>
                <Chevron abierto={selectorAbierto} />
              </button>
            ) : null}
            {selectorAbierto ? <div className="pnl-menu left-1/2 w-[min(320px,calc(100vw-32px))] -translate-x-1/2 md:left-auto md:translate-x-0">{listaHistorias}</div> : null}
          </div>

          <span className="shrink-0">{tema}</span>

          <div className="relative shrink-0" data-cuenta>
            <button type="button" onClick={() => setCuentaAbierta((v) => !v)} aria-expanded={cuentaAbierta} aria-label="Tu cuenta y salir" className="pnl-avatar">
              <span aria-hidden>{inicial || "·"}</span>
            </button>
            {cuentaAbierta ? (
              <div className="pnl-menu">
                {correo ? <p className="truncate border-b border-[rgba(238,234,225,0.12)] px-4 py-3 text-[13px] text-[var(--dir-sobre-tinta-suave)] [font-family:var(--fuente-micro)]">{correo}</p> : null}
                <div className="flex flex-col p-1.5">
                  <Link href="/tablero/cuenta" aria-current={pathname === "/tablero/cuenta" ? "page" : undefined} className={itemMenu}>
                    Tu cuenta
                  </Link>
                  <Link href="/comprar" className={itemMenu}>
                    + Empezar otra historia
                  </Link>
                  <a href="/api/auth/salir" className={itemMenu}>
                    Cerrar sesión
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <div aria-hidden className="pnl-deckle" />

      {/* ── Celular: las secciones en pestañas abajo, como siempre ─────── */}
      <nav aria-label="Secciones del panel" className="pnl-pestanas fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {SECCIONES.map((s) => {
          const activa = s.clave === seccion;
          return (
            <Link
              key={s.clave}
              href={rutaDe(s)}
              aria-current={activa ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] [font-family:var(--fuente-micro)] [touch-action:manipulation] ${activa ? "text-[var(--texto)]" : "text-[var(--texto-menor)]"}`}
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
