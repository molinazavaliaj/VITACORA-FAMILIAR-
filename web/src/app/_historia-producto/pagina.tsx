import Image from "next/image";
import Link from "next/link";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
import { CtaSticky } from "../cta-sticky";
import { Coreografia } from "../_direccion/coreografia";
import { Libro3D } from "../_direccion/libro-3d";
import { Cajas } from "../_portada/cajas";
import { filasDePrecio, type Caja } from "../_portada/datos-cajas";
import { BandaMedios, CierreAcuarela, InicioAcuarela, PasosFotos, PreguntasAcuarela, TiendaAcuarela } from "../_portada/piezas-acuarela";
import { TelefonoWhatsApp } from "../_portada/telefono-whatsapp";
import { Acordeon } from "../_ui/acordeon";
import { enlaceEscribir } from "../_kids/piezas";
import { CAPITULO_HISTORIA_EJEMPLO, LIBRO_HISTORIA_EJEMPLO, TEXTOS_HISTORIA } from "../_textos/historia";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import { HISTORIA_TEMAS, historiaVendeEn } from "@/lib/historia";
import { catalogo } from "@/lib/productos";
import { precioDeLista, promoPorcentaje } from "@/lib/promo";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import "../_portada/portada.css";

// /historia, /ca/historia y /ar/historia: «Vitácora de una historia» (plan
// 2026-10-21, Task 4.4), con el armado de la portada nueva (06/11) y el acento
// verde. Los textos son los aprobados por Naza el 23/10 (_textos/historia.ts).
//
// ESTÁTICA: no lee headers ni cookies. Con HISTORIA_VENTA="1" los botones llevan
// a /comprar/historia de su idioma y se ven los precios, que son los de Familiar
// (el libro base, catalogo().base); si no, «Próximamente» y «Escribinos».
//
// Lo que NO dice, a propósito: cuántas preguntas son (Naza, 23/10), páginas,
// plazos, reseñas ni el marco.
//
// Las fotos son personas generadas (Higgsfield), de una historia inventada: «La
// panadería de Carmen». No hay ninguna ancha: la banda lleva dos, lado a lado.

const FOTOS = {
  tapa: "/rediseno/historia-carmen-tapa.jpg",
  mostrador: "/rediseno/historia-carmen-mostrador.jpg",
  audio: "/rediseno/historia-carmen-audio.jpg",
  empresa: "/rediseno/historia-empresa-libro.jpg",
  empresaTapa: "/rediseno/historia-empresa-tapa.jpg",
} as const;

export function PaginaHistoria({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_HISTORIA[idioma];
  const portada = TEXTOS_PORTADA[idioma];
  const n = TEXTOS_PORTADA_NUEVA[idioma];
  const vende = historiaVendeEn(idioma);
  const cat = catalogo(regionDeIdioma(idioma));
  const precio = vende ? cat.base.precio : null;
  const formatear = (monto: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(monto);
  const promo = promoPorcentaje();
  const lista = precio !== null && promo ? formatear(precioDeLista(precio, cat.moneda, promo)) : null;
  const comprar = ruta(idioma, "/comprar/historia");
  const escribir = enlaceEscribir({ correo: { asunto: t.proximamente.asunto, cuerpo: t.proximamente.cuerpo } });
  const whatsapp = urlWhatsAppDudas();

  /** El botón principal: comprar si se vende; si no, escribirnos. */
  const accion = vende ? (
    <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno acu-boton">
      {t.empezar}
    </Link>
  ) : (
    <a href={escribir.href} {...(escribir.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="dir-boton dir-boton--lleno acu-boton">
      {t.proximamente.boton}
    </a>
  );

  const caja: Caja = {
    id: "historia",
    textos: { titulo: t.marca, linea: vende ? t.precio.texto : t.proximamente.texto, ideal: `${t.precio.titulo} ${t.precio.nota}`, enlace: vende ? t.empezar : t.proximamente.boton },
    tinte: 2,
    tapa: {
      etiqueta: LIBRO_HISTORIA_EJEMPLO.etiqueta,
      nombre: LIBRO_HISTORIA_EJEMPLO.nombre,
      firma: LIBRO_HISTORIA_EJEMPLO.paraSiempre,
      foto: FOTOS.tapa,
      contra: { iniciales: LIBRO_HISTORIA_EJEMPLO.iniciales, texto: LIBRO_HISTORIA_EJEMPLO.contra, escucha: LIBRO_HISTORIA_EJEMPLO.escucha },
    },
    filas: precio !== null ? filasDePrecio(idioma, cat, formatear, precio, lista) : [{ etiqueta: t.marca, valor: t.proximamente.titulo }],
    href: vende ? comprar : escribir.href,
    externo: !vende,
    marca: vende ? null : "pronto",
  };

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada acu-tema acu-acento-historia acu-imanes flex flex-1 flex-col">
      <Coreografia />

      {/* 1 · Inicio: el libro de Carmen gira, se abre y queda cerrado (Coreografia). */}
      <InicioAcuarela
        cabecera={<Cabecera idioma={idioma} camino="/historia" producto="historia" sobreHero textoComprar={t.empezar} />}
        titulo={
          <>
            {t.hero.linea1} <em className="dir-destaca block">{t.hero.linea2}</em>
          </>
        }
        bajada={t.hero.bajada}
        botones={
          <>
            {accion}
            <a href="#como-funciona" className="acu-boton-hilo">
              {portada.inicio.comoFunciona}
            </a>
          </>
        }
        dato={vende ? null : t.proximamente.titulo}
        visual={
          <div data-libro-3d data-libro-cierra className="l3-seccion prt-libro acu-libro w-full">
            <Libro3D
              idioma={idioma}
              b={LIBRO_HISTORIA_EJEMPLO}
              c={{ ...TEXTOS_EJEMPLO.es.libro, ...CAPITULO_HISTORIA_EJEMPLO }}
              diseno={{ tapa: FOTOS.tapa, interior: FOTOS.mostrador }}
            />
          </div>
        }
      />
      {/* La barra de compra del teléfono aparece cuando esto sale de pantalla. */}
      <div id="hero" aria-hidden className="relative z-[2] h-px" />

      {/* 2 · Qué recibe: el libro en el estante, con la nota de precios. */}
      <TiendaAcuarela confianza={t.ventajas} titulo={t.recibe.titulo} bajada={t.recibe.texto} ctaPropio>
        <Cajas idioma={idioma} cajas={[caja]} whatsapp={whatsapp} />
      </TiendaAcuarela>

      {/* La grande pasa a video cuando lo haya. */}
      <BandaMedios
        grande={<Image src={FOTOS.mostrador} alt="" fill sizes="(min-width: 820px) 70vw, 100vw" style={{ objectPosition: "50% 30%" }} />}
        chicas={[FOTOS.empresa, FOTOS.audio]}
      />

      {/* 3 · Para quién, con las historias de la lista (las etiquetas de temas.md). */}
      <section className="acu-iman acu-hoja-banda relative z-[3] px-4 py-14 sm:px-8 md:py-20">
        <div className="acu-par">
          <div className="flex flex-col gap-4">
            <h2 className="dir-titular dir-t3">{t.paraQuien.titulo}</h2>
            <p className="acu-parrafo max-w-[44ch]">{t.paraQuien.texto}</p>
          </div>
          <div className="flex flex-col gap-5">
            <p className="dir-dato text-[var(--acu-suave)]">{t.paraQuien.entrada}</p>
            <ul className="acu-etiquetas">
              {HISTORIA_TEMAS.filter((tema) => tema !== "otra").map((tema) => (
                <li key={tema}>{t.temas[tema].nombre}</li>
              ))}
            </ul>
            <p className="acu-parrafo">{t.paraQuien.ultima}</p>
          </div>
        </div>
      </section>

      {/* 4 · Cómo funciona. El paso de las preguntas lleva el celular, no una foto. */}
      <PasosFotos
        titulo={t.como.titulo}
        etiqueta={portada.como.paso}
        pasos={t.como.pasos.map((paso, i) => ({
          ...paso,
          foto: [FOTOS.empresaTapa, null, FOTOS.audio, FOTOS.tapa][i],
          alt: i === 2 ? t.altAudio : "",
          ilustracion: <div aria-hidden className="h-full"><TelefonoWhatsApp idioma={idioma} /></div>,
        }))}
      />

      {/* 5 · Preguntas (la garantía vive acá: D1) */}
      <PreguntasAcuarela titulo={t.faq.titulo} duda={portada.faq.duda} whatsapp={whatsapp}>
        {t.faq.preguntas.map((d, i) => (
          <Acordeon key={d.p} pregunta={d.p} abierta={i === 0} grupo="preguntas">
            {d.r}
          </Acordeon>
        ))}
      </PreguntasAcuarela>

      {/* 6 · Cierre */}
      <CierreAcuarela
        titulo={
          <>
            {t.cierre.linea1} <em className="dir-destaca block">{t.cierre.linea2}</em>
          </>
        }
      >
        {accion}
        <p className="text-[15px] text-[var(--acu-suave)]">
          {t.aFamiliar.pregunta}{" "}
          <Link prefetch={false} href={ruta(idioma, "/")} className="acu-enlace">
            {t.aFamiliar.enlace}
          </Link>
        </p>
      </CierreAcuarela>
      <div className="dir-tinta relative z-[8]" data-cta-propio>
        <Pie idioma={idioma} camino="/historia" />
      </div>

      {/* Como en la portada (revisión del 25/10): el WhatsApp y la barra fija del teléfono, si se vende. */}
      <WhatsAppFlotante idioma={idioma} />
      {precio !== null ? (
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
