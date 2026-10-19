"use client";

import { HojaAviso } from "./hoja-aviso";
import { TEXTOS_AVISOS } from "../_textos/avisos";
import type { IdiomaWeb } from "@/lib/idioma-web";

// La página de error 500 (rediseño 2026-10). Antes no había: si algo explotaba
// en el servidor, Next mostraba su pantalla técnica, en inglés, con el mensaje
// del error. Esta es la misma hoja del 404 (la maqueta «Casos» 5), con un botón
// para reintentar y el enlace al inicio.
//
// Es un componente CLIENTE porque el botón llama a `retry()`, que vive en el
// límite de error de Next (`app/error.tsx`, `app/ca/error.tsx`, `app/ar/error.tsx`).
// El mensaje técnico del error NO se pinta nunca: no entra por props.

export function PaginaDeError({ idioma, alReintentar }: { idioma: IdiomaWeb; alReintentar: () => void }) {
  const t = TEXTOS_AVISOS[idioma];
  return (
    <HojaAviso
      idioma={idioma}
      aviso={t.falla}
      salidas={[{ tipo: "inicio" }]}
      accion={
        <button type="button" onClick={alReintentar} className="avi-boton">
          {t.reintentar}
        </button>
      }
    />
  );
}
