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

    // 3. Lo pesado que está lejos. Un bloque con [data-lejos] (el libro 3D)
    //    no se arma (content-visibility: hidden) hasta que está a media
    //    pantalla de distancia: así sus letras en cursiva y sus fotos no
    //    compiten con la portada al cargar. Sin JS, un <noscript> lo deja visible.
    const lejos = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          delete (e.target as HTMLElement).dataset.lejos;
          lejos.unobserve(e.target);
        }
      },
      { rootMargin: "50% 0px" },
    );
    const pesados = Array.from(document.querySelectorAll<HTMLElement>("[data-lejos]"));
    pesados.forEach((b) => lejos.observe(b));
    // Armarlo cuesta (con la CPU x4, ~0,6 s de un tirón): mejor hacerlo
    // cuando el navegador está libre después de cargar que justo mientras la
    // persona baja. Si baja antes, lo arma el observador.
    const armar = () => pesados.forEach((b) => delete b.dataset.lejos);
    let cancelarArmar: (() => void) | undefined;
    const alCargar = () => {
      if ("requestIdleCallback" in window) {
        const id = window.requestIdleCallback(armar, { timeout: 4000 });
        cancelarArmar = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(armar, 1500);
        cancelarArmar = () => clearTimeout(id);
      }
    };
    if (document.readyState === "complete") alCargar();
    else window.addEventListener("load", alCargar, { once: true });

    // 4. El libro 3D gira por tiempo, quieto en su lugar (no atado al scroll):
    //    arranca cuando está entero y centrado en pantalla, una sola vez; al
    //    terminar queda abierto. «Ver otra vez» o tocar el libro lo repiten.
    //    Con «menos movimiento» no se toca: queda en 3/4 con el pliego plano.
    const quietoLibro = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const limpiarLibro: Array<() => void> = [];
    if (!quietoLibro) {
      document.querySelectorAll<HTMLElement>("[data-libro-3d]").forEach((seccion) => {
        const escena = seccion.querySelector<HTMLElement>(".l3-escena");
        const libro = seccion.querySelector<HTMLElement>(".l3-libro");
        if (!escena || !libro) return;
        seccion.dataset.libro = "quieto";
        const correr = () => {
          seccion.dataset.libro = "quieto";
          void seccion.offsetWidth; // reinicia la animación
          seccion.dataset.libro = "anda";
        };
        const alTerminar = (e: AnimationEvent) => {
          if (e.target === libro && e.animationName === "l3-girar") seccion.dataset.libro = "abierto";
        };
        const ver = new IntersectionObserver(
          (entradas) => {
            if (!entradas.some((e) => e.isIntersecting)) return;
            ver.disconnect();
            correr();
          },
          // Entero y en la franja central de la pantalla, no apenas entra.
          { threshold: 0.95, rootMargin: "-10% 0px -10% 0px" },
        );
        ver.observe(escena);
        const boton = seccion.querySelector<HTMLElement>("[data-libro-otra-vez]");
        libro.addEventListener("animationend", alTerminar);
        escena.addEventListener("click", correr);
        boton?.addEventListener("click", correr);
        limpiarLibro.push(() => {
          ver.disconnect();
          libro.removeEventListener("animationend", alTerminar);
          escena.removeEventListener("click", correr);
          boton?.removeEventListener("click", correr);
        });
      });
    }

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
      lejos.disconnect();
      window.removeEventListener("load", alCargar);
      cancelarArmar?.();
      limpiarLibro.forEach((f) => f());
      mirar?.disconnect();
    };
  }, []);

  return null;
}
