"use client";

import { useEffect, useRef, useState } from "react";

// «Lo último que contó» (rediseño 2026-10, fase 2; RENDIMIENTO 3.16): los
// tres audios más nuevos, cada uno con su botón y su onda. Un solo <audio>
// para los tres (cambia de fuente al tocar otro) con preload="none": no se
// baja nada hasta que alguien toca play. La onda es decorativa (MOTION 9:
// alturas fijas, CSS con data-playing), nunca el análisis del audio. Si
// empieza a sonar, se calla cualquier otro audio de la página.

// Alturas en px (6–24), fijas para que el servidor y el cliente pinten igual.
const ALTURAS = [8, 14, 20, 12, 24, 16, 10, 18, 13, 22, 9, 17, 7, 19, 14, 23, 11, 8, 18, 12];

export type ItemUltimo = {
  id: string;
  titulo: string;
  /** «5:48» o vacío. */
  duracion: string;
  /** «Hace 3 días». */
  cuando: string;
};

export function UltimoQueConto({ items, escuchar, pausar }: { items: ItemUltimo[]; escuchar: string; pausar: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [actual, setActual] = useState<string | null>(null);
  const [sonando, setSonando] = useState(false);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const alSonar = () => {
      setSonando(true);
      document.querySelectorAll("audio").forEach((otro) => {
        if (otro !== a && !otro.paused) otro.pause();
      });
    };
    const alParar = () => setSonando(false);
    a.addEventListener("play", alSonar);
    a.addEventListener("pause", alParar);
    a.addEventListener("ended", alParar);
    return () => {
      a.removeEventListener("play", alSonar);
      a.removeEventListener("pause", alParar);
      a.removeEventListener("ended", alParar);
    };
  }, []);

  function alternar(id: string) {
    const a = audio.current;
    if (!a) return;
    if (actual === id) {
      if (a.paused) a.play().catch(() => setSonando(false));
      else a.pause();
      return;
    }
    a.src = `/api/audio/${id}`;
    setActual(id);
    a.play().catch(() => setSonando(false));
  }

  return (
    <div>
    <ul className="flex flex-col">
      {items.map((it) => {
        const esta = actual === it.id && sonando;
        return (
          <li key={it.id} className="flex items-center gap-4 border-t border-[var(--linea)] py-4 first:border-t-0 first:pt-1">
            <button type="button" onClick={() => alternar(it.id)} aria-label={`${esta ? pausar : escuchar}, ${it.titulo}`} aria-pressed={esta} className="pnl-play">
              {esta ? (
                <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                  <rect x="3" y="2" width="3.5" height="12" rx="1" />
                  <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
                </svg>
              ) : (
                <svg aria-hidden viewBox="0 0 16 16" className="ml-0.5 h-4 w-4" fill="currentColor">
                  <path d="M4 2.5v11a.75.75 0 0 0 1.14.64l9-5.5a.75.75 0 0 0 0-1.28l-9-5.5A.75.75 0 0 0 4 2.5Z" />
                </svg>
              )}
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="line-clamp-2 text-[15.5px] leading-snug [font-family:var(--fuente-titulo)]">{it.titulo}</p>
              <div className="flex items-center justify-between gap-3">
                <span aria-hidden className="pnl-onda text-[var(--texto-menor)]" data-playing={esta ? "true" : "false"}>
                  {ALTURAS.map((alto, i) => (
                    <span key={i} className="m-bar" style={{ height: `${alto}px` }} />
                  ))}
                </span>
                <span className="pnl-dato shrink-0 text-right text-[12px]">
                  {it.duracion ? <span className="block text-[var(--texto)]">{it.duracion}</span> : null}
                  {it.cuando}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
    <audio ref={audio} preload="none" data-respuesta />
    </div>
  );
}
