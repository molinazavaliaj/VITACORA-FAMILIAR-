import type { ReactNode } from "react";

// Entrada suave al hacer scroll, en CSS puro (ver el <style> de la landing):
// donde el navegador soporta animation-timeline el bloque aparece con un fade
// al entrar al viewport, y donde no, se ve estático desde el principio. Nunca
// puede quedar contenido invisible — la animación falla hacia visible.
export function Aparece({ children }: { children: ReactNode }) {
  return <div className="aparece">{children}</div>;
}
