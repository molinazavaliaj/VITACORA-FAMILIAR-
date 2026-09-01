"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type EntidadPrefill = {
  texto: string;
  contexto: string;
  valorInicial: string;
};

export function FormularioNombres({ entidades }: { entidades: EntidadPrefill[] }) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(entidades.map((entidad) => [entidad.texto, entidad.valorInicial])),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  if (entidades.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no detectamos nombres para revisar. En cuanto arme el libro, van a aparecer acá.
      </p>
    );
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);

    const correcciones = entidades
      .map((entidad) => ({
        original: entidad.texto,
        corregido: (valores[entidad.texto] ?? entidad.texto).trim(),
      }))
      .filter((correccion) => correccion.corregido !== "" && correccion.corregido !== correccion.original);

    try {
      const respuesta = await fetch("/api/nombres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correcciones }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setError(datos?.error ?? "No pudimos guardar las correcciones. Intenta de nuevo.");
        setGuardando(false);
        return;
      }

      setGuardado(true);
      setGuardando(false);
      router.refresh();
    } catch {
      setError("No pudimos guardar las correcciones. Intenta de nuevo.");
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5">
        {entidades.map((entidad) => (
          <div key={entidad.texto}>
            <label
              className="text-sm font-medium text-zinc-900"
              htmlFor={`nombre-${entidad.texto}`}
            >
              {entidad.texto}
            </label>
            <p className="text-xs text-zinc-500">{entidad.contexto}</p>
            <input
              id={`nombre-${entidad.texto}`}
              type="text"
              value={valores[entidad.texto] ?? ""}
              onChange={(evento) =>
                setValores((actual) => ({ ...actual, [entidad.texto]: evento.target.value }))
              }
              className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {guardado ? <span className="text-sm text-zinc-600">Guardado ✓</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </div>
  );
}
