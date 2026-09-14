"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calidadDeFoto, type CalidadFoto } from "@/lib/guion";

// Tapa · Contratapa · Marco (docs/panel-usuario.md §15.2): cuál foto va a
// dónde. Se elige en cualquier momento; se confirma al cerrar el libro. Cada
// una tiene su exigencia de calidad: la tapa y la contratapa, la del libro;
// el marco, más (se imprime grande).

export type FotoElegible = { id: string; epigrafe: string | null; capitulo: string | null; ancho_px: number | null; alto_px: number | null };

type Ranura = "portadaFotoId" | "contratapaFotoId" | "marcoFotoId";

const RANURAS: { clave: Ranura; nombre: string; detalle: string; exige: CalidadFoto }[] = [
  { clave: "portadaFotoId", nombre: "Tapa", detalle: "La foto que abre el libro.", exige: "libro" },
  { clave: "contratapaFotoId", nombre: "Contratapa", detalle: "La de atrás, con el código de su voz.", exige: "libro" },
  { clave: "marcoFotoId", nombre: "Marco", detalle: "La que va en los marcos con su voz.", exige: "marco" },
];

const AVISO: Record<CalidadFoto, string | null> = {
  marco: null,
  libro: "Esta foto alcanza para el libro, pero para el marco se va a ver pixelada.",
  baja: "Esta foto es chica: impresa se va a ver pixelada.",
};

function alcanza(f: FotoElegible, exige: CalidadFoto): string | null {
  if (!f.ancho_px || !f.alto_px) return null;
  const calidad = calidadDeFoto(f.ancho_px, f.alto_px);
  if (calidad === "marco") return null;
  if (exige === "libro" && calidad === "libro") return null;
  return AVISO[calidad];
}

export function FotosDelLibro({
  narradorId,
  fotos,
  elegidas,
  editable,
}: {
  narradorId: string;
  fotos: FotoElegible[];
  elegidas: Record<Ranura, string | null>;
  editable: boolean;
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState<Ranura | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function elegir(ranura: Ranura, id: string | null) {
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(`/api/edicion?narrador=${encodeURIComponent(narradorId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [ranura]: id }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar la elección.");
      setAbierta(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar la elección.");
    } finally {
      setOcupado(false);
    }
  }

  const porId = new Map(fotos.map((f) => [f.id, f]));
  // Las del libro (sin capítulo) primero: son las que se subieron para esto.
  const ordenadas = [...fotos].sort((a, b) => Number(a.capitulo !== null) - Number(b.capitulo !== null));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {RANURAS.map((r) => {
          const id = elegidas[r.clave];
          const foto = id ? porId.get(id) ?? null : null;
          const aviso = foto ? alcanza(foto, r.exige) : null;
          const activa = abierta === r.clave;
          return (
            <button
              key={r.clave}
              type="button"
              disabled={!editable}
              aria-expanded={activa}
              onClick={() => setAbierta(activa ? null : r.clave)}
              className={`flex flex-col gap-2.5 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] disabled:cursor-default ${activa ? "border-[var(--texto)]" : "border-[var(--linea)] hover:border-[var(--linea-fuerte)]"}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-medium [font-family:var(--fuente-micro)]">{r.nombre}</span>
                {editable ? <span className="text-[11px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{foto ? "cambiar" : "elegir"}</span> : null}
              </span>
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/fotos/${foto.id}`} alt="" className="aspect-[4/3] w-full rounded-md object-cover grayscale" />
              ) : (
                <span className="flex aspect-[4/3] w-full items-center justify-center rounded-md border border-dashed border-[var(--linea-fuerte)] text-[12px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                  sin foto
                </span>
              )}
              <span className="text-[12px] leading-snug text-[var(--texto-menor)]">{aviso ?? r.detalle}</span>
            </button>
          );
        })}
      </div>

      {abierta ? (
        <div className="rounded-xl border border-[var(--texto)] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">
              Elegí la foto para {RANURAS.find((r) => r.clave === abierta)?.nombre.toLowerCase()}
            </p>
            <button type="button" className="text-[13px] text-[var(--texto-menor)] underline underline-offset-4 [font-family:var(--fuente-micro)]" disabled={ocupado} onClick={() => elegir(abierta, null)}>
              Sin foto
            </button>
          </div>
          {ordenadas.length === 0 ? (
            <p className="mt-4 text-[14px] text-[var(--texto-suave)]">Todavía no hay fotos. Subilas desde la historia, con “Agregar fotos”.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {ordenadas.map((f) => {
                const exige = RANURAS.find((r) => r.clave === abierta)!.exige;
                const aviso = alcanza(f, exige);
                const esLa = elegidas[abierta] === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={ocupado}
                    onClick={() => elegir(abierta, f.id)}
                    title={aviso ?? f.epigrafe ?? f.capitulo ?? "Foto del libro"}
                    className={`relative overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] ${esLa ? "border-[var(--texto)]" : "border-transparent hover:border-[var(--linea-fuerte)]"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/fotos/${f.id}`} alt="" loading="lazy" className="aspect-square w-full object-cover grayscale" />
                    {aviso ? <span aria-hidden className="absolute inset-x-0 bottom-0 bg-[var(--fondo)]/90 px-1 py-0.5 text-center text-[9px] uppercase text-[var(--alerta)] [font-family:var(--fuente-micro)] [letter-spacing:0.12em]">chica</span> : null}
                  </button>
                );
              })}
            </div>
          )}
          {error ? <p className="mt-3 text-sm text-[var(--alerta)]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
