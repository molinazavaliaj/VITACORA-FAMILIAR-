"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { origenDelNavegador } from "@/lib/origen";
import { regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import type { Catalogo, Moneda } from "@/lib/productos";
import {
  HORAS_KIDS, QUIENES_REGALAN, TEMAS_KIDS, compraKids, cuerpoKids, estadoKidsInicial, fallaEnvioKids, fallaKids, idiomaKidsDeRegion, impresosKids,
  type EstadoKids, type FallaKids, type PasoKids,
} from "@/lib/kids";
import { ContenidoPaso, Opcion, Pastilla } from "../../_ui";
import { CHECKOUT, RESUMEN } from "../../_textos/checkout";
import { CHECKOUT_KIDS, KIDS_IMPRESO_TEXTOS } from "../../_textos/checkout-kids";
import { AYUDA, BOTON_BARRA, BarraPaso, BotonPagar, CAMPO, ETIQUETA, ErrorPaso, ID_ERROR, TituloPaso, arriba } from "../../_checkout/piezas";
import { PasosLibro } from "../../_checkout/pasos-libro";
import { crearPagador } from "../../_checkout/pagador";
import { CLAVE_DIRECCION, guardar, olvidar } from "../../_checkout/memoria";
import { CamposDireccion } from "../../_checkout/direccion";
import { eleccionDe } from "../../_checkout/opciones-libro";
import { OpcionesLibro } from "../../_checkout/opciones-libro-ui";
import { formatearPrecio } from "../productos-ui";

// La compra de Vitácora Kids (15/10) con el cascarón de las compras y la
// paleta de Kids: las 3 pantallas APROBADAS en la rama vitacora-kids
// (docs/kids/v2/mensajes.md §8): 1 tú (nombre, WhatsApp, correo), 2 quién lo
// cuenta (nombre, cómo le dicen, chico o chica, edad, quién se lo regala, por
// dónde llegan las preguntas, a qué hora) y 3 temas y pago (qué no preguntar,
// fotos con otros chicos, pagar). Lo puro vive en lib/kids.ts.
//
// Sin `vende` (KIDS_VENTA, precio y región: lib/kids.ts, kidsVende) el paso 3
// no tiene botón de pagar: dice «Próximamente» y ofrece escribirnos. Con
// `vende`, el botón manda el cuerpo a /api/compra, que crea el narrador, el
// pedido y la fila de kids_v2 (lib/kids-compra.ts) y va a la pasarela.
// KIDS_VENTA no se prende hasta que Joaquín conecte el motor (PENDIENTES
// «Apuntado: Kids»).
//
// El libro impreso (Naza 15/10, tanda 3, punto 10): con `catalogo` (el de Kids,
// lib/kids.ts `catalogoKids`) y un impreso con precio, el paso 3 ofrece las
// opciones de la casa (impreso + digital arriba y elegido, después digital; sin
// marco) y, con el impreso, la dirección de envío de la casa. La dirección se
// guarda en el navegador al ir a pagar y «Pedido confirmado» la escribe en su
// entrega, igual que la casa. El precio lo vuelve a calcular el servidor.

const sesion = () => window.sessionStorage;

const FORM_PAGO = "pago-kids";
const BOTON_PRIMARIO =
  "m-btn inline-flex min-h-14 items-center rounded-full bg-[var(--boton)] px-9 text-[16px] font-semibold text-[var(--sobre-boton)] [font-family:var(--fuente-micro)] [touch-action:manipulation]";
const BOTON_FANTASMA =
  "m-ghost inline-flex min-h-14 items-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro)] disabled:opacity-60 [font-family:var(--fuente-micro)]";

export function CheckoutKids({
  idioma,
  precio,
  moneda,
  catalogo: cat = null,
  escribir,
  pasoInicial = 1,
}: {
  idioma: IdiomaWeb;
  /** El precio de Kids SOLO si se vende (KIDS_VENTA y precio válido); si no, null. */
  precio: number | null;
  moneda: Moneda;
  /** El catálogo de Kids (`catalogoKids`) si se vende; sin él, sin impreso. */
  catalogo?: Catalogo | null;
  /** Adónde lleva «Escríbenos» (WhatsApp de dudas o correo), resuelto en el servidor. */
  escribir: { href: string; externo: boolean };
  /** Para probar cada paso sin navegador. */
  pasoInicial?: PasoKids;
}) {
  const K = CHECKOUT_KIDS[idioma];
  const T = CHECKOUT[idioma];
  const region = regionDeIdioma(idioma);
  const vende = precio !== null;
  // El impreso solo si se vende y tiene precio en la región (catálogo de la casa).
  const conImpreso = vende && cat !== null && cat.impreso !== null;
  const R = RESUMEN[idioma];

  const [paso, setPaso] = useState<PasoKids>(pasoInicial);
  const [e, setE] = useState<EstadoKids>(() => estadoKidsInicial(conImpreso && cat ? cat : undefined, region));
  const [falla, setFalla] = useState<{ texto: string; campo?: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [animar, setAnimar] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerPaso = useRef(true);

  const cambiar = (cambios: Partial<EstadoKids>) => setE((x) => ({ ...x, ...cambios }));
  const f = (n: number) => formatearPrecio(n, moneda, region);
  const aTexto = (x: FallaKids | null) => (x ? { texto: K.errores[x.clave], campo: x.campo } : null);
  // El ticket, con la misma cuenta que el servidor (sin impreso, solo la base).
  const compra = useMemo(
    () => (conImpreso && cat && precio !== null ? compraKids({ ...cat, base: { ...cat.base, precio } }, region, impresosKids(e)) : null),
    [conImpreso, cat, precio, region, e],
  );
  const total = compra ? compra.total : precio;
  const llevaImpreso = conImpreso && e.formato === "impreso";

  // Justo antes de ir a la pasarela: la dirección, para que «Pedido confirmado»
  // la guarde en su entrega cuando vuelva pagado (como la casa).
  const antesDeIr = useRef<(narradorId: string) => void>(() => {});
  useEffect(() => {
    antesDeIr.current = (narradorId) => {
      if (llevaImpreso) {
        guardar(sesion, CLAVE_DIRECCION, narradorId, { destinatarioNombre: e.recibe.trim(), destinatarioTelefono: e.telefonoRecibe.trim(), direccion: e.direccion });
      } else {
        olvidar(sesion, CLAVE_DIRECCION);
      }
    };
  });

  const pagador = useMemo(
    () =>
      crearPagador(
        { fetch: (...a) => fetch(...a), asignar: (url) => window.location.assign(url), origen: origenDelNavegador, antesDeIr: (c) => antesDeIr.current(c.narradorId) },
        T,
      ),
    [T],
  );

  useEffect(() => {
    if (primerPaso.current) {
      primerPaso.current = false;
      return;
    }
    arriba();
    titulo.current?.focus({ preventScroll: true });
  }, [paso]);

  useEffect(() => {
    if (falla) document.getElementById(ID_ERROR)?.scrollIntoView({ block: "nearest" });
  }, [falla]);

  function irA(siguiente: PasoKids) {
    setFalla(null);
    setAnimar(true);
    if (siguiente < 3) pagador.olvidar();
    setPaso(siguiente);
  }

  function seguir(desde: PasoKids) {
    const problema = aTexto(fallaKids(desde, e));
    if (problema) return setFalla(problema);
    irA((desde + 1) as PasoKids);
  }

  async function pagar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!vende || pagador.ocupado) return;
    for (const p of [1, 2] as const) {
      const problema = aTexto(fallaKids(p, e));
      if (problema) {
        setFalla(problema);
        return irA(p);
      }
    }
    const envio = llevaImpreso ? fallaEnvioKids(e, T) : null;
    if (envio) return setFalla(envio);
    setFalla(null);
    setEnviando(true);
    const cuerpo = cuerpoKids(e, region, idioma);
    const r = await pagador.pagar(conImpreso ? cuerpo : { ...cuerpo, productos: { impresos: 0 } }, []);
    if ("error" in r) {
      setFalla({ texto: r.error });
      setEnviando(false);
    }
  }

  const marca = (campo: string) => (falla?.campo === campo ? { "aria-invalid": true, "aria-describedby": ID_ERROR } : {});
  const nombre = e.nombre.trim().split(" ")[0];

  const Escribir = ({ className = BOTON_PRIMARIO }: { className?: string }) => (
    <a href={escribir.href} {...(escribir.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={className}>
      {K.escribir}
    </a>
  );

  return (
    <div className="chk-con-barra mx-auto w-full max-w-[1240px] px-4 pb-28 pt-10 sm:px-8 sm:pt-14">
      <div className="mb-10 sm:mb-14">
        <PasosLibro pasos={K.pasos} actual={paso} etiqueta={K.pasosEtiqueta} />
      </div>
      <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-20">
        <div className="min-w-0">
          {/* ── 1 · Tú ── */}
          {paso === 1 && (
            <ContenidoPaso key="k1" animar={animar} className="flex flex-col gap-7">
              <TituloPaso ref={titulo} antetitulo={K.pasoDe(1, 3)} titulo={K.tuTitulo} bajada={K.tuBajada} />
              {!vende ? <AvisoProximamente K={K} /> : null}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={ETIQUETA} htmlFor="tu-nombre">{K.tuNombre}</label>
                  <input id="tu-nombre" {...marca("tu-nombre")} className={`${CAMPO} mt-2`} value={e.tuNombre} onChange={(ev) => cambiar({ tuNombre: ev.target.value })} placeholder={K.tuNombrePista} autoComplete="name" />
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="tu-whatsapp">{K.tuWhatsapp}</label>
                  <input id="tu-whatsapp" {...marca("tu-whatsapp")} className={`${CAMPO} mt-2`} value={e.tuWhatsapp} onChange={(ev) => cambiar({ tuWhatsapp: ev.target.value })} placeholder={K.tuWhatsappPista} inputMode="tel" autoComplete="tel" />
                  <p className={AYUDA}>{K.tuWhatsappAyuda}</p>
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="email">{K.correo}</label>
                  <input id="email" type="email" {...marca("email")} className={`${CAMPO} mt-2`} value={e.email} onChange={(ev) => cambiar({ email: ev.target.value })} placeholder={K.correoPista} autoComplete="email" inputMode="email" spellCheck={false} />
                  <p className={AYUDA}>{K.correoAyuda}</p>
                </div>
              </div>
              <ErrorPaso texto={falla?.texto ?? null} />
              <div className="chk-solo-escritorio">
                <button type="button" onClick={() => seguir(1)} className={BOTON_PRIMARIO}>{K.continuar}</button>
              </div>
            </ContenidoPaso>
          )}

          {/* ── 2 · Quién lo cuenta ── */}
          {paso === 2 && (
            <ContenidoPaso key="k2" animar={animar} className="flex flex-col gap-7">
              <TituloPaso ref={titulo} antetitulo={K.pasoDe(2, 3)} titulo={K.quienTitulo} bajada={K.quienBajada} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={ETIQUETA} htmlFor="nombre">{K.suNombre}</label>
                  <input id="nombre" {...marca("nombre")} className={`${CAMPO} mt-2`} value={e.nombre} onChange={(ev) => cambiar({ nombre: ev.target.value })} placeholder={K.suNombrePista} />
                  <p className={AYUDA}>{K.suNombreAyuda}</p>
                </div>
                <div>
                  <label className={ETIQUETA} htmlFor="apodo">{K.apodo}</label>
                  <input id="apodo" {...marca("apodo")} className={`${CAMPO} mt-2`} value={e.apodo} onChange={(ev) => cambiar({ apodo: ev.target.value })} placeholder={K.apodoPista} />
                  <p className={AYUDA}>{K.apodoAyuda}</p>
                </div>
                <fieldset>
                  <legend className={`${ETIQUETA} mb-3`}>{K.genero}</legend>
                  <div className="flex flex-wrap gap-2.5" {...marca("genero")}>
                    {(["chico", "chica"] as const).map((g) => (
                      <Pastilla key={g} name="genero" value={g} checked={e.genero === g} onChange={() => cambiar({ genero: g })}>
                        {K.generos[g]}
                      </Pastilla>
                    ))}
                  </div>
                  <p className={AYUDA}>{K.generoAyuda}</p>
                </fieldset>
                <div>
                  <label className={ETIQUETA} htmlFor="edad">{K.edad}</label>
                  <input id="edad" {...marca("edad")} className={`${CAMPO} mt-2 max-w-[120px]`} value={e.edad} onChange={(ev) => cambiar({ edad: ev.target.value })} placeholder={K.edadPista} inputMode="numeric" />
                  <p className={AYUDA}>{K.edadAyuda}</p>
                </div>
              </div>

              <fieldset>
                <legend className={`${ETIQUETA} mb-3`}>{K.regala}</legend>
                <div className="flex flex-wrap gap-2.5" {...marca("quien")}>
                  {QUIENES_REGALAN.map((q) => (
                    <Pastilla key={q} name="quien" value={q} checked={e.quien === q} onChange={() => cambiar({ quien: q })}>
                      {K.quienes[q]}
                    </Pastilla>
                  ))}
                </div>
                {e.quien === "otra" ? (
                  <input aria-label={K.quienes.otra} className={`${CAMPO} mt-3`} value={e.quienOtra} onChange={(ev) => cambiar({ quienOtra: ev.target.value })} placeholder={K.regalaOtraPista} />
                ) : null}
                <p className={AYUDA}>{K.regalaAyuda}</p>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend className={`${ETIQUETA} mb-3`}>{K.canal}</legend>
                <Opcion name="canal" value="A" checked={e.canal === "A"} onChange={() => cambiar({ canal: "A" })} titulo={K.canalA.titulo} detalle={K.canalA.detalle} />
                {e.canal === "A" ? (
                  <div className="pl-1">
                    <label className={ETIQUETA} htmlFor="su-whatsapp">{K.suWhatsapp}</label>
                    <input id="su-whatsapp" {...marca("su-whatsapp")} className={`${CAMPO} mt-2`} value={e.suWhatsapp} onChange={(ev) => cambiar({ suWhatsapp: ev.target.value })} placeholder={K.tuWhatsappPista} inputMode="tel" />
                    <p className={AYUDA}>{K.canalAutoriza}</p>
                  </div>
                ) : null}
                <Opcion name="canal" value="B" checked={e.canal === "B"} onChange={() => cambiar({ canal: "B" })} titulo={K.canalB.titulo} detalle={K.canalB.detalle} />
              </fieldset>

              <div>
                <label className={ETIQUETA} htmlFor="hora">{K.hora}</label>
                <select id="hora" className={`${CAMPO} mt-2 max-w-[200px]`} value={e.hora} onChange={(ev) => cambiar({ hora: ev.target.value })}>
                  {HORAS_KIDS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <p className={AYUDA}>{K.horaAyuda}</p>
              </div>

              <ErrorPaso texto={falla?.texto ?? null} />
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => seguir(2)} className={`chk-solo-escritorio ${BOTON_PRIMARIO}`}>{K.continuar}</button>
                <button type="button" onClick={() => irA(1)} className={BOTON_FANTASMA}>{K.atras}</button>
              </div>
            </ContenidoPaso>
          )}

          {/* ── 3 · Temas y pago ── */}
          {paso === 3 && (
            <ContenidoPaso key="k3" animar={animar}>
              <form id={FORM_PAGO} onSubmit={pagar} noValidate className="flex flex-col gap-7">
                <TituloPaso ref={titulo} antetitulo={K.pasoDe(3, 3)} titulo={K.temasTitulo} bajada={K.temasBajada} />
                <fieldset>
                  <legend className={`${ETIQUETA} mb-3`}>{K.temasLeyenda}</legend>
                  <div className="flex flex-wrap gap-2.5">
                    {TEMAS_KIDS.map((tema) => (
                      <Pastilla
                        key={tema}
                        tipo="checkbox"
                        name="temas"
                        value={tema}
                        checked={e.temas.includes(tema)}
                        onChange={() => cambiar({ temas: e.temas.includes(tema) ? e.temas.filter((x) => x !== tema) : [...e.temas, tema] })}
                        className="h-auto py-2.5 text-left"
                      >
                        {K.temas[tema]}
                      </Pastilla>
                    ))}
                  </div>
                  <p className={`${AYUDA} mt-3`}>{K.temasDebajo}</p>
                </fieldset>

                <div>
                  <Opcion tipo="checkbox" name="fotos" checked={e.fotosConOtrosChicos} onChange={() => cambiar({ fotosConOtrosChicos: !e.fotosConOtrosChicos })} titulo={K.fotos} detalle={K.fotosAyuda} />
                </div>

                {conImpreso && cat && precio !== null ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-[22px] font-medium text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">{T.libroTitulo}</p>
                    <OpcionesLibro
                      cat={cat}
                      base={precio}
                      estado={e}
                      onElegir={(o) => cambiar(eleccionDe(o, e))}
                      onCambio={(c) => cambiar({ ...c, marcos: 0 })}
                      textos={{ ...T, ...KIDS_IMPRESO_TEXTOS[idiomaKidsDeRegion(region)], titulo: T.libroTitulo }}
                      tapa={{ titulo: e.nombre.trim(), idioma: "es", foto: null }}
                      formatear={f}
                    />
                  </div>
                ) : null}
                {llevaImpreso ? <CamposDireccion textos={T} valor={e} onCambio={cambiar} campoConError={falla?.campo} /> : null}

                <p className="border-l-2 border-[var(--kids-acento,#151412)] py-1 pl-5 text-[16px] leading-relaxed text-[var(--texto-oscuro-suave)]">
                  <strong className="font-medium text-[var(--texto-oscuro-fuerte)]">{K.despues}</strong> {K.despuesTexto}
                </p>

                <ErrorPaso texto={falla?.texto ?? null} />
                {vende && precio !== null ? (
                  <>
                    <div className="chk-solo-escritorio">
                      <BotonPagar enviando={enviando} texto={K.pagar(f(total as number))} procesando={K.procesando} />
                    </div>
                    <p className="text-[12px] leading-relaxed text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
                      {K.legalAntes}
                      <a href={ruta(idioma, "/legal/terminos")} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                        {K.terminos}
                      </a>
                      {K.legalDespues}
                    </p>
                  </>
                ) : (
                  <div className="kids-chk-proximo flex flex-col items-start gap-4">
                    <p className="chk-h2">{K.proximamente}</p>
                    <p className="chk-bajada">{K.proximamenteTexto}</p>
                    <Escribir />
                  </div>
                )}
                <div>
                  <button type="button" disabled={enviando} onClick={() => irA(2)} className={BOTON_FANTASMA}>{K.atras}</button>
                </div>
              </form>
            </ContenidoPaso>
          )}
        </div>

        <aside aria-label={K.resumen} className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-8">
          <div className="chk-ficha">
            <div className="dir-tinta chk-ficha-cabeza">
              <div className="flex items-center gap-4">
                <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[14px]">
                  <Image src="/rediseno/kids-libro-tapa.jpg" alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="kids-chk-marca">{K.marca}</span>
                  <span className="chk-ficha-titulo">{nombre ? K.libroDe(nombre) : K.suLibro}</span>
                </div>
              </div>
            </div>
            <div className="chk-ficha-cuerpo flex flex-col gap-2.5">
              {vende && precio !== null ? (
                <>
                  {compra && compra.lineas.length > 1
                    ? compra.lineas.map((l) => (
                        <div key={l.id} className="chk-renglon">
                          <span>
                            {l.id === "pdf" ? K.marca : R.lineas[l.id]}
                            {l.cantidad > 1 ? ` × ${l.cantidad}` : ""}
                          </span>
                          <span aria-hidden className="chk-guia" />
                          <span className="tabular-nums text-[var(--texto-oscuro-fuerte)]">
                            {l.id === "pdf" ? "" : "+"}
                            {f(l.cantidad * l.precioUnitario)}
                          </span>
                        </div>
                      ))
                    : null}
                  <div className="chk-total">
                    <span className="text-[15px] font-medium">{K.total}</span>
                    <span className="chk-total-cifra">{f(total as number)}</span>
                  </div>
                  <span className="text-[12.5px] text-[var(--texto-oscuro-menor)]">{K.pagoUnico}</span>
                </>
              ) : (
                <>
                  <p className="chk-h2">{K.proximamente}</p>
                  <p className="text-[14px] leading-relaxed text-[var(--texto-oscuro-suave)]">{K.proximamenteTexto}</p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* En el teléfono: el botón del paso, abajo. */}
      <BarraPaso etiqueta={K.total} total={vende && total !== null ? f(total) : K.proximamente}>
        {paso === 3 ? (
          vende ? (
            <BotonPagar form={FORM_PAGO} enviando={enviando} texto={K.pagar(f(total as number))} procesando={K.procesando} className="min-h-12 shrink-0 px-6 text-[15.5px]" />
          ) : (
            <Escribir className={BOTON_BARRA} />
          )
        ) : (
          <button type="button" onClick={() => seguir(paso)} className={BOTON_BARRA}>
            {K.continuar}
          </button>
        )}
      </BarraPaso>
    </div>
  );
}

/** «Próximamente», arriba del primer paso, mientras Kids no se vende. */
function AvisoProximamente({ K }: { K: (typeof CHECKOUT_KIDS)["es"] }) {
  return (
    <p className="kids-chk-aviso text-[15px] leading-relaxed [font-family:var(--fuente-micro)]">
      <strong className="font-semibold">{K.proximamente}.</strong> {K.proximamenteTexto}
    </p>
  );
}
