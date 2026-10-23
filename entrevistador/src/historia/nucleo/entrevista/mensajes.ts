// Cómo se arman los mensajes de WhatsApp de un turno de historia. Copia de
// src/v3/entrevista/mensajes.ts (docs/historia/banco.md, regla 8, que sigue a
// V3): el acuse de la respuesta anterior va como primera línea del mensaje
// que sigue, salvo el acuse sobrio (M4), que va solo. M1 va al final del
// mensaje de la pregunta y M31 (la ayuda del botón de FOTO-H) debajo. Sin lo
// de V3: las frases de entrada de bloque (EN2…EN15), el acuse del cierre
// (M24) y los casos de LE9 y AM21. Puro: recibe textos ya renderizados.

import type { PreguntaEntrevista } from './banco.js';
import { acuseRotado, ROTAN, type FamiliaAcuse } from './flujo.js';

/** Las familias de acuse que devuelve `mensajesDespues`. */
export type { FamiliaAcuse } from './flujo.js';

/** ¿El acuse va solo, en su propio mensaje? Solo el sobrio (M4): después de algo difícil no se pega la pregunta siguiente. M27, M28 y M29 van pegados, como M25 (Naza, 30/09, simulaciones). */
export function acuseVaAparte(familia: FamiliaAcuse): boolean {
  return familia === 'M4';
}

export type Turno = {
  /** El acuse de la respuesta anterior, ya renderizado (si hay). */
  acuse?: string;
  /** De qué familia es el acuse (decide si va pegado o solo). */
  familia?: FamiliaAcuse;
  /** La pregunta (o FOTO-H, una de quien regala, FIN-H), ya renderizada. */
  pregunta: string;
  /** M1 renderizado, si la pregunta lo lleva. */
  m1?: string;
  /** M31 renderizado, debajo de FOTO-H (el primer mensaje del banco con botones), en línea aparte. */
  ayuda?: string;
};

/** Los mensajes de WhatsApp de un turno, en orden. */
export function armarTurno(t: Turno): string[] {
  const pregunta = [t.pregunta, t.m1, t.ayuda].filter((x) => x !== undefined).join('\n');
  if (!t.acuse) return [pregunta];
  if (t.familia && acuseVaAparte(t.familia)) return [t.acuse, pregunta];
  return [`${t.acuse}\n${pregunta}`];
}

/**
 * El acuse neutro (M25) de turno, sabiendo con qué arranca lo que sigue:
 * "Bien, seguimos." (M25.1 y, desde la ronda 3, también M25.2) no va delante
 * de un mensaje que arranca con "Seguimos" o "Pasamos"; en ese caso va M25.3
 * ("Bien, entonces."). Regla de Fable, aprobada por Naza el 30/09.
 */
export function acuseNeutro(n: number, siguiente: string): string {
  const id = acuseRotado('M25', n);
  return id !== 'M25.3' && arrancaConSeguimos(siguiente) ? 'M25.3' : id;
}

function arrancaConSeguimos(siguiente: string): boolean {
  // En catalán "Seguim", "Passem", "Continuem" (M25.1 es "Bé, seguim."; Naza, 04/10). En España también "Continuamos" (05/10).
  return /^(seguimos|pasamos|continuamos|seguim|passem|continuem)(?![a-záéíóúñàèòïüç])/i.test(siguiente.trim());
}

/**
 * El acuse de turno cuando se negó en una sensible (M27): rotan sin excepción.
 * Hasta el 30/09 M27.1 terminaba en "seguimos por otro lado" y delante de
 * "Seguimos…" o "Pasamos…" iba M27.2; desde que M27.1 es "Lo dejamos ahí."
 * (propuesta de Fable después de la prueba de Naza) ya no hace falta.
 * `_siguiente` queda en la firma por simetría con acuseNeutro.
 */
export function acuseNegado(n: number, _siguiente: string): string {
  return acuseRotado('M27', n);
}

/** Cuántas veces salió cada familia que rota (para saber cuál le toca). */
export type Vueltas = Record<keyof typeof ROTAN, number>;

export function vueltasEnCero(): Vueltas {
  return { M3: 0, M4: 0, M25: 0, M27: 0, M32: 0, 'M28.4': 0 };
}

/** El acuse de una respuesta, a la espera de saber qué se manda después (ahí se elige el ID con `acuseDeTurno`). */
export type AcusePendiente = { familia: FamiliaAcuse; n: number };

/** Anota el acuse de una respuesta y, si su familia rota, avanza la vuelta. */
export function anotarAcuse(familia: FamiliaAcuse, vueltas: Vueltas): AcusePendiente {
  if (familia in ROTAN) {
    const f = familia as keyof typeof ROTAN;
    vueltas[f] = (vueltas[f] ?? 0) + 1;
    return { familia, n: vueltas[f] - 1 };
  }
  return { familia, n: 0 };
}

/** El único acuse de olvido en uso: M28.2 y M28.3 quedan en reserva (Naza, 30/09). */
export const ACUSE_OLVIDO = 'M28.1';

/**
 * El ID del acuse que va de verdad, con el número de vuelta de su familia
 * (las que rotan) y lo que se manda después: el texto (para M25 y M27, que
 * miran con qué arranca) y la pregunta (para M26 en lugar de M3). Lo usan el
 * entrevistador y los scripts de simulación y de lectura.
 */
export function acuseDeTurno(familia: FamiliaAcuse, n: number, siguienteTexto: string, siguiente: Pick<PreguntaEntrevista, 'id' | 'clase'> & { sensible?: boolean }): string {
  switch (familia) {
    case 'M3':
      return acuseAntesDe(acuseRotado('M3', n), 'M3', siguiente);
    case 'M4':
      return acuseRotado(familia, n);
    case 'M25':
      return acuseNeutro(n, siguienteTexto);
    case 'M27':
      return acuseNegado(n, siguienteTexto);
    case 'M28':
      return ACUSE_OLVIDO;
    case 'M32': {
      // M32.2 termina en "Seguimos.": delante de "Seguimos…" o "Pasamos…" va M32.1 (como M25.3; revisión de la ronda 2).
      const id = acuseRotado('M32', n);
      return acuseAntesDe(id === 'M32.2' && arrancaConSeguimos(siguienteTexto) ? 'M32.1' : id, 'M32', siguiente);
    }
    case 'M28.4':
      // Rota con M28.5: nunca dos "Con ese pedacito" seguidos (prueba de Naza en la página, 30/09).
      return acuseAntesDe(acuseRotado('M28.4', n), 'M28.4', siguiente);
    default:
      return familia; // M21, M26 y M29: uno solo
  }
}

/**
 * El acuse que va de verdad, sabiendo qué se manda después: si es un acuse
 * común (M3) y lo que sigue es el cierre (HC10) o una sensible, va M26
 * ("Gracias, {{nombre}}."), como en V3 (banco.md, regla 8). M32 y M28.4
 * también dejan lugar a M26 delante del cierre. Los demás no cambian.
 */
export function acuseAntesDe(id: string, familia: FamiliaAcuse, siguiente: Pick<PreguntaEntrevista, 'id' | 'clase'> & { sensible?: boolean }): string {
  const cierre = siguiente.clase === 'cierre';
  if (familia === 'M32' || familia === 'M28.4') return cierre ? 'M26' : id;
  if (familia !== 'M3') return id;
  return cierre || siguiente.sensible === true ? 'M26' : id;
}

/** Los mensajes que van sin el nombre si el acuse pegado ya lo dice: FOTO-H ("Otra cosa, {{nombre}}."), como FO1 en V3. */
export const SIN_NOMBRE_SI_EL_ACUSE_LO_DICE: readonly string[] = ['FOTO-H'];

/**
 * El texto (sin renderizar) según el acuse que va pegado en el mismo
 * mensaje: en FOTO-H, si el acuse ya dice el nombre, va sin el nombre ("Con
 * ese pedacito me alcanza, Ana. Gracias. / Otra cosa, Ana." repetía el nombre
 * en cuatro palabras; prueba de Naza con FO1, 30/09). Los demás no cambian.
 */
export function preguntaSegunAcuse(id: string, texto: string, acuse?: string): string {
  if (!SIN_NOMBRE_SI_EL_ACUSE_LO_DICE.includes(id) || !acuse?.includes('{{nombre}}')) return texto;
  return texto.replace(/, \{\{nombre\}\}/, '');
}
