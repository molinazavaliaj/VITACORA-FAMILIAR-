import Link from "next/link";
import { Cabecera, Pie } from "../_publico";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { Foto, Palabras, conVar } from "../_direccion/piezas";
import { MiniFaq, Pagina, Pasos } from "../_landing/landing";
import { CAPITULO_VIAJE_EJEMPLO, LIBRO_VIAJE_EJEMPLO, TEXTOS_VIAJE } from "../_textos/viaje";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { Libro3D, type AlbumViaje } from "../_direccion/libro-3d";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import "../_direccion/direccion.css";
import "../_portada/portada.css";

// /viaje, /ca/viaje y /ar/viaje (rediseño 2026-10, fase 4; maquetas Viaje y
// ViajeMovil, pasadas a la dirección «la web es un libro»). Antes era una sola
// página en vos con la paleta vieja (violeta); ahora es la misma pantalla en
// los tres idiomas, ESTÁTICA, con los textos de _textos/viaje.ts.
//
// 16/10: dice lo que hace la Vitácora de Viaje V2, la única que se vende
// (antes de salir, durante, la vuelta, el libro). Nada del viaje viejo, nada de
// «cada noche» (B24), sin reseñas.
// El precio es el de la región del idioma (obtenerPrecioViaje vía catalogo):
// sin PRECIO_VIAJE_* cargado, la página no vende (sin botones, «Próximamente»).
//
// Orden: 1 inicio como el de Familiar con el libro de viaje en 3D (19/10), 2 «Las fotos
// quedan» con la foto del hotel, 3 cómo
// funciona, 4 el precio con el libro sobre la mesa, 5 preguntas (la garantía
// de Viaje, solo ahí: D1), 6 cierre con el logo y el pie.

const FOTOS = {
  hotel: "/rediseno/viaje-audio-hotel.jpg",
  tapa: "/rediseno/viaje-mirador-lisboa.jpg",
  libro: "/rediseno/viaje-libro-mesa.jpg",
} as const;

// El álbum que se ve al abrir el libro (Naza, 25/10: un fotolibro, muchas fotos
// y pocas letras). Fotos hechas con Higgsfield a partir de las de Sara y Dani.
const ALBUM: AlbumViaje = {
  izq: [
    "/rediseno/viaje-alfama-tranvia.jpg",
    "/rediseno/viaje-pasteis-cafe.jpg",
    "/rediseno/viaje-oporto-puente.jpg",
    "/rediseno/viaje-azulejos.jpg",
  ],
  der: [FOTOS.hotel, "/rediseno/viaje-ribeira-atardecer.jpg"],
};

export function PaginaViaje({ idioma }: { idioma: IdiomaWeb }) {
  const v = TEXTOS_VIAJE[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  const precio = cat.viaje;
  const promo = promoPorcentaje();
  const lista = precio !== null && promo ? formatear(precioDeLista(precio, cat.moneda, promo)) : null;
  const comprar = ruta(idioma, "/comprar/viaje");
  const [frase1, frase2] = v.fotos;
  const nFrase = frase1.split(" ").length + frase2.split(" ").length;

  const Promo = () =>
    lista && promo ? (
      <>
        <s className="mr-2 opacity-70">{lista}</s>
        <span className="mr-2">−{promo} %</span>
      </>
    ) : null;

  return (
    <Pagina idioma={idioma} producto="viaje">
      {/* ═══ 1 · INICIO, como el de Familiar (Naza, 19/10): el logo que se dibuja,
          el lema enorme centrado, la bajada y el libro de viaje en 3D ═══ */}
      <section className="dir-tinta relative">
        <div className="relative flex min-h-[100svh] flex-col items-center px-4 pb-16 pt-32 text-center sm:px-8 sm:pb-20 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino="/viaje" producto="viaje" sobreHero />
          </div>
          <LogoTrazo id="trazo-viaje" halo="var(--dir-tinta)" className="w-[124px] sm:w-[180px]" />
          <h1 className="dir-titular dir-t1 dir-asienta mt-7 max-w-[13ch] sm:mt-9 sm:max-w-none">
            {v.titulo[0]} <br className="hidden sm:block" />
            {v.titulo[1]}
          </h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {v.bajada}
          </p>
          {/* El libro de Sara y Dani: gira y se abre cuando está entero en el medio
              de la pantalla (Coreografia, data-libro-3d); tocarlo lo repite. */}
          <div data-libro-3d className="l3-seccion prt-libro dir-entra mt-10 w-full sm:mt-12" style={conVar({ "--e": "0.85s" })}>
            <Libro3D
              idioma={idioma}
              b={LIBRO_VIAJE_EJEMPLO}
              c={{ ...TEXTOS_EJEMPLO.es.libro, ...CAPITULO_VIAJE_EJEMPLO }}
              diseno={{ tapa: FOTOS.tapa, interior: FOTOS.hotel, variante: "viaje", album: ALBUM }}
            />
          </div>
          <div className="dir-entra mt-10 flex w-full max-w-[358px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4" style={conVar({ "--e": "0.95s" })}>
            {precio !== null ? (
              <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno">
                {v.comprar}
              </Link>
            ) : null}
            <a href="#como-funciona" className="dir-boton dir-boton--hilo">
              {TEXTOS_PORTADA[idioma].inicio.comoFunciona}
            </a>
          </div>
          <p className="dir-dato dir-entra mt-6 text-[var(--dir-sobre-tinta-suave)]" style={conVar({ "--e": "1.05s" })}>
            {precio !== null ? (
              <>
                <Promo />
                {v.precio(formatear(precio))}
              </>
            ) : (
              v.proximamente
            )}
          </p>
        </div>
      </section>

      {/* ═══ 2 · LAS FOTOS QUEDAN: la frase que se completa sola y la foto del hotel en arco ═══ */}
      <section className="dir-tinta dir-hoja relative">
        <div
          data-revela
          className="mx-auto grid w-full max-w-[1360px] grid-cols-1 items-center gap-12 px-4 pb-28 pt-20 sm:px-8 md:pb-40 lg:grid-cols-12 lg:gap-8 lg:px-12"
          style={conVar({ "--paso": "0.17s" })}
        >
          <h2 className="dir-titular dir-txl viaje-frase lg:col-span-7">
            <span className="sr-only">
              {frase1} {frase2}
            </span>
            <span aria-hidden className="block">
              <Palabras texto={frase1} total={nFrase} />
            </span>
            <span aria-hidden className="dir-destaca block sm:pl-[0.9em] lg:pl-[1.6em]">
              <Palabras texto={frase2} desde={frase1.split(" ").length} total={nFrase} />
            </span>
          </h2>
          <Foto
            src={FOTOS.hotel}
            alt={v.altHotel}
            forma="arco"
            sizes="(min-width: 1024px) 24vw, 70vw"
            className="w-[70%] justify-self-end lg:col-span-3 lg:col-start-10 lg:w-full"
          />
        </div>
      </section>

      {/* ═══ 3 · CÓMO FUNCIONA ═══ */}
      <section id="como-funciona" className="dir-papel dir-hoja dir-deckle relative scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-36 lg:px-12">
          <div className="md:col-span-5">
            <h2 className="dir-titular dir-t2 aparece md:sticky md:top-24">{v.como.titulo}</h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 md:-mt-12">
            <Pasos pasos={v.como.pasos} />
          </div>
        </div>
      </section>

      {/* ═══ 4 · EL PRECIO, con el libro del viaje sobre la mesa ═══ */}
      <section data-cta-propio className="dir-tinta dir-hoja relative">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-36 lg:px-12">
          <Foto src={FOTOS.libro} alt={v.altLibro} forma="ovalo" apaisada sizes="(min-width: 768px) 46vw, 92vw" className="w-full md:col-span-6" />
          <div className="aparece flex flex-col gap-6 md:col-span-5 md:col-start-8">
            <h2 className="dir-titular dir-t3">{v.precioBloque.titulo}</h2>
            {precio !== null ? (
              <p className="flex flex-wrap items-baseline gap-3">
                {lista ? (
                  <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">
                    <Promo />
                  </span>
                ) : null}
                <span className="dir-precio">{formatear(precio)}</span>
              </p>
            ) : (
              <p className="dir-titular text-[34px]">{v.proximamente}</p>
            )}
            <p className="dir-parrafo max-w-[40ch]">{v.precioBloque.texto}</p>
            {precio !== null ? (
              <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno self-start">
                {v.comprar}
              </Link>
            ) : null}
            <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{v.precioBloque.nota}</span>
          </div>
        </div>
      </section>

      {/* ═══ 5 · PREGUNTAS (la garantía de Viaje vive acá: D1) ═══ */}
      <MiniFaq titulo={v.faq.titulo} dudas={v.faq.preguntas} papel />

      {/* ═══ 6 · CIERRE ═══ */}
      <section data-cta-propio className="dir-tinta relative">
        <div className="flex flex-col items-center px-4 pb-24 pt-24 text-center sm:px-8 md:pb-36 md:pt-36">
          <LogoTrazo id="trazo-cierre-viaje" modo="scroll" halo="var(--dir-tinta)" className="w-[104px] sm:w-[130px]" />
          <h2 className="dir-titular dir-t2 aparece mt-12 max-w-[13ch] sm:max-w-none">
            {v.titulo[0]} <br className="hidden sm:block" />
            {v.titulo[1]}
          </h2>
          {precio !== null ? (
            <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno aparece mt-11 w-full max-w-[358px] sm:w-auto">
              {v.comprar}
            </Link>
          ) : null}
          <Link prefetch={false} href={ruta(idioma, "/")} className="dir-enlace aparece mt-8 text-[15px]">
            {v.familiar}
          </Link>
        </div>
        <Pie idioma={idioma} camino="/viaje" />
      </section>
    </Pagina>
  );
}
