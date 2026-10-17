"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// La demo del marco con chip (MOTION.md patrón 13, maqueta Resto «Su foto, en
// casa»): un bucle de 7 s en el que el teléfono se acerca al marco, salen dos
// anillos, se abre su libro y se iluminan los pasos 1-2-3. Es decorativa:
// - El servidor pinta solo la foto y los tres pasos, quietos.
// - El teléfono y los anillos se suman en el navegador, encima de la foto (no
//   empujan nada), y nunca con «menos movimiento».
// - Fuera de pantalla el bucle se pausa (animation-play-state).

export function DemoMarco({
  foto,
  altFoto,
  portada,
  telefonoQuieto,
  telefonoLibro,
  pasos,
}: {
  foto: string;
  altFoto: string;
  portada: string;
  telefonoQuieto: string;
  telefonoLibro: string;
  pasos: readonly [string, string, string];
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [animar, setAnimar] = useState(false);
  const [aLaVista, setALaVista] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimar(true);
    const el = caja.current;
    if (!el) return;
    const observador = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting), { threshold: 0.15 });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={caja} className="nfc-demo flex flex-col gap-4" data-pausado={aLaVista ? "false" : "true"}>
      <div className="relative overflow-hidden rounded-[24px]">
        <Image
          src={foto}
          alt={altFoto}
          width={760}
          height={944}
          sizes="(min-width: 1024px) 480px, (min-width: 640px) 60vw, 100vw"
          className="block aspect-[4/5] h-auto w-full object-cover"
        />
        {animar ? (
          <div aria-hidden className="absolute inset-0">
            <span className="nfc-ring absolute left-[66%] top-1/2 -ml-[35px] -mt-[35px] h-[70px] w-[70px] rounded-full border-2 border-[#eeeae1]" />
            <span className="nfc-ring nfc-ring2 absolute left-[66%] top-1/2 -ml-[35px] -mt-[35px] h-[70px] w-[70px] rounded-full border-2 border-[#eeeae1]" />
            <div className="nfc-phone absolute left-[64%] top-[44%] box-border aspect-[9/19] w-1/4 rounded-[22px] border-[3px] border-[#2c2b28] bg-[#0d0d0c] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,.55)]">
              <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-[#151512]">
                <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-[10px] text-[#6f6c66] [font-family:var(--fuente-micro)]">
                  {telefonoQuieto}
                </div>
                <div className="nfc-open absolute inset-0 flex flex-col gap-[7px] bg-[#12120f] px-2 py-2.5">
                  <Image src={portada} alt="" width={376} height={520} sizes="120px" className="block aspect-[3/4] h-auto w-full rounded-[5px] object-cover" />
                  <span className="text-[10px] leading-tight text-white [font-family:var(--fuente-cuerpo)]">{telefonoLibro}</span>
                  <div className="flex items-center gap-[5px]">
                    <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-[var(--boton)] text-[7px] text-[#14140f]">▶</span>
                    <div className="flex h-[18px] items-center gap-[2px]">
                      {[6, 11, 16, 9, 14, 7, 12, 15, 8, 13, 10, 6].map((alto, i) => (
                        <span key={i} className="nfc-bar block w-[2px] rounded-[2px] bg-[var(--acento-oscuro)]" style={{ height: alto }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ol className="grid grid-cols-3 gap-2.5">
        {pasos.map((paso, i) => (
          <li
            key={paso}
            className={`flex flex-col gap-1 border-t-2 border-[var(--acento-oscuro)] pt-2.5 ${animar ? `nfc-s nfc-s${i + 1}` : ""}`}
          >
            <span className="text-[11px] tracking-[0.14em] text-[var(--acento-oscuro)] [font-family:var(--fuente-micro)]">{i + 1}</span>
            <span className="text-[14px] leading-snug text-[var(--texto-oscuro)] [font-family:var(--fuente-micro)]">{paso}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
