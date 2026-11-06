"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PreguntaDePantalla } from "@/lib/dudas";
import { NO_ME_ACUERDO, textosMiHistoria, type IdiomaMiHistoria } from "@/lib/mi-historia-textos";

// Una duda por vez, con letra grande: la va a contestar alguien de 60 años o más, desde el celular. Cada respuesta se
// guarda al seguir: si cierra, al volver abre en la primera que le falta. `muestra` no guarda nada (/panel-muestra).

const BOTON_BASE = "flex min-h-12 w-full items-center justify-center rounded-md px-5 py-3 text-center text-[18px] leading-snug disabled:opacity-40";

/** Lo último: las gracias y, en «Para mí», el botón a encargar. */
export function Gracias({ idioma, linkLibro, titulo }: { idioma: IdiomaMiHistoria; linkLibro: string | null; titulo?: React.Ref<HTMLHeadingElement> }) {
  const T = textosMiHistoria(idioma);
  return (
    <div className="flex flex-col gap-8">
      <h1 ref={titulo} tabIndex={-1} className="text-[24px] leading-relaxed outline-none [font-family:var(--fuente-titulo)]">{T.gracias}</h1>
      {linkLibro ? <Link href={linkLibro} className={`${BOTON_BASE} bg-[var(--texto)] text-[var(--fondo)]`}>{T.botonLibro}</Link> : null}
    </div>
  );
}

export function PantallaDudas({ idioma, token, total, preguntas, linkLibro, muestra = false }: { idioma: IdiomaMiHistoria; token: string; total: number; preguntas: PreguntaDePantalla[]; linkLibro: string | null; muestra?: boolean }) {
  const T = textosMiHistoria(idioma);
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const [fin, setFin] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primera = useRef(true);

  // Al pasar de pregunta, arriba de todo y con el lector de pantalla en la nueva. No al abrir: no le mueve nada.
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    window.scrollTo(0, 0);
    titulo.current?.focus({ preventScroll: true });
  }, [indice, fin]);

  async function guardar(respuesta: string) {
    const duda = preguntas[indice];
    setGuardando(true);
    setError(false);
    try {
      if (!muestra) {
        const r = await fetch(`/api/mi-historia/${encodeURIComponent(token)}/dudas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correcciones: [{ dudaId: duda.id, texto: respuesta }] }),
        });
        // El libro se escribió o el link venció mientras contestaba: la puerta sabe qué decirle.
        if (r.status === 409 || r.status === 403) return window.location.reload();
        if (!r.ok) return setError(true);
      }
      setTexto("");
      if (indice + 1 < preguntas.length) setIndice(indice + 1);
      else setFin(true);
    } catch {
      // Sin red: lo que escribió sigue en el campo, para volver a probar.
      setError(true);
    } finally {
      setGuardando(false);
    }
  }

  if (fin) return <Gracias idioma={idioma} linkLibro={linkLibro} titulo={titulo} />;

  const duda = preguntas[indice];
  const listo = texto.trim() !== "";
  return (
    <div className="flex flex-col gap-6">
      {indice === 0 ? (
        <header className="flex flex-col gap-3">
          <p className="text-3xl leading-tight font-medium [font-family:var(--fuente-titulo)]">{T.titulo}</p>
          <p className="text-[18px] leading-relaxed text-[var(--texto-suave)]">{T.intro}</p>
        </header>
      ) : null}

      <p className="text-[15px] text-[var(--texto-suave)]">{T.pregunta(duda.numero, total)}</p>
      <h1 ref={titulo} tabIndex={-1} className="text-[24px] leading-snug font-medium break-words outline-none [font-family:var(--fuente-titulo)]">{duda.pregunta}</h1>

      {duda.citas.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-[15px] text-[var(--texto-suave)]">{T.loQueDijiste}</h2>
          {duda.citas.map((c) => (
            <blockquote key={c} className="border-l-2 border-[var(--linea-fuerte)] pl-4 text-[18px] leading-relaxed break-words text-[var(--texto-suave)]">{c}</blockquote>
          ))}
        </section>
      ) : null}

      {duda.opciones.length > 0 ? (
        <div className="flex flex-col gap-3">
          {duda.opciones.map((o) => (
            <button key={o} type="button" aria-pressed={texto === o} onClick={() => { setTexto(o); setError(false); }} disabled={guardando} className={`${BOTON_BASE} break-words border ${texto === o ? "border-[var(--texto)] bg-[var(--texto)] text-[var(--fondo)]" : "border-[var(--linea-fuerte)] text-[var(--texto)]"}`}>
              {o}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="respuesta-duda" className="text-[17px] leading-relaxed text-[var(--texto-suave)]">{T.campo}</label>
        <textarea id="respuesta-duda" value={texto} onChange={(e) => { setTexto(e.target.value); setError(false); }} rows={4} maxLength={2000} className="w-full rounded-md border border-[var(--linea-fuerte)] bg-transparent p-3 text-[18px] leading-relaxed text-[var(--texto)]" />
      </div>

      {error ? <p role="alert" className="text-[17px] text-[var(--texto)]">{T.errorGuardar}</p> : null}

      <div className="flex flex-col gap-3">
        <button type="button" disabled={guardando || !listo} onClick={() => guardar(texto.trim())} className={`${BOTON_BASE} bg-[var(--texto)] text-[var(--fondo)]`}>{T.seguir}</button>
        <button type="button" disabled={guardando} onClick={() => guardar(NO_ME_ACUERDO)} className={`${BOTON_BASE} border border-[var(--linea-fuerte)] text-[var(--texto)]`}>{T.noMeAcuerdo}</button>
      </div>
    </div>
  );
}
