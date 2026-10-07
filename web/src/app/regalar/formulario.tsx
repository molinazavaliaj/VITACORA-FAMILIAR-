"use client";

import { useState } from "react";
import type { Catalogo } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { GENEROS, MENSAJE_MAXIMO, type Genero } from "@/lib/regalo-reglas";
import { TEXTOS_REGALO as T } from "@/lib/regalo-textos";
import { formatearPrecio } from "../comprar/productos-ui";
import { Grabador } from "./grabador";

// La compra del regalo (plan 2026-10-07-gift-card, Task 8), en cuatro pasos:
// a quién · tu mensaje · tus datos · pagar. Imita el checkout chico de
// /comprar/viaje. Quien regala no carga el teléfono del narrador: el narrador
// lo da cuando escanea la tarjeta y le escribe al biógrafo. Un POST a
// /api/compra con `regalo`; si hay audio, se sube con el token que devuelve y,
// salga bien o mal, se sigue al pago (el regalo vale sin audio).
//
// ⚠️ Todos los textos salen de TEXTOS_REGALO y están a aprobar por Naza.

type Paso = 1 | 2 | 3 | 4;

const campo = "w-full rounded-md border border-[#D4D4CE] bg-white px-4 py-3 text-[16px] text-[#14140F] outline-none transition-colors placeholder:text-[#AEAEA6] focus:border-[#14140F] [font-family:var(--fuente-cuerpo)]";
const etiqueta = "block text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]";
const titulo = "text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl";

/** Hoy en el reloj de quien compra, como lo pide `input type="date"`. */
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FormularioRegalo({ catalogo, region, pasoInicial = 1 }: { catalogo: Catalogo; region: Region; pasoInicial?: Paso }) {
  const [paso, setPaso] = useState<Paso>(pasoInicial);
  const [nombre, setNombre] = useState("");
  const [comoLeDicen, setComoLeDicen] = useState("");
  const [genero, setGenero] = useState<Genero | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [nombreComprador, setNombreComprador] = useState("");
  const [vinculoComprador, setVinculoComprador] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const precio = formatearPrecio(catalogo.base.precio, catalogo.moneda, region);

  function avanzar(siguiente: Paso) {
    setError(null);
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pagar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreComprador: nombreComprador.trim(),
          vinculoComprador: vinculoComprador.trim(),
          region,
          email: email.trim(),
          narrador: { nombre: nombre.trim(), comoLeDicen: comoLeDicen.trim() },
          regalo: { mensaje: mensaje.trim(), fechaEntrega: fechaEntrega || undefined, genero },
          productos: { impresos: 0, marcos: 0 },
        }),
      });
      const datos = (await r.json()) as { urlPago?: string; narradorId?: string; tokenFotos?: string; error?: string };
      if (!r.ok || !datos.urlPago) {
        setError(datos.error ?? T.errorPago);
        setEnviando(false);
        return;
      }
      if (audio && datos.narradorId && datos.tokenFotos) {
        const fd = new FormData();
        fd.append("audio", audio);
        // Si el audio falla, se sigue al pago igual: el regalo vale sin audio.
        await fetch(`/api/regalo/audio?narrador=${encodeURIComponent(datos.narradorId)}&token=${encodeURIComponent(datos.tokenFotos)}`, { method: "POST", body: fd }).catch(() => {});
      }
      window.location.assign(datos.urlPago);
    } catch {
      setError(T.errorPago);
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:py-16">
      <div className="min-w-0">
        <ol className="flex gap-3 sm:gap-8">
          {T.pasos.map((nombrePaso, i) => {
            const n = i + 1;
            return (
              <li key={nombrePaso} className="min-w-0 flex-1" aria-current={n === paso ? "step" : undefined}>
                <p className={`truncate text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.18em] sm:[letter-spacing:0.24em] ${n === paso ? "text-[#14140F]" : "text-[#AEAEA6]"}`}>{n}.<span className={n === paso ? "" : "hidden sm:inline"}> {nombrePaso}</span></p>
                <div className={`mt-2 h-[3px] rounded-full ${n <= paso ? "bg-[#14140F]" : "bg-[#D4D4CE]"}`} />
              </li>
            );
          })}
        </ol>

        {/* ── 1 · A quién ── */}
        {paso === 1 && (
          <section className="mt-12">
            <h1 className={titulo}>{T.pasos[0]}</h1>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className={etiqueta} htmlFor="nombre">{T.aQuien}</label>
                <input id="nombre" className={`${campo} mt-2`} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label className={etiqueta} htmlFor="apodo">{T.comoLeDecis}</label>
                <input id="apodo" className={`${campo} mt-2`} value={comoLeDicen} onChange={(e) => setComoLeDicen(e.target.value)} placeholder={T.comoLeDecisPista} autoComplete="off" />
              </div>
            </div>
            <fieldset className="mt-8">
              <legend className={etiqueta}>{T.genero}</legend>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {GENEROS.map((g) => (
                  <label key={g} className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3 text-[16px] [font-family:var(--fuente-cuerpo)] ${genero === g ? "border-2 border-[#14140F]" : "border-[#D4D4CE]"}`}>
                    <input type="radio" name="genero" value={g} checked={genero === g} onChange={() => setGenero(g)} />
                    {T.generos[g]}
                  </label>
                ))}
              </div>
            </fieldset>
            <Botones
              siguiente={() => {
                if (!nombre.trim()) return setError(T.faltaNombre);
                if (!comoLeDicen.trim()) return setError(T.faltaComoLeDecis);
                if (!genero) return setError(T.faltaGenero);
                avanzar(2);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 2 · Tu mensaje ── */}
        {paso === 2 && (
          <section className="mt-12">
            <h1 className={titulo}>{T.pasos[1]}</h1>
            <div className="mt-8">
              <label className={etiqueta} htmlFor="mensaje">{T.tuMensaje}</label>
              <textarea id="mensaje" className={`${campo} mt-2`} rows={6} value={mensaje} maxLength={MENSAJE_MAXIMO} onChange={(e) => setMensaje(e.target.value)} />
              <p className="mt-1 text-right text-[13px] tabular-nums text-[#83837A] [font-family:var(--fuente-micro)]" aria-live="polite">{T.contador(mensaje.length, MENSAJE_MAXIMO)}</p>
            </div>
            <div className="mt-6">
              <p className={etiqueta}>{T.audio}</p>
              <Grabador audio={audio} onAudio={setAudio} />
            </div>
            <div className="mt-8 sm:max-w-xs">
              <label className={etiqueta} htmlFor="fecha">{T.cuando}</label>
              <input id="fecha" type="date" className={`${campo} mt-2`} value={fechaEntrega} min={hoyLocal()} onChange={(e) => setFechaEntrega(e.target.value)} />
            </div>
            <Botones
              atras={() => avanzar(1)}
              siguiente={() => {
                if (!mensaje.trim()) return setError(T.faltaMensaje);
                avanzar(3);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 3 · Tus datos ── */}
        {paso === 3 && (
          <section className="mt-12">
            <h1 className={titulo}>{T.pasos[2]}</h1>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={etiqueta} htmlFor="comprador">{T.tuNombre}</label>
                <input id="comprador" className={`${campo} mt-2`} value={nombreComprador} onChange={(e) => setNombreComprador(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className={etiqueta} htmlFor="vinculo">{T.queEsTuyo}</label>
                <input id="vinculo" className={`${campo} mt-2`} value={vinculoComprador} onChange={(e) => setVinculoComprador(e.target.value)} placeholder={T.queEsTuyoPista} />
              </div>
              <div>
                <label className={etiqueta} htmlFor="email">{T.tuCorreo}</label>
                <input id="email" type="email" className={`${campo} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
              </div>
            </div>
            <Botones
              atras={() => avanzar(2)}
              siguiente={() => {
                if (!nombreComprador.trim()) return setError(T.faltaTuNombre);
                if (!vinculoComprador.trim()) return setError(T.faltaQueEsTuyo);
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError(T.correoMal);
                avanzar(4);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 4 · Pagar ── */}
        {paso === 4 && (
          <form onSubmit={pagar} className="mt-12">
            <h1 className={titulo}>{T.pasos[3]}</h1>
            <div className="mt-8">
              <TarjetaChica comoLeDicen={comoLeDicen.trim()} mensaje={mensaje.trim()} firma={nombreComprador.trim()} />
            </div>
            <div className="mt-8 flex items-baseline justify-between gap-4 rounded-lg border border-[#EBEBE7] bg-white p-5">
              <p className="text-[17px] [font-family:var(--fuente-titulo)]">{catalogo.base.nombre}</p>
              <p className="text-[22px] tabular-nums [font-family:var(--fuente-titulo)]">{precio}</p>
            </div>
            {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => avanzar(3)} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← {T.atras}</button>
              <button type="submit" disabled={enviando} className="inline-flex min-h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 py-3 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] disabled:opacity-60 [font-family:var(--fuente-micro)] [touch-action:manipulation]">
                {enviando ? T.unMomento : T.botonPagar}
              </button>
            </div>
            <p className="mt-4 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
              Pago único y seguro con {region === "ES" ? "Stripe" : "Mercado Pago"}. Al pagar aceptás los{" "}
              <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">términos</a>.
            </p>
          </form>
        )}
      </div>

      {/* En el paso de pagar el precio ya está en el resumen: en el celular no se repite. */}
      <aside className={`lg:sticky lg:top-8 lg:self-start ${paso === 4 ? "hidden lg:block" : ""}`}>
        <div className="rounded-lg border border-[#EBEBE7] bg-white p-6">
          <p className="text-[17px] [font-family:var(--fuente-titulo)]">{catalogo.base.nombre}</p>
          <p className="mt-2 text-[15px] leading-[1.7] text-[#45453C] [font-family:var(--fuente-cuerpo)] font-light">{catalogo.base.detalle}</p>
          <p className="mt-4 text-[24px] tabular-nums [font-family:var(--fuente-titulo)]">{precio}</p>
        </div>
      </aside>
    </div>
  );
}

/** La cara de adentro de la tarjeta (Task 7), en chico: el saludo, el mensaje y la firma. */
function TarjetaChica({ comoLeDicen, mensaje, firma }: { comoLeDicen: string; mensaje: string; firma: string }) {
  return (
    <div className="mx-auto flex aspect-[105/148] w-full max-w-[260px] flex-col gap-3 overflow-hidden bg-white p-6 shadow-[0_18px_34px_-20px_rgba(20,20,15,0.4)]">
      <p className="text-[18px] [font-family:var(--fuente-titulo)]">{comoLeDicen},</p>
      <p className={`flex-1 overflow-hidden whitespace-pre-line italic leading-[1.5] [overflow-wrap:anywhere] [font-family:var(--fuente-titulo)] ${mensaje.length > 250 ? "text-[10px]" : "text-[13px]"}`}>{mensaje}</p>
      <p className="self-end text-[15px] italic [font-family:var(--fuente-titulo)]">{firma}</p>
    </div>
  );
}

function Botones({ atras, siguiente, error }: { atras?: () => void; siguiente: () => void; error: string | null }) {
  return (
    <>
      {error && <p className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {atras ? <button type="button" onClick={atras} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← {T.atras}</button> : <span />}
        <button type="button" onClick={siguiente} className="inline-flex h-13 items-center justify-center rounded-full bg-[#14140F] px-8 text-base font-medium text-white transition-colors hover:bg-[#2B2B24] [font-family:var(--fuente-micro)]">{T.seguir}</button>
      </div>
    </>
  );
}
