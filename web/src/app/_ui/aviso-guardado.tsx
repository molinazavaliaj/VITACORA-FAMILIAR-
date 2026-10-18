"use client";

import { useEffect, useState } from "react";

// El aviso chico de «✓ Guardado» (maqueta Panel, `hasToast`; MOTION 8b): sale
// abajo al centro cuando algo se guardó y se va solo a los 3 s. En el celular,
// por encima de la barra de abajo del panel (Inicio · Historias · Libro). `vez` cuenta
// los guardados: cada número nuevo lo vuelve a mostrar (0 = todavía nada). La
// región con role="status" está siempre puesta, para que el lector de
// pantalla anuncie el texto cuando aparece.

const DURA_MS = 3000;
const SALIDA_MS = 200;

export function AvisoGuardado({ vez, texto }: { vez: number; texto: string }) {
  const [fase, setFase] = useState<"oculto" | "visible" | "saliendo">("oculto");

  useEffect(() => {
    if (vez === 0) return;
    setFase("visible");
    const salir = setTimeout(() => setFase("saliendo"), DURA_MS);
    const ocultar = setTimeout(() => setFase("oculto"), DURA_MS + SALIDA_MS);
    return () => {
      clearTimeout(salir);
      clearTimeout(ocultar);
    };
  }, [vez]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-[60] flex justify-center px-4 md:bottom-6">
      {fase !== "oculto" ? (
        <p
          key={vez}
          data-saliendo={fase === "saliendo" ? "true" : undefined}
          className="m-aviso flex items-center gap-2.5 rounded-[14px] border border-[var(--linea-fuerte)] bg-[var(--texto)] px-[18px] py-3 text-[14px] text-[var(--fondo)] shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] [font-family:var(--fuente-micro)]"
        >
          <span aria-hidden>✓</span>
          <span>{texto}</span>
        </p>
      ) : null}
    </div>
  );
}
