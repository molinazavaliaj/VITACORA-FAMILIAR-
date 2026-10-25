import Link from "next/link";
import { CONTACTO } from "../legal/titulares";
import { TEXTOS_CUPON } from "../_textos/cupon";
import { rascaPrendido } from "@/lib/cupon";
import { RascaYGana } from "./rasca";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { OPINIONES, hayOpiniones, type Opinion } from "@/lib/opiniones";
import { EnlaceIdioma } from "./idioma-cliente";

// El pie público del rediseño 2026-10: el lema de siempre, los legales que
// existen hoy (con Reclamaciones, 19/10) y el contacto con su horario. «Botón de arrepentimiento» en Argentina es
// obligatorio y tiene que verse desde la portada (Res. 424/2020); en España la
// misma página se llama «Desistimiento». Cada idioma enlaza a sus legales
// (/legal/…, /ca/legal/…, /ar/legal/…; fase 5). El enlace a «Opiniones» solo
// aparece con al menos tres opiniones reales (lib/opiniones.ts); `opiniones`
// se pasa solo en los tests. «Eventos» lleva a Vitácora Eventos (17/10), que
// no tiene solapa arriba: no se compra, se consulta.
//
// Rasca y gana (20/10): con RASCA_Y_GANA=1, el pie enlaza a las «Bases del
// cupón» en toda la web (respuesta-19-10.md §1.6) y, en las páginas que lo
// piden con `rasca` (las del libro de una vida: el cupón no vale para Viaje
// ni Kids), monta el popup.

export function Pie({ idioma, camino, opiniones = OPINIONES, rasca = false }: { idioma: IdiomaWeb; camino: string; opiniones?: readonly Opinion[]; rasca?: boolean }) {
  const t = TEXTOS_PUBLICO[idioma];
  const cupon = rascaPrendido();
  const whatsapp = urlWhatsAppDudas();
  const enlace = "flex min-h-11 items-center hover:text-[var(--texto-oscuro-fuerte)]";
  return (
    <footer className="border-t border-[var(--linea-oscura)] bg-[var(--fondo-oscuro)] text-[var(--texto-oscuro-menor)]">
      <div className="mx-auto flex w-full max-w-[1104px] flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <p className="max-w-xs text-[15px] italic text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-cuerpo)]">{t.lema}</p>
        {/* En el teléfono, dos columnas (legales | contacto, y abajo lo demás): en una sola eran casi dos pantallas (revisión del 25/10, A11). */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 text-[12px] uppercase tracking-[0.18em] [font-family:var(--fuente-micro)] sm:flex sm:flex-row sm:gap-12">
          <nav aria-label={t.legales} className="flex flex-col">
            <Link prefetch={false} href={ruta(idioma, "/legal/terminos")} className={enlace}>{t.terminos}</Link>
            <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className={enlace}>{t.privacidad}</Link>
            <Link prefetch={false} href={ruta(idioma, "/legal/arrepentimiento")} className={`${enlace} sm:whitespace-nowrap`}>{t.arrepentimiento}</Link>
            <Link prefetch={false} href={ruta(idioma, "/legal/reclamaciones")} className={enlace}>{t.reclamaciones}</Link>
            {cupon ? (
              <Link prefetch={false} href={ruta(idioma, "/legal/cupon")} className={enlace}>{TEXTOS_CUPON[idioma].popup.bases}</Link>
            ) : null}
          </nav>
          <div className="flex flex-col">
            <span className="flex min-h-11 items-center text-[var(--texto-oscuro-suave)]">{t.contacto}</span>
            <a href={`mailto:${CONTACTO.hola}`} className={`${enlace} break-all normal-case tracking-normal text-[13px] sm:break-normal`}>{CONTACTO.hola}</a>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${enlace} normal-case tracking-normal text-[13px]`}>
                {t.escribirWhatsApp}
              </a>
            ) : null}
            <span className="flex min-h-11 items-center normal-case tracking-normal text-[13px]">{t.horario}</span>
          </div>
          <div className="flex flex-col">
            <Link prefetch={false} href="/entrar" className={enlace}>{t.entrar}</Link>
            <Link prefetch={false} href={ruta(idioma, "/eventos")} className={enlace}>{t.eventos}</Link>
            {hayOpiniones(opiniones) ? (
              <Link prefetch={false} href={ruta(idioma, "/opiniones")} className={enlace}>{t.opiniones}</Link>
            ) : null}
            <EnlaceIdioma idioma={idioma === "ar" ? "es" : "ar"} camino={camino} className={`${enlace} normal-case tracking-normal text-[13px]`}>
              {t.cambiarPais}
            </EnlaceIdioma>
          </div>
        </div>
      </div>
      {cupon && rasca ? <RascaYGana idioma={idioma} /> : null}
    </footer>
  );
}
