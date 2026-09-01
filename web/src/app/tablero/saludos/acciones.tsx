"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Saludo } from "./page";

export function EnlaceCompartir({
  enlace,
  comoLeDicen,
}: {
  enlace: string;
  comoLeDicen: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Si el navegador no permite copiar, el link ya está visible para copiar a mano.
    }
  }

  const textoWhatsapp = encodeURIComponent(
    `Grábale un mensaje a ${comoLeDicen}: ${enlace}`,
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <p className="truncate text-sm text-zinc-700">{enlace}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copiar}
          className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          {copiado ? "¡Copiado!" : "Copiar link"}
        </button>
        <a
          href={`https://wa.me/?text=${textoWhatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Compartir por WhatsApp
        </a>
      </div>
    </div>
  );
}

export function ListaSaludos({ saludos }: { saludos: Saludo[] }) {
  if (saludos.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no llegó ningún saludo. En cuanto alguien grabe uno, aparece acá.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {saludos.map((saludo) => (
        <ItemSaludo key={saludo.id} saludo={saludo} />
      ))}
    </div>
  );
}

function ItemSaludo({ saludo }: { saludo: Saludo }) {
  const router = useRouter();
  const [borrando, setBorrando] = useState(false);
  const [borrado, setBorrado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (borrado) return null;

  const fecha = new Date(saludo.created_at).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function borrar() {
    setBorrando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/saludos/${saludo.id}`, { method: "DELETE" });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setError(datos?.error ?? "No pudimos borrar el saludo. Intenta de nuevo.");
        setBorrando(false);
        return;
      }
      setBorrado(true);
      router.refresh();
    } catch {
      setError("No pudimos borrar el saludo. Intenta de nuevo.");
      setBorrando(false);
    }
  }

  return (
    <div className="border-b border-zinc-100 pb-5 last:border-none">
      <p className="text-sm font-medium text-zinc-900">
        {saludo.nombre} <span className="font-normal text-zinc-500">— {saludo.vinculo}</span>
      </p>
      <p className="text-xs text-zinc-400">{fecha}</p>
      <div className="mt-2">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls src={`/api/saludo-audio/${saludo.id}`} className="w-full" />
      </div>
      <div className="mt-2 flex items-center gap-3">
        {saludo.entregado ? (
          <span className="text-xs text-zinc-400">Ya entregado</span>
        ) : (
          <button
            type="button"
            onClick={borrar}
            disabled={borrando}
            className="text-xs text-red-600 underline decoration-red-300 underline-offset-2 hover:text-red-800 disabled:opacity-60"
          >
            {borrando ? "Borrando..." : "Borrar"}
          </button>
        )}
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    </div>
  );
}
