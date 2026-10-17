import type { Metadata } from "next";
import { catalogo } from "@/lib/productos";
import { alternativas, regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { CHECKOUT_KIDS } from "../_textos/checkout-kids";
import { TEXTOS_KIDS } from "../_textos/kids";
import { CheckoutKids } from "../comprar/kids/formulario";
import { preciosKids } from "../_kids/pagina";
import { enlaceEscribir } from "../_kids/piezas";
import { CascaronCheckout } from "./cascaron";

// La compra de Vitácora Kids, la misma pantalla en /comprar/kids,
// /ca/comprar/kids y /ar/comprar/kids. Estática: si se vende (KIDS_VENTA y
// PRECIO_KIDS_*) se resuelve al construir. Sin las dos, «Próximamente».

export function metadataKids(idioma: IdiomaWeb): Metadata {
  const K = CHECKOUT_KIDS[idioma];
  return { title: K.tituloPagina, description: K.descripcion, alternates: alternativas(idioma, "/comprar/kids") };
}

export function PaginaComprarKids({ idioma }: { idioma: IdiomaWeb }) {
  const { precio } = preciosKids(idioma);
  return (
    <CascaronCheckout idioma={idioma} inicio="/kids" kids>
      <CheckoutKids idioma={idioma} precio={precio} moneda={catalogo(regionDeIdioma(idioma)).moneda} escribir={enlaceEscribir(TEXTOS_KIDS[idioma])} />
    </CascaronCheckout>
  );
}
