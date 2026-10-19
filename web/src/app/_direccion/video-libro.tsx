"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// El libro que se abre, en video (rediseño 2026-10, arreglos chicos; MOTION.md
// nº 14 y RENDIMIENTO.md 3.6). Para las secciones de /ejemplo, /viaje y /kids
// (nunca un hero): nada de esto compite con el LCP.
//
// - Sin JS, en el servidor o con «menos movimiento» (o Save-Data): solo el
//   póster, quieto. El <video> ni se pinta.
// - Carga diferida: el `src` se pone recién cuando la sección se acerca a la
//   pantalla (IntersectionObserver, 300 px antes).
// - muted y playsInline (así el móvil lo deja arrancar solo), sin audio.
// - El póster tapa el video hasta que de verdad arranca (`playing`): nunca se
//   ve un cuadro negro.
// - No es un loop seco: al terminar, queda 3,5 s en el último cuadro y vuelve a
//   empezar. Fuera de pantalla se pausa (y la espera se cancela).

export const PAUSA_FINAL_MS = 3500;

/** Si el video puede andar: sin «menos movimiento» y sin ahorro de datos. */
export function puedeMoverse(ventana: Pick<Window, "matchMedia"> & { navigator?: { connection?: { saveData?: boolean } } }): boolean {
  if (ventana.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (ventana.navigator?.connection?.saveData) return false;
  return true;
}

export function VideoLibro({
  src,
  poster,
  alt,
  ancho,
  alto,
  sizes,
  className = "",
}: {
  src: string;
  poster: string;
  /** Qué se ve (va en el póster; el video es la misma imagen moviéndose). */
  alt: string;
  ancho: number;
  alto: number;
  sizes: string;
  className?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [cargar, setCargar] = useState(false);
  const [andando, setAndando] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = useRef(false);

  // Cuándo poner el src: cerca de la pantalla y si se puede mover.
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || typeof IntersectionObserver === "undefined") return;
    if (!puedeMoverse(window as never)) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (e.isIntersecting) setCargar(true);
        const v = video.current;
        if (!v) return;
        if (e.isIntersecting) {
          if (v.paused && !espera.current) v.play().catch(() => {});
        } else {
          if (espera.current) clearTimeout(espera.current);
          espera.current = null;
          v.pause();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observador.observe(nodo);
    return () => {
      observador.disconnect();
      if (espera.current) clearTimeout(espera.current);
    };
  }, []);

  const alTerminar = () => {
    espera.current = setTimeout(() => {
      espera.current = null;
      const v = video.current;
      if (!v || !visible.current) return;
      v.currentTime = 0;
      v.play().catch(() => {});
    }, PAUSA_FINAL_MS);
  };

  return (
    <div ref={caja} className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${ancho} / ${alto}` }}>
      {cargar ? (
        <video
          ref={video}
          src={src}
          muted
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover"
          onCanPlay={(e) => {
            if (visible.current && e.currentTarget.paused && !espera.current) e.currentTarget.play().catch(() => {});
          }}
          onPlaying={() => setAndando(true)}
          onEnded={alTerminar}
        />
      ) : null}
      <Image
        src={poster}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover transition-opacity duration-300 ${andando ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}
