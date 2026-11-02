"use client";

import { useState, useTransition } from "react";
import { marcarTodosVistos, marcarVisto } from "./acciones";

// Los dos botones de la pantalla: marcar un aviso como visto, o todos de una.
// La acción vuelve a pintar el panel (revalidatePath), así que acá sólo se muestra
// el "marcando…" y el motivo si algo no salió.

const boton = "adm-boton adm-boton--hilo adm-boton--chico";

export function BotonVisto({ id }: { id: string }) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className={boton}
        disabled={pendiente}
        onClick={() => empezar(async () => setError((await marcarVisto(id)).error))}
      >
        {pendiente ? "marcando…" : "visto"}
      </button>
      {error ? <span className="text-xs text-[var(--alerta)]" role="alert">{error}</span> : null}
    </span>
  );
}

export function BotonTodosVistos({ cuantos }: { cuantos: number }) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (cuantos === 0) return null;
  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        className="adm-boton"
        disabled={pendiente}
        onClick={() => empezar(async () => setError((await marcarTodosVistos()).error))}
      >
        {pendiente ? "marcando…" : `marcar los ${cuantos} como vistos`}
      </button>
      {error ? <span className="text-sm text-[var(--alerta)]" role="alert">{error}</span> : null}
    </span>
  );
}
