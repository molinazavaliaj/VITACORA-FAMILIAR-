// Los textos fijos de la tapa del libro de «Vitácora de una historia»: la línea de arriba del nombre en la tapa del
// PDF y, en la cubierta de Bookmundo, la etiqueta (tapa y lomo), la contratapa y el lema. Los de Familiar dicen «El
// libro de su vida» y no sirven para un libro que cuenta una sola historia.
//
// Aprobados por Naza el 24/10 (las versiones recomendadas de docs/historia/libro-textos-borrador.md). Un idioma que
// falte acá no arma ni el PDF ni la cubierta (la fábrica avisa a los socios y espera).
import { deCatalan, type TextosCubierta } from '../../libro/bookmundo/cubierta.js';
import type { LenguaLibro } from '../../libro/plantilla-html.js';

export type TextosTapaHistoria = {
  /** Arriba del nombre en la tapa del PDF, en mayúsculas. */
  eyebrow: string;
  /** Lo que cambia en la cubierta impresa; lo demás (escucha, siempre), el de Familiar. */
  cubierta: Pick<TextosCubierta, 'etiqueta' | 'contra' | 'lema'>;
};

const CASTELLANO: TextosTapaHistoria = {
  eyebrow: 'UNA HISTORIA DE SU VIDA',
  cubierta: {
    etiqueta: 'Una historia de su vida',
    contra: (n) => `Estas páginas guardan una sola historia de la vida de ${n}, contada con sus propias palabras, tal como la vivió. En este QR, sus mejores frases.`,
    lema: 'Para las historias que merecen su propio libro',
  },
};

export const TEXTOS_TAPA_HISTORIA: Partial<Record<LenguaLibro, TextosTapaHistoria>> = {
  // Los textos no tienen trato: son los mismos en Argentina y en España.
  'es-AR': CASTELLANO,
  'es-ES': CASTELLANO,
  ca: {
    eyebrow: 'UNA HISTÒRIA DE LA SEVA VIDA',
    cubierta: {
      etiqueta: 'Una història de la seva vida',
      contra: (n) => `Aquestes pàgines guarden una sola història de la vida ${deCatalan(n)}, explicada amb les seves pròpies paraules, tal com la va viure. En aquest QR, les seves millors frases.`,
      lema: 'Per a les històries que mereixen el seu propi llibre',
    },
  },
};

export const textosTapaHistoria = (lengua: LenguaLibro): TextosTapaHistoria | null => TEXTOS_TAPA_HISTORIA[lengua] ?? null;

/** La lengua del libro según `historias.idioma`. */
export const lenguaDeHistoria = (idioma: string | null | undefined): LenguaLibro => (idioma === 'ca' ? 'ca' : idioma === 'es-ES' ? 'es-ES' : 'es-AR');
