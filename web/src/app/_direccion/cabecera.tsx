import Link from "next/link";
import { Toroide } from "../marca";
import { TEXTOS_PUBLICO } from "../_textos/publico";
import { ruta, type IdiomaWeb } from "@/lib/idioma-web";

// La cabecera mínima del prototipo (2.ª vuelta, 13/10): el toroide con
// VITÁCORA, Entrar y Comprar el libro. Transparente, flotando sobre el hero
// negro. Sin solapas ni selector de idioma: el prototipo es solo castellano.
// Los textos son los de la cabecera pública (_textos/publico.ts).

export function CabeceraDireccion({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PUBLICO[idioma];
  return (
    <header className="absolute inset-x-0 top-0 z-10">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
        <Link prefetch={false} href={ruta(idioma, "/")} aria-label={t.inicio} className="flex min-h-11 items-center gap-3">
          <Toroide className="h-6 w-auto" />
          <span className="dir-micro tracking-[0.22em]">VITÁCORA</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-5">
          <Link prefetch={false} href="/entrar" className="dir-enlace flex min-h-11 items-center px-2 text-[14px]">
            {t.entrar}
          </Link>
          <Link prefetch={false} href={ruta(idioma, "/comprar")} className="dir-boton dir-boton--hilo dir-boton--chico">
            {t.comprar}
          </Link>
        </nav>
      </div>
    </header>
  );
}
