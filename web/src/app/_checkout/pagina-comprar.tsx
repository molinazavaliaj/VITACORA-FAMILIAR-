import type { Metadata } from "next";
import { catalogo } from "@/lib/productos";
import { promoPorcentaje } from "@/lib/promo";
import { rascaPrendido } from "@/lib/cupon";
import { entregaWhatsAppPrendida } from "@/lib/regalo-entrega";
import { alternativas, regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { CHECKOUT } from "../_textos/checkout";
import { Checkout } from "../comprar/formulario";
import { CascaronCheckout } from "./cascaron";

// La compra del libro de una vida, la misma pantalla en /comprar, /ca/comprar y
// /ar/comprar (archivos finos que la llaman con su idioma). Estática: el
// catálogo de la región sale de las variables de entorno al construir (los
// precios viven ahí, nunca escritos a mano) y la región, del idioma de la ruta.
// Quien llega desde fuera de Europa a /comprar va a /ar/comprar por el CDN
// (next.config.ts), sin arrancar ninguna función.

export function metadataComprar(idioma: IdiomaWeb): Metadata {
  const T = CHECKOUT[idioma];
  return { title: T.tituloPagina, description: T.descripcion, alternates: alternativas(idioma, "/comprar") };
}

export function PaginaComprar({ idioma }: { idioma: IdiomaWeb }) {
  return (
    <CascaronCheckout idioma={idioma}>
      <Checkout
        idioma={idioma}
        catalogo={catalogo(regionDeIdioma(idioma))}
        promo={promoPorcentaje()}
        entregaWhatsApp={entregaWhatsAppPrendida()}
        // El cupón no se suma a precios ya rebajados: con la promo global prendida, no hay campo.
        conCupon={rascaPrendido() && promoPorcentaje() === null}
      />
    </CascaronCheckout>
  );
}
