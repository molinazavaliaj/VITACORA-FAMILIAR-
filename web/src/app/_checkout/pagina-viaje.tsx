import type { Metadata } from "next";
import { catalogo } from "@/lib/productos";
import { promoPorcentaje } from "@/lib/promo";
import { alternativas, regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { CHECKOUT_VIAJE } from "../_textos/checkout-viaje";
import { CheckoutViaje } from "../comprar/viaje/formulario";
import { CascaronCheckout } from "./cascaron";

// La compra de la Vitácora de viaje, la misma pantalla en /comprar/viaje,
// /ca/comprar/viaje y /ar/comprar/viaje. Estática, como la del libro de una
// vida: el catálogo de la región sale de las variables al construir.

export function metadataViaje(idioma: IdiomaWeb): Metadata {
  const V = CHECKOUT_VIAJE[idioma];
  return { title: V.tituloPagina, description: V.descripcion, alternates: alternativas(idioma, "/comprar/viaje") };
}

export function PaginaComprarViaje({ idioma }: { idioma: IdiomaWeb }) {
  return (
    <CascaronCheckout idioma={idioma} inicio="/viaje" viaje>
      <CheckoutViaje idioma={idioma} catalogo={catalogo(regionDeIdioma(idioma))} promo={promoPorcentaje()} />
    </CascaronCheckout>
  );
}
