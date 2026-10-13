import type { Muestra } from "@/lib/muestra";
import { TapaLibro } from "./tapa-libro";

// La muestra de un libro, tal como la ve un primo (página pública) o un
// visitante que la guardó (adentro del panel). Una sola pieza para las dos.
// Recibe cómo resolver las URLs de audio y portada porque afuera van por
// token y adentro van por sesión.

export function VistaMuestra({ muestra, urlAudio, urlPortada }: { muestra: Muestra; urlAudio: string | null; urlPortada: string | null }) {
  return (
    <div className="grid gap-10 md:grid-cols-[240px_1fr]">
      <TapaLibro titulo={muestra.titulo} fotoSrc={urlPortada} idioma={muestra.idioma} className="self-start rounded-sm shadow-lg" />

      <div className="flex flex-col gap-8">
        <div>
          <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Capítulos</p>
          <ol className="mt-3 flex flex-col gap-1.5">
            {muestra.capitulos.map((c, i) => (
              <li key={c} className="flex gap-3 text-[16px]">
                <span className="w-5 text-right text-[var(--texto-menor)] tabular-nums [font-family:var(--fuente-micro)]">{i + 1}</span>
                <span className="[font-family:var(--fuente-titulo)]">{c}</span>
              </li>
            ))}
          </ol>
        </div>

        {muestra.primerParrafo ? (
          <div>
            <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Así empieza</p>
            <p className="mt-3 max-w-prose text-[17px] leading-[1.75] text-[var(--texto-suave)] [font-family:var(--fuente-cuerpo)] font-light">
              {muestra.primerParrafo}
            </p>
          </div>
        ) : null}

        {urlAudio && muestra.tieneAudio ? (
          <div>
            <p className="text-[11px] uppercase text-[var(--texto-menor)] [font-family:var(--fuente-micro)] [letter-spacing:0.24em]">Su voz</p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls preload="none" src={urlAudio} className="mt-3 w-full max-w-md" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
