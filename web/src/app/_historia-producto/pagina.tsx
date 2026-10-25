import Link from "next/link";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { Foto, Ventajas, conVar } from "../_direccion/piezas";
import { Libro3D } from "../_direccion/libro-3d";
import { MiniFaq, Pagina, Pasos } from "../_landing/landing";
import { enlaceEscribir } from "../_kids/piezas";
import { CAPITULO_HISTORIA_EJEMPLO, LIBRO_HISTORIA_EJEMPLO, TEXTOS_HISTORIA } from "../_textos/historia";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { HISTORIA_TEMAS, historiaVendeEn } from "@/lib/historia";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import "../_direccion/direccion.css";
import "../_portada/portada.css";

// /historia, /ca/historia y /ar/historia: «Vitácora de una historia» (plan 2026-10-21, Task 4.4). Los textos son
// los aprobados por Naza el 23/10 (_textos/historia.ts), en el lenguaje de la dirección nueva, como /viaje.
//
// ESTÁTICA: no lee headers ni cookies. Con HISTORIA_VENTA="1" los botones llevan a /comprar/historia de su idioma
// y se ve el precio, que es el de Familiar (el libro base, catalogo().base); si no, «Próximamente» y «Escribinos».
//
// Lo que NO dice, a propósito: cuántas preguntas son (Naza, 23/10), páginas, plazos, reseñas ni el marco.
//
// Revisión del 25/10: el libro de Carmen en 3D en el inicio (una historia inventada, «La panadería de Carmen») y
// la foto de Carmen hoy, grabando, en «Para quién». Las fotos son personas generadas (Higgsfield).

const FOTOS = {
  tapa: "/rediseno/historia-carmen-tapa.jpg",
  mostrador: "/rediseno/historia-carmen-mostrador.jpg",
  audio: "/rediseno/historia-carmen-audio.jpg",
} as const;
//
// Orden: 1 inicio (logo, lema, bajada, botones), 2 para quién y las historias, 3 cómo funciona, 4 qué recibe y
// el precio, 5 preguntas frecuentes, 6 cierre con el enlace a Familiar y el pie.

export function PaginaHistoria({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_HISTORIA[idioma];
  const vende = historiaVendeEn(idioma);
  const cat = catalogo(regionDeIdioma(idioma));
  const precio = vende ? cat.base.precio : null;
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  const promo = promoPorcentaje();
  const lista = precio !== null && promo ? formatear(precioDeLista(precio, cat.moneda, promo)) : null;
  const comprar = ruta(idioma, "/comprar/historia");
  const escribir = enlaceEscribir({ correo: { asunto: t.proximamente.asunto, cuerpo: t.proximamente.cuerpo } });

  /** El botón principal: comprar si se vende; si no, escribirnos. */
  const Accion = ({ className = "" }: { className?: string }) =>
    vende ? (
      <Link prefetch={false} href={comprar} className={`dir-boton dir-boton--lleno ${className}`}>
        {t.empezar}
      </Link>
    ) : (
      <a href={escribir.href} {...(escribir.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`dir-boton dir-boton--lleno ${className}`}>
        {t.proximamente.boton}
      </a>
    );

  return (
    <Pagina idioma={idioma}>
      {/* ═══ 1 · INICIO ═══ */}
      <section className="dir-tinta relative">
        <div className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 pt-32 text-center sm:px-8 sm:pb-20 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino="/historia" producto="historia" sobreHero />
          </div>
          <LogoTrazo id="trazo-historia" halo="var(--dir-tinta)" className="w-[124px] sm:w-[180px]" />
          <h1 className="dir-titular dir-t1 dir-asienta mt-7 max-w-[16ch] sm:mt-9 sm:max-w-[22ch]">
            {t.hero.linea1} <em className="dir-destaca block">{t.hero.linea2}</em>
          </h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {t.hero.bajada}
          </p>
          {/* El libro de Carmen: gira y se abre cuando está entero en el medio de la pantalla (Coreografia). */}
          <div data-libro-3d className="l3-seccion prt-libro dir-entra mt-10 w-full sm:mt-12" style={conVar({ "--e": "0.8s" })}>
            <Libro3D
              idioma={idioma}
              b={LIBRO_HISTORIA_EJEMPLO}
              c={{ ...TEXTOS_EJEMPLO.es.libro, ...CAPITULO_HISTORIA_EJEMPLO }}
              diseno={{ tapa: FOTOS.tapa, interior: FOTOS.mostrador }}
            />
          </div>
          <div className="dir-entra mt-10 flex w-full max-w-[358px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4" style={conVar({ "--e": "0.85s" })}>
            <Accion />
            <a href="#como-funciona" className="dir-boton dir-boton--hilo">
              {TEXTOS_PORTADA[idioma].inicio.comoFunciona}
            </a>
          </div>
          {vende ? null : (
            <p className="dir-dato dir-entra mt-6 text-[var(--dir-sobre-tinta-suave)]" style={conVar({ "--e": "0.95s" })}>
              {t.proximamente.titulo}
            </p>
          )}
          <Ventajas items={t.ventajas} className="dir-entra mt-10 text-[var(--dir-sobre-tinta)]" style={conVar({ "--e": "1.05s" })} />
        </div>
      </section>
      {/* La barra de compra del teléfono aparece cuando esto sale de pantalla. */}
      <div id="hero" aria-hidden className="relative h-px" />

      {/* ═══ 2 · PARA QUIÉN, con las historias de la lista (las etiquetas de temas.md) ═══ */}
      <section className="dir-papel dir-hoja dir-deckle relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-12 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-5">
            <h2 className="dir-titular dir-t2">{t.paraQuien.titulo}</h2>
            <p className="dir-parrafo max-w-[44ch]">{t.paraQuien.texto}</p>
            <Foto src={FOTOS.audio} alt={t.altAudio} forma="arco" sizes="(min-width: 768px) 30vw, 78vw" className="mt-6 w-[78%] max-w-[380px]" />
          </div>
          <div className="aparece md:col-span-6 md:col-start-7">
            <p className="dir-dato text-[var(--dir-sobre-papel-suave)]">{t.paraQuien.entrada}</p>
            <ul className="mt-6 border-t border-[var(--dir-hilo-papel)]">
              {HISTORIA_TEMAS.filter((tema) => tema !== "otra").map((tema) => (
                <li key={tema} className="dir-titular border-b border-[var(--dir-hilo-papel)] py-4 text-[24px] leading-[1.15] sm:text-[28px]">
                  {t.temas[tema].nombre}
                </li>
              ))}
            </ul>
            <p className="dir-parrafo mt-6">{t.paraQuien.ultima}</p>
          </div>
        </div>
      </section>

      {/* ═══ 3 · CÓMO FUNCIONA ═══ */}
      <section id="como-funciona" className="dir-tinta dir-hoja relative scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-36 lg:px-12">
          <div className="md:col-span-5">
            <h2 className="dir-titular dir-t2 aparece md:sticky md:top-24">{t.como.titulo}</h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 md:-mt-12">
            <Pasos pasos={t.como.pasos} tinta />
          </div>
        </div>
      </section>

      {/* ═══ 4 · QUÉ RECIBE Y EL PRECIO ═══ */}
      <section data-cta-propio className="dir-papel dir-hoja dir-deckle relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-5">
            <h2 className="dir-titular dir-t2">{t.recibe.titulo}</h2>
            <p className="dir-parrafo max-w-[44ch]">{t.recibe.texto}</p>
          </div>
          <div className="aparece flex flex-col gap-6 md:col-span-5 md:col-start-8">
            <h2 className="dir-titular dir-t3">{t.precio.titulo}</h2>
            {precio !== null ? (
              <p className="flex flex-wrap items-baseline gap-3">
                {lista && promo ? (
                  <span className="dir-dato text-[var(--dir-sobre-papel-suave)]">
                    <s className="mr-2 opacity-70">{lista}</s>
                    <span className="mr-2">−{promo} %</span>
                  </span>
                ) : null}
                <span className="dir-precio">{formatear(precio)}</span>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="dir-titular text-[34px]">{t.proximamente.titulo}</p>
                <p className="dir-parrafo">{t.proximamente.texto}</p>
              </div>
            )}
            <p className="dir-parrafo max-w-[40ch]">{t.precio.texto}</p>
            <Accion className="self-start" />
            <span className="dir-dato text-[var(--dir-sobre-papel-suave)]">{t.precio.nota}</span>
          </div>
        </div>
      </section>

      {/* ═══ 5 · PREGUNTAS FRECUENTES ═══ */}
      <MiniFaq titulo={t.faq.titulo} dudas={t.faq.preguntas.map((d) => ({ pregunta: d.p, respuesta: d.r }))} duda={TEXTOS_PORTADA[idioma].faq.duda} />

      {/* ═══ 6 · CIERRE ═══ */}
      <section data-cta-propio className="dir-tinta relative">
        <div className="flex flex-col items-center px-4 pb-24 pt-24 text-center sm:px-8 md:pb-36 md:pt-36">
          <LogoTrazo id="trazo-cierre-historia" modo="scroll" halo="var(--dir-tinta)" className="w-[104px] sm:w-[130px]" />
          <h2 className="dir-titular dir-t2 aparece mt-12 max-w-[16ch] sm:max-w-none">
            {t.cierre.linea1} <em className="dir-destaca block">{t.cierre.linea2}</em>
          </h2>
          <Accion className="aparece mt-11 w-full max-w-[358px] sm:w-auto" />
          <p className="aparece mt-8 text-[15px]">
            {t.aFamiliar.pregunta}{" "}
            <Link prefetch={false} href={ruta(idioma, "/")} className="dir-enlace">
              {t.aFamiliar.enlace}
            </Link>
          </p>
        </div>
        <Pie idioma={idioma} camino="/historia" />
      </section>

      {/* Como en la portada (revisión del 25/10): el WhatsApp y la barra fija del teléfono, si se vende. */}
      <WhatsAppFlotante idioma={idioma} />
      {precio !== null ? (
        <CtaSticky
          precio={formatear(precio)}
          href={comprar}
          textos={{ desde: "", conImpreso: TEXTOS_PORTADA[idioma].elLibro.pagoUnico, sinImpreso: TEXTOS_PORTADA[idioma].elLibro.pagoUnico, boton: t.empezar }}
        />
      ) : null}
    </Pagina>
  );
}
