import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Acordeon } from "../_ui/acordeon";
import { clasesBoton } from "../_ui/boton";
import { ReproductorOnda } from "../_ui/reproductor-onda";
import { Cabecera, IconoWhatsApp, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { LinkRegalarLanding } from "../link-regalar";
import { Tachado } from "../comprar/tachado";
import { TEXTOS_PORTADA, type Segmento } from "../_textos/portada";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { VideoPortada } from "./video-portada";
import { DemoMarco } from "./demo-marco";

// La portada del rediseño 2026-10 (maquetas Main/Movil + Resto/RestoMovil),
// la misma para /, /ca y /ar: cambia el idioma y, con él, la región (precios,
// moneda) y el trato. Es ESTÁTICA: no lee headers ni cookies; los precios
// salen de las variables PRECIO_* al construir (RENDIMIENTO.md §3.10 c). A
// quien llega de fuera de Europa a / lo manda a /ar el CDN (next.config.ts).
//
// Lo que se conserva de la portada anterior: catálogo y promo, reseñas
// apagadas (TESTIMONIOS vacío), la barra de compra fija del teléfono, Viaje
// con su precio y el link a /regalar. Todos los textos vienen de
// _textos/portada.ts; ninguno se escribe acá.

// REGLA DURA (brief §7, TEXTOS-Y-REGLAS): la portada NO se publica con reseñas
// inventadas, ni siquiera con la etiqueta «reseña de ejemplo» de la maqueta.
// La sección existe y se enciende con las reales, con permiso por escrito.
const TESTIMONIOS: ReadonlyArray<{ texto: string; nombre: string; detalle: string }> = [];

// «Quiénes somos» (maqueta Resto) no se renderiza hasta tener el texto de los
// socios y una foto real: la maqueta trae huecos. Ver PENDIENTES.md.

// Las fotos son personas generadas (PENDIENTES B10): ilustran, nunca se
// presentan como familias reales ni junto a opiniones.
const FOTOS = {
  poster: "/video/portada-familiar-poster.jpg",
  padre: "/rediseno/para-tu-padre.jpg",
  abuelo: "/rediseno/para-tu-abuelo.jpg",
  viaje: "/rediseno/viaje-mirador-lisboa.jpg",
  portada: "/rediseno/libro-osvaldo-portada.jpg",
  contraportada: "/rediseno/libro-osvaldo-contraportada.jpg",
  marco: "/rediseno/marco-en-casa.jpg",
} as const;

const VIDEO = { escritorio: "/video/portada-familiar-1280.mp4", movil: "/video/portada-familiar-movil.mp4" } as const;

// Alturas fijas de la onda quieta (la del reproductor de «Su voz» cuando no hay
// audio de muestra): misma forma en el servidor y en el cliente.
const ONDA = [10, 18, 28, 14, 24, 32, 16, 12, 26, 30, 14, 20, 28, 10, 22, 30, 16, 8, 24, 18, 12, 26, 20, 14];

export function Portada({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA[idioma];
  const region = regionDeIdioma(idioma);
  const cat = catalogo(region);
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  const precio = formatear(cat.base.precio);
  // La promo, si está prendida: lista tachada + «−N %» junto al «desde».
  const promo = promoPorcentaje();
  const lista = promo ? formatear(precioDeLista(cat.base.precio, cat.moneda, promo)) : null;
  const precioViaje = cat.viaje;
  const comprar = ruta(idioma, "/comprar");
  const whatsapp = urlWhatsAppDudas();
  // El fragmento de su voz, cuando exista un audio de muestra con permiso. Sin
  // él, la onda se muestra quieta, como ilustración, y no hay botón que prometa
  // un sonido que no está.
  const fragmentoAudio = process.env.NEXT_PUBLIC_URL_FRAGMENTO_AUDIO;

  return (
    <div lang={langDeIdioma(idioma)} className="tema-oscuro flex flex-1 flex-col">
      {/* ═══ HERO: vídeo con póster ═══ */}
      <section id="hero" className="relative h-[940px] overflow-hidden sm:h-[960px]">
        <div aria-hidden className="absolute inset-x-0 bottom-0 top-[470px] sm:top-[200px]">
          <Image
            src={FOTOS.poster}
            alt=""
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-[42%_70%] sm:object-[center_60%]"
          />
          <VideoPortada {...VIDEO} className="absolute inset-0 h-full w-full object-cover sm:object-[center_60%]" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#0a0a0a_0%,#0a0a0a_45%,rgba(10,10,10,0.5)_52%,rgba(10,10,10,0)_62%,rgba(10,10,10,0)_82%,#0a0a0a_100%)] sm:bg-[linear-gradient(180deg,#0a0a0a_0%,#0a0a0a_24%,rgba(10,10,10,0.6)_44%,rgba(10,10,10,0)_62%,rgba(10,10,10,0)_84%,#0a0a0a_100%)]" />

        <Cabecera idioma={idioma} camino="/" sobreHero />

        <div className="relative mx-auto flex max-w-[900px] flex-col items-center gap-5 px-4 pt-6 text-center sm:px-6 sm:pt-14">
          <h1 className="m-hero-1 text-[40px] font-medium leading-[1.06] tracking-[-0.01em] text-white [font-family:var(--fuente-titulo)] [text-wrap:balance] sm:text-[56px] lg:text-[68px] lg:leading-[1.04]">
            {t.hero.titulo[0]} <br className="hidden sm:block" />
            {t.hero.titulo[1]}
          </h1>
          <p className="m-hero-2 max-w-[600px] text-[18px] leading-[1.55] text-[#d6d3cc] sm:text-[21px]">{t.hero.bajada}</p>
          <div className="m-hero-3 mt-2 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-3.5">
            <Link prefetch={false} href={comprar} className={clasesBoton("primario", "w-full px-8 py-3.5 text-base sm:w-auto")}>
              {t.hero.comprar}
            </Link>
            <Link prefetch={false} href={ruta(idioma, "/ejemplo")} className={clasesBoton("fantasma", "w-full bg-[rgba(10,10,10,0.4)] px-7 py-3.5 text-base sm:w-auto")}>
              {t.hero.verComo}
            </Link>
          </div>
          <p className="m-hero-3 text-[13px] text-[#b4b1a9] [font-family:var(--fuente-micro)] [text-shadow:0_1px_10px_#0a0a0a]">
            {lista && promo ? <Tachado lista={lista} porcentaje={promo} className="mr-2 text-[20px]" /> : null}
            {t.hero.desde(precio)}
          </p>
          <LinkRegalarLanding
            idioma={idioma}
            className="m-hero-3 flex min-h-11 items-center text-[14px] text-[var(--texto-oscuro-suave)] underline decoration-[var(--borde-oscuro-fuerte)] underline-offset-4 hover:text-white [font-family:var(--fuente-micro)] [text-shadow:0_1px_10px_#0a0a0a]"
          />
        </div>
      </section>

      {/* ═══ BANDA DE CONFIANZA ═══ (sin la garantía: DECISIONES D1) */}
      <div className="border-y border-[var(--linea-oscura)] bg-[#0e0e0c]">
        <ul className="mx-auto flex max-w-[1104px] flex-col gap-4 px-4 py-6 text-[14px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)] sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:px-6">
          {t.banda.map((frase, i) => (
            <li key={frase} className="flex items-center gap-2.5">
              <IconoBanda cual={i} />
              <span>{frase}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ═══ LAS FOTOS QUEDAN ═══ */}
      <section className="mx-auto flex max-w-[1104px] flex-col items-center gap-6 px-4 pb-16 pt-24 text-center sm:px-6 sm:pt-[120px]">
        <h2 className="aparece text-[36px] font-medium leading-[1.1] text-white [font-family:var(--fuente-titulo)] sm:text-[48px]">
          {t.fotos.titulo[0]}
          <br />
          {t.fotos.titulo[1]}
        </h2>
        <p className="aparece max-w-lg text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.fotos.texto}</p>
      </section>

      {/* ═══ 01 · CÓMO FUNCIONA ═══ */}
      <Seccion id="como-funciona">
        <Encabezado etiqueta={t.como.etiqueta} titulo={t.como.titulo} bajada={t.como.bajada} />
        <ol className="aparece grid gap-5 md:grid-cols-3">
          {t.como.pasos.map((paso, i) => (
            <li key={paso.titulo} className="flex flex-col gap-4 rounded-[20px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-7 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#1f1b2e] text-[var(--acento-oscuro)]">
                  <IconoPaso cual={i} />
                </span>
                <span aria-hidden className="text-[44px] italica-tardia leading-none text-[#3a3833] [font-family:var(--fuente-titulo)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="text-[12px] uppercase tracking-[0.16em] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">{t.como.paso(i + 1)}</span>
              <h3 className="text-[26px] font-medium leading-[1.15] text-white [font-family:var(--fuente-titulo)]">{paso.titulo}</h3>
              <p className="text-[17px] leading-[1.55] text-[var(--texto-oscuro-suave)]">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </Seccion>

      {/* ═══ 02 · QUÉ RECIBE CADA UNO ═══ */}
      <Seccion>
        <Encabezado etiqueta={t.recibe.etiqueta} titulo={t.recibe.titulo} bajada={t.recibe.bajada} />
        <div className="aparece grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-[20px] border border-[var(--borde-oscuro)] bg-[#12110e] p-7 sm:p-[30px]">
            <span className="self-start rounded-full border border-[#f0c38a55] px-[11px] py-[5px] text-[11px] uppercase tracking-[0.16em] text-[#f0c38a] [font-family:var(--fuente-micro)]">
              {t.recibe.el.etiqueta}
            </span>
            <h3 className="text-[26px] font-medium leading-[1.2] text-white [font-family:var(--fuente-titulo)]">{t.recibe.el.titulo}</h3>
            <ListaChecks items={t.recibe.el.items} color="text-[#f0c38a]" />
          </div>
          <div className="flex flex-col gap-4 rounded-[20px] border border-[#2f2a45] bg-[#15131d] p-7 sm:p-[30px]">
            <span className="self-start rounded-full border border-[#b9a8f555] px-[11px] py-[5px] text-[11px] uppercase tracking-[0.16em] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">
              {t.recibe.tu.etiqueta}
            </span>
            <h3 className="text-[26px] font-medium leading-[1.2] text-white [font-family:var(--fuente-titulo)]">{t.recibe.tu.titulo}</h3>
            <ListaChecks
              color="text-[var(--acento-oscuro)]"
              items={[
                t.recibe.tu.escuchas,
                t.recibe.tu.pdf,
                ...(cat.impreso ? [cat.marco ? t.recibe.tu.impresoYMarco : t.recibe.tu.impreso] : []),
              ]}
            />
          </div>
        </div>
      </Seccion>

      {/* ═══ 03 · PARA QUIÉN ES (sin Kids) ═══ */}
      <Seccion>
        <Encabezado etiqueta={t.paraQuien.etiqueta} titulo={t.paraQuien.titulo} bajada={<Segmentos partes={t.paraQuien.bajada} />} />
        <div className="aparece grid gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
          <FotoConPie src={FOTOS.padre} ancho={800} alto={1072} {...t.paraQuien.padre} />
          <FotoConPie src={FOTOS.abuelo} ancho={900} alto={1116} {...t.paraQuien.abuelo} />
          <FotoConPie src={FOTOS.viaje} ancho={760} alto={943} href="/viaje" {...t.paraQuien.viaje} />
        </div>
      </Seccion>

      {/* ═══ 04 · ANTES DE DECIDIR ═══ */}
      <Seccion>
        <Encabezado etiqueta={t.dudas.etiqueta} titulo={t.dudas.titulo} />
        <div className="aparece grid gap-5 md:grid-cols-3">
          <TarjetaDuda pregunta={t.dudas.movil.pregunta} texto={t.dudas.movil.texto}>
            <div aria-hidden className="flex items-center gap-2.5 self-start rounded-full bg-[#103a33] px-3 py-2 text-[#d6f5ea]">
              <span className="text-[11px]">▶</span>
              <span className="flex h-4 items-center gap-[2px]">
                {ONDA.slice(0, 12).map((alto, i) => (
                  <span key={i} className="block w-[2px] rounded-full bg-current opacity-80" style={{ height: Math.max(4, alto / 2) }} />
                ))}
              </span>
              <span className="text-[11px] tabular-nums [font-family:var(--fuente-micro)]">1:24</span>
            </div>
          </TarjetaDuda>
          <TarjetaDuda pregunta={t.dudas.hablar.pregunta} texto={t.dudas.hablar.texto}>
            <ul className="flex flex-wrap gap-2">
              {t.dudas.hablar.temas.map((tema) => (
                <li key={tema} className="rounded-full border border-[var(--borde-oscuro-fuerte)] px-3 py-1.5 text-[12px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]">
                  {tema}
                </li>
              ))}
            </ul>
          </TarjetaDuda>
          <TarjetaDuda pregunta={t.dudas.medias.pregunta} texto={t.dudas.medias.texto} />
        </div>
        <a href="#preguntas" className="flex min-h-11 items-center self-start text-[14px] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">
          {t.dudas.verTodas}
        </a>
      </Seccion>

      {/* ═══ OPINIONES — solo con reseñas reales ═══ */}
      {TESTIMONIOS.length > 0 ? (
        <Seccion>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIOS.map((r) => (
              <figure key={r.nombre} className="flex flex-col gap-3.5 rounded-[18px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
                <blockquote className="text-[17px] italic leading-[1.55] text-[#e4e1da]">{r.texto}</blockquote>
                <figcaption className="text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
                  {r.nombre} · {r.detalle}
                </figcaption>
              </figure>
            ))}
          </div>
        </Seccion>
      ) : null}

      {/* ═══ LA CONVERSACIÓN ═══ */}
      <Seccion borde>
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="aparece flex flex-col gap-4">
            <Etiqueta>{t.conversacion.etiqueta}</Etiqueta>
            <H2>{t.conversacion.titulo}</H2>
            {t.conversacion.parrafos.map((p) => (
              <p key={p} className="text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">
                {p}
              </p>
            ))}
          </div>
          <div className="aparece">
            <TelefonoChat c={t.conversacion.chat} />
          </div>
        </div>
      </Seccion>

      {/* ═══ MIENTRAS CUENTA (sin anticipo ni «lo lees mientras se escribe») ═══ */}
      <Seccion borde>
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="aparece order-2 flex flex-col gap-4 lg:order-1">
            <PanelMuestra p={t.mientras.panel} />
            <CorreoMuestra m={t.mientras.mail} />
          </div>
          <div className="aparece order-1 flex flex-col gap-4 lg:order-2">
            <Etiqueta>{t.mientras.etiqueta}</Etiqueta>
            <H2>{t.mientras.titulo}</H2>
            <p className="text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.mientras.texto}</p>
            <p className="text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">
              <strong className="font-normal text-white">{t.mientras.fuerte}</strong> {t.mientras.cierre}
            </p>
          </div>
        </div>
      </Seccion>

      {/* ═══ EL LIBRO ═══ */}
      <Seccion borde>
        <div className="grid items-start gap-12 md:grid-cols-[minmax(0,320px)_1fr] md:gap-16">
          <div className="aparece mx-auto w-full max-w-[320px]">
            <Image
              src={FOTOS.portada}
              alt={t.libro.altPortada}
              width={376}
              height={520}
              sizes="320px"
              className="h-auto w-full rounded-[6px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
            />
          </div>
          <div className="aparece flex flex-col gap-4">
            <Etiqueta>{t.libro.etiqueta}</Etiqueta>
            <H2>{t.libro.titulo}</H2>
            <p className="text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.libro.texto}</p>
            <ol className="mt-2 flex flex-col">
              {t.libro.capitulos.map((cap, i) => (
                <li key={cap} className="flex items-baseline gap-3 border-b border-[var(--linea-oscura)] py-2.5">
                  <span className="w-6 text-[12px] tabular-nums text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-[18px] text-white [font-family:var(--fuente-titulo)]">{cap}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <ul className="aparece mt-4 grid gap-5 md:grid-cols-3">
          <TarjetaFormato f={t.libro.pdf} precio={precio} />
          {cat.impreso ? <TarjetaFormato f={t.libro.impreso} precio={formatear(cat.base.precio + cat.impreso.precio)} /> : null}
          {cat.impreso && cat.marco ? <TarjetaFormato f={t.libro.marco} precio={t.libro.mas(formatear(cat.marco.precio))} /> : null}
        </ul>
      </Seccion>

      {/* ═══ SU VOZ ═══ */}
      <Seccion borde>
        <div className="grid items-center gap-14 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div className="aparece flex flex-col gap-4">
            <Etiqueta>{t.voz.etiqueta}</Etiqueta>
            <H2>{t.voz.titulo}</H2>
            <p className="text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.voz.texto}</p>
            <figure className="mt-2 flex flex-col gap-4 rounded-[20px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
              <span className="text-[12px] uppercase tracking-[0.16em] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">{t.voz.capitulo}</span>
              {fragmentoAudio ? (
                <ReproductorOnda src={fragmentoAudio} etiquetaReproducir={t.voz.escuchar} etiquetaPausar={t.voz.pausar} />
              ) : (
                <OndaQuieta duracion={t.voz.duracion} />
              )}
              <blockquote className="text-[17px] italic leading-[1.55] text-[#e4e1da]">{t.voz.cita}</blockquote>
            </figure>
          </div>
          <div className="aparece mx-auto w-full max-w-[340px]">
            <Image
              src={FOTOS.contraportada}
              alt={t.voz.altContraportada}
              width={378}
              height={520}
              sizes="340px"
              className="h-auto w-full rounded-[6px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>
      </Seccion>

      {/* ═══ SU FOTO, EN CASA: el marco con chip (solo con el impreso a la venta) ═══ */}
      {cat.impreso && cat.marco ? (
        <Seccion borde>
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div className="aparece flex flex-col gap-5">
              <Etiqueta>{t.marco.etiqueta}</Etiqueta>
              <h2 className="text-[34px] font-medium leading-[1.08] text-white [font-family:var(--fuente-titulo)] sm:text-[46px]">
                {t.marco.titulo[0]}
                <br />
                <span className="italic text-[var(--acento-oscuro)]">{t.marco.titulo[1]}</span>
              </h2>
              <p className="text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.marco.texto}</p>
              <div className="flex items-start gap-4 rounded-[22px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
                <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-[#1f1a33] text-[var(--acento-oscuro)]">
                  <IconoNfc />
                </span>
                <div className="flex flex-col gap-2">
                  <span className="text-[22px] font-medium leading-[1.2] text-white [font-family:var(--fuente-titulo)]">{t.marco.nfcTitulo}</span>
                  <span className="text-[15px] leading-[1.55] text-[var(--texto-oscuro-suave)]">{t.marco.nfcTexto}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[34px] font-medium text-white [font-family:var(--fuente-titulo)]">{t.libro.mas(formatear(cat.marco.precio))}</span>
                <span className="text-[14px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{t.marco.nota}</span>
              </div>
            </div>
            <div className="aparece">
              <DemoMarco
                foto={FOTOS.marco}
                altFoto={t.marco.altMarco}
                portada={FOTOS.portada}
                telefonoQuieto={t.marco.telefonoQuieto}
                telefonoLibro={t.marco.telefonoLibro}
                pasos={t.marco.pasos}
              />
            </div>
          </div>
        </Seccion>
      ) : null}

      {/* ═══ EN DICIEMBRE (sin la cita de IFEMA ni fechas de ejemplo) ═══ */}
      <Seccion borde>
        <div className="grid items-start gap-12 md:grid-cols-[1fr_1.35fr] md:gap-16">
          <div className="aparece">
            <Image
              src={FOTOS.abuelo}
              alt={t.diciembre.altFoto}
              width={900}
              height={1116}
              sizes="(min-width: 768px) 420px, 100vw"
              className="aspect-[4/5] h-auto w-full rounded-[22px] object-cover"
            />
          </div>
          <div className="aparece flex flex-col gap-4">
            <Etiqueta>{t.diciembre.etiqueta}</Etiqueta>
            <H2>{t.diciembre.titulo}</H2>
            <p className="text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.diciembre.texto}</p>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              {cat.impreso ? (
                <div className="flex flex-col gap-2 rounded-[18px] bg-[#f1eadc] p-6 text-[#2a2620]">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#8a7350] [font-family:var(--fuente-micro)]">{t.diciembre.casa.etiqueta}</span>
                  <span className="text-[26px] font-medium [font-family:var(--fuente-titulo)]">{t.diciembre.casa.titulo}</span>
                  <span className="text-[15px] leading-[1.55]">{t.diciembre.casa.texto}</span>
                </div>
              ) : null}
              {cat.impreso && cat.marco ? (
                <div className="flex flex-col gap-2 rounded-[18px] border border-[var(--borde-oscuro-fuerte)] p-6">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{t.diciembre.cadaUno.etiqueta}</span>
                  <span className="text-[26px] font-medium text-white [font-family:var(--fuente-titulo)]">{t.diciembre.cadaUno.titulo}</span>
                  <span className="text-[15px] leading-[1.55] text-[var(--texto-oscuro-suave)]">{t.diciembre.cadaUno.texto}</span>
                </div>
              ) : null}
            </div>
            <div className="mt-2 flex flex-col gap-3 rounded-[18px] border border-[#2f2a45] bg-[#15131d] p-6">
              <div className="flex items-center gap-3 text-[var(--acento-oscuro)]">
                <IconoRegalo />
                <span className="text-[22px] font-medium text-white [font-family:var(--fuente-titulo)]">{t.diciembre.regalo.titulo}</span>
              </div>
              <p className="text-[15px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.diciembre.regalo.texto}</p>
              <LinkRegalarLanding
                idioma={idioma}
                className="flex min-h-11 items-center self-start text-[15px] text-[var(--acento-oscuro)] underline decoration-[#4a4466] underline-offset-4 [font-family:var(--fuente-micro)]"
              />
            </div>
          </div>
        </div>
      </Seccion>

      {/* ═══ LO QUE SE HEREDA ═══ */}
      <section className="border-t border-[#1c1b18] bg-[#0d0d0b] [contain-intrinsic-size:auto_500px] [content-visibility:auto]">
        <div className="aparece mx-auto flex max-w-[1104px] flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 sm:py-[140px]">
          <Etiqueta>{t.hereda.etiqueta}</Etiqueta>
          <h2 className="max-w-[860px] text-[34px] font-medium leading-[1.1] text-white [font-family:var(--fuente-titulo)] [text-wrap:balance] sm:text-[52px]">
            {t.hereda.titulo}
          </h2>
          <p className="max-w-[640px] text-[19px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.hereda.texto}</p>
          <p className="text-[22px] italic text-[var(--acento-oscuro)]">{t.hereda.cierre}</p>
        </div>
      </section>

      {/* ═══ EL PRECIO (sin garantía: va solo en la FAQ) ═══ */}
      <Seccion borde ctaPropio>
        <div className="aparece flex flex-col gap-10 rounded-[28px] border border-[#2f2a45] bg-[#15131d] p-7 sm:p-[52px] md:flex-row md:items-center md:gap-12">
          <div className="flex flex-1 flex-col gap-3.5">
            <Etiqueta>{t.precio.etiqueta}</Etiqueta>
            <H2>{t.precio.titulo}</H2>
            <p className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-[14px] text-[#b4b1a9] [font-family:var(--fuente-micro)]">{t.precio.desde}</span>
              {lista && promo ? <Tachado lista={lista} porcentaje={promo} className="text-[48px]" /> : null}
              <span className="text-[56px] font-medium leading-none tabular-nums text-white [font-family:var(--fuente-titulo)] sm:text-[72px]">{precio}</span>
            </p>
            <p className="text-[16px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.precio.texto}</p>
            <Link prefetch={false} href={comprar} className={clasesBoton("primario", "mt-1.5 self-start px-[34px] py-4 text-base")}>
              {t.comprar}
            </Link>
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <ListaChecks color="text-[var(--acento-oscuro)]" items={[t.precio.siempre, ...t.precio.items]} />
            {cat.impreso && cat.marco ? (
              <p className="border-t border-[#2f2a45] pt-4 text-[14px] leading-[1.6] text-[var(--texto-oscuro-menor)]">{t.precio.marcos}</p>
            ) : null}
          </div>
        </div>
      </Seccion>

      {/* ═══ VITÁCORA DE VIAJE + ¿Y SI EL LIBRO ES EL TUYO? ═══ */}
      <Seccion id="viaje">
        <div className="aparece grid gap-5 md:grid-cols-2">
          <div className="tema-viaje flex flex-col gap-4 rounded-[22px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-7 sm:p-9">
            <span className="flex items-center gap-2.5 text-[12px] uppercase tracking-[0.18em] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">
              <IconoAvion />
              {t.viaje.etiqueta}
            </span>
            <h2 className="text-[28px] font-medium leading-[1.15] text-white [font-family:var(--fuente-titulo)]">{t.viaje.titulo}</h2>
            <p className="text-[16px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.viaje.texto}</p>
            <ul className="flex flex-col gap-3">
              {t.viaje.items.map(([titulo, texto]) => (
                <li key={titulo} className="flex flex-col gap-0.5">
                  <span className="text-[16px] text-white [font-family:var(--fuente-titulo)]">{titulo}</span>
                  <span className="text-[14px] leading-[1.55] text-[var(--texto-oscuro-suave)]">{texto}</span>
                </li>
              ))}
            </ul>
            <Link prefetch={false} href="/viaje" className="mt-auto flex min-h-11 items-center self-start text-[14px] text-[var(--acento-oscuro)] underline underline-offset-4 [font-family:var(--fuente-micro)]">
              {t.viaje.enlace}
              {precioViaje !== null ? ` · ${t.viaje.desde(formatear(precioViaje))}` : ""}
            </Link>
          </div>
          <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-7 sm:p-9">
            <Etiqueta>{t.elTuyo.etiqueta}</Etiqueta>
            <h2 className="text-[28px] font-medium leading-[1.15] text-white [font-family:var(--fuente-titulo)]">{t.elTuyo.titulo}</h2>
            <p className="text-[16px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{t.elTuyo.texto}</p>
            <Link prefetch={false} href={comprar} className="mt-auto flex min-h-11 items-center self-start text-[14px] text-[var(--acento-oscuro)] underline underline-offset-4 [font-family:var(--fuente-micro)]">
              {t.elTuyo.enlace}
            </Link>
          </div>
        </div>
      </Seccion>

      {/* ═══ PREGUNTAS (la garantía vive acá y solo acá: DECISIONES D1) ═══ */}
      <Seccion id="preguntas">
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div className="aparece flex flex-col gap-4">
            <Etiqueta>{t.faq.etiqueta}</Etiqueta>
            <H2>{t.faq.titulo}</H2>
            {whatsapp ? (
              <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
                <span className="text-[20px] italic text-white [font-family:var(--fuente-titulo)]">{t.faq.duda.titulo}</span>
                <p className="text-[15px] leading-[1.55] text-[var(--texto-oscuro-suave)]">{t.faq.duda.texto}</p>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={clasesBoton("fantasma", "self-start")}>
                  <IconoWhatsApp className="h-4 w-4" />
                  {t.faq.duda.boton}
                </a>
              </div>
            ) : null}
          </div>
          <div className="aparece border-t border-[var(--linea-oscura)]">
            {t.faq.preguntas.map((p, i) => (
              <Acordeon key={p.pregunta} pregunta={p.pregunta} abierta={i === 0} grupo="preguntas">
                {p.respuesta}
              </Acordeon>
            ))}
          </div>
        </div>
      </Seccion>

      {/* ═══ CIERRE ═══ */}
      <section data-cta-propio className="border-t border-[var(--linea-oscura)] [contain-intrinsic-size:auto_420px] [content-visibility:auto]">
        <div className="aparece mx-auto flex max-w-[1104px] flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 sm:py-[120px]">
          <h2 className="text-[36px] font-medium leading-[1.1] text-white [font-family:var(--fuente-titulo)] sm:text-[52px]">
            {t.cierre.titulo[0]}
            <br />
            {t.cierre.titulo[1]}
          </h2>
          <Link prefetch={false} href={comprar} className={clasesBoton("primario", "px-8 py-3.5 text-base")}>
            {t.comprar}
          </Link>
          <p className="text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{t.cierre.pie(precio)}</p>
        </div>
      </section>

      <div className="[contain-intrinsic-size:auto_400px] [content-visibility:auto]">
        <Pie idioma={idioma} camino="/" />
      </div>
      <WhatsAppFlotante idioma={idioma} />
      <CtaSticky
        precio={precio}
        conImpreso={cat.impreso !== null}
        href={comprar}
        textos={{ ...t.sticky, boton: t.comprar }}
      />
    </div>
  );
}

/* ───────────────────────── piezas ───────────────────────── */

function Seccion({
  id,
  borde = false,
  ctaPropio = false,
  children,
}: {
  id?: string;
  borde?: boolean;
  /** Las secciones con su propio botón de compra esconden la barra fija del teléfono. */
  ctaPropio?: boolean;
  children: ReactNode;
}) {
  return (
    // content-visibility: el navegador no calcula estilos ni diseño de lo que
    // está lejos de la pantalla hasta que se acerca (RENDIMIENTO §3). El alto
    // estimado evita que la barra de scroll salte; «auto» recuerda el real.
    <section
      id={id}
      data-cta-propio={ctaPropio ? "" : undefined}
      className={`scroll-mt-6 [contain-intrinsic-size:auto_900px] [content-visibility:auto] ${borde ? "border-t border-[#1c1b18]" : ""}`}
    >
      <div className="mx-auto flex max-w-[1104px] flex-col gap-10 px-4 py-20 sm:px-6 sm:py-[110px]">{children}</div>
    </section>
  );
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="text-[12px] uppercase tracking-[0.18em] text-[#b4b1a9] [font-family:var(--fuente-micro)]">{children}</span>;
}

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[32px] font-medium leading-[1.1] text-white [font-family:var(--fuente-titulo)] [text-wrap:balance] sm:text-[40px]">{children}</h2>
  );
}

function Encabezado({ etiqueta, titulo, bajada }: { etiqueta: string; titulo: string; bajada?: ReactNode }) {
  return (
    <div className="aparece flex flex-col gap-2.5">
      <Etiqueta>{etiqueta}</Etiqueta>
      <H2>{titulo}</H2>
      {bajada ? <p className="max-w-[720px] text-[18px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{bajada}</p> : null}
    </div>
  );
}

function Segmentos({ partes }: { partes: Segmento[] }) {
  return (
    <>
      {partes.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <strong key={i} className="font-semibold text-white">
            {p.fuerte}
          </strong>
        ),
      )}
    </>
  );
}

function ListaChecks({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[15px] leading-[1.45] text-[#d6d3cc] [font-family:var(--fuente-micro)]">
          <svg viewBox="0 0 24 24" aria-hidden className={`mt-0.5 h-4 w-4 flex-none ${color}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FotoConPie({
  src,
  ancho,
  alto,
  etiqueta,
  texto,
  alt,
  href,
}: {
  src: string;
  ancho: number;
  alto: number;
  etiqueta: string;
  texto: string;
  alt: string;
  href?: string;
}) {
  const contenido = (
    <>
      <Image
        src={src}
        alt={alt}
        width={ancho}
        height={alto}
        sizes="(min-width: 1104px) 350px, (min-width: 768px) 32vw, (min-width: 640px) 48vw, 100vw"
        className="aspect-[4/5] h-auto w-full rounded-[18px] object-cover"
      />
      <figcaption className="flex flex-col gap-1.5">
        <span className="text-[12px] uppercase tracking-[0.16em] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">{etiqueta}</span>
        <span className="text-[22px] leading-[1.25] text-white [font-family:var(--fuente-titulo)]">{texto}</span>
      </figcaption>
    </>
  );
  return (
    <figure className="flex flex-col gap-3.5">
      {href ? (
        <Link prefetch={false} href={href} className="flex flex-col gap-3.5">
          {contenido}
        </Link>
      ) : (
        contenido
      )}
    </figure>
  );
}

function TarjetaDuda({ pregunta, texto, children }: { pregunta: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[20px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-7">
      <h3 className="text-[23px] font-medium italic leading-[1.3] text-white [font-family:var(--fuente-titulo)]">{pregunta}</h3>
      <p className="text-[15px] leading-[1.55] text-[#b4b1a9]">{texto}</p>
      {children}
    </div>
  );
}

function TarjetaFormato({ f, precio }: { f: { nota: string; nombre: string; detalle: string }; precio: string }) {
  return (
    <li className="flex flex-col gap-3 rounded-[20px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{f.nota}</span>
      <span className="text-[22px] font-medium text-white [font-family:var(--fuente-titulo)]">{f.nombre}</span>
      <p className="text-[15px] leading-[1.55] text-[var(--texto-oscuro-suave)]">{f.detalle}</p>
      <span className="mt-auto pt-2 text-[26px] tabular-nums text-white [font-family:var(--fuente-titulo)]">{precio}</span>
    </li>
  );
}

function OndaQuieta({ duracion }: { duracion: string }) {
  return (
    <div aria-hidden className="flex items-center gap-4">
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-[var(--borde-oscuro-fuerte)] text-[var(--acento-oscuro)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M4 12h1M7 9v6M10 6v12M13 8v8M16 10v4M19 11.5v1" />
        </svg>
      </span>
      <span className="flex h-10 min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
        {ONDA.map((alto, i) => (
          <span key={i} className="m-bar block w-[3px] flex-none rounded-full bg-[var(--acento-oscuro)]" style={{ height: alto }} />
        ))}
      </span>
      <span className="text-[12px] tabular-nums text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{duracion}</span>
    </div>
  );
}

type Chat = (typeof TEXTOS_PORTADA)["es"]["conversacion"]["chat"];

function TelefonoChat({ c }: { c: Chat }) {
  return (
    <figure className="mx-auto flex w-full max-w-[340px] flex-col gap-3">
      <div className="rounded-[34px] border border-[#2c2b28] bg-[#121210] p-2.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="overflow-hidden rounded-[26px] bg-[#0b141a]">
          <div className="flex items-center gap-3 bg-[#1f2c33] px-4 py-3">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--boton)] text-[13px] font-semibold text-[#14140f] [font-family:var(--fuente-micro)]">
              V
            </span>
            <span className="flex flex-col">
              <span className="text-[14px] text-white [font-family:var(--fuente-micro)]">{c.contacto}</span>
              <span className="text-[11px] text-[#8696a0] [font-family:var(--fuente-micro)]">{c.cuenta}</span>
            </span>
          </div>
          <div className="flex flex-col gap-2.5 px-3 py-4 text-[13.5px] leading-[1.45] [font-family:var(--fuente-micro)]">
            <span className="self-center rounded-md bg-[#182229] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[#8696a0]">{c.hora}</span>
            <p className="max-w-[88%] self-start rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2 text-[#e9edef]">{c.mensaje}</p>
            <p className="self-end text-[11px] text-[#8696a0]">{c.grabando}</p>
            <div aria-hidden className="flex w-[82%] items-center gap-2.5 self-end rounded-xl rounded-tr-sm bg-[#005c4b] px-3 py-2 text-[#e9edef]">
              <span className="text-[12px]">▶</span>
              <span className="flex h-5 flex-1 items-center gap-[2px] overflow-hidden">
                {ONDA.map((alto, i) => (
                  <span key={i} className="block w-[2px] flex-none rounded-full bg-current opacity-80" style={{ height: Math.max(4, Math.round(alto * 0.6)) }} />
                ))}
              </span>
              <span className="text-[11px] tabular-nums">{c.duracion}</span>
            </div>
            <p className="max-w-[88%] self-start rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2 text-[#e9edef]">{c.respuesta}</p>
          </div>
        </div>
      </div>
      <figcaption className="text-center text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
        {c.pie}
        <span className="sr-only"> {c.resumen}</span>
      </figcaption>
    </figure>
  );
}

type Panel = (typeof TEXTOS_PORTADA)["es"]["mientras"]["panel"];
type Correo = (typeof TEXTOS_PORTADA)["es"]["mientras"]["mail"];

function PanelMuestra({ p }: { p: Panel }) {
  return (
    <figure className="flex flex-col gap-4 rounded-[20px] border border-[var(--borde-oscuro)] bg-[var(--tarjeta)] p-6">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{p.etiqueta}</span>
      <span className="text-[22px] font-medium text-white [font-family:var(--fuente-titulo)]">{p.titulo}</span>
      <div className="flex justify-between text-[13px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]">
        <span>{p.respuestas}</span>
        <span>{p.voz}</span>
      </div>
      <ul className="flex flex-col divide-y divide-[var(--linea-oscura)]">
        {p.filas.map((f) => (
          <li key={f.texto} className="flex items-center gap-3 py-3">
            <span aria-hidden className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#1f1b2e] text-[11px] text-[var(--acento-oscuro)]">
              ▶
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--texto-oscuro)]">{f.texto}</span>
            <span className="text-[12px] tabular-nums text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{f.dur}</span>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">{p.resumen}</figcaption>
    </figure>
  );
}

function CorreoMuestra({ m }: { m: Correo }) {
  return (
    <figure className="flex flex-col gap-2 rounded-[20px] border border-[#2f2a45] bg-[#15131d] p-6 sm:ml-10">
      <span className="text-[12px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">
        <span className="text-[var(--texto-oscuro)]">{m.remitente}</span> · {m.cuando}
      </span>
      <span className="text-[19px] font-medium text-white [font-family:var(--fuente-titulo)]">{m.asunto}</span>
      <p className="text-[14px] leading-[1.6] text-[var(--texto-oscuro-suave)]">{m.cuerpo}</p>
      <span className="text-[13px] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">{m.enlace}</span>
      <figcaption className="sr-only">{m.resumen}</figcaption>
    </figure>
  );
}

/* Íconos de línea, del mismo trazo que los de la maqueta. */

function Svg({ children, className = "h-[18px] w-[18px]" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function IconoBanda({ cual }: { cual: number }) {
  return (
    <span className="flex text-[var(--acento-oscuro)]">
      {cual === 0 ? (
        <Svg>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
        </Svg>
      ) : cual === 1 ? (
        <Svg>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M7 15h3" />
        </Svg>
      ) : cual === 2 ? (
        <Svg>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
          <circle cx="12" cy="12" r="2.5" />
        </Svg>
      ) : (
        <Svg>
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </Svg>
      )}
    </span>
  );
}

function IconoPaso({ cual }: { cual: number }) {
  if (cual === 0)
    return (
      <Svg className="h-[22px] w-[22px]">
        <path d="M4 20l1.3-3.9A8 8 0 1 1 8.2 19.1z" />
      </Svg>
    );
  if (cual === 1)
    return (
      <Svg className="h-[22px] w-[22px]">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </Svg>
    );
  return (
    <Svg className="h-[22px] w-[22px]">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" />
    </Svg>
  );
}

function IconoNfc() {
  return (
    <Svg className="h-[26px] w-[26px]">
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.5h2M19.5 8.5a5 5 0 0 1 0 7M21.8 6.3a8.2 8.2 0 0 1 0 11.4" />
    </Svg>
  );
}

function IconoRegalo() {
  return (
    <Svg className="h-[26px] w-[26px] flex-none">
      <rect x="3.5" y="8.5" width="17" height="12" rx="1.5" />
      <path d="M12 8.5v12M3.5 12.5h17M12 8.5c-1.5-3.5-5.5-3.5-5.5-1.5S9.5 8.5 12 8.5zM12 8.5c1.5-3.5 5.5-3.5 5.5-1.5S14.5 8.5 12 8.5z" />
    </Svg>
  );
}

function IconoAvion() {
  return (
    <Svg className="h-[18px] w-[18px]">
      <path d="M10.5 13.5L3 11l1.5-1.5 7.5 1 4.5-4.5a2 2 0 0 1 3 3L15 13.5l1 7.5-1.5 1.5-2.5-7.5" />
    </Svg>
  );
}
