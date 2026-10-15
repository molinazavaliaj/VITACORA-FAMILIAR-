import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Acordeon } from "../_ui/acordeon";
import { IconoWhatsApp, Pie } from "../_publico";
import { TEXTOS_MAQUETA } from "../_textos/maqueta";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { DemoMarco } from "../_portada/demo-marco";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { Foto, ListaHilo } from "../_direccion/piezas";
import { catalogo } from "@/lib/productos";
import { localeDeIdioma, regionDeIdioma, ruta } from "@/lib/idioma-web";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";

// La PARTE 3 de la maqueta escondida (15/10): el libro con su único precio,
// los marcos, el regalo, las preguntas y el cierre con el pie. Textos 21 a 30
// de docs/rediseno-2026-10/amigo/textos.md (en _textos/maqueta.ts); la lista
// de preguntas, «¿Te queda alguna duda?», la demo del marco y sus pasos salen
// tal cual de portada.ts. Las piezas copian el armado de la portada real
// (_portada/portada.tsx, secciones 10, 12, 13, preguntas y 18) sin tocarla.
//
// El precio: UNO solo en toda la maqueta, el del libro impreso con el PDF
// (PRECIO_EUR/ARS + PRECIO_IMPRESO_EUR/ARS, leídos al construir, como en la
// portada). Sin impreso en la región no se muestra ningún número (nunca
// «desde»). El marco: 19 € literal en el texto de España; en Argentina, de
// PRECIO_MARCO_ARS, y sin esa variable la frase va sin número.
//
// Capas: ninguna es [data-capa]. Bajan con la página, cada una con su borde,
// así nunca tapan algo que se está leyendo (la regla de las hojas).

const FOTOS = {
  portada: "/rediseno/libro-osvaldo-portada.jpg",
  contraportada: "/rediseno/libro-osvaldo-contraportada.jpg",
  marco: "/rediseno/marco-en-casa.jpg",
  abuelo: "/rediseno/para-tu-abuelo.jpg",
} as const;

export function MaquetaParte3({ idioma }: { idioma: "es" | "ar" }) {
  const t = TEXTOS_MAQUETA[idioma];
  const p = TEXTOS_PORTADA[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const formatear = (n: number) =>
    new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(n);
  // El libro impreso con el PDF: la base más el primer impreso.
  const precioLibro = cat.impreso ? formatear(cat.base.precio + cat.impreso.precio) : null;
  const precioMarco = cat.marco ? formatear(cat.marco.precio) : null;
  const comprar = ruta(idioma, "/comprar");
  const whatsapp = urlWhatsAppDudas();

  // La lista aprobada de la portada, con la primera cambiada (29) y las dos
  // nuevas (27 y 28) al final.
  const preguntas = [
    { ...p.faq.preguntas[0], pregunta: t.preguntas.usarlo },
    ...p.faq.preguntas.slice(1),
    ...t.preguntas.nuevas,
  ];

  return (
    <>
      {/* ═══ 6 · EL LIBRO, sobre tinta: los tres beneficios, qué incluye y el
          único precio, con la tapa y la contratapa de Osvaldo. ═══ */}
      <section className="dir-tinta dir-hoja dir-diferido relative z-[6]">
        <div className="mx-auto max-w-[1360px] px-4 py-28 sm:px-8 md:py-40 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-12 md:gap-8">
            <h2 className="dir-titular dir-t2 aparece max-w-[14ch] md:col-span-6">{t.libro.titulo}</h2>
            <div className="aparece mq-par flex justify-center md:col-span-5 md:col-start-8">
              <div className="mq-par-tapa">
                <Image src={FOTOS.portada} alt={p.libro.altPortada} width={376} height={520} sizes="(min-width: 768px) 220px, 44vw" />
              </div>
              <div className="mq-par-contra">
                <Image src={FOTOS.contraportada} alt={p.voz.altContraportada} width={378} height={520} sizes="(min-width: 768px) 220px, 44vw" />
              </div>
            </div>
          </div>

          <ul className="mt-20 grid grid-cols-1 gap-10 border-t border-[var(--dir-hilo-tinta)] pt-12 md:mt-28 md:grid-cols-3 md:gap-8 md:pt-16">
            {t.libro.beneficios.map((b) => (
              <li key={b.titulo} className="aparece flex flex-col gap-3">
                <span className="dir-titular mq-dorado text-[30px] leading-[1.1] sm:text-[36px]">{b.titulo}</span>
                <span className="max-w-[34ch] text-[18px] font-light leading-[1.6] text-[var(--dir-sobre-tinta-suave)]">{b.texto}</span>
              </li>
            ))}
          </ul>

          <div className="mt-20 grid grid-cols-1 items-end gap-14 border-t border-[var(--dir-hilo-tinta)] pt-12 md:mt-28 md:grid-cols-12 md:gap-8 md:pt-16">
            <div className="aparece md:col-span-6">
              <ListaHilo items={t.libro.incluye} tinta />
            </div>
            <div className="aparece flex flex-col gap-6 md:col-span-5 md:col-start-8">
              {precioLibro ? (
                <p className="flex flex-col gap-3">
                  <span className="dir-precio">{precioLibro}</span>
                  <span className="dir-dato text-[var(--dir-sobre-tinta-suave)]">{t.libro.pagoUnico}</span>
                </p>
              ) : null}
              <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno w-full max-w-[358px] sm:w-auto sm:self-start">
                {t.iniciar}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 7 · MARCOS, en papel: la demo del marco con chip de la portada ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[7]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <div className="aparece flex flex-col gap-6 md:col-span-6">
            <h2 className="dir-titular dir-t3 max-w-[16ch]">{t.marcos.titulo}</h2>
            <p className="dir-parrafo max-w-[42ch]">{t.marcos.texto(precioMarco)}</p>
          </div>
          <div className="aparece md:col-span-5 md:col-start-8">
            <DemoMarco
              foto={FOTOS.marco}
              altFoto={p.marco.altMarco}
              portada={FOTOS.portada}
              telefonoQuieto={p.marco.telefonoQuieto}
              telefonoLibro={p.marco.telefonoLibro}
              pasos={p.marco.pasos}
            />
          </div>
        </div>
      </section>

      {/* ═══ 8 · REGALO, sobre tinta: el abuelo con la tarjeta ═══ */}
      <section className="dir-tinta dir-hoja dir-diferido relative z-[8]">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-16 px-4 py-28 sm:px-8 md:grid-cols-12 md:gap-8 md:py-40 lg:px-12">
          <Foto
            src={FOTOS.abuelo}
            alt={p.diciembre.altFoto}
            forma="arco"
            sizes="(min-width: 768px) 34vw, 78vw"
            className="w-[78%] md:col-span-4 md:w-full"
          />
          <div className="aparece flex flex-col gap-6 md:col-span-7 md:col-start-6">
            <h2 className="dir-titular dir-t3 max-w-[16ch]">{t.regalo.titulo}</h2>
            <p className="dir-parrafo max-w-[42ch]">{t.regalo.texto}</p>
          </div>
        </div>
      </section>

      {/* ═══ 9 · PREGUNTAS, en papel; «¿Te queda alguna duda?» va DESPUÉS ═══ */}
      <section id="preguntas" className="dir-papel dir-hoja dir-deckle dir-diferido relative z-[9] scroll-mt-6">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-12 px-4 pb-28 pt-28 sm:px-8 md:grid-cols-12 md:gap-8 md:pb-40 md:pt-40 lg:px-12">
          <div className="aparece md:col-span-4">
            <h2 className="dir-titular dir-t3">{t.preguntas.titulo}</h2>
          </div>
          <div className="aparece flex flex-col gap-14 md:col-span-7 md:col-start-6">
            <div className="border-t border-[var(--dir-hilo-papel)]">
              {preguntas.map((q, i) => (
                <Fragment key={q.pregunta}>
                  <Acordeon pregunta={q.pregunta} abierta={i === 0} grupo="preguntas">
                    {q.respuesta}
                  </Acordeon>
                  {/* La duda que la portada suma después de la segunda (15/10). */}
                  {i === 1 ? (
                    <Acordeon pregunta={p.dudas.hablar.pregunta} grupo="preguntas">
                      {p.dudas.hablar.texto}
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {p.dudas.hablar.temas.map((tema) => (
                          <li key={tema} className="dir-tema">
                            {tema}
                          </li>
                        ))}
                      </ul>
                    </Acordeon>
                  ) : null}
                </Fragment>
              ))}
            </div>
            {whatsapp ? (
              <div className="flex flex-col gap-3">
                <span className="dir-pie">{p.faq.duda.titulo}</span>
                <p className="text-[16px] font-light leading-[1.55] text-[var(--dir-sobre-papel-suave)]">{p.faq.duda.texto}</p>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="dir-boton dir-boton--tinta self-start">
                  <IconoWhatsApp className="mr-2 h-4 w-4" />
                  {p.faq.duda.boton}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ═══ 10 · CIERRE: el lema grande y el botón; abajo, el pie ═══ */}
      <section className="dir-tinta dir-hoja dir-diferido relative z-[10]">
        <div className="flex flex-col items-center px-4 pb-28 pt-28 text-center sm:px-8 md:pb-40 md:pt-40">
          <LogoTrazo id="trazo-cierre-maqueta" modo="scroll" halo="var(--dir-tinta)" className="w-[120px] sm:w-[150px]" />
          <h2 className="dir-titular dir-t2 aparece mt-14 max-w-[14ch]">{t.cierre}</h2>
          <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno aparece mt-11 w-full max-w-[358px] sm:w-auto">
            {t.iniciar}
          </Link>
        </div>
        <Pie idioma={idioma} camino="/maqueta" />
      </section>
    </>
  );
}
