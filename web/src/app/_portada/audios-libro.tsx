import type { IdiomaWeb } from "@/lib/idioma-web";
import { TelefonoWhatsApp } from "./telefono-whatsapp";

// El celular con la charla de WhatsApp, el audio que viaja y el libro que se
// va escribiendo. Diseño propio, solo CSS. El celular y el libro van uno al
// lado del otro (uno abajo del otro en el teléfono): nunca se pisan. Es
// ilustración: aria-hidden. Con «menos movimiento» queda todo a la vista.
const ONDA = "M1 7v0M6 3v8M11 5v4M16 1v12M21 4v6M26 2v10M31 5v4M36 3v8M41 6v2";

export function AudiosLibro({ idioma, capitulos }: { idioma: IdiomaWeb; capitulos: [string, string] }) {
  return (
    <div className="acu-escena" aria-hidden>
      <TelefonoWhatsApp idioma={idioma} />
      <div className="acu-puente">
        <div className="acu-audio">
          <svg viewBox="0 0 46 14"><path d={ONDA} stroke="currentColor" strokeWidth="2" /></svg>
          2:14
        </div>
      </div>
      <div className="acu-abierto">
        {capitulos.map((c) => (
          <div key={c} className="acu-hoja">
            <small>{c}</small>
            <i /><i /><i />
          </div>
        ))}
      </div>
    </div>
  );
}
