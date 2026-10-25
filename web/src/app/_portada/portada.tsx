import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Acordeon } from "../_ui/acordeon";
import { Cabecera, IconoWhatsApp, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { LinkRegalarLanding } from "../link-regalar";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { catalogo } from "@/lib/productos";
import { datosEstructurados } from "@/lib/seo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { Coreografia } from "../_direccion/coreografia";
import { DibujoAudio, DibujoLibreta, DibujoLibro } from "../_direccion/dibujos";
import { Libro3D } from "../_direccion/libro-3d";
import { Foto, ListaHilo, OndaQuieta, Palabras, conVar } from "../_direccion/piezas";
import { DemoMarco } from "./demo-marco";
// Una sola hoja de estilo para la portada: portada.css trae adentro
// direccion.css y los tokens (cada archivo CSS aparte es un pedido más que
// frena el primer pintado).
import "./portada.css";

// La portada (/, /ar, /ca): la maqueta que aprobó Naza el 15/10, con las
// correcciones de su amigo y el brief de Remento. La estética es la de «la web
// es un libro» (tinta y papel que se alternan, letra enorme, el logo que se
// dibuja a lápiz, el libro de Osvaldo en 3D, la carta sobre la vidriera).
//
// Orden: 1 inicio (con el libro 3D) → 2 qué es (con el teléfono y la página
// de su historia) → 3 cómo funciona (4 pasos) → 4 la carta → 5 escúchalo → 6
// el libro (el ÚNICO precio, el del impreso) → 7 marcos → 8 regalo → 9
// preguntas y «¿Te queda alguna duda?» → 10 cierre y pie. Los textos, todos en
// _textos/portada.ts (docs/rediseno-2026-10/amigo/textos.md); ninguno acá.
//
// Capas (regla de Naza, 15/10): una hoja solo tapa a la anterior cuando lo
// que se estaba leyendo ya pasó. El inicio es la única capa ([data-capa]): se
// fija cuando su final llega al borde de abajo de la pantalla y ahí sube «Qué
// es» y lo tapa. Las demás bajan con la página, cada una con su borde.
//
// El precio: UNO solo, el del libro impreso con el PDF (PRECIO_EUR/ARS +
// PRECIO_IMPRESO_EUR/ARS, leídos al construir). Sin impreso en la región no se
// muestra ningún número (nunca «desde»), ni la barra fija del móvil.
//
// Es ESTÁTICA: no lee headers ni cookies. Movimiento: CSS más lo poco que
// corre en el navegador (_direccion/coreografia.tsx); todo falla hacia
// visible (sin JS o con «menos movimiento», quieto y completo).

// Las fotos son personas generadas (PENDIENTES B10): ilustran, nunca se
// presentan como familias reales ni junto a opiniones.
const FOTOS = {
  vidriera: "/rediseno/vidriera-vitacora.jpg",
  guitarra: "/rediseno/osvaldo-guitarra.jpg",
  portada: "/rediseno/libro-osvaldo-portada.jpg",
  contraportada: "/rediseno/libro-osvaldo-contraportada.jpg",
  marco: "/rediseno/marco-en-casa.jpg",
  abuelo: "/rediseno/para-tu-abuelo.jpg",
} as const;

const DIBUJOS = [DibujoLibreta, DibujoAudio, DibujoLibro] as const;

export function Portada({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA[idioma];
  const ej = TEXTOS_EJEMPLO[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  // El libro impreso con el PDF: la base más el primer impreso.
  const precioLibro = cat.impreso ? formatear(cat.base.precio + cat.impreso.precio) : null;
  const precioMarco = cat.marco ? formatear(cat.marco.precio) : null;
  // Los datos estructurados (schema.org) de esta portada: la marca y los dos
  // productos con su precio, del mismo catálogo de arriba (lib/seo.ts).
  const jsonLd = datosEstructurados(idioma, { libro: FOTOS.portada, marco: FOTOS.marco });
  const comprar = ruta(idioma, "/comprar");
  const whatsapp = urlWhatsAppDudas();
  // El teléfono: la página de su historia de verdad, con datos inventados.
  // El panel existe en es y ar; el catalán muestra la de España.
  const telefono = idioma === "ar" ? "/ar/telefono-historia" : "/telefono-historia";
  const [paso1, paso2, paso3, paso4] = t.funciona.pasos;
  const nFrase = t.carta.frase.split(" ").length;

  // Las preguntas aprobadas, con la primera cambiada (29) y las dos nuevas
  // (27 y 28) al final.
  const preguntas = [{ ...t.faq.preguntas[0], pregunta: t.preguntas.usarlo }, ...t.faq.preguntas.slice(1), ...t.preguntas.nuevas];

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Coreografia />

      {/* ═══ 1 · INICIO, sobre tinta. Capa: queda fija detrás cuando termina. ═══ */}
      <section data-capa className="dir-tinta relative z-[1]">
        {/* El aire de abajo (40svh) es para que las ventajas y el enlace al ejemplo
            lleguen al medio de la pantalla antes de que suba «Qué es»: el papel
            tapa primero ese vacío (revisión del 25/10, A5). */}
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center px-4 pb-[40svh] pt-32 text-center sm:px-8 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino="/" sobreHero />
          </div>
          <LogoTrazo id="trazo-portada" halo="var(--dir-tinta)" className="w-[124px] sm:w-[180px]" />

          <h1 className="dir-titular dir-t1 dir-asienta mt-7 max-w-[13ch] sm:mt-9 sm:max-w-none">
            {t.hero.titulo[0]} <br className="hidden sm:block" />
            {t.hero.titulo[1]}
          </h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {t.inicio.bajada}
          </p>

          {/* El libro de Osvaldo: gira y se abre cuando está entero en el medio
              de la pantalla (Coreografia, data-libro-3d); tocarlo lo repite. */}
          <div data-libro-3d className="l3-seccion prt-libro dir-entra mt-10 w-full sm:mt-12" style={conVar({ "--e": "0.85s" })}>
            <Libro3D idioma={idioma} b={t.direccion.libro} c={ej.libro} />
          </div>

          <div
            className="dir-entra mt-10 flex w-full max-w-[358px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4"
            style={conVar({ "--e": "0.95s" })}
          >
            <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno">
              {t.iniciar}
            </Link>
            <a href="#como-funciona" className="dir-boton dir-boton--hilo">
              {t.inicio.comoFunciona}
            </a>
          </div>

          {/* El camino a /ejemplo, que la portada no tenía (revisión del 25/10). */}
          <Link prefetch={false} href={ruta(idioma, "/ejemplo")} className="dir-enlace dir-entra mt-7 text-[15px]" style={conVar({ "--e": "1s" })}>
            {t.verEjemplo} <span aria-hidden>→</span>
          </Link>

          <ul className="prt-ventajas dir-entra mt-10" style={conVar({ "--e": "1.05s" })}>
            {t.inicio.ventajas.map((v) => (
              <li key={v}>
                <Tilde />
                <span>{v}</span>
              </li>
            ))}
          </ul>

          <p className="prt-propio dir-entra mt-10" style={conVar({ "--e": "1.15s" })}>
            {t.inicio.propio.pregunta}{" "}
            <Link prefetch={false} href={comprar} className="dir-enlace">
              {t.inicio.propio.enlace}
            </Link>
          </p>
        </div>
      </section>
      {/* La barra de compra del teléfono aparece cuando esto sale de pantalla
          (el inicio es una capa fija: no sirve de referencia). */}
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* ═══ 2 · QUÉ ES, hoja de papel que sube y tapa el inicio ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-sobre-1 relative z-[2] -mt-px">
        <div className="mx-auto max-w-[1360px] px-4 pb-24 pt-24 sm:px-8 md:pb-32 md:pt-36 lg:px-12">
          <div className="aparece flex flex-col gap-6">
            <span className="dir-micro prt-etiqueta">{t.queEs.etiqueta}</span>
            <h2 className="dir-titular dir-t3 max-w-[18ch]">{t.queEs.titulo}</h2>
            <p className="dir-parrafo max-w-[44ch]">{t.queEs.bajada}</p>
          </div>

          {/* Menos aire arriba en la compu: entre el título y el teléfono quedaba media hoja vacía (revisión del 25/10, A10). */}
          <div className="mt-20 grid grid-cols-1 items-center gap-16 border-t border-[var(--dir-hilo-papel)] pt-16 md:mt-14 md:grid-cols-12 md:gap-8 md:pt-12">
            <div className="aparece flex flex-col gap-8 md:col-span-6">
              <h3 className="dir-titular dir-t4">{t.siguiendo.titulo}</h3>
              <ol className="prt-pasos">
                {t.siguiendo.pasos.map((paso, i) => (
                  <li key={paso}>
                    <span aria-hidden className="prt-paso-num">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>
            </div>
            <figure className="aparece flex flex-col items-center gap-6 md:col-span-5 md:col-start-8">
              <div className="prt-movil">
                <div className="prt-pantalla">
                  {/* El panel de verdad con datos inventados, en su propia
                      página de 390 px (_portada/panel-telefono.tsx). */}
                  <iframe src={telefono} title={t.pieTelefono} loading="lazy" tabIndex={-1} aria-hidden />
                </div>
              </div>
              <figcaption className="dir-pie text-center text-[var(--dir-sobre-papel-suave)]">{t.pieTelefono}</figcaption>
            </figure>
          </div>

          {/* Cómo cuidamos lo que cuenta (Naza, 25/10): solo lo que ya dice la política de privacidad. */}
          <div className="aparece mt-20 grid grid-cols-1 gap-6 border-t border-[var(--dir-hilo-papel)] pt-14 md:mt-24 md:grid-cols-12 md:gap-8 md:pt-16">
            <h3 className="dir-titular dir-t4 md:col-span-5">{t.privacidad.titulo}</h3>
            <div className="flex flex-col gap-5 md:col-span-6 md:col-start-7">
              <p className="dir-parrafo max-w-[52ch]">{t.privacidad.texto}</p>
              <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className="dir-enlace-papel self-start text-[15px]">
                {t.privacidad.enlace} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3 · CÓMO FUNCIONA, sobre tinta: el título queda quieto al costado
          (en la pantalla grande) y los tres primeros pasos pasan con su dibujo
          a lápiz. El cuarto, el que emociona, va aparte, con el libro. ═══ */}
      <section id="como-funciona" className="prt-como dir-tinta dir-hoja dir-diferido relative z-[3] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 pt-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:pt-36 lg:px-12">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-24">
              <h2 className="dir-titular dir-t2 aparece">{t.funciona.titulo}</h2>
              <p className="aparece mt-7 max-w-[32ch] text-[20px] font-light leading-[1.5] text-[var(--dir-sobre-tinta-suave)] sm:text-[23px]">
                {t.funciona.bajada}
              </p>
            </div>
          </div>
          <ol className="mt-14 md:col-span-6 md:col-start-7 md:mt-0">
            {[paso1, paso2, paso3].map((paso, i) => {
              const Dibujo = DIBUJOS[i];
              return (
                <li
                  key={paso.titulo}
                  data-revela
                  className="dir-momento flex flex-col gap-7 border-t border-[var(--dir-hilo-tinta)] py-12 md:min-h-[60vh] md:justify-center md:py-16"
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
                    <p className="max-w-[40ch] text-[18px] font-light leading-[1.6] text-[var(--dir-sobre-tinta-suave)] sm:text-[19px] lg:text-[21px]">
                      {paso.texto}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* El paso 4: a todo el ancho, con el libro de verdad en la mano. */}
        <div className="mx-auto max-w-[1360px] px-4 pb-24 sm:px-8 md:pb-36 lg:px-12">
          <div className="prt-paso-final grid grid-cols-1 items-center gap-12 pt-14 md:grid-cols-12 md:gap-8 md:pt-24">
            <div className="aparece flex justify-center md:col-span-5">
              <div className="prt-tapa">
                <Image src={FOTOS.portada} alt={t.libro.altPortada} width={376} height={520} sizes="(min-width: 768px) 300px, 62vw" />
              </div>
            </div>
            <div data-revela className="flex flex-col gap-6 md:col-span-6 md:col-start-7">
              <span aria-hidden className="dir-numero prt-numero-dorado">
                4
              </span>
              <span className="sr-only">{t.como.paso(4)}</span>
              <h3 className="dir-titular dir-t3 max-w-[14ch]">{paso4.titulo}</h3>
              <p className="dir-parrafo max-w-[38ch]">{paso4.texto}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4 · LA CARTA de los fundadores, sobre la vidriera ═══ */}
      <section className="dir-tinta dir-hoja dir-diferido relative z-[4] overflow-hidden">
        <div aria-hidden className="dir-carta-fondo pointer-events-none absolute inset-0">
          <Image src={FOTOS.vidriera} alt="" fill sizes="100vw" quality={60} className="object-cover object-[46%_45%]" />
        </div>
        <div className="relative mx-auto max-w-[1360px] px-4 pb-28 pt-28 sm:px-8 md:pb-40 md:pt-40 lg:px-12">
          <h2 data-revela className="dir-titular dir-t15 max-w-[17ch]" style={conVar({ "--paso": "0.11s" })}>
            <span className="sr-only">{t.carta.frase}</span>
            <span aria-hidden>
              <Palabras texto={t.carta.frase} total={nFrase} />
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
                <p className="dir-carta-texto">{t.carta.texto}</p>
                <footer data-revela className="mt-10 flex flex-col gap-1">
                  <span className="dir-firma">{t.carta.firma}</span>
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
                </footer>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ═══ 5 · ESCÚCHALO, en papel: el fragmento de su voz con la cita y la
          contratapa con el QR ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[5]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 pb-24 pt-28 sm:px-8 md:grid-cols-12 md:gap-8 md:pb-36 md:pt-40 lg:px-12">
          <div className="flex flex-col gap-10 md:col-span-7">
            <div className="aparece flex flex-col gap-6">
              <h2 className="dir-titular dir-t3 max-w-[16ch]">{t.escuchalo.titulo}</h2>
              <p className="dir-parrafo max-w-[44ch]">{t.escuchalo.texto}</p>
            </div>
            <figure className="aparece flex flex-col gap-8 border-t border-[var(--dir-hilo-papel)] pt-10">
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.escuchalo.etiqueta}</span>
              <blockquote className="dir-cita prt-cita">{t.escuchalo.cita}</blockquote>
              <div className="dir-sobre-papel-onda max-w-[560px]">
                {/* Quieta, sin reproducir (Naza, 25/10): alcanza con que se entienda que es la frase de alguien. */}
                <OndaQuieta duracion={t.escuchalo.duracion} conPlay={false} />
              </div>
            </figure>
          </div>
          <div className="aparece flex justify-center md:col-span-4 md:col-start-9">
            <div className="prt-contra">
              <Image src={FOTOS.contraportada} alt={t.voz.altContraportada} width={378} height={520} sizes="(min-width: 768px) 320px, 66vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6 · EL LIBRO, sobre tinta: los tres beneficios, qué incluye y el
          único precio, con la tapa y la contratapa de Osvaldo. Tiene su propio
          botón (data-cta-propio): la barra del teléfono se esconde acá. ═══ */}
      <section data-cta-propio className="dir-tinta dir-hoja dir-diferido relative z-[6]">
        <div className="mx-auto max-w-[1360px] px-4 py-28 sm:px-8 md:py-40 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-12 md:gap-8">
            <h2 className="dir-titular dir-t2 aparece max-w-[14ch] md:col-span-6">{t.elLibro.titulo}</h2>
            <div className="aparece prt-par flex justify-center md:col-span-5 md:col-start-8">
              <div className="prt-par-tapa">
                <Image src={FOTOS.portada} alt={t.libro.altPortada} width={376} height={520} sizes="(min-width: 768px) 220px, 44vw" />
              </div>
              <div className="prt-par-contra">
                <Image src={FOTOS.contraportada} alt={t.voz.altContraportada} width={378} height={520} sizes="(min-width: 768px) 220px, 44vw" />
              </div>
            </div>
          </div>

          <ul className="mt-20 grid grid-cols-1 gap-10 border-t border-[var(--dir-hilo-tinta)] pt-12 md:mt-28 md:grid-cols-3 md:gap-8 md:pt-16">
            {t.elLibro.beneficios.map((b) => (
              <li key={b.titulo} className="aparece flex flex-col gap-3">
                <span className="dir-titular prt-dorado text-[30px] leading-[1.1] sm:text-[36px]">{b.titulo}</span>
                <span className="max-w-[34ch] text-[18px] font-light leading-[1.6] text-[var(--dir-sobre-tinta-suave)]">{b.texto}</span>
              </li>
            ))}
          </ul>

          <div className="mt-20 grid grid-cols-1 items-end gap-14 border-t border-[var(--dir-hilo-tinta)] pt-12 md:mt-28 md:grid-cols-12 md:gap-8 md:pt-16">
            <div className="aparece md:col-span-6">
              <ListaHilo items={t.elLibro.incluye} tinta />
            </div>
            <div className="aparece flex flex-col gap-6 md:col-span-5 md:col-start-8">
              {precioLibro ? (
                <p className="flex flex-col gap-3">
                  <span className="dir-precio">{precioLibro}</span>
                  <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{t.elLibro.pagoUnico}</span>
                </p>
              ) : null}
              <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno w-full max-w-[358px] sm:w-auto sm:self-start">
                {t.iniciar}
              </Link>
              <Link prefetch={false} href={ruta(idioma, "/ejemplo")} className="dir-enlace self-start text-[15px]">
                {t.verEjemplo} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 7 · MARCOS, en papel: la demo del marco con chip ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[7]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-6">
            <h2 className="dir-titular dir-t3 max-w-[16ch]">{t.marcos.titulo}</h2>
            <p className="dir-parrafo max-w-[42ch]">{t.marcos.texto(precioMarco)}</p>
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

      {/* ═══ 8 · REGALO, sobre tinta: el abuelo con la tarjeta ═══ */}
      <section className="dir-tinta dir-hoja dir-diferido relative z-[8]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <Foto
            src={FOTOS.abuelo}
            alt={t.diciembre.altFoto}
            forma="arco"
            sizes="(min-width: 768px) 34vw, 78vw"
            className="w-[78%] md:col-span-4 md:w-full"
          />
          <div className="aparece flex flex-col gap-6 md:col-span-7 md:col-start-6">
            <h2 className="dir-titular dir-t3 max-w-[16ch]">{t.regalo.titulo}</h2>
            <p className="dir-parrafo max-w-[42ch]">{t.regalo.texto}</p>
            {/* El camino a /regalar que ya tenía la portada (texto aprobado el 11/10). */}
            <LinkRegalarLanding idioma={idioma} className="dir-enlace self-start" />
          </div>
        </div>
      </section>

      {/* ═══ 9 · PREGUNTAS, en papel (la garantía vive acá y solo acá,
          DECISIONES D1); «¿Te queda alguna duda?» va DESPUÉS ═══ */}
      <section id="preguntas" className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[9] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-12 px-4 pb-28 pt-28 sm:px-8 md:grid-cols-12 md:gap-8 md:pb-40 md:pt-40 lg:px-12">
          <div className="aparece md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.faq.titulo}</h2>
          </div>
          <div className="aparece flex flex-col gap-14 md:col-span-7 md:col-start-6">
            <div className="border-t border-[var(--dir-hilo-papel)]">
              {preguntas.map((q, i) => (
                <Fragment key={q.pregunta}>
                  <Acordeon pregunta={q.pregunta} abierta={i === 0} grupo="preguntas">
                    {q.respuesta}
                  </Acordeon>
                  {/* «No le gusta hablar de sí mismo», después de la segunda (15/10). */}
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
            {whatsapp ? (
              <div className="flex flex-col gap-3">
                <span className="dir-pie">{t.faq.duda.titulo}</span>
                <p className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)]">{t.faq.duda.texto}</p>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--tinta self-start">
                  <IconoWhatsApp className="mr-2 h-4 w-4" />
                  {t.faq.duda.boton}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ═══ 10 · CIERRE: el lema grande y el botón; abajo, el pie ═══ */}
      <section data-cta-propio className="dir-tinta dir-hoja dir-diferido relative z-[10]">
        <div className="flex flex-col items-center px-4 pb-28 pt-28 text-center sm:px-8 md:pb-40 md:pt-40">
          <LogoTrazo id="trazo-cierre" modo="scroll" halo="var(--dir-tinta)" className="w-[120px] sm:w-[150px]" />
          <h2 className="dir-titular dir-t2 aparece mt-14 max-w-[14ch]">{t.lema}</h2>
          <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno aparece mt-11 w-full max-w-[358px] sm:w-auto">
            {t.iniciar}
          </Link>
        </div>
        <Pie idioma={idioma} camino="/" rasca />
      </section>

      <WhatsAppFlotante idioma={idioma} />
      {/* La barra fija del móvil: el mismo precio del libro (el impreso), sin
          «desde». Sin impreso en la región no hay precio que mostrar: no va. */}
      {precioLibro ? (
        <CtaSticky
          precio={precioLibro}
          href={comprar}
          textos={{ desde: "", conImpreso: t.elLibro.pagoUnico, sinImpreso: t.elLibro.pagoUnico, boton: t.iniciar }}
        />
      ) : null}
    </div>
  );
}

/** Un tilde fino, como hecho a lápiz. */
function Tilde() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="prt-tilde" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8.6c1.3 1 2.3 2.2 3.2 3.6C7.6 8.4 10.2 5.3 13.6 3" />
    </svg>
  );
}
