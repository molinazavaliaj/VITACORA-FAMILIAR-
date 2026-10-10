// Los acuses después de las simulaciones (docs/v3/entrevista/simulaciones/
// textos-finales.md, reglas 26 a 31; Naza, 30/09): M26 antes de una sensible
// y después de PG1, M25 después de cualquier "no", M27 cuando se niega en una
// sensible, M28.1 después de un olvido y M29 una sola vez al tercer olvido
// seguido.

import { describe, expect, it } from 'vitest';
import { preguntaPorId } from '../src/v3/entrevista/banco.js';
import { acuseRotado, mensajesDespues } from '../src/v3/entrevista/flujo.js';
import { acuseAntesDe, acuseDeTurno, acuseNegado, acuseVaAparte } from '../src/v3/entrevista/mensajes.js';
import { respuestaDeBoton, sumarAudio } from '../src/v3/entrevista/respuesta.js';

const p = (id: string) => preguntaPorId(id)!;
const CUENTA = 'Sí, te cuento: fue una historia larga que me acuerdo muy bien.';
const OLVIDO = 'No me acuerdo.';

describe('regla 26: antes de una sensible, el acuse común pegado es M26', () => {
  it.each(['CA17', 'AD15', 'JU17', 'TR11', 'AM9', 'PE1', 'PE5', 'PE4'])('antes de %s', (id) => {
    expect(acuseAntesDe('M3.2', 'M3', p(id))).toBe('M26');
  });

  it('antes de una común sigue el M3 de turno', () => {
    expect(acuseAntesDe('M3.2', 'M3', p('CA16'))).toBe('M3.2');
  });
});

describe('regla 27: después de PG1, siempre M26', () => {
  it.each([CUENTA, 'Paso', 'No, no los tuve cerca.', OLVIDO])('PG1 = "%s"', (r) => {
    expect(mensajesDespues(p('PG1'), r)).toEqual(['M26']);
  });
});

describe('regla 28: qué acuse lleva cada cosa', () => {
  it('un "no" corto lleva M25 en todas las preguntas, no solo en cierres y sensibles', () => {
    expect(mensajesDespues(p('CA2'), 'No, nunca la conocí.')).toEqual(['M25']);
    expect(mensajesDespues(p('HI0'), respuestaDeBoton('No tuve hijos'))).toEqual(['M25']);
    expect(mensajesDespues(p('AM9'), respuestaDeBoton('Seguimos juntos'))).toEqual(['M25']);
    expect(mensajesDespues(p('CI3'), respuestaDeBoton('No, está todo'))).toEqual(['M25']);
    expect(mensajesDespues(p('FO1'), respuestaDeBoton('No tengo foto'))).toEqual(['M25']);
  });

  it('"paso": M21 en una común, M27 en una sensible, M25 en un cierre', () => {
    expect(mensajesDespues(p('CA2'), 'Paso')).toEqual(['M21']);
    expect(mensajesDespues(p('CA17'), 'Paso')).toEqual(['M27']);
    expect(mensajesDespues(p('JU17'), 'De eso no. Hay cosas que prefiero guardarme.')).toEqual(['M27']);
    expect(mensajesDespues(p('PE1'), respuestaDeBoton('Paso esta'))).toEqual(['M27']);
    expect(mensajesDespues(p('AM9'), respuestaDeBoton('Paso esta'))).toEqual(['M27']);
    expect(mensajesDespues(p('CI5'), 'Paso')).toEqual(['M25']);
  });

  it('olvido: M28 (en lugar de M3 o M4)', () => {
    expect(mensajesDespues(p('ES2'), OLVIDO)).toEqual(['M28']);
    expect(mensajesDespues(p('CA17'), 'No sé, no me acuerdo.')).toEqual(['M28']);
  });

  it('"ya te lo conté" corto: M25', () => {
    expect(mensajesDespues(p('AM4'), 'Ya te lo conté.')).toEqual(['M25']);
  });

  it('contó algo: M3, M4 en una sensible, M24 en un cierre (como antes)', () => {
    expect(mensajesDespues(p('CA2'), CUENTA)).toEqual(['M3']);
    expect(mensajesDespues(p('CA17'), CUENTA)).toEqual(['M4']);
    expect(mensajesDespues(p('CI2'), CUENTA)).toEqual(['M24']);
  });
});

describe('regla 17: M29 una sola vez, al tercer olvido seguido', () => {
  const ORDEN = ['ES1', 'ES2', 'ES5', 'ES6', 'ES7', 'ES9', 'CI3', 'AD2'];
  /** Los acuses de una tanda de respuestas, pasando las anteriores en orden (como el entrevistador). */
  function acuses(respuestas: string[]) {
    const anteriores = new Map<string, string>();
    return respuestas.map((r, i) => {
      const id = ORDEN[i];
      const a = mensajesDespues(p(id), r, anteriores);
      anteriores.set(id, r);
      return a[0];
    });
  }

  it('al tercero va M29; al cuarto, M28 de nuevo; nunca más M29', () => {
    expect(acuses([OLVIDO, OLVIDO, OLVIDO, OLVIDO, CUENTA, OLVIDO, OLVIDO, OLVIDO])).toEqual(['M28', 'M28', 'M29', 'M28', 'M3', 'M28', 'M28', 'M28']);
  });

  it('si en el medio contó algo, se empieza a contar de nuevo', () => {
    expect(acuses([OLVIDO, OLVIDO, CUENTA, OLVIDO, OLVIDO, OLVIDO])).toEqual(['M28', 'M28', 'M3', 'M28', 'M28', 'M29']);
  });

  it('sin las anteriores no hay forma de saberlo: M28', () => {
    expect(mensajesDespues(p('ES5'), OLVIDO)).toEqual(['M28']);
  });

  it('si la misma pregunta ya figura entre las anteriores, no se cuenta dos veces', () => {
    const anteriores = new Map([['ES1', OLVIDO], ['ES2', OLVIDO]]);
    expect(mensajesDespues(p('ES2'), OLVIDO, anteriores)).toEqual(['M28']);
    expect(mensajesDespues(p('ES5'), OLVIDO, anteriores)).toEqual(['M29']);
  });
});

describe('regla 30: después de tocar "Sí" no va acuse; el audio de después lleva el de esa pregunta', () => {
  it('HI0 "Sí, tuve" + audio: M3; AM9 "Sí, hubo un final" + audio: M4', () => {
    expect(mensajesDespues(p('HI0'), sumarAudio(respuestaDeBoton('Sí, tuve'), 'Dos hijas, Ana y Laura.'))).toEqual(['M3']);
    expect(mensajesDespues(p('AM9'), sumarAudio(respuestaDeBoton('Sí, hubo un final'), 'Nos separamos en el noventa.'))).toEqual(['M4']);
  });

  it('si tocó "Sí" y no mandó audio, también el de esa pregunta (sigue como "sí")', () => {
    expect(mensajesDespues(p('HI0'), respuestaDeBoton('Sí, tuve'))).toEqual(['M3']);
  });
});

describe('regla 29: M27 y M28 van pegados, como M25', () => {
  it('pegados; el sobrio (M4) sigue solo', () => {
    for (const f of ['M25', 'M26', 'M27', 'M28', 'M29'] as const) expect(acuseVaAparte(f), f).toBe(false);
    expect(acuseVaAparte('M4')).toBe(true);
  });

  it('M27 rota entre los 3', () => {
    expect([0, 1, 2, 3].map((n) => acuseRotado('M27', n))).toEqual(['M27.1', 'M27.2', 'M27.3', 'M27.1']);
    expect([0, 1, 2, 3].map((n) => acuseNegado(n, 'Si alguna vez tu salud te frenó…'))).toEqual(['M27.1', 'M27.2', 'M27.3', 'M27.1']);
  });

  // Hasta el 30/09 delante de "Seguimos…" o "Pasamos…" iba M27.2 en lugar de M27.1 ("…y seguimos por otro lado");
  // desde que M27.1 es "Lo dejamos ahí." rotan sin excepción: v3-entrevista-fable-extras.test.ts.
  it('delante de "Seguimos…" o "Pasamos…" rotan igual', () => {
    expect(acuseNegado(0, 'Seguimos con la escuela: la primaria…')).toBe('M27.1');
    expect(acuseNegado(2, 'Pasamos a tu juventud')).toBe('M27.3');
  });
});

describe('acuseDeTurno: el ID del acuse, sabiendo qué se manda después', () => {
  const sigue = (id: string) => p(id);
  it('cada familia', () => {
    expect(acuseDeTurno('M3', 1, 'Contame…', sigue('CA16'))).toBe('M3.2');
    expect(acuseDeTurno('M3', 1, 'Con esto cerramos…', sigue('CI2'))).toBe('M26');
    expect(acuseDeTurno('M3', 1, '¿Hubo algún momento difícil…', sigue('CA17'))).toBe('M26');
    expect(acuseDeTurno('M4', 5, '…', sigue('CA16'))).toBe('M4.2');
    expect(acuseDeTurno('M24', 0, 'Seguimos con la escuela…', sigue('ES1'))).toBe('M24.1');
    expect(acuseDeTurno('M25', 0, 'Seguimos con la escuela…', sigue('ES1'))).toBe('M25.3');
    expect(acuseDeTurno('M27', 0, 'Seguimos con la escuela…', sigue('ES1'))).toBe('M27.1');
    expect(acuseDeTurno('M28', 7, '…', sigue('CA16'))).toBe('M28.1'); // M28.2 y M28.3 en reserva
    expect(acuseDeTurno('M21', 3, '…', sigue('CA16'))).toBe('M21');
    expect(acuseDeTurno('M26', 3, '…', sigue('CA16'))).toBe('M26');
    expect(acuseDeTurno('M29', 3, '…', sigue('CA16'))).toBe('M29');
  });
});
