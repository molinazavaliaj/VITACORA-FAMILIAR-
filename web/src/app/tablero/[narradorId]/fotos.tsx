"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Las fotos de un capítulo: la principal grande (abre el capítulo), las
// adicionales chicas (lo cierran). Borrar es la única acción; ordenar y
// elegir la principal viene con la edición final.

export type FotoVista = {
  id: string;
  capitulo: string | null; // null = foto del libro (tapa, contratapa, marco)
  epigrafe: string | null;
  principal: boolean;
  orden: number;
  subida_por: string | null;
};

export function GaleriaCapitulo({ fotos, usuarioId, esDuena }: { fotos: FotoVista[]; usuarioId: string; esDuena: boolean }) {
  const puedeBorrar = (f: FotoVista) => esDuena || f.subida_por === usuarioId;
  const router = useRouter();
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (fotos.length === 0) return null;

  async function borrar(f: FotoVista) {
    if (!confirm("¿Sacar esta foto del libro?")) return;
    setBorrando(f.id);
    setError(null);
    const r = await fetch(`/api/fotos/${f.id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "No pudimos borrar la foto.");
      setBorrando(null);
      return;
    }
    router.refresh();
  }

  const principal = fotos.find((f) => f.principal);
  const resto = fotos.filter((f) => !f.principal);

  return (
    <div className="mt-6 flex flex-col gap-4">
      {principal ? (
        <figure className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/fotos/${principal.id}`} alt={principal.epigrafe ?? ""} className="max-h-96 w-full rounded-lg border border-[var(--linea)] object-cover" />
          {principal.epigrafe ? <figcaption className="mt-2 text-sm italic text-[var(--texto-menor)]">{principal.epigrafe}</figcaption> : null}
          {puedeBorrar(principal) ? (
            <BotonSacar ocupado={borrando === principal.id} onSacar={() => borrar(principal)} />
          ) : null}
        </figure>
      ) : null}
      {resto.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {resto.map((f) => (
            <li key={f.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/fotos/${f.id}`} alt={f.epigrafe ?? ""} title={f.epigrafe ?? undefined} className="h-24 w-24 rounded-lg border border-[var(--linea)] object-cover" />
              {puedeBorrar(f) ? (
                <BotonSacar ocupado={borrando === f.id} onSacar={() => borrar(f)} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-[var(--alerta)]">{error}</p> : null}
    </div>
  );
}

// Naza (01/11) no encontraba cómo borrar una foto repetida: era una ✕ gris de
// 10 px. Ahora es un botón redondo de 32 px, siempre a la vista. También en Encargar libro.
export function BotonSacar({ ocupado, onSacar }: { ocupado: boolean; onSacar: () => void }) {
  return (
    <button
      type="button"
      aria-label="Sacar esta foto del libro"
      title="Sacar esta foto del libro"
      disabled={ocupado}
      onClick={onSacar}
      className="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--linea-fuerte)] bg-[var(--fondo)] text-[var(--texto)] shadow-sm transition-colors hover:border-[var(--alerta)] hover:text-[var(--alerta)] disabled:opacity-50 [touch-action:manipulation]"
    >
      {ocupado ? (
        "…"
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )}
    </button>
  );
}
