"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TratoComprador } from "@/lib/regalo-textos";

// Las fechas del viaje (V2, 16/10; antes «Fechas y etapas», commit 2c363ea5).
// Se corren la salida y la vuelta mientras el bot todavía no tomó el viaje (no
// hay fila en `viajes_v2`): ahí se cambia `contexto.viaje` y el bot arranca con
// las fechas nuevas. Después, las cambia el equipo (lo dice la ruta). El
// servidor valida lo mismo que la compra (lib/viaje.ts validarFechas).
//
// TEXTO PARA NAZA: botón, aviso y error.

const campo = "w-full rounded-md border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-3 py-2 text-[15px] text-[var(--texto)] outline-none focus:border-[var(--texto)]";
const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";
const micro = "text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]";

export function FechasDelViaje({ narradorId, salida: salidaInicial, vuelta: vueltaInicial }: { narradorId: string; salida: string; vuelta: string; trato?: TratoComprador }) {
  const router = useRouter();
  const [salida, setSalida] = useState(salidaInicial);
  const [vuelta, setVuelta] = useState(vueltaInicial);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const cambio = salida !== salidaInicial || vuelta !== vueltaInicial;

  async function guardar() {
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      const r = await fetch(`/api/viaje?narrador=${encodeURIComponent(narradorId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salida, vuelta }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar las fechas.");
      setAviso("Guardado.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar las fechas.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={micro}>Salida</span>
          <input type="date" className={campo} value={salida} onChange={(e) => setSalida(e.target.value)} />
        </label>
        <label className="flex flex-col gap-2">
          <span className={micro}>Vuelta</span>
          <input type="date" className={campo} value={vuelta} min={salida || undefined} onChange={(e) => setVuelta(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!cambio || ocupado} onClick={guardar} className={`${boton} bg-[var(--texto)] text-[var(--fondo)]`}>
          {ocupado ? "Guardando…" : "Guardar las fechas"}
        </button>
        {aviso ? <span role="status" className="text-[14px] text-[var(--texto-suave)]">{aviso}</span> : null}
      </div>
      {error ? <p role="alert" className="text-sm text-[var(--alerta)]">{error}</p> : null}
    </div>
  );
}
