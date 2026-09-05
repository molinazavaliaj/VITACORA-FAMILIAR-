"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function patchNarrador(narradorId: string, accion: "apagar_alerta" | "cierre_anticipado") {
  return fetch(`/api/narrador/${narradorId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion }),
  });
}

export function BannerAlertaSilencio({
  narradorId,
  comoLeDicen,
}: {
  narradorId: string;
  comoLeDicen: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (oculto) return null;

  async function marcarLlamada() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await patchNarrador(narradorId, "apagar_alerta");
      if (!respuesta.ok) {
        setError("No pudimos apagar la alerta. Intenta de nuevo.");
        setEnviando(false);
        return;
      }
      setOculto(true);
      router.refresh();
    } catch {
      setError("No pudimos apagar la alerta. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-relaxed text-red-800">
        {comoLeDicen} lleva 3 días sin responder — un llamadito tuyo ayuda más que
        cualquier recordatorio nuestro
      </p>
      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        <button
          type="button"
          onClick={marcarLlamada}
          disabled={enviando}
          className="h-10 rounded-full bg-red-700 px-5 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-60"
        >
          {enviando ? "Marcando..." : "Ya hablamos"}
        </button>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}

export function CierreAnticipado({ narradorId }: { narradorId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  if (hecho) {
    return (
      <p className="mt-8 text-sm text-zinc-500">
        Cerramos la bitácora. Vamos a armar el libro con los capítulos que ya tiene.
      </p>
    );
  }

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await patchNarrador(narradorId, "cierre_anticipado");
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setError(datos?.error ?? "No pudimos cerrar la bitácora. Intenta de nuevo.");
        setEnviando(false);
        return;
      }
      setHecho(true);
      router.refresh();
    } catch {
      setError("No pudimos cerrar la bitácora. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-8 text-sm text-zinc-400 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-600"
      >
        ¿Necesitas cerrar la bitácora antes de tiempo?
      </button>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-5">
      <p className="text-sm leading-relaxed text-zinc-700">
        Si necesitas cerrar la bitácora ahora, vamos a armar el libro con los capítulos que
        ya tiene. Esta acción no se puede deshacer.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={confirmar}
          disabled={enviando}
          className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {enviando ? "Cerrando..." : "Sí, cerrar la bitácora"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          disabled={enviando}
          className="h-10 rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
        >
          Volver
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
