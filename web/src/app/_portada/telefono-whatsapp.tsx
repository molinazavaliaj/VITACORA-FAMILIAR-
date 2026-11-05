import type { IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_INICIO } from "../_textos/portada-inicio";

// El celular del inicio: cómo se ve la entrevista por WhatsApp. Ilustración
// propia, dibujada con CSS, y la pregunta es de ejemplo. Por eso va aria-hidden.
const ONDA = "M1 6v2M5 3v8M9 5v4M13 1v12M17 4v6M21 2v10M25 5v4M29 3v8M33 6v2M37 4v6M41 2v10M45 5v4M49 6v2";

export function TelefonoWhatsApp({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA_INICIO[idioma].telefono;
  return (
    <div aria-hidden className="acu-tel">
      <div className="acu-tel-pantalla">
        <div className="acu-tel-cabeza">
          <span className="acu-tel-avatar">V</span>
          <span>
            <b>{t.nombre}</b>
            <small>{t.estado}</small>
          </span>
        </div>
        <div className="acu-tel-charla">
          <p className="acu-tel-globo">{t.pregunta}</p>
          <p className="acu-tel-globo acu-tel-globo--mio">
            <span aria-hidden>▶</span>
            <svg viewBox="0 0 50 14"><path d={ONDA} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </p>
          <p className="acu-tel-globo">{t.acuse}</p>
        </div>
      </div>
    </div>
  );
}
