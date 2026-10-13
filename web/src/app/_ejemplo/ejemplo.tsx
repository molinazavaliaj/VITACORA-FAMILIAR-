import Link from "next/link";
import { clasesBoton } from "../_ui/boton";
import { Cabecera, Pie } from "../_publico";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { catalogo } from "@/lib/productos";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { LibroHojeable } from "./libro-hojeable";

// /ejemplo (rediseño 2026-10, maquetas Ejemplo/EjemploMovil): el libro de
// Osvaldo para hojear antes de comprar. Es una historia inventada y la página
// lo dice arriba (la etiqueta) y abajo (junto al botón). Estática, igual para
// /ejemplo, /ca/ejemplo y /ar/ejemplo; el precio del botón sale del catálogo
// de la región al construir.

const FOTOS = {
  portada: "/rediseno/libro-osvaldo-portada.jpg",
  contraportada: "/rediseno/libro-osvaldo-contraportada.jpg",
  juventud: "/rediseno/osvaldo-guitarra.jpg",
} as const;

export function Ejemplo({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_EJEMPLO[idioma];
  const cat = catalogo(regionDeIdioma(idioma));
  const precio = new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(
    cat.base.precio,
  );
  return (
    <div
      lang={langDeIdioma(idioma)}
      className="tema-oscuro flex flex-1 flex-col bg-[radial-gradient(ellipse_at_50%_30%,#1a1712_0%,#0a0a0a_60%)]"
    >
      <Cabecera idioma={idioma} camino="/ejemplo" />
      <main className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-8 px-4 pb-20 pt-10 sm:px-6 sm:pt-12">
        <div className="flex max-w-[720px] flex-col items-center gap-3 text-center">
          <span className="text-[12px] uppercase tracking-[0.2em] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">{t.etiqueta}</span>
          <span className="rounded-full border border-[var(--borde-oscuro-fuerte)] px-3 py-1 text-[12px] text-[var(--texto-oscuro-suave)] [font-family:var(--fuente-micro)]">
            {t.inventada}
          </span>
          <h1 className="text-[36px] font-medium leading-[1.05] text-white [font-family:var(--fuente-titulo)] sm:text-[50px]">{t.titulo}</h1>
          <p className="text-[17px] leading-[1.55] text-[var(--texto-oscuro-suave)] sm:text-[18px]">{t.bajada}</p>
        </div>
        <LibroHojeable
          libro={t.libro}
          fotos={FOTOS}
          anterior={t.anterior}
          siguiente={t.siguiente}
          posicionesPliegos={t.pliegos.map((nombre, i) => t.posicion(i + 1, t.pliegos.length, nombre))}
          posicionesPaginas={t.paginas.map((nombre, i) => t.posicion(i + 1, t.paginas.length, nombre))}
        />
        <div className="mt-2 flex flex-col items-center gap-3 text-center">
          <Link prefetch={false} href={ruta(idioma, "/comprar")} className={clasesBoton("primario", "px-9 py-4 text-[17px]")}>
            {t.cta(precio)}
          </Link>
          <span className="max-w-md text-[13px] text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{t.nota}</span>
          <Link prefetch={false} href={ruta(idioma, "/")} className="flex min-h-11 items-center text-[14px] text-[var(--texto-oscuro-menor)] hover:text-white [font-family:var(--fuente-micro)]">
            {t.volver}
          </Link>
        </div>
      </main>
      <Pie idioma={idioma} camino="/ejemplo" />
    </div>
  );
}
