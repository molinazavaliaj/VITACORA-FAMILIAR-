"use client";

import { useActionState, type ReactNode } from "react";
import type { ResultadoCreador } from "./acciones";

// Un formulario del panel de creadores: manda a una de las acciones del
// servidor (acciones.ts) y muestra el motivo si algo no cierra, o el «listo».
// La validación y el permiso viven en el servidor; acá solo se muestra.

const INICIAL: ResultadoCreador = { error: null };

const BOTON = {
  lleno: "rounded bg-[var(--acento)] px-3 py-1.5 text-sm text-[var(--sobre-acento)] disabled:opacity-60",
  hilo: "rounded border border-[var(--linea-fuerte)] px-3 py-1.5 text-sm text-[var(--texto-suave)] disabled:opacity-60",
};

export function FormAccion({
  accion,
  boton,
  estilo = "lleno",
  confirmar,
  children,
  className = "",
}: {
  accion: (datos: FormData) => Promise<ResultadoCreador>;
  boton: string;
  estilo?: keyof typeof BOTON;
  /** Una pregunta antes de mandar (rechazar, marcar pagado, anular). */
  confirmar?: string;
  children?: ReactNode;
  className?: string;
}) {
  // `useActionState` le pasa el estado anterior como primer argumento; la acción
  // del servidor recibe sólo el formulario (y así se prueba suelta, sin React).
  const [estado, enviar, pendiente] = useActionState(async (_estado: ResultadoCreador, datos: FormData) => accion(datos), INICIAL);

  return (
    <form action={enviar} className={`flex flex-wrap items-end gap-2 ${className}`}>
      {children}
      <button
        type="submit"
        disabled={pendiente}
        className={BOTON[estilo]}
        // Cancelar el clic cancela el envío (antes de que React tome el formulario).
        onClick={(ev) => {
          if (confirmar && !window.confirm(confirmar)) ev.preventDefault();
        }}
      >
        {pendiente ? "guardando…" : boton}
      </button>
      {estado.error ? (
        <p className="w-full text-sm text-[var(--alerta)]" role="alert">
          {estado.error}
        </p>
      ) : estado.listo ? (
        <p className="w-full text-sm text-[var(--texto-suave)]" role="status">
          {estado.listo}
        </p>
      ) : null}
    </form>
  );
}
