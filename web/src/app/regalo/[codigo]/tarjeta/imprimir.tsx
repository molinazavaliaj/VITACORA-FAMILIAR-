"use client";

/**
 * El botón de pantalla que abre el diálogo de imprimir (de ahí, también, guardar en PDF).
 * El texto lo pasa la página: es de quien compra (textosComprador(trato).botonImprimir).
 */
export function BotonImprimir({ className, texto }: { className?: string; texto: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {texto}
    </button>
  );
}
