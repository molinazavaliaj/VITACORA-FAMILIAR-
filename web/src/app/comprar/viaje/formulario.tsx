"use client";

import Image from "next/image";
import { origenDelNavegador } from "@/lib/origen";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { HORAS_NOCHE, IDIOMAS_VIAJE, MAX_PREGUNTAS_PROPIAS, PAISES, PREGUNTA_PROPIA_MAXIMO } from "@/lib/viaje";
import { armarCompra, type Catalogo } from "@/lib/productos";
import { regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { ContenidoPaso, Etiqueta, Opcion, Pastilla } from "../../_ui";
import { CHECKOUT, FALLO, RESUMEN } from "../../_textos/checkout";
import { CHECKOUT_VIAJE } from "../../_textos/checkout-viaje";
import { AYUDA, AvisoFallo, BOTON_BARRA, BarraPaso, BotonPagar, CAMPO, ETIQUETA, ErrorPaso, ID_ERROR, Resumen, TituloPaso, arriba } from "../../_checkout/piezas";
import { CamposDireccion } from "../../_checkout/direccion";
import { PasosLibro } from "../../_checkout/pasos-libro";
import { CLAVE_COMPRA_VIAJE, CLAVE_DIRECCION, guardar, leer, olvidar, vieneDePagoFallido } from "../../_checkout/memoria";
import { crearPagador, type RespuestaCompra } from "../../_checkout/pagador";
import { formatearPrecio, listaDe } from "../productos-ui";
import { cuerpoViaje, diasDe, estadoViajeInicial, fallaViaje, hoyLocal, type EstadoViaje, type PasoViaje } from "./compra-viaje";

// La compra de la Vitácora de Viaje V2 (16/10; docs/viajes-v2/flujo-vigente.md
// §1) con el cascarón del rediseño, en la hoja azul noche de Viaje
// (checkout.css), en tres pasos: 1 el libro (impreso o PDF, álbum de 20 o 40),
// 2 el viaje (para mí o regalo, quién viaja, fechas, país, dónde vive, hora de
// la noche, idioma, preguntas propias) y 3 tus datos y el pago. Un solo POST a
// /api/compra con `productos.viaje` y `narrador.contexto.viaje` (los nombres
// del tipo `Compra` del bot). Nada de ciudades ni de «con quién viajás».
// Lo puro vive en ./compra-viaje.ts.

const sesion = () => window.sessionStorage;
/** El formulario del pago: la barra del teléfono lo envía desde afuera. */
const FORM_PAGO = "pago-viaje";
const BOTON_PRIMARIO =
  "m-btn inline-flex min-h-14 items-center rounded-full bg-[var(--boton)] px-9 text-[16px] font-semibold text-[var(--sobre-boton)] [font-family:var(--fuente-micro)] [touch-action:manipulation]";
const BOTON_FANTASMA =
  "m-ghost inline-flex min-h-14 items-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro)] disabled:opacity-60 [font-family:var(--fuente-micro)]";
const BOTON_CHICO =
  "m-ghost inline-flex min-h-12 items-center self-start rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro-fuerte)] disabled:opacity-60 [font-family:var(--fuente-micro)]";

export function CheckoutViaje({
  idioma,
  catalogo: cat,
  promo = null,
  pasoInicial = 1,
}: {
  idioma: IdiomaWeb;
  catalogo: Catalogo;
  promo?: number | null;
  /** Para probar cada paso sin navegador. */
  pasoInicial?: PasoViaje;
}) {
  const V = CHECKOUT_VIAJE[idioma];
  const T = CHECKOUT[idioma];
  const R = RESUMEN[idioma];
  const region = regionDeIdioma(idioma);
  const clave = `viaje-${idioma}`;
  const lengua = idioma === "ca" ? "ca" : "es";
  // Los países en el orden de su nombre en la lengua de la página.
  const paises = useMemo(() => [...PAISES].sort((a, b) => a[lengua].localeCompare(b[lengua], lengua)), [lengua]);

  const [paso, setPaso] = useState<PasoViaje>(pasoInicial);
  const [e, setE] = useState<EstadoViaje>(() => estadoViajeInicial(idioma, cat.impreso !== null));
  const [falla, setFalla] = useState<{ texto: string; campo?: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState<null | "guardado" | "solo">(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerPaso = useRef(true);
  // El primer paso llega pintado del servidor: se anima recién al cambiar de paso.
  const [animar, setAnimar] = useState(false);
  const antesDeIr = useRef<(c: RespuestaCompra) => void>(() => {});

  const cambiar = (cambios: Partial<EstadoViaje>) => setE((x) => ({ ...x, ...cambios }));
  const precio = cat.viaje;
  const impreso = e.formato === "impreso";
  // Sin precio del álbum de 40 (PRECIO_VIAJE_ALBUM40_*), solo existe el de 20.
  const hay40 = cat.viajeAlbum40 !== null;
  const album = hay40 ? e.album : 20;
  const compra = useMemo(() => armarCompra(cat, region, { base: "viaje", impresos: impreso ? 1 : 0, marcos: 0, album }), [cat, region, impreso, album]);
  const f = (n: number) => formatearPrecio(n, cat.moneda, region);
  const dias = diasDe(e);
  const yo = e.paraMi ? "yo" : "regalo";

  useEffect(() => {
    antesDeIr.current = (c) => {
      guardar(sesion, CLAVE_COMPRA_VIAJE, clave, e);
      if (impreso) guardar(sesion, CLAVE_DIRECCION, c.narradorId, { destinatarioNombre: e.recibe.trim(), destinatarioTelefono: e.telefonoRecibe.trim(), direccion: e.direccion });
      else olvidar(sesion, CLAVE_DIRECCION);
    };
  });

  const pagador = useMemo(
    () => crearPagador({ fetch: (...a) => fetch(...a), asignar: (url) => window.location.assign(url), antesDeIr: (c) => antesDeIr.current(c), origen: origenDelNavegador }, T),
    [T],
  );

  // Vuelta de un pago que no se cobró (Casos 2): lo elegido aparece de nuevo en el paso del pago.
  useEffect(() => {
    if (!vieneDePagoFallido(window.location.search)) return;
    const guardado = leer<EstadoViaje>(sesion, CLAVE_COMPRA_VIAJE, clave);
    setFallo(guardado ? "guardado" : "solo");
    if (guardado) {
      setE({ ...estadoViajeInicial(idioma, cat.impreso !== null), ...guardado });
      setPaso(3);
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, [idioma, clave]);

  useEffect(() => {
    const alVolver = (ev: PageTransitionEvent) => {
      if (!ev.persisted) return;
      pagador.liberar();
      setEnviando(false);
    };
    window.addEventListener("pageshow", alVolver);
    return () => window.removeEventListener("pageshow", alVolver);
  }, [pagador]);

  useEffect(() => {
    if (primerPaso.current) {
      primerPaso.current = false;
      return;
    }
    arriba();
    titulo.current?.focus({ preventScroll: true });
  }, [paso]);

  // Con la barra del teléfono el botón queda lejos del aviso: si el paso tiene
  // un problema, el aviso se trae a la vista (solo si no se ve).
  useEffect(() => {
    if (falla) document.getElementById(ID_ERROR)?.scrollIntoView({ block: "nearest" });
  }, [falla]);

  function irA(siguiente: PasoViaje) {
    setFalla(null);
    setAnimar(true);
    if (siguiente < 3) pagador.olvidar();
    setPaso(siguiente);
  }

  function seguir(desde: PasoViaje) {
    const problema = fallaViaje(desde, e, V, T);
    if (problema) return setFalla(problema);
    irA((desde + 1) as PasoViaje);
  }

  const marca = (campo: string) => (falla?.campo === campo ? { "aria-invalid": true, "aria-describedby": ID_ERROR } : {});

  function editarPregunta(i: number, texto: string) {
    cambiar({ preguntas: e.preguntas.map((p, j) => (j === i ? texto : p)) });
  }

  async function pagar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pagador.ocupado) return;
    if (precio === null) return setFalla({ texto: V.noDisponible });
    const problema = fallaViaje(2, e, V, T) ?? fallaViaje(3, e, V, T);
    if (problema) return setFalla(problema);
    setFalla(null);
    setEnviando(true);
    const r = await pagador.pagar(cuerpoViaje({ ...e, album }, idioma), []);
    if ("error" in r) {
      setFalla({ texto: r.error });
      setEnviando(false);
    }
  }

  const tachado = promo && precio !== null ? listaDe(compra.total, cat.moneda, region, promo).texto : null;

  const cabezaResumen = (
    <div className="flex items-center gap-4">
      <div className="dir-foto dir-foto--ovalo w-[64px] shrink-0">
        <Image src="/rediseno/viaje-libro-mesa.jpg" alt="" fill sizes="64px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Etiqueta>{V.marca}</Etiqueta>
        <span className="chk-ficha-titulo">{V.libroDelViaje}</span>
        {dias ? <span className="text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{V.dias(dias)}</span> : null}
      </div>
    </div>
  );

  return (
    <div className="chk-con-barra mx-auto w-full max-w-[1240px] px-4 pb-28 pt-10 sm:px-8 sm:pt-14">
      <div className="mb-10 sm:mb-14">
        <PasosLibro pasos={V.pasos} actual={paso} etiqueta={T.pasosEtiqueta} />
      </div>
      <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-20">
        <div className="min-w-0">
          {/* ── 1 · El libro ── */}
          {paso === 1 && (
            <ContenidoPaso key="v1" animar={animar} className="flex flex-col gap-7">
              <TituloPaso ref={titulo} antetitulo={V.pasoDe(1, 3)} titulo={V.libroTitulo} bajada={V.libroBajada} />
              {fallo ? <AvisoFallo textos={FALLO[idioma]} guardado={fallo === "guardado"} /> : null}
              {precio === null ? (
                <p className="text-[16px] text-[var(--texto-oscuro-suave)]">{V.noDisponible}</p>
              ) : (
                <>
                  <fieldset className="flex flex-col gap-3">
                    <legend className="sr-only">{V.libroTitulo}</legend>
                    {cat.impreso ? (
                      <Opcion name="formato" value="impreso" checked={impreso} onChange={() => cambiar({ formato: "impreso" })}
                        titulo={V.impresoTitulo} detalle={V.impresoDetalle} precio={f(precio + cat.impreso.precio)} />
                    ) : null}
                    <Opcion name="formato" value="pdf" checked={!impreso} onChange={() => cambiar({ formato: "pdf" })}
                      titulo={V.pdfTitulo} detalle={V.pdfDetalle} precio={f(precio)} />
                  </fieldset>

                  <fieldset>
                    <legend className={`${ETIQUETA} mb-1`}>{V.albumTitulo}</legend>
                    <p className="mb-3 text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{V.albumBajada}</p>
                    <div className="flex flex-wrap gap-2.5">
                      <Pastilla name="album" value="20" checked={album === 20} onChange={() => cambiar({ album: 20 })}>
                        {V.album(20)}
                      </Pastilla>
                      {hay40 ? (
                        <Pastilla name="album" value="40" checked={album === 40} onChange={() => cambiar({ album: 40 })}>
                          {V.album(40)} <span className="ml-2 opacity-70 tabular-nums">{V.mas(f(cat.viajeAlbum40! - precio))}</span>
                        </Pastilla>
                      ) : null}
                    </div>
                  </fieldset>
                </>
              )}

              <div className="chk-solo-escritorio">
                <button type="button" disabled={precio === null} onClick={() => seguir(1)} className={`${BOTON_PRIMARIO} disabled:opacity-60`}>
                  {V.continuar}
                </button>
              </div>
            </ContenidoPaso>
          )}

          {/* ── 2 · El viaje ── */}
          {paso === 2 && (
            <ContenidoPaso key="v2" animar={animar} className="flex flex-col gap-7">
              <TituloPaso ref={titulo} antetitulo={V.pasoDe(2, 3)} titulo={V.viajeTitulo} bajada={V.viajeBajada} />

              <fieldset>
                <legend className={`${ETIQUETA} mb-3`}>{V.paraQuien}</legend>
                <div className="flex flex-wrap gap-2.5">
                  <Pastilla name="para" value="yo" checked={e.paraMi} onChange={() => cambiar({ paraMi: true })}>{V.paraMi}</Pastilla>
                  <Pastilla name="para" value="regalo" checked={!e.paraMi} onChange={() => cambiar({ paraMi: false })}>{V.esRegalo}</Pastilla>
                </div>
              </fieldset>

              {e.paraMi ? null : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={ETIQUETA} htmlFor="tu-nombre">{V.tuNombre}</label>
                    <input id="tu-nombre" {...marca("tu-nombre")} className={`${CAMPO} mt-2`} value={e.tuNombre} onChange={(ev) => cambiar({ tuNombre: ev.target.value })} placeholder={V.tuNombrePista} autoComplete="name" />
                  </div>
                  <div>
                    <label className={ETIQUETA} htmlFor="quien-regala">{V.quienRegala}</label>
                    <input id="quien-regala" {...marca("quien-regala")} className={`${CAMPO} mt-2`} value={e.quienRegala} onChange={(ev) => cambiar({ quienRegala: ev.target.value })} maxLength={60} />
                    <p className={AYUDA}>{V.quienRegalaAyuda}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="nombre">{V.nombre[yo]}</label>
                  <input id="nombre" {...marca("nombre")} className={`${CAMPO} mt-2`} value={e.nombre} onChange={(ev) => cambiar({ nombre: ev.target.value })} placeholder={V.nombrePista} autoComplete={e.paraMi ? "name" : "off"} />
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="apodo">{V.comoLeDicen[yo]}</label>
                  <input id="apodo" className={`${CAMPO} mt-2`} value={e.comoLeDicen} onChange={(ev) => cambiar({ comoLeDicen: ev.target.value })} />
                  <p className={AYUDA}>{V.comoLeDicenAyuda[yo]}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className={ETIQUETA} htmlFor="tel">{V.whatsapp[yo]}</label>
                  <input id="tel" {...marca("telefono")} className={`${CAMPO} mt-2`} value={e.telefono} onChange={(ev) => cambiar({ telefono: ev.target.value })} placeholder={T.whatsappPista} inputMode="tel" autoComplete={e.paraMi ? "tel" : "off"} />
                  <p className={AYUDA}>{V.whatsappAyuda[yo]}</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="salida">{V.salida}</label>
                  <input id="salida" type="date" {...marca("fechas")} className={`${CAMPO} mt-2`} value={e.salida} min={hoyLocal()} onChange={(ev) => cambiar({ salida: ev.target.value })} />
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="vuelta">{V.vuelta}</label>
                  <input id="vuelta" type="date" {...marca("fechas")} className={`${CAMPO} mt-2`} value={e.vuelta} min={e.salida || hoyLocal()} onChange={(ev) => cambiar({ vuelta: ev.target.value })} />
                  {dias ? <p className={AYUDA}>{V.dias(dias)}</p> : null}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="pais-viaje">{V.paisViaje}</label>
                  <select id="pais-viaje" {...marca("pais-viaje")} className={`${CAMPO} mt-2`} value={e.paisViaje} onChange={(ev) => cambiar({ paisViaje: ev.target.value })}>
                    <option value="" disabled>{V.elegir}</option>
                    {paises.map((p) => (
                      <option key={p.id} value={p.id}>{p[lengua]}</option>
                    ))}
                  </select>
                  <p className={AYUDA}>{V.paisViajeAyuda}</p>
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="pais-casa">{V.paisCasa[yo]}</label>
                  <select id="pais-casa" {...marca("pais-casa")} className={`${CAMPO} mt-2`} value={e.paisCasa} onChange={(ev) => cambiar({ paisCasa: ev.target.value })}>
                    <option value="" disabled>{V.elegir}</option>
                    {paises.map((p) => (
                      <option key={p.id} value={p.id}>{p[lengua]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="hora">{V.hora[yo]}</label>
                  <select id="hora" className={`${CAMPO} mt-2`} value={e.hora} onChange={(ev) => cambiar({ hora: ev.target.value })}>
                    {HORAS_NOCHE.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="idioma">{V.idioma}</label>
                  <select id="idioma" className={`${CAMPO} mt-2`} value={e.idioma} onChange={(ev) => cambiar({ idioma: ev.target.value as EstadoViaje["idioma"] })}>
                    {IDIOMAS_VIAJE.map((i) => (
                      <option key={i} value={i}>{V.idiomas[i]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className={ETIQUETA}>{V.preguntas}</p>
                <p className="text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{V.preguntasAyuda[yo]}</p>
                <ul className="flex flex-col gap-3">
                  {e.preguntas.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <textarea aria-label={`${V.preguntas} ${i + 1}`} {...marca("preguntas")} className={`${CAMPO} min-h-[56px] flex-1`} rows={2} value={p}
                        maxLength={PREGUNTA_PROPIA_MAXIMO} onChange={(ev) => editarPregunta(i, ev.target.value)} placeholder={i === 0 ? V.preguntaPista : undefined} />
                      <button type="button" aria-label={V.sacarPregunta} onClick={() => cambiar({ preguntas: e.preguntas.length > 1 ? e.preguntas.filter((_, j) => j !== i) : [""] })}
                        className="m-ghost h-11 w-11 shrink-0 rounded-full border border-[var(--borde-oscuro-fuerte)] text-lg text-[var(--texto-oscuro-fuerte)] [touch-action:manipulation]">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" disabled={e.preguntas.length >= MAX_PREGUNTAS_PROPIAS} onClick={() => cambiar({ preguntas: [...e.preguntas, ""] })} className={BOTON_CHICO}>
                  {V.otraPregunta}
                </button>
              </div>

              <ErrorPaso texto={falla?.texto ?? null} />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => seguir(2)} className={`chk-solo-escritorio ${BOTON_PRIMARIO}`}>{V.continuar}</button>
                <button type="button" onClick={() => irA(1)} className={BOTON_FANTASMA}>{V.atras}</button>
              </div>
            </ContenidoPaso>
          )}

          {/* ── 3 · Tus datos y el pago ── */}
          {paso === 3 && (
            <ContenidoPaso key="v3" animar={animar}>
              <form id={FORM_PAGO} onSubmit={pagar} noValidate className="flex flex-col gap-7">
                <TituloPaso ref={titulo} antetitulo={V.pasoDe(3, 3)} titulo={V.pagoTitulo} bajada={V.pagoBajada} />
                {fallo ? <AvisoFallo textos={FALLO[idioma]} guardado={fallo === "guardado"} /> : null}
                <div>
                  <label className={ETIQUETA} htmlFor="email">{V.email}</label>
                  <input id="email" type="email" {...marca("email")} className={`${CAMPO} mt-2`} value={e.email} onChange={(ev) => cambiar({ email: ev.target.value })} placeholder={V.emailPista} autoComplete="email" inputMode="email" spellCheck={false} />
                </div>
                {impreso ? <CamposDireccion textos={T} valor={e} onCambio={cambiar} campoConError={falla?.campo} /> : null}
                <p className="border-l-2 border-[var(--texto-oscuro-fuerte)] py-1 pl-5 text-[16px] leading-relaxed text-[var(--texto-oscuro-suave)]">
                  <strong className="font-medium text-[var(--texto-oscuro-fuerte)]">{V.despues}</strong> {V.despuesTexto[yo]}
                </p>
                <ErrorPaso texto={falla?.texto ?? null} />
                <div className="chk-solo-escritorio">
                  <BotonPagar enviando={enviando} texto={T.pagar(f(compra.total))} procesando={T.procesando} />
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
                  {V.legalAntes}
                  <a href={ruta(idioma, "/legal/terminos")} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                    {T.terminos}
                  </a>
                  {V.legalDespues} {V.garantia}
                </p>
                <div>
                  <button type="button" disabled={enviando} onClick={() => irA(2)} className={BOTON_FANTASMA}>{V.atras}</button>
                </div>
              </form>
            </ContenidoPaso>
          )}
        </div>

        <Resumen compra={compra} region={region} textos={R} cabeza={cabezaResumen} incluye={V.incluye} tachado={tachado} />
      </div>

      {/* En el teléfono: el total y el botón del paso, abajo y después del resumen. */}
      <BarraPaso etiqueta={R.total} total={f(compra.total)}>
        {paso === 3 ? (
          <BotonPagar form={FORM_PAGO} enviando={enviando} texto={T.pagar(f(compra.total))} procesando={T.procesando} className="min-h-12 shrink-0 px-6 text-[15.5px]" />
        ) : (
          <button type="button" disabled={precio === null} onClick={() => seguir(paso)} className={BOTON_BARRA}>
            {V.continuar}
          </button>
        )}
      </BarraPaso>
    </div>
  );
}
