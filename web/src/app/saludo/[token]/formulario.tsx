"use client";

import { useRef, useState } from "react";

const DURACION_MAXIMA_MS = 3 * 60 * 1000;
const MENSAJE_ERROR_GENERICO = "No pudimos enviar el saludo. Intenta de nuevo.";

type Etapa = "inicial" | "grabando" | "listo" | "enviando" | "enviado";

export function FormularioSaludo({ token }: { token: string }) {
  const [etapa, setEtapa] = useState<Etapa>("inicial");
  const [nombre, setNombre] = useState("");
  const [vinculo, setVinculo] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (etapa === "enviado") {
    return (
      <p className="text-sm leading-relaxed text-zinc-700">
        Gracias — tu saludo quedó guardado. Se lo vamos a entregar junto con el libro de su
        vida.
      </p>
    );
  }

  function setAudio(blob: Blob) {
    setAudioBlob(blob);
    setAudioUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return URL.createObjectURL(blob);
    });
    setEtapa("listo");
  }

  async function empezarGrabacion() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) chunksRef.current.push(evento.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudio(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setEtapa("grabando");

      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, DURACION_MAXIMA_MS);
    } catch {
      setError("No pudimos acceder al micrófono. Revisa los permisos o sube un audio grabado.");
    }
  }

  function pararGrabacion() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function elegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (archivo) setAudio(archivo);
  }

  function grabarDeNuevo() {
    setAudioBlob(null);
    setAudioUrl((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return null;
    });
    setEtapa("inicial");
  }

  async function enviar() {
    if (!audioBlob) return;
    if (!nombre.trim() || !vinculo.trim()) {
      setError("Cuéntanos tu nombre y qué eres de él/ella.");
      return;
    }

    setEtapa("enviando");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("nombre", nombre.trim());
      formData.append("vinculo", vinculo.trim());
      formData.append("audio", audioBlob, "saludo.webm");

      const respuesta = await fetch("/api/saludos", { method: "POST", body: formData });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setError(datos?.error ?? MENSAJE_ERROR_GENERICO);
        setEtapa("listo");
        return;
      }

      setEtapa("enviado");
    } catch {
      setError(MENSAJE_ERROR_GENERICO);
      setEtapa("listo");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {etapa === "inicial" ? (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={empezarGrabacion}
            className="flex h-20 w-full items-center justify-center rounded-full bg-zinc-900 text-lg font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Grabar 🎙️
          </button>
          <p className="text-xs text-zinc-500">o si prefieres, sube un audio ya grabado</p>
          <input
            type="file"
            accept="audio/*"
            onChange={elegirArchivo}
            className="text-sm text-zinc-600"
          />
        </div>
      ) : null}

      {etapa === "grabando" ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-zinc-600">Grabando... hasta 3 minutos.</p>
          <button
            type="button"
            onClick={pararGrabacion}
            className="flex h-20 w-full items-center justify-center rounded-full bg-red-700 text-lg font-medium text-white transition-colors hover:bg-red-800"
          >
            Parar ⏹️
          </button>
        </div>
      ) : null}

      {(etapa === "listo" || etapa === "enviando") && audioUrl ? (
        <div className="flex flex-col gap-4">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={audioUrl} className="w-full" />
          <button
            type="button"
            onClick={grabarDeNuevo}
            disabled={etapa === "enviando"}
            className="text-xs text-zinc-400 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-600 disabled:opacity-60"
          >
            Grabar de nuevo
          </button>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Tu nombre
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={etapa === "enviando"}
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            ¿Qué eres de él/ella?
            <input
              type="text"
              value={vinculo}
              onChange={(e) => setVinculo(e.target.value)}
              disabled={etapa === "enviando"}
              placeholder="nieta, hijo, amigo de toda la vida..."
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={enviar}
            disabled={etapa === "enviando"}
            className="h-12 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            {etapa === "enviando" ? "Enviando..." : "Enviar el saludo"}
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
