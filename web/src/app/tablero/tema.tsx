"use client";

import { useState } from "react";

// El botón del tema: claro / oscuro, arriba a la derecha, siempre a la vista.
// No reescribe nada: pone o saca la clase .oscuro del panel, que invierte los
// roles de color de globals.css. La elección viaja en una cookie para que el
// servidor ya pinte el tema correcto en la próxima carga — sin el parpadeo de
// "primero claro, después oscuro" que tiene el localStorage.

export const COOKIE_TEMA = "tema";
export type Tema = "claro" | "oscuro";

const UN_ANIO = 60 * 60 * 24 * 365;

export function BotonTema({ inicial }: { inicial: Tema }) {
  const [tema, setTema] = useState<Tema>(inicial);

  function cambiar() {
    const nuevo: Tema = tema === "oscuro" ? "claro" : "oscuro";
    setTema(nuevo);
    document.getElementById("panel")?.classList.toggle("oscuro", nuevo === "oscuro");
    document.cookie = `${COOKIE_TEMA}=${nuevo}; path=/; max-age=${UN_ANIO}; samesite=lax`;
  }

  const oscuro = tema === "oscuro";
  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label={oscuro ? "Pasar al tema claro" : "Pasar al tema oscuro"}
      aria-pressed={oscuro}
      title={oscuro ? "Tema claro" : "Tema oscuro"}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--linea-fuerte)] bg-[var(--fondo)] text-[var(--texto)] transition-colors hover:bg-[var(--hueco)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--texto)] [touch-action:manipulation]"
    >
      {oscuro ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  );
}
