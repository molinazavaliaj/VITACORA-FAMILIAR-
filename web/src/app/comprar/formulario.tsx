"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { armarCompra, type Catalogo as CatalogoRegion } from "@/lib/productos";
import { regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { GENEROS, IDIOMAS_REGALO, MENSAJE_MAXIMO } from "@/lib/regalo-reglas";
import { nombreDePila } from "@/lib/como-le-dicen";
import { TAMANO_MAXIMO_BYTES, errorDeTipoDeFoto } from "@/lib/guion";
import { idiomaTrasElNumero } from "@/lib/idioma-telefono";
import { medirImagen } from "@/lib/medir-imagen";
import { idiomaDelLibro } from "@/lib/tapa";
import { ContenidoPaso, Etiqueta, Opcion, Pasos, Pastilla } from "../_ui";
import { CHECKOUT, FALLO, RESUMEN, type Para } from "../_textos/checkout";
import { COMPRADOR_WEB } from "../_textos/regalar";
import { AREA, AYUDA, AvisoFallo, BotonPagar, CAMPO, Contador, ETIQUETA, ErrorPaso, ID_ERROR, Resumen, TituloPaso, arriba } from "../_checkout/piezas";
import { CLAVE_COMPRA, CLAVE_DIRECCION, guardar, leer, olvidar, vieneDePagoFallido } from "../_checkout/memoria";
import { crearPagador, type RespuestaCompra } from "../_checkout/pagador";
import { CamposDireccion } from "../_checkout/direccion";
import { TapaLibro } from "../tapa-libro";
import { CamposEntrega, SIN_ENTREGA } from "../regalar/entrega";
import { formatearPrecio, listaDe } from "./productos-ui";
import {
  carritoDe, claveDeCompra, cuerpoDeLaCompra, esPropia, esRegalo, estadoInicial, fallaDelPaso, generoDe, idiomaInicial, llevaDireccion, proximaNavidad,
  type EstadoCompra, type Falla, type Paso,
} from "./compra";

// El checkout del libro de una vida (rediseño 2026-10, maquetas Checkout y
// CheckoutMovil) en tres pasos, en el orden de DECISIONES D3: 1 su libro,
// 2 para quién, 3 tus datos y el pago. Mapea los cinco pasos de antes (para
// quién · el narrador · tu correo · el libro · las fotos) sin perder nada:
// el impreso puesto de entrada, los marcos solo con impreso, las copias, el
// contexto opcional, el trato con su valor inicial por prefijo, el álbum con
// `tokenFotos` y, nuevo acá, el regalo con tarjeta (antes solo en /regalar).
//
// La región sale del idioma de la web (/ar → AR; / y /ca → ES), no de la
// cabecera del país: la página es estática. El catálogo llega resuelto del
// servidor; lo que se cobra lo recalcula /api/compra con los mismos datos.
// La lógica pura (pasos, validación, cuerpo) vive en ./compra.ts y el pago en
// ../_checkout/pagador.ts, para probarlos sin navegador.

/** El catálogo de las dos regiones (lo usaba la página de antes; se conserva el tipo). */
export type Catalogo = Record<"ES" | "AR", CatalogoRegion>;

// El grabador del audio del regalo baja solo si se elige «Sí, es un regalo».
const Grabador = dynamic(() => import("../regalar/grabador").then((m) => m.Grabador), { ssr: false });

/** Una foto elegida para el álbum, con su miniatura y si ya quedó subida (para no duplicarla al reintentar). */
type FotoElegida = { clave: string; archivo: File; url: string; subida: boolean };
const FOTOS_MAXIMO = 20;
const ESPERA_AUDIO_MS = 30_000;
const PARAS: readonly Para[] = ["padre", "madre", "abuelo", "abuela", "otra", "yo"];

/** Hoy en el reloj de quien compra, como lo pide `input type="date"`. */
function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const sesion = () => window.sessionStorage;

const BOTON_PRIMARIO =
  "m-btn inline-flex min-h-14 items-center rounded-full bg-[var(--boton)] px-9 text-[16px] font-semibold text-[var(--sobre-boton)] [font-family:var(--fuente-micro)] [touch-action:manipulation]";
const BOTON_FANTASMA =
  "m-ghost inline-flex min-h-14 items-center rounded-full border border-[var(--borde-oscuro-fuerte)] px-6 text-[15px] text-[var(--texto-oscuro)] disabled:opacity-60 [font-family:var(--fuente-micro)]";

export function Checkout({
  idioma,
  catalogo: cat,
  promo = null,
  entregaWhatsApp = false,
  pasoInicial = 1,
}: {
  idioma: IdiomaWeb;
  catalogo: CatalogoRegion;
  promo?: number | null;
  /** Si se ofrece mandar el regalo por WhatsApp el día elegido (REGALO_ENTREGA_WHATSAPP). */
  entregaWhatsApp?: boolean;
  /** Para probar cada paso sin navegador. */
  pasoInicial?: Paso;
}) {
  const T = CHECKOUT[idioma];
  const R = RESUMEN[idioma];
  const TR = COMPRADOR_WEB[idioma];
  const region = regionDeIdioma(idioma);
  const trato = idioma === "ar" ? "vos" : "tu";

  const [paso, setPaso] = useState<Paso>(pasoInicial);
  const [e, setE] = useState<EstadoCompra>(() => estadoInicial(idioma, cat));
  const [falla, setFalla] = useState<Falla | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState<string | null>(null);
  const [fallo, setFallo] = useState<null | "guardado" | "solo">(null);
  const [fotos, setFotos] = useState<FotoElegida[]>([]);
  const [audio, setAudio] = useState<Blob | null>(null);
  const entradaFotos = useRef<HTMLInputElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerPaso = useRef(true);
  const archivos = useRef(new Map<string, File>());
  const audioRef = useRef<Blob | null>(null);
  const antesDeIr = useRef<(c: RespuestaCompra) => void>(() => {});

  const cambiar = (cambios: Partial<EstadoCompra>) => setE((x) => ({ ...x, ...cambios }));

  const yo = esPropia(e);
  const regalo = esRegalo(e);
  const ella = generoDe(e) === "mujer";
  const compra = useMemo(() => armarCompra(cat, region, carritoDe(e)), [cat, region, e]);
  const f = (n: number) => formatearPrecio(n, cat.moneda, region);

  // Lo que se guarda justo antes de ir a la pasarela: lo elegido (para volver
  // de un pago fallido, con la prueba para retomar la misma compra) y la
  // dirección (para guardarla en su entrega cuando vuelva pagado).
  useEffect(() => {
    audioRef.current = audio;
    antesDeIr.current = (c) => {
      guardar(sesion, CLAVE_COMPRA, claveDeCompra(idioma), { ...e, retomar: { narradorId: c.narradorId, token: c.tokenFotos } });
      if (llevaDireccion(e)) {
        guardar(sesion, CLAVE_DIRECCION, c.narradorId, { destinatarioNombre: e.recibe.trim(), destinatarioTelefono: e.telefonoRecibe.trim(), direccion: e.direccion });
      } else {
        olvidar(sesion, CLAVE_DIRECCION);
      }
    };
  });

  // El pago, uno solo a la vez. Se crea una vez.
  const pagador = useMemo(
    () =>
      crearPagador(
        {
          fetch: (...a) => fetch(...a),
          asignar: (url) => window.location.assign(url),
          alProgreso: setProgreso,
          antesDeIr: (c) => antesDeIr.current(c),
          subirFoto: async (narradorId, token, clave) => {
            const archivo = archivos.current.get(clave);
            if (!archivo) return;
            const form = new FormData();
            form.set("archivo", archivo);
            const medida = await medirImagen(archivo);
            if (medida) {
              form.set("ancho", String(medida.ancho));
              form.set("alto", String(medida.alto));
            }
            const r = await fetch(`/api/fotos?narrador=${encodeURIComponent(narradorId)}&token=${encodeURIComponent(token)}`, { method: "POST", body: form });
            const json = (await r.json().catch(() => ({}))) as { error?: string; id?: string };
            if (!r.ok || !json.id) throw new Error(json.error ?? T.noSubio(archivo.name));
          },
          subirAudio: async (narradorId, token) => {
            const a = audioRef.current;
            if (!a) return;
            const fd = new FormData();
            fd.append("audio", a);
            const corte = new AbortController();
            const reloj = setTimeout(() => corte.abort(), ESPERA_AUDIO_MS);
            try {
              await fetch(`/api/regalo/audio?narrador=${encodeURIComponent(narradorId)}&token=${encodeURIComponent(token)}`, { method: "POST", body: fd, signal: corte.signal });
            } finally {
              clearTimeout(reloj);
            }
          },
        },
        T,
      ),
    [T],
  );

  // Vuelta de un pago que no se cobró (Casos 2): lo elegido aparece de nuevo,
  // en el paso del pago, y el parámetro se saca de la barra.
  useEffect(() => {
    if (!vieneDePagoFallido(window.location.search)) return;
    const guardado = leer<EstadoCompra>(sesion, CLAVE_COMPRA, claveDeCompra(idioma));
    // Lo dice la URL de vuelta: en una página estática solo se puede leer acá, ya en el navegador.
    setFallo(guardado ? "guardado" : "solo");
    if (guardado) {
      setE({ ...estadoInicial(idioma, cat), ...guardado });
      setPaso(3);
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, [idioma, cat]);

  // Si el navegador vuelve de la pasarela con la página tal cual estaba (bfcache), «Pagar» vuelve a andar.
  useEffect(() => {
    const alVolver = (ev: PageTransitionEvent) => {
      if (!ev.persisted) return;
      pagador.liberar();
      setEnviando(false);
      setProgreso(null);
    };
    window.addEventListener("pageshow", alVolver);
    return () => window.removeEventListener("pageshow", alVolver);
  }, [pagador]);

  useEffect(() => () => fotos.forEach((x) => URL.revokeObjectURL(x.url)), [fotos]);

  // Al cambiar de paso, arriba del todo y el foco al título del paso nuevo.
  useEffect(() => {
    if (primerPaso.current) {
      primerPaso.current = false;
      return;
    }
    arriba();
    titulo.current?.focus({ preventScroll: true });
  }, [paso]);

  function irA(siguiente: Paso) {
    setFalla(null);
    // Si se vuelve a cambiar algo, la compra se crea de nuevo al pagar.
    if (siguiente < 3) pagador.olvidar();
    setPaso(siguiente);
  }

  function seguir(desde: Paso) {
    const problema = fallaDelPaso(desde, e, T, TR.entrega, new Date());
    if (problema) return setFalla(problema);
    irA((desde + 1) as Paso);
  }

  /** Los atributos de un campo con error: lo marcan y lo atan al mensaje. */
  const marca = (campo: string) => (falla?.campo === campo ? { "aria-invalid": true, "aria-describedby": ID_ERROR } : {});
  const describe = (campo: string) => (falla?.campo === campo ? { "aria-describedby": ID_ERROR } : {});

  function elegirPara(para: Para) {
    // «Para mí» no es regalo; al salir de «Para mí», la pregunta del regalo vuelve a estar sin contestar.
    cambiar({
      para,
      ...(para === "yo" ? { regalo: false } : e.para === "yo" ? { regalo: null } : {}),
      ...(para === "otra" || para === "yo" ? {} : { genero: null }),
    });
  }

  function escribirTelefono(telefono: string) {
    setE((x) => ({ ...x, telefono, idioma: x.idiomaAMano ? x.idioma : idiomaTrasElNumero(idiomaInicial(idioma), telefono) }));
  }

  function elegirFotos(lista: FileList | null) {
    if (!lista) return;
    setFalla(null);
    const nuevas: FotoElegida[] = [];
    for (const archivo of Array.from(lista)) {
      const errorDeTipo = errorDeTipoDeFoto(archivo.type, trato);
      if (errorDeTipo) {
        setFalla({ texto: errorDeTipo });
        continue;
      }
      if (archivo.size > TAMANO_MAXIMO_BYTES) {
        setFalla({ texto: T.pesaMucho(archivo.name) });
        continue;
      }
      const clave = `${archivo.name}-${archivo.size}-${archivo.lastModified}`;
      archivos.current.set(clave, archivo);
      nuevas.push({ clave, archivo, url: URL.createObjectURL(archivo), subida: false });
    }
    setFotos((x) => {
      const claves = new Set(x.map((y) => y.clave));
      return [...x, ...nuevas.filter((y) => !claves.has(y.clave))].slice(0, FOTOS_MAXIMO);
    });
    if (entradaFotos.current) entradaFotos.current.value = "";
  }

  async function pagar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pagador.ocupado) return;
    const problema = fallaDelPaso(3, e, T, TR.entrega, new Date());
    if (problema) return setFalla(problema);
    setFalla(null);
    setEnviando(true);
    const r = await pagador.pagar(
      cuerpoDeLaCompra(e, idioma),
      fotos.map((x) => ({ clave: x.clave, nombre: x.archivo.name, subida: x.subida })),
      (clave) => setFotos((x) => x.map((y) => (y.clave === clave ? { ...y, subida: true } : y))),
    );
    if ("error" in r) {
      setFalla({ texto: r.error });
      setEnviando(false);
    }
  }

  const precioImpreso = cat.impreso ? cat.base.precio + cat.impreso.precio : null;
  const tachado = promo ? listaDe(compra.total, cat.moneda, region, promo).texto : null;
  const nombreVisible = (e.comoLeDicen || nombreDePila(e.nombre)).trim();
  const conMarco = e.formato === "impreso" && e.marcos > 0;
  const pideContacto = regalo || e.regalo === false || yo;

  const cabezaResumen = (
    <div className="flex items-center gap-4">
      <div className="w-[72px] shrink-0 overflow-hidden rounded-[6px] shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
        <TapaLibro titulo={e.nombre.trim()} fotoSrc={null} idioma={idiomaDelLibro(e.idioma)} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Etiqueta>{R.marca}</Etiqueta>
        <span className="text-[22px] font-medium leading-tight text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">
          {yo ? R.tuLibro : nombreVisible ? R.libroDe(nombreVisible) : R.suLibro}
        </span>
        {e.para ? <span className="text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{R.para[e.para]}</span> : null}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-9 sm:px-6">
      <div className="mb-9">
        <Pasos pasos={T.pasos} actual={paso} etiqueta={T.pasosEtiqueta} />
      </div>
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {/* ── 1 · Su libro ── */}
          {paso === 1 && (
            <ContenidoPaso key="p1" className="flex flex-col gap-7">
              <TituloPaso ref={titulo} antetitulo={T.pasoDe(1, 3)} titulo={T.libroTitulo} bajada={T.libroBajada} />
              {fallo ? <AvisoFallo textos={FALLO[idioma]} guardado={fallo === "guardado"} /> : null}
              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">{T.libroTitulo}</legend>
                <Opcion name="formato" value="digital" checked={e.formato === "digital"} onChange={() => cambiar({ formato: "digital" })}
                  titulo={T.digitalTitulo} detalle={T.digitalDetalle} precio={f(cat.base.precio)} />
                {precioImpreso !== null ? (
                  <Opcion name="formato" value="impreso" checked={e.formato === "impreso"} onChange={() => cambiar({ formato: "impreso" })}
                    etiqueta={<Etiqueta rellena>{T.impresoEtiqueta}</Etiqueta>} titulo={T.impresoTitulo} detalle={T.impresoDetalle} precio={f(precioImpreso)} />
                ) : null}
              </fieldset>

              {e.formato === "impreso" && cat.impreso?.precioCopia != null ? (
                <Contador titulo={T.copiasTitulo} detalle={T.cadaUno(f(cat.impreso.precioCopia))} valor={e.copias} onCambio={(n) => cambiar({ copias: n })}
                  menos={T.unoMenos(T.copiasTitulo)} mas={T.unoMas(T.copiasTitulo)} max={19} />
              ) : null}

              {cat.marco ? (
                <div
                  className={`m-card flex flex-wrap items-center gap-5 rounded-[22px] border p-5 ${conMarco ? "border-solid border-[var(--acento-oscuro)] bg-[var(--elegido-fondo)]" : "border-dashed border-[var(--punto-vacio)] bg-[var(--tarjeta)]"}`}
                >
                  <Image src="/checkout/marco.jpg" alt={T.marcoFotoAlt} width={480} height={596} sizes="(min-width: 640px) 170px, 60vw"
                    className="aspect-[4/5] w-full max-w-[220px] rounded-[14px] object-cover sm:w-[170px]" />
                  <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-2.5">
                    <Etiqueta>{T.marcoEtiqueta}</Etiqueta>
                    <span className="text-[26px] font-medium leading-tight text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">{T.marcoTitulo}</span>
                    <span className="text-[15px] leading-relaxed text-[var(--texto-oscuro-suave)]">{T.marcoDetalle}</span>
                    {e.formato === "impreso" ? (
                      <label className="m-card m-chip mt-1 inline-flex min-h-11 cursor-pointer items-center gap-2.5 self-start rounded-full border border-[var(--punto-vacio)] py-2 pl-3 pr-5 text-[15px] font-semibold text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)] [touch-action:manipulation]">
                        <input type="checkbox" className="sr-only" checked={e.marcos > 0} onChange={(ev) => cambiar({ marcos: ev.target.checked ? 1 : 0 })} />
                        <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-[7px] border-[1.5px] border-current">
                          {e.marcos > 0 ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12.5l4.2 4.2L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        {e.marcos > 0 ? T.marcoAnadido(f(cat.marco.precio)) : T.marcoAnadir(f(cat.marco.precio))}
                      </label>
                    ) : (
                      <span className="text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{T.marcoSoloImpreso}</span>
                    )}
                  </div>
                </div>
              ) : null}

              {conMarco && cat.marco?.precioAdicional != null ? (
                <Contador titulo={T.marcosExtraTitulo} detalle={T.cadaUno(f(cat.marco.precioAdicional))} valor={e.marcos - 1} onCambio={(n) => cambiar({ marcos: n + 1 })}
                  menos={T.unoMenos(T.marcosExtraTitulo)} mas={T.unoMas(T.marcosExtraTitulo)} max={19} />
              ) : null}

              <div>
                <button type="button" onClick={() => seguir(1)} className={BOTON_PRIMARIO}>
                  {T.continuar}
                </button>
              </div>
            </ContenidoPaso>
          )}

          {/* ── 2 · Para quién ── */}
          {paso === 2 && (
            <ContenidoPaso key="p2" className="flex flex-col gap-7">
              <TituloPaso ref={titulo} antetitulo={T.pasoDe(2, 3)} titulo={T.paraTitulo} bajada={yo ? T.introYo : T.introOtro} />

              <fieldset {...describe("para")}>
                <legend className={`${ETIQUETA} mb-3`}>{T.esPara}</legend>
                <div className="flex flex-wrap gap-2.5">
                  {PARAS.map((p) => (
                    <Pastilla key={p} name="para" value={p} checked={e.para === p} onChange={() => elegirPara(p)}>
                      {T.opciones[p]}
                    </Pastilla>
                  ))}
                </div>
              </fieldset>

              {e.para === "otra" || yo ? (
                <fieldset {...describe("genero")}>
                  <legend className={`${ETIQUETA} mb-3`}>{yo ? T.generoYo : T.generoOtra}</legend>
                  <div className="flex flex-wrap gap-2.5">
                    {GENEROS.map((g) => (
                      <Pastilla key={g} name="genero" value={g} checked={e.genero === g} onChange={() => cambiar({ genero: g })}>
                        {yo ? T.generos[g] : T.generosOtra[g]}
                      </Pastilla>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {e.para ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={ETIQUETA} htmlFor="nombre">{yo ? T.nombreYo : T.nombreOtro}</label>
                      <input id="nombre" {...marca("nombre")} className={`${CAMPO} mt-2`} value={e.nombre} placeholder={T.nombrePista}
                        onChange={(ev) => cambiar({ nombre: ev.target.value })}
                        onBlur={() => {
                          if (!e.comoLeDicen.trim()) cambiar({ comoLeDicen: nombreDePila(e.nombre) });
                        }} />
                      <p className={AYUDA}>{T.nombreAyuda}</p>
                    </div>
                    <div>
                      <label className={ETIQUETA} htmlFor="comoLeDicen">{yo ? T.comoYo : T.comoOtro}</label>
                      <input id="comoLeDicen" {...marca("como")} className={`${CAMPO} mt-2`} value={e.comoLeDicen} placeholder={T.comoPista} onChange={(ev) => cambiar({ comoLeDicen: ev.target.value })} />
                      <p className={AYUDA}>{yo ? T.comoAyudaYo : T.comoAyudaOtro(ella)}</p>
                    </div>
                  </div>

                  {!yo ? (
                    <fieldset {...describe("regalo")}>
                      <legend className={`${ETIQUETA} mb-3`}>{T.esRegalo}</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Opcion name="regalo" value="si" checked={e.regalo === true} onChange={() => cambiar({ regalo: true })} titulo={T.regaloSi} detalle={T.regaloSiDetalle} />
                        <Opcion name="regalo" value="no" checked={e.regalo === false} onChange={() => cambiar({ regalo: false })} titulo={T.regaloNo} detalle={T.regaloNoDetalle} />
                      </div>
                    </fieldset>
                  ) : null}

                  {pideContacto ? <div className="h-px bg-[var(--tarjeta-alta)]" /> : null}

                  {regalo ? (
                    <div className="flex flex-col gap-6">
                      <div>
                        <label className={ETIQUETA} htmlFor="mensaje">{TR.tuMensaje}</label>
                        <textarea id="mensaje" {...marca("mensaje")} className={`${AREA} mt-2`} rows={5} value={e.mensaje} maxLength={MENSAJE_MAXIMO} onChange={(ev) => cambiar({ mensaje: ev.target.value })} />
                        <p className={`${AYUDA} text-right tabular-nums`} aria-live="polite">{TR.contador(e.mensaje.length, MENSAJE_MAXIMO)}</p>
                      </div>
                      <div>
                        <p id="etiqueta-audio" className={ETIQUETA}>{TR.audio}</p>
                        <Grabador audio={audio} onAudio={setAudio} etiquetadoPor="etiqueta-audio" textos={TR} />
                      </div>
                      <fieldset {...describe("fecha")}>
                        <legend className={`${ETIQUETA} mb-3`}>{TR.cuando}</legend>
                        <div className="flex flex-wrap gap-2.5">
                          <Pastilla name="cuando" value="navidad" checked={e.modoFecha === "navidad"} onChange={() => cambiar({ modoFecha: "navidad", fechaEntrega: proximaNavidad(new Date()) })}>
                            {T.navidad}
                          </Pastilla>
                          <Pastilla name="cuando" value="otra" checked={e.modoFecha === "otra"} onChange={() => cambiar({ modoFecha: "otra", fechaEntrega: "", entrega: SIN_ENTREGA })}>
                            {T.otraFecha}
                          </Pastilla>
                        </div>
                        {e.modoFecha === "otra" ? (
                          <input id="fecha" type="date" aria-label={T.otraFecha} {...marca("fecha")} className={`${CAMPO} mt-3 max-w-[260px]`} value={e.fechaEntrega} min={hoyLocal()}
                            onChange={(ev) => cambiar({ fechaEntrega: ev.target.value, ...(ev.target.value ? {} : { entrega: SIN_ENTREGA }) })} />
                        ) : null}
                      </fieldset>
                      <CamposEntrega fecha={e.fechaEntrega} idioma={e.idioma} eleccion={e.entrega} onCambio={(entrega) => cambiar({ entrega })} whatsapp={entregaWhatsApp} textos={TR} marca={marca} />
                      <div className="flex flex-wrap items-center gap-6 rounded-[22px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
                        <TarjetaChica comoLeDicen={nombreVisible} mensaje={e.mensaje.trim()} firma={e.nombreComprador.trim()} />
                        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2">
                          <span className="text-[16px] font-semibold text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">{T.tarjetaTitulo}</span>
                          <span className="text-[15px] leading-relaxed text-[var(--texto-oscuro-suave)]">{T.tarjetaDetalle}</span>
                        </div>
                      </div>
                    </div>
                  ) : pideContacto ? (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={ETIQUETA} htmlFor="telefono">{yo ? T.whatsappYo : T.whatsappOtro}</label>
                        <input id="telefono" {...marca("telefono")} className={`${CAMPO} mt-2`} value={e.telefono} onChange={(ev) => escribirTelefono(ev.target.value)} placeholder={T.whatsappPista} inputMode="tel" autoComplete="off" />
                        <p className={AYUDA}>{yo ? T.whatsappAyudaYo : T.whatsappAyudaOtro}</p>
                      </div>
                      <div>
                        <label className={ETIQUETA} htmlFor="hora">{yo ? T.horaYo : T.horaOtro}</label>
                        <select id="hora" className={`${CAMPO} mt-2`} value={e.hora} onChange={(ev) => cambiar({ hora: ev.target.value })}>
                          {(Object.keys(T.horas) as (keyof typeof T.horas)[]).map((h) => (
                            <option key={h} value={h}>{T.horas[h]}</option>
                          ))}
                        </select>
                        <p className={AYUDA}>{yo ? T.horaAyudaYo : T.horaAyudaOtro}</p>
                      </div>
                    </div>
                  ) : null}

                  {pideContacto ? (
                    <fieldset>
                      <legend className={`${ETIQUETA} mb-3`}>{yo ? T.tratoYo : T.tratoOtro}</legend>
                      <div className="flex flex-wrap gap-2.5" role="group" aria-label={T.tratoEtiqueta}>
                        {IDIOMAS_REGALO.map((i) => (
                          <Pastilla key={i} name="idioma" value={i} lang={i === "ca" ? "ca" : undefined} checked={e.idioma === i} onChange={() => cambiar({ idioma: i, idiomaAMano: true })}>
                            {T.tratos[i]}
                          </Pastilla>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  <details className="m-acc-item rounded-[18px] border border-[var(--borde-oscuro)] px-5" open={Boolean(e.anio || e.estadoCivil || e.hijos || e.dondeVive) || falla?.campo === "anio"}>
                    <summary className="flex min-h-12 items-center justify-between gap-4 py-3 text-[15px] text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">
                      {T.masTitulo(yo)}
                      <span aria-hidden className="m-plus text-xl text-[var(--acento-oscuro)]">+</span>
                    </summary>
                    <div className="m-acc">
                      <div>
                        <div className="grid gap-5 pb-5 pt-1 sm:grid-cols-3">
                          <div>
                            <label className={ETIQUETA} htmlFor="anio">{T.anio}</label>
                            <input id="anio" {...marca("anio")} className={`${CAMPO} mt-2`} value={e.anio} onChange={(ev) => cambiar({ anio: ev.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="1943" inputMode="numeric" />
                          </div>
                          <div>
                            <label className={ETIQUETA} htmlFor="estadoCivil">{T.estadoCivil}</label>
                            <select id="estadoCivil" className={`${CAMPO} mt-2`} value={e.estadoCivil} onChange={(ev) => cambiar({ estadoCivil: ev.target.value })}>
                              {(Object.keys(T.estadosCiviles) as (keyof typeof T.estadosCiviles)[]).map((k) => (
                                <option key={k} value={k}>{T.estadosCiviles[k]}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={ETIQUETA} htmlFor="hijos">{yo ? T.hijosYo : T.hijosOtro}</label>
                            <select id="hijos" className={`${CAMPO} mt-2`} value={e.hijos} onChange={(ev) => cambiar({ hijos: ev.target.value as EstadoCompra["hijos"] })}>
                              {(Object.keys(T.hijos) as (keyof typeof T.hijos)[]).map((k) => (
                                <option key={k} value={k}>{T.hijos[k]}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-3">
                            <label className={ETIQUETA} htmlFor="dondeVive">{yo ? T.dondeYo : T.dondeOtro}</label>
                            <input id="dondeVive" className={`${CAMPO} mt-2`} value={e.dondeVive} onChange={(ev) => cambiar({ dondeVive: ev.target.value.slice(0, 120) })} placeholder={T.dondePista} autoComplete="off" />
                            <p className={AYUDA}>{T.dondeAyuda}</p>
                          </div>
                          <p className={`${AYUDA} mt-0 sm:col-span-3`}>{T.masNota}</p>
                        </div>
                      </div>
                    </div>
                  </details>

                  <section className="flex flex-col gap-3">
                    <h2 className="text-[24px] font-medium leading-tight text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-titulo)]">{yo ? T.fotosTituloYo : T.fotosTituloOtro}</h2>
                    <p className="text-[16px] leading-relaxed text-[var(--texto-oscuro-suave)]">{T.fotosBajada}</p>
                    <p className={`${ETIQUETA} mt-2`}>{T.album}</p>
                    <p className="text-[15px] leading-relaxed text-[var(--texto-oscuro-menor)]">{T.albumDetalle}</p>
                    <input ref={entradaFotos} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(ev) => elegirFotos(ev.target.files)} />
                    {fotos.length > 0 ? (
                      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                        {fotos.map((x) => (
                          <li key={x.clave} className="relative aspect-square overflow-hidden rounded-[12px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)]">
                            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local, no pasa por next/image */}
                            <img src={x.url} alt="" className="h-full w-full object-cover" />
                            {x.subida ? (
                              <span className="absolute bottom-1 left-1 rounded-full bg-[var(--fondo-oscuro)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]">{T.fotoSubida}</span>
                            ) : (
                              <button type="button" aria-label={T.sacarFoto(x.archivo.name)} disabled={enviando} onClick={() => setFotos((l) => l.filter((y) => y.clave !== x.clave))}
                                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fondo-oscuro)] text-[var(--texto-oscuro-fuerte)] [touch-action:manipulation]">
                                ×
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button type="button" disabled={enviando || fotos.length >= FOTOS_MAXIMO} onClick={() => entradaFotos.current?.click()}
                      className="min-h-11 self-start text-[15px] text-[var(--acento-oscuro)] underline underline-offset-4 disabled:opacity-60 [font-family:var(--fuente-micro)]">
                      {fotos.length === 0 ? T.agregarFotos : T.agregarMas(fotos.length, FOTOS_MAXIMO)}
                    </button>
                  </section>
                </>
              ) : null}

              <ErrorPaso texto={falla?.texto ?? null} />
              <Botonera atras={() => irA(1)} siguiente={() => seguir(2)} textoAtras={T.atras} textoSiguiente={T.continuar} />
            </ContenidoPaso>
          )}

          {/* ── 3 · Tus datos y el pago ── */}
          {paso === 3 && (
            <ContenidoPaso key="p3">
              <form onSubmit={pagar} noValidate className="flex flex-col gap-7">
                <TituloPaso ref={titulo} antetitulo={T.pasoDe(3, 3)} titulo={T.pagoTitulo} bajada={T.pagoBajada(yo, regalo)} />
                {fallo ? <AvisoFallo textos={FALLO[idioma]} guardado={fallo === "guardado"} /> : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={ETIQUETA} htmlFor="email">{T.email}</label>
                    <input id="email" type="email" {...marca("email")} className={`${CAMPO} mt-2`} value={e.email} onChange={(ev) => cambiar({ email: ev.target.value })} placeholder={T.emailPista} autoComplete="email" inputMode="email" spellCheck={false} />
                  </div>
                  {!yo ? (
                    <>
                      <div>
                        <label className={ETIQUETA} htmlFor="nombreComprador">{regalo ? T.tuNombreRegalo : T.tuNombre}</label>
                        <input id="nombreComprador" {...marca("comprador")} className={`${CAMPO} mt-2`} value={e.nombreComprador} onChange={(ev) => cambiar({ nombreComprador: ev.target.value })} placeholder={T.tuNombrePista} autoComplete="given-name" />
                      </div>
                      <div>
                        <label className={ETIQUETA} htmlFor="vinculo">{T.vinculo}</label>
                        <input id="vinculo" {...marca("vinculo")} className={`${CAMPO} mt-2`} value={e.vinculo} onChange={(ev) => cambiar({ vinculo: ev.target.value })} placeholder={T.vinculoPista} />
                      </div>
                    </>
                  ) : null}
                </div>

                {llevaDireccion(e) ? (
                  <CamposDireccion textos={T} valor={e} onCambio={cambiar} campoConError={falla?.campo} />
                ) : null}

                <p className="text-[14px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]">{T.metodos}</p>
                <ErrorPaso texto={falla?.texto ?? null} />
                <BotonPagar enviando={enviando} texto={T.pagar(f(compra.total))} procesando={progreso ?? T.procesando} />
                <p className="text-[12px] leading-relaxed text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
                  {T.legalAntes}
                  <a href="/legal/terminos" className="underline underline-offset-2" target="_blank" rel="noreferrer">
                    {T.terminos}
                  </a>
                  {T.legalDespues} {yo ? T.garantiaPropia : T.garantiaFamiliar}
                </p>
                <div>
                  <button type="button" disabled={enviando} onClick={() => irA(2)} className={BOTON_FANTASMA}>
                    {T.atras}
                  </button>
                </div>
              </form>
            </ContenidoPaso>
          )}
        </div>

        <Resumen compra={compra} region={region} textos={R} cabeza={cabezaResumen} incluye={R.incluye(yo)} tachado={tachado} />
      </div>
    </div>
  );
}

/** Continuar y Atrás de los pasos 2 en adelante. */
function Botonera({ atras, siguiente, textoAtras, textoSiguiente }: { atras: () => void; siguiente: () => void; textoAtras: string; textoSiguiente: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={siguiente} className={BOTON_PRIMARIO}>
        {textoSiguiente}
      </button>
      <button type="button" onClick={atras} className={BOTON_FANTASMA}>
        {textoAtras}
      </button>
    </div>
  );
}

/** La cara de adentro de la tarjeta, en chico: el saludo, el mensaje y la firma (como en /regalar). */
function TarjetaChica({ comoLeDicen, mensaje, firma }: { comoLeDicen: string; mensaje: string; firma: string }) {
  return (
    <div className="flex aspect-[105/148] w-[150px] shrink-0 -rotate-3 flex-col gap-2 overflow-hidden rounded-[8px] bg-[#f3ece0] p-4 text-[#2a2620] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      <p className="text-[14px] [font-family:var(--fuente-titulo)]">{comoLeDicen ? `${comoLeDicen},` : ""}</p>
      <p className="flex-1 overflow-hidden whitespace-pre-line text-[9px] italic leading-[1.5] [overflow-wrap:anywhere] [font-family:var(--fuente-titulo)]">{mensaje}</p>
      <p className="self-end text-[11px] italic [font-family:var(--fuente-titulo)]">{firma}</p>
    </div>
  );
}
