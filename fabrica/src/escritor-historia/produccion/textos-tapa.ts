// Los textos fijos de la tapa del libro de «Vitácora de una historia»: la línea de arriba del nombre en la tapa del
// PDF y, en la cubierta de Bookmundo, la etiqueta (tapa y lomo), la contratapa y el lema. Los de Familiar dicen «El
// libro de su vida» y no sirven para un libro que cuenta una sola historia.
//
// Los borradores están en docs/historia/libro-textos-borrador.md. Un idioma entra acá SOLO cuando Naza aprueba sus
// textos: mientras falte, la fábrica no arma ni el PDF ni la cubierta de ese idioma (avisa a los socios y espera).
import type { TextosCubierta } from '../../libro/bookmundo/cubierta.js';
import type { LenguaLibro } from '../../libro/plantilla-html.js';

export type TextosTapaHistoria = {
  /** Arriba del nombre en la tapa del PDF, en mayúsculas. */
  eyebrow: string;
  /** Lo que cambia en la cubierta impresa; lo demás (escucha, siempre), el de Familiar. */
  cubierta: Pick<TextosCubierta, 'etiqueta' | 'contra' | 'lema'>;
};

export const TEXTOS_TAPA_HISTORIA: Partial<Record<LenguaLibro, TextosTapaHistoria>> = {};

export const textosTapaHistoria = (lengua: LenguaLibro): TextosTapaHistoria | null => TEXTOS_TAPA_HISTORIA[lengua] ?? null;

/** La lengua del libro según `historias.idioma`. */
export const lenguaDeHistoria = (idioma: string | null | undefined): LenguaLibro => (idioma === 'ca' ? 'ca' : idioma === 'es-ES' ? 'es-ES' : 'es-AR');
