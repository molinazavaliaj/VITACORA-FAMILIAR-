"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TratoComprador } from "@/lib/regalo-textos";

// "Cerrar edición del libro" (Joaquín, 17/09). Cuando terminó de contar, la
// historia sigue abierta para sumar fotos y compartir; con este botón la
// familia da por cerrada esa etapa: la barra queda en gris y aparece el paso
// siguiente (los últimos retoques en Encargar libro). Guarda una fecha en
// `edicion.historiaCerradaEl`; se puede reabrir, no dispara nada en la fábrica.

async function guardar(narradorId: string, historiaCerradaEl: string | null, trato: TratoComprador = "vos") {
  const r = await fetch(`/api/edicion?narrador=${encodeURIComponent(narradorId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ historiaCerradaEl }),
  });
  const json = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(json.error ?? (trato === "tu" ? "No pudimos guardar. Intenta de nuevo." : "No pudimos guardar. Intentá de nuevo."));
}

const boton =
  "inline-flex h-10 items-center gap-2 rounded-full border border-[var(--texto)] bg-[var(--texto)] px-4 text-[13px] font-medium text-[var(--fondo)] transition-opacity hover:opacity-85 disabled:opacity-60 [font-family:var(--fuente-micro)] [touch-action:manipulation]";

export function CerrarEdicion({ narradorId, propia, trato = "vos" }: { narradorId: string; propia: boolean; trato?: TratoComprador }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cerrar() {
    setOcupado(true);
    setError(null);
    try {
      await guardar(narradorId, new Date().toISOString(), trato);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
      setOcupado(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" className={boton} disabled={ocupado} onClick={cerrar} title={trato === "tu" ? "Cierras la historia y pasas a los últimos retoques" : propia ? "Cerrás la historia y pasás a los últimos retoques" : "Cerrás la historia y pasás a los últimos retoques"}>
        {ocupado ? "Cerrando…" : "Cerrar edición del libro"}
      </button>
      {error ? <span className="text-[12px] text-[var(--alerta)]">{error}</span> : null}
    </span>
  );
}

export function ReabrirEdicion({ narradorId }: { narradorId: string }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  return (
    <button
      type="button"
      disabled={ocupado}
      onClick={async () => {
        setOcupado(true);
        try { await guardar(narradorId, null); router.refresh(); } finally { setOcupado(false); }
      }}
      className="text-[13px] text-[var(--texto-menor)] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)] disabled:opacity-60 [font-family:var(--fuente-micro)]"
    >
      {ocupado ? "Reabriendo…" : "Reabrir la edición"}
    </button>
  );
}
