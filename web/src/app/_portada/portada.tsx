import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Acordeon } from "../_ui/acordeon";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
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
import { OndaQuieta } from "../_direccion/piezas";
import { Cajas } from "./cajas";
import { AudiosLibro } from "./audios-libro";
import { VideoLibro } from "../_direccion/video-libro";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { BandaFotos, CierreAcuarela, InicioAcuarela, PasosFotos, PreguntasAcuarela, TiendaAcuarela } from "./piezas-acuarela";
import { cajasPortada } from "./datos-cajas";
import { TEXTOS_PORTADA_INICIO } from "../_textos/portada-inicio";
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
  banda: "/rediseno/familia-leyendo-ancha.jpg",
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
  const preguntaAudios = t.faq.preguntas.find((q) => /^¿?Qui[ée]n escucha|^Qui escolta/.test(q.pregunta))?.pregunta;
  const preguntas = [{ ...t.faq.preguntas[0], pregunta: t.preguntas.usarlo }, ...t.faq.preguntas.slice(1), ...t.preguntas.nuevas].map((q) =>
    q.pregunta === preguntaAudios ? { ...q, respuesta: n.faqAudios } : q,
  );

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada acu-imanes flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Coreografia />

      {/* 1 · Inicio: una pantalla. Es la única capa: la tienda sube y lo tapa apenas se baja. */}
      <InicioAcuarela
        arriba="pt-28"
        marca={<LogoTrazo id="trazo-portada" halo="rgba(255, 250, 248, 0.55)" className="acu-logo-inicio" />}
        cabecera={<Cabecera idioma={idioma} camino="/" sobreHero />}
        titulo={
          <>
            {t.hero.titulo[0]} <br className="hidden sm:block" />
            {t.hero.titulo[1]}
          </>
        }
        bajada={t.inicio.bajada}
        botones={
          <>
            <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
              {t.iniciar}
            </Link>
            <a href="#tienda" className="acu-boton-hilo">
              {n.inicio.boton}
            </a>
          </>
        }
        visual={
          <div data-libro-3d data-libro-cierra className="l3-seccion prt-libro acu-libro w-full">
            <Libro3D idioma={idioma} b={t.direccion.libro} c={ej.libro} />
          </div>
        }
      />
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* 2 · La tienda */}
      <TiendaAcuarela confianza={TEXTOS_PORTADA_INICIO[idioma].confianza} titulo={n.tienda.titulo} bajada={n.tienda.bajada}>
        <Cajas idioma={idioma} cajas={cajas} whatsapp={whatsapp} />
        <ul className="acu-pie">
          {n.tienda.pie.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </TiendaAcuarela>

      {/* La foto de ancho completo: ilustra y se reemplaza por una real cuando esté filmado. */}
      <BandaFotos fotos={[FOTOS.banda]} />

      {/* 3 · Los audios que se vuelven capítulos */}
      <section className="acu-iman acu-hoja-banda relative z-[3] px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3 mx-auto max-w-[18ch]">{n.audios.titulo}</h2>
        <AudiosLibro idioma={idioma} capitulos={n.audios.capitulos} />
      </section>

      {/* 4 · Los cuatro pasos */}
      <PasosFotos
        titulo={n.pasos.titulo}
        etiqueta={t.como.paso}
        pasos={n.pasos.lista.map((paso, i) => ({
          ...paso,
          foto: FOTOS_PASOS[i],
          ilustracion: (
            <div aria-hidden className="acu-pantallita">
              <span>{n.pasos.ejemplo[0]}</span>
              <span>{n.pasos.ejemplo[1]}</span>
              <span>{n.pasos.agregar}</span>
            </div>
          ),
        }))}
      />

      {/* 5 · Se lee y se escucha: quieta, sin reproducir (Naza, 25/10). La tapa
          es la que anuncia el JSON-LD: la foto de la ficha tiene que estar en la página. */}
      <section className="acu-iman acu-hoja-banda2 relative z-[5] px-4 py-14 sm:px-8 md:py-20">
        <div className="acu-voz">
          <div className="flex flex-col gap-4">
            <h2 className="dir-titular dir-t3">{n.voz.titulo}</h2>
            <p className="text-[17px] text-[var(--acu-suave)]">{n.voz.texto}</p>
            <div className="acu-onda max-w-[420px]"><OndaQuieta duracion={t.escuchalo.duracion} conPlay={false} /></div>
            <div className="acu-voz-estante">
              <div className="acu-voz-libros">
                <div className="prt-fisico">
                  <Image
                    src={FOTOS.portada}
                    alt={t.libro.altPortada}
                    width={760}
                    height={981}
                    sizes="(min-width: 768px) 120px, 30vw"
                    className="h-auto w-full"
                  />
                </div>
                <div className="prt-fisico prt-fisico--espalda">
                  <Image
                    src={CONTRAPORTADA}
                    alt={t.voz.altContraportada}
                    width={760}
                    height={981}
                    sizes="(min-width: 768px) 120px, 30vw"
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Provisional: este video sale cuando esté filmada la toma del QR que suena. */}
          <VideoLibro
            src="/video/libro-cinematico.mp4"
            poster="/video/libro-cinematico-poster.jpg"
            alt={t.libro.altPortada}
            ancho={1344}
            alto={768}
            sizes="(min-width: 820px) 680px, 100vw"
            className="acu-video-marco w-full"
          />
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

      {/* 7 · Preguntas: la garantía vive acá y solo acá (DECISIONES D1). */}
      <PreguntasAcuarela titulo={t.faq.titulo} duda={t.faq.duda} whatsapp={whatsapp}>
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
      </PreguntasAcuarela>

      {/* 8 · Cierre */}
      <CierreAcuarela titulo={n.cierre.frase} marca={<LogoTrazo id="trazo-cierre" modo="scroll" halo="rgba(255, 250, 248, 0.55)" className="w-[120px] sm:w-[150px]" />}>
        <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
          {n.cierre.boton}
        </Link>
      </CierreAcuarela>
      <div className="dir-tinta relative z-[8]" data-cta-propio>
        <Pie idioma={idioma} camino="/" rasca landings={["preguntas", "voz"]} />
      </div>

      <WhatsAppFlotante idioma={idioma} />
      {precioLibro ? (
        <CtaSticky
          precio={precioLibro}
          href={comprar}
          variante="acuarela"
          textos={{ desde: "", conImpreso: t.elLibro.pagoUnico, sinImpreso: t.elLibro.pagoUnico, boton: t.iniciar }}
        />
      ) : null}
    </div>
  );
}
