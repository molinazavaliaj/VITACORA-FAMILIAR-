import { altDe, imagenParaCompartir, TAMANO_IMAGEN, TIPO_IMAGEN } from "../_compartir/imagen";

// La imagen para compartir de /kids (y de lo que cuelga de acá): kids, es. Todo en _compartir/imagen.tsx.
export const alt = altDe("kids", "es");
export const size = TAMANO_IMAGEN;
export const contentType = TIPO_IMAGEN;

export default function Imagen() {
  return imagenParaCompartir("kids", "es");
}
