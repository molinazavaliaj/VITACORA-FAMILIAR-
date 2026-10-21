import { altDe, imagenParaCompartir, TAMANO_IMAGEN, TIPO_IMAGEN } from "../../../_compartir/imagen";

// La imagen para compartir de /ca/comprar/kids (y de lo que cuelga de acá): kids, ca. Todo en _compartir/imagen.tsx.
export const alt = altDe("kids", "ca");
export const size = TAMANO_IMAGEN;
export const contentType = TIPO_IMAGEN;

export default function Imagen() {
  return imagenParaCompartir("kids", "ca");
}
