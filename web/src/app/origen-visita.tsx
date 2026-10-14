"use client";

import { useEffect } from "react";
import { registrarVisita } from "@/lib/origen";

// Anota de qué anuncio llegó la visita (lib/origen.ts). No pinta nada y corre
// cuando el navegador está libre, después de la primera pintura: no toca el
// LCP ni hace dinámica a ninguna página. Va en el layout raíz, así cubre
// cualquier página donde caiga un anuncio.
export function OrigenVisita() {
  useEffect(() => {
    const correr = () => {
      try {
        registrarVisita(() => window.localStorage, window.location.search, window.location.pathname, new Date());
      } catch {
        // nunca rompe la página
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(correr, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(correr, 200);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
