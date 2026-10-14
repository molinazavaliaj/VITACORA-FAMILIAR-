"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { COMPANIAS, PROPOSITOS, ANGULOS, ETAPAS_MAXIMO } from "@/lib/viaje";
import { armarCompra, type Catalogo } from "@/lib/productos";
import { regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { ZONAS } from "@/lib/horario";
import { ContenidoPaso, Etiqueta, Opcion, Pastilla } from "../../_ui";
import { CHECKOUT, FALLO, RESUMEN } from "../../_textos/checkout";
import { CHECKOUT_VIAJE } from "../../_textos/checkout-viaje";
import { AREA, AYUDA, AvisoFallo, BOTON_BARRA, BarraPaso, BotonPagar, CAMPO, Contador, ETIQUETA, ErrorPaso, ID_ERROR, Resumen, TituloPaso, arriba } from "../../_checkout/piezas";
import { CamposDireccion } from "../../_checkout/direccion";
import { PasosLibro } from "../../_checkout/pasos-libro";
import { conMarcosParaRegalar, eleccionDe, opcionDe } from "../../_checkout/opciones-libro";
import { ContadorMarcos, OpcionesLibro } from "../../_checkout/opciones-libro-ui";
import { CLAVE_COMPRA_VIAJE, CLAVE_DIRECCION, guardar, leer, olvidar, vieneDePagoFallido } from "../../_checkout/memoria";
import { crearPagador, type RespuestaCompra } from "../../_checkout/pagador";
import { formatearPrecio, listaDe } from "../productos-ui";
import { cuerpoViaje, diasDe, estadoViajeInicial, fallaViaje, type EstadoViaje, type PasoViaje } from "./compra-viaje";

// La compra de la Vitácora de viaje (docs/vitacora-de-viaje.md, 18/09) con el
// cascarón del rediseño (maquetas CheckoutViaje y CheckoutViajeMovil; desde
// el 14/10 en el papel y la tinta del libro, sin el azul), en tres pasos: 1 vuestro libro (digital o impreso, marco,
// copias), 2 el viaje (quién viaja, fechas, etapas, con quién, para qué, qué
// preguntar, a qué hora, qué no) y 3 tus datos y el pago. Hace lo mismo que la
// compra de antes: un solo POST a /api/compra con `productos.viaje` y
// `narrador.contexto.viaje`; las etapas pueden ir sin fechas (se completan
// desde el panel). Lo puro vive en ./compra-viaje.ts.

/** El catálogo de cada región, resuelto en el servidor (la base del viaje es `viaje`). Se conserva el tipo. */
export type CatalogoViaje = Record<"ES" | "AR", Catalogo>;

const sesion = () => window.sessionStorage;
/** El formulario del pago: la barra del teléfono lo envía desde afuera. */
const FORM_PAGO = "pago-viaje";
const BOTON_PRIMARIO =
  "m-btn inline-flex min-h-14 items-center rounded-full bg-[var(--boton)] px-9 text-[16px] font-semibold text-[var(--sobre-boton)] [font-family:var(--fuente-micro)] [touch-action:manipulation]";
const BOTON_FANTASMA =
  "m-ghost inline-flex min-h-14 items-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro)] disabled:opacity-60 [font-family:var(--fuente-micro)]";

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

  const [paso, setPaso] = useState<PasoViaje>(pasoInicial);
  const [e, setE] = useState<EstadoViaje>(() => estadoViajeInicial(idioma, cat));
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
  const compra = useMemo(
    () => armarCompra(cat, region, { base: "viaje", impresos: impreso ? 1 + e.copias : 0, marcos: impreso ? e.marcos : 0 }),
    [cat, region, impreso, e.copias, e.marcos],
  );
  const f = (n: number) => formatearPrecio(n, cat.moneda, region);
  const dias = diasDe(e);

  useEffect(() => {
    antesDeIr.current = (c) => {
      guardar(sesion, CLAVE_COMPRA_VIAJE, clave, e);
      if (impreso) guardar(sesion, CLAVE_DIRECCION, c.narradorId, { destinatarioNombre: e.recibe.trim(), destinatarioTelefono: e.telefonoRecibe.trim(), direccion: e.direccion });
      else olvidar(sesion, CLAVE_DIRECCION);
    };
  });

  const pagador = useMemo(
    () => crearPagador({ fetch: (...a) => fetch(...a), asignar: (url) => window.location.assign(url), antesDeIr: (c) => antesDeIr.current(c) }, T),
    [T],
  );

  // Vuelta de un pago que no se cobró (Casos 2): lo elegido aparece de nuevo en el paso del pago.
  useEffect(() => {
    if (!vieneDePagoFallido(window.location.search)) return;
    const guardado = leer<EstadoViaje>(sesion, CLAVE_COMPRA_VIAJE, clave);
    setFallo(guardado ? "guardado" : "solo");
    if (guardado) {
      setE({ ...estadoViajeInicial(idioma, cat), ...guardado });
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

  function editarEtapa(i: number, cambios: Partial<EstadoViaje["etapas"][number]>) {
    cambiar({ etapas: e.etapas.map((x, j) => (j === i ? { ...x, ...cambios } : x)) });
  }

  async function pagar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pagador.ocupado) return;
    if (precio === null) return setFalla({ texto: V.noDisponible });
    const problema = fallaViaje(3, e, V, T);
    if (problema) return setFalla(problema);
    setFalla(null);
    setEnviando(true);
    const r = await pagador.pagar(cuerpoViaje(e, idioma), []);
    if ("error" in r) {
      setFalla({ texto: r.error });
      setEnviando(false);
    }
  }

  const tachado = promo && precio !== null ? listaDe(compra.total, cat.moneda, region, promo).texto : null;

  const cabezaResumen = (
    <div className="flex items-center gap-4">
      <div className="dir-foto dir-foto--ovalo w-[64px] shrink-0">
        <Image src="/rediseno/viaje-mirador-lisboa.jpg" alt="" fill sizes="64px" className="object-cover" />
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
          {/* ── 1 · Vuestro libro ── */}
          {paso === 1 && (
            <ContenidoPaso key="v1" animar={animar} className="flex flex-col gap-7">
              <TituloPaso ref={titulo} antetitulo={V.pasoDe(1, 3)} titulo={V.libroTitulo} bajada={V.libroBajada} />
              {fallo ? <AvisoFallo textos={FALLO[idioma]} guardado={fallo === "guardado"} /> : null}
              {precio === null ? (
                <p className="text-[16px] text-[var(--texto-oscuro-suave)]">{V.noDisponible}</p>
              ) : (
                <OpcionesLibro cat={cat} base={precio} elegida={opcionDe(e)} onElegir={(o) => cambiar(eleccionDe(o, e))}
                  textos={{ ...V, titulo: V.libroTitulo }} foto="/checkout/marco-viaje.jpg" formatear={f} />
              )}

              {impreso && cat.impreso?.precioCopia != null ? (
                <Contador titulo={T.copiasTitulo} detalle={T.cadaUno(f(cat.impreso.precioCopia))} valor={e.copias} onCambio={(n) => cambiar({ copias: n })}
                  menos={T.unoMenos(T.copiasTitulo)} mas={T.unoMas(T.copiasTitulo)} max={19} />
              ) : null}

              {precio !== null ? (
                <ContadorMarcos estado={e} cat={cat} onCambio={(n) => cambiar(conMarcosParaRegalar(e, n))}
                  titulo={T.marcoRegaloTitulo} detalle={V.marcoRegaloDetalle} textos={T} formatear={f} />
              ) : null}

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

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="nombre">{V.tuNombre}</label>
                  <input id="nombre" {...marca("nombre")} className={`${CAMPO} mt-2`} value={e.nombre} onChange={(ev) => cambiar({ nombre: ev.target.value })} placeholder={V.tuNombrePista} autoComplete="name" />
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="apodo">{V.comoTeDicen}</label>
                  <input id="apodo" className={`${CAMPO} mt-2`} value={e.comoLeDicen} onChange={(ev) => cambiar({ comoLeDicen: ev.target.value })} placeholder={V.comoTeDicenPista} />
                </div>
                <div className="sm:col-span-2">
                  <label className={ETIQUETA} htmlFor="tel">{V.whatsapp}</label>
                  <input id="tel" {...marca("telefono")} className={`${CAMPO} mt-2`} value={e.telefono} onChange={(ev) => cambiar({ telefono: ev.target.value })} placeholder={T.whatsappPista} inputMode="tel" autoComplete="tel" />
                  <p className={AYUDA}>{V.whatsappAyuda}</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="salida">{V.salida}</label>
                  <input id="salida" type="date" {...marca("fechas")} className={`${CAMPO} mt-2`} value={e.salida} onChange={(ev) => cambiar({ salida: ev.target.value })} />
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="vuelta">{V.vuelta}</label>
                  <input id="vuelta" type="date" {...marca("fechas")} className={`${CAMPO} mt-2`} value={e.vuelta} min={e.salida || undefined} onChange={(ev) => cambiar({ vuelta: ev.target.value })} />
                  {dias ? <p className={AYUDA}>{V.dias(dias)}</p> : null}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className={ETIQUETA}>{V.etapas}</p>
                <p className="text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{V.etapasAyuda}</p>
                <ul className="flex flex-col gap-3">
                  {e.etapas.map((x, i) => (
                    <li key={i} className="grid gap-2 rounded-[6px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-3 sm:grid-cols-[1fr_150px_150px_auto] sm:items-center">
                      <input aria-label={V.etapa(i + 1)} className={CAMPO} value={x.nombre} onChange={(ev) => editarEtapa(i, { nombre: ev.target.value })} placeholder={i === 0 ? V.etapaPrimera : V.etapaOtra} />
                      <input aria-label={V.desde} type="date" className={CAMPO} value={x.desde ?? ""} min={e.salida || undefined} max={e.vuelta || undefined} onChange={(ev) => editarEtapa(i, { desde: ev.target.value || undefined })} />
                      <input aria-label={V.hasta} type="date" className={CAMPO} value={x.hasta ?? ""} min={x.desde || e.salida || undefined} max={e.vuelta || undefined} onChange={(ev) => editarEtapa(i, { hasta: ev.target.value || undefined })} />
                      <button type="button" aria-label={V.sacarEtapa} onClick={() => cambiar({ etapas: e.etapas.length > 1 ? e.etapas.filter((_, j) => j !== i) : [{ nombre: "" }] })}
                        className="m-ghost h-11 w-11 justify-self-end rounded-full border border-[var(--borde-oscuro-fuerte)] text-lg text-[var(--texto-oscuro-fuerte)] [touch-action:manipulation]">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" disabled={e.etapas.length >= ETAPAS_MAXIMO} onClick={() => cambiar({ etapas: [...e.etapas, { nombre: "" }] })}
                  className="m-ghost inline-flex min-h-12 items-center self-start rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro-fuerte)] disabled:opacity-60 [font-family:var(--fuente-micro)]">
                  {V.agregarEtapa}
                </button>
              </div>

              <fieldset>
                <legend className={`${ETIQUETA} mb-3`}>{V.conQuien}</legend>
                <div className="flex flex-wrap gap-2.5">
                  {COMPANIAS.map((c) => (
                    <Pastilla key={c} name="compania" value={c} checked={e.compania === c} onChange={() => cambiar({ compania: c })}>
                      {V.companias[c]}
                    </Pastilla>
                  ))}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend className={`${ETIQUETA} mb-3`}>{V.paraQue}</legend>
                {PROPOSITOS.map((p) => (
                  <Opcion key={p} name="proposito" value={p} checked={e.proposito === p} onChange={() => cambiar({ proposito: p })} titulo={V.propositos[p].titulo} detalle={V.propositos[p].detalle} />
                ))}
              </fieldset>

              <fieldset>
                <legend className={`${ETIQUETA} mb-1`}>{V.queSiempre}</legend>
                <p className="mb-3 text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{V.queSiempreAyuda}</p>
                <div className="flex flex-wrap gap-2.5">
                  {ANGULOS.map((a) => (
                    <Pastilla key={a} tipo="checkbox" name="angulos" value={a} checked={e.angulos.includes(a)}
                      onChange={() => cambiar({ angulos: e.angulos.includes(a) ? e.angulos.filter((y) => y !== a) : [...e.angulos, a] })}>
                      {V.angulos[a]}
                    </Pastilla>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="hora">{V.hora}</label>
                  <select id="hora" className={`${CAMPO} mt-2`} value={e.hora} onChange={(ev) => cambiar({ hora: ev.target.value })}>
                    {(Object.keys(V.horas) as (keyof typeof V.horas)[]).map((h) => (
                      <option key={h} value={h}>{V.horas[h]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="zona">{V.zona}</label>
                  <select id="zona" className={`${CAMPO} mt-2`} value={e.zona} onChange={(ev) => cambiar({ zona: ev.target.value })}>
                    {ZONAS.map(([z, n]) => (
                      <option key={z} value={z}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={ETIQUETA} htmlFor="evitar">{V.evitar}</label>
                <textarea id="evitar" className={`${AREA} mt-2`} rows={2} value={e.evitar} onChange={(ev) => cambiar({ evitar: ev.target.value })} maxLength={1000} placeholder={V.evitarPista} />
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
                  <strong className="font-medium text-[var(--texto-oscuro-fuerte)]">{V.despues}</strong> {V.despuesTexto}
                </p>
                <ErrorPaso texto={falla?.texto ?? null} />
                <div className="chk-solo-escritorio">
                  <BotonPagar enviando={enviando} texto={T.pagar(f(compra.total))} procesando={T.procesando} />
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
                  {V.legalAntes}
                  <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">
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
