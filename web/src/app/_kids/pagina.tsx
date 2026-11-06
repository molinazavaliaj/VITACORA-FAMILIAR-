import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { Acordeon } from "../_ui/acordeon";
import { TEXTOS_KIDS, type PasoKids } from "../_textos/kids";
import { obtenerPrecioKids } from "@/lib/precios";
import { kidsVendeEn } from "@/lib/kids";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { ChatKids, FOTOS_KIDS, enlaceEscribir } from "./piezas";
import { Coreografia } from "../_direccion/coreografia";
import { VideoLibro } from "../_direccion/video-libro";
import { Cajas } from "../_portada/cajas";
import { filasDePrecio, type Caja } from "../_portada/datos-cajas";
import { BandaFotos, CierreAcuarela, InicioAcuarela, PasosFotos, PreguntasAcuarela, TiendaAcuarela } from "../_portada/piezas-acuarela";
import { TEXTOS_EDICIONES } from "../_textos/ediciones";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import "../_portada/portada.css";

// /kids, /ca/kids y /ar/kids: Vitácora Kids («Mi Primer Capítulo», 15/10), con
// el armado de la portada nueva (06/11) y el acento terracota. Las landings
// (/kids/su-mundo, /kids/a-los-once) siguen con la paleta de kids.css.
//
// ESTÁTICA: no lee headers ni cookies. Lo que vende lo deciden las variables al
// construir: con KIDS_VENTA="1", PRECIO_KIDS_* válido y una región que vende
// (KIDS_REGIONES: /ar y España, con /ca desde la tanda 10), los botones llevan a /comprar/kids de su
// idioma y se ven los precios; si falta alguna, «Próximamente» y «Escríbenos»
// (WhatsApp de dudas o correo). KIDS_VENTA no se prende hasta que Joaquín
// conecte el motor y esté aplicada la migración de kids_v2 (lib/kids.ts).
//
// Lo que NO dice, a propósito: tiempos (días, semanas), «9 días», marco, «Su
// voz» ni reseñas. La garantía es la de Familiar, en las preguntas (Naza, 25/10). La
// conversación de ejemplo usa una pregunta del banco y un acuse aprobados: el
// bot nunca dice que algo le gusta.

/** El precio de Kids en la región del idioma, y si se vende. */
export function preciosKids(idioma: IdiomaWeb) {
  const region = regionDeIdioma(idioma);
  const { moneda } = catalogo(region);
  const precio = obtenerPrecioKids(region);
  const vende = kidsVendeEn(idioma);
  const formatear = (n: number) => new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(n);
  const promo = promoPorcentaje();
  const lista = vende && precio !== null && promo ? formatear(precioDeLista(precio, moneda, promo)) : null;
  return { vende, precio: vende ? precio : null, formatear, promo, lista };
}

export function PaginaKidsCompleta({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_KIDS[idioma];
  const portada = TEXTOS_PORTADA[idioma];
  const n = TEXTOS_PORTADA_NUEVA[idioma];
  const { vende, precio, formatear, promo, lista } = preciosKids(idioma);
  const comprar = ruta(idioma, "/comprar/kids");
  const whatsapp = urlWhatsAppDudas();
  const escribir = enlaceEscribir(t);
  const cat = catalogo(regionDeIdioma(idioma));
  const conPrecio = vende && precio !== null;

  /** El botón principal: comprar si se vende; si no, escribirnos. */
  const accion = vende ? (
    <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
      {t.empezar}
    </Link>
  ) : (
    <a href={escribir.href} {...(escribir.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="dir-boton dir-boton--lleno acu-boton">
      {t.escribir}
    </a>
  );

  const dato: ReactNode = conPrecio ? (
    <>
      {lista && promo ? (
        <>
          <s className="mr-2 opacity-70">{lista}</s>
          <span className="mr-2">−{promo} %</span>
        </>
      ) : null}
      {t.desde(formatear(precio))}
    </>
  ) : (
    t.proximamente
  );

  const tapa = TEXTOS_EDICIONES[idioma].tapaKids;
  const caja: Caja = {
    id: "nino",
    textos: { titulo: t.etiqueta, linea: conPrecio ? t.precio.texto : t.proximamenteTexto, ideal: n.cajas.nino.ideal, enlace: conPrecio ? t.empezar : t.escribir },
    tinte: 3,
    tapa: { etiqueta: tapa.etiqueta, nombre: tapa.nombre, firma: tapa.edad, foto: FOTOS_KIDS.cuarto.src },
    filas: conPrecio ? filasDePrecio(idioma, cat, formatear, precio, lista) : [{ etiqueta: n.precios.pronto, valor: n.precios.prontoValor }],
    href: conPrecio ? comprar : escribir.href,
    externo: !conPrecio,
    marca: conPrecio ? null : "pronto",
  };

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada acu-tema acu-acento-kids acu-imanes flex flex-1 flex-col">
      <Coreografia />

      {/* 1 · Inicio: el libro de Nico en video (MOTION 14), acá y solo acá. Debajo de
          los botones, quién escucha lo que cuenta (Naza, 25/10). */}
      <InicioAcuarela
        cabecera={<Cabecera idioma={idioma} camino="/kids" producto="kids" sobreHero textoComprar={t.empezar} />}
        titulo={
          <>
            {t.titulo[0]} <em className="dir-destaca">{t.titulo[1]}</em>
          </>
        }
        bajada={t.bajada}
        botones={
          <>
            {accion}
            <a href="#como-funciona" className="acu-boton-hilo">
              {portada.inicio.comoFunciona}
            </a>
          </>
        }
        dato={
          <>
            {t.privacidad.texto}{" "}
            <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className="underline underline-offset-4">
              {t.privacidad.enlace}
            </Link>
          </>
        }
        visual={
          <VideoLibro
            src="/video/kids-libro.mp4"
            poster="/video/kids-libro-poster.jpg"
            alt={t.dibujos.altVideo}
            ancho={1120}
            alto={640}
            sizes="(min-width: 900px) 620px, 100vw"
            className="kids-video w-full"
          />
        }
      />
      {/* La barra de compra del teléfono aparece cuando esto sale de pantalla. */}
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* 2 · El libro en el estante, con la nota de precios o «Próximamente». */}
      <TiendaAcuarela confianza={t.ventajas} titulo={conPrecio ? t.precio.titulo : t.proximamente} ctaPropio>
        <Cajas idioma={idioma} cajas={[caja]} whatsapp={whatsapp} />
        {conPrecio ? <p className="dir-dato mt-2 text-[var(--acu-suave)]">{t.precio.nota}</p> : null}
      </TiendaAcuarela>

      <BandaFotos fotos={[FOTOS_KIDS.libroAbierto.src]} alt={t.libro.altFoto} posicion="50% 50%" />

      {/* 3 · Los juguetes y su libro: una frase sola, centrada. */}
      <section className="acu-iman acu-hoja-banda relative z-[3] px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3 mx-auto max-w-[24ch]">
          <span className="block">{t.dibujos.frase[0]}</span>
          {/* Las tres primeras palabras juntas: en el teléfono quedaba «Lo que» solo arriba (revisión del 25/10, A13). */}
          <em className="dir-destaca block">{t.dibujos.frase[1].replace(/^(\S+) (\S+) (\S+)/, "$1 $2 $3")}</em>
        </h2>
      </section>

      {/* 4 · Cómo funciona */}
      <PasosFotos
        titulo={t.como.titulo}
        etiqueta={t.como.paso}
        pasos={t.como.pasos.map((paso, i) => ({
          ...paso,
          foto: [FOTOS_KIDS.audio.src, FOTOS_KIDS.cuarto.src, FOTOS_KIDS.libroTapa.src][i],
          alt: i === 0 ? t.altHero : i === 1 ? t.chat.altFoto : "",
        }))}
      />

      {/* 5 · La conversación de ejemplo y las preguntas del banco */}
      <section className="acu-iman acu-hoja-banda2 relative z-[5] px-4 py-14 sm:px-8 md:py-20">
        <div className="acu-par">
          <div className="flex flex-col gap-4">
            <h2 className="dir-titular dir-t3">{t.chat.titulo}</h2>
            <h3 className="dir-titular dir-t4 mt-6">{t.preguntas.titulo}</h3>
            <ul className="flex flex-col">
              {t.preguntas.items.map((p) => (
                <li key={p} className="border-t border-[var(--acu-linea)] py-4">
                  <p className="dir-pregunta">«{p}»</p>
                </li>
              ))}
            </ul>
            <p className="dir-dato border-t border-[var(--acu-linea)] pt-4 text-[var(--acu-suave)]">{t.preguntas.pie}</p>
          </div>
          <div className="kids acu-chat flex justify-center">
            <ChatKids c={t.chat} />
          </div>
        </div>
      </section>

      {/* 6 · El libro y el sobre cerrado */}
      <section className="acu-iman acu-hoja-lisa relative z-[6] px-4 py-14 sm:px-8 md:py-20">
        <div className="acu-par">
          <div className="flex flex-col gap-4">
            <h2 className="dir-titular dir-t3">{t.libro.titulo}</h2>
            <p className="acu-parrafo max-w-[44ch]">{t.libro.texto}</p>
          </div>
          <ol className="dir-indice">
            {t.libro.capitulos.map((cap, i) => (
              <li key={cap}>
                <span aria-hidden className="dir-indice-num">{i + 1}</span>
                <span className="dir-indice-cap">{cap}</span>
                {i === t.libro.capitulos.length - 1 ? <span className="dir-dato ml-auto text-right text-[var(--acu-suave)]">{t.libro.sobre}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7 · Tú lo ves todo y los temas: lo que cuida a quien regala y al chico */}
      <section className="acu-iman acu-hoja-banda relative z-[6] px-4 py-14 sm:px-8 md:py-20">
        <div className="acu-par">
          <div className="acu-par-img">
            <Image src={FOTOS_KIDS.familia.src} alt={t.panel.altFoto} fill sizes="(min-width: 820px) 50vw, 100vw" />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="dir-titular dir-t3">{t.panel.titulo}</h2>
            <p className="acu-parrafo">{t.panel.texto}</p>
            <p className="acu-parrafo">{t.panel.tuyas}</p>
            <p className="dir-pie border-l-2 border-[var(--acu-bordo)] pl-4">{t.panel.pedido}</p>
            <h3 className="dir-titular dir-t4 mt-6">{t.temas.titulo}</h3>
            <p className="acu-parrafo">{t.temas.texto}</p>
          </div>
        </div>
      </section>

      {/* 8 · Preguntas (la garantía vive acá: D1) */}
      <PreguntasAcuarela titulo={t.faq.titulo} duda={portada.faq.duda} whatsapp={whatsapp}>
        {t.faq.preguntas.filter((d) => !d.soloLanding).map((d, i) => (
          <Acordeon key={d.pregunta} pregunta={d.pregunta} abierta={i === 0} grupo="dudas-kids">
            {d.respuesta}
          </Acordeon>
        ))}
      </PreguntasAcuarela>

      {/* 9 · Cierre */}
      <CierreAcuarela
        titulo={
          <>
            <span className="block">{t.cierre.titulo[0]}</span>
            <em className="dir-destaca block">{t.cierre.titulo[1]}</em>
          </>
        }
      >
        {accion}
        <span className="dir-dato text-[var(--acu-suave)]">{dato}</span>
        <Link prefetch={false} href={ruta(idioma, "/")} className="acu-enlace">
          {t.cierre.familiar}
        </Link>
      </CierreAcuarela>
      <div className="dir-tinta relative z-[8]" data-cta-propio>
        <Pie idioma={idioma} camino="/kids" />
      </div>

      {/* Como en la portada (revisión del 25/10): el WhatsApp y la barra fija del teléfono, si se vende. */}
      <WhatsAppFlotante idioma={idioma} />
      {conPrecio ? (
        <CtaSticky
          precio={formatear(precio)}
          href={comprar}
          variante="acuarela"
          textos={{ desde: "", conImpreso: portada.elLibro.pagoUnico, sinImpreso: portada.elLibro.pagoUnico, boton: t.empezar }}
        />
      ) : null}
    </div>
  );
}

/** Tres pasos con número grande en cursiva terracota, separados por hilos (sin tarjetas). */
export function PasosKids({ pasos, etiqueta }: { pasos: readonly PasoKids[]; etiqueta: (n: number) => string }) {
  return (
    <ol className="mt-12 flex flex-col md:mt-0">
      {pasos.map((paso, i) => (
        <li key={paso.titulo} className="kids-aparece grid grid-cols-[auto_1fr] items-start gap-x-6 border-t border-[var(--kids-hilo)] py-8 sm:gap-x-10">
          <span aria-hidden className="kids-numero w-[0.8em] text-center">
            {i + 1}
          </span>
          <div className="flex flex-col gap-3 pt-2">
            <span className="sr-only">{etiqueta(i + 1)}</span>
            <h3 className="kids-titular text-[26px] leading-[1.12] sm:text-[32px]">{paso.titulo}</h3>
            <p className="kids-parrafo max-w-[42ch]">{paso.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
