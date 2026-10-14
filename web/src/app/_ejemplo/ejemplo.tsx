import Link from "next/link";
import { clasesBoton } from "../_ui/boton";
import { Cabecera, Pie } from "../_publico";
import { Libro3D } from "../_direccion/libro-3d";
import { TEXTOS_EJEMPLO } from "../_textos/ejemplo";
import { TEXTOS_PORTADA } from "../_textos/portada";
import { catalogo } from "@/lib/productos";
import { langDeIdioma, localeDeIdioma, regionDeIdioma, ruta, type IdiomaWeb } from "@/lib/idioma-web";
import { LibroHojeable } from "./libro-hojeable";
import "../_checkout/checkout.css";
import "./ejemplo.css";

// /ejemplo (rediseño 2026-10, maquetas Ejemplo/EjemploMovil): el libro de
// Osvaldo para hojear antes de comprar. Es una historia inventada y la página
// lo dice arriba (la etiqueta) y abajo (junto al botón). Estática, igual para
// /ejemplo, /ca/ejemplo y /ar/ejemplo; el precio del botón sale del catálogo
// de la región al construir.
//
// Dirección «la web es un libro» (14/10): arriba la tinta con el título; el
// libro, sobre la hoja de papel que la tapa con el borde cortado a mano. La
// tapa y la contratapa son el mismo libro 3D del prototipo (Libro3D: la tapa
// real con la foto del atlas, el lomo «Osvaldo Toroide · El libro de su vida»
// y la contratapa con el QR «Escucha su voz»), quieto en dos poses: de frente
// en 3/4 y de espaldas. Se arman acá, en el servidor, y entran al libro que se
// hojea como piezas ya pintadas: el QR no suma JS al navegador.

const FOTOS = { juventud: "/rediseno/osvaldo-guitarra.jpg" } as const;

export function Ejemplo({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_EJEMPLO[idioma];
  const libro = TEXTOS_PORTADA[idioma].direccion.libro;
  const cat = catalogo(regionDeIdioma(idioma));
  const precio = new Intl.NumberFormat(localeDeIdioma(idioma), { style: "currency", currency: cat.moneda, maximumFractionDigits: 0 }).format(
    cat.base.precio,
  );
  return (
    <div lang={langDeIdioma(idioma)} className="dir-pagina ejm flex flex-1 flex-col">
      <div className="dir-tinta ejm-tinta pb-[14px]">
        <Cabecera idioma={idioma} camino="/ejemplo" sobreHero />
        <div className="mx-auto flex w-full max-w-[1104px] flex-col items-center gap-5 px-4 pb-16 pt-6 text-center sm:px-6 sm:pb-24 sm:pt-12">
          <span className="dir-micro text-[var(--dir-sobre-tinta-suave)]">{t.etiqueta}</span>
          <h1 className="dir-titular dir-t2 max-w-[16ch] text-[var(--dir-sobre-tinta)]">{t.titulo}</h1>
          <p className="ejm-bajada">{t.bajada}</p>
          <span className="ejm-inventada">{t.inventada}</span>
        </div>
      </div>
      <main className="dir-deckle chk relative -mt-[14px] flex flex-col items-center gap-10 px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
        <LibroHojeable
          libro={t.libro}
          fotos={FOTOS}
          tapa={
            <div role="img" aria-label={t.libro.altPortada} className="ejm-pose">
              <Libro3D idioma={idioma} b={libro} c={t.libro} />
            </div>
          }
          contratapa={
            <div role="img" aria-label={t.libro.altContraportada} className="ejm-pose ejm-pose--espalda">
              <Libro3D idioma={idioma} b={libro} c={t.libro} />
            </div>
          }
          anterior={t.anterior}
          siguiente={t.siguiente}
          posicionesPliegos={t.pliegos.map((nombre, i) => t.posicion(i + 1, t.pliegos.length, nombre))}
          posicionesPaginas={t.paginas.map((nombre, i) => t.posicion(i + 1, t.paginas.length, nombre))}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <Link prefetch={false} href={ruta(idioma, "/comprar")} className={clasesBoton("primario", "min-h-14 px-9 text-[16px]")}>
            {t.cta(precio)}
          </Link>
          <span className="max-w-md text-[13.5px] leading-relaxed text-[var(--texto-oscuro-menor)] [font-family:var(--fuente-micro)]">{t.nota}</span>
          <Link
            prefetch={false}
            href={ruta(idioma, "/")}
            className="flex min-h-11 items-center text-[14px] text-[var(--texto-oscuro-suave)] underline decoration-[var(--borde-oscuro-fuerte)] underline-offset-4 hover:text-[var(--texto-oscuro-fuerte)] [font-family:var(--fuente-micro)]"
          >
            {t.volver}
          </Link>
        </div>
      </main>
      <div className="dir-tinta ejm-tinta">
        <Pie idioma={idioma} camino="/ejemplo" />
      </div>
    </div>
  );
}
