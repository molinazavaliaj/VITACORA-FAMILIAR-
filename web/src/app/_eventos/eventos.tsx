import Link from "next/link";
import { Cabecera, Pie, WhatsAppFlotante } from "../_publico";
import { Coreografia } from "../_direccion/coreografia";
import { Cajas, Tapa } from "../_portada/cajas";
import type { Caja, TapaCaja } from "../_portada/datos-cajas";
import { BandaFotos, CierreAcuarela, InicioAcuarela, PasosFotos, PreguntasAcuarela, TiendaAcuarela } from "../_portada/piezas-acuarela";
import { Acordeon } from "../_ui/acordeon";
import { TEXTOS_EVENTOS } from "../_textos/eventos";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_PORTADA_INICIO } from "../_textos/portada-inicio";
import { TEXTOS_PORTADA_NUEVA } from "../_textos/portada-nueva";
import { TEXTOS_PRODUCTOS_ACUARELA } from "../_textos/productos-acuarela";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { CONTACTO } from "../legal/titulares";
import { TIPOS_EVENTO } from "@/lib/eventos";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { FormularioEventos } from "./formulario";
import "../_portada/portada.css";
import "./eventos.css";

// /eventos, /ca/eventos y /ar/eventos: Vitácora Eventos (17/10). Vamos al
// evento (boda, cumpleaños, show…), entrevistamos a los invitados y hacemos el
// libro impreso. No se compra en la web: es un «cuéntanos tu evento» que llega
// por mail a los socios (api/eventos).
//
// Con el armado de la portada nueva (06/11) y el acento ciruela: inicio en dos
// columnas con la tapa, el libro en el estante con su nota (sin precio: «Según
// el evento, Consultar»), la banda de foto, las celebraciones, los pasos, el
// formulario, las preguntas y el cierre. Las fotos son de IA (el rincón de
// Vitácora en un casamiento y la carpa negra): no hay de un evento real todavía,
// y nunca se presentan como clientes. Estática.

const CAMINO = "/eventos";
const FOTO_STAND = "/rediseno/eventos-casamiento-stand.jpg";
const FOTO_CARPA = "/rediseno/eventos-carpa-negra.jpg";
const FOTO_LIBRO = "/rediseno/familia-con-el-libro.jpg";

export function Eventos({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_EVENTOS[idioma];
  const n = TEXTOS_PORTADA_NUEVA[idioma];
  const nuevos = TEXTOS_PRODUCTOS_ACUARELA[idioma].eventos;
  const lema = TEXTOS_PUBLICO[idioma].lema;
  const whatsapp = urlWhatsAppDudas();

  const tapa: TapaCaja = { ...TEXTOS_PORTADA_INICIO[idioma].tapaEvento, foto: FOTO_STAND };
  const caja: Caja = {
    id: "evento",
    textos: { titulo: t.etiqueta, linea: n.cajas.evento.linea, ideal: n.cajas.evento.ideal, enlace: t.irAlFormulario },
    tinte: 5,
    tapa,
    filas: [{ etiqueta: n.precios.evento, valor: n.precios.consultar }],
    href: "#contacto",
    marca: null,
  };

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada acu-tema acu-acento-eventos acu-imanes evt flex flex-1 flex-col">
      <Coreografia />

      {/* 1 · Inicio: la tapa del libro de un evento, parada a la derecha. */}
      <InicioAcuarela
        cabecera={<Cabecera idioma={idioma} camino={CAMINO} producto="eventos" sobreHero />}
        titulo={
          <>
            {t.titulo[0]} <br className="hidden sm:block" />
            {t.titulo[1]}
          </>
        }
        bajada={t.bajada}
        botones={
          <>
            <a href="#contacto" className="dir-boton dir-boton--lleno acu-boton">
              {t.irAlFormulario}
            </a>
            <a href="#como-funciona" className="acu-boton-hilo">
              {t.verComo}
            </a>
          </>
        }
        visual={
          <div className="acu-tapa-inicio">
            <Tapa tapa={tapa} />
          </div>
        }
      />

      {/* 2 · Qué es: el libro en el estante, con su nota. Aquí no hay precio: se consulta. */}
      <TiendaAcuarela confianza={t.ventajas} titulo={t.queEs.titulo} bajada={t.queEs.bajada}>
        <Cajas idioma={idioma} cajas={[caja]} whatsapp={whatsapp} />
      </TiendaAcuarela>

      {/* La foto del rincón en un casamiento (Higgsfield, 17/10). Gente inventada: ningún narrador real. */}
      <BandaFotos fotos={[FOTO_STAND]} alt={t.queEs.altFoto} posicion="50% 50%" />

      {/* 3 · Para qué celebraciones */}
      <section className="acu-iman acu-hoja-banda relative z-[3] px-4 py-14 text-center sm:px-8 md:py-20">
        <h2 className="dir-titular dir-t3 mx-auto max-w-[24ch]">{t.tipos.titulo}</h2>
        <ul className="acu-etiquetas mx-auto mt-8 max-w-[760px] justify-center">
          {TIPOS_EVENTO.filter((tipo) => tipo !== "otro").map((tipo) => (
            <li key={tipo}>{t.tipo[tipo]}</li>
          ))}
        </ul>
        <p className="acu-bajada mt-6">{t.tipos.pie}</p>
      </section>

      {/* 4 · Cómo funciona */}
      <PasosFotos
        titulo={t.como.titulo}
        etiqueta={(i) => `${t.como.paso} ${i}`}
        pasos={t.como.pasos.map((paso, i) => ({
          ...paso,
          foto: [FOTO_CARPA, FOTO_STAND, FOTO_LIBRO][i],
          alt: i === 0 ? t.tipos.altFoto : "",
        }))}
      />

      {/* 5 · El formulario */}
      <section id="contacto" className="dir-papel acu-hoja-banda2 relative z-[5] scroll-mt-4 px-4 py-14 sm:px-8 md:py-20">
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="flex flex-col gap-4 md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.formulario.titulo}</h2>
            <p className="acu-parrafo">{t.formulario.bajada}</p>
            <div className="mt-2 flex flex-col items-start gap-3">
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--tinta">
                  {t.formulario.whatsapp}
                </a>
              ) : null}
              <a href={`mailto:${CONTACTO.hola}`} className="acu-enlace">{CONTACTO.hola}</a>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <FormularioEventos idioma={idioma} correo={CONTACTO.hola} />
            <p className="evt-privacidad">
              {t.formulario.privacidad}{" "}
              <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className="underline underline-offset-4">
                {t.formulario.privacidadEnlace}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* 6 · Preguntas */}
      <PreguntasAcuarela titulo={nuevos.faq.titulo} duda={TEXTOS_PORTADA[idioma].faq.duda} whatsapp={whatsapp}>
        {nuevos.faq.preguntas.map((d, i) => (
          <Acordeon key={d.pregunta} pregunta={d.pregunta} abierta={i === 0} grupo="preguntas">
            {d.respuesta}
          </Acordeon>
        ))}
      </PreguntasAcuarela>

      {/* 7 · Cierre */}
      <CierreAcuarela titulo={lema}>
        <a href="#contacto" className="dir-boton dir-boton--lleno acu-boton">
          {t.irAlFormulario}
        </a>
      </CierreAcuarela>
      <div className="dir-tinta relative z-[8]">
        <Pie idioma={idioma} camino={CAMINO} />
      </div>

      <WhatsAppFlotante idioma={idioma} />
    </div>
  );
}
