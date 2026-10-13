import Link from "next/link";
import { Toroide } from "../marca";
import { CONTACTO } from "../legal/titulares";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { urlWhatsAppDudas } from "@/lib/whatsapp-dudas";
import type { IdiomaWeb } from "@/lib/idioma-web";

// El pie mínimo del prototipo (2.ª vuelta, 13/10): el lema, los legales que
// existen hoy, el contacto y Entrar. Los textos y enlaces son los del pie
// público (_publico/pie.tsx), sin el cambio de país: ese enlace es un
// componente de cliente y el prototipo es solo castellano (así no suma JS).

export function PieDireccion({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PUBLICO[idioma];
  const whatsapp = urlWhatsAppDudas();
  const enlace = "dir-pie-enlace flex min-h-11 items-center";
  return (
    <footer className="border-t border-[var(--dir-hilo-tinta)] text-[var(--dir-sobre-tinta-suave)]">
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-10 px-4 py-14 sm:px-8 md:grid-cols-12 md:gap-8 lg:px-12">
        <div className="flex flex-col gap-5 md:col-span-5">
          <Toroide className="h-6 w-auto self-start text-[var(--dir-sobre-tinta)]" />
          <p className="dir-pie max-w-[22ch] text-[var(--dir-sobre-tinta)]">{t.lema}</p>
        </div>
        <nav aria-label={t.legales} className="flex flex-col md:col-span-2 md:col-start-7">
          <Link prefetch={false} href="/legal/terminos" className={enlace}>{t.terminos}</Link>
          <Link prefetch={false} href="/legal/privacidad" className={enlace}>{t.privacidad}</Link>
          <Link prefetch={false} href="/legal/arrepentimiento" className={enlace}>{t.arrepentimiento}</Link>
        </nav>
        <div className="flex flex-col md:col-span-3">
          <a href={`mailto:${CONTACTO.hola}`} className={enlace}>{CONTACTO.hola}</a>
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={enlace}>
              {t.escribirWhatsApp}
            </a>
          ) : null}
          <Link prefetch={false} href="/entrar" className={enlace}>{t.entrar}</Link>
        </div>
      </div>
    </footer>
  );
}
