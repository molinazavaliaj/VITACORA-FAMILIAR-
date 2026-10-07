"use client";

import { useEffect, useRef, useState } from "react";
import type { Catalogo } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { GENEROS, MENSAJE_MAXIMO, errorDeFechaEntrega, type Genero } from "@/lib/regalo-reglas";
import { TEXTOS_REGALO as T } from "@/lib/regalo-textos";
import { formatearPrecio } from "../comprar/productos-ui";
import { Grabador } from "./grabador";
import { enviarRegalo } from "./enviar";

// La compra del regalo (plan 2026-10-07-gift-card, Task 8), en cuatro pasos:
// a quién · tu mensaje · tus datos · pagar. Imita el checkout chico de
// /comprar/viaje. Quien regala no carga el teléfono del narrador: el narrador
// lo da cuando escanea la tarjeta y le escribe al biógrafo. El pago (compra,
// audio y redirección) vive en enviar.ts, probado sin navegador.
//
// ⚠️ Todos los textos salen de TEXTOS_REGALO y están a aprobar por Naza.

type Paso = 1 | 2 | 3 | 4;

const ID_ERROR = "error-paso";

const campo = "w-full rounded-md border border-[#D4D4CE] bg-white px-4 py-3 text-[16px] text-[#14140F] outline-none transition-colors placeholder:text-[#AEAEA6] focus:border-[#14140F] [font-family:var(--fuente-cuerpo)]";
const etiqueta = "block text-[11px] uppercase text-[#5F5F55] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]";
const titulo = "outline-none text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium sm:text-4xl";

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
  // El error del paso y, si es de un campo, cuál (para marcarlo a los lectores de pantalla).
  const [falla, setFalla] = useState<{ texto: string; campo?: string } | null>(null);
  const error = falla?.texto ?? null;
  const [enviando, setEnviando] = useState(false);
  const precio = formatearPrecio(catalogo.base.precio, catalogo.moneda, region);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const primerPaso = useRef(true);

  // Al cambiar de paso, el foco va al título del paso nuevo (no al cargar la página).
  useEffect(() => {
    if (primerPaso.current) { primerPaso.current = false; return; }
    encabezado.current?.focus({ preventScroll: true });
  }, [paso]);

  function fallar(texto: string, campo?: string) {
    setFalla({ texto, campo });
  }

  /** Los atributos de un campo con error: lo marcan y lo atan al mensaje. */
  function marca(campo: string) {
    return falla?.campo === campo ? { "aria-invalid": true, "aria-describedby": ID_ERROR } : {};
  }

  function avanzar(siguiente: Paso) {
    setFalla(null);
    setPaso(siguiente);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function pagar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setFalla(null);
    const r = await enviarRegalo(
      { nombre, comoLeDicen, genero, mensaje, fechaEntrega, nombreComprador, vinculoComprador, email, region, audio },
      { fetch: (...a) => fetch(...a), asignar: (url) => window.location.assign(url) },
    );
    if ("error" in r) {
      fallar(r.error);
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
                <p className={`truncate text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.18em] sm:[letter-spacing:0.24em] ${n === paso ? "text-[#14140F]" : "text-[#AEAEA6]"}`}>{n}.<span className={n === paso ? "" : "sr-only sm:not-sr-only"}> {nombrePaso}</span></p>
                <div className={`mt-2 h-[3px] rounded-full ${n <= paso ? "bg-[#14140F]" : "bg-[#D4D4CE]"}`} />
              </li>
            );
          })}
        </ol>

        {/* ── 1 · A quién ── */}
        {paso === 1 && (
          <section className="mt-12">
            <h1 ref={encabezado} tabIndex={-1} className={titulo}>{T.pasos[0]}</h1>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className={etiqueta} htmlFor="nombre">{T.aQuien}</label>
                <input id="nombre" {...marca("nombre")} className={`${campo} mt-2`} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <label className={etiqueta} htmlFor="apodo">{T.comoLeDecis}</label>
                <input id="apodo" {...marca("apodo")} className={`${campo} mt-2`} value={comoLeDicen} onChange={(e) => setComoLeDicen(e.target.value)} placeholder={T.comoLeDecisPista} autoComplete="off" />
              </div>
            </div>
            <fieldset className="mt-8" aria-describedby={falla?.campo === "genero" ? ID_ERROR : undefined}>
              <legend className={etiqueta}>{T.genero}</legend>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {GENEROS.map((g) => (
                  <label key={g} className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3 text-[16px] [font-family:var(--fuente-cuerpo)] ${genero === g ? "border-2 border-[#14140F]" : "border-[#D4D4CE]"}`}>
                    <input type="radio" name="genero" value={g} aria-invalid={falla?.campo === "genero" || undefined} checked={genero === g} onChange={() => setGenero(g)} />
                    {T.generos[g]}
                  </label>
                ))}
              </div>
            </fieldset>
            <Botones
              siguiente={() => {
                if (!nombre.trim()) return fallar(T.faltaNombre, "nombre");
                if (!comoLeDicen.trim()) return fallar(T.faltaComoLeDecis, "apodo");
                if (!genero) return fallar(T.faltaGenero, "genero");
                avanzar(2);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 2 · Tu mensaje ── */}
        {paso === 2 && (
          <section className="mt-12">
            <h1 ref={encabezado} tabIndex={-1} className={titulo}>{T.pasos[1]}</h1>
            <div className="mt-8">
              <label className={etiqueta} htmlFor="mensaje">{T.tuMensaje}</label>
              <textarea id="mensaje" {...marca("mensaje")} className={`${campo} mt-2`} rows={6} value={mensaje} maxLength={MENSAJE_MAXIMO} onChange={(e) => setMensaje(e.target.value)} />
              <p className="mt-1 text-right text-[13px] tabular-nums text-[#83837A] [font-family:var(--fuente-micro)]" aria-live="polite">{T.contador(mensaje.length, MENSAJE_MAXIMO)}</p>
            </div>
            <div className="mt-6">
              <p id="etiqueta-audio" className={etiqueta}>{T.audio}</p>
              <Grabador audio={audio} onAudio={setAudio} etiquetadoPor="etiqueta-audio" />
            </div>
            <div className="mt-8 sm:max-w-xs">
              <label className={etiqueta} htmlFor="fecha">{T.cuando}</label>
              <input id="fecha" type="date" {...marca("fecha")} className={`${campo} mt-2`} value={fechaEntrega} min={hoyLocal()} onChange={(e) => setFechaEntrega(e.target.value)} />
            </div>
            <Botones
              atras={() => avanzar(1)}
              siguiente={() => {
                if (!mensaje.trim()) return fallar(T.faltaMensaje, "mensaje");
                // La misma regla que el servidor: real y desde ayer en UTC.
                const problemaFecha = fechaEntrega ? errorDeFechaEntrega(fechaEntrega, new Date()) : null;
                if (problemaFecha) return fallar(problemaFecha, "fecha");
                avanzar(3);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 3 · Tus datos ── */}
        {paso === 3 && (
          <section className="mt-12">
            <h1 ref={encabezado} tabIndex={-1} className={titulo}>{T.pasos[2]}</h1>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={etiqueta} htmlFor="comprador">{T.tuNombre}</label>
                <input id="comprador" {...marca("comprador")} className={`${campo} mt-2`} value={nombreComprador} onChange={(e) => setNombreComprador(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className={etiqueta} htmlFor="vinculo">{T.queEsTuyo}</label>
                <input id="vinculo" {...marca("vinculo")} className={`${campo} mt-2`} value={vinculoComprador} onChange={(e) => setVinculoComprador(e.target.value)} placeholder={T.queEsTuyoPista} />
              </div>
              <div>
                <label className={etiqueta} htmlFor="email">{T.tuCorreo}</label>
                <input id="email" type="email" {...marca("email")} className={`${campo} mt-2`} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
              </div>
            </div>
            <Botones
              atras={() => avanzar(2)}
              siguiente={() => {
                if (!nombreComprador.trim()) return fallar(T.faltaTuNombre, "comprador");
                if (!vinculoComprador.trim()) return fallar(T.faltaQueEsTuyo, "vinculo");
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return fallar(T.correoMal, "email");
                avanzar(4);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 4 · Pagar ── */}
        {paso === 4 && (
          <form onSubmit={pagar} className="mt-12">
            <h1 ref={encabezado} tabIndex={-1} className={titulo}>{T.pasos[3]}</h1>
            <div className="mt-8">
              <TarjetaChica comoLeDicen={comoLeDicen.trim()} mensaje={mensaje.trim()} firma={nombreComprador.trim()} />
            </div>
            <div className="mt-8 flex items-baseline justify-between gap-4 rounded-lg border border-[#EBEBE7] bg-white p-5">
              <p className="text-[17px] [font-family:var(--fuente-titulo)]">{catalogo.base.nombre}</p>
              <p className="text-[22px] tabular-nums [font-family:var(--fuente-titulo)]">{precio}</p>
            </div>
            {error && <p id={ID_ERROR} className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => avanzar(3)} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← {T.atras}</button>
              <button type="submit" disabled={enviando} className="inline-flex min-h-13 items-center justify-center rounded-full bg-[#5D3FD3] px-8 py-3 text-base font-medium text-white transition-colors hover:bg-[#4F35BC] disabled:opacity-60 [font-family:var(--fuente-micro)] [touch-action:manipulation]">
                {enviando ? T.unMomento : T.botonPagar}
              </button>
            </div>
            <p className="mt-4 text-[13px] text-[#83837A] [font-family:var(--fuente-cuerpo)] font-light">
              {T.pagoSeguro(region === "ES" ? "Stripe" : "Mercado Pago")}{" "}
              <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">{T.terminos}</a>.
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
      {error && <p id={ID_ERROR} className="mt-6 text-[15px] text-[#B42318] [font-family:var(--fuente-cuerpo)]" role="alert">{error}</p>}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {atras ? <button type="button" onClick={atras} className="text-[15px] text-[#5F5F55] underline underline-offset-4 [font-family:var(--fuente-micro)]">← {T.atras}</button> : <span />}
        <button type="button" onClick={siguiente} className="inline-flex h-13 items-center justify-center rounded-full bg-[#14140F] px-8 text-base font-medium text-white transition-colors hover:bg-[#2B2B24] [font-family:var(--fuente-micro)]">{T.seguir}</button>
      </div>
    </>
  );
}
