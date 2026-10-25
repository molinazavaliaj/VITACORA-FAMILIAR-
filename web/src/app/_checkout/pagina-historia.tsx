import type { Metadata } from "next";
import { catalogo } from "@/lib/productos";
import { promoPorcentaje } from "@/lib/promo";
import { rascaPrendido } from "@/lib/cupon";
import { creadoresPrendido } from "@/lib/creadores";
import { entregaWhatsAppPrendida } from "@/lib/regalo-entrega";
import { historiaVendeEn } from "@/lib/historia";
import { alternativas, regionDeIdioma, type IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_HISTORIA } from "../_textos/historia";
import { enlaceEscribir } from "../_kids/piezas";
import { Checkout } from "../comprar/formulario";
import { CascaronCheckout } from "./cascaron";

// La compra de «Vitácora de una historia» (plan 2026-10-21, Task 4.4), la misma pantalla en /comprar/historia,
// /ca/comprar/historia y /ar/comprar/historia: la compra de Familiar (mismo catálogo, mismo precio) con el paso
// «La historia». Estática. Sin HISTORIA_VENTA, «Próximamente» y «Escribinos» en lugar del formulario (la API
// tampoco la vende: lib/registro.ts).

export function metadataHistoria(idioma: IdiomaWeb): Metadata {
  const t = TEXTOS_HISTORIA[idioma].meta;
  return { title: { absolute: t.titulo }, description: t.descripcion, alternates: alternativas(idioma, "/comprar/historia") };
}

export function PaginaComprarHistoria({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_HISTORIA[idioma];
  if (!historiaVendeEn(idioma)) {
    const escribir = enlaceEscribir({ correo: { asunto: t.proximamente.asunto, cuerpo: t.proximamente.cuerpo } });
    return (
      <CascaronCheckout idioma={idioma} inicio="/historia">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-4 py-24 sm:px-8">
          <h1 className="chk-h1">{t.proximamente.titulo}</h1>
          <p className="chk-bajada">{t.proximamente.texto}</p>
          <a href={escribir.href} {...(escribir.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="m-btn inline-flex min-h-12 items-center self-start rounded-full bg-white px-6 font-medium text-[#14140f]">
            {t.proximamente.boton}
          </a>
        </div>
      </CascaronCheckout>
    );
  }
  return (
    <CascaronCheckout idioma={idioma} inicio="/historia">
      <Checkout
        idioma={idioma}
        historia
        catalogo={catalogo(regionDeIdioma(idioma))}
        promo={promoPorcentaje()}
        entregaWhatsApp={entregaWhatsAppPrendida()}
        conCupon={(rascaPrendido() || creadoresPrendido()) && promoPorcentaje() === null}
        pistaCupon={rascaPrendido()}
      />
    </CascaronCheckout>
  );
}
