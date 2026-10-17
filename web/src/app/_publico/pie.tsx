import Link from "next/link";
import { CONTACTO } from "../legal/titulares";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { OPINIONES, hayOpiniones, type Opinion } from "@/lib/opiniones";
import { EnlaceIdioma } from "./idioma-cliente";

// El pie público del rediseño 2026-10: el lema de siempre, los legales que
// existen hoy y el contacto. «Botón de arrepentimiento» en Argentina es
// obligatorio y tiene que verse desde la portada (Res. 424/2020); en España la
// misma página se llama «Desistimiento». Cada idioma enlaza a sus legales
// (/legal/…, /ca/legal/…, /ar/legal/…; fase 5). El enlace a «Opiniones» solo
// aparece con al menos tres opiniones reales (lib/opiniones.ts); `opiniones`
// se pasa solo en los tests. «Eventos» lleva a Vitácora Eventos (17/10), que
// no tiene solapa arriba: no se compra, se consulta.

export function Pie({ idioma, camino, opiniones = OPINIONES }: { idioma: IdiomaWeb; camino: string; opiniones?: readonly Opinion[] }) {
  const t = TEXTOS_PUBLICO[idioma];
  const whatsapp = urlWhatsAppDudas();
  const enlace = "flex min-h-11 items-center hover:text-[var(--texto-oscuro-fuerte)]";
  return (
    <footer className="border-t border-[var(--linea-oscura)] bg-[var(--fondo-oscuro)] text-[var(--texto-oscuro-menor)]">
      <div className="mx-auto flex w-full max-w-[1104px] flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <p className="max-w-xs text-[15px] italic text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-cuerpo)]">{t.lema}</p>
        <div className="flex flex-col gap-6 text-[12px] uppercase tracking-[0.18em] [font-family:var(--fuente-micro)] sm:flex-row sm:gap-12">
          <nav aria-label={t.legales} className="flex flex-col">
            <Link prefetch={false} href={ruta(idioma, "/legal/terminos")} className={enlace}>{t.terminos}</Link>
            <Link prefetch={false} href={ruta(idioma, "/legal/privacidad")} className={enlace}>{t.privacidad}</Link>
            <Link prefetch={false} href={ruta(idioma, "/legal/arrepentimiento")} className={`${enlace} whitespace-nowrap`}>{t.arrepentimiento}</Link>
          </nav>
          <div className="flex flex-col">
            <span className="flex min-h-11 items-center text-[var(--texto-oscuro-suave)]">{t.contacto}</span>
            <a href={`mailto:${CONTACTO.hola}`} className={`${enlace} normal-case tracking-normal text-[13px]`}>{CONTACTO.hola}</a>
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${enlace} normal-case tracking-normal text-[13px]`}>
                {t.escribirWhatsApp}
              </a>
            ) : null}
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
    </footer>
  );
}
