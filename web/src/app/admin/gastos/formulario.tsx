"use client";

import { useActionState } from "react";
import { cargarGastoManual, type ResultadoGasto } from "./acciones";

// El formulario del gasto cargado a mano. Es lo único interactivo del panel: el resto es
// mirar. La validación vive en el servidor (`acciones.ts`); acá sólo se muestra el motivo
// si algo no cierra.

const INICIAL: ResultadoGasto = { error: null };

const campo = "rounded border border-[var(--linea)] bg-[var(--fondo)] px-2 py-1 text-sm";

export function FormularioGasto() {
  // `useActionState` le pasa el estado anterior como primer argumento; el action del
  // servidor recibe sólo el formulario (y así se puede probar suelto, sin React).
  const [estado, accion, pendiente] = useActionState(
    async (_estado: ResultadoGasto, datos: FormData) => cargarGastoManual(datos),
    INICIAL,
  );

  return (
    <form action={accion} className="mt-3 flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
          Qué se pagó
          <input className={campo} name="concepto" placeholder="Railway" required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
          Monto
          <input className={campo} name="monto" placeholder="5" inputMode="decimal" required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
          Moneda
          <select className={campo} name="moneda" defaultValue="EUR">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
          Categoría
          <select className={campo} name="categoria" defaultValue="suscripcion">
            <option value="suscripcion">suscripción</option>
            <option value="api">api</option>
            <option value="imprenta">imprenta</option>
            <option value="otro">otro</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--texto-menor)]">
          De quién
          <input className={campo} name="quien" placeholder="naza" />
        </label>
      </div>

      {estado.error ? (
        <p className="text-sm text-[var(--alerta)]" role="alert">
          {estado.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pendiente}
          className="rounded bg-[var(--acento)] px-3 py-1.5 text-sm text-[var(--sobre-acento)] disabled:opacity-60"
        >
          {pendiente ? "guardando…" : "cargar el gasto"}
        </button>
        <span className="text-xs text-[var(--texto-menor)]">
          La fecha de hoy se pone sola. Es lo único que se puede escribir en todo el panel.
        </span>
      </div>
    </form>
  );
}
