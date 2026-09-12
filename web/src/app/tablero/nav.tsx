"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Toroide } from "../marca";

// La navegación del panel: sidebar oscuro en desktop, pestañas abajo en el
// celular. Cliente porque necesita saber en qué historia está parado (lo lee
// de la URL) para que Historias / Preguntas / Encargar libro apunten a ella.

export type HistoriaNav = {
  id: string;
  nombre: string;
  comoLeDicen: string;
  rol: "duena" | "invitado";
};

const SECCIONES = [
  { clave: "inicio", nombre: "Inicio", ruta: (_id: string) => "/tablero" },
  { clave: "historia", nombre: "Historias", ruta: (id: string) => `/tablero/${id}` },
  { clave: "preguntas", nombre: "Preguntas", ruta: (id: string) => `/tablero/${id}/preguntas` },
  { clave: "libro", nombre: "Encargar libro", ruta: (id: string) => `/tablero/${id}/libro` },
] as const;

type Clave = (typeof SECCIONES)[number]["clave"];

/** Qué sección y qué historia describe esta URL. */
export function leerUbicacion(pathname: string, historias: HistoriaNav[]) {
  const partes = pathname.split("/").filter(Boolean); // ['tablero', id?, seccion?]
  const idEnUrl = partes[1];
  const historia = historias.find((h) => h.id === idEnUrl) ?? historias[0] ?? null;
  let seccion: Clave = "inicio";
  if (idEnUrl && historias.some((h) => h.id === idEnUrl)) {
    const tercera = partes[2];
    seccion = tercera === "preguntas" ? "preguntas" : tercera === "libro" ? "libro" : "historia";
  }
  return { historia, seccion };
}

export function Navegacion({ historias }: { historias: HistoriaNav[] }) {
  const pathname = usePathname();
  const { historia, seccion } = leerUbicacion(pathname, historias);
  const [selectorAbierto, setSelectorAbierto] = useState(false);

  const rutaDe = (s: (typeof SECCIONES)[number]) =>
    s.clave === "inicio" ? s.ruta("") : historia ? s.ruta(historia.id) : "/tablero";

  return (
    <>
      {/* ── Desktop: sidebar ─────────────────────────────────────────── */}
      <aside className="oscuro hidden w-64 shrink-0 flex-col bg-[var(--fondo)] text-[var(--texto)] md:flex">
        <div className="flex items-center gap-3 px-6 pt-7 pb-6">
          <Toroide className="h-9 w-9" />
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">
            Vitácora Familiar
          </span>
        </div>

        {/* Selector de historia */}
        <div className="px-4">
          <button
            type="button"
            onClick={() => setSelectorAbierto((v) => !v)}
            aria-expanded={selectorAbierto}
            className="flex w-full items-center justify-between rounded-lg border border-[var(--linea)] px-4 py-3 text-left transition-colors hover:border-[var(--linea-fuerte)]"
          >
            <span className="min-w-0">
              <span className="block text-[10px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">
                {historia?.rol === "invitado" ? "Te invitaron a" : "Historia"}
              </span>
              <span className="block truncate text-[15px] [font-family:var(--fuente-titulo)]">
                {historia ? `La historia de ${historia.nombre}` : "Sin historias todavía"}
              </span>
            </span>
            <span aria-hidden className="ml-2 text-[var(--texto-menor)]">▾</span>
          </button>

          {selectorAbierto ? (
            <ul className="mt-2 flex flex-col gap-1 rounded-lg border border-[var(--linea)] p-2">
              {historias.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/tablero/${h.id}`}
                    onClick={() => setSelectorAbierto(false)}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--linea)] ${h.id === historia?.id ? "bg-[var(--linea)]" : ""}`}
                  >
                    La historia de {h.nombre}
                    {h.rol === "invitado" ? (
                      <span className="ml-2 text-[10px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
                        invitado
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t border-[var(--linea)] pt-1">
                <Link
                  href="/comprar"
                  className="block rounded-md px-3 py-2 text-sm text-[var(--acento)] transition-colors hover:bg-[var(--linea)]"
                >
                  + Empezar otra historia
                </Link>
              </li>
            </ul>
          ) : null}
        </div>

        <nav className="mt-6 flex flex-col gap-1 px-4" aria-label="Secciones del panel">
          {SECCIONES.map((s) => {
            const activa = s.clave === seccion;
            return (
              <Link
                key={s.clave}
                href={rutaDe(s)}
                aria-current={activa ? "page" : undefined}
                className={`rounded-md px-4 py-2.5 text-[15px] transition-colors [font-family:var(--fuente-micro)] ${
                  activa
                    ? "bg-[var(--linea)] text-[var(--texto)]"
                    : "text-[var(--texto-suave)] hover:bg-[var(--linea)] hover:text-[var(--texto)]"
                }`}
              >
                {s.nombre}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 pb-6">
          <p className="text-[11px] leading-relaxed text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            Para las vidas que merecen su propio libro
          </p>
        </div>
      </aside>

      {/* ── Mobile: cabecera con la historia + pestañas abajo ───────── */}
      <header className="oscuro flex items-center justify-between bg-[var(--fondo)] px-5 py-4 text-[var(--texto)] md:hidden">
        <div className="flex items-center gap-3">
          <Toroide className="h-7 w-7" />
          <span className="text-[15px] [font-family:var(--fuente-titulo)]">
            {historia ? `La historia de ${historia.nombre}` : "Vitácora"}
          </span>
        </div>
        {historias.length > 1 ? (
          <Link href="/tablero" className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
            cambiar
          </Link>
        ) : null}
      </header>

      <nav
        aria-label="Secciones del panel"
        className="oscuro fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-[var(--linea)] bg-[var(--fondo)] md:hidden"
      >
        {SECCIONES.map((s) => {
          const activa = s.clave === seccion;
          return (
            <Link
              key={s.clave}
              href={rutaDe(s)}
              aria-current={activa ? "page" : undefined}
              className={`py-3 text-center text-[11px] [font-family:var(--fuente-micro)] ${
                activa ? "text-[var(--texto)]" : "text-[var(--texto-menor)]"
              }`}
            >
              {s.nombre}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
