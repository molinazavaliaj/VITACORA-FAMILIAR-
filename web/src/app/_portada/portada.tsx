import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Acordeon } from "../_ui/acordeon";
import { ReproductorOnda } from "../_ui/reproductor-onda";
import { Cabecera, IconoWhatsApp, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { LinkRegalarLanding } from "../link-regalar";
import { TEXTOS_PORTADA, type Segmento } from "../_textos/portada";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { Coreografia } from "../_direccion/coreografia";
import { DibujoAudio, DibujoLibreta, DibujoLibro } from "../_direccion/dibujos";
import { Libro3D, PaginaCapitulo, PaginaFoto } from "../_direccion/libro-3d";
import { DemoMarco } from "./demo-marco";
import { Foto, ListaHilo, ONDA, OndaQuieta, Palabras, conVar } from "../_direccion/piezas";
// Una sola hoja de estilo para la portada (trae los tokens adentro): cada
// archivo CSS aparte es un pedido más que frena el primer pintado.
import "../_direccion/direccion.css";

// La portada con la dirección visual nueva (14/10, aprobada por Naza: «sí,
// continuemos»): la web como un libro. Tinta y papel que se alternan como
// capítulos, letra enorme, fotos en blanco y negro que se revelan en sepia,
// el libro de Osvaldo en 3D. Sin violeta.
//
// Capas (regla de Naza, 15/10): una hoja solo tapa a la anterior cuando lo
// que se estaba leyendo ya pasó; nunca se tapa texto a medio leer. Por eso la
// única capa es el inicio (una pantalla, todo centrado), que queda fijo
// mientras sube «Las fotos quedan». Las demás hojas bajan con la página, con
// su borde (sombra arriba y, en el papel, el corte a mano).
//
// La misma para /, /ca y /ar: cambia el idioma y, con él, la región (precios,
// moneda) y el trato. Es ESTÁTICA: no lee headers ni cookies; los precios
// salen de las variables PRECIO_* al construir. Todos los textos vienen de
// _textos/*.ts; ninguno se escribe acá.
//
// Orden (la historia que vende): 1 inicio, 2 «Las fotos quedan», 3 el libro,
// 4 el dolor y la carta, 5 cómo funciona, 6 para quién (lo del prototipo,
// tal cual); después 7 la conversación (lo que vive él), 8 qué recibe cada
// uno, 9 mientras cuenta (lo que vives tú), 10 el libro y sus formatos con
// precio, 11 su voz, 12 su foto en casa, 13 en diciembre (regalo), 15 el
// precio, 16 preguntas (la garantía SOLO ahí), 17 viaje y «el tuyo», 18
// cierre y pie. «Lo que se hereda» (repetía el cierre) y las tres dudas de
// «Antes de decidir» (repetían la FAQ) salieron el 15/10; la duda que no
// estaba en la FAQ («No le gusta hablar de sí mismo») pasó a ella.
//
// Movimiento: CSS (globals.css bloques dir-/l3-, y _direccion/direccion.css)
// más lo poco que corre en el navegador (_direccion/coreografia.tsx). Todo
// falla hacia visible: sin JS o con «menos movimiento», quieto y completo.

// REGLA DURA (brief §7, TEXTOS-Y-REGLAS): la portada NO se publica con reseñas
// inventadas. La sección se enciende con las reales, con permiso por escrito.
const TESTIMONIOS: ReadonlyArray<{ texto: string; nombre: string; detalle: string }> = [];

// Las fotos son personas generadas (PENDIENTES B10): ilustran, nunca se
// presentan como familias reales ni junto a opiniones.
const FOTOS = {
  guitarra: "/rediseno/osvaldo-guitarra.jpg",
  vidriera: "/rediseno/vidriera-vitacora.jpg",
  padre: "/rediseno/para-tu-padre.jpg",
  abuelo: "/rediseno/para-tu-abuelo.jpg",
  viaje: "/rediseno/viaje-mirador-lisboa.jpg",
  portada: "/rediseno/libro-osvaldo-portada.jpg",
  marco: "/rediseno/marco-en-casa.jpg",
} as const;

const DIBUJOS = [DibujoLibreta, DibujoAudio, DibujoLibro] as const;

export function Portada({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA[idioma];
  const ej = TEXTOS_EJEMPLO[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  const precio = formatear(cat.base.precio);
  // La promo, si está prendida: lista tachada y «−N %» junto al «desde».
  const promo = promoPorcentaje();
  const lista = promo ? formatear(precioDeLista(cat.base.precio, cat.moneda, promo)) : null;
  const precioViaje = cat.viaje;
  const comprar = ruta(idioma, "/comprar");
  const whatsapp = urlWhatsAppDudas();
  // El fragmento de su voz, cuando exista un audio de muestra con permiso. Sin
  // él, la onda se muestra quieta, como ilustración, sin botón que prometa un
  // sonido que no está.
  const fragmentoAudio = process.env.NEXT_PUBLIC_URL_FRAGMENTO_AUDIO;

  const [frase1, frase2] = t.fotos.titulo;
  const nFrase = frase1.split(" ").length + frase2.split(" ").length;
  const nDolor = t.direccion.dolor.frase.split(" ").length;
  const coma = t.direccion.dolor.firma.indexOf(", ");
  const firma = coma > 0 ? [t.direccion.dolor.firma.slice(0, coma), t.direccion.dolor.firma.slice(coma + 2)] : [t.direccion.dolor.firma, ""];
  const conMarco = cat.impreso !== null && cat.marco !== null;

  const Promo = () =>
    lista && promo ? (
      <>
        <s className="mr-2 opacity-70">{lista}</s>
        <span className="mr-2">−{promo} %</span>
      </>
    ) : null;

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina flex flex-1 flex-col">
      <Coreografia />

      {/* ═══ 1 · INICIO: el logo se dibuja a lápiz sobre negro. Capa: queda
          fija detrás y la sección siguiente la tapa. ═══ */}
      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-12 pt-32 text-center sm:px-8 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino="/" sobreHero />
          </div>
          <LogoTrazo id="trazo-portada" halo="var(--dir-tinta)" className="w-[150px] sm:w-[220px] lg:w-[min(260px,26svh)]" />

          <h1 className="dir-titular dir-t1 dir-asienta mt-8 max-w-[13ch] sm:mt-10 sm:max-w-none">
            {t.hero.titulo[0]} <br className="hidden sm:block" />
            {t.hero.titulo[1]}
          </h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {t.direccion.bajada}
          </p>
          <div
            className="dir-entra mt-9 flex w-full max-w-[358px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4"
            style={conVar({ "--e": "0.9s" })}
          >
            <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno">
              {t.hero.comprar}
            </Link>
            <Link prefetch={false} href={ruta(idioma, "/ejemplo")} className="dir-boton dir-boton--hilo">
              {t.hero.verComo}
            </Link>
          </div>
          <p className="dir-entra dir-dato mt-6 text-[var(--dir-sobre-tinta-suave)]" style={conVar({ "--e": "1.05s" })}>
            <Promo />
            {t.hero.desde(precio)}
          </p>
        </div>
      </section>
      {/* La barra de compra del teléfono aparece cuando esto sale de pantalla
          (el inicio es una capa fija: no sirve de referencia). */}
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* ═══ 2 · LAS FOTOS QUEDAN: sube tapando el inicio; la frase arranca
          enseguida (sin una pantalla de negro antes) y se completa sola al
          llegar, palabra por palabra ═══ */}
      <section className="dir-tinta dir-hoja dir-sobre-1 relative z-[2] -mt-px">
        <div>
          <div
            data-revela
            className="mx-auto w-full max-w-[1360px] px-4 pb-28 pt-16 sm:px-8 sm:pt-20 md:pb-40 lg:px-12"
            style={conVar({ "--paso": "0.17s" })}
          >
            <h2 className="dir-titular dir-txl">
              <span className="sr-only">
                {frase1} {frase2}
              </span>
              <span aria-hidden className="block">
                <Palabras texto={frase1} total={nFrase} />
              </span>
              <span aria-hidden className="block sm:pl-[0.9em] lg:pl-[1.6em]">
                <Palabras texto={frase2} desde={frase1.split(" ").length} total={nFrase} clase="dir-palabra--se-va" />
              </span>
            </h2>
          </div>
        </div>
      </section>

      {/* ═══ 3 · EL LIBRO: cuando está entero y centrado, gira y se abre en el
          capítulo 1, quieto en su lugar (por tiempo, ~4 s, sin sticky) ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-sobre-2 dir-diferido relative z-[3]">
        <noscript>
          <style>{"[data-lejos]{content-visibility:visible}"}</style>
        </noscript>
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
          {/* Sin giro (sin JS o con «menos movimiento»): el pliego abierto, plano. */}
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

      {/* ═══ 4 · EL DOLOR Y LA CARTA de los fundadores ═══ */}
      <section className="dir-tinta dir-hoja dir-sobre-3 dir-diferido relative z-[4] overflow-hidden">
        {/* La vidriera de Vitácora (Naza 15/10), de fondo y como ambiente de la
            carta: oscurecida para que se lea; decorativa (alt vacío) y diferida. */}
        <div aria-hidden className="dir-carta-fondo pointer-events-none absolute inset-0">
          <Image src={FOTOS.vidriera} alt="" fill sizes="100vw" quality={60} className="object-cover object-[50%_45%]" />
        </div>
        {/* data-lejos: con «Las fotos quedan» más corta, esto queda cerca del
            inicio; sin él, la cursiva de la firma y la foto bajarían antes de
            que se pinte el titular (Coreografia lo arma cuando hay tiempo). */}
        <div data-lejos className="relative mx-auto max-w-[1360px] px-4 pb-28 pt-28 sm:px-8 md:pb-40 md:pt-40 lg:px-12">
          <h2 data-revela className="dir-titular dir-t15 max-w-[17ch]" style={conVar({ "--paso": "0.11s" })}>
            <span className="sr-only">{t.direccion.dolor.frase}</span>
            <span aria-hidden>
              <Palabras texto={t.direccion.dolor.frase} total={nDolor} />
            </span>
          </h2>
          <div className="mt-20 grid grid-cols-1 items-start gap-12 md:mt-28 md:grid-cols-12 md:gap-8">
            <Foto
              src={FOTOS.guitarra}
              alt=""
              forma="arco"
              recorte
              sizes="(min-width: 768px) 24vw, 46vw"
              className="w-[46%] justify-self-end md:order-2 md:col-span-3 md:col-start-10 md:mt-24 md:w-full"
            />
            <article className="dir-carta aparece md:order-1 md:col-span-7 md:col-start-2">
              <div className="dir-carta-hoja">
                <p className="dir-carta-texto">{t.direccion.dolor.carta}</p>
                <footer data-revela className="mt-10 flex flex-col gap-1">
                  <span className="dir-firma">{firma[0]}</span>
                  <svg viewBox="0 0 220 18" className="dir-firma-trazo" aria-hidden>
                    <path
                      className="dir-linea"
                      style={conVar({ "--k": 2 })}
                      d="M3 12 C40 4 70 15 104 9 S170 3 216 8"
                      pathLength={1}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  {firma[1] ? <span className="dir-micro mt-2 text-[var(--dir-carta-suave)]">{firma[1]}</span> : null}
                </footer>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ═══ 5 · CÓMO FUNCIONA: título fijo y tres momentos con dibujo ═══ */}
      <section id="como-funciona" className="dir-papel dir-hoja dir-deckle dir-sobre-4 dir-diferido relative z-[5] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 pb-24 pt-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:pb-36 md:pt-36 lg:px-12">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-24">
              <h2 className="dir-titular dir-t2 aparece">{t.direccion.como.titulo}</h2>
              <p className="aparece mt-7 max-w-[32ch] text-[20px] font-light leading-[1.5] text-[var(--dir-sobre-papel-suave)] sm:text-[23px]">
                {t.direccion.como.bajada}
              </p>
            </div>
          </div>
          <ol className="mt-14 md:col-span-6 md:col-start-7 md:mt-0">
            {t.como.pasos.map((paso, i) => {
              const Dibujo = DIBUJOS[i];
              return (
                <li
                  key={paso.titulo}
                  data-revela
                  className="dir-momento flex flex-col gap-7 border-t border-[var(--dir-hilo-papel)] py-12 md:min-h-[60vh] md:justify-center md:py-16"
                >
                  <div className="flex items-end justify-between gap-6">
                    <span aria-hidden className="dir-numero">
                      {i + 1}
                    </span>
                    <Dibujo />
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="sr-only">{t.como.paso(i + 1)}</span>
                    <h3 className="dir-titular text-[30px] leading-[1.1] sm:text-[38px] lg:text-[44px]">{paso.titulo}</h3>
                    <p className="max-w-[40ch] text-[18px] font-light leading-[1.6] text-[var(--dir-sobre-papel-suave)] sm:text-[19px] lg:text-[21px]">
                      {paso.texto}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ═══ 6 · PARA LAS VIDAS QUE MERECEN SU PROPIO LIBRO ═══ */}
      <section className="dir-papel dir-diferido relative z-[6]">
        <div className="mx-auto max-w-[1360px] px-4 pb-28 sm:px-8 md:pb-44 lg:px-12">
          <div className="border-t border-[var(--dir-hilo-papel)] pt-20 md:pt-32">
            <h2 className="dir-titular dir-t2 aparece max-w-[15ch] md:max-w-[17ch]">{t.direccion.paraQuien}</h2>
            <p className="aparece mt-7 max-w-[44ch] text-[19px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)] sm:text-[21px]">
              <Segmentos partes={t.paraQuien.bajada} />
            </p>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-y-20 md:mt-28 md:grid-cols-12 md:gap-x-8 md:gap-y-0">
            <Foto src={FOTOS.padre} alt={t.paraQuien.padre.alt} forma="ovalo" sizes="(min-width: 768px) 40vw, 86vw" className="w-[86%] md:col-span-5 md:w-full">
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.paraQuien.padre.etiqueta}</span>
              <span className="dir-pie">{t.paraQuien.padre.texto}</span>
            </Foto>
            <Foto
              src={FOTOS.abuelo}
              alt={t.paraQuien.abuelo.alt}
              forma="arco"
              sizes="(min-width: 768px) 28vw, 70vw"
              className="w-[70%] justify-self-end md:col-span-4 md:col-start-8 md:mt-56 md:w-full"
            >
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.paraQuien.abuelo.etiqueta}</span>
              <span className="dir-pie">{t.paraQuien.abuelo.texto}</span>
            </Foto>
            <Foto
              src={FOTOS.viaje}
              alt={t.paraQuien.viaje.alt}
              forma="circulo"
              href={ruta(idioma, "/viaje")}
              sizes="(min-width: 768px) 20vw, 56vw"
              className="w-[56%] md:col-span-3 md:col-start-3 md:-mt-12 md:w-full"
            >
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.paraQuien.viaje.etiqueta}</span>
              <span className="dir-pie">{t.paraQuien.viaje.texto}</span>
            </Foto>
          </div>
        </div>
      </section>

      {/* ═══ 7 · LA CONVERSACIÓN: lo que vive él, en su WhatsApp ═══ */}
      <section className="dir-tinta dir-hoja dir-sobre-5 dir-diferido relative z-[7]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-6">
            <h2 className="dir-titular dir-t3">{t.conversacion.titulo}</h2>
            {t.conversacion.parrafos.map((p) => (
              <p key={p} className="dir-parrafo max-w-[40ch]">
                {p}
              </p>
            ))}
          </div>
          <div className="aparece md:col-span-5 md:col-start-8">
            <TelefonoChat c={t.conversacion.chat} />
          </div>
        </div>
      </section>

      {/* ═══ 8 · QUÉ RECIBE CADA UNO: dos páginas de un pliego ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-sobre-6 dir-diferido relative z-[8]">
        <div className="mx-auto max-w-[1360px] px-4 py-28 sm:px-8 md:py-40 lg:px-12">
          <h2 className="dir-titular dir-t2 aparece max-w-[16ch]">{t.recibe.titulo}</h2>
          <p className="dir-parrafo aparece mt-7 max-w-[44ch]">{t.recibe.bajada}</p>
          <div className="dir-pliego aparece mt-16 md:mt-24">
            <div className="dir-pliego-pagina">
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.recibe.el.etiqueta}</span>
              <h3 className="dir-titular dir-t4">{t.recibe.el.titulo}</h3>
              <ListaHilo items={t.recibe.el.items} />
            </div>
            <div className="dir-pliego-pagina">
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.recibe.tu.etiqueta}</span>
              <h3 className="dir-titular dir-t4">{t.recibe.tu.titulo}</h3>
              <ListaHilo
                items={[t.recibe.tu.escuchas, t.recibe.tu.pdf, ...(cat.impreso ? [cat.marco ? t.recibe.tu.impresoYMarco : t.recibe.tu.impreso] : [])]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 9 · MIENTRAS CUENTA: lo que vives tú (sin anticipo ni «lo lees
          mientras se escribe») ═══ */}
      <section className="dir-tinta dir-hoja dir-sobre-7 dir-diferido relative z-[9]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-5">
            <h2 className="dir-titular dir-t3">{t.mientras.titulo}</h2>
            <p className="dir-parrafo max-w-[40ch]">{t.mientras.texto}</p>
            <p className="dir-parrafo max-w-[40ch]">
              <strong className="font-normal text-[var(--dir-sobre-tinta)]">{t.mientras.fuerte}</strong> {t.mientras.cierre}
            </p>
          </div>
          <div className="aparece flex flex-col gap-6 md:col-span-6 md:col-start-7">
            <PanelMuestra p={t.mientras.panel} />
            <CorreoMuestra m={t.mientras.mail} />
          </div>
        </div>
      </section>

      {/* ═══ 10 · EL LIBRO: índice y formatos con precio, como un índice ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-sobre-8 dir-diferido relative z-[10]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-5">
            <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.libro.etiqueta}</span>
            <h2 className="dir-titular dir-t3">{t.libro.titulo}</h2>
            <p className="dir-parrafo max-w-[40ch]">{t.libro.texto}</p>
            <ol className="dir-indice mt-4">
              {t.libro.capitulos.map((cap, i) => (
                <li key={cap}>
                  <span className="dir-indice-num">{i + 1}</span>
                  <span className="dir-indice-cap">{cap}</span>
                </li>
              ))}
            </ol>
          </div>
          <ul className="aparece flex flex-col md:col-span-6 md:col-start-7 md:pt-24">
            <Formato f={t.libro.pdf} precio={precio} />
            {cat.impreso ? <Formato f={t.libro.impreso} precio={formatear(cat.base.precio + cat.impreso.precio)} /> : null}
            {conMarco && cat.marco ? <Formato f={t.libro.marco} precio={t.libro.mas(formatear(cat.marco.precio))} /> : null}
          </ul>
        </div>
      </section>

      {/* ═══ 11 · SU VOZ: la cita del limonero, grande ═══ */}
      <section className="dir-tinta dir-hoja dir-sobre-9 dir-diferido relative z-[11]">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-10 px-4 py-28 sm:px-8 md:py-40">
          <div className="aparece flex flex-col gap-6">
            <h2 className="dir-titular dir-t3">{t.voz.titulo}</h2>
            <p className="dir-parrafo max-w-[46ch]">{t.voz.texto}</p>
          </div>
          <figure className="aparece flex flex-col gap-8 border-t border-[var(--dir-hilo-tinta)] pt-10">
            <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.voz.capitulo}</span>
            <blockquote className="dir-cita">{t.voz.cita}</blockquote>
            <div className="max-w-[560px]">
              {fragmentoAudio ? (
                <ReproductorOnda src={fragmentoAudio} etiquetaReproducir={t.voz.escuchar} etiquetaPausar={t.voz.pausar} />
              ) : (
                <OndaQuieta duracion={t.voz.duracion} />
              )}
            </div>
          </figure>
        </div>
      </section>

      {/* ═══ 12 · SU FOTO, EN CASA: el marco con chip (solo con el impreso) ═══ */}
      {conMarco && cat.marco ? (
        <section className="dir-papel dir-hoja dir-deckle dir-sobre-10 dir-diferido relative z-[12]">
          <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
            <div className="aparece flex flex-col gap-6 md:col-span-6">
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.marco.etiqueta}</span>
              <h2 className="dir-titular dir-t3">
                {t.marco.titulo[0]}
                <br />
                <em className="dir-nombre">{t.marco.titulo[1]}</em>
              </h2>
              <p className="dir-parrafo max-w-[42ch]">{t.marco.texto}</p>
              <div className="flex items-start gap-5 border-t border-[var(--dir-hilo-papel)] pt-6">
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-[var(--dir-hilo-papel)]">
                  <IconoNfc />
                </span>
                <div className="flex flex-col gap-2">
                  <span className="dir-titular text-[22px] leading-[1.2]">{t.marco.nfcTitulo}</span>
                  <span className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)]">{t.marco.nfcTexto}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-baseline gap-4">
                <span className="dir-titular text-[34px] tabular-nums">{t.libro.mas(formatear(cat.marco.precio))}</span>
                <span className="dir-dato text-[var(--dir-sobre-papel-suave)]">{t.marco.nota}</span>
              </div>
            </div>
            <div className="aparece md:col-span-5 md:col-start-8">
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
        </section>
      ) : null}

      {/* ═══ 13 · EN DICIEMBRE: el regalo (sin la cita de IFEMA ni fechas) ═══ */}
      <section className="dir-tinta dir-hoja dir-sobre-11 dir-diferido relative z-[13]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-start gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <Foto
            src={FOTOS.abuelo}
            alt={t.diciembre.altFoto}
            forma="arco"
            sizes="(min-width: 768px) 34vw, 78vw"
            className="w-[78%] md:col-span-4 md:w-full"
          />
          <div className="aparece flex flex-col gap-6 md:col-span-7 md:col-start-6">
            <h2 className="dir-titular dir-t3">{t.diciembre.titulo}</h2>
            <p className="dir-parrafo max-w-[44ch]">{t.diciembre.texto}</p>
            {cat.impreso ? (
              <div className="grid grid-cols-1 gap-8 border-t border-[var(--dir-hilo-tinta)] pt-8 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.diciembre.casa.etiqueta}</span>
                  <span className="dir-titular text-[26px] leading-[1.15]">{t.diciembre.casa.titulo}</span>
                  <span className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-tinta-suave)]">{t.diciembre.casa.texto}</span>
                </div>
                {conMarco ? (
                  <div className="flex flex-col gap-2">
                    <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.diciembre.cadaUno.etiqueta}</span>
                    <span className="dir-titular text-[26px] leading-[1.15]">{t.diciembre.cadaUno.titulo}</span>
                    <span className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-tinta-suave)]">{t.diciembre.cadaUno.texto}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="dir-carta mt-4 self-start">
              <div className="dir-carta-hoja flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <IconoRegalo />
                  <span className="dir-titular text-[24px] leading-[1.15]">{t.diciembre.regalo.titulo}</span>
                </div>
                <p className="text-[16px] leading-[1.6] text-[#4a463f]">{t.diciembre.regalo.texto}</p>
                <LinkRegalarLanding idioma={idioma} className="dir-enlace-papel self-start" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* No es capa: tiene su propio botón (data-cta-propio) y la barra del
          teléfono necesita saber cuándo deja de verse. */}
      <section data-cta-propio className="dir-tinta dir-hoja dir-sobre-13 dir-diferido relative z-[15]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-6">
            <h2 className="dir-titular dir-t3">{t.precio.titulo}</h2>
            <p className="flex flex-wrap items-baseline gap-3">
              <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{t.precio.desde}</span>
              <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">
                <Promo />
              </span>
              <span className="dir-precio">{precio}</span>
            </p>
            <p className="dir-parrafo max-w-[40ch]">{t.precio.texto}</p>
            <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno self-start">
              {t.comprar}
            </Link>
          </div>
          <div className="aparece flex flex-col gap-6 md:col-span-5 md:col-start-8">
            <ListaHilo items={[t.precio.siempre, ...t.precio.items]} tinta />
            {conMarco ? <p className="border-t border-[var(--dir-hilo-tinta)] pt-5 text-[15px] leading-[1.6] text-[var(--dir-sobre-tinta-suave)]">{t.precio.marcos}</p> : null}
            <ul className="flex flex-col gap-2 border-t border-[var(--dir-hilo-tinta)] pt-5">
              {t.banda.slice(1).map((frase) => (
                <li key={frase} className="dir-dato text-[var(--dir-sobre-tinta-suave)]">
                  {frase}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ PREGUNTAS (la garantía vive acá y solo acá: DECISIONES D1) ═══ */}
      <section id="preguntas" className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[16] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-12 px-4 pb-28 pt-28 sm:px-8 md:pt-40 md:grid-cols-12 md:gap-8 md:pb-40 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.faq.titulo}</h2>
            {whatsapp ? (
              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--dir-hilo-papel)] pt-6">
                <span className="dir-pie">{t.faq.duda.titulo}</span>
                <p className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)]">{t.faq.duda.texto}</p>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--tinta self-start">
                  <IconoWhatsApp className="mr-2 h-4 w-4" />
                  {t.faq.duda.boton}
                </a>
              </div>
            ) : null}
          </div>
          <div className="aparece border-t border-[var(--dir-hilo-papel)] md:col-span-7 md:col-start-6">
            {t.faq.preguntas.map((p, i) => (
              <Fragment key={p.pregunta}>
                <Acordeon pregunta={p.pregunta} abierta={i === 0} grupo="preguntas">
                  {p.respuesta}
                </Acordeon>
                {/* La duda de «Antes de decidir» que no estaba en la FAQ (15/10). */}
                {i === 1 ? (
                  <Acordeon pregunta={t.dudas.hablar.pregunta} grupo="preguntas">
                    {t.dudas.hablar.texto}
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {t.dudas.hablar.temas.map((tema) => (
                        <li key={tema} className="dir-tema">
                          {tema}
                        </li>
                      ))}
                    </ul>
                  </Acordeon>
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OPINIONES: solo con reseñas reales ═══ */}
      {TESTIMONIOS.length > 0 ? (
        <section className="dir-papel relative z-[16]">
          <div className="mx-auto grid max-w-[1360px] gap-10 px-4 pb-28 sm:px-8 md:grid-cols-3 lg:px-12">
            {TESTIMONIOS.map((r) => (
              <figure key={r.nombre} className="flex flex-col gap-3 border-t border-[var(--dir-hilo-papel)] pt-6">
                <blockquote className="dir-pie">{r.texto}</blockquote>
                <figcaption className="dir-dato text-[var(--dir-sobre-papel-suave)]">
                  {r.nombre} · {r.detalle}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* ═══ 17 · VITÁCORA DE VIAJE y ¿Y SI EL LIBRO ES EL TUYO? ═══ */}
      <section id="viaje" className="dir-tinta dir-hoja dir-diferido relative z-[17] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 py-28 sm:px-8 md:grid-cols-2 md:py-36 lg:px-12">
          <div className="aparece flex flex-col gap-5 pb-14 md:border-r md:border-[var(--dir-hilo-tinta)] md:pb-0 md:pr-12">
            <span className="dir-micro flex items-center gap-2.5 text-[var(--dir-sobre-tinta-suave)]">
              <IconoAvion />
              {t.viaje.etiqueta}
            </span>
            <h2 className="dir-titular dir-t4">{t.viaje.titulo}</h2>
            <p className="dir-parrafo">{t.viaje.texto}</p>
            <ul className="flex flex-col gap-4">
              {t.viaje.items.map(([titulo, texto]) => (
                <li key={titulo} className="flex flex-col gap-1">
                  <span className="dir-titular text-[19px]">{titulo}</span>
                  <span className="text-[15px] font-light leading-[1.55] text-[var(--dir-sobre-tinta-suave)]">{texto}</span>
                </li>
              ))}
            </ul>
            <Link prefetch={false} href={ruta(idioma, "/viaje")} className="dir-enlace mt-2 self-start">
              {t.viaje.enlace}
              {precioViaje !== null ? ` · ${t.viaje.desde(formatear(precioViaje))}` : ""}
            </Link>
          </div>
          <div className="aparece flex flex-col gap-5 border-t border-[var(--dir-hilo-tinta)] pt-14 md:border-t-0 md:pl-12 md:pt-0">
            <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.elTuyo.etiqueta}</span>
            <h2 className="dir-titular dir-t4">{t.elTuyo.titulo}</h2>
            <p className="dir-parrafo">{t.elTuyo.texto}</p>
            <Link prefetch={false} href={comprar} className="dir-enlace mt-2 self-start">
              {t.elTuyo.enlace}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 18 · CIERRE: el colofón; abajo, el pie ═══ */}
      <section data-cta-propio className="dir-tinta dir-diferido relative z-[17]">
        <div className="flex flex-col items-center border-t border-[var(--dir-hilo-tinta)] px-4 pb-28 pt-28 text-center sm:px-8 md:pb-40 md:pt-40">
          <LogoTrazo id="trazo-cierre" modo="scroll" halo="var(--dir-tinta)" className="w-[120px] sm:w-[150px]" />
          <p className="aparece dir-pie mt-14 text-[var(--dir-sobre-tinta-suave)]">{t.hereda.cierre}</p>
          <h2 className="dir-titular dir-t2 aparece mt-6 max-w-[13ch] sm:max-w-none">
            {t.cierre.titulo[0]} <br className="hidden sm:block" />
            {t.cierre.titulo[1]}
          </h2>
          <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno aparece mt-11 w-full max-w-[358px] sm:w-auto">
            {t.comprar}
          </Link>
          <p className="dir-dato aparece mt-6 text-[var(--dir-sobre-tinta-suave)]">{t.cierre.pie(precio)}</p>
        </div>
        <Pie idioma={idioma} camino="/" />
      </section>

      <WhatsAppFlotante idioma={idioma} />
      <CtaSticky precio={precio} conImpreso={cat.impreso !== null} href={comprar} textos={{ ...t.sticky, boton: t.comprar }} />
    </div>
  );
}

/* ───────────────────────── piezas ───────────────────────── */

function Segmentos({ partes }: { partes: Segmento[] }) {
  return (
    <>
      {partes.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <strong key={i} className="font-normal text-[var(--dir-sobre-papel)]">
            {p.fuerte}
          </strong>
        ),
      )}
    </>
  );
}

function Formato({ f, precio }: { f: { nota: string; nombre: string; detalle: string }; precio: string }) {
  return (
    <li className="dir-formato">
      <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{f.nota}</span>
      <span className="dir-formato-linea">
        <span className="dir-titular text-[26px] leading-[1.15] sm:text-[30px]">{f.nombre}</span>
        <span aria-hidden className="dir-formato-puntos" />
        <span className="dir-titular text-[26px] tabular-nums sm:text-[30px]">{precio}</span>
      </span>
      <span className="max-w-[46ch] text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)]">{f.detalle}</span>
    </li>
  );
}

type Chat = (typeof TEXTOS_PORTADA)["es"]["conversacion"]["chat"];

/** El chat de WhatsApp, dentro de un teléfono. Los verdes son los de WhatsApp. */
function TelefonoChat({ c }: { c: Chat }) {
  return (
    <figure className="mx-auto flex w-full max-w-[340px] flex-col gap-4">
      <div className="rounded-[34px] border border-[#2c2b28] bg-[#121210] p-2.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="overflow-hidden rounded-[26px] bg-[#0b141a]">
          <div className="flex items-center gap-3 bg-[#1f2c33] px-4 py-3">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dir-papel)] text-[13px] font-semibold text-[var(--dir-tinta)] [font-family:var(--fuente-micro)]">
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
      <figcaption className="dir-dato text-center text-[var(--dir-sobre-tinta-suave)]">
        {c.pie}
        <span className="sr-only"> {c.resumen}</span>
      </figcaption>
    </figure>
  );
}

type Panel = (typeof TEXTOS_PORTADA)["es"]["mientras"]["panel"];
type Correo = (typeof TEXTOS_PORTADA)["es"]["mientras"]["mail"];

/** El panel de muestra: una hoja fina sobre la tela, con hilos entre filas. */
function PanelMuestra({ p }: { p: Panel }) {
  return (
    <figure className="flex flex-col gap-4 border border-[var(--dir-hilo-tinta)] p-6 sm:p-8">
      <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{p.etiqueta}</span>
      <span className="dir-titular text-[24px] leading-[1.15]">{p.titulo}</span>
      <div className="dir-dato flex justify-between text-[var(--dir-sobre-tinta-suave)]">
        <span>{p.respuestas}</span>
        <span>{p.voz}</span>
      </div>
      <ul className="flex flex-col divide-y divide-[var(--dir-hilo-tinta)]">
        {p.filas.map((f) => (
          <li key={f.texto} className="flex items-center gap-3 py-3">
            <span aria-hidden className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[var(--dir-hilo-tinta)] text-[10px]">
              ▶
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px]">{f.texto}</span>
            <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{f.dur}</span>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">{p.resumen}</figcaption>
    </figure>
  );
}

/** El correo de aviso, como una carta: hoja de algodón con los bordes cortados. */
function CorreoMuestra({ m }: { m: Correo }) {
  return (
    <figure className="dir-carta sm:ml-10">
      <div className="dir-carta-hoja flex flex-col gap-2">
        <span className="dir-dato text-[var(--dir-carta-suave)]">
          <span className="text-[#1f1d19]">{m.remitente}</span> · {m.cuando}
        </span>
        <span className="dir-titular text-[21px] leading-[1.2]">{m.asunto}</span>
        <p className="text-[15px] leading-[1.6] text-[#4a463f]">{m.cuerpo}</p>
        <span className="dir-dato text-[#1f1d19] underline underline-offset-4">{m.enlace}</span>
        <figcaption className="sr-only">{m.resumen}</figcaption>
      </div>
    </figure>
  );
}

/* Íconos de línea fina, del mismo trazo que los dibujos. */

function Svg({ children, className = "h-[18px] w-[18px]" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function IconoNfc() {
  return (
    <Svg className="h-[22px] w-[22px]">
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.5h2M19.5 8.5a5 5 0 0 1 0 7M21.8 6.3a8.2 8.2 0 0 1 0 11.4" />
    </Svg>
  );
}

function IconoRegalo() {
  return (
    <Svg className="h-[24px] w-[24px] flex-none">
      <rect x="3.5" y="8.5" width="17" height="12" rx="1.5" />
      <path d="M12 8.5v12M3.5 12.5h17M12 8.5c-1.5-3.5-5.5-3.5-5.5-1.5S9.5 8.5 12 8.5zM12 8.5c1.5-3.5 5.5-3.5 5.5-1.5S14.5 8.5 12 8.5z" />
    </Svg>
  );
}

function IconoAvion() {
  return (
    <Svg className="h-[16px] w-[16px]">
      <path d="M10.5 13.5L3 11l1.5-1.5 7.5 1 4.5-4.5a2 2 0 0 1 3 3L15 13.5l1 7.5-1.5 1.5-2.5-7.5" />
    </Svg>
  );
}
