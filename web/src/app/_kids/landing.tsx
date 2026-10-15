import Link from "next/link";
import { Pie } from "../_publico";
import { Toroide } from "../marca";
import { Acordeon } from "../_ui/acordeon";
import { TEXTOS_KIDS } from "../_textos/kids";
import { CTA_LANDING_KIDS, RUTAS_LANDING_KIDS, TEXTOS_LANDING_KIDS, type LandingKids } from "../_textos/landing-kids";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { PasosKids, preciosKids } from "./pagina";
import { BotonEscribir, FOTOS_KIDS, FotoKids, PaginaKids, conVar } from "./piezas";

// Las landings de anuncio de Vitácora Kids (/kids/su-mundo y /kids/a-los-once,
// en los tres idiomas; maquetas LandingKidsMundo y LandingKidsOnce con la
// paleta de Kids). Una idea por pantalla: inicio con el titular, la sección
// propia (lo que queda o tres preguntas del banco), cómo funciona, tres dudas
// de /kids y el cierre. Cabecera mínima: el logo y, si se vende, el botón.
//
// ESTÁTICAS. Sin KIDS_VENTA y precio, ningún botón lleva a la compra: dicen
// «Próximamente» y ofrecen escribirnos, como /kids.

export function LandingKidsPagina({ idioma, landing }: { idioma: IdiomaWeb; landing: LandingKids }) {
  const t = TEXTOS_LANDING_KIDS[idioma][landing];
  const k = TEXTOS_KIDS[idioma];
  const cta = CTA_LANDING_KIDS[idioma];
  const { vende, precio, formatear } = preciosKids(idioma);
  const comprar = ruta(idioma, "/comprar/kids");
  const faq = k.faq.preguntas;
  const dudas = [faq[0], faq[2], faq[5]];
  const foto = landing === "mundo" ? FOTOS_KIDS.cuarto : FOTOS_KIDS.audio;
  const dato = vende && precio !== null ? k.desde(formatear(precio)) : k.proximamente;

  const Accion = ({ className = "" }: { className?: string }) =>
    vende ? (
      <Link prefetch={false} href={comprar} className={`kids-boton ${className}`}>
        {cta.comprar}
      </Link>
    ) : (
      <BotonEscribir t={k} className={className} />
    );

  return (
    <PaginaKids idioma={idioma}>
      <header>
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-12">
          <Link prefetch={false} href={ruta(idioma, "/kids")} aria-label={cta.inicio} className="flex min-h-11 items-center gap-3 text-[var(--kids-texto)]">
            <Toroide className="h-7 w-auto" />
            <span className="text-[13px] font-medium tracking-[0.2em] [font-family:var(--fuente-micro)]">VITÁCORA</span>
          </Link>
          {vende ? (
            <Link prefetch={false} href={comprar} className="kids-boton min-h-11 px-5 text-[13.5px]">
              {cta.comprar}
            </Link>
          ) : null}
        </div>
      </header>

      {/* ═══ 1 · INICIO: el titular y la foto ═══ */}
      <section>
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 items-center gap-14 px-4 pb-20 pt-6 sm:px-8 md:grid-cols-12 md:gap-8 md:pb-28 md:pt-12 lg:px-12">
          <div className="flex flex-col items-start gap-7 md:col-span-7">
            <span className="kids-micro kids-entra" style={conVar({ "--e": "0.2s" })}>
              {t.etiqueta}
            </span>
            <h1 className="kids-titular kids-t2 kids-asienta max-w-[18ch]">{t.titulo}</h1>
            <p className="kids-bajada kids-entra max-w-[38ch]" style={conVar({ "--e": "0.45s" })}>
              {t.bajada}
            </p>
            <div className="kids-entra flex w-full flex-col items-start gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-6" style={conVar({ "--e": "0.65s" })}>
              <Accion className="w-full max-w-[358px] sm:w-auto" />
              <span className="kids-dato">{dato}</span>
            </div>
          </div>
          <FotoKids src={foto.src} alt={t.altFoto} forma="arco" priority sizes="(min-width: 768px) 30vw, 78vw" className="w-[78%] justify-self-end md:col-span-4 md:col-start-9 md:w-full" />
        </div>
      </section>

      {/* ═══ 2 · LA SECCIÓN PROPIA ═══ */}
      <section className="kids-hondo">
        <div className="mx-auto max-w-[1100px] px-4 py-24 sm:px-8 md:py-32">
          <h2 className="kids-titular kids-t3 kids-aparece max-w-[18ch]">{t.seccion.titulo}</h2>
          {t.seccion.preguntas ? (
            <ul className="mt-12 flex flex-col">
              {t.seccion.items.map((p, i) => (
                <li key={p} className={`kids-aparece border-t border-[var(--kids-hilo)] py-8 ${i % 2 === 1 ? "md:pl-[12%]" : ""}`}>
                  <p className="kids-cita max-w-[30ch]">«{p}»</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-12 grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-8">
              <ul className="kids-lista kids-aparece max-w-[46ch] md:col-span-5">
                {t.seccion.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <FotoKids src={FOTOS_KIDS.libroAbierto.src} alt={k.libro.altFoto} forma="suave" sizes="(min-width: 768px) 50vw, 92vw" className="w-full md:col-span-7" />
            </div>
          )}
          {t.seccion.pie ? <p className="kids-dato kids-aparece border-t border-[var(--kids-hilo)] pt-6">{t.seccion.pie}</p> : null}
        </div>
      </section>

      {/* ═══ 3 · CÓMO FUNCIONA ═══ */}
      <section>
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-x-8 md:py-32 lg:px-12">
          <div className="md:col-span-5">
            <h2 className="kids-titular kids-t3 kids-aparece max-w-[14ch] md:sticky md:top-24">{t.como.titulo}</h2>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <PasosKids pasos={t.como.pasos} etiqueta={k.como.paso} />
          </div>
        </div>
      </section>

      {/* ═══ 4 · DUDAS ═══ */}
      <section className="kids-hondo">
        <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-4 py-24 sm:px-8 md:grid-cols-12 md:gap-8 md:py-32 lg:px-12">
          <h2 className="kids-titular kids-t3 kids-aparece md:col-span-4">{t.faqTitulo}</h2>
          <div className="kids-aparece border-t border-[var(--kids-hilo)] md:col-span-7 md:col-start-6">
            {dudas.map((d, i) => (
              <Acordeon key={d.pregunta} pregunta={d.pregunta} abierta={i === 0} grupo="dudas-kids">
                {d.respuesta}
              </Acordeon>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5 · CIERRE ═══ */}
      <section>
        <div className="flex flex-col items-center px-4 py-24 text-center sm:px-8 md:py-32">
          <h2 className="kids-titular kids-t2 kids-aparece max-w-[16ch]">
            <em>{t.cierre}</em>
          </h2>
          <div className="kids-aparece mt-10 flex w-full flex-col items-center gap-4">
            <Accion className="w-full max-w-[358px] sm:w-auto" />
            <span className="kids-dato">{dato}</span>
          </div>
          <Link prefetch={false} href={ruta(idioma, "/kids")} className="kids-enlace kids-aparece mt-8">
            {k.etiqueta}
          </Link>
        </div>
        <Pie idioma={idioma} camino={RUTAS_LANDING_KIDS[landing]} />
      </section>
    </PaginaKids>
  );
}
