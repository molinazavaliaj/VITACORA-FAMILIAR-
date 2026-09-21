"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ANGULOS, NOMBRE_ANGULO } from "@/lib/viaje";

// "Sobre qué te preguntamos" (3t.19): los mismos chips que eligió al comprar.
// Se guardan en contexto.viaje.angulos y el bot los usa desde la noche
// siguiente (la de hoy ya puede estar armada). Solo el viajero, mientras dura
// el viaje. La llegada y la despedida de cada etapa no se eligen: van siempre.
//
// ⚠️ Textos a revisar por Naza (regla de la casa; roadmap mié 23/09).

const chip = (activo: boolean) =>
  `rounded-full border px-4 py-2 text-[14px] transition-colors [font-family:var(--fuente-micro)] [touch-action:manipulation] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] disabled:opacity-50 ${
    activo ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]" : "border-[var(--linea-fuerte)] text-[var(--texto)] hover:border-[var(--texto)]"
  }`;
const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] [touch-action:manipulation] disabled:opacity-50";

export function AngulosDelViaje({ narradorId, angulos }: { narradorId: string; angulos: string[] }) {
  const router = useRouter();
  const [elegidos, setElegidos] = useState<string[]>(angulos);
  const [guardados, setGuardados] = useState<string[]>(angulos);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const cambio = elegidos.length !== guardados.length || elegidos.some((a) => !guardados.includes(a));

  function alternar(a: string) {
    setAviso(null);
    setElegidos((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));
  }

  async function guardar() {
    setOcupado(true);
    setError(null);
    setAviso(null);
    try {
      const r = await fetch(`/api/viaje?narrador=${encodeURIComponent(narradorId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angulos: elegidos }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; angulos?: string[] };
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar los temas.");
      setGuardados(j.angulos ?? elegidos);
      setAviso("Guardado. Rige desde la próxima noche.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar los temas.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
        Elegí dos o tres: son los temas que el biógrafo te pregunta seguido. El resto los va rotando. La llegada a cada etapa y la despedida se preguntan siempre.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sobre qué te preguntamos">
        {ANGULOS.map((a) => (
          <button key={a} type="button" aria-pressed={elegidos.includes(a)} disabled={ocupado} onClick={() => alternar(a)} className={chip(elegidos.includes(a))}>
            {NOMBRE_ANGULO[a]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" disabled={ocupado || !cambio} onClick={guardar} className={`${boton} bg-[var(--texto)] text-[var(--fondo)] hover:opacity-90`}>
          {ocupado ? "Guardando…" : "Guardar los temas"}
        </button>
        {aviso ? <span className="text-sm text-[var(--texto-menor)]">{aviso}</span> : null}
      </div>
      {error ? <p className="text-sm text-[var(--alerta)]" role="alert">{error}</p> : null}
    </div>
  );
}
