import Image from "next/image";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { TelefonoWhatsApp } from "./telefono-whatsapp";

// El celular con la charla de WhatsApp y el libro que se llena: salen audios y
// fotos, las fotos vuelan y quedan pegadas en la página. Diseño propio, solo
// CSS, con una vuelta de 6,5 s. El celular y el libro van uno al lado del otro
// (uno abajo del otro en el teléfono): nunca se pisan. Es ilustración:
// aria-hidden. Con «menos movimiento» queda todo a la vista.
const ONDA = "M1 7v0M6 3v8M11 5v4M16 1v12M21 4v6M26 2v10M31 5v4M36 3v8M41 6v2";
const FOTOS: [string, string] = ["/rediseno/juan-domingo-joven.jpg", "/rediseno/osvaldo-guitarra.jpg"];

function Audio({ duracion, clase = "" }: { duracion: string; clase?: string }) {
  return (
    <div className={`acu-audio ${clase}`}>
      <svg viewBox="0 0 46 14"><path d={ONDA} stroke="currentColor" strokeWidth="2" /></svg>
      {duracion}
    </div>
  );
}

/** Los renglones se escriben de a uno: cada uno arranca 0,08 s después del anterior. */
function Renglones({ cuantos, desde }: { cuantos: number; desde: number }) {
  return Array.from({ length: cuantos }, (_, i) => (
    <i key={i} style={{ width: `${[100, 92, 97, 88, 95][i % 5]}%`, animationDelay: `${(desde + i * 0.08).toFixed(2)}s` }} />
  ));
}

export function AudiosLibro({ idioma, capitulos }: { idioma: IdiomaWeb; capitulos: [string, string] }) {
  return (
    <div className="acu-escena" aria-hidden>
      <TelefonoWhatsApp idioma={idioma} fotos={FOTOS} />
      <div className="acu-puente">
        <Audio duracion="2:14" />
        <Audio duracion="1:08" clase="acu-audio--2" />
        {FOTOS.map((foto, i) => (
          <span key={foto} className={`acu-vuela acu-vuela--${i + 1}`}>
            <Image src={foto} alt="" fill sizes="64px" />
          </span>
        ))}
      </div>
      <div className="acu-abierto">
        <div className="acu-hoja acu-hoja--izq">
          <small>{capitulos[0]}</small>
          <Renglones cuantos={13} desde={0.95} />
        </div>
        <div className="acu-hoja acu-hoja--der">
          <small>{capitulos[1]}</small>
          <div className="acu-pegadas">
            {FOTOS.map((foto, i) => (
              <span key={foto} className={`acu-pega acu-pega--${i + 1}`}>
                <Image src={foto} alt="" fill sizes="110px" />
              </span>
            ))}
          </div>
          <Renglones cuantos={7} desde={3.95} />
        </div>
      </div>
    </div>
  );
}
