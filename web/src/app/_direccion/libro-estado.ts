// Qué estado sigue cuando termina una animación del libro 3D. En la portada
// (data-libro-cierra) se abre, se vuelve a cerrar y queda la tapa a la vista.
export type EstadoLibro = "abierto" | "cierra" | "quieto";

export function siguienteEstadoLibro(animacion: string, cierra: boolean): EstadoLibro | null {
  if (animacion === "l3-girar") return cierra ? "cierra" : "abierto";
  if (animacion === "l3-cerrar" && cierra) return "quieto";
  return null;
}
