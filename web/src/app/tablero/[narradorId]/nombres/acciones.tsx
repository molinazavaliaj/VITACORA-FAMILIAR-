"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parecidosAnteriores, resaltar } from "@/lib/citas";

export type EntidadPrefill = {
  texto: string;
  contexto: string;
  /** Las oraciones donde lo dijo, con el número de pregunta (lib/citas). Vacío = solo la paráfrasis. */
  citas?: { orden: number; frase: string }[];
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

export function FormularioNombres({ entidades, narradorId }: { entidades: EntidadPrefill[]; narradorId: string }) {
  const router = useRouter();
  // Se indexa por posición, no por `texto`: dos entidades detectadas con el
  // mismo nombre (dos "Juan" distintos — el padre y el vecino) son filas
  // distintas y no pueden compartir clave de estado, o la segunda pisa a la
  // primera y una de las dos correcciones se pierde en silencio.
  const [valores, setValores] = useState<string[]>(entidades.map((entidad) => entidad.valorInicial));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  // "NASA — ¿es la misma persona que Naza?" (18/09): se sugiere, la familia decide.
  // `descartados` recuerda los "No, es otra" para no volver a preguntar.
  const parecidos = parecidosAnteriores(entidades.map((e) => e.texto));
  const [descartados, setDescartados] = useState<Set<number>>(new Set());

  const sinEntidades = entidades.length === 0;

  async function guardar() {
    setGuardando(true);
    setError(null);
    setGuardado(false);

    const correcciones = construirCorreccionesCambiadas(entidades, valores);

    try {
      const respuesta = await fetch(`/api/nombres?narrador=${encodeURIComponent(narradorId)}`, {
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
        <p className="text-sm text-[var(--texto-menor)]">
          Todavía no detectamos nombres para revisar. Puedes confirmar igual para seguir adelante
          — si más adelante aparece alguno, se puede corregir después.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {entidades.map((entidad, indice) => (
            <div key={indice}>
              <label className="text-sm font-medium text-[var(--texto)]" htmlFor={`nombre-${indice}`}>
                {entidad.texto}
              </label>
              {(entidad.citas ?? []).length > 0 ? (
                <ul className="mt-1 flex flex-col gap-1.5">
                  {(entidad.citas ?? []).map((cita, j) => {
                    const partes = resaltar(cita.frase, entidad.texto);
                    return (
                      <li key={j} className="flex gap-2 text-[13px] leading-snug text-[var(--texto-suave)]">
                        <span className="shrink-0 text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.12em] tabular-nums">P{cita.orden}</span>
                        <span className="italic">
                          {partes ? (
                            <>“{partes[0]}<mark className="rounded-sm bg-[var(--hueco)] px-0.5 not-italic font-medium text-[var(--texto)]">{partes[1]}</mark>{partes[2]}”</>
                          ) : (
                            <>“{cita.frase}”</>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {/* La pista del modelo ("posible transcripción errónea de…") va siempre, debajo de las frases. */}
              {entidad.contexto ? <p className="mt-1 text-xs text-[var(--texto-menor)]">{entidad.contexto}</p> : null}
              {parecidos.has(indice) && !descartados.has(indice) ? (
                (() => {
                  const otro = parecidos.get(indice)![0];
                  const nombreOtro = (valores[otro] ?? entidades[otro].texto).trim() || entidades[otro].texto;
                  return (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-[var(--linea-fuerte)] bg-[var(--hueco)] px-3 py-2 text-[13px]">
                      <span>Suena igual que <strong className="font-medium">{nombreOtro}</strong>. ¿Es la misma persona?</span>
                      <button type="button" className="rounded-full bg-[var(--texto)] px-3 py-1 text-[12px] text-[var(--fondo)] [font-family:var(--fuente-micro)]" onClick={() => setValores((actual) => { const copia = [...actual]; copia[indice] = nombreOtro; return copia; })}>
                        Sí, es {nombreOtro}
                      </button>
                      <button type="button" className="rounded-full border border-[var(--linea-fuerte)] px-3 py-1 text-[12px] [font-family:var(--fuente-micro)]" onClick={() => setDescartados((d) => new Set(d).add(indice))}>
                        No, es otra
                      </button>
                    </div>
                  );
                })()
              ) : null}
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
                className="mt-1 h-10 w-full rounded-md border border-[var(--linea-fuerte)] px-3 text-sm text-[var(--texto)] focus:border-[var(--texto)] focus:outline-none"
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
          className="h-10 rounded-full bg-[var(--texto)] px-5 text-sm font-medium text-[var(--fondo)] transition-opacity hover:opacity-85 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : sinEntidades ? "Confirmar sin correcciones" : "Guardar"}
        </button>
        {guardado ? <span className="text-sm text-[var(--texto-suave)]">Guardado ✓</span> : null}
        {error ? <span className="text-sm text-[var(--alerta)]">{error}</span> : null}
      </div>

      {guardado ? (
        <Link
          href="/tablero"
          className="text-sm font-medium text-[var(--texto)] underline underline-offset-2"
        >
          Siguiente paso: su libro →
        </Link>
      ) : null}
    </div>
  );
}
