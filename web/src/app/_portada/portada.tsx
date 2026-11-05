import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Acordeon } from "../_ui/acordeon";
import { Cabecera, IconoWhatsApp, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { catalogo } from "@/lib/productos";
import { datosEstructurados } from "@/lib/seo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { Coreografia } from "../_direccion/coreografia";
import { Libro3D } from "../_direccion/libro-3d";
import { OndaQuieta, conVar } from "../_direccion/piezas";
import { Cajas } from "./cajas";
import { AudiosLibro } from "./audios-libro";
import { cajasPortada } from "./datos-cajas";
// Una sola hoja de estilo para la portada: portada.css trae adentro
// direccion.css, los tokens y la paleta Acuarela (cada archivo CSS aparte es un
// pedido más que frena el primer pintado).
import "./portada.css";

// La portada (/, /ar, /ca): la nueva del 05/11, con la tienda en la segunda
// pantalla y la paleta Acuarela (blanco cálido, rosa bordó y aqua).
//
// Orden: 1 inicio (el titular, el libro 3D que se abre y se cierra, y un botón)
// → 2 la tienda (las cajitas, cada una con sus precios) → 3 los audios que se
// vuelven capítulos → 4 los cuatro pasos → 5 se lee y se escucha → 6 privacidad
// → 7 preguntas y «¿Te queda alguna duda?» → 8 cierre y pie. Los textos, en
// _textos/portada-nueva.ts y _textos/portada.ts; ninguno acá.
//
// Capas (regla de Naza, 15/10): una hoja solo tapa a la anterior cuando lo
// que se estaba leyendo ya pasó. El inicio es la única capa ([data-capa]): la
// tienda sube y lo tapa. Las demás bajan con la página.
//
// Los precios: cada cajita lee los suyos del catálogo (datos-cajas.ts), leídos
// al construir; sin un precio esa fila no existe, y nunca dicen «desde». La
// barra fija del móvil lleva el del libro impreso, y sin impreso no va.
//
// Es ESTÁTICA: no lee headers ni cookies. Movimiento: CSS más lo poco que
// corre en el navegador (_direccion/coreografia.tsx); todo falla hacia
// visible (sin JS o con «menos movimiento», quieto y completo).

// Las fotos son personas generadas (PENDIENTES B10): ilustran, nunca se
// presentan como familias reales ni junto a opiniones.
const FOTOS = {
  portada: "/rediseno/juan-domingo-portada.jpg",
  regalo: "/rediseno/para-tu-abuelo.jpg",
  audio: "/rediseno/viaje-audio-hotel.jpg",
  familia: "/rediseno/familia-con-el-libro.jpg",
} as const;

const FOTOS_PASOS = [FOTOS.regalo, FOTOS.audio, null, FOTOS.familia] as const;
const CONTRAPORTADA = "/rediseno/juan-domingo-contraportada.jpg";

export function Portada({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA[idioma];
  const n = TEXTOS_PORTADA_NUEVA[idioma];
  const ej = TEXTOS_EJEMPLO[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (monto: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(monto);
  const precioLibro = cat.impreso ? formatear(cat.base.precio + cat.impreso.precio) : null;
  const jsonLd = datosEstructurados(idioma, { libro: FOTOS.portada });
  const comprar = ruta(idioma, "/comprar");
  const whatsapp = urlWhatsAppDudas();
  const cajas = cajasPortada(idioma, cat, formatear);
  const preguntas = [{ ...t.faq.preguntas[0], pregunta: t.preguntas.usarlo }, ...t.faq.preguntas.slice(1), ...t.preguntas.nuevas];

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Coreografia />

      {/* 1 · Inicio: una pantalla. Es la única capa: la tienda sube y lo tapa apenas se baja. */}
      <section data-capa className="acu-lavado relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-10 pt-24 text-center sm:px-8">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino="/" sobreHero />
          </div>
          <h1 className="dir-titular dir-t2 dir-asienta max-w-[13ch] sm:max-w-none">
            {t.hero.titulo[0]} <br className="hidden sm:block" />
            {t.hero.titulo[1]}
          </h1>
          <div data-libro-3d data-libro-cierra className="l3-seccion prt-libro acu-libro dir-entra mt-6 w-full" style={conVar({ "--e": "0.5s" })}>
            <Libro3D idioma={idioma} b={t.direccion.libro} c={ej.libro} />
          </div>
          <a href="#tienda" className="dir-boton dir-boton--lleno acu-boton dir-entra mt-4" style={conVar({ "--e": "0.7s" })}>
            {n.inicio.boton}
          </a>
        </div>
      </section>
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* 2 · La tienda */}
      <section id="tienda" className="acu-hoja-lisa dir-hoja dir-sobre-1 relative z-[2] -mt-px scroll-mt-0 px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3 mx-auto max-w-[20ch]">{n.tienda.titulo}</h2>
        <p className="acu-bajada mt-4">{n.tienda.bajada}</p>
        <Cajas idioma={idioma} cajas={cajas} whatsapp={whatsapp} />
        <ul className="acu-pie">
          {n.tienda.pie.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </section>

      {/* 3 · Los audios que se vuelven capítulos */}
      <section className="acu-hoja-banda relative z-[3] px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3 mx-auto max-w-[18ch]">{n.audios.titulo}</h2>
        <AudiosLibro capitulos={n.audios.capitulos} />
      </section>

      {/* 4 · Los cuatro pasos */}
      <section id="como-funciona" className="acu-hoja-lisa relative z-[4] scroll-mt-6 px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3">{n.pasos.titulo}</h2>
        <ol className="acu-pasos">
          {n.pasos.lista.map((paso, i) => {
            const foto = FOTOS_PASOS[i];
            return (
              <li key={paso.titulo} className="acu-paso">
                <div className="acu-paso-img">
                  {foto ? (
                    <Image src={foto} alt="" fill sizes="(min-width: 768px) 25vw, 90vw" />
                  ) : (
                    <div aria-hidden className="acu-pantallita">
                      <span>{n.pasos.ejemplo[0]}</span>
                      <span>{n.pasos.ejemplo[1]}</span>
                      <span>{n.pasos.agregar}</span>
                    </div>
                  )}
                </div>
                <small>{t.como.paso(i + 1)}</small>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 5 · Se lee y se escucha: quieta, sin reproducir (Naza, 25/10). La miniatura
          es la tapa real que anuncia el JSON-LD: la foto de la ficha tiene que estar en la página. */}
      <section className="acu-hoja-banda2 relative z-[5] px-4 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-[1040px] grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
            <Image src={FOTOS.familia} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            <div className="absolute bottom-3 right-3 flex w-[58%] items-end gap-[6%]">
              <div className="prt-fisico w-[47%]">
                <Image
                  src={FOTOS.portada}
                  alt={t.libro.altPortada}
                  width={760}
                  height={981}
                  sizes="(min-width: 768px) 140px, 28vw"
                  className="h-auto w-full shadow-lg"
                />
              </div>
              <div className="prt-fisico prt-fisico--espalda w-[47%]">
                <Image
                  src={CONTRAPORTADA}
                  alt={t.voz.altContraportada}
                  width={760}
                  height={981}
                  sizes="(min-width: 768px) 140px, 28vw"
                  className="h-auto w-full shadow-lg"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="dir-titular dir-t3">{n.voz.titulo}</h2>
            <p className="text-[17px] text-[var(--acu-suave)]">{n.voz.texto}</p>
            <div className="acu-onda max-w-[420px]"><OndaQuieta duracion={t.escuchalo.duracion} conPlay={false} /></div>
          </div>
        </div>
      </section>

      {/* 6 · Privacidad: no promete quién escucha hasta que el panel cambie. */}
      <section className="acu-hoja-lisa relative z-[6] px-4 pt-14 text-center sm:px-8">
        <div className="mx-auto flex max-w-[640px] flex-col items-center gap-3">
          <h2 className="dir-titular text-[28px]">{n.privacidad.titulo}</h2>
          <p className="text-[15px] text-[var(--acu-suave)]">{n.privacidad.texto}</p>
          <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className="text-[14px] font-semibold text-[var(--acu-bordo)] underline">
            {n.privacidad.enlace}
          </Link>
        </div>
      </section>

      {/* 7 · Preguntas: la garantía vive acá y solo acá (DECISIONES D1). dir-papel da
          las variables claras del acordeón; el fondo lo fija acuarela.css. */}
      <section id="preguntas" className="dir-papel acu-hoja-lisa relative z-[7] scroll-mt-6">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 px-4 py-14 sm:px-8 md:grid-cols-12 md:gap-8 md:py-20">
          <div className="md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.faq.titulo}</h2>
          </div>
          <div className="flex flex-col gap-12 md:col-span-7 md:col-start-6">
            <div className="border-t border-[var(--dir-hilo-papel)]">
              {preguntas.map((q, i) => (
                <Fragment key={q.pregunta}>
                  <Acordeon pregunta={q.pregunta} abierta={i === 0} grupo="preguntas">
                    {q.respuesta}
                  </Acordeon>
                  {i === 1 ? (
                    <Acordeon pregunta={t.dudas.hablar.pregunta} grupo="preguntas">
                      {t.dudas.hablar.texto}
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {t.dudas.hablar.temas.map((tema) => <li key={tema} className="dir-tema">{tema}</li>)}
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
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--lleno acu-boton self-start">
                  <IconoWhatsApp className="mr-2 h-4 w-4" />
                  {t.faq.duda.boton}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* 8 · Cierre */}
      <section data-cta-propio className="acu-lavado relative z-[8] flex flex-col items-center gap-6 px-4 py-20 text-center sm:px-8">
        <h2 className="dir-titular dir-t3 max-w-[18ch]">{n.cierre.frase}</h2>
        <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
          {n.cierre.boton}
        </Link>
      </section>
      <div className="dir-tinta relative z-[8]">
        <Pie idioma={idioma} camino="/" rasca landings={["preguntas", "voz"]} />
      </div>

      <WhatsAppFlotante idioma={idioma} />
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
