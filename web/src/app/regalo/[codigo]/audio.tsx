"use client";

import { useRef, useState } from "react";

// El audio de quien regala (spec §5): un botón de play grande, negro, y nada
// más. El audio se baja recién con el toque (preload="none") y nunca suena
// solo. El botón toma su nombre accesible del título de la página
// (aria-labelledby): así no hace falta un texto nuevo que no esté aprobado.

export function AudioRegalo({ src, etiquetadoPor }: { src: string; etiquetadoPor: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = useState(false);

  async function alternar() {
    const a = audio.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    try {
      await a.play();
    } catch {
      setSonando(false);
    }
  }

  return (
    <div className="mt-8">
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => setSonando(false)}
      />
      <button
        type="button"
        onClick={alternar}
        aria-labelledby={etiquetadoPor}
        aria-pressed={sonando}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14140F] text-white transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14140F] [touch-action:manipulation]"
      >
        {sonando ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" aria-hidden fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
