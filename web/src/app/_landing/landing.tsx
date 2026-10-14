import Link from "next/link";
import type { ReactNode } from "react";
import { Acordeon } from "../_ui/acordeon";
import { Pie } from "../_publico";
import { Toroide } from "../marca";
import { CtaSticky } from "../cta-sticky";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { Coreografia } from "../_direccion/coreografia";
import { DibujoAudio, DibujoLibreta, DibujoLibro } from "../_direccion/dibujos";
import { Libro3D, PaginaCapitulo, PaginaFoto } from "../_direccion/libro-3d";
import { Foto, ListaHilo, OndaQuieta, conVar } from "../_direccion/piezas";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { TEXTOS_LANDING_COMUN, RUTAS_LANDING, type Landing, type TextosLandingBase } from "../_textos/landings";
import { TEXTOS_LANDING_REGALO } from "../_textos/landing-regalo";
import { TEXTOS_LANDING_PREGUNTAS } from "../_textos/landing-preguntas";
import { TEXTOS_LANDING_VOZ } from "../_textos/landing-voz";
import { TEXTOS_LANDING_VIAJE } from "../_textos/landing-viaje";
import { TEXTOS_VIAJE } from "../_textos/viaje";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { textosAbuelo, type IdiomaRegalo } from "@/lib/regalo-textos";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
// Una sola hoja de estilo, la de la portada (trae los tokens adentro).
import "../_direccion/direccion.css";

// Las landings de anuncio (rediseño 2026-10, fase 4; maquetas LandingRegalo,
// LandingPreguntas, LandingVoz y, de Viaje, la sobria que se puede decir con
// el V1). Una idea por pantalla, en el lenguaje de la portada: tinta y papel,
// el logo que se dibuja a lápiz, el libro de Osvaldo en 3D, fotos en sepia con
// forma. Sin cabecera completa (logo + «Comprar»), sin popup, sin píxel de Meta
// (PENDIENTES B26). La garantía va solo en la mini FAQ (DECISIONES D1).
//
// Cada una lleva al checkout de su idioma (/comprar, /ca/comprar, /ar/comprar;
// Viaje a /comprar/viaje), que ya arranca con la opción por defecto: el libro
// completo si existe (opciones-libro.ts, eleccionInicial).
//
// ESTÁTICAS: no leen headers ni cookies; los precios salen de PRECIO_* al
// construir. Todos los textos vienen de _textos/*.ts.

const FOTOS = {
  padre: "/rediseno/para-tu-padre.jpg",
  abuelo: "/rediseno/para-tu-abuelo.jpg",
  marco: "/rediseno/marco-en-casa.jpg",
  hotel: "/rediseno/viaje-audio-hotel.jpg",
  libroViaje: "/rediseno/viaje-libro-mesa.jpg",
} as const;

const DIBUJOS = [DibujoLibreta, DibujoAudio, DibujoLibro] as const;

const IDIOMA_REGALO: Record<IdiomaWeb, IdiomaRegalo> = { es: "es-ES", ca: "ca", ar: "es-AR" };

type Paso = { titulo: string; texto: string };
type Duda = { pregunta: string; respuesta: string };

/** Precio y promo de la región del idioma, como en la portada. */
function precios(idioma: IdiomaWeb) {
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  const promo = promoPorcentaje();
  const lista = (n: number) => (promo ? formatear(precioDeLista(n, cat.moneda, promo)) : null);
  return { cat, formatear, promo, lista };
}

/* ═══════════════════════ El libro de una vida (Familiar) ═══════════════════════ */

export function LandingFamiliar({ idioma, landing }: { idioma: IdiomaWeb; landing: "regalo" | "preguntas" | "voz" }) {
  const t = TEXTOS_PORTADA[idioma];
  const comun = TEXTOS_LANDING_COMUN[idioma];
  const { cat, formatear, promo, lista } = precios(idioma);
  const precio = formatear(cat.base.precio);
  const listaBase = lista(cat.base.precio);
  const comprar = ruta(idioma, "/comprar");
  const base: TextosLandingBase =
    landing === "regalo" ? TEXTOS_LANDING_REGALO[idioma] : landing === "preguntas" ? TEXTOS_LANDING_PREGUNTAS[idioma] : TEXTOS_LANDING_VOZ[idioma];
  const conMarco = cat.impreso !== null && cat.marco !== null;
  const desde = (
    <>
      {listaBase && promo ? (
        <>
          <s className="mr-2 opacity-70">{listaBase}</s>
          <span className="mr-2">−{promo} %</span>
        </>
      ) : null}
      {t.hero.desde(precio)}
    </>
  );

  // Las preguntas frecuentes de cada una, tomadas de la portada (aprobadas).
  // Índices de t.faq.preguntas: 0 sabrá usarlo, 1 vergüenza, 2 la garantía,
  // 3 quién escucha, 4 si no termina, 5 cuánto, 6 el impreso.
  const faq = t.faq.preguntas;
  const dudas: Duda[] =
    landing === "regalo"
      ? [faq[0], faq[1], faq[2], ...(cat.impreso ? [faq[6]] : [])]
      : landing === "preguntas"
        ? [{ pregunta: t.dudas.hablar.pregunta, respuesta: t.dudas.hablar.texto }, faq[4], faq[2]]
        : [faq[3], faq[0], faq[2]];

  return (
    <Pagina idioma={idioma}>
      <Hero idioma={idioma} base={base} href={comprar} dato={desde} />

      {landing === "regalo" ? <SeccionesRegalo idioma={idioma} /> : null}
      {landing === "preguntas" ? <SeccionesPreguntas idioma={idioma} /> : null}
      {landing === "voz" ? <SeccionesVoz idioma={idioma} conMarco={conMarco} precioMarco={cat.marco ? t.libro.mas(formatear(cat.marco.precio)) : ""} /> : null}

      {landing !== "voz" ? <SeccionLibro idioma={idioma} titulo={comun.libroTitulo} /> : null}

      <MiniFaq titulo={base.faqTitulo} dudas={dudas} />

      <Cierre idioma={idioma} lema={t.hero.titulo.join(" ")} titulo={base.cierre} cta={base.cta} href={comprar} dato={desde} camino={caminoPie(landing)} />

      <CtaSticky precio={precio} conImpreso={cat.impreso !== null} href={comprar} textos={{ ...t.sticky, boton: base.cta }} />
    </Pagina>
  );
}

/** Regalo: tú eliges el día (con la foto del abuelo) y la tarjeta de verdad. */
function SeccionesRegalo({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA[idioma];
  const r = TEXTOS_LANDING_REGALO[idioma];
  const abuelo = textosAbuelo(IDIOMA_REGALO[idioma]);
  return (
    <>
      <section className="dir-papel dir-hoja dir-deckle relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <div className="md:col-span-6">
            <h2 className="dir-titular dir-t3 aparece max-w-[16ch]">{r.pasosTitulo}</h2>
            <Pasos pasos={[{ titulo: r.pasoDia, texto: t.diciembre.regalo.texto }, t.como.pasos[1], t.como.pasos[2]]} etiqueta={t.como.paso} />
          </div>
          <Foto
            src={FOTOS.abuelo}
            alt={r.altFoto}
            forma="arco"
            sizes="(min-width: 768px) 32vw, 72vw"
            className="w-[72%] justify-self-end md:col-span-4 md:col-start-9 md:w-full"
          />
        </div>
      </section>

      <section className="dir-tinta dir-hoja relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-5">
            <h2 className="dir-titular dir-t3">{r.tarjeta.titulo}</h2>
            <p className="dir-parrafo max-w-[38ch]">{r.tarjeta.texto}</p>
          </div>
          <figure className="aparece flex flex-col gap-5 md:col-span-6 md:col-start-7">
            {/* La tarjeta con sus textos de verdad (lib/regalo-textos.ts),
                nombres de ejemplo. Sin el QR: no se escanea nada acá. */}
            <div className="dir-carta">
              <div className="dir-carta-hoja flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <Toroide className="h-5 w-auto text-[#1f1d19]" />
                  <span className="dir-micro text-[var(--dir-carta-suave)]">{abuelo.esUnRegalo}</span>
                </div>
                <p className="dir-titular text-[28px] leading-[1.15] sm:text-[34px]">{abuelo.titulo(r.tarjeta.narrador, r.tarjeta.quien)}</p>
                <ul className="flex flex-col gap-2 text-[16px] leading-[1.55] text-[#4a463f]">
                  {abuelo.explica.map((linea) => (
                    <li key={linea}>{linea}</li>
                  ))}
                </ul>
                <span className="dir-pie text-[18px] text-[var(--dir-carta-suave)]">{abuelo.tapaSlogan}</span>
              </div>
            </div>
            <figcaption className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{r.tarjeta.pie}</figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}

/** Preguntas: las del banco de la entrevista, grandes, y cómo funciona. */
function SeccionesPreguntas({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA[idioma];
  const p = TEXTOS_LANDING_PREGUNTAS[idioma];
  return (
    <>
      <section className="dir-papel dir-hoja dir-deckle relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <div className="md:col-span-7">
            <h2 className="dir-titular dir-t3 aparece max-w-[16ch]">{p.preguntasTitulo}</h2>
            <ol className="mt-12 flex flex-col md:mt-16">
              {p.preguntas.map((q) => (
                <li key={q.id} data-pregunta={q.id} className="aparece flex flex-col gap-3 border-t border-[var(--dir-hilo-papel)] py-8">
                  <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{q.capitulo}</span>
                  <p className="dir-pregunta">{q.texto}</p>
                </li>
              ))}
            </ol>
            <p className="dir-parrafo aparece max-w-[44ch] border-t border-[var(--dir-hilo-papel)] pt-8">{p.preguntasPie}</p>
          </div>
          <Foto
            src={FOTOS.padre}
            alt={p.altFoto}
            forma="ovalo"
            sizes="(min-width: 768px) 30vw, 78vw"
            className="w-[78%] justify-self-end md:col-span-4 md:col-start-9 md:mt-40 md:w-full"
          />
        </div>
      </section>

      <section className="dir-tinta dir-hoja relative">
        <div className="mx-auto max-w-[1360px] px-4 py-24 sm:px-8 md:py-36 lg:px-12">
          <h2 className="dir-titular dir-t3 aparece max-w-[16ch]">{p.pasosTitulo}</h2>
          <p className="dir-parrafo aparece mt-6 max-w-[40ch]">{t.direccion.como.bajada}</p>
          <ol className="mt-14 grid grid-cols-1 gap-x-10 md:mt-20 md:grid-cols-3" style={conVar({ "--dir-sobre-papel": "var(--dir-sobre-tinta)" })}>
            {t.como.pasos.map((paso, i) => {
              const Dibujo = DIBUJOS[i];
              return (
                <li key={paso.titulo} data-revela className="flex flex-col gap-6 border-t border-[var(--dir-hilo-tinta)] py-10">
                  <div className="flex items-end justify-between gap-6">
                    <span aria-hidden className="dir-numero dir-numero--chico">
                      {i + 1}
                    </span>
                    <Dibujo />
                  </div>
                  <span className="sr-only">{t.como.paso(i + 1)}</span>
                  <h3 className="dir-titular text-[28px] leading-[1.1] sm:text-[32px]">{paso.titulo}</h3>
                  <p className="max-w-[38ch] text-[17px] font-light leading-[1.6] text-[var(--dir-sobre-tinta-suave)]">{paso.texto}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}

/** Su voz: la cita del limonero con la onda quieta, el marco y cómo funciona. */
function SeccionesVoz({ idioma, conMarco, precioMarco }: { idioma: IdiomaWeb; conMarco: boolean; precioMarco: string }) {
  const t = TEXTOS_PORTADA[idioma];
  const v = TEXTOS_LANDING_VOZ[idioma];
  return (
    <>
      <section className="dir-papel dir-hoja dir-deckle relative">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-10 px-4 py-24 sm:px-8 md:py-36">
          <div className="aparece flex flex-col gap-6">
            <h2 className="dir-titular dir-t3">{v.vozTitulo}</h2>
            <p className="dir-parrafo max-w-[46ch]">{t.voz.texto}</p>
          </div>
          <figure className="aparece dir-sobre-papel-onda flex flex-col gap-8 border-t border-[var(--dir-hilo-papel)] pt-10">
            <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.voz.capitulo}</span>
            <blockquote className="dir-cita">{t.voz.cita}</blockquote>
            {/* Sin audio de muestra con permiso (PENDIENTES P1): la onda quieta,
                sin botón que prometa un sonido. */}
            <div className="max-w-[560px]">
              <OndaQuieta duracion={t.voz.duracion} conPlay={false} />
            </div>
            <figcaption className="dir-dato text-[var(--dir-sobre-papel-suave)]">{v.ilustracion}</figcaption>
          </figure>
        </div>
      </section>

      {conMarco ? (
        <section className="dir-tinta dir-hoja relative">
          <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
            <Foto
              src={FOTOS.marco}
              alt={t.marco.altMarco}
              forma="arco"
              sizes="(min-width: 768px) 32vw, 74vw"
              className="w-[74%] md:col-span-4 md:w-full"
            />
            <div className="aparece flex flex-col gap-6 md:col-span-6 md:col-start-7">
              <h2 className="dir-titular dir-t3">
                {t.marco.titulo[0]}
                <br />
                <em className="dir-nombre">{t.marco.titulo[1]}</em>
              </h2>
              <p className="dir-parrafo max-w-[42ch]">{t.marco.texto}</p>
              <div className="flex flex-col gap-2 border-t border-[var(--dir-hilo-tinta)] pt-6">
                <span className="dir-titular text-[22px] leading-[1.2]">{t.marco.nfcTitulo}</span>
                <span className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-tinta-suave)]">{t.marco.nfcTexto}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-4">
                <span className="dir-titular text-[34px] tabular-nums">{precioMarco}</span>
                <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{t.marco.nota}</span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className={`${conMarco ? "dir-papel dir-deckle" : "dir-tinta"} dir-hoja relative`}>
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-36 lg:px-12">
          <div className="md:col-span-5">
            <div className="flex flex-col items-start gap-8 md:sticky md:top-24">
              <h2 className="dir-titular dir-t3 aparece max-w-[14ch]">{v.pasosTitulo}</h2>
              <Link prefetch={false} href={ruta(idioma, "/ejemplo")} className={`${conMarco ? "dir-enlace-papel" : "dir-enlace"} aparece`}>
                {t.banda[0]} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7 md:-mt-12">
            <Pasos pasos={t.como.pasos} etiqueta={t.como.paso} tinta={!conMarco} />
          </div>
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════ Vitácora de Viaje ═══════════════════════════ */

export function LandingViaje({ idioma }: { idioma: IdiomaWeb }) {
  const l = TEXTOS_LANDING_VIAJE[idioma];
  const v = TEXTOS_VIAJE[idioma];
  const { cat, formatear, promo, lista } = precios(idioma);
  const precioViaje = cat.viaje;
  const comprar = ruta(idioma, "/comprar/viaje");
  const listaViaje = precioViaje !== null ? lista(precioViaje) : null;
  // Sin PRECIO_VIAJE_* la página no vende: ni botón ni barra de compra.
  const dato =
    precioViaje !== null ? (
      <>
        {listaViaje && promo ? (
          <>
            <s className="mr-2 opacity-70">{listaViaje}</s>
            <span className="mr-2">−{promo} %</span>
          </>
        ) : null}
        {v.precio(formatear(precioViaje))}
      </>
    ) : (
      v.proximamente
    );
  const href = precioViaje !== null ? comprar : null;
  // Las últimas de /viaje (las mismas): cuándo llega el libro y la garantía;
  // en catalán, también en qué lengua escribe el biógrafo (en castellano).
  const dudas = v.faq.preguntas.slice(idioma === "ca" ? -3 : -2);

  return (
    <Pagina idioma={idioma}>
      <Hero idioma={idioma} base={l} href={href} dato={dato} />

      <section className="dir-papel dir-hoja dir-deckle relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <Foto src={FOTOS.hotel} alt={v.altHotel} forma="arco" sizes="(min-width: 768px) 34vw, 78vw" className="w-[78%] md:col-span-5 md:w-full" />
          <div className="aparece flex flex-col gap-8 md:col-span-6 md:col-start-7">
            <h2 className="dir-titular dir-t3">{l.queda.titulo}</h2>
            <ListaHilo items={l.queda.items} />
          </div>
        </div>
      </section>

      <section className="dir-tinta dir-hoja relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-36 lg:px-12">
          <div className="flex flex-col gap-14 md:col-span-5">
            <h2 className="dir-titular dir-t3 aparece max-w-[14ch]">{l.pasosTitulo}</h2>
            <Foto
              src={FOTOS.libroViaje}
              alt={v.altLibro}
              forma="ovalo"
              sizes="(min-width: 768px) 38vw, 92vw"
              apaisada
              className="order-last w-full md:order-none"
            />
          </div>
          <div className="md:col-span-6 md:col-start-7 md:-mt-12">
            <Pasos pasos={l.pasos} tinta />
          </div>
        </div>
      </section>

      <MiniFaq titulo={l.faqTitulo} dudas={dudas} />

      <Cierre idioma={idioma} lema={v.titulo.join(" ")} titulo={l.cierre} cta={l.cta} href={href} dato={dato} camino={caminoPie("viaje")} />
    </Pagina>
  );
}

/* ═══════════════════════════════ piezas ═══════════════════════════════ */

/** La hoja de la página: idioma, grano, la coreografía y el fondo de tinta. */
export function Pagina({ idioma, children }: { idioma: IdiomaWeb; children: ReactNode }) {
  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina flex flex-1 flex-col">
      <Coreografia />
      {children}
    </div>
  );
}

/** Logo + «Comprar»: la única cabecera de una landing. */
function CabeceraLanding({ idioma, href }: { idioma: IdiomaWeb; href: string | null }) {
  const comun = TEXTOS_LANDING_COMUN[idioma];
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-12">
        <Link prefetch={false} href={ruta(idioma, "/")} aria-label={comun.inicio} className="flex min-h-11 items-center gap-3 text-[var(--dir-sobre-tinta)]">
          <Toroide className="h-7 w-auto" />
          <span className="text-[13px] font-medium tracking-[0.2em] [font-family:var(--fuente-micro)]">VITÁCORA</span>
        </Link>
        {href ? (
          <Link prefetch={false} href={href} className="dir-boton dir-boton--lleno dir-boton--chico">
            {comun.comprar}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

/** El hero: el logo que se dibuja a lápiz, el titular enorme y el botón. */
function Hero({ idioma, base, href, dato }: { idioma: IdiomaWeb; base: TextosLandingBase; href: string | null; dato: ReactNode }) {
  return (
    <>
      <section className="dir-tinta relative">
        <CabeceraLanding idioma={idioma} href={href} />
        <div className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-14 pt-28 text-center sm:px-8 sm:pt-32">
          <LogoTrazo id="trazo-landing" halo="var(--dir-tinta)" className="w-[118px] sm:w-[160px] lg:w-[min(190px,20svh)]" />
          <span className="dir-micro dir-entra mt-8 text-[var(--dir-sobre-tinta-suave)] sm:mt-10" style={conVar({ "--e": "0.5s" })}>
            {base.etiqueta}
          </span>
          <h1 className="dir-titular dir-t15 dir-asienta mt-5 max-w-[16ch]">{base.titulo}</h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {base.bajada}
          </p>
          {href ? (
            <Link
              prefetch={false}
              href={href}
              className="dir-boton dir-boton--lleno dir-entra mt-9 w-full max-w-[358px] sm:w-auto"
              style={conVar({ "--e": "0.9s" })}
            >
              {base.cta}
            </Link>
          ) : null}
          <p className="dir-entra dir-dato mt-6 text-[var(--dir-sobre-tinta-suave)]" style={conVar({ "--e": "1.05s" })}>
            {dato}
          </p>
        </div>
      </section>
      {/* La barra de compra del teléfono aparece cuando esto sale de pantalla. */}
      <div id="hero" aria-hidden className="relative h-px" />
    </>
  );
}

/** Tres pasos con número grande en cursiva, separados por hilos (sin tarjetas). */
export function Pasos({ pasos, etiqueta, tinta = false }: { pasos: readonly Paso[]; etiqueta?: (n: number) => string; tinta?: boolean }) {
  const hilo = tinta ? "border-[var(--dir-hilo-tinta)]" : "border-[var(--dir-hilo-papel)]";
  const suave = tinta ? "text-[var(--dir-sobre-tinta-suave)]" : "text-[var(--dir-sobre-papel-suave)]";
  return (
    <ol className="mt-12 flex flex-col md:mt-16">
      {pasos.map((paso, i) => (
        <li key={paso.titulo} className={`aparece grid grid-cols-[auto_1fr] items-start gap-x-6 border-t py-8 sm:gap-x-10 ${hilo}`}>
          <span aria-hidden className="dir-numero dir-numero--chico">
            {i + 1}
          </span>
          <div className="flex flex-col gap-3 pt-2">
            {etiqueta ? <span className="sr-only">{etiqueta(i + 1)}</span> : null}
            <h3 className="dir-titular text-[26px] leading-[1.12] sm:text-[32px]">{paso.titulo}</h3>
            <p className={`max-w-[42ch] text-[17px] font-light leading-[1.6] sm:text-[18px] ${suave}`}>{paso.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** El libro de Osvaldo en 3D, la prueba de «así queda». Historia inventada. */
function SeccionLibro({ idioma, titulo }: { idioma: IdiomaWeb; titulo: string }) {
  const t = TEXTOS_PORTADA[idioma];
  const ej = TEXTOS_EJEMPLO[idioma];
  return (
    <section className="dir-papel dir-hoja dir-deckle relative">
      <noscript>
        <style>{"[data-lejos]{content-visibility:visible}"}</style>
      </noscript>
      <h2 className="dir-titular dir-t3 aparece mx-auto max-w-[1360px] px-4 pt-24 text-center sm:px-8 md:pt-32 lg:px-12">{titulo}</h2>
      <div className="l3-seccion" data-lejos data-libro-3d>
        <div className="l3-pegado">
          <Libro3D idioma={idioma} b={t.direccion.libro} c={ej.libro} />
          <div className="l3-leyenda">
            <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{ej.inventada}</span>
            <Link prefetch={false} href={ruta(idioma, "/ejemplo")} className="dir-enlace-papel">
              {t.banda[0]} <span aria-hidden>→</span>
            </Link>
            <button type="button" data-libro-otra-vez className="l3-otra-vez">
              {t.direccion.libroOtraVez}
            </button>
          </div>
        </div>
        <div className="l3-plano" aria-hidden>
          <div className="l3-plano-hoja">
            <PaginaCapitulo c={ej.libro} />
          </div>
          <div className="l3-plano-hoja">
            <PaginaFoto c={ej.libro} sizes="(min-width: 768px) 320px, 45vw" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Tres o cuatro preguntas en acordeón. La garantía vive acá y solo acá (D1). */
export function MiniFaq({ titulo, dudas, papel = false }: { titulo: string; dudas: Duda[]; papel?: boolean }) {
  return (
    <section className={`${papel ? "dir-papel dir-deckle" : "dir-tinta"} dir-hoja relative`}>
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
        <h2 className="dir-titular dir-t3 aparece md:col-span-4">{titulo}</h2>
        <div className={`aparece border-t md:col-span-7 md:col-start-6 ${papel ? "border-[var(--dir-hilo-papel)]" : "border-[var(--dir-hilo-tinta)]"}`}>
          {dudas.map((d, i) => (
            <Acordeon key={d.pregunta} pregunta={d.pregunta} abierta={i === 0} grupo="dudas">
              {d.respuesta}
            </Acordeon>
          ))}
        </div>
      </div>
    </section>
  );
}

/** El cierre: el lema, el titular de la landing, el botón y el pie. */
function Cierre({
  idioma,
  lema,
  titulo,
  cta,
  href,
  dato,
  camino,
}: {
  idioma: IdiomaWeb;
  lema: string;
  titulo: string;
  cta: string;
  href: string | null;
  dato: ReactNode;
  camino: string;
}) {
  return (
    <section data-cta-propio className="dir-tinta relative">
      <div className="flex flex-col items-center border-t border-[var(--dir-hilo-tinta)] px-4 pb-24 pt-24 text-center sm:px-8 md:pb-36 md:pt-36">
        <LogoTrazo id="trazo-cierre-landing" modo="scroll" halo="var(--dir-tinta)" className="w-[104px] sm:w-[130px]" />
        <p className="aparece dir-pie mt-12 text-[var(--dir-sobre-tinta-suave)]">{lema}</p>
        <h2 className="dir-titular dir-t2 aparece mt-6 max-w-[14ch]">{titulo}</h2>
        {href ? (
          <Link prefetch={false} href={href} className="dir-boton dir-boton--lleno aparece mt-11 w-full max-w-[358px] sm:w-auto">
            {cta}
          </Link>
        ) : null}
        <p className="dir-dato aparece mt-6 text-[var(--dir-sobre-tinta-suave)]">{dato}</p>
      </div>
      <Pie idioma={idioma} camino={camino} />
    </section>
  );
}

/**
 * El camino que recibe el pie para «¿Estás en Argentina?» / «¿Estás en
 * España?»: el de la landing si es el mismo en los dos países; si no (regalo:
 * papá/padre), la portada.
 */
function caminoPie(landing: Landing): string {
  const r = RUTAS_LANDING[landing];
  return r.es === r.ar ? r.es : "/";
}
