import Link from "next/link";
import { Cabecera, Pie } from "../_publico";
import { Coreografia } from "../_direccion/coreografia";
import { TEXTOS_EVENTOS } from "../_textos/eventos";
import { CONTACTO } from "../legal/titulares";
import { TIPOS_EVENTO } from "@/lib/eventos";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { FormularioEventos } from "./formulario";
import "../_direccion/direccion.css";
import "./eventos.css";

// /eventos, /ca/eventos y /ar/eventos: Vitácora Eventos (17/10). Vamos al
// evento (boda, cumpleaños, show…), entrevistamos a los invitados y hacemos el
// libro impreso. No se compra en la web: es un «cuéntanos tu evento» que llega
// por mail a los socios (api/eventos).
//
// Mismas superficies que /opiniones y la portada (dir-tinta, dir-papel,
// dir-hoja y las capas): 1 inicio en tinta (la única capa, fija), 2 cómo
// funciona y para qué celebraciones en papel, 3 el formulario en tinta con el
// pie. Sin fotos: todavía no hay ninguna de un evento real. Estática.

const CAMINO = "/eventos";

export function Eventos({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_EVENTOS[idioma];
  const whatsapp = urlWhatsAppDudas();

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina evt flex flex-1 flex-col">
      <Coreografia />

      {/* ═══ 1 · INICIO, sobre tinta ═══ */}
      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative">
          <Cabecera idioma={idioma} camino={CAMINO} producto="eventos" sobreHero />
          <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-8 px-4 pb-24 pt-12 sm:px-8 md:grid-cols-12 md:items-end md:gap-12 md:pb-32 md:pt-20 lg:px-12">
            <div className="flex flex-col gap-5 md:col-span-8">
              <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.etiqueta}</span>
              <h1 className="dir-titular evt-titulo">
                <span className="block">{t.titulo[0]}</span>
                <em className="block">{t.titulo[1]}</em>
              </h1>
            </div>
            <div className="flex flex-col items-start gap-8 md:col-span-4">
              <p className="evt-bajada">{t.bajada}</p>
              <a href="#contacto" className="dir-boton dir-boton--lleno w-full max-w-[358px] sm:w-auto">
                {t.irAlFormulario}
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="contents">
        {/* ═══ 2 · CÓMO FUNCIONA y PARA QUÉ CELEBRACIONES, sobre papel ═══ */}
        <section className="dir-papel dir-hoja dir-sobre-1 relative" style={{ zIndex: 2 }}>
          <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-32 lg:px-12">
            <h2 className="dir-titular dir-t3 md:col-span-5">{t.como.titulo}</h2>
            <ol className="evt-pasos md:col-span-6 md:col-start-7">
              {t.como.pasos.map((p, i) => (
                <li key={p.titulo}>
                  <span aria-hidden className="evt-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <span className="sr-only">{`${t.como.paso} ${i + 1}. `}</span>
                    <h3 className="evt-paso-titulo">{p.titulo}</h3>
                    <p className="dir-parrafo mt-2">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="md:col-span-12">
              <h2 className="dir-titular dir-t4">{t.tipos.titulo}</h2>
              <ul className="mt-8 flex flex-wrap gap-3">
                {TIPOS_EVENTO.filter((tipo) => tipo !== "otro").map((tipo) => (
                  <li key={tipo} className="evt-tipo">{t.tipo[tipo]}</li>
                ))}
              </ul>
              <p className="dir-parrafo mt-6">{t.tipos.pie}</p>
            </div>
          </div>
        </section>

        {/* ═══ 3 · EL FORMULARIO, sobre tinta ═══ */}
        <section id="contacto" className="dir-tinta dir-hoja dir-diferido relative scroll-mt-4" style={{ zIndex: 3 }}>
          <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-12 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-32 lg:px-12">
            <div className="flex flex-col gap-5 md:col-span-4">
              <h2 className="dir-titular dir-t3">{t.formulario.titulo}</h2>
              <p className="dir-parrafo">{t.formulario.bajada}</p>
              <div className="mt-4 flex flex-col gap-3 text-[14px] [font-family:var(--fuente-micro)]">
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="evt-enlace">
                    {t.formulario.whatsapp}
                  </a>
                ) : null}
                <a href={`mailto:${CONTACTO.hola}`} className="evt-enlace">{CONTACTO.hola}</a>
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
          <Pie idioma={idioma} camino={CAMINO} />
        </section>
      </main>
    </div>
  );
}
