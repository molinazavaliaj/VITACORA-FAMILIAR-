"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

// La hoja (MOTION.md patrón 8): en el móvil sube desde abajo, en escritorio
// aparece centrada. Es un diálogo de verdad: role="dialog" y aria-modal, el
// foco entra al abrir y vuelve a donde estaba al cerrar, Tab no se escapa,
// Esc y el velo la cierran, y el fondo no se mueve mientras está abierta.
// Al cerrar desde adentro se ve la salida (200 ms) y recién después avisa.

const ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Hoja({
  abierta,
  alCerrar,
  titulo,
  etiquetaCerrar,
  children,
}: {
  abierta: boolean;
  alCerrar: () => void;
  titulo: ReactNode;
  /** Nombre accesible del botón ×, p. ej. «Cerrar». */
  etiquetaCerrar: string;
  children: ReactNode;
}) {
  const idTitulo = useId();
  const hoja = useRef<HTMLDivElement>(null);
  const [cerrando, setCerrando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // alCerrar suele llegar como una flecha nueva en cada render: se guarda en
  // una ref para que el efecto de abrir no se repita (y no robe el foco).
  const avisar = useRef(alCerrar);
  useEffect(() => {
    avisar.current = alCerrar;
  }, [alCerrar]);

  const terminarDeCerrar = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = null;
    setCerrando(false);
    avisar.current();
  }, []);

  const cerrar = useCallback(() => {
    if (temporizador.current) return;
    setCerrando(true);
    // Por si el navegador no corre la animación y no llega animationend.
    temporizador.current = setTimeout(terminarDeCerrar, 300);
  }, [terminarDeCerrar]);

  useEffect(() => {
    if (!abierta) return;
    const antes = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const nodo = hoja.current;
    const primero = nodo?.querySelector<HTMLElement>(ENFOCABLES);
    (primero ?? nodo)?.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar();
        return;
      }
      if (e.key !== "Tab" || !nodo) return;
      const enfocables = Array.from(nodo.querySelectorAll<HTMLElement>(ENFOCABLES));
      if (enfocables.length === 0) {
        e.preventDefault();
        return;
      }
      const inicio = enfocables[0];
      const fin = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === inicio) {
        e.preventDefault();
        fin.focus();
      } else if (!e.shiftKey && document.activeElement === fin) {
        e.preventDefault();
        inicio.focus();
      }
    };
    document.addEventListener("keydown", alTeclear);

    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = overflowAntes;
      antes?.focus();
    };
  }, [abierta, cerrar]);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  if (!abierta) return null;

  return (
    <div
      className="m-overlay fixed inset-0 z-50 flex items-end justify-center min-[700px]:items-center min-[700px]:p-6"
      data-cerrando={cerrando ? "true" : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        data-cerrando={cerrando ? "true" : undefined}
        onAnimationEnd={(e) => {
          if (cerrando && e.target === e.currentTarget) terminarDeCerrar();
        }}
        className="m-hoja relative max-h-[90dvh] w-full max-w-[560px] overflow-y-auto border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] px-6 pb-8 pt-6 text-[var(--texto-oscuro)] outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={idTitulo} className="text-2xl font-medium leading-tight text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label={etiquetaCerrar}
            className="m-ghost -mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-2xl leading-none text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
