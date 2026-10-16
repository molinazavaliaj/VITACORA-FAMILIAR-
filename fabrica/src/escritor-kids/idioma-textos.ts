// Los textos fijos del libro de Kids que no salen del banco (los mails al padre, «Su voz» y los números del PDF, la
// tapa y el álbum) van por idioma, y solo los que Naza aprobó. Si un chico es de un idioma sin esos textos (hoy ninguno:
// los tres tienen los suyos desde la tanda 10), NUNCA sale en castellano: tira SinTextosKids con lo que falta, y la fábrica no arranca su libro
// (libro-kids.ts avisa a los socios una vez). Para prender un idioma: aprobar sus textos y sumarlos a cada tabla.
import type { IdiomaKids } from '../kids-v2/idioma.js';

export class SinTextosKids extends Error {
  constructor(que: string, idioma: IdiomaKids) {
    super(`Kids: no hay textos aprobados de ${que} en ${idioma}. No sale en otro idioma: faltan los textos de Naza (docs/kids/v2/README.md, «Idiomas»).`);
    this.name = 'SinTextosKids';
  }
}

/** El texto de ese idioma, o SinTextosKids. */
export function deIdioma<T>(tabla: Readonly<Partial<Record<IdiomaKids, T>>>, idioma: IdiomaKids, que: string): T {
  const t = tabla[idioma];
  if (t === undefined) throw new SinTextosKids(que, idioma);
  return t;
}
