import Image from "next/image";
import { Toroide } from "../marca";
import "./marco-dibujado.css";

// El marco con su foto dibujado en código (Naza 14/10: la miniatura era la
// foto de una foto de un cuadro y no se entendía). Como el libro: nítido a
// cualquier tamaño, todo medido en el ancho del marco (cqw). Moldura negra
// fina de madera con algo de canto y sombra, paspartú crema y adentro la foto
// de Osvaldo de la tapa, recortada al retrato y en sepia suave. Abajo, en el
// paspartú, el toroide chiquito grabado: el chip que no se ve. Solo dibujo
// (aria-hidden): quien lo usa pone el texto. Componente de servidor, sin JS;
// sirve para el checkout y para la portada. Estilos en ./marco-dibujado.css.

const FOTO = "/rediseno/libro-tapa-foto.jpg";

export function MarcoDibujado({
  ancho,
  sizes,
  className = "",
}: {
  /** Ancho del marco en px (el alto sale de la proporción 4:5). Sin él, ocupa el ancho de su caja. */
  ancho?: number;
  /** El `sizes` de la foto; por defecto, el 70 % del ancho. */
  sizes?: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={`mdb ${className}`.trim()} style={ancho ? { width: ancho } : undefined}>
      <span className="mdb-moldura">
        <span className="mdb-paspartu">
          <span className="mdb-foto">
            <Image src={FOTO} alt="" fill sizes={sizes ?? (ancho ? `${Math.ceil(ancho * 0.7)}px` : "64px")} className="mdb-img" />
          </span>
          <Toroide className="mdb-chip" />
        </span>
      </span>
    </span>
  );
}
