"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { FOCO_CENTRO, NOMBRE_POSICION, POSICIONES, POSICION_DEFAULT, objectPosition, type Foco, type Posicion } from "@/lib/encuadre";

// Encuadrar una foto (3b.6, 18/09). No es un recorte libre: la familia toca el
// punto de la foto que tiene que quedar a la vista (la cara, no el techo) y ve
// al lado cómo queda recortada en ese lugar del libro. Para la portada del
// capítulo, además, elige si va arriba del título o debajo, antes del texto.
// Se guarda en `fotos.foco` / `fotos.posicion`; la fábrica aplica lo mismo.

type Foto = { id: string; foco?: Foco; posicion?: Posicion };

export function Encuadrar({ foto, proporcion, conPosicion, nombreLugar }: { foto: Foto; proporcion: string; conPosicion: boolean; nombreLugar: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [foco, setFoco] = useState<Foco>(foto.foco ?? FOCO_CENTRO);
  const [posicion, setPosicion] = useState<Posicion>(foto.posicion ?? POSICION_DEFAULT);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [abierto]);

  function elegirPunto(e: MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    setFoco({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
  }

  async function guardar() {
    setOcupado(true);
    setError(null);
    try {
      const cuerpo: Record<string, unknown> = { foco };
      if (conPosicion) cuerpo.posicion = posicion;
      const r = await fetch(`/api/fotos/${foto.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar el encuadre.");
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el encuadre.");
    } finally {
      setOcupado(false);
    }
  }

  const enlace = "text-[12px] text-[var(--texto-menor)] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)] [font-family:var(--fuente-micro)]";

  if (!abierto) {
    return (
      <button type="button" className={`${enlace} self-start`} onClick={() => { setFoco(foto.foco ?? FOCO_CENTRO); setPosicion(foto.posicion ?? POSICION_DEFAULT); setAbierto(true); }}>
        Encuadrar{conPosicion ? " y ubicar" : ""}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[rgba(20,20,15,0.55)] sm:items-center sm:p-6" onClick={() => setAbierto(false)} role="presentation">
      <div role="dialog" aria-modal aria-label={`Encuadrar la foto para ${nombreLugar}`} onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-[var(--texto)] bg-[var(--fondo)] p-5 text-[var(--texto)] shadow-2xl sm:rounded-2xl">
        <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Encuadrar la foto para {nombreLugar}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-suave)]">Tocá el punto de la foto que tiene que quedar a la vista — la cara, no el techo. A la derecha ves cómo queda recortada.</p>

        <div className="mt-5 grid gap-5 sm:grid-cols-[3fr_2fr]">
          <div className="relative cursor-crosshair select-none overflow-hidden rounded-lg border border-[var(--linea)] bg-[var(--hueco)]" onClick={elegirPunto}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/fotos/${foto.id}`} alt="" draggable={false} className="block max-h-[52dvh] w-full object-contain" />
            <span aria-hidden className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(20,20,15,0.6)]" style={{ left: `${foco.x * 100}%`, top: `${foco.y * 100}%` }} />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Así queda</p>
              <div className="mt-2 overflow-hidden rounded-md border border-[var(--linea)]" style={{ aspectRatio: proporcion }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/fotos/${foto.id}`} alt="" className="h-full w-full object-cover" style={{ objectPosition: objectPosition(foco) }} />
              </div>
            </div>
            {conPosicion ? (
              <fieldset>
                <legend className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Dónde va</legend>
                <div className="mt-2 flex flex-col gap-1.5">
                  {POSICIONES.map((p) => (
                    <label key={p} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[13px] ${posicion === p ? "border-[var(--texto)]" : "border-[var(--linea)]"}`}>
                      <input type="radio" name={`posicion-${foto.id}`} value={p} checked={posicion === p} onChange={() => setPosicion(p)} />
                      {NOMBRE_POSICION[p]}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <button type="button" className={enlace} onClick={() => setFoco(FOCO_CENTRO)}>Volver al centro</button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-[var(--alerta)]" role="alert">{error}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="button" disabled={ocupado} onClick={guardar} className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--texto)] px-6 text-sm font-medium text-[var(--fondo)] hover:opacity-90 disabled:opacity-50 [font-family:var(--fuente-micro)]">
            {ocupado ? "Guardando…" : "Guardar"}
          </button>
          <button type="button" className={enlace} disabled={ocupado} onClick={() => setAbierto(false)}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
