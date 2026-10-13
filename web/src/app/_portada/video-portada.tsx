"use client";

import { useEffect, useRef, useState } from "react";

// El vídeo del hero (MOTION.md patrón 14, RENDIMIENTO.md §3.6). Nunca es el
// LCP: debajo está el póster, pintado por el servidor con next/image, y el
// vídeo se pone encima recién cuando puede sonar… sin sonido (no tiene pista
// de audio). El src no está en el HTML: se elige y se carga después del primer
// pintado, cuando el navegador está libre, y solo si el hero está a la vista.
// Con «menos movimiento» o «ahorro de datos» no se carga nunca: queda el póster.
// Al terminar espera 3,5 s sobre el último fotograma y vuelve a empezar, como
// en la maqueta (no es un loop seco).

type ConAhorro = Navigator & { connection?: { saveData?: boolean } };

const PAUSA_FINAL_MS = 3500;
/** Antes de este instante (desde que empezó la navegación) el vídeo no empieza a bajar. */
const ESPERA_MIN_MS = 3000;

export function VideoPortada({
  escritorio,
  movil,
  className = "",
}: {
  /** El mp4 para pantallas de 640 px o más. */
  escritorio: string;
  /** El mp4 recortado en vertical para el teléfono. */
  movil: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ((navigator as ConAhorro).connection?.saveData) return;

    let espera: ReturnType<typeof setTimeout> | undefined;
    let cancelarIdle: (() => void) | undefined;
    let cargado = false;

    const reproducir = () => {
      video.play().catch(() => {
        // Si el navegador no deja (modo ahorro de batería), queda el póster.
      });
    };
    const alPoder = () => {
      setListo(true);
      reproducir();
    };
    const alTerminar = () => {
      espera = setTimeout(() => {
        espera = undefined;
        video.currentTime = 0;
        reproducir();
      }, PAUSA_FINAL_MS);
    };

    const cargar = () => {
      if (cargado) return;
      cargado = true;
      video.src = window.matchMedia("(min-width: 640px)").matches ? escritorio : movil;
      video.load();
    };

    // Después del primer pintado, de la carga de la página, del segundo 3 y con
    // el navegador libre. El mp4 móvil pesa ~330 kB: si arranca antes compite
    // por el ancho de banda con el póster (el LCP), las tipografías y el JS.
    const programar = () => {
      const alIdle = () => {
        if ("requestIdleCallback" in window) {
          const id = window.requestIdleCallback(cargar, { timeout: 2500 });
          cancelarIdle = () => window.cancelIdleCallback(id);
        } else {
          cargar();
        }
      };
      const alCargar = () => {
        const faltan = Math.max(0, ESPERA_MIN_MS - performance.now());
        const id = setTimeout(alIdle, faltan);
        cancelarIdle = () => clearTimeout(id);
      };
      if (document.readyState === "complete") {
        alCargar();
      } else {
        window.addEventListener("load", alCargar, { once: true });
        cancelarIdle = () => window.removeEventListener("load", alCargar);
      }
    };

    // Solo si el hero se ve; y si se deja de ver, se pausa (no gasta batería abajo).
    const observador = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!cargado) programar();
          else if (video.paused && video.readyState >= 2 && !espera) reproducir();
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.1 },
    );
    observador.observe(video);

    video.addEventListener("canplay", alPoder, { once: true });
    video.addEventListener("ended", alTerminar);
    return () => {
      observador.disconnect();
      cancelarIdle?.();
      if (espera) clearTimeout(espera);
      video.removeEventListener("canplay", alPoder);
      video.removeEventListener("ended", alTerminar);
    };
  }, [escritorio, movil]);

  return (
    <video
      ref={ref}
      muted
      playsInline
      preload="none"
      aria-hidden
      tabIndex={-1}
      data-listo={listo ? "true" : "false"}
      className={`pointer-events-none opacity-0 transition-opacity duration-[var(--d-lento)] data-[listo=true]:opacity-100 ${className}`}
    />
  );
}
