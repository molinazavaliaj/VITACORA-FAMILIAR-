import type { Trato } from './trato.js';

/**
 * Los tratos que el control sabe mirar. `Trato` (usted/vos) es el de producción; `tu` existe
 * solo acá, para un narrador de España al que el perfil v2 le detectó tú (biógrafo v2, 23/09):
 * la puerta manual y el flujo siguen sin conocerlo.
 */
export type TratoControlable = Trato | 'tu';

// Controles puros sobre el texto que se le manda al narrador. Salieron de personalizar.ts
// (23/09) para poder usarlos sin conectarse a la base: los usa también la pregunta v2.

/** Cuenta los signos de pregunta: es lo que delata que se perdió una parte. */
export function contarPreguntas(texto: string): number {
  return (texto.match(/\?/g) ?? []).length;
}

export function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * ¿La versión personalizada sirve?
 *
 * El caso que la motivó: una pregunta de tres partes ("el noviazgo", "el día que
 * la presentó en su casa", "la propuesta y la boda") volvió con dos — se perdió
 * un hilo entero de la entrevista. Medido sobre las 26 preguntas reales, el
 * conteo de signos de pregunta detecta exactamente esos casos (4 de 26) y deja
 * pasar los otros 22.
 *
 * Cuando no sirve, se manda el original: el guion firmado siempre gana.
 */
/*
 * ¿La pregunta rompe el trato del narrador? (C11, bitácora de Ciro, 23/09)
 *
 * El modelo escribe el enganche en vos —"Mirá, vos dijiste…"— y después COPIA
 * LA COLA DEL GUION TAL CUAL, que está escrita en usted: "¿cómo conoció al amor
 * de su vida? Lléveme a ese día…". La mitad de la pregunta le habla de una
 * manera y la otra mitad de otra. Para el narrador es como si de golpe le
 * escribiera otra persona.
 *
 * Se detecta por los IMPERATIVOS, que son las formas que no se pueden confundir:
 * "Lléveme" solo existe en usted, "llevame" solo en vos, "llévame" solo en tú.
 * Los verbos en pasado (conoció, pensó) son iguales en usted y en tercera
 * persona, así que no se miran — pero no hace falta: el guion está lleno de
 * imperativos ("Cuénteme", "Hábleme", "Lléveme"), y cuando el modelo copia la
 * cola se los lleva puestos. Es justamente la copia lo que queremos cazar.
 *
 * Se comparan sin acentos a propósito: el modelo escribe "Lleveme" tan seguido
 * como "Lléveme", y la primera vez que medí esto se me escapó por eso.
 */

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Imperativos y pronombres que solo existen en cada trato. */
const MARCAS: Record<'usted' | 'vos' | 'tu', RegExp> = {
  usted: /\b(usted|ustedes|cuenteme|cuentenos|cuenteles|hableme|hablenos|digame|diganos|lleveme|llevenos|muestreme|muestrenos|mandeme|mandenos|dejeme|permitame|traigame|pongame|regaleme|regalenos|acuerdese|imaginese|fijese|sientese|pienselo|digalo)\b/,
  vos: /\b(vos|contame|contanos|decime|decinos|llevame|llevanos|hablame|hablanos|mostrame|mostranos|mandame|mandanos|dejame|acordate|fijate|imaginate|sentate|mira|dale|tenes|queres|sabes|podes)\b/,
  // Ojo: "llévame" (tú) y "llevame" (vos) son la misma palabra sin acentos, así
  // que estas se miran CON acento. Por eso van aparte de las otras dos.
  tu: /\b(cuéntame|dime|llévame|háblame|muéstrame|mándame|acuérdate|imagínate|tráeme|déjame)\b/,
};

/**
 * Las marcas del trato equivocado que trae este texto. Vacío = está bien.
 * `vos` y `tu` comparten varias formas ("llevame" sin acento es de las dos), y
 * eso no molesta: las dos están mal para un narrador de usted, y para uno de
 * vos lo único que importa es que no aparezcan las de usted.
 */
export function marcasDelTratoAjeno(texto: string, trato: TratoControlable): string[] {
  const limpio = sinAcentos(texto);
  const sinAcentar: RegExp[] = trato === 'usted' ? [MARCAS.vos] : [MARCAS.usted];
  // Para un narrador de tú (España) solo se caza el usted: el tú y el vos comparten formas
  // ("sabes", "mira", "llevame" sin acento) y cazar el vos daría falsos positivos.
  const conAcento = trato === 'tu' ? null : MARCAS.tu; // el tú está mal en vos y en usted
  return [
    ...sinAcentar.flatMap((re) => limpio.match(new RegExp(re, 'g')) ?? []),
    ...(conAcento ? texto.toLowerCase().match(new RegExp(conAcento, 'g')) ?? [] : []),
  ];
}

/** ¿Esta pregunta le habla al narrador de una manera que no es la suya? */
export function rompeElTrato(texto: string, trato: TratoControlable): boolean {
  return marcasDelTratoAjeno(texto, trato).length > 0;
}

