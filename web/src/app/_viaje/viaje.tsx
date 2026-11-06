import Image from "next/image";
import Link from "next/link";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { Coreografia } from "../_direccion/coreografia";
import { Palabras, conVar } from "../_direccion/piezas";
import { Cajas } from "../_portada/cajas";
import { filasDePrecio, type Caja } from "../_portada/datos-cajas";
import { BandaFotos, CierreAcuarela, InicioAcuarela, PasosFotos, PreguntasAcuarela, TiendaAcuarela } from "../_portada/piezas-acuarela";
import { Acordeon } from "../_ui/acordeon";
import { CAPITULO_VIAJE_EJEMPLO, LIBRO_VIAJE_EJEMPLO, TEXTOS_VIAJE } from "../_textos/viaje";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import { Libro3D, type AlbumViaje } from "../_direccion/libro-3d";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import "../_portada/portada.css";

// /viaje, /ca/viaje y /ar/viaje, con el armado de la portada nueva (06/11): la
// acuarela con el acento azul, el inicio en dos columnas, el libro en el
// estante con su nota de precios, la banda de foto, los pasos grandes, el
// regalo, las preguntas y el cierre. ESTÁTICA; los textos, en _textos/viaje.ts.
//
// Dice lo que hace la Vitácora de Viaje V2, la única que se vende (antes de
// salir, durante, la vuelta, el libro). Nada del viaje viejo, nada de «cada
// noche» (B24), sin reseñas.
// El precio es el de la región del idioma (obtenerPrecioViaje vía catalogo):
// sin PRECIO_VIAJE_* cargado, la página no vende (sin botones, «Próximamente»).
//

const FOTOS = {
  hotel: "/rediseno/viaje-audio-hotel.jpg",
  tapa: "/rediseno/viaje-mirador-lisboa.jpg",
  libro: "/rediseno/viaje-libro-mesa.jpg",
  regalo: "/rediseno/viaje-regalo-aeropuerto.jpg",
  banda: "/rediseno/viaje-ribeira-atardecer.jpg",
  puente: "/rediseno/viaje-oporto-puente.jpg",
} as const;

// Lo que acompaña a cada uno de los cuatro pasos. Fotos hechas con Higgsfield: ilustran.
const FOTOS_PASOS = ["/rediseno/viaje-azulejos.jpg", FOTOS.hotel, "/rediseno/viaje-pasteis-cafe.jpg", FOTOS.libro] as const;

// El álbum que se ve al abrir el libro (Naza, 25/10: un fotolibro, muchas fotos
// y pocas letras). Fotos hechas con Higgsfield a partir de las de Sara y Dani.
const ALBUM: AlbumViaje = {
  izq: [
    "/rediseno/viaje-alfama-tranvia.jpg",
    "/rediseno/viaje-pasteis-cafe.jpg",
    "/rediseno/viaje-oporto-puente.jpg",
    "/rediseno/viaje-azulejos.jpg",
  ],
  der: [FOTOS.hotel, FOTOS.banda],
};

export function PaginaViaje({ idioma }: { idioma: IdiomaWeb }) {
  const v = TEXTOS_VIAJE[idioma];
  const t = TEXTOS_PORTADA[idioma];
  const n = TEXTOS_PORTADA_NUEVA[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (monto: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(monto);
  const precio = cat.viaje;
  const promo = promoPorcentaje();
  const lista = precio !== null && promo ? formatear(precioDeLista(precio, cat.moneda, promo)) : null;
  const comprar = ruta(idioma, "/comprar/viaje");
  const whatsapp = urlWhatsAppDudas();
  const [frase1, frase2] = v.fotos;
  const nFrase = frase1.split(" ").length + frase2.split(" ").length;

  const caja: Caja = {
    id: "viaje",
    textos: { titulo: v.etiqueta, linea: v.precioBloque.texto, ideal: n.cajas.viaje.ideal, enlace: v.comprar },
    tinte: 4,
    tapa: {
      etiqueta: LIBRO_VIAJE_EJEMPLO.etiqueta,
      nombre: LIBRO_VIAJE_EJEMPLO.nombre.join(" "),
      firma: LIBRO_VIAJE_EJEMPLO.paraSiempre,
      foto: FOTOS.tapa,
      apaisado: true,
    },
    filas: precio !== null ? filasDePrecio(idioma, cat, formatear, precio, lista) : [{ etiqueta: n.precios.viaje, valor: v.proximamente }],
    href: precio !== null ? comprar : null,
    marca: precio !== null ? null : "pronto",
  };

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada acu-tema acu-acento-viaje acu-imanes flex flex-1 flex-col">
      <Coreografia />

      {/* 1 · Inicio: el libro de Sara y Dani gira, se abre y queda cerrado (Coreografia). */}
      <InicioAcuarela
        cabecera={<Cabecera idioma={idioma} camino="/viaje" producto="viaje" sobreHero textoComprar={precio !== null ? v.comprar : undefined} />}
        titulo={
          <>
            {v.titulo[0]} <br className="hidden sm:block" />
            {v.titulo[1]}
          </>
        }
        bajada={v.bajada}
        botones={
          <>
            {precio !== null ? (
              <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
                {v.comprar}
              </Link>
            ) : null}
            <a href="#como-funciona" className="acu-boton-hilo">
              {t.inicio.comoFunciona}
            </a>
          </>
        }
        dato={
          precio !== null ? (
            <>
              {lista && promo ? (
                <>
                  <s className="mr-2 opacity-70">{lista}</s>
                  <span className="mr-2">−{promo} %</span>
                </>
              ) : null}
              {v.precio(formatear(precio))}
            </>
          ) : (
            v.proximamente
          )
        }
        visual={
          <div data-libro-3d data-libro-cierra className="l3-seccion prt-libro acu-libro w-full">
            <Libro3D
              idioma={idioma}
              b={LIBRO_VIAJE_EJEMPLO}
              c={{ ...TEXTOS_EJEMPLO.es.libro, ...CAPITULO_VIAJE_EJEMPLO }}
              diseno={{ tapa: FOTOS.tapa, interior: FOTOS.hotel, variante: "viaje", album: ALBUM }}
            />
          </div>
        }
      />
      {/* La barra de compra del teléfono aparece cuando esto sale de pantalla. */}
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* 2 · El libro en el estante, con la nota de precios. */}
      <TiendaAcuarela confianza={v.ventajas} titulo={v.precioBloque.titulo} ctaPropio>
        <Cajas idioma={idioma} cajas={[caja]} whatsapp={whatsapp} />
        <p className="dir-dato mt-2 text-[var(--acu-suave)]">{v.precioBloque.nota}</p>
      </TiendaAcuarela>

      <BandaFotos fotos={[FOTOS.banda]} posicion="50% 55%" />

      {/* 3 · Las fotos quedan: la frase que se completa sola, con una foto del viaje. */}
      <section className="acu-iman acu-hoja-banda relative z-[3] px-4 py-14 sm:px-8 md:py-20">
        <div className="acu-par" data-revela style={conVar({ "--paso": "0.17s" })}>
          <h2 className="dir-titular dir-t3">
            <span className="sr-only">
              {frase1} {frase2}
            </span>
            <span aria-hidden className="block">
              <Palabras texto={frase1} total={nFrase} />
            </span>
            <span aria-hidden className="dir-destaca block">
              <Palabras texto={frase2} desde={frase1.split(" ").length} total={nFrase} />
            </span>
          </h2>
          <div className="acu-par-img">
            <Image src={FOTOS.puente} alt="" fill sizes="(min-width: 820px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      {/* 4 · Cómo funciona */}
      <PasosFotos
        titulo={v.como.titulo}
        etiqueta={t.como.paso}
        z="z-[4]"
        pasos={v.como.pasos.map((paso, i) => ({ ...paso, foto: FOTOS_PASOS[i] }))}
      />

      {/* 5 · El regalo, con la pareja del aeropuerto (revisión del 25/10: Viaje es el más regalable). */}
      <section className="acu-iman acu-hoja-banda2 relative z-[5] px-4 py-14 sm:px-8 md:py-20">
        <div className="acu-par">
          <div className="flex flex-col items-start gap-4">
            <h2 className="dir-titular dir-t3 max-w-[16ch]">{v.regalo.titulo}</h2>
            <p className="acu-parrafo max-w-[42ch]">{v.regalo.texto}</p>
            {precio !== null ? (
              <Link prefetch={false} href={comprar} className="acu-enlace">
                {v.regalo.enlace} <span aria-hidden className="ml-1">→</span>
              </Link>
            ) : null}
          </div>
          <div className="acu-par-img">
            <Image src={FOTOS.regalo} alt={v.regalo.altFoto} fill sizes="(min-width: 820px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      {/* 6 · Preguntas (la garantía de Viaje vive acá: D1) */}
      <PreguntasAcuarela titulo={v.faq.titulo} duda={t.faq.duda} whatsapp={whatsapp}>
        {v.faq.preguntas.map((d, i) => (
          <Acordeon key={d.pregunta} pregunta={d.pregunta} abierta={i === 0} grupo="preguntas">
            {d.respuesta}
          </Acordeon>
        ))}
      </PreguntasAcuarela>

      {/* 7 · Cierre */}
      <CierreAcuarela titulo={`${v.titulo[0]} ${v.titulo[1]}`}>
        {precio !== null ? (
          <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
            {v.comprar}
          </Link>
        ) : null}
        <Link prefetch={false} href={ruta(idioma, "/")} className="acu-enlace">
          {v.familiar}
        </Link>
      </CierreAcuarela>
      <div className="dir-tinta relative z-[8]" data-cta-propio>
        <Pie idioma={idioma} camino="/viaje" landings={["viaje"]} />
      </div>

      {/* Como en la portada (revisión del 25/10): el WhatsApp y la barra fija del teléfono. */}
      <WhatsAppFlotante idioma={idioma} />
      {precio !== null ? (
        <CtaSticky
          precio={formatear(precio)}
          href={comprar}
          variante="acuarela"
          textos={{ desde: "", conImpreso: t.elLibro.pagoUnico, sinImpreso: t.elLibro.pagoUnico, boton: v.comprar }}
        />
      ) : null}
    </div>
  );
}
