import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecera } from "../../_publico";
import { LogoTrazo } from "../../_direccion/logo-trazo";
import { VideoLibro } from "../../_direccion/video-libro";
import { Libro3D } from "../../_direccion/libro-3d";
import { TEXTOS_EJEMPLO } from "../../_textos/ejemplo";
import type { TextosPortada } from "../../_textos/portada";
import { conVar } from "../../_direccion/piezas";
import { PaginaKidsCompleta, preciosKids } from "../../_kids/pagina";
import { BotonEscribir } from "../../_kids/piezas";
import { PaginaViaje } from "../../_viaje/viaje";
import { TEXTOS_KIDS } from "../../_textos/kids";
import { TEXTOS_VIAJE } from "../../_textos/viaje";
import { TEXTOS_PORTADA } from "../../_textos/portada";
import { catalogo } from "@/lib/productos";
import { localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";

// Mockups del inicio de Kids y Viaje con el esquema de Familiar (Naza, 19/10):
// el logo que se dibuja arriba al centro, el lema enorme centrado, la bajada,
// el libro (en video) y los botones. Debajo sigue la página de hoy, igual.
// Solo para mirar en la preview: en producción da 404 y no se indexa.
// /prueba-heroes/kids, /prueba-heroes/viaje; ?idioma=ar o ?idioma=ca.

export const metadata: Metadata = { title: "Prueba de inicio", robots: { index: false, follow: false } };

function idiomaDe(v: string | string[] | undefined): IdiomaWeb {
  return v === "ar" || v === "ca" ? v : "es";
}

function HeroKids({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_KIDS[idioma];
  const { vende, precio, formatear } = preciosKids(idioma);
  return (
    <section className="relative">
      <div className="relative flex min-h-[100svh] flex-col items-center px-4 pb-16 pt-32 text-center sm:px-8 sm:pb-20 sm:pt-36">
        <div className="absolute inset-x-0 top-0">
          <Cabecera idioma={idioma} camino="/kids" producto="kids" sobreHero />
        </div>
        <LogoTrazo id="trazo-kids" halo="var(--kids-fondo)" className="w-[124px] text-[var(--kids-texto)] sm:w-[180px]" />
        <h1 className="kids-titular dir-t1 kids-asienta mt-7 max-w-[13ch] sm:mt-9 sm:max-w-[16ch]">
          {t.titulo[0]} <em>{t.titulo[1]}</em>
        </h1>
        <p className="kids-bajada kids-entra mx-auto mt-6 max-w-[40ch] sm:mt-8" style={conVar({ "--e": "0.7s" })}>
          {t.bajada}
        </p>
        <VideoLibro
          src="/video/kids-libro.mp4"
          poster="/video/kids-libro-poster.jpg"
          alt={t.dibujos.altVideo}
          ancho={1120}
          alto={640}
          sizes="(min-width: 960px) 880px, 100vw"
          className="kids-video kids-entra mt-10 w-full max-w-[880px] sm:mt-12"
        />
        <div className="kids-entra mt-10 flex w-full max-w-[358px] flex-col items-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4" style={conVar({ "--e": "0.95s" })}>
          {vende ? (
            <Link prefetch={false} href={ruta(idioma, "/comprar/kids")} className="kids-boton w-full sm:w-auto">
              {t.empezar}
            </Link>
          ) : (
            <BotonEscribir t={t} className="w-full sm:w-auto" />
          )}
          <a href="#como-funciona" className="kids-boton kids-boton--hilo w-full sm:w-auto">
            {TEXTOS_PORTADA[idioma].inicio.comoFunciona}
          </a>
        </div>
        <p className="kids-dato kids-entra mt-6" style={conVar({ "--e": "1.05s" })}>
          {vende && precio !== null ? t.desde(formatear(precio)) : t.proximamente}
        </p>
      </div>
    </section>
  );
}

// El libro de viaje de ejemplo (19/10, SOLO para el mockup: textos inventados,
// sin aprobar). Como el de Osvaldo, en castellano en los tres idiomas.
const LIBRO_VIAJE: TextosPortada["direccion"]["libro"] = {
  etiqueta: "El libro de nuestro viaje",
  nombre: ["Lisboa ·", "Oporto"],
  paraSiempre: "Sara y Dani",
  iniciales: "S · D",
  lomo: "Lisboa · Oporto · El libro de nuestro viaje",
  contra: "Estas páginas guardan el viaje de Sara y Dani a Lisboa y Oporto, contado con sus propias palabras y sus fotos. En este QR, sus audios del viaje.",
  escucha: "Escucha el viaje",
  web: "vitacorafamiliar.com",
};
const CAPITULO_VIAJE = {
  ...TEXTOS_EJEMPLO.es.libro,
  capitulo: "Día 1",
  tituloCapitulo: "Alfama",
  citaCapitulo: "«Nos perdimos tres veces antes de encontrar el mirador.»",
  parrafos: [
    "Llegamos con las mochilas y sin reserva para cenar. Dani quería subir caminando y yo quería el tranvía. Subimos caminando.",
    "Arriba había un señor tocando la guitarra y el río se ponía naranja. Nos quedamos hasta que no se veía nada.",
  ] as [string, string],
  altFoto: "Sara grabando un audio en la cama del hotel",
  pieFoto: "La primera tarde en el hotel, contando el día.",
};

function HeroViaje({ idioma }: { idioma: IdiomaWeb }) {
  const v = TEXTOS_VIAJE[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const precio = cat.viaje;
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  return (
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
        {/* El libro de viaje en 3D, como el de Osvaldo en Familiar: gira y se abre en el medio de la pantalla. */}
        <div data-libro-3d className="l3-seccion dir-entra mt-10 w-full sm:mt-12" style={conVar({ "--e": "0.85s" })}>
          <Libro3D
            idioma={idioma}
            b={LIBRO_VIAJE}
            c={CAPITULO_VIAJE}
            diseno={{ tapa: "/rediseno/viaje-mirador-lisboa.jpg", interior: "/rediseno/viaje-audio-hotel.jpg", variante: "viaje" }}
          />
        </div>
        <div className="dir-entra mt-10 flex w-full max-w-[358px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4" style={conVar({ "--e": "0.95s" })}>
          {precio !== null ? (
            <Link prefetch={false} href={ruta(idioma, "/comprar/viaje")} className="dir-boton dir-boton--lleno">
              {v.comprar}
            </Link>
          ) : null}
          <a href="#como-funciona" className="dir-boton dir-boton--hilo">
            {TEXTOS_PORTADA[idioma].inicio.comoFunciona}
          </a>
        </div>
        <p className="dir-dato dir-entra mt-6 text-[var(--dir-sobre-tinta-suave)]" style={conVar({ "--e": "1.05s" })}>
          {precio !== null ? v.precio(formatear(precio)) : v.proximamente}
        </p>
      </div>
    </section>
  );
}

export default async function PruebaHeroes({ params, searchParams }: PageProps<"/prueba-heroes/[producto]">) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const { producto } = await params;
  const idioma = idiomaDe((await searchParams).idioma);
  if (producto === "kids") return <PaginaKidsCompleta idioma={idioma} hero={<HeroKids idioma={idioma} />} />;
  if (producto === "viaje") return <PaginaViaje idioma={idioma} hero={<HeroViaje idioma={idioma} />} />;
  notFound();
}
