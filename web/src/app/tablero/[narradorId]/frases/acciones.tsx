"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReproductorRespuesta } from "../../reproductor";
import { FRASES_POR_CAPITULO, duracionCorta, tieneAudio, type CapituloConFrases, type FraseCandidata } from "@/lib/frases";

// El selector de «Su voz»: por capítulo, las candidatas; las elegidas primero.
// Cada una se escucha (si el worker ya la cortó), se saca o se pone, y las
// elegidas se mueven. Nada se manda hasta "Guardar": el archivo del paquete lo
// escribe el servidor releyéndolo, así lo que cortó el worker mientras tanto
// no se pisa.

const boton = "inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors [font-family:var(--fuente-micro)] disabled:opacity-50";
const chico = "inline-flex h-8 items-center justify-center rounded-full border border-[var(--linea-fuerte)] px-3 text-xs [font-family:var(--fuente-micro)] hover:bg-[var(--bruma)] disabled:opacity-40";

type Seleccion = Record<number, string[]>;

/** Las elegidas de cada capítulo tal como vienen del archivo: el punto de partida del form. */
export function seleccionInicial(capitulos: CapituloConFrases[]): Seleccion {
  const s: Seleccion = {};
  for (const c of capitulos) s[c.numero] = c.candidatas.filter((f) => f.elegida).map((f) => f.id);
  return s;
}

/** Lo que se manda al servidor: solo los capítulos que cambiaron respecto del archivo. */
export function cambiosParaGuardar(capitulos: CapituloConFrases[], seleccion: Seleccion): { numero: number; elegidas: string[] }[] {
  const inicial = seleccionInicial(capitulos);
  return capitulos
    .map((c) => ({ numero: c.numero, elegidas: seleccion[c.numero] ?? [] }))
    .filter((c) => {
      const antes = inicial[c.numero] ?? [];
      return antes.length !== c.elegidas.length || antes.some((id, i) => id !== c.elegidas[i]);
    });
}

export function SelectorDeFrases({
  narradorId, capitulos, confirmadoAt, puedeEditar, linkPublico,
}: {
  narradorId: string;
  capitulos: CapituloConFrases[];
  confirmadoAt: string | null;
  puedeEditar: boolean;
  linkPublico: string | null;
}) {
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<Seleccion>(() => seleccionInicial(capitulos));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cambios = useMemo(() => cambiosParaGuardar(capitulos, seleccion), [capitulos, seleccion]);
  const hayCambios = cambios.length > 0;

  function elegidasDe(numero: number) {
    return seleccion[numero] ?? [];
  }
  function alternar(numero: number, id: string) {
    setAviso(null);
    setSeleccion((s) => {
      const actuales = s[numero] ?? [];
      if (actuales.includes(id)) return { ...s, [numero]: actuales.filter((x) => x !== id) };
      if (actuales.length >= FRASES_POR_CAPITULO) {
        setError(`En un capítulo van como mucho ${FRASES_POR_CAPITULO} frases: sacá una para poner esta.`);
        return s;
      }
      setError(null);
      return { ...s, [numero]: [...actuales, id] };
    });
  }
  function mover(numero: number, id: string, hacia: -1 | 1) {
    setSeleccion((s) => {
      const actuales = [...(s[numero] ?? [])];
      const i = actuales.indexOf(id);
      const j = i + hacia;
      if (i < 0 || j < 0 || j >= actuales.length) return s;
      [actuales[i], actuales[j]] = [actuales[j], actuales[i]];
      return { ...s, [numero]: actuales };
    });
  }

  async function guardar(confirmar: boolean) {
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await fetch(`/api/frases?narrador=${narradorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seleccion: cambiosParaGuardar(capitulos, seleccion), confirmar }),
      });
      const datos = (await r.json()) as { error?: string; cambios?: number };
      if (!r.ok) {
        setError(datos.error ?? "No pudimos guardar. Intenta de nuevo.");
        return;
      }
      setAviso(confirmar ? "Selección confirmada: así va al libro impreso." : "Guardado. Podés seguir cambiando cuando quieras.");
      router.refresh();
    } catch {
      setError("No pudimos guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function copiar() {
    if (!linkPublico) return;
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setError("No pudimos copiar el link. Seleccionalo y copialo a mano.");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {capitulos.map((c) => {
        const elegidas = elegidasDe(c.numero);
        const porId = new Map(c.candidatas.map((f) => [f.id, f]));
        const ordenadas: FraseCandidata[] = [
          ...elegidas.map((id) => porId.get(id)!).filter(Boolean),
          ...c.candidatas.filter((f) => !elegidas.includes(f.id)),
        ];
        return (
          <section key={c.numero} aria-labelledby={`cap-${c.numero}`}>
            <div className="flex items-end justify-between gap-4 border-b border-[var(--texto)] pb-3">
              <h2 id={`cap-${c.numero}`} className="text-xl font-medium leading-none [font-family:var(--fuente-titulo)]">
                <span className="mr-2 text-[var(--texto-menor)]">{c.numero}.</span>{c.capitulo}
              </h2>
              <span className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.18em]">
                {elegidas.length} de {FRASES_POR_CAPITULO}
              </span>
            </div>
            {ordenadas.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--texto-menor)]">Este capítulo no tiene frases que se puedan recortar del audio.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {ordenadas.map((f) => {
                  const elegida = elegidas.includes(f.id);
                  const posicion = elegidas.indexOf(f.id);
                  return (
                    <li key={f.id} className={`rounded-xl border p-4 sm:p-5 ${elegida ? "border-[var(--texto)]" : "border-[var(--linea)]"}`}>
                      <div className="flex items-start gap-3">
                        {puedeEditar ? (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={elegida}
                            aria-label={elegida ? "Sacar del libro" : "Poner en el libro"}
                            onClick={() => alternar(c.numero, f.id)}
                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${elegida ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]" : "border-[var(--linea-fuerte)]"}`}
                          >
                            {elegida ? "✓" : ""}
                          </button>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="text-[17px] leading-snug [font-family:var(--fuente-titulo)]">«{f.texto}»</p>
                          <p className="mt-1 text-[13px] text-[var(--texto-suave)]">
                            {f.por_que}
                            {f.grupo === "heredadas" ? " · una frase que le dejaron los suyos" : ""}
                          </p>
                          <div className="mt-3">
                            {tieneAudio(f) ? (
                              <ReproductorRespuesta src={`/api/frases/audio/${f.id}?narrador=${narradorId}`} duracion={f.segundos} etiqueta={`la frase «${f.texto.slice(0, 40)}»`} />
                            ) : (
                              <p className="text-[12px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
                                {f.estado === "fallida" ? "No pudimos recortar esta del audio: va impresa, sin escuchar." : "Recortando el audio…"}
                              </p>
                            )}
                          </div>
                          {f.respuesta_id ? (
                            <a
                              href={`/api/audio/${f.respuesta_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-block text-[12px] text-[var(--texto-suave)] underline decoration-[var(--linea-fuerte)] underline-offset-4 [font-family:var(--fuente-micro)]"
                            >
                              Escuchar la historia completa
                            </a>
                          ) : null}
                        </div>
                        {puedeEditar && elegida ? (
                          <div className="flex shrink-0 flex-col gap-1">
                            <button type="button" className={chico} aria-label="Subir" disabled={posicion <= 0} onClick={() => mover(c.numero, f.id, -1)}>↑</button>
                            <button type="button" className={chico} aria-label="Bajar" disabled={posicion >= elegidas.length - 1} onClick={() => mover(c.numero, f.id, 1)}>↓</button>
                          </div>
                        ) : null}
                      </div>
                      {tieneAudio(f) && f.segundos ? <p className="sr-only">{duracionCorta(f.segundos)}</p> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {puedeEditar ? (
        <div className="sticky bottom-0 -mx-6 border-t border-[var(--linea)] bg-[var(--fondo)] px-6 py-4 md:-mx-10 md:px-10">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={`${boton} bg-[var(--texto)] text-[var(--fondo)]`} disabled={guardando || !hayCambios} onClick={() => guardar(false)}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className={`${boton} border border-[var(--linea-fuerte)] hover:bg-[var(--bruma)]`} disabled={guardando} onClick={() => guardar(true)}>
              {confirmadoAt ? "Volver a confirmar" : "Dar por buena la selección"}
            </button>
            <p className="text-[13px] text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
              {confirmadoAt
                ? `Confirmada el ${new Date(confirmadoAt).toLocaleDateString("es-AR")}. Podés seguir cambiando hasta que se imprima.`
                : "Si no confirmás, a los 15 días va lo que eligió el biógrafo."}
            </p>
          </div>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          {aviso ? <p className="mt-3 text-sm text-[var(--texto-suave)]">{aviso}</p> : null}
        </div>
      ) : null}

      {linkPublico ? (
        <div className="rounded-xl border border-[var(--linea)] p-5">
          <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.2em]">El link del código impreso</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--texto-suave)]">
            Es lo que abre el código del libro y el chip del marco: el libro entero y estas frases, sin cuenta. Para escucharlas ahora o mandarlas por WhatsApp.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="max-w-full truncate rounded bg-[var(--bruma)] px-3 py-2 text-[12px]">{linkPublico}</code>
            <button type="button" className={chico} onClick={copiar}>{copiado ? "Copiado" : "Copiar"}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
