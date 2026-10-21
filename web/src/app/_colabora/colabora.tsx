import Link from "next/link";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
import { Coreografia } from "../_direccion/coreografia";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { DibujoAudio, DibujoLibreta, DibujoLibro } from "../_direccion/dibujos";
import { conVar } from "../_direccion/piezas";
import { TEXTOS_COLABORA } from "../_textos/colabora";
import { CONTACTO } from "../legal/titulares";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { FormularioColabora } from "./formulario";
import "../_portada/portada.css";
import "../_eventos/eventos.css";

// /colabora, /ca/colabora y /ar/colabora: el programa de creadores (21/10).
// Los creadores se anotan solos y los socios los aprueban en /admin/creadores.
// Con la estética de /eventos (la portada nueva) y sus mismas piezas, en corto:
// 1 inicio sobre tinta con las cuatro ventajas, 2 cómo funciona con el número
// grande y el dibujo de cada paso, 3 el formulario en una hoja de papel, y el
// pie. Sin cifras fijas: la comisión y el descuento son de cada creador.
// Sin CREADORES=1 la página da 404 (los archivos finos). No va en el menú ni
// en el sitemap hasta que lo decida Naza.

const CAMINO = "/colabora";
const DIBUJOS = [DibujoLibreta, DibujoAudio, DibujoLibro] as const;

export function Colabora({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_COLABORA[idioma];
  const c = t.formulario.casilla;

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada evt flex flex-1 flex-col">
      <Coreografia />

      {/* ═══ 1 · INICIO, sobre tinta ═══ */}
      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 pt-32 text-center sm:px-8 sm:pb-20 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino={CAMINO} sobreHero />
          </div>
          <LogoTrazo id="trazo-colabora" halo="var(--dir-tinta)" className="w-[124px] sm:w-[180px]" />
          <span className="dir-micro prt-etiqueta mt-8">{t.etiqueta}</span>
          <h1 className="dir-titular dir-t1 dir-asienta mt-5 max-w-[14ch] sm:max-w-none">
            {t.titulo[0]} <br className="hidden sm:block" />
            {t.titulo[1]}
          </h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {t.bajada}
          </p>
          <div className="dir-entra mt-10 flex w-full max-w-[358px] flex-col sm:w-auto sm:max-w-none" style={conVar({ "--e": "0.85s" })}>
            <a href="#anotarme" className="dir-boton dir-boton--lleno">
              {t.irAlFormulario}
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

      {/* ═══ 2 · CÓMO FUNCIONA, sobre tinta ═══ */}
      <section id="como-funciona" className="prt-como dir-tinta dir-hoja dir-diferido relative z-[2] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 pb-24 pt-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:pb-32 md:pt-32 lg:px-12">
          <div className="md:col-span-5">
            <h2 className="dir-titular dir-t2 aparece md:sticky md:top-24">{t.como.titulo}</h2>
          </div>
          <ol className="mt-14 md:col-span-6 md:col-start-7 md:mt-0">
            {t.como.pasos.map((paso, i) => {
              const Dibujo = DIBUJOS[i];
              return (
                <li key={paso.titulo} data-revela className="dir-momento flex flex-col gap-7 border-t border-[var(--dir-hilo-tinta)] py-12 md:py-16">
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

      {/* ═══ 3 · EL FORMULARIO, en una hoja de papel ═══ */}
      <section id="anotarme" className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[3] scroll-mt-4">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-12 px-4 pb-24 pt-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:pb-32 md:pt-36 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.formulario.titulo}</h2>
            <p className="dir-parrafo">{t.formulario.bajada}</p>
            <a href={`mailto:${CONTACTO.hola}`} className="dir-enlace-papel">
              {CONTACTO.hola}
            </a>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <FormularioColabora
              idioma={idioma}
              correo={CONTACTO.hola}
              condiciones={
                <>
                  {c.antes}
                  <Link prefetch={false} href={ruta(idioma, "/legal/creadores")} target="_blank" className="underline underline-offset-4">
                    {c.condiciones}
                  </Link>
                  {c.medio}
                  <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} target="_blank" className="underline underline-offset-4">
                    {c.privacidad}
                  </Link>
                  {c.fin}
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="dir-tinta dir-hoja dir-diferido relative z-[4]">
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
