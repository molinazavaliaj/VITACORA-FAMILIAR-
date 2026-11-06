import Image from "next/image";
import type { IdiomaWeb } from "@/lib/idioma-web";
import { TelefonoWhatsApp } from "./telefono-whatsapp";

// Una charla real, en orden: el biógrafo pregunta, llega el audio y se escribe el
// capítulo; pregunta por fotos, llegan las fotos y quedan en el libro. Diseño
// propio, solo CSS, con una sola vuelta de 9 s para todas las piezas. El celular
// y el libro van uno al lado del otro (uno abajo del otro en el teléfono): nunca
// se pisan. Es ilustración: aria-hidden. Con «menos movimiento», todo a la vista.
const ONDA = "M1 7v0M6 3v8M11 5v4M16 1v12M21 4v6M26 2v10M31 5v4M36 3v8M41 6v2";
const FOTOS: [string, string] = ["/rediseno/juan-domingo-joven.jpg", "/rediseno/osvaldo-guitarra.jpg"];

function Renglones({ cuantos }: { cuantos: number }) {
  return (
    <div className="acu-renglones">
      {Array.from({ length: cuantos }, (_, i) => (
        <i key={i} style={{ width: `${[100, 92, 97, 88, 95][i % 5]}%` }} />
      ))}
    </div>
  );
}

export function AudiosLibro({ idioma, capitulos }: { idioma: IdiomaWeb; capitulos: [string, string] }) {
  return (
    <div className="acu-escena" aria-hidden>
      <TelefonoWhatsApp idioma={idioma} fotos={FOTOS} />
      <div className="acu-puente">
        <div className="acu-audio">
          <svg viewBox="0 0 46 14"><path d={ONDA} stroke="currentColor" strokeWidth="2" /></svg>
          2:14
        </div>
        {FOTOS.map((foto, i) => (
          <span key={foto} className={`acu-vuela acu-vuela--${i + 1}`}>
            <Image src={foto} alt="" fill sizes="64px" />
          </span>
        ))}
      </div>
      <div className="acu-abierto">
        <div className="acu-hoja acu-hoja--izq">
          <small>{capitulos[0]}</small>
          <Renglones cuantos={13} />
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
          <Renglones cuantos={7} />
        </div>
      </div>
    </div>
  );
}
