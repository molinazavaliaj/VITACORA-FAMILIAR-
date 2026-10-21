"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TratoComprador } from "@/lib/regalo-textos";
import { idiomaFueraDelLibro, textosFueraDelLibro } from "@/lib/fuera-del-libro-textos";

// «Que esto no vaya al libro» en cada respuesta de la historia V3 (Naza, 21/10). La dueña la saca (y, si la
// entrevista sigue, puede pedir que se la volvamos a hacer) o la vuelve a poner. Patrón de la casa: llama a
// /api/fuera-del-libro y refresca la página para que el servidor vuelva a leer la verdad.

const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";
const botonPrincipal = `${boton} bg-[var(--acento)] text-[var(--sobre-acento)] hover:opacity-90`;
const botonChico = "text-sm text-[var(--texto-menor)] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)] [font-family:var(--fuente-micro)] disabled:opacity-50";
const opcion = (elegida: boolean) =>
  `${boton} border ${elegida ? "border-[var(--texto)] bg-[var(--hueco)] text-[var(--texto)]" : "border-[var(--linea-fuerte)] text-[var(--texto-suave)] hover:bg-[var(--hueco)]"}`;

async function pedir(narradorId: string, cuerpo: Record<string, unknown>, error: string): Promise<void> {
  const r = await fetch(`/api/fuera-del-libro?narrador=${encodeURIComponent(narradorId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const json = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(json.error ?? error);
}

export function SacarDelLibro({
  narradorId, respuestaId, fuera, propia, trato, puedeVolverAPreguntar,
}: { narradorId: string; respuestaId: string; fuera: boolean; propia: boolean; trato: TratoComprador; puedeVolverAPreguntar: boolean }) {
  const T = textosFueraDelLibro(idiomaFueraDelLibro(trato));
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [volver, setVolver] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(cuerpo: Record<string, unknown>) {
    setOcupado(true);
    setError(null);
    try {
      await pedir(narradorId, cuerpo, T.error);
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : T.error);
    } finally {
      setOcupado(false);
    }
  }

  if (fuera) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">{T.marca}</span>
        <button type="button" className={botonChico} disabled={ocupado} onClick={() => enviar({ accion: "poner", respuestaId })}>{T.deshacer}</button>
        {error ? <p className="w-full text-sm text-[var(--alerta)]">{error}</p> : null}
      </div>
    );
  }

  if (!abierto) {
    return (
      <button type="button" className={`${botonChico} self-start`} onClick={() => { setAbierto(true); setVolver(false); setError(null); }}>
        {T.sacar}
      </button>
    );
  }

  return (
    <div role="group" aria-label={T.pregunta} className="flex flex-col gap-3 rounded-xl border border-[var(--linea-fuerte)] p-4 sm:p-5">
      <p className="text-[15.5px] font-medium [font-family:var(--fuente-titulo)]">{T.pregunta}</p>
      <p className="text-sm leading-[1.6] text-[var(--texto-suave)]">{T.explicacion(propia)}</p>
      {puedeVolverAPreguntar ? (
        <div className="flex flex-col gap-2 border-t border-[var(--linea)] pt-3">
          <p className="text-[15px] [font-family:var(--fuente-titulo)]">{T.volverPregunta(propia)}</p>
          <p className="text-sm text-[var(--texto-menor)]">{T.volverExplicacion(propia)}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={volver} className={opcion(volver)} onClick={() => setVolver(true)}>{T.volverSi(propia)}</button>
            <button type="button" aria-pressed={!volver} className={opcion(!volver)} onClick={() => setVolver(false)}>{T.volverNo}</button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="button" className={botonPrincipal} disabled={ocupado} onClick={() => enviar({ accion: "sacar", respuestaId, volverAPreguntar: puedeVolverAPreguntar && volver })}>
          {T.confirmar}
        </button>
        <button type="button" className={botonChico} disabled={ocupado} onClick={() => setAbierto(false)}>{T.cancelar}</button>
      </div>
      {error ? <p className="text-sm text-[var(--alerta)]">{error}</p> : null}
    </div>
  );
}
