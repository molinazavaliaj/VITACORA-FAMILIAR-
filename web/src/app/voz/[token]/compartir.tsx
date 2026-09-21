"use client";

import { useState } from "react";

// El botón de compartir una frase (spec "Su voz": cada frase con su ancla para
// mandar UNA por WhatsApp). Es el mecanismo que hace que esto se contagie: un
// primo recibe la frase en su voz, escucha, y quiere el libro. En el celular
// usa la hoja de compartir del sistema (WhatsApp está ahí); si no existe,
// abre WhatsApp directo con el link; y siempre se puede copiar.

const boton = "inline-flex h-9 items-center justify-center rounded-full border border-[var(--linea-fuerte)] px-4 text-[13px] font-medium transition-colors [font-family:var(--fuente-micro)] hover:bg-[var(--bruma)]";

export function CompartirFrase({ texto, nombre, ancla }: { texto: string; nombre: string; ancla: string }) {
  const [copiado, setCopiado] = useState(false);

  function url() {
    // La URL de la página con el ancla de ESTA frase: quien la abre cae en ella.
    const u = new URL(window.location.href);
    u.hash = ancla;
    return u.toString();
  }
  const mensaje = () => `«${texto}» — ${nombre}, en su voz.`;

  async function compartir() {
    const link = url();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: `${nombre}, en su voz`, text: mensaje(), url: link });
        return;
      } catch {
        // Canceló, o el navegador no pudo: sigue con WhatsApp.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${mensaje()}\n${link}`)}`, "_blank", "noopener");
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copiá este link:", url());
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" className={`${boton} bg-[var(--texto)] text-[var(--fondo)] hover:opacity-90`} onClick={compartir}>
        Mandar por WhatsApp
      </button>
      <button type="button" className={boton} onClick={copiar}>
        {copiado ? "Link copiado" : "Copiar el link"}
      </button>
    </div>
  );
}
