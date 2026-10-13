"use client";

import { useEffect, useRef, useState } from "react";

// «Su voz sonando» (MOTION.md patrón 9): un botón redondo y 20 barras que se
// mueven como una onda mientras suena. La onda es decorativa (alturas fijas,
// CSS puro con data-playing): no se analiza el audio, que en un móvil viejo
// cuesta CPU. Un solo <audio> por reproductor, con preload="none": el audio
// se baja recién al tocar play. Y si empieza a sonar, se pausa cualquier otro
// audio de la página, así nunca suenan dos a la vez.

// Alturas en px (12–38), fijas para que el servidor y el cliente pinten igual.
const ALTURAS = [14, 24, 34, 20, 38, 26, 16, 30, 22, 36, 18, 28, 12, 32, 24, 38, 20, 14, 30, 22];

export function ReproductorOnda({
  src,
  etiquetaReproducir,
  etiquetaPausar,
}: {
  src: string;
  /** Nombre accesible del botón cuando está quieto, p. ej. «Escuchar su voz». */
  etiquetaReproducir: string;
  etiquetaPausar: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
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

  function alternar() {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => setSonando(false));
    } else {
      a.pause();
    }
  }

  return (
    <div className="flex items-center gap-4" data-playing={sonando ? "true" : "false"}>
      <button
        type="button"
        onClick={alternar}
        aria-label={sonando ? etiquetaPausar : etiquetaReproducir}
        className="m-btn flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--boton)] text-[var(--sobre-boton)] [touch-action:manipulation]"
      >
        {sonando ? (
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
      <div aria-hidden className="flex h-10 items-center gap-[3px]">
        {ALTURAS.map((alto, i) => (
          <span
            key={i}
            className="m-bar block w-[3px] rounded-full bg-[var(--acento-oscuro)]"
            style={{ height: `${alto}px` }}
          />
        ))}
      </div>
      <audio ref={audio} src={src} preload="none" />
    </div>
  );
}
