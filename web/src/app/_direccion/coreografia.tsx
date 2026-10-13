"use client";

import { useEffect } from "react";

// Lo único del prototipo que corre en el navegador (2.ª vuelta, 13/10). No
// pinta nada: prende dos cosas que el CSS solo no puede.
//
// 1. Las capas. Una sección con [data-capa] queda fija detrás mientras la
//    siguiente sube y la tapa. Con sticky top:0 una sección más alta que la
//    pantalla escondería su final, así que se fija recién cuando su borde de
//    abajo llega al de la pantalla: top = min(0, alto de pantalla − su alto).
//    Para eso hace falta su alto (--alto), que se mide acá. Sin JS no hay
//    data-capa-lista y la sección baja normal: nada queda inaccesible.
//
// 2. Las frases que se completan solas. Un bloque con [data-revela] pasa a
//    «espera» (palabras tenues) al cargar y a «visto» cuando entra en pantalla:
//    ahí el CSS las enciende por tiempo, una detrás de otra. Sin JS o con
//    «menos movimiento», el bloque no cambia de estado y se ve completo.

export function Coreografia() {
  useEffect(() => {
    const capas = Array.from(document.querySelectorAll<HTMLElement>("[data-capa]"));
    const medir = new ResizeObserver((entradas) => {
      for (const e of entradas) {
        const el = e.target as HTMLElement;
        el.style.setProperty("--alto", `${Math.ceil(el.getBoundingClientRect().height)}px`);
        el.dataset.capaLista = "";
      }
    });
    capas.forEach((c) => medir.observe(c));

    let mirar: IntersectionObserver | undefined;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!quieto) {
      const bloques = Array.from(document.querySelectorAll<HTMLElement>("[data-revela]"));
      mirar = new IntersectionObserver(
        (entradas) => {
          for (const e of entradas) {
            if (!e.isIntersecting) continue;
            (e.target as HTMLElement).dataset.revela = "visto";
            mirar?.unobserve(e.target);
          }
        },
        { threshold: 0.45 },
      );
      // Sin medir nada a mano: los pasos viven en secciones con
      // content-visibility y medirlos las obligaría a pintarse al cargar (y a
      // pedir la cursiva antes de tiempo). El primer aviso del observador ya
      // dice qué está a la vista.
      for (const b of bloques) {
        b.dataset.revela = "espera";
        mirar.observe(b);
      }
    }

    return () => {
      medir.disconnect();
      mirar?.disconnect();
    };
  }, []);

  return null;
}
