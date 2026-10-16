import type { Metadata } from "next";
import { catalogo } from "@/lib/productos";
import { catalogoKids } from "@/lib/kids";
import { alternativas, regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { CHECKOUT_KIDS } from "../_textos/checkout-kids";
import { TEXTOS_KIDS } from "../_textos/kids";
import { CheckoutKids } from "../comprar/kids/formulario";
import { preciosKids } from "../_kids/pagina";
import { enlaceEscribir } from "../_kids/piezas";
import { CascaronCheckout } from "./cascaron";

// La compra de Vitácora Kids, la misma pantalla en /comprar/kids,
// /ca/comprar/kids y /ar/comprar/kids. Estática: si se vende (KIDS_VENTA,
// PRECIO_KIDS_* y la región en KIDS_REGIONES: /ar y España, nunca /ca) se resuelve al
// construir. Sin alguna, «Próximamente». El libro impreso (Naza 15/10) es el de
// la casa: si PRECIO_IMPRESO_* tiene precio, el paso 3 lo ofrece.

export function metadataKids(idioma: IdiomaWeb): Metadata {
  const K = CHECKOUT_KIDS[idioma];
  return { title: K.tituloPagina, description: K.descripcion, alternates: alternativas(idioma, "/comprar/kids") };
}

export function PaginaComprarKids({ idioma }: { idioma: IdiomaWeb }) {
  const { precio } = preciosKids(idioma);
  const casa = catalogo(regionDeIdioma(idioma));
  // El impreso de Kids es el de la casa (Naza 15/10): el catálogo de Kids solo si se vende.
  const cat = precio === null ? null : catalogoKids(casa, precio);
  return (
    <CascaronCheckout idioma={idioma} inicio="/kids" kids>
      <CheckoutKids idioma={idioma} precio={precio} moneda={casa.moneda} catalogo={cat} escribir={enlaceEscribir(TEXTOS_KIDS[idioma])} />
    </CascaronCheckout>
  );
}
