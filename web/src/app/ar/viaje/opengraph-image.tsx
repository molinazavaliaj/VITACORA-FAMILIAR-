import { altDe, imagenParaCompartir, TAMANO_IMAGEN, TIPO_IMAGEN } from "../../_compartir/imagen";

// La imagen para compartir de /ar/viaje (y de lo que cuelga de acá): viaje, ar. Todo en _compartir/imagen.tsx.
export const alt = altDe("viaje", "ar");
export const size = TAMANO_IMAGEN;
export const contentType = TIPO_IMAGEN;

export default function Imagen() {
  return imagenParaCompartir("viaje", "ar");
}
