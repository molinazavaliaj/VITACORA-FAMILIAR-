"use client";

import { useEffect, useRef, useState } from "react";
import { textosComprador, type TextosComprador } from "@/lib/regalo-textos";

// El audio de quien regala (plan 2026-10-07-gift-card, Task 8): se graba en el
// navegador con MediaRecorder, con tope de 2 minutos. Si el navegador no sabe
// grabar o se niega el micrófono, se elige un archivo de audio. El audio
// queda en memoria hasta pagar: el formulario lo sube con el token del pedido.

/** Lo que acepta POST /api/regalo/audio (Task 5). */
const TIPOS = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/x-m4a"];
const MAXIMO_BYTES = 10 * 1024 * 1024;
const TOPE_SEGUNDOS = 120;

const boton = "inline-flex h-11 items-center justify-center rounded-full border border-[#14140F] bg-white px-5 text-[15px] text-[#14140F] transition-colors hover:bg-[#14140F] hover:text-white disabled:opacity-60 [font-family:var(--fuente-micro)] [touch-action:manipulation]";

function reloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** El primer tipo de la lista que este navegador sabe grabar; "" = el que elija él. */
function tipoParaGrabar(): string {
  if (typeof MediaRecorder.isTypeSupported !== "function") return "";
  return TIPOS.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

/** "audio/webm;codecs=opus" → "audio/webm"; si no está en la lista, null. */
function tipoAceptado(tipo: string): string | null {
  const base = tipo.split(";")[0].trim().toLowerCase();
  return TIPOS.includes(base) ? base : null;
}

/**
 * `audio` vive en el formulario: si se va y vuelve al paso, el audio sigue ahí.
 * `etiquetadoPor`: el id del texto que nombra al grupo (la etiqueta 15).
 * `textos`: los de quien compra, en su trato (vos si no se pasan).
 */
export function Grabador({ audio, onAudio, etiquetadoPor, textos = textosComprador("vos") }: {
  audio: Blob | null; onAudio: (audio: Blob | null) => void; etiquetadoPor?: string; textos?: TextosComprador;
}) {
  const [puedeGrabar, setPuedeGrabar] = useState(true);
  const [grabando, setGrabando] = useState(false);
  const [sonando, setSonando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const grabador = useRef<MediaRecorder | null>(null);
  const reproductor = useRef<HTMLAudioElement>(null);
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);
  // Un segundo toque a Grabar mientras el navegador pide el micrófono no hace nada.
  const iniciando = useRef(false);
  const montado = useRef(true);

  useEffect(() => {
    if (typeof window.MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) setPuedeGrabar(false);
  }, []);

  // Al salir: se corta el micrófono. Si el permiso llega después, grabar() lo corta.
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (temporizador.current) clearInterval(temporizador.current);
      if (grabador.current?.state === "recording") grabador.current.stop();
    };
  }, []);
  // La dirección para escucharlo, mientras haya audio.
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!audio) { setUrl(null); return; }
    const u = URL.createObjectURL(audio);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [audio]);

  async function grabar() {
    if (iniciando.current || grabando) return;
    iniciando.current = true;
    setError(null);
    let flujo: MediaStream;
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      iniciando.current = false;
      if (montado.current) setPuedeGrabar(false);
      return;
    }
    const cortar = () => flujo.getTracks().forEach((t) => t.stop());
    if (!montado.current) {
      iniciando.current = false;
      cortar();
      return;
    }
    const tipo = tipoParaGrabar();
    let r: MediaRecorder;
    try {
      r = tipo ? new MediaRecorder(flujo, { mimeType: tipo }) : new MediaRecorder(flujo);
    } catch {
      iniciando.current = false;
      cortar();
      setPuedeGrabar(false);
      return;
    }
    const partes: Blob[] = [];
    r.ondataavailable = (e) => { if (e.data.size > 0) partes.push(e.data); };
    r.onstop = () => {
      cortar();
      if (temporizador.current) clearInterval(temporizador.current);
      temporizador.current = null;
      setGrabando(false);
      const aceptado = tipoAceptado(r.mimeType || tipo);
      if (!aceptado || partes.length === 0) {
        setError(textos.audioNoSirve);
        return;
      }
      onAudio(new Blob(partes, { type: aceptado }));
    };
    grabador.current = r;
    try {
      r.start();
    } catch {
      iniciando.current = false;
      cortar();
      setPuedeGrabar(false);
      return;
    }
    iniciando.current = false;
    setGrabando(true);
    setSegundos(0);
    const inicio = Date.now();
    temporizador.current = setInterval(() => {
      const s = Math.floor((Date.now() - inicio) / 1000);
      setSegundos(Math.min(s, TOPE_SEGUNDOS));
      if (s >= TOPE_SEGUNDOS && r.state === "recording") r.stop();
    }, 250);
  }

  function parar() {
    if (grabador.current?.state === "recording") grabador.current.stop();
  }

  /** Escuchar y Parar en el mismo botón. */
  function escuchar() {
    const a = reproductor.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      a.currentTime = 0;
      return;
    }
    a.play().catch(() => setSonando(false));
  }

  function borrar() {
    reproductor.current?.pause();
    setSonando(false);
    setSegundos(0);
    setError(null);
    onAudio(null);
  }

  function elegir(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    // Sin tipo (pasa con algunos .m4a): decide el servidor. Si lo rechaza, el regalo vale sin audio.
    if ((archivo.type !== "" && !tipoAceptado(archivo.type)) || archivo.size > MAXIMO_BYTES) {
      setError(textos.audioNoSirve);
      return;
    }
    setError(null);
    onAudio(archivo);
  }

  return (
    <div className="mt-3" role="group" aria-labelledby={etiquetadoPor}>
      {audio && url ? (
        <div className="flex flex-wrap items-center gap-3">
          <audio
            ref={reproductor}
            src={url}
            preload="metadata"
            onPlay={() => setSonando(true)}
            onPause={() => setSonando(false)}
            onEnded={() => setSonando(false)}
          />
          <button type="button" className={boton} onClick={escuchar} aria-pressed={sonando}>
            {sonando ? textos.parar : textos.escuchar}
          </button>
          <button type="button" className={boton} onClick={borrar}>{textos.borrar}</button>
        </div>
      ) : puedeGrabar ? (
        <div className="flex flex-wrap items-center gap-3">
          {grabando ? (
            <button type="button" className={boton} onClick={parar}>{textos.parar}</button>
          ) : (
            <button type="button" className={boton} onClick={grabar}>{textos.grabar}</button>
          )}
          {grabando && (
            <span className="flex items-center gap-2 text-[14px] tabular-nums text-[#5F5F55] [font-family:var(--fuente-micro)]">
              <span className="h-2 w-2 rounded-full bg-[#B42318]" aria-hidden />
              {reloj(segundos)} / {reloj(TOPE_SEGUNDOS)}
            </span>
          )}
        </div>
      ) : (
        <label className="block">
          <span className="text-[14px] text-[#5F5F55] [font-family:var(--fuente-micro)]">{textos.elegirAudio}</span>
          <input type="file" accept="audio/*" onChange={elegir} className="mt-2 block w-full text-[15px] [font-family:var(--fuente-micro)]" />
        </label>
      )}
      {error && <p className="mt-2 text-[14px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}
    </div>
  );
}
