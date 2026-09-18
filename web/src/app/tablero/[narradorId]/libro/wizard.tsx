"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Edicion, EdicionCompleta } from "@/lib/edicion";

// La edición final en 4 pasos (docs/panel-usuario.md §7.2). Siempre arranca
// de la propuesta de la casa; ella cambia lo que quiere. Cada paso guarda con
// PATCH /api/edicion. El último es "Cerrar libro": el punto de aprobación,
// sin vuelta atrás. Es deliberadamente explícito.

export type RespuestaResumen = { id: string; orden: number; capitulo: string; pregunta: string; fragmento: string };
export type FotoResumen = { id: string; epigrafe: string | null; capitulo: string | null };

type Props = {
  narradorId: string;
  nombre: string;
  edicion: EdicionCompleta;
  capitulos: string[];
  respuestas: RespuestaResumen[];
  fotos: FotoResumen[];
  nombresRevisados: boolean;
  propia?: boolean;
  /** Lo que se puede sumar (impreso, marcos…): va en el paso Encargar, antes del botón, para verlo justo al cerrar (Joaquín, 18/09). */
  upsell?: ReactNode;
};

const PASOS = ["Portada", "Capítulos", "Contenido", "Encargar"] as const;

const boton = "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";
const principal = `${boton} bg-[var(--texto)] text-[var(--fondo)] hover:opacity-90`;
const secundario = `${boton} border border-[var(--linea-fuerte)] text-[var(--texto)] hover:bg-[var(--hueco)]`;
const chico = "text-sm text-[var(--texto-menor)] underline decoration-[var(--linea-fuerte)] underline-offset-4 hover:text-[var(--texto)] [font-family:var(--fuente-micro)] disabled:opacity-50";
const campo = "w-full rounded-lg border border-[var(--linea-fuerte)] bg-[var(--fondo)] px-4 py-3 text-[16px] leading-relaxed text-[var(--texto)] outline-none focus:border-[var(--texto)]";
const etiqueta = "text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]";

async function guardarEdicion(narradorId: string, cambios: Edicion) {
  const r = await fetch(`/api/edicion?narrador=${encodeURIComponent(narradorId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  });
  const j = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(j.error ?? "No pudimos guardar.");
}

export function Wizard({ narradorId, nombre, edicion: inicial, capitulos, respuestas, fotos, nombresRevisados, propia = false, upsell }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [subtitulo, setSubtitulo] = useState(inicial.subtitulo);
  const [portadaFotoId, setPortadaFotoId] = useState<string | null>(inicial.portadaFotoId);
  const [orden, setOrden] = useState<string[]>(inicial.ordenCapitulos.length ? inicial.ordenCapitulos : capitulos);
  const [titulos, setTitulos] = useState<Record<string, string>>(inicial.titulosCapitulos ?? {});
  const [excluidas, setExcluidas] = useState<Set<string>>(new Set(inicial.excluidas));
  const [correcciones, setCorrecciones] = useState(inicial.correcciones);
  const [confirmo, setConfirmo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al cambiar de paso, la vista vuelve al principio del wizard: si venías
  // scrolleado revisando 30 respuestas, el paso nuevo (más corto) quedaba fuera
  // de la pantalla y no se veía el botón (Joaquín, 18/09).
  function irAlPaso(p: number) {
    setPaso(p);
    requestAnimationFrame(() => document.getElementById("cerrar")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  // Lo que guarda cada paso. Se usa desde el botón de abajo y desde el de arriba.
  const cambiosDelPaso: (Edicion | null)[] = [
    { titulo, subtitulo, portadaFotoId },
    { ordenCapitulos: orden, titulosCapitulos: titulos },
    { excluidas: [...excluidas], correcciones },
    null,
  ];
  const puedeSeguir = paso === 0 ? Boolean(titulo.trim()) : paso < 3;

  async function guardarYSeguir(cambios: Edicion) {
    setOcupado(true);
    setError(null);
    try {
      await guardarEdicion(narradorId, cambios);
      irAlPaso(Math.min(paso + 1, PASOS.length - 1));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setOcupado(false);
    }
  }

  async function cerrar() {
    setOcupado(true);
    setError(null);
    try {
      await guardarEdicion(narradorId, { titulo, subtitulo, portadaFotoId, ordenCapitulos: orden, excluidas: [...excluidas], correcciones });
      const r = await fetch(`/api/edicion?narrador=${encodeURIComponent(narradorId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "cerrar", confirmo: true }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "No pudimos encargar el libro.");
      // La pantalla de "¡Listo!" la arma la página con ?encargado=1, arriba de todo.
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.replace(`/tablero/${narradorId}/libro?encargado=1`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos encargar el libro.");
      setOcupado(false);
    }
  }

  function mover(i: number, d: -1 | 1) {
    const j = i + d;
    if (j < 0 || j >= orden.length) return;
    const copia = [...orden];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setOrden(copia);
  }

  const porCapitulo = new Map<string, RespuestaResumen[]>();
  for (const r of respuestas) porCapitulo.set(r.capitulo, [...(porCapitulo.get(r.capitulo) ?? []), r]);
  const fotoPortada = fotos.find((f) => f.id === portadaFotoId) ?? null;

  return (
    <div className="mt-8">
      {/* Pasos */}
      <ol className="flex flex-wrap gap-x-6 gap-y-2">
        {PASOS.map((nombrePaso, i) => (
          <li key={nombrePaso} className="flex items-center gap-2">
            <button
              type="button"
              disabled={ocupado || i > paso}
              onClick={() => irAlPaso(i)}
              className={`${etiqueta} ${i === paso ? "text-[var(--texto)]" : ""} disabled:cursor-default`}
            >
              {i + 1}. {nombrePaso}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-2 h-[3px] w-full bg-[var(--hueco)]">
        <div className="h-full bg-[var(--texto)] transition-[width] duration-300 ease-out" style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }} />
      </div>
      {/* El mismo "Guardar y seguir" arriba: quien ya sabe lo que quiere no baja hasta el final (Joaquín, 18/09). */}
      {paso < 3 ? (
        <div className="mt-4 flex justify-end">
          <button type="button" disabled={ocupado || !puedeSeguir} onClick={() => guardarYSeguir(cambiosDelPaso[paso]!)} className={secundario}>
            {ocupado ? "Guardando…" : "Guardar y seguir →"}
          </button>
        </div>
      ) : null}

      {/* ── 1 · Portada ─────────────────────────────────────────────── */}
      {paso === 0 ? (
        <section className="mt-10 grid gap-10 md:grid-cols-[1fr_260px]">
          <div className="flex flex-col gap-6">
            <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
              Esta es nuestra propuesta. Cambiá lo que quieras. Sin colores de tapa: el libro es blanco y negro, como la marca.
            </p>
            <label className="flex flex-col gap-2">
              <span className={etiqueta}>Título</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} className={campo} />
            </label>
            <label className="flex flex-col gap-2">
              <span className={etiqueta}>Subtítulo</span>
              <input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} maxLength={80} className={campo} />
            </label>
            <div className="flex flex-col gap-2">
              <span className={etiqueta}>Foto de portada</span>
              {fotos.length === 0 ? (
                <p className="text-sm text-[var(--texto-menor)]">No hay fotos subidas. Podés subir una desde Historias, o dejar la portada sin foto.</p>
              ) : (
                <ul className="flex flex-wrap gap-3">
                  <li>
                    <button type="button" onClick={() => setPortadaFotoId(null)} className={`flex h-20 w-20 items-center justify-center rounded-lg border text-xs [font-family:var(--fuente-micro)] ${portadaFotoId === null ? "border-[var(--texto)]" : "border-[var(--linea)] text-[var(--texto-menor)]"}`}>
                      Sin foto
                    </button>
                  </li>
                  {fotos.map((f) => (
                    <li key={f.id}>
                      <button type="button" onClick={() => setPortadaFotoId(f.id)} className={`block rounded-lg border-2 ${portadaFotoId === f.id ? "border-[var(--texto)]" : "border-transparent"}`} title={f.epigrafe ?? f.capitulo ?? "Foto del libro"}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/fotos/${f.id}`} alt="" className="h-20 w-20 rounded-md object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Vista previa de la tapa */}
          <div className="oscuro flex aspect-[2/3] flex-col justify-between rounded-sm bg-[var(--fondo)] p-6 text-[var(--texto)] shadow-lg">
            <p className="text-[9px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">Vitácora Familiar</p>
            {fotoPortada ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/fotos/${fotoPortada.id}`} alt="" className="my-4 aspect-square w-full rounded-sm object-cover" />
            ) : null}
            <div>
              <p className="text-lg leading-snug [font-family:var(--fuente-titulo)] [text-wrap:balance]">{titulo || "Sin título"}</p>
              <p className="mt-2 text-[11px] text-[var(--texto-suave)] [font-family:var(--fuente-micro)]">{subtitulo}</p>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-4">
            <button type="button" disabled={ocupado || !titulo.trim()} onClick={() => guardarYSeguir(cambiosDelPaso[0]!)} className={principal}>
              {ocupado ? "Guardando…" : "Guardar y seguir"}
            </button>
          </div>
        </section>
      ) : null}

      {/* ── 2 · Capítulos ───────────────────────────────────────────── */}
      {paso === 1 ? (
        <section className="mt-10 flex flex-col gap-6">
          <p className="text-[16px] leading-relaxed text-[var(--texto-suave)]">
            Este es el orden del guion, el que armó el biógrafo. Podés moverlos y ponerles el título que quieras (dejá el campo vacío para volver al del guion). Lo que se contó dentro de cada capítulo queda en el orden en que él lo decidió.
          </p>
          <ol className="flex flex-col gap-2">
            {orden.map((cap, i) => (
              <li key={cap} className="flex items-center gap-4 rounded-lg border border-[var(--linea)] px-4 py-3">
                <span className="w-6 text-right text-sm text-[var(--texto-menor)] tabular-nums [font-family:var(--fuente-micro)]">{i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <input
                    value={titulos[cap] ?? ""}
                    placeholder={cap}
                    maxLength={60}
                    aria-label={`Título del capítulo ${i + 1} (${cap})`}
                    onChange={(e) => setTitulos((t) => ({ ...t, [cap]: e.target.value }))}
                    className="w-full border-b border-transparent bg-transparent text-[16px] outline-none placeholder:text-[var(--texto)] focus:border-[var(--texto)] [font-family:var(--fuente-titulo)]"
                  />
                  {titulos[cap]?.trim() ? <span className="text-[11px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">en el guion: {cap}</span> : null}
                </span>
                <span className="text-sm text-[var(--texto-menor)] [font-family:var(--fuente-micro)] tabular-nums">{(porCapitulo.get(cap) ?? []).length} resp.</span>
                <span className="flex gap-2">
                  <button type="button" aria-label="Subir" className={chico} disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
                  <button type="button" aria-label="Bajar" className={chico} disabled={i === orden.length - 1} onClick={() => mover(i, 1)}>↓</button>
                </span>
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-4">
            <button type="button" disabled={ocupado} onClick={() => guardarYSeguir(cambiosDelPaso[1]!)} className={principal}>
              {ocupado ? "Guardando…" : "Guardar y seguir"}
            </button>
            <button type="button" className={chico} onClick={() => setOrden(capitulos)}>Volver al orden del biógrafo</button>
          </div>
        </section>
      ) : null}

      {/* ── 3 · Contenido ───────────────────────────────────────────── */}
      {paso === 2 ? (
        <section className="mt-10 flex flex-col gap-8">
          <div className="rounded-xl border border-[var(--linea)] p-5">
            <p className="text-[15px] leading-relaxed text-[var(--texto-suave)]">
              <strong className="font-medium text-[var(--texto)]">Los nombres.</strong> El biógrafo escribe los nombres como los escucha; revisalos antes de encargar.{" "}
              {nombresRevisados ? <span className="text-[var(--texto-menor)]">Ya los revisaste ✓</span> : null}
            </p>
            <Link href={`/tablero/${narradorId}/nombres`} className={`${secundario} mt-4`}>
              {nombresRevisados ? "Volver a revisar los nombres" : "Revisar los nombres"}
            </Link>
          </div>

          <div>
            <p className={etiqueta}>Qué dejar afuera</p>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--texto-suave)]">
              Si hay algo que no querés que salga en el libro, destildalo. El capítulo puede quedar más corto.
            </p>
            <div className="mt-4 flex flex-col gap-6">
              {orden.map((cap) => (
                <div key={cap}>
                  <p className="text-[16px] [font-family:var(--fuente-titulo)]">{cap}</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {(porCapitulo.get(cap) ?? []).map((r) => {
                      const incluida = !excluidas.has(r.id);
                      return (
                        <li key={r.id} className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${incluida ? "border-[var(--linea)]" : "border-dashed border-[var(--linea)] opacity-60"}`}>
                          <input
                            type="checkbox"
                            checked={incluida}
                            onChange={(e) => {
                              const s = new Set(excluidas);
                              if (e.target.checked) s.delete(r.id); else s.add(r.id);
                              setExcluidas(s);
                            }}
                            className="mt-1.5 h-4 w-4"
                            aria-label={`Incluir la respuesta ${r.orden}`}
                          />
                          <span className="min-w-0">
                            <span className="block text-[15px] leading-snug">{r.pregunta}</span>
                            <span className="mt-1 block truncate text-sm italic text-[var(--texto-menor)]">{r.fragmento}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className={etiqueta}>Correcciones (opcional)</span>
            <textarea value={correcciones} onChange={(e) => setCorrecciones(e.target.value)} rows={4} maxLength={4000} className={campo} placeholder="Por ejemplo: el taller estaba en Villa Domínico, no en Avellaneda. La hermana se llama Marta, no Martha." />
            <span className="text-sm text-[var(--texto-menor)]">Lo lee el biógrafo antes de producir el libro.</span>
          </label>

          <div>
            <button type="button" disabled={ocupado} onClick={() => guardarYSeguir(cambiosDelPaso[2]!)} className={principal}>
              {ocupado ? "Guardando…" : "Guardar y seguir"}
            </button>
          </div>
        </section>
      ) : null}

      {/* ── 4 · Encargar: el punto de aprobación ───────────────────── */}
      {paso === 3 ? (
        <section className="mt-10 flex flex-col gap-8">
          <div className="rounded-xl border border-[var(--linea)] p-6">
            <p className={etiqueta}>Así queda</p>
            <dl className="mt-4 grid gap-x-8 gap-y-3 text-[15px] md:grid-cols-[140px_1fr]">
              <dt className="text-[var(--texto-menor)]">Título</dt><dd>{titulo}</dd>
              <dt className="text-[var(--texto-menor)]">Subtítulo</dt><dd>{subtitulo || "—"}</dd>
              <dt className="text-[var(--texto-menor)]">Portada</dt><dd>{fotoPortada ? "Con foto" : "Sin foto"}</dd>
              <dt className="text-[var(--texto-menor)]">Capítulos</dt><dd>{orden.map((c) => titulos[c]?.trim() || c).join(" · ")}</dd>
              <dt className="text-[var(--texto-menor)]">Respuestas</dt><dd>{respuestas.length - excluidas.size} de {respuestas.length}{excluidas.size > 0 ? ` (${excluidas.size} afuera)` : ""}</dd>
              <dt className="text-[var(--texto-menor)]">Nombres</dt><dd>{nombresRevisados ? "Revisados" : "Sin revisar"}</dd>
              <dt className="text-[var(--texto-menor)]">Correcciones</dt><dd>{correcciones ? "Sí" : "Ninguna"}</dd>
            </dl>
          </div>

          <div className="rounded-xl border-2 border-[var(--texto)] p-6">
            <p className="text-[17px] leading-relaxed">
              <strong className="font-medium">Al encargar, el libro se produce tal como está:</strong> se arma el PDF y el audiolibro, se
              mandan a imprimir las copias y las fotos de los marcos que compraste, y se prepara el envío. Después de este paso no
              se puede volver atrás ni pedir devolución por cómo quedó escrito o armado. Este es el momento de revisar.
            </p>
            <label className="mt-5 flex items-start gap-3 text-[15px]">
              <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} className="mt-1 h-4 w-4" />
              <span>Lo revisé y entiendo que no hay vuelta atrás.</span>
            </label>
          </div>

          {/* Lo que se puede sumar, justo antes de encargar: se ve sin scrollear hasta abajo. */}
          {upsell ? <div className="rounded-xl border border-[var(--linea)] p-6">{upsell}</div> : null}

          {error ? <p className="text-sm text-[var(--alerta)]">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-4">
            <button type="button" disabled={ocupado || !confirmo} onClick={cerrar} className={`${boton} h-13 bg-[var(--acento)] px-10 text-[16px] text-[var(--sobre-acento)] hover:opacity-90`}>
              {ocupado ? "Encargando…" : "Encargar"}
            </button>
            <span className="text-sm text-[var(--texto-menor)]">{propia ? "Tu libro" : `El libro de ${nombre}`}, tal como lo revisaste.</span>
            <button type="button" className={chico} disabled={ocupado} onClick={() => irAlPaso(2)}>Volver a revisar</button>
          </div>
        </section>
      ) : null}

      {error && paso !== 3 ? <p className="mt-4 text-sm text-[var(--alerta)]">{error}</p> : null}
    </div>
  );
}
