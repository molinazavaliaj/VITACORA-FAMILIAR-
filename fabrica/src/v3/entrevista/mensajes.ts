// Cómo se arman los mensajes de WhatsApp de un turno (docs/v3/entrevista/
// banco.md, regla 4; Naza, 30/09, ronda 2): el acuse de la respuesta
// anterior va como primera línea del mensaje que sigue, salvo el acuse
// sobrio (M4), que va solo. La frase de entrada y la pregunta van en
// mensajes separados; M1 va al final del mensaje de la pregunta. Puro: recibe
// textos ya renderizados.

import type { PreguntaEntrevista } from './banco.js';
import { acuseRotado } from './flujo.js';

/** Las familias de acuse que devuelve `mensajesDespues`. */
export type FamiliaAcuse = 'M3' | 'M4' | 'M21' | 'M24' | 'M25';

/** ¿El acuse va solo, en su propio mensaje? Solo el sobrio (M4): después de algo difícil no se pega la pregunta siguiente. */
export function acuseVaAparte(familia: FamiliaAcuse): boolean {
  return familia === 'M4';
}

export type Turno = {
  /** El acuse de la respuesta anterior, ya renderizado (si hay). */
  acuse?: string;
  /** De qué familia es el acuse (decide si va pegado o solo). */
  familia?: FamiliaAcuse;
  /** La frase de entrada del bloque (EN2…), ya renderizada, si es la primera pregunta del bloque. */
  entrada?: string;
  /** La pregunta (o el aviso, o el final), ya renderizada. */
  pregunta: string;
  /** M1 renderizado, si la pregunta lo lleva. */
  m1?: string;
};

/** Los mensajes de WhatsApp de un turno, en orden. */
export function armarTurno(t: Turno): string[] {
  const pregunta = t.m1 ? `${t.pregunta}\n${t.m1}` : t.pregunta;
  const siguientes = t.entrada ? [t.entrada, pregunta] : [pregunta];
  if (!t.acuse) return siguientes;
  if (t.familia && acuseVaAparte(t.familia)) return [t.acuse, ...siguientes];
  return [`${t.acuse}\n${siguientes[0]}`, ...siguientes.slice(1)];
}

/**
 * El acuse neutro (M25) de turno, sabiendo con qué arranca lo que sigue:
 * "Bien, seguimos." (M25.1 y, desde la ronda 3, también M25.2) no va delante
 * de un mensaje que arranca con "Seguimos" o "Pasamos"; en ese caso va M25.3
 * ("Bien, entonces."). Regla de Fable, aprobada por Naza el 30/09.
 */
export function acuseNeutro(n: number, siguiente: string): string {
  const id = acuseRotado('M25', n);
  return id !== 'M25.3' && /^(seguimos|pasamos)(?![a-záéíóúñ])/i.test(siguiente.trim()) ? 'M25.3' : id;
}

/** Después de esta pregunta viene el final: el acuse común no anuncia "otra" (Naza, 30/09, ronda 3). */
const ANTES_DE_LE9 = 'LE9';

/**
 * El acuse que va de verdad, sabiendo qué se manda después: si es un acuse
 * común (M3) y lo que sigue es un cierre de bloque o LE9, va M26 ("Gracias,
 * {{nombre}}."), porque "Sigo con otra." arriba de "Con esto cerramos…" se
 * contradice (Naza, 30/09, ronda 3). Los demás no cambian.
 */
export function acuseAntesDe(id: string, familia: FamiliaAcuse, siguiente: Pick<PreguntaEntrevista, 'id' | 'clase'>): string {
  if (familia !== 'M3') return id;
  return siguiente.clase === 'cierre' || siguiente.id === ANTES_DE_LE9 ? 'M26' : id;
}

/**
 * La frase de entrada (sin renderizar) según el acuse que va pegado en el
 * mismo mensaje: si el acuse ya dice el nombre, la entrada va sin el nombre,
 * para no repetirlo (Naza, 30/09, ronda 3). "Hablemos de los amigos,
 * {{nombre}}, y de…" → "Hablemos de los amigos y de…".
 */
export function entradaSegunAcuse(entrada: string, acuse?: string): string {
  if (!acuse?.includes('{{nombre}}')) return entrada;
  return entrada.replace(/, \{\{nombre\}\},(?= y )/, '').replace(/, \{\{nombre\}\}/, '');
}
