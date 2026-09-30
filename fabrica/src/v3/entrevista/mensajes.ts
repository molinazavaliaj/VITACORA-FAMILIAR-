// Cómo se arman los mensajes de WhatsApp de un turno (docs/v3/entrevista/
// banco.md, regla 4; Naza, 30/09, ronda 2): el acuse de la respuesta
// anterior va como primera línea del mensaje que sigue, salvo el acuse
// sobrio (M4), que va solo. La frase de entrada y la pregunta van en
// mensajes separados; M1 va al final del mensaje de la pregunta, y M31 (la
// ayuda de los botones, una sola vez) debajo de M1. Puro: recibe
// textos ya renderizados.

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
  /** La frase de entrada del bloque (EN2…), ya renderizada, si es la primera pregunta del bloque. */
  entrada?: string;
  /** La pregunta (o el aviso, o el final), ya renderizada. */
  pregunta: string;
  /** M1 renderizado, si la pregunta lo lleva. */
  m1?: string;
  /** M31 renderizado, si es el primer mensaje con botones de la entrevista: va debajo, en línea aparte, después de M1 (Naza, 30/09, simulaciones). */
  ayuda?: string;
};

/** Los mensajes de WhatsApp de un turno, en orden. */
export function armarTurno(t: Turno): string[] {
  const pregunta = [t.pregunta, t.m1, t.ayuda].filter((x) => x !== undefined).join('\n');
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
  return id !== 'M25.3' && arrancaConSeguimos(siguiente) ? 'M25.3' : id;
}

function arrancaConSeguimos(siguiente: string): boolean {
  return /^(seguimos|pasamos)(?![a-záéíóúñ])/i.test(siguiente.trim());
}

/**
 * El acuse de turno cuando se negó en una sensible (M27), sabiendo con qué
 * arranca lo que sigue: M27.1 termina en "seguimos por otro lado", así que
 * delante de algo que arranca con "Seguimos" o "Pasamos" va M27.2 (regla 29;
 * Naza, 30/09, simulaciones).
 */
export function acuseNegado(n: number, siguiente: string): string {
  const id = acuseRotado('M27', n);
  return id === 'M27.1' && arrancaConSeguimos(siguiente) ? 'M27.2' : id;
}

/** Cuántas veces salió cada familia que rota (para saber cuál le toca). */
export type Vueltas = Record<keyof typeof ROTAN, number>;

export function vueltasEnCero(): Vueltas {
  return { M3: 0, M4: 0, M24: 0, M25: 0, M27: 0, M32: 0 };
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
    case 'M24':
      return acuseRotado(familia, n);
    case 'M25':
      return acuseNeutro(n, siguienteTexto);
    case 'M27':
      return acuseNegado(n, siguienteTexto);
    case 'M28':
      return ACUSE_OLVIDO;
    case 'M32': {
      // M32.2 termina en "Seguimos.": delante de "Seguimos…" o "Pasamos…" va M32.1 (como M27.1; revisión de la ronda 2).
      const id = acuseRotado('M32', n);
      return acuseAntesDe(id === 'M32.2' && arrancaConSeguimos(siguienteTexto) ? 'M32.1' : id, 'M32', siguiente);
    }
    case 'M28.4':
      return acuseAntesDe('M28.4', 'M28.4', siguiente);
    default:
      return familia; // M21, M26 y M29: uno solo
  }
}

/** Después de esta pregunta viene el final: el acuse común no anuncia "otra" (Naza, 30/09, ronda 3). */
const ANTES_DE_LE9 = 'LE9';
/** Delante de AM20 el acuse común también es M26 (ronda 2, Naza, 30/09). */
const ANTES_DE_AM20 = 'AM20';

/**
 * El acuse que va de verdad, sabiendo qué se manda después: si es un acuse
 * común (M3) y lo que sigue es un cierre de bloque o LE9, va M26 ("Gracias,
 * {{nombre}}."), porque "Sigo con otra." arriba de "Con esto cerramos…" se
 * contradice (Naza, 30/09, ronda 3). Lo mismo antes de una sensible: "Anotado.
 * Sigo con otra." arriba de "¿Hubo algún momento difícil…?" suena liviano
 * (Naza, 30/09, simulaciones, regla 26). Los demás no cambian.
 */
export function acuseAntesDe(id: string, familia: FamiliaAcuse, siguiente: Pick<PreguntaEntrevista, 'id' | 'clase'> & { sensible?: boolean }): string {
  const cierreOLe9 = siguiente.clase === 'cierre' || siguiente.id === ANTES_DE_LE9;
  // Ronda 2 (Naza, 30/09): M32 y M28.4 también dejan lugar a M26 antes de un cierre o de LE9.
  if (familia === 'M32' || familia === 'M28.4') return cierreOLe9 ? 'M26' : id;
  if (familia !== 'M3') return id;
  // M26 también delante de AM20 ("Ahora sí, las del medio"), después de contar el último amor (ronda 2).
  return cierreOLe9 || siguiente.sensible === true || siguiente.id === ANTES_DE_AM20 ? 'M26' : id;
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
