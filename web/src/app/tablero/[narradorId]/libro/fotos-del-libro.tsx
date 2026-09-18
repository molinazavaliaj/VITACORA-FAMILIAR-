"use client";

import { useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { calidadDeFoto, type CalidadFoto } from "@/lib/guion";
import { SubirFoto } from "../preguntas/acciones";

// Las fotos del libro (docs/panel-usuario.md §15.2): arriba el ÁLBUM — las
// que se subieron sin decidir todavía dónde van — y abajo los lugares donde
// pueden ir: la portada de cada capítulo, la tapa, la contratapa y un marco
// por cada primo. Se arrastra una foto del álbum (o de cualquier lugar) al
// lugar, o se toca el lugar y se elige de la lista. Todo se puede cambiar
// hasta que se encarga el libro.
//
// Dos escrituras distintas: mover una foto a un capítulo cambia la fila de
// la foto (PATCH /api/fotos/[id]); elegirla para tapa, contratapa o marco
// cambia narradores.edicion (PATCH /api/edicion).

export type FotoElegible = { id: string; epigrafe: string | null; capitulo: string | null; principal: boolean; ancho_px: number | null; alto_px: number | null };

type Ranura = "portadaFotoId" | "contratapaFotoId";

const AVISO: Record<CalidadFoto, string | null> = {
  marco: null,
  libro: "alcanza para el libro; en un marco se vería pixelada",
  chica: "alcanza a tamaño chico; acá, a página entera, se vería pixelada",
  baja: "es chica: impresa se va a ver pixelada",
};

function alcanza(f: FotoElegible, exige: CalidadFoto): string | null {
  if (!f.ancho_px || !f.alto_px) return null;
  const calidad = calidadDeFoto(f.ancho_px, f.alto_px);
  if (calidad === "marco") return null;
  if (exige === "libro" && calidad === "libro") return null;
  return AVISO[calidad];
}

const TIPO_ARRASTRE = "text/x-vitacora-foto";

function Miniatura({ f, className = "" }: { f: FotoElegible; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/fotos/${f.id}`} alt="" loading="lazy" draggable={false} className={`object-cover grayscale ${className}`} />;
}

export function FotosDelLibro({
  narradorId,
  fotos,
  capitulos,
  elegidas,
  marcosFotoIds,
  marcosComprados,
  editable,
}: {
  narradorId: string;
  fotos: FotoElegible[];
  /** Capítulos en el orden del libro: [nombre en el guion, título en el libro]. */
  capitulos: [string, string][];
  elegidas: Record<Ranura, string | null>;
  marcosFotoIds: (string | null)[];
  marcosComprados: number;
  editable: boolean;
}) {
  const router = useRouter();
  type Destino = { tipo: "capitulo"; capitulo: string } | { tipo: "ranura"; ranura: Ranura } | { tipo: "marco"; indice: number };
  const [abierto, setAbierto] = useState<Destino | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const porId = new Map(fotos.map((f) => [f.id, f]));
  const album = fotos.filter((f) => f.capitulo === null);
  const marcos = Math.max(1, marcosComprados);
  const listaMarcos = Array.from({ length: marcos }, (_, i) => marcosFotoIds[i] ?? null);

  async function llamar(url: string, body: unknown) {
    setOcupado(true);
    setError(null);
    try {
      const r = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "No pudimos guardar.");
      setAbierto(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setOcupado(false);
    }
  }

  function poner(destino: Destino, fotoId: string | null) {
    if (destino.tipo === "capitulo") {
      if (!fotoId) return;
      return llamar(`/api/fotos/${fotoId}`, { capitulo: destino.capitulo, principal: true });
    }
    const edicionUrl = `/api/edicion?narrador=${encodeURIComponent(narradorId)}`;
    if (destino.tipo === "ranura") return llamar(edicionUrl, { [destino.ranura]: fotoId });
    const lista = [...listaMarcos];
    lista[destino.indice] = fotoId;
    return llamar(edicionUrl, { marcosFotoIds: lista });
  }

  function alAlbum(fotoId: string) {
    return llamar(`/api/fotos/${fotoId}`, { capitulo: null });
  }

  // ── arrastrar y soltar ──
  const clave = (d: Destino) => (d.tipo === "capitulo" ? `cap:${d.capitulo}` : d.tipo === "ranura" ? d.ranura : `marco:${d.indice}`);
  function alArrastrar(e: DragEvent, fotoId: string) {
    e.dataTransfer.setData(TIPO_ARRASTRE, fotoId);
    e.dataTransfer.effectAllowed = "move";
  }
  function propsDeDestino(d: Destino) {
    if (!editable) return {};
    return {
      onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes(TIPO_ARRASTRE)) { e.preventDefault(); setSobre(clave(d)); } },
      onDragLeave: () => setSobre(null),
      onDrop: (e: DragEvent) => { e.preventDefault(); setSobre(null); const id = e.dataTransfer.getData(TIPO_ARRASTRE); if (id) void poner(d, id); },
    };
  }

  const lugar = (activo: boolean) =>
    `flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] ${
      activo ? "border-[var(--texto)] bg-[var(--hueco)]" : "border-[var(--linea)] hover:border-[var(--linea-fuerte)]"
    }`;

  function Lugar({ destino, nombre, detalle, foto, exige }: { destino: Destino; nombre: string; detalle?: string; foto: FotoElegible | null; exige: CalidadFoto }) {
    const k = clave(destino);
    const activo = sobre === k || (abierto !== null && clave(abierto) === k);
    const aviso = foto ? alcanza(foto, exige) : null;
    return (
      <button
        type="button"
        disabled={!editable}
        aria-expanded={abierto !== null && clave(abierto) === k}
        onClick={() => setAbierto(abierto && clave(abierto) === k ? null : destino)}
        draggable={editable && Boolean(foto)}
        onDragStart={foto ? (e) => alArrastrar(e, foto.id) : undefined}
        className={`${lugar(activo)} disabled:cursor-default`}
        {...propsDeDestino(destino)}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium [font-family:var(--fuente-micro)]">{nombre}</span>
          {editable ? <span className="shrink-0 text-[11px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{foto ? "cambiar" : "elegir"}</span> : null}
        </span>
        {foto ? (
          <Miniatura f={foto} className="aspect-[4/3] w-full rounded-md" />
        ) : (
          <span className="flex aspect-[4/3] w-full items-center justify-center rounded-md border border-dashed border-[var(--linea-fuerte)] text-[11px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
            {editable ? "soltá una foto acá" : "sin foto"}
          </span>
        )}
        {aviso || detalle ? <span className={`text-[11px] leading-snug ${aviso ? "text-[var(--alerta)]" : "text-[var(--texto-menor)]"}`}>{aviso ?? detalle}</span> : null}
      </button>
    );
  }

  const exigeDe = (d: Destino): CalidadFoto => (d.tipo === "marco" ? "marco" : "libro");
  const nombreDe = (d: Destino) =>
    d.tipo === "capitulo" ? `la portada de “${capitulos.find(([g]) => g === d.capitulo)?.[1] ?? d.capitulo}”` : d.tipo === "ranura" ? (d.ranura === "portadaFotoId" ? "la tapa" : "la contratapa") : `el marco ${d.indice + 1}`;

  return (
    <div className="flex flex-col gap-8">
      {/* ── El álbum ────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">El álbum · sin lugar todavía</p>
          <p className="text-[12px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{album.length} {album.length === 1 ? "foto" : "fotos"}</p>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--texto-suave)]">
          Las que subiste sin decidir dónde van. {editable ? "Arrastralas a la portada de un capítulo, a la tapa, a la contratapa o a un marco — o tocá el lugar y elegila de la lista." : "Se decidió al encargar el libro."}
        </p>
        {album.length > 0 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {album.map((f) => (
              <div
                key={f.id}
                draggable={editable}
                onDragStart={(e) => alArrastrar(e, f.id)}
                title={f.epigrafe ?? "Foto del libro"}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[var(--linea)] ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <Miniatura f={f} className="h-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[13px] text-[var(--texto-menor)]">No hay fotos sin lugar todavía.</p>
        )}
        {/* Se suben también desde acá (Joaquín, 17/09): es donde se ve cómo queda el libro. */}
        {editable ? (
          <div className="mt-4">
            <SubirFoto narradorId={narradorId} capitulos={capitulos.map(([guion]) => guion)} variante="barra">
              + Agregar fotos
            </SubirFoto>
          </div>
        ) : null}
      </div>

      {/* ── Las portadas de los capítulos ───────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">La portada de cada capítulo</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {capitulos.map(([guion, titulo], i) => {
            const foto = fotos.find((f) => f.capitulo === guion && f.principal) ?? null;
            return <Lugar key={guion} destino={{ tipo: "capitulo", capitulo: guion }} nombre={`${i + 1} · ${titulo}`} foto={foto} exige="libro" />;
          })}
        </div>
      </div>

      {/* ── Tapa · Contratapa · Marcos ──────────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Tapa · contratapa · {marcos === 1 ? "marco" : `${marcos} marcos`}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Lugar destino={{ tipo: "ranura", ranura: "portadaFotoId" }} nombre="Tapa" detalle="La foto que abre el libro." foto={elegidas.portadaFotoId ? porId.get(elegidas.portadaFotoId) ?? null : null} exige="libro" />
          <Lugar destino={{ tipo: "ranura", ranura: "contratapaFotoId" }} nombre="Contratapa" detalle="La de atrás, con el código de su voz." foto={elegidas.contratapaFotoId ? porId.get(elegidas.contratapaFotoId) ?? null : null} exige="libro" />
          {listaMarcos.map((id, i) => (
            <Lugar
              key={i}
              destino={{ tipo: "marco", indice: i }}
              nombre={marcos === 1 ? "Marco" : `Marco ${i + 1}`}
              detalle={marcosComprados === 0 ? "Si sumás marcos, cada uno lleva su foto." : "Cada primo recibe el suyo, con esta foto y su voz."}
              foto={id ? porId.get(id) ?? null : null}
              exige="marco"
            />
          ))}
        </div>
      </div>

      {/* ── El selector, al tocar un lugar ──────────────────────────── */}
      {abierto ? (
        <div className="rounded-xl border border-[var(--texto)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">Elegí la foto para {nombreDe(abierto)}</p>
            <div className="flex gap-4">
              {abierto.tipo !== "capitulo" ? (
                <button type="button" className="text-[13px] text-[var(--texto-menor)] underline underline-offset-4 [font-family:var(--fuente-micro)]" disabled={ocupado} onClick={() => poner(abierto, null)}>Sin foto</button>
              ) : null}
              <button type="button" className="text-[13px] text-[var(--texto-menor)] underline underline-offset-4 [font-family:var(--fuente-micro)]" disabled={ocupado} onClick={() => setAbierto(null)}>Cerrar</button>
            </div>
          </div>
          {fotos.length === 0 ? (
            <p className="mt-4 text-[14px] text-[var(--texto-suave)]">Todavía no hay fotos. Subilas desde la historia, con “Agregar fotos”.</p>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[...album, ...fotos.filter((f) => f.capitulo !== null)].map((f) => {
                const aviso = alcanza(f, exigeDe(abierto));
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={ocupado}
                    onClick={() => poner(abierto, f.id)}
                    title={aviso ? `Esta foto ${aviso}` : f.epigrafe ?? f.capitulo ?? "Foto del libro"}
                    className="relative overflow-hidden rounded-md border-2 border-transparent transition-colors hover:border-[var(--linea-fuerte)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)]"
                  >
                    <Miniatura f={f} className="aspect-square w-full" />
                    {f.capitulo ? <span className="absolute inset-x-0 top-0 truncate bg-[var(--fondo)]/90 px-1 py-0.5 text-[9px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">{f.capitulo}</span> : null}
                    {aviso ? <span aria-hidden className="absolute inset-x-0 bottom-0 bg-[var(--fondo)]/90 px-1 py-0.5 text-center text-[9px] uppercase text-[var(--alerta)] [font-family:var(--fuente-micro)] [letter-spacing:0.12em]">chica</span> : null}
                  </button>
                );
              })}
            </div>
          )}
          {abierto.tipo === "capitulo" ? (
            (() => {
              const actual = fotos.find((f) => f.capitulo === abierto.capitulo && f.principal);
              return actual ? (
                <button type="button" className="mt-4 text-[13px] text-[var(--texto-menor)] underline underline-offset-4 [font-family:var(--fuente-micro)]" disabled={ocupado} onClick={() => alAlbum(actual.id)}>
                  Devolver la actual al álbum
                </button>
              ) : null;
            })()
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--alerta)]" role="alert">{error}</p> : null}
    </div>
  );
}
