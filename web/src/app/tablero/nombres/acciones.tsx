"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type EntidadPrefill = {
  texto: string;
  contexto: string;
  valorInicial: string;
};

export type Correccion = { original: string; corregido: string };

/**
 * Arma la lista de correcciones a partir de las filas del form, por índice
 * (no por `texto`): dos entidades con el mismo nombre detectado (dos "Juan"
 * distintos) son filas separadas, y cada una que cambió manda su propia
 * entrada — aunque compartan `original`, no se deduplican ni se pisan entre
 * sí. Es una lista para reemplazo textual en la fábrica, no un mapa por
 * nombre.
 */
export function construirCorreccionesCambiadas(
  entidades: EntidadPrefill[],
  valores: string[],
): Correccion[] {
  return entidades
    .map((entidad, indice) => ({
      original: entidad.texto,
      corregido: (valores[indice] ?? entidad.texto).trim(),
    }))
    .filter((correccion) => correccion.corregido !== "" && correccion.corregido !== correccion.original);
}

export function FormularioNombres({ entidades }: { entidades: EntidadPrefill[] }) {
  const router = useRouter();
  // Se indexa por posición, no por `texto`: dos entidades detectadas con el
  // mismo nombre (dos "Juan" distintos — el padre y el vecino) son filas
  // distintas y no pueden compartir clave de estado, o la segunda pisa a la
  // primera y una de las dos correcciones se pierde en silencio.
  const [valores, setValores] = useState<string[]>(entidades.map((entidad) => entidad.valorInicial));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const sinEntidades = entidades.length === 0;

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);

    const correcciones = construirCorreccionesCambiadas(entidades, valores);

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
      {sinEntidades ? (
        <p className="text-sm text-zinc-500">
          Todavía no detectamos nombres para revisar. Puedes confirmar igual para seguir adelante
          — si más adelante aparece alguno, se puede corregir después.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {entidades.map((entidad, indice) => (
            <div key={indice}>
              <label className="text-sm font-medium text-zinc-900" htmlFor={`nombre-${indice}`}>
                {entidad.texto}
              </label>
              <p className="text-xs text-zinc-500">{entidad.contexto}</p>
              <input
                id={`nombre-${indice}`}
                type="text"
                value={valores[indice] ?? ""}
                onChange={(evento) =>
                  setValores((actual) => {
                    const copia = [...actual];
                    copia[indice] = evento.target.value;
                    return copia;
                  })
                }
                className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : sinEntidades ? "Confirmar sin correcciones" : "Guardar"}
        </button>
        {guardado ? <span className="text-sm text-zinc-600">Guardado ✓</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>

      {guardado ? (
        <Link
          href="/comprar"
          className="text-sm font-medium text-zinc-900 underline underline-offset-2"
        >
          Siguiente paso: ver la previsualización →
        </Link>
      ) : null}
    </div>
  );
}
