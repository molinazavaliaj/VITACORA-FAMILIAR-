import Link from "next/link";
import { Cabecera } from "../_publico";
import { TEXTOS_MAQUETA } from "../_textos/maqueta";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { langDeIdioma, ruta } from "@/lib/idioma-web";
import { LogoTrazo } from "../_direccion/logo-trazo";
import { Coreografia } from "../_direccion/coreografia";
import { Libro3D } from "../_direccion/libro-3d";
import { conVar } from "../_direccion/piezas";
import "../_direccion/direccion.css";
import "./maqueta.css";

// La maqueta escondida de la parte de ARRIBA de la portada nueva (15/10):
// /maqueta y /ar/maqueta, sin enlaces ni sitemap, noindex. Es para que Naza
// decida en el celular cómo queda el orden de docs/rediseno-2026-10/amigo/
// maquetas/1-arriba.html con la estética real. No toca la portada: usa las
// mismas piezas (logo que se dibuja, libro 3D, coreografía, tinta, papel con
// borde cortado) y los textos nuevos de _textos/maqueta.ts.
//
// Capas, con la regla de la portada (Naza 15/10): una hoja solo tapa a la
// anterior cuando lo que se estaba leyendo ya pasó. El inicio es la única
// capa ([data-capa]): se fija recién cuando su final llega al borde de abajo
// de la pantalla, y ahí sube «Qué es» y lo tapa.

export function MaquetaArriba({ idioma }: { idioma: "es" | "ar" }) {
  const t = TEXTOS_MAQUETA[idioma];
  const comprar = ruta(idioma, "/comprar");
  const panel = ruta(idioma, "/maqueta/panel");

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina dir-portada flex flex-1 flex-col">
      <Coreografia />

      {/* ═══ 1 · INICIO, sobre tinta. Capa: queda fija detrás cuando termina. ═══ */}
      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative flex min-h-[100svh] flex-col items-center px-4 pb-16 pt-32 text-center sm:px-8 sm:pb-20 sm:pt-36">
          <div className="absolute inset-x-0 top-0">
            <Cabecera idioma={idioma} camino="/" sobreHero />
          </div>
          <LogoTrazo id="trazo-maqueta" halo="var(--dir-tinta)" className="w-[124px] sm:w-[180px]" />

          <h1 className="dir-titular dir-t1 dir-asienta mt-7 max-w-[13ch] sm:mt-9 sm:max-w-none">
            {t.titulo[0]} <br className="hidden sm:block" />
            {t.titulo[1]}
          </h1>
          <p className="dir-entra dir-bajada-hero mt-6 sm:mt-8" style={conVar({ "--e": "0.7s" })}>
            {t.bajada}
          </p>

          {/* El libro de Osvaldo: gira y se abre cuando está entero en el medio
              de la pantalla (Coreografia, data-libro-3d); tocarlo lo repite. */}
          <div data-libro-3d className="l3-seccion mq-libro dir-entra mt-10 w-full sm:mt-12" style={conVar({ "--e": "0.85s" })}>
            <Libro3D idioma={idioma} b={TEXTOS_PORTADA[idioma].direccion.libro} c={TEXTOS_EJEMPLO[idioma].libro} />
          </div>

          <div
            className="dir-entra mt-10 flex w-full max-w-[358px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4"
            style={conVar({ "--e": "0.95s" })}
          >
            <Link prefetch={false} href={comprar} className="dir-boton dir-boton--lleno">
              {t.iniciar}
            </Link>
            <a href="#como-funciona" className="dir-boton dir-boton--hilo">
              {t.comoFunciona}
            </a>
          </div>

          <ul className="mq-ventajas dir-entra mt-10" style={conVar({ "--e": "1.05s" })}>
            {t.ventajas.map((v) => (
              <li key={v}>
                <Tilde />
                <span>{v}</span>
              </li>
            ))}
          </ul>

          <p className="mq-propio dir-entra mt-10" style={conVar({ "--e": "1.15s" })}>
            {t.propio.pregunta}{" "}
            <Link prefetch={false} href={comprar} className="dir-enlace">
              {t.propio.enlace}
            </Link>
          </p>
        </div>
      </section>

      {/* ═══ 2 · QUÉ ES, hoja de papel que sube y tapa el inicio ═══ */}
      <section className="dir-papel dir-hoja dir-deckle dir-sobre-1 relative z-[2]">
        <div className="mx-auto max-w-[1360px] px-4 pb-24 pt-24 sm:px-8 md:pb-32 md:pt-36 lg:px-12">
          <div className="aparece flex flex-col gap-6">
            <span className="dir-micro mq-etiqueta">{t.queEs.etiqueta}</span>
            <h2 className="dir-titular dir-t3 max-w-[18ch]">{t.queEs.titulo}</h2>
            <p className="dir-parrafo max-w-[44ch]">{t.queEs.bajada}</p>
          </div>

          <div className="mt-20 grid grid-cols-1 items-center gap-16 border-t border-[var(--dir-hilo-papel)] pt-16 md:mt-28 md:grid-cols-12 md:gap-8 md:pt-24">
            <div className="aparece flex flex-col gap-8 md:col-span-6">
              <h3 className="dir-titular dir-t4">{t.siguiendo.titulo}</h3>
              <ol className="mq-pasos">
                {t.siguiendo.pasos.map((paso, i) => (
                  <li key={paso}>
                    <span aria-hidden className="mq-paso-num">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>
            </div>
            <figure className="aparece flex flex-col items-center gap-6 md:col-span-5 md:col-start-8">
              <div className="mq-movil">
                <div className="mq-pantalla">
                  {/* El panel de verdad con datos inventados, en su propia
                      página de 390 px (_maqueta/panel-telefono.tsx). */}
                  <iframe src={panel} title={t.pieTelefono} loading="lazy" tabIndex={-1} aria-hidden />
                </div>
              </div>
              <figcaption className="dir-pie text-center text-[var(--dir-sobre-papel-suave)]">{t.pieTelefono}</figcaption>
            </figure>
          </div>
        </div>

        {/* Texto de servicio: qué sigue en la maqueta. «Cómo funciona ↓» baja acá. */}
        <p id="como-funciona" className="mq-sigue scroll-mt-6">
          {t.sigue}
        </p>
      </section>
    </div>
  );
}

/** Un tilde fino, como hecho a lápiz. */
function Tilde() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="mq-tilde" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8.6c1.3 1 2.3 2.2 3.2 3.6C7.6 8.4 10.2 5.3 13.6 3" />
    </svg>
  );
}
