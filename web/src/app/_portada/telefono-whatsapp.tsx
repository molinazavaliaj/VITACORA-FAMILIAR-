import type { IdiomaWeb } from "@/lib/idioma-web";
import { TEXTOS_PORTADA_INICIO } from "../_textos/portada-inicio";

// El celular de «Sus audios de WhatsApp»: cómo se ve la entrevista. Dibujado con
// CSS, con la pregunta de ejemplo. Los globos aparecen de a uno; con «menos
// movimiento» quedan todos a la vista. Es ilustración: la sección va aria-hidden.
const ONDA = "M1 6v2M5 3v8M9 5v4M13 1v12M17 4v6M21 2v10M25 5v4M29 3v8M33 6v2M37 4v6M41 2v10M45 5v4M49 6v2";

export function TelefonoWhatsApp({ idioma }: { idioma: IdiomaWeb }) {
  const t = TEXTOS_PORTADA_INICIO[idioma].telefono;
  return (
    <div className="acu-tel">
      <div className="acu-tel-pantalla">
        <div className="acu-tel-estado">
          <span>9:41</span>
          <span>5G</span>
        </div>
        <div className="acu-tel-cabeza">
          <span className="acu-tel-volver">‹</span>
          <span className="acu-tel-avatar">V</span>
          <span>
            <b>{t.nombre}</b>
            <small>{t.estado}</small>
          </span>
        </div>
        <div className="acu-tel-charla">
          <p className="acu-tel-globo">{t.pregunta}</p>
          <p className="acu-tel-globo acu-tel-globo--mio acu-tel-globo--2">
            <span>▶</span>
            <svg viewBox="0 0 50 14"><path d={ONDA} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <small>2:14</small>
          </p>
          <p className="acu-tel-globo acu-tel-globo--3">{t.acuse}</p>
        </div>
        <div className="acu-tel-escribir">
          <span className="acu-tel-campo" />
          <span className="acu-tel-micro">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <rect x="5.5" y="1.5" width="5" height="9" rx="2.5" fill="currentColor" stroke="none" />
              <path d="M3 7.5a5 5 0 0 0 10 0M8 12.5v2" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
