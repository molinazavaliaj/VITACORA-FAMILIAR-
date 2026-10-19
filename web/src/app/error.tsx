"use client";

import { useEffect } from "react";
import { PaginaDeError } from "./_publico/pagina-error";

// Lo que ve una persona si algo se rompe en el servidor (18/10). Antes salía la
// pantalla técnica de Next, en inglés y con el mensaje del error.
//
// Este es el límite de errores de toda la web: cubre /, /ca/... y /ar/... salvo
// que la sección tenga el suyo (app/ca/error.tsx, app/ar/error.tsx). El texto va
// en castellano neutro, como el 404 de la raíz.
//
// El botón: Next 16.3 pasó a llamar `retry()` a lo que antes era `reset()` (la
// documentación del paquete lo dice en 03-file-conventions/error.md). Se acepta
// cualquiera de las dos para no depender del nombre.

export default function Error({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  const alReintentar = retry ?? reset;

  useEffect(() => {
    // Solo el digest. El mensaje del error puede traer la ruta pedida y, con
    // ella, el token firmado de una familia: eso no va a ningún log.
    console.error("[error 500]", error.digest ?? "sin digest");
  }, [error]);

  return <PaginaDeError idioma="es" alReintentar={() => alReintentar?.()} />;
}
