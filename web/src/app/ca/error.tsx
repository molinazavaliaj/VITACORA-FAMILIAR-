"use client";

import { useEffect } from "react";
import { PaginaDeError } from "../_publico/pagina-error";

// El 500 de la versión /ca. Mismo diseño y mismo botón que el de la raíz
// (app/error.tsx), con los textos en catalán.

export default function Error({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    // Solo el digest: el mensaje puede traer rutas con tokens de una familia.
    console.error("[error 500]", error.digest ?? "sin digest");
  }, [error]);

  return <PaginaDeError idioma="ca" alReintentar={() => (retry ?? reset)?.()} />;
}
