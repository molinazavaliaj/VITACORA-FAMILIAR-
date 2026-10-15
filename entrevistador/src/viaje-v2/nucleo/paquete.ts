// El paquete de idioma: todo lo que cambia con el idioma, en un solo lugar.
// El código pide "el paquete de esta compra" y de ahí saca los textos, los
// dos valores de {{formato}}, la plantilla de Meta y las palabras que
// entiende. Nada de `if (catalan)` desparramado.

import { bancoDe, TEXTOS_IDIOMA, type FilaBanco } from './banco.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';
import { PALABRAS, type Palabras } from './palabras.js';
import type { Formato } from './tipos.js';

export type Paquete = {
  idioma: Idioma;
  banco: readonly FilaBanco[];
  /** {{formato}}: "un libro impreso" / "un libro en PDF" en cada idioma. */
  formato: Readonly<Record<Formato, string>>;
  /** La plantilla de Meta `mensaje_viaje_v2` ({{1}} el nombre, {{2}} el mensaje), con saltos reales. */
  plantillaMensaje: string;
  palabras: Palabras;
};

/**
 * es-AR: los valores de banco.md ("Notación") y la plantilla aprobada en
 * docs/viajes-v2/plantillas-meta.md (un test compara esta copia con el md).
 */
const ES_AR = {
  formato: { impreso: 'un libro impreso', pdf: 'un libro en PDF' },
  plantillaMensaje: 'Hola, {{1}}. Te escribo por tu Vitácora de Viaje.\n\n{{2}}\n\nCuando puedas, me contestás con un audio. Sin apuro.',
};

export function paqueteDe(idioma: Idioma = IDIOMA_POR_DEFECTO): Paquete {
  const t = idioma === 'es-AR' ? ES_AR : TEXTOS_IDIOMA[idioma];
  return { idioma, banco: bancoDe(idioma), formato: t.formato, plantillaMensaje: t.plantillaMensaje, palabras: PALABRAS[idioma] };
}
