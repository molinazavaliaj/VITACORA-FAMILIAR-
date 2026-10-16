import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecera, Pie } from "../_publico";
import { TEXTOS_OPINIONES } from "../_textos/opiniones";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { OPINIONES, URL_OPINIONES_GOOGLE, hayOpiniones, ordenarOpiniones, type Opinion } from "@/lib/opiniones";
import { langDeIdioma, localeDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import "../_direccion/direccion.css";
import "./opiniones.css";

// /opiniones, /ca/opiniones y /ar/opiniones (rediseño 2026-10, maqueta
// docs/rediseno-2026-10/opiniones/maqueta.html). Dirección «la web es un
// libro»: arriba la tinta con el título; las opiniones sobre la hoja de papel,
// una debajo de otra (sin filas de tarjetas), la frase grande y, si hay, una
// página de su libro al lado. Abajo, cómo se comprueban (obligatorio en
// España) y el enlace a Google si ya existe. Cierra con el lema de la portada.
//
// Las opiniones salen de lib/opiniones.ts y se muestran en su idioma original,
// con su `lang`. Con menos de tres, la página no existe (notFound). Sin datos
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

  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina opn flex flex-1 flex-col">
      <section className="dir-tinta relative pb-[14px]">
        <Cabecera idioma={idioma} camino={CAMINO} sobreHero />
        <div className="mx-auto flex w-full max-w-[1104px] flex-col items-center gap-5 px-4 pb-20 pt-10 text-center sm:px-8 sm:pb-28 sm:pt-16">
          <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.etiqueta}</span>
          <h1 className="dir-titular dir-t2 max-w-[14ch]">{t.titulo}</h1>
          <p className="opn-bajada">{t.bajada}</p>
        </div>
      </section>

      <main className="dir-papel dir-deckle relative -mt-[14px]">
        <div className="mx-auto w-full max-w-[1104px] px-4 pb-20 pt-20 sm:px-8 md:pb-28 md:pt-28">
          <ol className="opn-lista">
            {lista.map((o) => (
              <li key={o.id} className={o.fragmento ? "opn-opinion" : "opn-opinion opn-opinion--sola"}>
                <figure lang={o.lang} className="opn-texto">
                  <blockquote className="opn-frase">{o.frase}</blockquote>
                  <figcaption className="mt-6">
                    <p className="opn-quien">
                      <b>{o.nombre}</b>, {o.relacion} · {o.ciudad}
                    </p>
                    <p className="dir-micro opn-dato">
                      <span className="opn-producto">{t.producto[o.producto]}</span> · <span lang={langDeIdioma(idioma)}>{mesYAnio(o.fecha, idioma)}</span>
                    </p>
                  </figcaption>
                </figure>
                {o.fragmento ? (
                  <aside className="opn-pagina" aria-label={t.pagina}>
                    <p className="dir-micro opn-pagina-etiqueta" lang={langDeIdioma(idioma)}>{t.pagina}</p>
                    <p lang={o.lang} className="opn-pagina-texto">{o.fragmento}</p>
                  </aside>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="opn-comprobadas">
            <div>
              <h2 className="dir-micro opn-producto">{t.comprobadasTitulo}</h2>
              <p className="opn-comprobadas-texto">{t.comprobadasTexto}</p>
            </div>
            {urlGoogle ? (
              <a href={urlGoogle} target="_blank" rel="noopener noreferrer" className="dir-boton opn-boton-papel">
                {t.google}
              </a>
            ) : null}
          </div>
        </div>
      </main>

      <section className="dir-tinta relative">
        <div className="flex flex-col items-center px-4 pb-24 pt-24 text-center sm:px-8 md:pb-36 md:pt-36">
          <h2 className="dir-titular dir-t2 max-w-[14ch]">{portada.lema}</h2>
          <Link prefetch={false} href={ruta(idioma, "/comprar")} className="dir-boton dir-boton--lleno mt-11 w-full max-w-[358px] sm:w-auto">
            {portada.iniciar}
          </Link>
        </div>
        <Pie idioma={idioma} camino={CAMINO} opiniones={opiniones} />
      </section>
    </div>
  );
}
