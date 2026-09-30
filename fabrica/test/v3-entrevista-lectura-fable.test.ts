// Decisiones de Naza después de que Fable leyó la lectura corrida como la
// viviría el narrador (30/09, docs/v3/entrevista/correcciones-lectura.md,
// "Ronda 2"): menos maquinaria alrededor de las preguntas.

import { describe, expect, it } from 'vitest';
import { BANCO, mensajePorId, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { mensajesDespues } from '../src/v3/entrevista/flujo.js';
import { acuseAntesDe, acuseNeutro, acuseVaAparte, armarTurno, entradaSegunAcuse } from '../src/v3/entrevista/mensajes.js';
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

  it('después de LE8 no va acuse; desde la ronda 4, después de LE9 tampoco (LE8 arranca sola)', () => {
    expect(mensajesDespues(p('LE8'), 'Los quiero mucho.')).toEqual([]);
    expect(mensajesDespues(p('LE9'), 'No, creo que está todo.')).toEqual([]);
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
    // Desde la ronda 3, M25.1 y M25.2 dicen lo mismo; delante de "Seguimos"/"Pasamos" va M25.3.
    expect(acuseNeutro(0, 'Seguimos con la escuela: la primaria…')).toBe('M25.3');
    expect(acuseNeutro(3, 'Pasamos a tu juventud, Rogelio…')).toBe('M25.3');
  });
});

describe('3. bienvenida en un solo mensaje (opción B de Fable, con el cambio de Naza, 30/09)', () => {
  it('BIEN trae los tres párrafos, se presenta como quien entrevista y no nombra a quien regala', () => {
    const bien = mensajePorId('BIEN')!.texto;
    expect(bien.split('\n\n')).toHaveLength(3);
    expect(bien).toContain('Una persona que te quiere mucho');
    expect(bien).toContain('yo soy quien te va a entrevistar');
    expect(bien).toContain('la pregunta que sigue te llega sola');
    expect(bien).toContain('como si me lo estuvieras contando en persona');
    // Naza, 30/09: sin "eh", sin "mejor amigo", sin "nada", sin "dejalo ahí nomás".
    expect(bien).not.toMatch(/quien_regala|mates|bien tuya|mejor amigo|(?<![a-z])nada(?![a-z])|nomás|, eh(?![a-z])/);
  });

  it('M6 queda en el banco sin uso (va dentro de BIEN)', () => {
    expect(mensajePorId('M6')!.cuando).toMatch(/sin uso/i);
  });
});

describe('ronda 3 (Fable releyó la versión 4 como Rogelio; Naza, 30/09)', () => {
  it('1. antes de un cierre o de LE9, el acuse común pegado es solo "Gracias, {{nombre}}." (M26)', () => {
    expect(mensajePorId('M26')!.texto).toBe('Gracias, {{nombre}}.');
    expect(acuseAntesDe('M3.4', 'M3', p('CI2'))).toBe('M26');
    expect(acuseAntesDe('M3.4', 'M3', p('LE9'))).toBe('M26');
    expect(acuseAntesDe('M3.4', 'M3', p('CA2'))).toBe('M3.4');
    expect(acuseAntesDe('M4.1', 'M4', p('CI2'))).toBe('M4.1'); // el sobrio va solo: no se toca
  });

  it('2. FO1 arranca con "Otra cosa, {{nombre}}."', () => {
    expect(p('FO1').texto.startsWith('Otra cosa, {{nombre}}.')).toBe(true);
    expect(p('FO1').texto).not.toContain('Una última cosa');
  });

  it('3. una sensible contestada con un "no" corto lleva el neutro (M25), no el sobrio; con "paso", M27 desde las simulaciones', () => {
    expect(mensajesDespues(p('AM9'), 'No, seguimos juntos.')).toEqual(['M25']);
    expect(mensajesDespues(p('PE5'), 'Paso')).toEqual(['M27']); // antes M25; M27 aprobado por Naza el 30/09 (simulaciones, regla 28)
    expect(mensajesDespues(p('CA17'), 'No, nada.')).toEqual(['M25']);
    expect(mensajesDespues(p('TR11'), 'Sí, en el noventa y pico me quedé sin trabajo.')).toEqual(['M4']);
  });

  it('4. si el acuse pegado lleva el nombre, la entrada va sin el nombre', () => {
    expect(entradaSegunAcuse('Ahora vamos a tu infancia, {{nombre}}: la casa.', 'Gracias, {{nombre}}. Eso también va al libro.')).toBe('Ahora vamos a tu infancia: la casa.');
    expect(entradaSegunAcuse('Volvemos a la familia, {{nombre}}, pero en tu vida adulta.', 'Bien, {{nombre}}. Lo sumo.')).toBe('Volvemos a la familia, pero en tu vida adulta.');
    expect(entradaSegunAcuse('Hablemos de los amigos, {{nombre}}, y de la gente que te dio una mano.', 'Gracias, {{nombre}}.')).toBe('Hablemos de los amigos y de la gente que te dio una mano.');
    expect(entradaSegunAcuse('Ahora vamos a tu infancia, {{nombre}}: la casa.', 'Anotado, gracias.')).toBe('Ahora vamos a tu infancia, {{nombre}}: la casa.');
    expect(entradaSegunAcuse('Ahora vamos a tu infancia, {{nombre}}: la casa.')).toBe('Ahora vamos a tu infancia, {{nombre}}: la casa.');
  });

  it('5. M25.2 es "Bien, seguimos."; delante de algo que arranca con "Seguimos" o "Pasamos" va "Bien, entonces."', () => {
    expect(mensajePorId('M25.2')!.texto).toBe('Bien, seguimos.');
    expect(acuseNeutro(1, 'Seguimos con la escuela')).toBe('M25.3');
    expect(acuseNeutro(0, 'Pasamos a tu juventud')).toBe('M25.3');
    expect(acuseNeutro(1, 'Hablemos de los amigos')).toBe('M25.2');
  });
});

describe('ronda 4 (Fable leyó la versión 6; Naza, 30/09)', () => {
  it('1. CI14 sin el nombre (el acuse de antes ya lo dice)', () => {
    expect(p('CI14').texto).not.toContain('{{nombre}}');
    expect(p('CI14').texto.startsWith('Con esto cerramos lo de hoy, y ya te conozco un poco más.')).toBe(true);
  });

  it('2. LE8 arranca sola: después de LE9 no va acuse, ni con "paso"', () => {
    expect(mensajesDespues(p('LE9'), 'Sí, quería contarte de mi hermano.')).toEqual([]);
    expect(mensajesDespues(p('LE9'), 'paso')).toEqual([]);
  });
});
