import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { TEXTOS_PORTADA, type Segmento } from "../_textos/portada";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { LogoTrazo } from "./logo-trazo";
import { CabeceraDireccion } from "./cabecera";
import { PieDireccion } from "./pie";
import { Coreografia } from "./coreografia";
import { DibujoAudio, DibujoLibreta, DibujoLibro } from "./dibujos";
import { Libro3D, PaginaCapitulo, PaginaFoto } from "./libro-3d";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";

// Prototipo de dirección visual para la portada (13/10, pedido de Naza: «está
// bien pero verde»). La web como un libro: tinta y papel que se alternan como
// capítulos, letra enorme, una idea por pantalla, fotos en blanco y negro
// recortadas como retrato antiguo. Sin violeta. Solo castellano de España.
// No reemplaza a la portada (/): vive en /prueba-direccion para comparar.
//
// Todos los textos salen de _textos/portada.ts (versión es, aprobada). El
// movimiento es CSS (globals.css, bloque «dir-»): transform y opacity, más el
// trazo del logo. Sin animation-timeline o con «menos movimiento», todo se ve
// quieto y completo.
//
// 2.ª vuelta (13–14/10, lo que pidió Naza al verlo en el teléfono): cabecera y
// pie mínimos; la bajada del hero con la marca (aprobada el 14/10); las
// secciones como capas que se tapan al bajar; la frase de las fotos que se
// completa sola al llegar, sin retener el scroll; «Cómo funciona» con un
// dibujo en línea fina por paso; las fotos que pasan del blanco y negro al
// sepia mientras entran. Lo que corre en el navegador está en coreografia.tsx.
//
// 3.ª vuelta: nuevo orden (inicio, la frase, EL LIBRO EN 3D, el dolor con la
// carta de los fundadores, cómo funciona, para quién, cierre), texturas de
// tela (negro) y papel de algodón con el borde cortado a mano (crema).
//
// Las fotos son personas generadas (PENDIENTES B10): ilustran, nunca se
// presentan como familias reales.

const FOTOS = {
  guitarra: "/rediseno/osvaldo-guitarra.jpg",
  padre: "/rediseno/para-tu-padre.jpg",
  abuelo: "/rediseno/para-tu-abuelo.jpg",
  viaje: "/rediseno/viaje-mirador-lisboa.jpg",
} as const;

const IDIOMA: IdiomaWeb = "es";
const DIBUJOS = [DibujoLibreta, DibujoAudio, DibujoLibro] as const;

const conVar = (vars: Record<string, number | string>) => vars as CSSProperties;

/**
 * Una frase partida en palabras para iluminarlas de a una al bajar. El texto
 * entero va aparte para lectores de pantalla; las palabras sueltas, ocultas.
 * `desde` corre el índice cuando la frase sigue a otra en el mismo reloj.
 */
function Palabras({ texto, desde = 0, total, clase = "" }: { texto: string; desde?: number; total: number; clase?: string }) {
  const palabras = texto.split(" ");
  return (
    <>
      {palabras.map((p, j) => (
        <span key={`${p}-${j}`}>
          <span className={`dir-palabra ${clase}`} style={conVar({ "--i": desde + j, "--n": total })}>
            {p}
          </span>
          {j < palabras.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

function Bajada({ segmentos }: { segmentos: Segmento[] }) {
  return (
    <>
      {segmentos.map((s, i) =>
        typeof s === "string" ? s : (
          <strong key={i} className="font-normal text-[var(--dir-sobre-papel)]">
            {s.fuerte}
          </strong>
        ),
      )}
    </>
  );
}

function Foto({
  src,
  alt,
  forma,
  sizes,
  className = "",
  recorte = false,
  children,
}: {
  src: string;
  alt: string;
  forma: "ovalo" | "arco" | "circulo";
  sizes: string;
  className?: string;
  /** La foto trae borde de papel: se agranda un poco para que no se vea. */
  recorte?: boolean;
  children?: ReactNode;
}) {
  return (
    <figure className={`flex flex-col gap-5 ${className}`}>
      <div className={`dir-marco dir-marco--${forma}`}>
        <div className={`dir-foto dir-foto--${forma}`}>
          <div className={`absolute ${recorte ? "-inset-[7%]" : "inset-0"}`}>
            <Image src={src} alt={alt} fill sizes={sizes} className="dir-revela object-cover" />
          </div>
        </div>
      </div>
      {children ? <figcaption className="flex flex-col gap-2">{children}</figcaption> : null}
    </figure>
  );
}

export function Direccion() {
  const t = TEXTOS_PORTADA[IDIOMA];
  const cat = catalogo(regionDeIdioma(IDIOMA));
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(IDIOMA), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  const precio = formatear(cat.base.precio);
  const promo = promoPorcentaje();
  const lista = promo ? formatear(precioDeLista(cat.base.precio, cat.moneda, promo)) : null;
  const comprar = ruta(IDIOMA, "/comprar");

  const [frase1, frase2] = t.fotos.titulo;
  const nFrase = frase1.split(" ").length + frase2.split(" ").length;
  const nDolor = t.direccion.dolor.frase.split(" ").length;
  const coma = t.direccion.dolor.firma.indexOf(", ");
  const firma = coma > 0 ? [t.direccion.dolor.firma.slice(0, coma), t.direccion.dolor.firma.slice(coma + 2)] : [t.direccion.dolor.firma, ""];
  const ej = TEXTOS_EJEMPLO[IDIOMA];

  return (
    <div lang={langDeIdioma(IDIOMA)} className="dir-pagina flex flex-1 flex-col">
      <Coreografia />

      {/* ═══ 1 · PORTADA: el logo se dibuja sobre negro. Queda fija detrás
          y la sección siguiente la tapa (capa). ═══ */}
      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-12 pt-24 text-center sm:px-8 sm:pt-28">
          <CabeceraDireccion idioma={IDIOMA} />
          <LogoTrazo id="trazo-portada" halo="var(--dir-tinta)" className="w-[160px] sm:w-[240px] lg:w-[min(280px,28svh)]" />

          <h1 className="dir-titular dir-t1 dir-asienta mt-9 max-w-[13ch] sm:mt-11 sm:max-w-none">
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
            <Link prefetch={false} href={ruta(IDIOMA, "/ejemplo")} className="dir-boton dir-boton--hilo">
              {t.hero.verComo}
            </Link>
          </div>
          <p className="dir-entra dir-dato mt-6 text-[var(--dir-sobre-tinta-suave)]" style={conVar({ "--e": "1.05s" })}>
            {lista && promo ? (
              <>
                <s className="mr-2 opacity-70">{lista}</s>
                <span className="mr-2">−{promo} %</span>
              </>
            ) : null}
            {t.hero.desde(precio)}
          </p>
        </div>
      </section>

      {/* ═══ 2 · LAS FOTOS QUEDAN: sube tapando la portada; la frase se
          completa sola al llegar, palabra por palabra ═══ */}
      <section data-capa className="dir-tinta dir-hoja dir-sobre-1 relative z-[2]">
        <div className="dir-hunde dir-hunde--2">
          <div
            data-revela
            className="mx-auto flex min-h-[100dvh] w-full max-w-[1360px] items-center px-4 py-24 sm:px-8 lg:px-12"
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

      {/* ═══ 3 · EL LIBRO: la hoja de papel sube y, fija un rato, el libro de
          Osvaldo gira con el scroll y se abre en el capítulo 1 ═══ */}
      <section data-capa className="dir-papel dir-hoja dir-deckle dir-sobre-2 dir-diferido relative z-[3]">
        <div className="dir-hunde dir-hunde--3">
          {/* data-lejos: el libro no se arma hasta que se acerca (ver coreografia.tsx). */}
          <noscript>
            <style>{"[data-lejos]{content-visibility:visible}"}</style>
          </noscript>
          <div className="l3-seccion" data-lejos>
            <div className="l3-pegado">
              <Libro3D idioma={IDIOMA} b={t.direccion.libro} c={ej.libro} />
              <div className="l3-leyenda">
                <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{ej.inventada}</span>
                <Link prefetch={false} href={ruta(IDIOMA, "/ejemplo")} className="dir-enlace-papel">
                  {t.banda[0]} <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
          {/* Sin giro (sin soporte o con «menos movimiento»): el pliego abierto, plano. */}
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

      {/* ═══ 4 · EL DOLOR Y LA CARTA: negro de tela; la carta es una hoja de
          algodón con los bordes cortados a mano ═══ */}
      <section data-capa className="dir-tinta dir-hoja dir-sobre-3 dir-diferido relative z-[4]">
        <div className="dir-hunde dir-hunde--4 mx-auto max-w-[1360px] px-4 pb-28 pt-28 sm:px-8 md:pb-40 md:pt-40 lg:px-12">
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

      {/* ═══ 5 · CÓMO FUNCIONA: la hoja de papel sube y tapa al negro ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-sobre-4 dir-diferido relative z-[5]">
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

      {/* ═══ 6 · PARA LAS VIDAS QUE MERECEN SU PROPIO LIBRO: retratos de
          tamaños y formas distintas. Capa: el cierre negro la tapa ═══ */}
      <section data-capa className="dir-papel dir-diferido relative z-[6]">
        <div className="dir-hunde dir-hunde--5 mx-auto max-w-[1360px] px-4 pb-28 sm:px-8 md:pb-44 lg:px-12">
          <div className="border-t border-[var(--dir-hilo-papel)] pt-20 md:pt-32">
            <h2 className="dir-titular dir-t2 aparece max-w-[15ch] md:max-w-[17ch]">{t.direccion.paraQuien}</h2>
            <p className="aparece mt-7 max-w-[44ch] text-[19px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)] sm:text-[21px]">
              <Bajada segmentos={t.paraQuien.bajada} />
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-y-20 md:mt-28 md:grid-cols-12 md:gap-x-8 md:gap-y-0">
            <Foto
              src={FOTOS.padre}
              alt={t.paraQuien.padre.alt}
              forma="ovalo"
              sizes="(min-width: 768px) 40vw, 86vw"
              className="w-[86%] md:col-span-5 md:w-full"
            >
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
              sizes="(min-width: 768px) 20vw, 56vw"
              className="w-[56%] md:col-span-3 md:col-start-3 md:-mt-12 md:w-full"
            >
              <span className="dir-micro text-[var(--dir-sobre-papel-suave)]">{t.paraQuien.viaje.etiqueta}</span>
              <span className="dir-pie">{t.paraQuien.viaje.texto}</span>
            </Foto>
          </div>
        </div>
      </section>

      {/* ═══ 7 · CIERRE: el colofón en negro sube y tapa al papel; abajo, el pie ═══ */}
      <section className="dir-tinta dir-hoja dir-sobre-5 dir-diferido relative z-[7]">
        <div className="flex flex-col items-center px-4 pb-28 pt-28 text-center sm:px-8 md:pb-40 md:pt-40">
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
        <PieDireccion idioma={IDIOMA} />
      </section>
    </div>
  );
}
