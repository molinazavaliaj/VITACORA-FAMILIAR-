"use client";

import { useState } from "react";
import { TEXTOS_VOZ } from "../../_textos/voz";
import type { IdiomaWeb } from "@/lib/idioma-web";

// Compartir desde «Su voz». Dos cosas:
// - Una frase (spec "Su voz": cada frase con su ancla para mandar UNA por
//   WhatsApp). Es el mecanismo que hace que esto se contagie: un primo recibe
//   la frase en su voz, escucha, y quiere el libro.
// - La página entera, para la familia (maqueta SuVoz, «Compartir con la familia»).
// En el celular usa la hoja de compartir del sistema (WhatsApp está ahí); si no
// existe, la frase abre WhatsApp directo y la página copia el link.

async function copiar(link: string, aviso: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    window.prompt(aviso, link);
    return false;
  }
}

async function hojaDeCompartir(datos: ShareData): Promise<boolean> {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;
  try {
    await navigator.share(datos);
    return true;
  } catch {
    // Canceló, o el navegador no pudo: sigue con lo otro.
    return false;
  }
}

const enlace = "underline decoration-[var(--dir-hilo-tinta)] underline-offset-4 transition-colors hover:text-[var(--dir-sobre-tinta)] hover:decoration-[var(--dir-sobre-tinta)]";

export function CompartirFrase({ texto, nombre, ancla, idioma }: { texto: string; nombre: string; ancla: string; idioma: IdiomaWeb }) {
  const T = TEXTOS_VOZ[idioma];
  const [copiado, setCopiado] = useState(false);

  function url() {
    // La URL de la página con el ancla de ESTA frase: quien la abre cae en ella.
    const u = new URL(window.location.href);
    u.hash = ancla;
    return u.toString();
  }

  async function mandar() {
    const link = url();
    const mensaje = T.mensajeFrase(texto, nombre);
    if (await hojaDeCompartir({ title: T.compartirTitulo(nombre), text: mensaje, url: link })) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${mensaje}\n${link}`)}`, "_blank", "noopener");
  }

  async function copiarLink() {
    if (await copiar(url(), T.copiaEsteLink)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[var(--dir-sobre-tinta-suave)] [font-family:var(--fuente-micro)]">
      <button type="button" className={enlace} onClick={mandar}>
        {T.mandarWhatsapp}
      </button>
      <button type="button" className={enlace} onClick={copiarLink}>
        {copiado ? T.linkCopiado : T.copiarLink}
      </button>
    </div>
  );
}

export function CompartirPagina({ nombre, idioma }: { nombre: string; idioma: IdiomaWeb }) {
  const T = TEXTOS_VOZ[idioma];
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    // La página sin ancla: entra por arriba, por la foto.
    const u = new URL(window.location.href);
    u.hash = "";
    const link = u.toString();
    if (await hojaDeCompartir({ title: T.compartirTitulo(nombre), url: link })) return;
    if (await copiar(link, T.copiaEsteLink)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  return (
    <button type="button" onClick={compartir} className="dir-boton dir-boton--hilo dir-boton--chico self-start" aria-live="polite">
      {copiado ? T.copiado : T.compartir}
    </button>
  );
}
