import type { Metadata } from "next";
import { catalogo } from "@/lib/productos";
import { entregaWhatsAppPrendida } from "@/lib/regalo-entrega";
import { alternativas, regionDeIdioma, tratoDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { idiomaPorDefecto } from "@/lib/regalo-textos";
import { COMPRADOR_WEB } from "../_textos/regalar";
import { FormularioRegalo } from "../regalar/formulario";
import { CascaronCheckout } from "./cascaron";

// La compra del regalo (plan 2026-10-07-gift-card), la misma en /regalar,
// /ca/regalar y /ar/regalar, re-vestida con el cascarón del rediseño. Pública y
// sin cuenta. Estática: la región sale de la ruta (antes, del país del
// visitante; ahora el CDN manda a /ar/regalar a quien llega de fuera de
// Europa) y el catálogo, de las variables al construir. Cualquiera puede
// regalar desde cualquier versión: no hay bloqueo por país.

export function metadataRegalar(idioma: IdiomaWeb): Metadata {
  return { title: COMPRADOR_WEB[idioma].tituloPagina, alternates: alternativas(idioma, "/regalar") };
}

export function PaginaRegalar({ idioma }: { idioma: IdiomaWeb }) {
  const region = regionDeIdioma(idioma);
  return (
    <CascaronCheckout idioma={idioma}>
      <FormularioRegalo
        catalogo={catalogo(region)}
        region={region}
        trato={tratoDeIdioma(idioma)}
        // El idioma del regalo arranca en el de la versión: el catalán, en català.
        idiomaInicial={idioma === "ca" ? "ca" : idiomaPorDefecto(region)}
        entregaWhatsApp={entregaWhatsAppPrendida()}
        idiomaWeb={idioma}
      />
    </CascaronCheckout>
  );
}
