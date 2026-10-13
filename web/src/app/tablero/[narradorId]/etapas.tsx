"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ETAPAS_MAXIMO, diasDelViaje, fechaDelDia, type Etapa, type Viaje } from "@/lib/viaje";

// Las etapas del viaje, vivas (docs/vitacora-de-viaje.md): se agregan ciudades
// que aparecen en el camino, se les pone fecha cuando se sabe, se renombran.
// Al guardar, las noches que todavía no llegaron se reasignan al capítulo que
// les toca. Solo la dueña (el viajero), mientras el viaje no terminó.
//
// Arriba, las fechas del viaje (12/10): antes de la primera pregunta se mueven
// la salida y la vuelta; con el viaje en marcha, solo la vuelta (estirar o
// acortar, nunca antes de la última noche que ya salió). El servidor valida lo
// mismo (lib/viaje.ts validarFechas); acá es para no dejar elegir lo imposible.

const fechaLarga = (ymd: string) => new Date(`${ymd}T00:00:00Z`).toLocaleDateString("es", { day: "numeric", month: "long", timeZone: "UTC" });
const micro = "text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]";
const campo = "w-full rounded-md border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-3 py-2 text-[15px] text-[var(--texto)] outline-none focus:border-[var(--texto)]";
const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";

export function EtapasDelViaje({ narradorId, viaje, diaActual }: { narradorId: string; viaje: Viaje; diaActual: number }) {
  const router = useRouter();
  const [salida, setSalida] = useState(viaje.salida);
  const [vuelta, setVuelta] = useState(viaje.vuelta);
  const arranco = diaActual >= 1;
  // La vuelta más temprana posible: la última noche que ya salió (o la salida, si todavía no salió ninguna).
  const vueltaMinima = arranco ? fechaDelDia(viaje, diaActual) : salida;
  const [etapas, setEtapas] = useState<(Etapa & { original?: string })[]>(viaje.etapas.map((e) => ({ ...e, original: e.nombre })));
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function editar(i: number, cambios: Partial<Etapa>) {
    setEtapas((x) => x.map((e, j) => (j === i ? { ...e, ...cambios } : e)));
  }

  async function guardar() {
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      const renombres = etapas.filter((e) => e.original && e.nombre.trim() && e.original !== e.nombre.trim()).map((e) => ({ de: e.original!, a: e.nombre.trim() }));
      const r = await fetch(`/api/viaje?narrador=${encodeURIComponent(narradorId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salida, vuelta, etapas: etapas.map(({ nombre, desde, hasta }) => ({ nombre, desde, hasta })), renombres }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; reasignadas?: number; noches?: number };
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar los cambios.");
      const cambioDuracion = j.noches !== undefined && j.noches !== diasDelViaje(viaje);
      setAviso(
        cambioDuracion
          ? `Guardado. El viaje ahora tiene ${j.noches} ${j.noches === 1 ? "noche" : "noches"}.`
          : j.reasignadas
            ? `Guardado. ${j.reasignadas} ${j.reasignadas === 1 ? "noche cambió" : "noches cambiaron"} de capítulo.`
            : "Guardado.",
      );
      setEtapas((x) => x.map((e) => ({ ...e, original: e.nombre.trim() })));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar los cambios.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 rounded-lg border border-[var(--texto)] p-3 sm:grid-cols-[150px_150px_1fr] sm:items-end">
        <label className="flex flex-col gap-1">
          <span className={micro}>Salida</span>
          <input type="date" className={`${campo} disabled:opacity-60`} value={salida} max={vuelta} onChange={(ev) => ev.target.value && setSalida(ev.target.value)} disabled={ocupado || arranco} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={micro}>Vuelta</span>
          <input type="date" className={campo} value={vuelta} min={vueltaMinima} onChange={(ev) => ev.target.value && setVuelta(ev.target.value)} disabled={ocupado} />
        </label>
        <p className="text-[13px] leading-snug text-[var(--texto-menor)]">
          {arranco
            ? `El viaje ya arrancó: la salida queda fija. Si lo estirás o lo acortás, cambiá la vuelta (no puede ser antes del ${fechaLarga(vueltaMinima)}).`
            : "¿Cambiaron los vuelos? Corré la salida o la vuelta. La primera pregunta te llega el día que salís."}
        </p>
      </div>
      <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
        Cada etapa es un capítulo. Si aparece una ciudad nueva, agregala; si ya sabés las fechas, ponelas. Las noches que todavía no llegaron se acomodan solas.
      </p>
      <ul className="flex flex-col gap-2">
        {etapas.map((e, i) => (
          <li key={i} className="grid gap-2 rounded-lg border border-[var(--linea)] p-3 sm:grid-cols-[1fr_150px_150px_auto] sm:items-end">
            <input aria-label={`Etapa ${i + 1}`} className={campo} value={e.nombre} onChange={(ev) => editar(i, { nombre: ev.target.value })} placeholder="Ciudad o tramo" disabled={ocupado} />
            <label className="flex flex-col gap-1">
              <span className={micro}>Desde</span>
              <input type="date" className={campo} value={e.desde ?? ""} min={salida} max={vuelta} onChange={(ev) => editar(i, { desde: ev.target.value || undefined })} disabled={ocupado} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={micro}>Hasta</span>
              <input type="date" className={campo} value={e.hasta ?? ""} min={e.desde ?? salida} max={vuelta} onChange={(ev) => editar(i, { hasta: ev.target.value || undefined })} disabled={ocupado} />
            </label>
            <button type="button" aria-label="Sacar etapa" disabled={ocupado} onClick={() => setEtapas((x) => x.filter((_, j) => j !== i))} className="h-9 w-9 rounded-full border border-[var(--linea-fuerte)] text-[var(--texto-menor)] hover:text-[var(--texto)]">×</button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" disabled={ocupado || etapas.length >= ETAPAS_MAXIMO} onClick={() => setEtapas((x) => [...x, { nombre: "" }])} className="text-sm text-[var(--texto-menor)] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)] [font-family:var(--fuente-micro)]">+ Agregar etapa</button>
        <button type="button" disabled={ocupado} onClick={guardar} className={`${boton} bg-[var(--texto)] text-[var(--fondo)] hover:opacity-90`}>{ocupado ? "Guardando…" : "Guardar los cambios"}</button>
        {aviso ? <span className="text-sm text-[var(--texto-menor)]">{aviso}</span> : null}
      </div>
      {error ? <p className="text-sm text-[var(--alerta)]" role="alert">{error}</p> : null}
    </div>
  );
}
