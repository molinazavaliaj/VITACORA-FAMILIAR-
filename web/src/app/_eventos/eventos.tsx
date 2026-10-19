import Image from "next/image";
import Link from "next/link";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
import { Coreografia } from "../_direccion/coreografia";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { DibujoAudio, DibujoLibreta, DibujoLibro } from "../_direccion/dibujos";
import { conVar } from "../_direccion/piezas";
import { TEXTOS_EVENTOS } from "../_textos/eventos";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { CONTACTO } from "../legal/titulares";
import { TIPOS_EVENTO } from "@/lib/eventos";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { FormularioEventos } from "./formulario";
import "../_portada/portada.css";
import "./eventos.css";

// /eventos, /ca/eventos y /ar/eventos: Vitácora Eventos (17/10). Vamos al
// evento (boda, cumpleaños, show…), entrevistamos a los invitados y hacemos el
// libro impreso. No se compra en la web: es un «cuéntanos tu evento» que llega
// por mail a los socios (api/eventos).
//
// Con la estética de la portada nueva (16/10, amigo + Remento) y sus mismas
// piezas: el inicio centrado con el logo que se dibuja, los dos botones y los
// tildes; la hoja de papel con el borde cortado (dir-deckle); «Cómo funciona»
// en tinta con el número grande y el dibujo a lápiz de cada paso; el cierre
// con el logo y el lema. Orden: 1 inicio, 2 qué es y para qué celebraciones,
// 3 cómo funciona, 4 el formulario (papel), 5 cierre y pie. Dos fotos hechas
// con IA: el rincón de Vitácora en un casamiento y la carpa negra (no hay de un evento real
// todavía). Estática.

const CAMINO = "/eventos";
const FOTO_STAND = "/rediseno/eventos-casamiento-stand.jpg";
const FOTO_CARPA = "/rediseno/eventos-carpa-negra.jpg";
const DIBUJOS = [DibujoLibreta, DibujoAudio, DibujoLibro] as const;

export function Eventos({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_EVENTOS[idioma];
  const lema = TEXTOS_PUBLICO[idioma].lema;
  const whatsapp = urlWhatsAppDudas();

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada evt flex flex-1 flex-col">
      <Coreografia />

      {/* ═══ 1 · INICIO, sobre tinta. Capa: queda fija detrás cuando termina. ═══ */}
      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 pt-32 text-center sm:px-8 sm:pb-20 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino={CAMINO} producto="eventos" sobreHero />
          </div>
          <LogoTrazo id="trazo-eventos" halo="var(--dir-tinta)" className="w-[124px] sm:w-[180px]" />
          <span className="dir-micro prt-etiqueta mt-8">{t.etiqueta}</span>
          <h1 className="dir-titular dir-t1 dir-asienta mt-5 max-w-[14ch] sm:max-w-none">
            {t.titulo[0]} <br className="hidden sm:block" />
            {t.titulo[1]}
          </h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {t.bajada}
          </p>

          <div
            className="dir-entra mt-10 flex w-full max-w-[358px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4"
            style={conVar({ "--e": "0.85s" })}
          >
            <a href="#contacto" className="dir-boton dir-boton--lleno">
              {t.irAlFormulario}
            </a>
            <a href="#como-funciona" className="dir-boton dir-boton--hilo">
              {t.verComo}
            </a>
          </div>

          <ul className="prt-ventajas dir-entra mt-10" style={conVar({ "--e": "0.95s" })}>
            {t.ventajas.map((v) => (
              <li key={v}>
                <Tilde />
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ═══ 2 · QUÉ ES y PARA QUÉ CELEBRACIONES, hoja de papel que sube ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-sobre-1 relative z-[2] -mt-px">
        <div className="mx-auto max-w-[1360px] px-4 pb-24 pt-24 sm:px-8 md:pb-32 md:pt-36 lg:px-12">
          <div className="aparece flex flex-col gap-6">
            <span className="dir-micro prt-etiqueta">{t.queEs.etiqueta}</span>
            <h2 className="dir-titular dir-t3 max-w-[18ch]">{t.queEs.titulo}</h2>
            <p className="dir-parrafo max-w-[44ch]">{t.queEs.bajada}</p>
          </div>

          {/* La foto del rincón en un casamiento (Higgsfield, 17/10; Naza la
              eligió en color). Gente inventada: ningún narrador real. */}
          <figure className="aparece evt-foto mt-16 md:mt-20">
            <Image src={FOTO_STAND} alt={t.queEs.altFoto} width={1920} height={1288} sizes="(min-width: 1360px) 1264px, 92vw" />
          </figure>

          <div className="mt-20 grid grid-cols-1 items-center gap-12 border-t border-[var(--dir-hilo-papel)] pt-16 md:mt-28 md:grid-cols-12 md:gap-8 md:pt-24">
            <div className="aparece md:col-span-6">
              <h3 className="dir-titular dir-t4">{t.tipos.titulo}</h3>
              <ul className="mt-8 flex flex-wrap gap-3">
                {TIPOS_EVENTO.filter((tipo) => tipo !== "otro").map((tipo) => (
                  <li key={tipo} className="evt-tipo">{t.tipo[tipo]}</li>
                ))}
              </ul>
              <p className="dir-parrafo mt-8">{t.tipos.pie}</p>
            </div>
            {/* La carpa negra con un solo logo (IA, 17/10; Naza: «con onda,
                tampoco tanto»). Mediana: el archivo es de 1024 px. */}
            <figure className="aparece evt-foto md:col-span-6">
              <Image src={FOTO_CARPA} alt={t.tipos.altFoto} width={1024} height={688} sizes="(min-width: 768px) 46vw, 92vw" />
            </figure>
          </div>
        </div>
      </section>

      {/* ═══ 3 · CÓMO FUNCIONA, sobre tinta: el título queda quieto al costado
          y los tres pasos pasan con su dibujo a lápiz, como en la portada. ═══ */}
      <section id="como-funciona" className="prt-como dir-tinta dir-hoja dir-diferido relative z-[3] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 pb-24 pt-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:pb-36 md:pt-36 lg:px-12">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-24">
              <h2 className="dir-titular dir-t2 aparece">{t.como.titulo}</h2>
              <p className="aparece mt-7 max-w-[32ch] text-[20px] font-light leading-[1.5] text-[var(--dir-sobre-tinta-suave)] sm:text-[23px]">
                {t.como.bajada}
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
                  className="dir-momento flex flex-col gap-7 border-t border-[var(--dir-hilo-tinta)] py-12 md:min-h-[50vh] md:justify-center md:py-16"
                >
                  <div className="flex items-end justify-between gap-6">
                    <span aria-hidden className={`dir-numero ${i === 2 ? "prt-numero-dorado" : ""}`}>
                      {i + 1}
                    </span>
                    {Dibujo ? <Dibujo /> : null}
                  </div>
                  <div className="flex flex-col gap-4">
                    <span className="sr-only">{`${t.como.paso} ${i + 1}`}</span>
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
      </section>

      {/* ═══ 4 · EL FORMULARIO, en una hoja de papel ═══ */}
      <section id="contacto" className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[4] scroll-mt-4">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-12 px-4 pb-24 pt-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:pb-32 md:pt-36 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.formulario.titulo}</h2>
            <p className="dir-parrafo">{t.formulario.bajada}</p>
            <div className="mt-2 flex flex-col items-start gap-3">
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--tinta">
                  {t.formulario.whatsapp}
                </a>
              ) : null}
              <a href={`mailto:${CONTACTO.hola}`} className="dir-enlace-papel">{CONTACTO.hola}</a>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <FormularioEventos idioma={idioma} correo={CONTACTO.hola} />
            <p className="evt-privacidad">
              {t.formulario.privacidad}{" "}
              <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className="underline underline-offset-4">
                {t.formulario.privacidadEnlace}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 5 · CIERRE: el logo y el lema, como la portada; abajo, el pie ═══ */}
      <section className="dir-tinta dir-hoja dir-diferido relative z-[5]">
        <div className="flex flex-col items-center px-4 pb-28 pt-28 text-center sm:px-8 md:pb-40 md:pt-40">
          <LogoTrazo id="trazo-eventos-cierre" modo="scroll" halo="var(--dir-tinta)" className="w-[120px] sm:w-[150px]" />
          <h2 className="dir-titular dir-t2 aparece mt-14 max-w-[14ch]">{lema}</h2>
          <a href="#contacto" className="dir-boton dir-boton--lleno aparece mt-11 w-full max-w-[358px] sm:w-auto">
            {t.irAlFormulario}
          </a>
        </div>
        <Pie idioma={idioma} camino={CAMINO} />
      </section>

      <WhatsAppFlotante idioma={idioma} />
    </div>
  );
}

/** Un tilde fino, como hecho a lápiz (el mismo de la portada). */
function Tilde() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="prt-tilde" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8.6c1.3 1 2.3 2.2 3.2 3.6C7.6 8.4 10.2 5.3 13.6 3" />
    </svg>
  );
}
