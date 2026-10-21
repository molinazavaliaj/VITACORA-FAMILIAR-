import { altDe, imagenParaCompartir, TAMANO_IMAGEN, TIPO_IMAGEN } from "../../../_compartir/imagen";

// La imagen para compartir de /ar/comprar/kids (y de lo que cuelga de acá): kids, ar. Todo en _compartir/imagen.tsx.
export const alt = altDe("kids", "ar");
export const size = TAMANO_IMAGEN;
export const contentType = TIPO_IMAGEN;

export default function Imagen() {
  return imagenParaCompartir("kids", "ar");
}
