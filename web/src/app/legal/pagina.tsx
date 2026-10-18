import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { alternativas, langDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { Cabecera, Pie } from "../_publico";
import { DOCUMENTOS_LEGALES, TEXTOS_LEGAL, type Bloque, type DocumentoLegal, type TextosLegal } from "../_textos/legal";
import { CONTACTO, TITULARES, faltan, type Region } from "./titulares";
import "../_direccion/tokens.css";
import "./legal.css";

// Las páginas legales en la dirección «la web es un libro» (rediseño 2026-10,
// fase 5; maquetas Legal / LegalMovil): la cabecera pública en tinta y el
// texto en una hoja de papel con el borde cortado a mano. Arriba las tres
// solapas (términos, privacidad, desistimiento), el título, la fecha y el
// «En corto»; después el índice de secciones (al costado en pantallas anchas)
// y el texto corrido, en letra de libro y a un ancho de lectura cómodo.
// Lectura corrida y no acordeón: un texto legal se busca con Ctrl+F y se lee
// entero; plegado esconde justo lo que alguien vino a buscar.
//
// Los textos viven en ../_textos/legal.ts (los redacta el abogado, B13). Las
// rutas son /legal/<documento>, /ca/legal/<documento> y /ar/legal/<documento>,
// todas estáticas. Componente de servidor: no suma JS.

const RUTA: Record<DocumentoLegal, string> = {
  terminos: "/legal/terminos",
  privacidad: "/legal/privacidad",
  arrepentimiento: "/legal/arrepentimiento",
};

export function metadataLegal(idioma: IdiomaWeb, documento: DocumentoLegal): Metadata {
  const d = TEXTOS_LEGAL[idioma][documento];
  return { title: d.titulo, description: d.descripcion, alternates: alternativas(idioma, RUTA[documento]) };
}

/** El correo prellenado del botón de desistimiento / arrepentimiento. */
export function mailtoDesistimiento(idioma: IdiomaWeb): string {
  const t = TEXTOS_LEGAL[idioma];
  return `mailto:${CONTACTO.hola}?subject=${encodeURIComponent(t.asunto)}&body=${encodeURIComponent(t.cuerpo.join("\n"))}`;
}

export function PaginaLegal({ idioma, documento }: { idioma: IdiomaWeb; documento: DocumentoLegal }) {
  const t = TEXTOS_LEGAL[idioma];
  const d = t[documento];
  const camino = RUTA[documento];
  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina lgl flex min-h-dvh flex-1 flex-col">
      <div className="dir-tinta lgl-cabecera">
        <Cabecera idioma={idioma} camino={camino} sobreHero />
      </div>

      <main className="dir-deckle lgl-hoja">
        <div className="mx-auto w-full max-w-[1104px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
          <nav aria-label={t.documentos} className="lgl-solapas">
            {DOCUMENTOS_LEGALES.map((doc) => (
              <Link
                key={doc}
                prefetch={false}
                href={ruta(idioma, RUTA[doc])}
                aria-current={doc === documento ? "page" : undefined}
                className="lgl-solapa"
              >
                {t[doc].titulo}
              </Link>
            ))}
          </nav>

          <div className="lgl-rejilla">
            <header className="lgl-cabeza">
              <h1 className="dir-titular lgl-titulo">{d.titulo}</h1>
              <p className="lgl-bajada">{d.bajada}</p>
              <p className="lgl-fecha">
                {t.actualizado}: {t.fecha}
              </p>
              <section aria-labelledby="en-corto" className="lgl-corto">
                <h2 id="en-corto" className="dir-micro lgl-corto-titulo">
                  {t.enCorto}
                </h2>
                <ul>
                  {d.enCorto.map((linea, i) => (
                    <li key={i}>
                      <Marcado texto={linea} idioma={idioma} t={t} />
                    </li>
                  ))}
                </ul>
              </section>
            </header>

            <nav aria-label={t.indice} className="lgl-indice">
              <p className="dir-micro lgl-indice-titulo">{t.indice}</p>
              <ol>
                {d.secciones.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>{s.titulo}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="lgl-cuerpo">
              {d.secciones.map((s) => (
                <section key={s.id} id={s.id} className="lgl-seccion">
                  <h2 className="lgl-seccion-titulo">{s.titulo}</h2>
                  {s.bloques.map((b, i) => (
                    <BloqueLegal key={i} bloque={b} idioma={idioma} t={t} />
                  ))}
                </section>
              ))}
              <p className="lgl-cierre">
                <Marcado texto={t.cierre} idioma={idioma} t={t} />
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="dir-tinta">
        <Pie idioma={idioma} camino={camino} />
      </div>
    </div>
  );
}

function BloqueLegal({ bloque, idioma, t }: { bloque: Bloque; idioma: IdiomaWeb; t: TextosLegal }) {
  switch (bloque.tipo) {
    case "parrafo":
      return (
        <p>
          <Marcado texto={bloque.texto} idioma={idioma} t={t} />
        </p>
      );
    case "lista":
      return (
        <ul className="lgl-lista">
          {bloque.items.map((item, i) => (
            <li key={i}>
              <Marcado texto={item} idioma={idioma} t={t} />
            </li>
          ))}
        </ul>
      );
    case "tabla":
      return <Tabla columnas={bloque.columnas} filas={bloque.filas} />;
    case "boton":
      return (
        <p>
          <a href={mailtoDesistimiento(idioma)} className="lgl-boton">
            {t.boton}
          </a>
        </p>
      );
    case "formulario":
      // El modelo del Anexo B, para copiar tal cual. Sin JS (la página es de
      // servidor): un toque lo selecciona entero (user-select: all) y se copia.
      return (
        <div className="lgl-formulario">
          {bloque.lineas.map((linea, i) => (
            <p key={i}>
              <Marcado texto={linea} idioma={idioma} t={t} />
            </p>
          ))}
        </div>
      );
  }
}

function Tabla({ columnas, filas }: { columnas: string[]; filas: string[][] }) {
  return (
    <>
      {/* En pantallas angostas, cada fila es un bloque: la primera celda como título y el resto etiquetado. */}
      <div className="sm:hidden">
        <div className="lgl-tabla-movil">
        {filas.map((fila, i) => (
          <div key={i}>
            <p className="lgl-tabla-quien">{fila[0]}</p>
            {fila.slice(1).map((celda, j) => (
              <p key={j}>
                <span className="dir-micro lgl-tabla-etiqueta">{columnas[j + 1]}: </span>
                {celda}
              </p>
            ))}
          </div>
        ))}
        </div>
      </div>
      <table className="lgl-tabla hidden sm:table">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c} scope="col" className="dir-micro">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (
                <td key={j}>{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ─── Las marcas de los textos (ver ../_textos/legal.ts) ─────────────────

const MARCA = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\{[a-z]+(?::[A-Z]{2})?\})/g;

/** Pinta un texto con sus marcas: negrita, enlaces, correos y datos de los titulares. */
export function Marcado({ texto, idioma, t }: { texto: string; idioma: IdiomaWeb; t: TextosLegal }): ReactNode {
  const partes = texto.split(MARCA).filter((parte) => parte !== "");
  return (
    <>
      {partes.map((parte, i) => (
        <Pieza key={i} parte={parte} idioma={idioma} t={t} />
      ))}
    </>
  );
}

function Pieza({ parte, idioma, t }: { parte: string; idioma: IdiomaWeb; t: TextosLegal }): ReactNode {
  if (parte.startsWith("**") && parte.endsWith("**")) {
    return <strong>{parte.slice(2, -2)}</strong>;
  }
  const enlace = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(parte);
  if (enlace) return <Enlace href={enlace[2]} idioma={idioma}>{enlace[1]}</Enlace>;
  const marca = /^\{([a-z]+)(?::([A-Z]{2}))?\}$/.exec(parte);
  if (marca) {
    const [, cual, region] = marca;
    if (cual === "hola" || cual === "soporte") {
      return <Enlace href={`mailto:${CONTACTO[cual]}`} idioma={idioma}>{CONTACTO[cual]}</Enlace>;
    }
    if (region === "ES" || region === "AR") {
      const titular = TITULARES[region as Region];
      if (cual === "titular") return <DatosTitular region={region} t={t} />;
      if (cual === "ley") return <>{titular.ley}</>;
      if (cual === "autoridad") return <Enlace href={titular.autoridad.url} idioma={idioma}>{titular.autoridad.nombre}</Enlace>;
    }
  }
  return <>{parte}</>;
}

function Enlace({ href, idioma, children }: { href: string; idioma: IdiomaWeb; children: ReactNode }) {
  if (href.startsWith("/")) {
    // Los enlaces entre legales se quedan en el idioma de la página.
    const [camino, ancla] = href.split("#");
    const destino = camino.startsWith("/legal") ? ruta(idioma, camino) : camino;
    return (
      <Link prefetch={false} href={ancla ? `${destino}#${ancla}` : destino} className="lgl-enlace">
        {children}
      </Link>
    );
  }
  const externo = !href.startsWith("mailto:");
  return (
    <a href={href} className="lgl-enlace" target={externo ? "_blank" : undefined} rel={externo ? "noreferrer" : undefined}>
      {children}
    </a>
  );
}

/** Nombre, documento y domicilio de un titular, con lo que falte marcado (se ve, a propósito). */
function DatosTitular({ region, t }: { region: Region; t: TextosLegal }) {
  const titular = TITULARES[region];
  const huecos = faltan(titular);
  const hueco = <span className="lgl-pendiente">[{t.aCompletar}]</span>;
  return (
    <>
      <strong>{titular.nombre}</strong>, {titular.documento.etiqueta}{" "}
      {huecos.includes(titular.documento.etiqueta) ? hueco : titular.documento.valor}, {t.conDomicilio}{" "}
      {huecos.includes("domicilio") ? hueco : titular.domicilio}
    </>
  );
}
