"use client";

import { useEffect, useState } from "react";
import { TEXTOS_VOZ } from "../../_textos/voz";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { BotonPlay, OndaFrase } from "./reproductor-voz";
import { CompartirFrase } from "./compartir";

// Los capítulos de «Su voz» en acordeón (maqueta SuVoz): el primero abierto,
// los demás cerrados con cuántos audios tienen. Se ven los primeros cuatro y
// «Ver los N capítulos» muestra el resto. Cada frase conserva su ancla #f-<id>
// (el QR de la sección de frases y lo que se manda por WhatsApp caen ahí): si la
// página abre con una, se abre su capítulo y se baja hasta ella.

export type FraseVista = { id: string; texto: string; segundos: number | null };
export type CapituloVista = { numero: number; titulo: string; frases: FraseVista[] };

const VISIBLES = 4;

export function Capitulos({ capitulos, nombre, idioma }: { capitulos: CapituloVista[]; nombre: string; idioma: IdiomaWeb }) {
  const T = TEXTOS_VOZ[idioma];
  const [abiertos, setAbiertos] = useState<Set<number>>(() => new Set(capitulos.slice(0, 1).map((c) => c.numero)));
  const [todos, setTodos] = useState(capitulos.length <= VISIBLES);

  useEffect(() => {
    const ancla = decodeURIComponent(window.location.hash.slice(1));
    if (!ancla.startsWith("f-")) return;
    const indice = capitulos.findIndex((c) => c.frases.some((f) => `f-${f.id}` === ancla));
    if (indice < 0) return;
    setAbiertos((a) => new Set(a).add(capitulos[indice].numero));
    if (indice >= VISIBLES) setTodos(true);
    requestAnimationFrame(() => document.getElementById(ancla)?.scrollIntoView({ block: "center" }));
  }, [capitulos]);

  const alternar = (numero: number) =>
    setAbiertos((a) => {
      const b = new Set(a);
      if (b.has(numero)) b.delete(numero);
      else b.add(numero);
      return b;
    });

  return (
    <div>
      <ol className="border-t border-[var(--dir-hilo-tinta)]">
        {capitulos.map((c, i) => {
          const abierto = abiertos.has(c.numero);
          const panel = `cap-${c.numero}`;
          return (
            <li key={c.numero} hidden={!todos && i >= VISIBLES} className="border-b border-[var(--dir-hilo-tinta)]">
              <h3>
                <button
                  type="button"
                  onClick={() => alternar(c.numero)}
                  aria-expanded={abierto}
                  aria-controls={panel}
                  className="flex w-full items-center gap-4 py-5 text-left"
                >
                  <span className="dir-dato w-6 flex-none text-[var(--dir-sobre-tinta-suave)]">{String(c.numero).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 text-[clamp(1.25rem,1.1rem+0.5vw,1.55rem)] leading-tight [font-family:var(--fuente-titulo)] font-medium">{c.titulo}</span>
                  <span className="dir-dato flex-none text-[12px] text-[var(--dir-sobre-tinta-suave)]">{T.audios(c.frases.length)}</span>
                  <svg aria-hidden viewBox="0 0 24 24" className={`voz-flecha h-4 w-4 flex-none text-[var(--dir-sobre-tinta-suave)] ${abierto ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </h3>
              <div id={panel} className="voz-panel" data-abierto={abierto} inert={!abierto}>
                <ul className="min-h-0 overflow-hidden">
                  {c.frases.map((f) => (
                    <li key={f.id} id={`f-${f.id}`} className="flex scroll-mt-24 flex-col gap-3 border-t border-[var(--dir-hilo-tinta)] py-4">
                      <div className="flex items-center gap-3">
                        <BotonPlay id={f.id} texto={f.texto} idioma={idioma} />
                        <OndaFrase id={f.id} segundos={f.segundos} />
                      </div>
                      <p className="pl-14 text-[17px] italic leading-[1.5] text-[#d6d2c8] [font-family:var(--fuente-titulo)] [text-wrap:pretty]">«{f.texto}»</p>
                      <div className="pl-14">
                        <CompartirFrase texto={f.texto} nombre={nombre} ancla={`f-${f.id}`} idioma={idioma} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
      {!todos ? (
        <button type="button" onClick={() => setTodos(true)} className="dir-enlace mt-6 text-[14px]">
          {T.verTodos(capitulos.length)} →
        </button>
      ) : null}
    </div>
  );
}
