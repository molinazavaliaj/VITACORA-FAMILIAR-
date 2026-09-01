"use client";

import { useState } from "react";

const MENSAJE_ERROR_GENERICO = "No pudimos iniciar el pago. Intenta de nuevo.";

export function BotonComprar() {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function comprar() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/checkout", { method: "POST" });
      const datos = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        setError(datos?.error ?? MENSAJE_ERROR_GENERICO);
        setEnviando(false);
        return;
      }

      window.location.href = datos.urlPago;
    } catch {
      setError(MENSAJE_ERROR_GENERICO);
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={comprar}
        disabled={enviando}
        className="h-11 rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
      >
        {enviando ? "Un momento..." : "Conseguir su libro y su voz"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
