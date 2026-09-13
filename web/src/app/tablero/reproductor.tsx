"use client";

import { useEffect, useRef, useState } from "react";

// El reproductor de una respuesta. Reemplaza al <audio controls> nativo, que
// se ve distinto en cada navegador y no respeta la marca. Es un botón de
// play, una barra para moverse (un <input type="range">: accesible con
// teclado sin escribir nada) y el tiempo. El audio se carga recién al tocar
// play — una historia tiene 30 respuestas y no hay que bajar 30 audios.

function mmss(segundos: number) {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ReproductorRespuesta({
  src,
  duracion,
  etiqueta,
}: {
  src: string;
  /** Duración conocida de antemano (de la base), para mostrarla sin cargar el audio. */
  duracion?: number | null;
  etiqueta: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [total, setTotal] = useState(duracion ?? 0);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const alTiempo = () => setTiempo(a.currentTime);
    const alDuracion = () => Number.isFinite(a.duration) && setTotal(a.duration);
    const alFin = () => {
      setSonando(false);
      setTiempo(0);
    };
    const alEsperar = () => setCargando(true);
    const alListo = () => setCargando(false);
    a.addEventListener("timeupdate", alTiempo);
    a.addEventListener("loadedmetadata", alDuracion);
    a.addEventListener("durationchange", alDuracion);
    a.addEventListener("ended", alFin);
    a.addEventListener("waiting", alEsperar);
    a.addEventListener("playing", alListo);
    a.addEventListener("canplay", alListo);
    return () => {
      a.removeEventListener("timeupdate", alTiempo);
      a.removeEventListener("loadedmetadata", alDuracion);
      a.removeEventListener("durationchange", alDuracion);
      a.removeEventListener("ended", alFin);
      a.removeEventListener("waiting", alEsperar);
      a.removeEventListener("playing", alListo);
      a.removeEventListener("canplay", alListo);
    };
  }, []);

  async function alternar() {
    const a = audio.current;
    if (!a) return;
    if (sonando) {
      a.pause();
      setSonando(false);
      return;
    }
    // Un solo audio a la vez: si otro está sonando, se pausa.
    document.querySelectorAll<HTMLAudioElement>("audio[data-respuesta]").forEach((otro) => {
      if (otro !== a) otro.pause();
    });
    try {
      setCargando(true);
      await a.play();
      setSonando(true);
    } catch {
      setSonando(false);
    } finally {
      setCargando(false);
    }
  }

  const porcentaje = total > 0 ? Math.min(100, (tiempo / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 rounded-full border border-[var(--linea)] bg-[var(--relieve)] py-1.5 pl-1.5 pr-4">
      <audio ref={audio} src={src} preload="none" data-respuesta onPause={() => setSonando(false)} onPlay={() => setSonando(true)} />
      <button
        type="button"
        onClick={alternar}
        aria-label={sonando ? `Pausar: ${etiqueta}` : `Escuchar: ${etiqueta}`}
        aria-pressed={sonando}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--texto)] text-[var(--fondo)] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] [touch-action:manipulation]"
      >
        {cargando ? (
          <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--fondo)] border-t-transparent" />
        ) : sonando ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" aria-hidden fill="currentColor">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>

      <div className="relative flex h-10 min-w-0 flex-1 items-center">
        <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-[var(--linea)]">
          <div className="h-full bg-[var(--texto)]" style={{ width: `${porcentaje}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={total || 0}
          step={0.5}
          value={Math.min(tiempo, total || 0)}
          disabled={!total}
          aria-label={`Posición en el audio: ${etiqueta}`}
          onChange={(e) => {
            const a = audio.current;
            const v = Number(e.target.value);
            setTiempo(v);
            if (a) a.currentTime = v;
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </div>

      <span className="shrink-0 text-[12px] tabular-nums text-[var(--texto-menor)] [font-family:var(--fuente-micro)]">
        {sonando || tiempo > 0 ? `${mmss(tiempo)} / ` : ""}
        {mmss(total)}
      </span>
    </div>
  );
}
