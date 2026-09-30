// Decisiones de Naza después de que Fable leyó la lectura corrida como la
// viviría el narrador (30/09, docs/v3/entrevista/correcciones-lectura.md,
// "Ronda 2"): menos maquinaria alrededor de las preguntas.

import { describe, expect, it } from 'vitest';
import { BANCO, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { mensajesDespues } from '../src/v3/entrevista/flujo.js';
import { acuseNeutro, acuseVaAparte, armarTurno } from '../src/v3/entrevista/mensajes.js';
import { simularRecorrido } from '../src/v3/entrevista/seleccion.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';

const p = (id: string) => preguntaPorId(id)!;
const recorrido = () => {
  const v = VIDAS_EJEMPLO.find((x) => x.clave === 'sigue-con-la-primera')!;
  return simularRecorrido(v.ficha, (id) => v.respuestas[id], { familia: [{ id: 'FAM1', texto: '¿Una pregunta de la familia?' }] });
};
const ids = () => recorrido().map((x) => x.pregunta.id);

describe('1. el acuse va pegado a lo que sigue; el sobrio (M4) va solo', () => {
  it('M3, M21 y M24 van pegados; M4 va aparte', () => {
    expect(acuseVaAparte('M3')).toBe(false);
    expect(acuseVaAparte('M21')).toBe(false);
    expect(acuseVaAparte('M24')).toBe(false);
    expect(acuseVaAparte('M4')).toBe(true);
  });

  it('acuse pegado: primera línea del mensaje de la pregunta', () => {
    expect(armarTurno({ acuse: 'Gracias.', familia: 'M3', pregunta: '¿Y tu papá?' })).toEqual(['Gracias.\n¿Y tu papá?']);
  });

  it('con M1, la frase del paso queda al final del mismo mensaje', () => {
    expect(armarTurno({ acuse: 'Gracias.', familia: 'M3', pregunta: '¿Tuviste hermanos?', m1: '_Si no va con vos…_' })).toEqual([
      'Gracias.\n¿Tuviste hermanos?\n_Si no va con vos…_',
    ]);
  });

  it('con frase de entrada, el acuse va pegado a la entrada y la pregunta en su propio mensaje', () => {
    expect(armarTurno({ acuse: 'Eso también va al libro.', familia: 'M24', entrada: 'Hablemos de los amigos.', pregunta: '¿Hubo alguien?' })).toEqual([
      'Eso también va al libro.\nHablemos de los amigos.',
      '¿Hubo alguien?',
    ]);
  });

  it('M4 va solo, en su propio mensaje', () => {
    expect(armarTurno({ acuse: 'Gracias por confiármelo.', familia: 'M4', pregunta: '¿Y la salud?' })).toEqual(['Gracias por confiármelo.', '¿Y la salud?']);
  });

  it('sin acuse (arranque, después del aviso): solo lo que sigue', () => {
    expect(armarTurno({ pregunta: 'Empecemos.' })).toEqual(['Empecemos.']);
  });
});

describe('2. sin M10: después de cualquier cierre va M24', () => {
  it('los cierres de las etapas (2 a 5) también llevan M24', () => {
    for (let b = 1; b <= 14; b++) expect(mensajesDespues(p(`CI${b}`), 'Sí, me acordé de algo más que te cuento.'), `CI${b}`).toEqual(['M24']);
  });
});

describe('4. acuse sobrio después del momento difícil de cada época y de la plata ajustada', () => {
  it('CA17, AD15, JU17 y TR11 son sensibles (M4)', () => {
    for (const id of ['CA17', 'AD15', 'JU17', 'TR11']) {
      expect(p(id).sensible, id).toBe(true);
      expect(mensajesDespues(p(id), 'Sí, te cuento lo que pasó.'), id).toEqual(['M4']);
    }
  });
});

describe('5. el final: LE7 → familia → FO1 → LE9 → LE8 → FIN', () => {
  it('el orden del final en una vida completa', () => {
    expect(ids().slice(-6)).toEqual(['LE7', 'FAM1', 'FO1', 'LE9', 'LE8', 'FIN']);
  });

  it('después de LE8 no va acuse; LE9 sí lleva', () => {
    expect(mensajesDespues(p('LE8'), 'Los quiero mucho.')).toEqual([]);
    expect(mensajesDespues(p('LE9'), 'No, creo que está todo.')).toEqual(['M3']);
  });
});

describe('6. CI11 sin la primera frase', () => {
  it('arranca directo con la invitación', () => {
    expect(p('CI11').texto).toBe('Si hay otro momento difícil que sentís que tiene que estar en tu historia y no te lo pregunté, contámelo acá.');
  });
});

describe('8. FI7 al bloque 12 y FU1 al 15, antes de LE7', () => {
  it('FI7 es del bloque 12, antes de su cierre', () => {
    expect(p('FI7').bloque).toBe(12);
    expect(p('FI7').orden).toBeLessThan(p('CI12').orden);
  });

  it('FU1 es del bloque 15, antes de LE7', () => {
    expect(p('FU1').bloque).toBe(15);
    const seq = ids();
    expect(seq.indexOf('FU1')).toBe(seq.indexOf('LE7') - 1);
  });

  it('el bloque 15 queda en este orden', () => {
    expect(BANCO.filter((q) => q.bloque === 15).map((q) => q.id)).toEqual(['LE1', 'LE2', 'LE6', 'FU1', 'LE7', 'FO1', 'LE9', 'LE8', 'FIN']);
  });
});

describe('7. acuse neutro si un cierre se contesta con un "no" corto o "paso" (Naza, 30/09)', () => {
  it('cierre con "no" corto o "paso" → M25; con algo contado → M24', () => {
    expect(mensajesDespues(p('CI9'), 'No, nada más.')).toEqual(['M25']);
    expect(mensajesDespues(p('CI3'), 'Paso')).toEqual(['M25']);
    expect(mensajesDespues(p('CI3'), 'Sí, me acordé del acto del 25 de mayo.')).toEqual(['M24']);
  });

  it('"paso" en una pregunta que no es cierre sigue con M21', () => {
    expect(mensajesDespues(p('CA2'), 'paso')).toEqual(['M21']);
  });

  it('M25 va pegado y rota entre las 3', () => {
    expect(acuseVaAparte('M25')).toBe(false);
    expect([0, 1, 2, 3].map((n) => acuseNeutro(n, 'Hablemos de los amigos.'))).toEqual(['M25.1', 'M25.2', 'M25.3', 'M25.1']);
  });

  it('"Bien, seguimos." no va delante de algo que arranca con "Seguimos" o "Pasamos"', () => {
    expect(acuseNeutro(0, 'Seguimos con la escuela: la primaria…')).toBe('M25.2');
    expect(acuseNeutro(3, 'Pasamos a tu juventud, Rogelio…')).toBe('M25.2');
    expect(acuseNeutro(1, 'Seguimos con la escuela')).toBe('M25.2');
  });
});
