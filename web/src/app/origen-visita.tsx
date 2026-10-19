"use client";

import { useEffect } from "react";
import { alCargarLaWeb } from "@/lib/origen";

// Recuerda de qué anuncio llegó la visita (lib/origen.ts), solo en la memoria
// de la página: nada de localStorage, sessionStorage ni cookies. Va en el layout
// raíz, que no se vuelve a montar al cambiar de página con los `Link` de Next,
// así que corre una sola vez por carga, con la URL de llegada. No pinta nada.
// También borra, sin leerla, la clave `vitacora-origen` que guardaba la
// versión del 14/10.
export function OrigenVisita() {
  useEffect(() => {
    alCargarLaWeb(() => window, new Date());
  }, []);
  return null;
}
