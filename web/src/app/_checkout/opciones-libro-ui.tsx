import Image from "next/image";
import type { ReactNode } from "react";
import type { Catalogo } from "@/lib/productos";
import { Opcion } from "../_ui";
import { contadorDeMarcos, marcosParaRegalar, opcionDe, opcionesDeLibro, precioDeOpcion, type OpcionLibro } from "./opciones-libro";
import { Contador } from "./piezas";

// Las opciones del paso 1 de /comprar y /comprar/viaje (Naza 14/10), en este
// orden: impreso + digital + su foto enmarcada, impreso + digital, y digital. Radios nativos
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
  etiquetaMarco,
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
  /** La pastilla sobre el libro completo con marco («Para regalar», Naza 14/10), si la compra la lleva. */
  etiquetaMarco?: ReactNode;
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
            titulo={T.impresoTitulo} detalle={T.impresoDetalle} precio={precio("impreso")} />
        ) : (
          <Opcion key={o} name="formato" value="marco" checked={elegida === "marco"} onChange={() => onElegir("marco")}
            etiqueta={etiquetaMarco} titulo={T.marcoOpcionTitulo}
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

/**
 * El contador de marcos con foto para regalar (Naza 14/10), con la 2 y la 3.
 * El precio que dice sale del catálogo como lo cobra `armarCompra`: en la 2,
 * el primero a precio de marco y los demás a precio adicional; en la 3, solo
 * adicionales (el primero ya va en la opción). Con digital no se muestra.
 */
export function ContadorMarcos({
  estado,
  cat,
  onCambio,
  titulo,
  detalle,
  textos: T,
  formatear: f,
}: {
  estado: { formato: "digital" | "impreso"; marcos: number; opcion?: OpcionLibro };
  cat: Pick<Catalogo, "marco">;
  /** Los marcos para regalar elegidos (sin contar el de la opción 3). */
  onCambio: (n: number) => void;
  titulo: string;
  detalle: string;
  textos: {
    cadaUno: (p: string) => string;
    primeroYDemas: (primero: string, demas: string) => string;
    unoMenos: (t: string) => string;
    unoMas: (t: string) => string;
  };
  formatear: (n: number) => string;
}) {
  const c = contadorDeMarcos(opcionDe(estado), cat);
  if (!c) return null;
  const precio =
    c.demas === null ? `+${f(c.primero)}` : c.demas === c.primero ? T.cadaUno(f(c.primero)) : T.primeroYDemas(f(c.primero), f(c.demas));
  return (
    <Contador titulo={titulo} detalle={detalle} precio={precio} valor={marcosParaRegalar(estado)} onCambio={onCambio}
      menos={T.unoMenos(titulo)} mas={T.unoMas(titulo)} max={c.max} />
  );
}
