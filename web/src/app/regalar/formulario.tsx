"use client";

import { useEffect, useRef, useState } from "react";
import type { IdiomaWeb } from "@/lib/idioma-web";
import type { Catalogo } from "@/lib/productos";
import type { Region } from "@/lib/precios";
import { GENEROS, IDIOMAS_REGALO, MENSAJE_MAXIMO, errorDeFechaEntrega, type Genero } from "@/lib/regalo-reglas";
import { idiomaPorDefecto, textosComprador, tratoDeRegion, type IdiomaRegalo, type TextosComprador, type TratoComprador } from "@/lib/regalo-textos";
import { formatearPrecio } from "../comprar/productos-ui";
import { Grabador } from "./grabador";
import { enviarRegalo } from "./enviar";
import { CamposEntrega, errorDeEleccion, lineaLeLlega, SIN_ENTREGA, type EleccionEntrega } from "./entrega";
import { AREA, AvisoFallo, BotonPagar, CAMPO } from "../_checkout/piezas";
import { vieneDePagoFallido } from "../_checkout/memoria";
import { FALLO } from "../_textos/checkout";
import { COMPRADOR_WEB } from "../_textos/regalar";

// La compra del regalo (plan 2026-10-07-gift-card, Task 8), en cuatro pasos:
// a quién · tu mensaje · tus datos · pagar. Imita el checkout chico de
// /comprar/viaje. Quien regala no carga el teléfono del narrador: el narrador
// lo da cuando escanea la tarjeta y le escribe al biógrafo. El pago (compra,
// audio y redirección) vive en enviar.ts, probado sin navegador.
//
// Todos los textos salen de textosComprador(trato): de vos en AR, de tú en ES
// (plan 2026-10-09-regalo-idiomas), o del diccionario de la versión de la web
// (`idiomaWeb`, rediseño 2026-10: el catalán). El idioma del regalo es el del
// abuelo y arranca en el de la región de quien compra.
//
// Rediseño 2026-10: el mismo formulario, con el tema oscuro de las compras
// (los campos y botones de _checkout) y el aviso del pago que no se cobró.

type Paso = 1 | 2 | 3 | 4;

const ID_ERROR = "error-paso";

const campo = CAMPO;
const etiqueta = "block text-[13px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]";
const titulo = "outline-none text-[32px] leading-[1.1] text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)] font-medium sm:text-[38px]";
/** Una opción redonda (género, idioma): el radio nativo queda a la vista, como antes, sobre el fondo oscuro. */
const opcion = (elegida: boolean) =>
  `m-card flex min-h-11 cursor-pointer items-center gap-3 rounded-[14px] border px-4 py-3 text-[16px] text-[var(--texto-oscuro)] accent-[var(--boton)] [font-family:var(--fuente-micro)] ${elegida ? "border-[var(--acento-oscuro)] bg-[var(--elegido-fondo)]" : "border-[var(--borde-oscuro-fuerte)]"}`;

/** Hoy en el reloj de quien compra, como lo pide `input type="date"`. */
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FormularioRegalo({
  catalogo, region, trato = tratoDeRegion(region), idiomaInicial = idiomaPorDefecto(region), pasoInicial = 1, entregaWhatsApp = false, idiomaWeb,
}: {
  catalogo: Catalogo; region: Region; trato?: TratoComprador; idiomaInicial?: IdiomaRegalo; pasoInicial?: Paso;
  /** Si se ofrece mandarlo por WhatsApp el día elegido (REGALO_ENTREGA_WHATSAPP). */
  entregaWhatsApp?: boolean;
  /** La versión de la web: sus textos (el catalán) y la pasarela vuelve a /regalar de ese idioma. Sin ella, los de `trato`. */
  idiomaWeb?: IdiomaWeb;
}) {
  const T = idiomaWeb ? COMPRADOR_WEB[idiomaWeb] : textosComprador(trato);
  const [paso, setPaso] = useState<Paso>(pasoInicial);
  const [idioma, setIdioma] = useState<IdiomaRegalo>(idiomaInicial);
  const [nombre, setNombre] = useState("");
  const [comoLeDicen, setComoLeDicen] = useState("");
  const [genero, setGenero] = useState<Genero | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [entrega, setEntrega] = useState<EleccionEntrega>(SIN_ENTREGA);
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
  // Dos clics en el mismo instante llegan antes de que React pinte el disabled.
  const pagando = useRef(false);
  const [fallo, setFallo] = useState(false);

  // Vuelta de un pago que no se cobró (Casos 2): se avisa. El intento queda
  // recordado (vitacora-regalo-pendiente): el próximo pago retoma el mismo regalo.
  useEffect(() => {
    if (!vieneDePagoFallido(window.location.search)) return;
    setFallo(true);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

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
    if (enviando || pagando.current) return;
    pagando.current = true;
    setEnviando(true);
    setFalla(null);
    const r = await enviarRegalo(
      { nombre, comoLeDicen, genero, mensaje, fechaEntrega, nombreComprador, vinculoComprador, email, region, idioma, audio, entrega, idiomaWeb },
      { fetch: (...a) => fetch(...a), asignar: (url) => window.location.assign(url), trato, almacen: () => window.sessionStorage },
    );
    if ("error" in r) {
      fallar(r.error);
      setEnviando(false);
      pagando.current = false;
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-[1180px] items-start gap-12 px-4 pb-24 pt-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <ol className="flex gap-3 sm:gap-8">
          {T.pasos.map((nombrePaso, i) => {
            const n = i + 1;
            return (
              <li key={nombrePaso} className="min-w-0 flex-1" aria-current={n === paso ? "step" : undefined}>
                <p className={`truncate text-[14px] [font-family:var(--fuente-micro)] ${n === paso ? "text-[var(--texto-oscuro-fuerte)]" : "text-[var(--texto-oscuro-menor)]"}`}>{n}.<span className={n === paso ? "" : "sr-only sm:not-sr-only"}> {nombrePaso}</span></p>
                <div className={`mt-2 h-[3px] rounded-full transition-colors duration-[var(--d-base)] ${n <= paso ? "bg-[var(--boton)]" : "bg-[var(--borde-oscuro)]"}`} />
              </li>
            );
          })}
        </ol>

        {fallo ? <div className="mt-8"><AvisoFallo textos={FALLO[idiomaWeb ?? (region === "AR" ? "ar" : "es")]} guardado={false} /></div> : null}

        {/* ── 1 · A quién ── */}
        {paso === 1 && (
          <section key="r1" className="m-step mt-12">
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
                  <label key={g} className={opcion(genero === g)}>
                    <input type="radio" name="genero" value={g} aria-invalid={falla?.campo === "genero" || undefined} checked={genero === g} onChange={() => setGenero(g)} />
                    {T.generos[g]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-8">
              <legend className={etiqueta}>{T.idioma}</legend>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {IDIOMAS_REGALO.map((i) => (
                  <label key={i} lang={i === "ca" ? "ca" : undefined} className={opcion(idioma === i)}>
                    <input type="radio" name="idioma" value={i} checked={idioma === i} onChange={() => setIdioma(i)} />
                    {T.idiomas[i]}
                  </label>
                ))}
              </div>
            </fieldset>
            <Botones
              textos={T}
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
          <section key="r2" className="m-step mt-12">
            <h1 ref={encabezado} tabIndex={-1} className={titulo}>{T.pasos[1]}</h1>
            <div className="mt-8">
              <label className={etiqueta} htmlFor="mensaje">{T.tuMensaje}</label>
              <textarea id="mensaje" {...marca("mensaje")} className={`${AREA} mt-2`} rows={6} value={mensaje} maxLength={MENSAJE_MAXIMO} onChange={(e) => setMensaje(e.target.value)} />
              <p className="mt-1 text-right text-[13px] tabular-nums text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]" aria-live="polite">{T.contador(mensaje.length, MENSAJE_MAXIMO)}</p>
            </div>
            <div className="mt-6">
              <p id="etiqueta-audio" className={etiqueta}>{T.audio}</p>
              <Grabador audio={audio} onAudio={setAudio} etiquetadoPor="etiqueta-audio" textos={T} />
            </div>
            <div className="mt-8 sm:max-w-xs">
              <label className={etiqueta} htmlFor="fecha">{T.cuando}</label>
              <input id="fecha" type="date" {...marca("fecha")} className={`${campo} mt-2`} value={fechaEntrega} min={hoyLocal()} onChange={(e) => {
                setFechaEntrega(e.target.value);
                // Sin fecha no hay día en que mandarlo: vuelve a «se la doy yo».
                if (!e.target.value) setEntrega(SIN_ENTREGA);
              }} />
            </div>
            <CamposEntrega fecha={fechaEntrega} idioma={idioma} eleccion={entrega} onCambio={setEntrega} whatsapp={entregaWhatsApp} textos={T} marca={marca} />
            <Botones
              textos={T}
              atras={() => avanzar(1)}
              siguiente={() => {
                if (!mensaje.trim()) return fallar(T.faltaMensaje, "mensaje");
                // La misma regla que el servidor: real y desde ayer en UTC.
                const problemaFecha = fechaEntrega ? errorDeFechaEntrega(fechaEntrega, new Date()) : null;
                if (problemaFecha) return fallar(problemaFecha, "fecha");
                const problemaEntrega = errorDeEleccion(entrega, fechaEntrega, idioma, new Date(), T.entrega);
                if (problemaEntrega) return fallar(problemaEntrega.texto, problemaEntrega.campo);
                avanzar(3);
              }}
              error={error}
            />
          </section>
        )}

        {/* ── 3 · Tus datos ── */}
        {paso === 3 && (
          <section key="r3" className="m-step mt-12">
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
              textos={T}
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
          <form key="r4" onSubmit={pagar} className="m-step mt-12">
            <h1 ref={encabezado} tabIndex={-1} className={titulo}>{T.pasos[3]}</h1>
            <div className="mt-8">
              <TarjetaChica comoLeDicen={comoLeDicen.trim()} mensaje={mensaje.trim()} firma={nombreComprador.trim()} />
            </div>
            {lineaLeLlega(entrega, fechaEntrega, T.entrega) && (
              <p className="mt-6 text-center text-[15px] text-[var(--texto-oscuro-suave)]">{lineaLeLlega(entrega, fechaEntrega, T.entrega)}</p>
            )}
            <div className="mt-8 flex items-baseline justify-between gap-4 rounded-[18px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-5">
              <p className="text-[17px] text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">{catalogo.base.nombre}</p>
              <p key={precio} className="m-price text-[22px] tabular-nums [font-family:var(--fuente-titulo)]">{precio}</p>
            </div>
            {error && <p id={ID_ERROR} className="mt-6 text-[14px] text-[#f0a37a] [font-family:var(--fuente-micro)]" role="alert">{error}</p>}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => avanzar(3)} className="m-ghost inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro)] [font-family:var(--fuente-micro)]">← {T.atras}</button>
              <BotonPagar enviando={enviando} texto={T.botonPagar} procesando={T.unMomento} />
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
              {T.pagoSeguro(region === "ES" ? "Stripe" : "Mercado Pago")}{" "}
              <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">{T.terminos}</a>.
            </p>
          </form>
        )}
      </div>

      {/* En el paso de pagar el precio ya está en el resumen: en el celular no se repite. */}
      <aside className={`lg:sticky lg:top-8 lg:self-start ${paso === 4 ? "hidden lg:block" : ""}`}>
        <div className="rounded-[22px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
          <p className="text-[19px] text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">{catalogo.base.nombre}</p>
          <p className="mt-2 text-[15px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{catalogo.base.detalle}</p>
          <p className="mt-4 text-[24px] tabular-nums text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">{precio}</p>
        </div>
      </aside>
    </div>
  );
}

/** La cara de adentro de la tarjeta (Task 7), en chico: el saludo, el mensaje y la firma. */
function TarjetaChica({ comoLeDicen, mensaje, firma }: { comoLeDicen: string; mensaje: string; firma: string }) {
  return (
    <div className="mx-auto flex aspect-[105/148] w-full max-w-[260px] flex-col gap-3 overflow-hidden rounded-[8px] bg-[#f3ece0] p-6 text-[#2a2620] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      <p className="text-[18px] [font-family:var(--fuente-titulo)]">{comoLeDicen},</p>
      <p className={`flex-1 overflow-hidden whitespace-pre-line italic leading-[1.5] [overflow-wrap:anywhere] [font-family:var(--fuente-titulo)] ${mensaje.length > 250 ? "text-[10px]" : "text-[13px]"}`}>{mensaje}</p>
      <p className="self-end text-[15px] italic [font-family:var(--fuente-titulo)]">{firma}</p>
    </div>
  );
}

function Botones({ atras, siguiente, error, textos: T }: { atras?: () => void; siguiente: () => void; error: string | null; textos: TextosComprador }) {
  return (
    <>
      {error && <p id={ID_ERROR} className="mt-6 text-[14px] text-[#f0a37a] [font-family:var(--fuente-micro)]" role="alert">{error}</p>}
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {atras ? <button type="button" onClick={atras} className="m-ghost inline-flex min-h-14 items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro)] [font-family:var(--fuente-micro)]">← {T.atras}</button> : <span />}
        <button type="button" onClick={siguiente} className="m-btn inline-flex min-h-14 items-center justify-center rounded-full bg-[var(--boton)] px-9 text-[16px] font-semibold text-[var(--sobre-boton)] [font-family:var(--fuente-micro)] [touch-action:manipulation]">{T.seguir}</button>
      </div>
    </>
  );
}
