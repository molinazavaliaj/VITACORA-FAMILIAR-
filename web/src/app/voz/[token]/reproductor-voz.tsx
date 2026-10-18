"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ONDA } from "../../_direccion/piezas";
import { TEXTOS_VOZ } from "../../_textos/voz";
import { duracionCorta } from "@/lib/frases";
import type { IdiomaWeb } from "@/lib/idioma-web";

// Un solo <audio> para toda «Su voz» (maqueta SuVoz): el botón de la foto, la
// tarjeta «Empieza por aquí», cada frase de los capítulos y las del carrusel
// tocan el mismo, así nunca suenan dos a la vez y la onda que se mueve es la de
// lo que suena. Se carga recién al tocar play (preload="none"): un libro tiene
// decenas de frases y no hay que bajarlas todas.

type Estado = { id: string | null; sonando: boolean; cargando: boolean; tiempo: number; total: number };

type Voz = Estado & { alternar: (id: string) => void };

const Contexto = createContext<Voz | null>(null);

function useVoz(): Voz {
  const voz = useContext(Contexto);
  if (!voz) throw new Error("useVoz fuera de <ReproductorVoz>");
  return voz;
}

export function ReproductorVoz({ token, children }: { token: string; children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const actual = useRef<string | null>(null);
  const [estado, setEstado] = useState<Estado>({ id: null, sonando: false, cargando: false, tiempo: 0, total: 0 });

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const poner = (cambio: Partial<Estado>) => setEstado((e) => ({ ...e, ...cambio }));
    const alTiempo = () => poner({ tiempo: a.currentTime });
    const alDuracion = () => Number.isFinite(a.duration) && poner({ total: a.duration });
    const alFin = () => poner({ sonando: false, tiempo: 0 });
    const alPausa = () => poner({ sonando: false });
    const alPlay = () => poner({ sonando: true });
    const alEsperar = () => poner({ cargando: true });
    const alListo = () => poner({ cargando: false });
    const alError = () => poner({ sonando: false, cargando: false });
    const eventos: [string, () => void][] = [
      ["timeupdate", alTiempo],
      ["loadedmetadata", alDuracion],
      ["durationchange", alDuracion],
      ["ended", alFin],
      ["pause", alPausa],
      ["play", alPlay],
      ["waiting", alEsperar],
      ["playing", alListo],
      ["canplay", alListo],
      ["error", alError],
    ];
    for (const [nombre, fn] of eventos) a.addEventListener(nombre, fn);
    return () => {
      for (const [nombre, fn] of eventos) a.removeEventListener(nombre, fn);
    };
  }, []);

  const alternar = useCallback(
    async (id: string) => {
      const a = audio.current;
      if (!a) return;
      if (actual.current === id && !a.paused) {
        a.pause();
        return;
      }
      if (actual.current !== id) {
        actual.current = id;
        a.src = `/api/voz/${token}/audio/${encodeURIComponent(id)}`;
        setEstado({ id, sonando: false, cargando: true, tiempo: 0, total: 0 });
      }
      try {
        await a.play();
      } catch {
        setEstado((e) => ({ ...e, sonando: false, cargando: false }));
      }
    },
    [token],
  );

  return (
    <Contexto.Provider value={{ ...estado, alternar }}>
      <audio ref={audio} preload="none" className="hidden" />
      {children}
    </Contexto.Provider>
  );
}

function IconoPlay({ sonando, cargando }: { sonando: boolean; cargando: boolean }) {
  if (cargando) return <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
  return sonando ? (
    <svg viewBox="0 0 24 24" className="h-[38%] w-[38%]" aria-hidden fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="ml-[6%] h-[38%] w-[38%]" aria-hidden fill="currentColor">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

/** El círculo de play de una frase. */
export function BotonPlay({ id, texto, idioma, clase = "h-11 w-11" }: { id: string; texto: string; idioma: IdiomaWeb; clase?: string }) {
  const voz = useVoz();
  const T = TEXTOS_VOZ[idioma];
  const esta = voz.id === id;
  const sonando = esta && voz.sonando;
  return (
    <button
      type="button"
      onClick={() => voz.alternar(id)}
      aria-label={`${sonando ? T.pausar : T.escuchar}: ${T.etiquetaAudio(texto)}`}
      aria-pressed={sonando}
      data-sonando={sonando}
      className={`voz-play flex flex-none items-center justify-center rounded-full ${clase}`}
    >
      <IconoPlay sonando={sonando} cargando={esta && voz.cargando} />
    </button>
  );
}

/** La onda de la frase (se mueve mientras suena) y su duración. */
export function OndaFrase({ id, segundos, barras = 18 }: { id: string; segundos: number | null; barras?: number }) {
  const voz = useVoz();
  const esta = voz.id === id;
  const total = esta && voz.total > 0 ? voz.total : (segundos ?? 0);
  const restante = esta && voz.tiempo > 0 ? Math.max(0, total - voz.tiempo) : total;
  const avance = esta && total > 0 ? Math.min(1, voz.tiempo / total) : 0;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span aria-hidden data-sonando={esta && voz.sonando} className="voz-onda flex h-7 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
        {ONDA.slice(0, barras).map((alto, i) => (
          <span key={i} className="voz-barra" data-hecha={i / barras < avance} style={{ height: Math.round(alto * 0.8) }} />
        ))}
      </span>
      {total > 0 ? <span className="dir-dato flex-none text-[var(--dir-sobre-tinta-suave)]">{duracionCorta(restante)}</span> : null}
    </div>
  );
}

/** El botón grande de la foto: suena la primera frase y baja a «Empieza por aquí». */
export function BotonPortada({ id, nombre, idioma }: { id: string; nombre: string; idioma: IdiomaWeb }) {
  const voz = useVoz();
  const T = TEXTOS_VOZ[idioma];
  const sonando = voz.id === id && voz.sonando;
  return (
    <button
      type="button"
      onClick={() => {
        voz.alternar(id);
        document.getElementById("empieza")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      aria-label={T.escucharA(nombre)}
      className="voz-portada-boton group flex flex-col items-center gap-6 text-white"
    >
      <span className="relative flex h-[88px] w-[88px] items-center justify-center">
        <span aria-hidden className="voz-anillo" />
        <span aria-hidden className="voz-anillo voz-anillo--2" />
        <span className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[var(--dir-papel)] text-[var(--dir-tinta)] transition-transform duration-200 group-active:scale-95">
          <IconoPlay sonando={sonando} cargando={voz.id === id && voz.cargando} />
        </span>
      </span>
      <span className="dir-titular text-[clamp(2.4rem,1.6rem+3vw,4.2rem)] leading-[1.02]">{nombre}</span>
      <span className="text-[15px] text-white/85 [font-family:var(--fuente-micro)]">{T.tocaYEscucha}</span>
    </button>
  );
}
