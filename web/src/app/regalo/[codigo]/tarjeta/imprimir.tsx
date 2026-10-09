"use client";

import { TEXTOS_REGALO } from "@/lib/regalo-textos";

/** El botón de pantalla que abre el diálogo de imprimir (de ahí, también, guardar en PDF). */
export function BotonImprimir({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {TEXTOS_REGALO.botonImprimir}
    </button>
  );
}
