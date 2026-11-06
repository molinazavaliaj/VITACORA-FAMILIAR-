// Qué estado sigue cuando termina una animación del libro 3D. En la portada
// (data-libro-cierra) hay una sola, l3-viaje: gira, se abre, se cierra y termina
// en la pose del principio. En los demás lados, l3-girar lo deja abierto.
export type EstadoLibro = "abierto" | "quieto";

export function siguienteEstadoLibro(animacion: string, cierra: boolean): EstadoLibro | null {
  if (animacion === "l3-girar" && !cierra) return "abierto";
  if (animacion === "l3-viaje" && cierra) return "quieto";
  return null;
}
