import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecera, Pie } from "../_publico";
import { Coreografia } from "../_direccion/coreografia";
import { TEXTOS_OPINIONES } from "../_textos/opiniones";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { OPINIONES, URL_OPINIONES_GOOGLE, hayOpiniones, ordenarOpiniones, type Opinion } from "@/lib/opiniones";
import { langDeIdioma, localeDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import "../_direccion/direccion.css";
import "./opiniones.css";

// /opiniones, /ca/opiniones y /ar/opiniones (rediseño 2026-10). Diseño elegido
// por Naza el 17/10: la opción C, «revista» (docs/rediseno-2026-10/opiniones/
// maqueta-c-revista.html). Cada opinión es un bloque, alternando papel crema y
// tinta, con su número grande en cursiva (01, 02…) que cambia de lado. El
// fragmento del libro, si hay, va como una línea chica en cursiva.
//
// Las superficies son las mismas de la portada real: dir-papel (fibra de
// papel) y dir-tinta (tela), dir-hoja (el borde de la hoja que sube) y el
// grano de dir-pagina. Capas con la regla de la portada: una hoja solo tapa a
// la anterior cuando lo que se leía ya pasó. El inicio es la única capa
// ([data-capa], Coreografia): queda fija cuando su final llega al borde de
// abajo y la primera opinión sube y la tapa. Las demás bajan con la página.
// Sin el borde cortado (dir-deckle) que la portada pone en sus hojas de papel:
// a Naza no le gustó en esta página (pendiente de confirmar).
//
// Las opiniones salen de lib/opiniones.ts, en su idioma original y con su
// `lang`. Con menos de tres, la página no existe (notFound). Sin datos
// estructurados de reseñas. Estática.

const CAMINO = "/opiniones";

function mesYAnio(fecha: string, idioma: IdiomaWeb): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeDeIdioma(idioma), { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function Opiniones({
  idioma,
  opiniones = OPINIONES,
  urlGoogle = URL_OPINIONES_GOOGLE,
}: {
  idioma: IdiomaWeb;
  /** Solo para los tests: en la web siempre son las de lib/opiniones.ts. */
  opiniones?: readonly Opinion[];
  urlGoogle?: string;
}) {
  if (!hayOpiniones(opiniones)) notFound();
  const t = TEXTOS_OPINIONES[idioma];
  const portada = TEXTOS_PORTADA[idioma];
  const lista = ordenarOpiniones(opiniones);
  const lang = langDeIdioma(idioma);
  // Después de las opiniones sigue la superficie contraria a la de la última.
  const comprobadasEnPapel = lista.length % 2 === 0;

  return (
    <div lang={lang} className="dir-pagina opn flex flex-1 flex-col">
      <Coreografia />

      {/* Inicio, sobre tinta. La única capa: queda fija y la tapa la primera opinión. */}
      <section data-capa className="dir-tinta relative z-[1]">
        <div className="dir-hunde dir-hunde--1 relative">
          <Cabecera idioma={idioma} camino={CAMINO} sobreHero />
          <div className="mx-auto grid w-full max-w-[1360px] grid-cols-1 gap-6 px-4 pb-24 pt-12 sm:px-8 md:grid-cols-12 md:items-end md:gap-12 md:pb-32 md:pt-20 lg:px-12">
            <div className="flex flex-col gap-5 md:col-span-8">
              <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.etiqueta}</span>
              <h1 className="dir-titular opn-titulo">{t.titulo}</h1>
            </div>
            <p className="opn-bajada md:col-span-4 md:justify-self-end">{t.bajada}</p>
          </div>
        </div>
      </section>

      <main className="contents">
        {lista.map((o, i) => {
          const papel = i % 2 === 0;
          return (
            <section
              key={o.id}
              data-superficie={papel ? "papel" : "tinta"}
              className={`opn-bloque ${papel ? "dir-papel" : "dir-tinta"} dir-hoja ${i === 0 ? "dir-sobre-1" : "dir-diferido"} relative`}
              style={{ zIndex: i + 2 }}
            >
              <div className="opn-rejilla mx-auto w-full max-w-[1360px] px-4 py-24 sm:px-8 md:py-32 lg:px-12">
                <span aria-hidden className="opn-numero">{String(i + 1).padStart(2, "0")}</span>
                <figure lang={o.lang} className="opn-texto">
                  <blockquote className="opn-frase">{o.frase}</blockquote>
                  <figcaption className="opn-meta">
                    <span className="opn-quien">
                      <b>{o.nombre}</b>, {o.relacion} · {o.ciudad}
                    </span>
                    <span className="dir-micro opn-dato" lang={lang}>
                      <span className="opn-producto">{t.producto[o.producto]}</span> · {mesYAnio(o.fecha, idioma)}
                    </span>
                  </figcaption>
                  {o.fragmento ? (
                    <p className="opn-fragmento">
                      <span className="dir-micro opn-fragmento-etiqueta" lang={lang}>{t.pagina}</span>
                      <span lang={o.lang}>{o.fragmento}</span>
                    </p>
                  ) : null}
                </figure>
              </div>
            </section>
          );
        })}

        {/* Cómo se comprueban (obligatorio en España) y Google, si ya existe. */}
        <section
          className={`${comprobadasEnPapel ? "dir-papel" : "dir-tinta"} dir-hoja dir-diferido relative`}
          style={{ zIndex: lista.length + 2 }}
        >
          <div className="opn-comprobadas mx-auto w-full max-w-[1360px] px-4 py-20 sm:px-8 md:py-24 lg:px-12">
            <div>
              <h2 className="dir-micro opn-producto">{t.comprobadasTitulo}</h2>
              <p className="opn-comprobadas-texto">{t.comprobadasTexto}</p>
            </div>
            {urlGoogle ? (
              <a href={urlGoogle} target="_blank" rel="noopener noreferrer" className="dir-boton opn-boton-hilo">
                {t.google}
              </a>
            ) : null}
          </div>
        </section>
      </main>

      {/* Cierre, el de la portada (#30), y el pie. */}
      <section className="dir-tinta dir-hoja dir-diferido relative" style={{ zIndex: lista.length + 3 }}>
        <div className="flex flex-col items-center px-4 pb-24 pt-24 text-center sm:px-8 md:pb-36 md:pt-36">
          <h2 className="dir-titular dir-t2 max-w-[14ch]">{portada.lema}</h2>
          <Link prefetch={false} href={ruta(idioma, "/comprar")} className="dir-boton dir-boton--lleno mt-11 w-full max-w-[358px] sm:w-auto">
            {portada.iniciar}
          </Link>
        </div>
        <Pie idioma={idioma} camino={CAMINO} opiniones={opiniones} rasca />
      </section>
    </div>
  );
}
