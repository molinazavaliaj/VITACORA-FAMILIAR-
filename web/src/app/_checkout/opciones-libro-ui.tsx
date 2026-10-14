import Image from "next/image";
import type { ReactNode } from "react";
import type { Catalogo } from "@/lib/productos";
import { Opcion } from "../_ui";
import { opcionesDeLibro, precioDeOpcion, type OpcionLibro } from "./opciones-libro";

// Las opciones del paso 1 de /comprar y /comprar/viaje (Naza 14/10): digital,
// impreso + digital, e impreso + digital + su foto enmarcada. Radios nativos
// del mismo grupo (`formato`): una sola elegida, con el dedo o las flechas.
// La tercera lleva la foto del marco, en arco y en sepia. Sin texto propio:
// todo llega del diccionario de cada compra.

export type TextosOpciones = {
  titulo: string;
  digitalTitulo: string;
  digitalDetalle: string;
  impresoTitulo: string;
  impresoDetalle: string;
  marcoOpcionTitulo: string;
  marcoOpcionDetalle: string;
  marcoFotoAlt: string;
};

export function OpcionesLibro({
  cat,
  base,
  elegida,
  onElegir,
  textos: T,
  foto,
  etiquetaImpreso,
  formatear,
}: {
  cat: Pick<Catalogo, "impreso" | "marco">;
  /** El precio de la base (el libro de una vida o el viaje). */
  base: number;
  elegida: OpcionLibro;
  onElegir: (o: OpcionLibro) => void;
  textos: TextosOpciones;
  /** La foto del marco de esta compra. */
  foto: string;
  /** La pastilla sobre el impreso («Para regalar»), si la compra la lleva. */
  etiquetaImpreso?: ReactNode;
  formatear: (n: number) => string;
}) {
  const precio = (o: OpcionLibro) => {
    const p = precioDeOpcion(o, base, cat);
    return p === null ? null : formatear(p);
  };
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">{T.titulo}</legend>
      {opcionesDeLibro(cat).map((o) =>
        o === "digital" ? (
          <Opcion key={o} name="formato" value="digital" checked={elegida === "digital"} onChange={() => onElegir("digital")}
            titulo={T.digitalTitulo} detalle={T.digitalDetalle} precio={precio("digital")} />
        ) : o === "impreso" ? (
          <Opcion key={o} name="formato" value="impreso" checked={elegida === "impreso"} onChange={() => onElegir("impreso")}
            etiqueta={etiquetaImpreso} titulo={T.impresoTitulo} detalle={T.impresoDetalle} precio={precio("impreso")} />
        ) : (
          <Opcion key={o} name="formato" value="marco" checked={elegida === "marco"} onChange={() => onElegir("marco")}
            titulo={T.marcoOpcionTitulo}
            detalle={
              <span className="mt-1 flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
                <span className="dir-marco dir-marco--arco chk-marco-mini">
                  <span className="dir-foto dir-foto--arco block">
                    <Image src={foto} alt={T.marcoFotoAlt} fill sizes="76px" className="object-cover object-[50%_42%]" />
                  </span>
                </span>
                <span>{T.marcoOpcionDetalle}</span>
              </span>
            }
            precio={precio("marco")} />
        ),
      )}
    </fieldset>
  );
}
