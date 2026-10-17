"use client";

import { useState } from "react";
import { Boton, ContenidoPaso, Hoja, Pasos, ReproductorOnda } from "../_ui";

// Las piezas de /sistema que necesitan estado: la hoja, los pasos que avanzan,
// el total que cambia y el reproductor. Solo para revisar el sistema.

export function DemoHoja() {
  const [abierta, setAbierta] = useState(false);
  return (
    <>
      <Boton onClick={() => setAbierta(true)}>Abrir la hoja</Boton>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Título de la hoja" etiquetaCerrar="Cerrar">
        <p className="text-[var(--texto-oscuro-suave)]">
          Texto de ejemplo. Esc, el velo o la cruz la cierran; Tab no sale de acá.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Boton onClick={() => setAbierta(false)}>Botón primario</Boton>
          <Boton variante="fantasma" onClick={() => setAbierta(false)}>
            Botón fantasma
          </Boton>
        </div>
      </Hoja>
    </>
  );
}

const NOMBRES_PASOS = ["Paso uno", "Paso dos", "Paso tres"];

export function DemoPasos() {
  const [paso, setPaso] = useState(1);
  return (
    <div className="flex flex-col gap-6">
      <Pasos pasos={NOMBRES_PASOS} actual={paso} etiqueta="Pasos de ejemplo" />
      <ContenidoPaso key={paso}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
          Paso {paso} de {NOMBRES_PASOS.length}
        </p>
        <p className="mt-2 text-2xl text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">
          Contenido del {NOMBRES_PASOS[paso - 1].toLowerCase()}
        </p>
      </ContenidoPaso>
      <div className="flex flex-wrap gap-3">
        <Boton variante="fantasma" disabled={paso === 1} onClick={() => setPaso((p) => Math.max(1, p - 1))}>
          Atrás
        </Boton>
        <Boton disabled={paso === NOMBRES_PASOS.length} onClick={() => setPaso((p) => Math.min(NOMBRES_PASOS.length, p + 1))}>
          Seguir
        </Boton>
      </div>
    </div>
  );
}

export function DemoTotal() {
  const [total, setTotal] = useState(10);
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-lg text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">
        Total{" "}
        <span key={total} className="m-price font-semibold tabular-nums">
          {total}
        </span>
      </span>
      <Boton variante="fantasma" onClick={() => setTotal((t) => (t === 10 ? 15 : 10))}>
        Cambiar el total
      </Boton>
    </div>
  );
}

// Dos segundos de silencio en WAV (8 kHz, 8 bits), armado acá mismo: el repo
// no tiene ningún audio de ejemplo y no hace falta bajar uno para ver la onda.
function silencio(): string {
  const muestras = 16000;
  const bytes: number[] = [];
  const texto = (s: string) => [...s].forEach((c) => bytes.push(c.charCodeAt(0)));
  const u32 = (n: number) => bytes.push(n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255);
  const u16 = (n: number) => bytes.push(n & 255, (n >> 8) & 255);
  texto("RIFF");
  u32(36 + muestras);
  texto("WAVEfmt ");
  u32(16);
  u16(1); // PCM
  u16(1); // mono
  u32(8000);
  u32(8000);
  u16(1);
  u16(8);
  texto("data");
  u32(muestras);
  for (let i = 0; i < muestras; i++) bytes.push(128);
  return "data:audio/wav;base64," + btoa(String.fromCharCode(...bytes));
}

const SILENCIO = silencio();

export function DemoReproductor() {
  return <ReproductorOnda src={SILENCIO} etiquetaReproducir="Reproducir" etiquetaPausar="Pausar" />;
}
