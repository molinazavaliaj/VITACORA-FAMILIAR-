"use client";

import { useState } from "react";

// El botón «Copiar» del link del creador. Si el navegador no deja copiar, el
// link sigue a la vista para copiarlo a mano.

export function BotonCopiar({ texto, copiar, copiado }: { texto: string; copiar: string; copiado: string }) {
  const [listo, setListo] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[#14140F] px-5 text-[14px] [font-family:var(--fuente-micro)]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setListo(true);
          setTimeout(() => setListo(false), 2000);
        } catch {
          setListo(false);
        }
      }}
    >
      <span aria-live="polite">{listo ? copiado : copiar}</span>
    </button>
  );
}
