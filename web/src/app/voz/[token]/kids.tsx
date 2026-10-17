import type { CSSProperties } from "react";
import Link from "next/link";
import type { CapituloConFrases, FraseCandidata } from "@/lib/frases";
import { Toroide } from "../../marca";
import { ReproductorRespuesta } from "../../tablero/reproductor";
import { idiomaWebDeKids, type IdiomaKids } from "@/lib/kids";
import { ruta } from "@/lib/idioma-web";
import { TEXTOS_VOZ_KIDS } from "../../_textos/voz-kids";

// «Su voz» de un chico de Vitácora Kids: lo que abre cada QR del libro. La
// misma estructura que la de la casa (las respuestas con su audio, cada una con
// su ancla #f-<id>, y el libro online abajo), con los textos y la paleta de Kids.
// Sin el botón de mandar por WhatsApp: son respuestas enteras de un chico, y el
// link de la página ya lo tiene quien tiene el libro.

/** La paleta de Kids de la guía (la misma de _kids/kids.css y del panel): papel claro siempre. */
const PALETA_KIDS = {
  "--fondo": "#fbf8f3",
  "--texto": "#14140f",
  "--texto-suave": "#57534b",
  "--texto-menor": "#6f6a61",
  "--linea": "rgba(20, 20, 15, 0.14)",
  "--linea-fuerte": "rgba(20, 20, 15, 0.32)",
  "--relieve": "#ffffff",
  "--bruma": "rgba(196, 80, 46, 0.08)",
  "--hueco": "rgba(196, 80, 46, 0.08)",
  "--acento": "#c4502e",
  colorScheme: "light",
} as CSSProperties;

export function PaginaVozKids({
  token,
  apodo,
  publicables,
  libroListo,
  idioma = "es-AR",
}: {
  token: string;
  apodo: string;
  /** El idioma del chico (`kids_v2.idioma`): vos en Argentina, tú en España, catalán desde /ca. */
  idioma?: IdiomaKids;
  publicables: { capitulo: CapituloConFrases; frases: FraseCandidata[] }[];
  libroListo: boolean;
}) {
  const T = TEXTOS_VOZ_KIDS[idioma] ?? TEXTOS_VOZ_KIDS["es-AR"];
  const tab = "inline-flex h-11 items-center justify-center rounded-full px-6 text-[15px] font-medium transition-colors [font-family:var(--fuente-micro)]";
  const micro = "text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.2em]";

  return (
    <div data-producto="kids" style={PALETA_KIDS} className="min-h-full bg-[var(--fondo)] text-[var(--texto)] [font-family:var(--fuente-cuerpo)]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href={ruta(idiomaWebDeKids(idioma), "/kids")} className="flex items-center gap-3">
          <span aria-hidden>
            {/* La marca de siempre; el nombre que se lee es el de Kids, al lado. */}
            <Toroide className="h-8 w-8" />
          </span>
          <span className="text-[11px] uppercase [font-family:var(--fuente-micro)] [letter-spacing:0.3em]">{T.etiqueta}</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <h1 className="text-3xl leading-tight [font-family:var(--fuente-titulo)] font-medium md:text-4xl [text-wrap:balance]">{T.titulo(apodo)}</h1>

        <nav className="mt-8 flex flex-wrap gap-3" aria-label={T.suVoz}>
          <a href="#frases" className={`${tab} bg-[var(--texto)] text-[var(--fondo)]`}>{T.suVoz}</a>
          <a href="#libro" className={`${tab} border border-[var(--linea-fuerte)] hover:bg-[var(--bruma)]`}>{T.libro}</a>
        </nav>

        <section id="frases" className="mt-14 scroll-mt-8" aria-labelledby="titulo-frases">
          <div className="border-b border-[var(--texto)] pb-4">
            <h2 id="titulo-frases" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">{T.suVoz}</h2>
            <p className="mt-3 max-w-prose text-[16px] leading-relaxed text-[var(--texto-suave)] font-light">
              {publicables.length > 0 ? T.bajada : T.sinAudios}
            </p>
          </div>
          {publicables.map(({ capitulo, frases }) => (
            <div key={capitulo.numero} className="mt-10">
              <h3 className={`${micro} text-[var(--acento)]`}>{capitulo.capitulo}</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {frases.map((f) => (
                  <li key={f.id} id={`f-${f.id}`} className="scroll-mt-8 rounded-xl border border-[var(--linea)] bg-[var(--relieve)] p-4 sm:p-5">
                    <p className="text-[17px] leading-relaxed [font-family:var(--fuente-titulo)]">«{f.texto}»</p>
                    <p className={`mt-4 ${micro} text-[var(--texto-menor)]`}>{T.escuchala}</p>
                    <div className="mt-2">
                      <ReproductorRespuesta src={`/api/voz/${token}/audio/${f.id}`} duracion={f.segundos} etiqueta={T.etiquetaAudio(f.texto)} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="libro" className="mt-16 scroll-mt-8" aria-labelledby="titulo-libro">
          <div className="border-b border-[var(--texto)] pb-4">
            <h2 id="titulo-libro" className="text-2xl font-medium leading-none [font-family:var(--fuente-titulo)]">{T.libro}</h2>
          </div>
          {libroListo ? (
            <div className="mt-6 overflow-hidden rounded-xl border border-[var(--linea)] bg-[var(--relieve)]">
              {/* El libro.html de la fábrica (sin el sobre), en un iframe sin permisos. */}
              <iframe src={`/api/voz/${token}/libro`} title={T.titulo(apodo)} sandbox="" className="h-[80vh] w-full bg-white" />
            </div>
          ) : (
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--texto-suave)] font-light">{T.libroNoEsta}</p>
          )}
        </section>
      </main>
    </div>
  );
}
