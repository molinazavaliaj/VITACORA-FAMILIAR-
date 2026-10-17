"use client";

import { useEffect } from "react";

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

/** 297 mm en píxeles CSS (96 por pulgada): el ancho de una hoja sin escala. */
const ANCHO_HOJA_PX = (297 * 96) / 25.4;

/**
 * En pantalla, las hojas (297 mm, ~1123 px) se achican para entrar enteras en
 * el ancho de la ventana (amigo de Naza, 15/10: en el celular «sale blanca»).
 * Las hojas medían el triple que la pantalla del teléfono y se veía solo su
 * esquina izquierda: papel blanco con, a lo sumo, el toroide chico de la
 * contratapa; la tapa y el mensaje quedaban fuera, a la derecha. Deja la
 * escala en --escala de .tarjeta-pantalla; el CSS la aplica solo en pantalla
 * (al imprimir, la hoja vuelve a su tamaño real). Sin JS, se ve como antes,
 * con desplazamiento a lo ancho.
 */
export function EscalaHojas() {
  useEffect(() => {
    const hojas = document.querySelector<HTMLElement>(".tarjeta-hojas");
    const pantalla = hojas?.closest<HTMLElement>(".tarjeta-pantalla");
    if (!hojas || !pantalla) return;
    const medir = () => {
      const escala = Math.min(1, hojas.clientWidth / ANCHO_HOJA_PX);
      pantalla.style.setProperty("--escala", String(Math.floor(escala * 1000) / 1000));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(hojas);
    return () => observador.disconnect();
  }, []);
  return null;
}
