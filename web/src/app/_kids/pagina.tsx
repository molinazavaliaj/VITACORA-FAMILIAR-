import Link from "next/link";
import type { ReactNode } from "react";
import { Cabecera, Pie } from "../_publico";
import { Acordeon } from "../_ui/acordeon";
import { TEXTOS_KIDS, type PasoKids } from "../_textos/kids";
import { obtenerPrecioKids } from "@/lib/precios";
import { kidsVende } from "@/lib/kids";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { BotonEscribir, ChatKids, FOTOS_KIDS, FotoKids, PaginaKids, conVar } from "./piezas";

// /kids, /ca/kids y /ar/kids: Vitácora Kids («Mi Primer Capítulo», 15/10). La
// maqueta Kids y KidsMovil con la paleta de Kids de la guía (fondo #fbf8f3,
// acento #c4502e, botón #ff8a6b) en el lenguaje de la dirección nueva: letra
// grande, papel, hilos en vez de filas de tarjetas, fotos con forma.
//
// ESTÁTICA: no lee headers ni cookies. Lo que vende lo deciden las variables al
// construir: con KIDS_VENTA="1", PRECIO_KIDS_* válido y una región que vende
// (KIDS_REGIONES: hoy solo /ar), los botones llevan a /comprar/kids de su
// idioma y se ve el precio; si falta alguna, «Próximamente» y «Escríbenos»
// (WhatsApp de dudas o correo). KIDS_VENTA no se prende hasta que Joaquín
// conecte el motor y esté aplicada la migración de kids_v2 (lib/kids.ts).
//
// Lo que NO dice, a propósito: tiempos (días, semanas), «9 días», marco, «Su
// voz», reseñas, garantía (Kids no tiene texto aprobado: PENDIENTES). La
// conversación de ejemplo usa una pregunta del banco y un acuse aprobados: el
// bot nunca dice que algo le gusta.
//
// Orden: 1 inicio, 2 los dibujos se pierden, 3 cómo funciona, 4 la
// conversación, 5 el libro, 6 las preguntas, 7 tú lo ves todo y los temas,
// 8 el precio o «Próximamente», 9 preguntas frecuentes, 10 cierre y pie.

/** El precio de Kids en la región del idioma, y si se vende. */
export function preciosKids(idioma: IdiomaWeb) {
  const region = regionDeIdioma(idioma);
  const { moneda } = catalogo(region);
  const precio = obtenerPrecioKids(region);
  const vende = kidsVende(region);
  const formatear = (n: number) => new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: moneda, maximumFractionDigits: 0 }).format(n);
  const promo = promoPorcentaje();
  const lista = vende && precio !== null && promo ? formatear(precioDeLista(precio, moneda, promo)) : null;
  return { vende, precio: vende ? precio : null, formatear, promo, lista };
}

export function PaginaKidsCompleta({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_KIDS[idioma];
  const { vende, precio, formatear, promo, lista } = preciosKids(idioma);
  const comprar = ruta(idioma, "/comprar/kids");

  const Promo = () =>
    lista && promo ? (
      <>
        <s className="mr-2 opacity-70">{lista}</s>
        <span className="mr-2">−{promo} %</span>
      </>
    ) : null;

  /** El botón principal: comprar si se vende; si no, escribirnos. */
  const Accion = ({ className = "" }: { className?: string }) =>
    vende ? (
      <Link prefetch={false} href={comprar} className={`kids-boton ${className}`}>
        {t.empezar}
      </Link>
    ) : (
      <BotonEscribir t={t} className={className} />
    );

  const dato: ReactNode =
    vende && precio !== null ? (
      <>
        <Promo />
        {t.desde(formatear(precio))}
      </>
    ) : (
      t.proximamente
    );

  return (
    <PaginaKids idioma={idioma}>
      {/* ═══ 1 · INICIO: el titular enorme y el chico que graba, en arco ═══ */}
      <section className="relative">
        <Cabecera idioma={idioma} camino="/kids" producto="kids" sobreHero />
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-14 px-4 pb-20 pt-8 sm:px-8 md:grid-cols-12 md:gap-8 md:pb-28 md:pt-14 lg:px-12">
          <div className="flex flex-col items-start gap-7 md:col-span-8">
            <span className="kids-micro kids-entra" style={conVar({ "--e": "0.2s" })}>
              {t.etiqueta}
            </span>
            <h1 className="kids-titular kids-t1 kids-asienta">
              <span className="block">{t.titulo[0]}</span>
              <em className="block">{t.titulo[1]}</em>
            </h1>
            <p className="kids-bajada kids-entra max-w-[38ch]" style={conVar({ "--e": "0.45s" })}>
              {t.bajada}
            </p>
            <div className="kids-entra flex w-full flex-col items-start gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-6" style={conVar({ "--e": "0.65s" })}>
              <Accion className="w-full max-w-[358px] sm:w-auto" />
              <span className="kids-dato">{dato}</span>
            </div>
          </div>
          <FotoKids
            src={FOTOS_KIDS.audio.src}
            alt={t.altHero}
            forma="arco"
            priority
            sizes="(min-width: 768px) 30vw, 78vw"
            className="w-[78%] justify-self-end md:col-span-4 md:col-start-9 md:w-full"
          />
        </div>
      </section>

      {/* ═══ 2 · LOS DIBUJOS SE PIERDEN: una frase sola, centrada ═══ */}
      <section className="kids-hilo-arriba">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center px-4 py-24 text-center sm:px-8 md:py-36">
          <h2 className="kids-titular kids-t2 kids-aparece">
            <span className="block">{t.dibujos.frase[0]}</span>
            <em className="block">{t.dibujos.frase[1]}</em>
          </h2>
          <p className="kids-bajada kids-aparece mt-8 max-w-[46ch]">{t.dibujos.texto}</p>
        </div>
      </section>

      {/* ═══ 3 · CÓMO FUNCIONA: título que se queda y tres pasos con hilo ═══ */}
      <section id="como-funciona" className="kids-hondo scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-36 lg:px-12">
          <div className="md:col-span-5">
            <h2 className="kids-titular kids-t3 kids-aparece max-w-[16ch] md:sticky md:top-24">{t.como.titulo}</h2>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <PasosKids pasos={t.como.pasos} etiqueta={t.como.paso} />
          </div>
        </div>
      </section>

      {/* ═══ 4 · LA CONVERSACIÓN: la foto del cuarto y el WhatsApp de ejemplo ═══ */}
      <section>
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <div className="flex flex-col gap-6 md:col-span-5">
            <h2 className="kids-titular kids-t3 kids-aparece">{t.chat.titulo}</h2>
            <p className="kids-parrafo kids-aparece max-w-[40ch]">{t.chat.texto}</p>
            <div className="kids-aparece mt-4">
              <ChatKids c={t.chat} />
            </div>
          </div>
          <FotoKids
            src={FOTOS_KIDS.cuarto.src}
            alt={t.chat.altFoto}
            forma="ovalo"
            sizes="(min-width: 768px) 36vw, 80vw"
            className="mx-auto w-[80%] md:col-span-5 md:col-start-8 md:w-full"
          />
        </div>
      </section>

      {/* ═══ 5 · EL LIBRO: la foto ancha del libro abierto y el índice ═══ */}
      <section className="kids-hilo-arriba">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-14 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <div className="md:col-span-12">
            <FotoKids src={FOTOS_KIDS.libroAbierto.src} alt={t.libro.altFoto} forma="ancha" sizes="(min-width: 1360px) 1264px, 92vw" className="w-full" />
          </div>
          <div className="flex flex-col gap-6 md:col-span-5">
            <h2 className="kids-titular kids-t3 kids-aparece">{t.libro.titulo}</h2>
            <p className="kids-parrafo kids-aparece max-w-[40ch]">{t.libro.texto}</p>
          </div>
          <ol className="kids-indice kids-aparece md:col-span-6 md:col-start-7">
            {t.libro.capitulos.map((cap, i) => (
              <li key={cap}>
                <span aria-hidden className="kids-indice-num">
                  {i + 1}
                </span>
                <span className="kids-indice-cap">{cap}</span>
                {i === t.libro.capitulos.length - 1 ? <span className="kids-dato ml-auto">{t.libro.sobre}</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ 6 · LAS PREGUNTAS: tres del banco, en cursiva grande ═══ */}
      <section className="kids-hondo">
        <div className="mx-auto max-w-[1100px] px-4 py-24 sm:px-8 md:py-36">
          <h2 className="kids-titular kids-t3 kids-aparece max-w-[18ch]">{t.preguntas.titulo}</h2>
          <ul className="mt-12 flex flex-col md:mt-16">
            {t.preguntas.items.map((p, i) => (
              <li key={p} className={`kids-aparece border-t border-[var(--kids-hilo)] py-8 ${i % 2 === 1 ? "md:pl-[12%]" : ""}`}>
                <p className="kids-cita max-w-[30ch]">«{p}»</p>
              </li>
            ))}
          </ul>
          <p className="kids-dato kids-aparece border-t border-[var(--kids-hilo)] pt-6">{t.preguntas.pie}</p>
        </div>
      </section>

      {/* ═══ 7 · TÚ LO VES TODO y LOS TEMAS ═══ */}
      <section>
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <FotoKids
            src={FOTOS_KIDS.familia.src}
            alt={t.panel.altFoto}
            forma="suave"
            sizes="(min-width: 768px) 44vw, 92vw"
            className="w-full md:col-span-6"
          />
          <div className="flex flex-col gap-6 md:col-span-5 md:col-start-8">
            <h2 className="kids-titular kids-t3 kids-aparece">{t.panel.titulo}</h2>
            <p className="kids-parrafo kids-aparece">{t.panel.texto}</p>
            <p className="kids-parrafo kids-aparece">{t.panel.tuyas}</p>
            <p className="kids-cita kids-aparece border-l-2 border-[var(--kids-acento)] pl-6 text-[clamp(1.3rem,1.1rem+0.8vw,1.75rem)]">{t.panel.pedido}</p>
          </div>
        </div>
        <div className="mx-auto max-w-[1360px] px-4 pb-24 sm:px-8 md:pb-36 lg:px-12">
          <div className="kids-hilo-arriba grid grid-cols-1 gap-6 pt-14 md:grid-cols-12 md:gap-8">
            <h3 className="kids-titular kids-aparece text-[clamp(1.6rem,1.25rem+1.4vw,2.4rem)] leading-[1.12] md:col-span-5">{t.temas.titulo}</h3>
            <p className="kids-parrafo kids-aparece md:col-span-6 md:col-start-7">{t.temas.texto}</p>
          </div>
        </div>
      </section>

      {/* ═══ 8 · EL PRECIO, o «Próximamente» ═══ */}
      <section className="kids-hondo">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-14 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-32 lg:px-12">
          <FotoKids src={FOTOS_KIDS.libroTapa.src} alt="" forma="ancha" sizes="(min-width: 768px) 46vw, 92vw" className="w-full md:col-span-6 md:col-start-7 md:row-start-1" />
          <div className="flex flex-col items-start gap-6 md:col-span-5 md:col-start-1 md:row-start-1">
            {vende && precio !== null ? (
              <>
                <h2 className="kids-titular kids-t3">{t.precio.titulo}</h2>
                <p className="flex flex-wrap items-baseline gap-3">
                  {lista ? (
                    <span className="kids-dato">
                      <Promo />
                    </span>
                  ) : null}
                  <span className="kids-precio">{formatear(precio)}</span>
                </p>
                <p className="kids-parrafo max-w-[38ch]">{t.precio.texto}</p>
                <Accion />
                <span className="kids-dato">{t.precio.nota}</span>
              </>
            ) : (
              <>
                <h2 className="kids-titular kids-t2">
                  <em>{t.proximamente}</em>
                </h2>
                <p className="kids-parrafo max-w-[38ch]">{t.proximamenteTexto}</p>
                <BotonEscribir t={t} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ═══ 9 · PREGUNTAS FRECUENTES ═══ */}
      <section>
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <h2 className="kids-titular kids-t3 kids-aparece md:col-span-4">{t.faq.titulo}</h2>
          <div className="kids-aparece border-t border-[var(--kids-hilo)] md:col-span-7 md:col-start-6">
            {t.faq.preguntas.map((d, i) => (
              <Acordeon key={d.pregunta} pregunta={d.pregunta} abierta={i === 0} grupo="dudas-kids">
                {d.respuesta}
              </Acordeon>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 10 · CIERRE ═══ */}
      <section className="kids-hilo-arriba">
        <div className="flex flex-col items-center px-4 py-24 text-center sm:px-8 md:py-36">
          <h2 className="kids-titular kids-t2 kids-aparece max-w-[20ch]">
            <span className="block">{t.cierre.titulo[0]}</span>
            <em className="block">{t.cierre.titulo[1]}</em>
          </h2>
          <div className="kids-aparece mt-11 flex w-full flex-col items-center gap-4">
            <Accion className="w-full max-w-[358px] sm:w-auto" />
            <span className="kids-dato">{dato}</span>
          </div>
          <Link prefetch={false} href={ruta(idioma, "/")} className="kids-enlace kids-aparece mt-8">
            {t.cierre.familiar}
          </Link>
        </div>
        <Pie idioma={idioma} camino="/kids" />
      </section>
    </PaginaKids>
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
