import { describe, it, expect } from 'vitest';
import { NUCLEO, armarPromptPregunta, controlarPregunta, secuencia, type Objetivo } from '../src/ia/pregunta-v2.js';
import type { Variable } from '../src/ia/plan-preguntas.js';

const nucleo = (i: number): Objetivo => ({ tipo: 'nucleo', ...NUCLEO[i] });
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';

// La pregunta del día, v2 (biógrafo v2, 23/09). Cambia el ENCARGO —de "decorá esta pregunta
// del guion" a "decidí cómo preguntarle esto a ESTA persona"—, la ENTRADA —el perfil y cada
// respuesta con la pregunta que la originó, que es lo que resolvió C6— y el CONTROL —se revisa
// lo que devuelve antes de mandarlo, que es lo que resolvió C11—.

function perfilDe(parcial: Partial<Perfil['persona']>): Perfil {
  const p = perfilVacio();
  p.persona = { ...p.persona, ...parcial };
  return p;
}

describe('NUCLEO', () => {
  it('arranca con la escena de la casa y el mapa (casas, capítulos), y cierra con su vida en cinco minutos', () => {
    expect(NUCLEO[0].id).toBe('casa-infancia');
    expect(NUCLEO.slice(1, 3).map((n) => n.id)).toEqual(['mapa-casas', 'mapa-capitulos']);
    expect(NUCLEO.at(-1)?.id).toBe('cinco-minutos');
  });
});

describe('secuencia', () => {
  it('los tres primeros van primero, las variables se intercalan por tramo y la reflexión va al final', () => {
    const vars: Variable[] = [
      { tramo: 'segunda mitad', desde: 56, hasta: 76, anclas: [] },
      { tramo: 'adulto joven', desde: 23, hasta: 35, anclas: [] },
    ];
    const ids = secuencia(vars).map((o) => (o.tipo === 'nucleo' ? o.id : `var:${o.tramo}`));
    expect(ids.slice(0, 3)).toEqual(['casa-infancia', 'mapa-casas', 'mapa-capitulos']);
    expect(ids.indexOf('var:adulto joven')).toBeLessThan(ids.indexOf('var:segunda mitad'));
    expect(ids.indexOf('var:segunda mitad')).toBeLessThan(ids.indexOf('un-dia-de-hoy'));
    expect(ids.at(-1)).toBe('cinco-minutos');
  });
});

describe('armarPromptPregunta', () => {
  const conversacion = [{ pregunta: '¿Cómo eran los sábados a la noche en Buenos Aires?', respuesta: 'Salíamos de miércoles a domingo.' }];

  it('le pasa cada respuesta CON su pregunta (C6: sin la pregunta, Buenos Aires no existía)', () => {
    const p = armarPromptPregunta(perfilDe({}), nucleo(5), conversacion, []);
    expect(p).toContain('¿Cómo eran los sábados a la noche en Buenos Aires?');
    expect(p).toContain('Salíamos de miércoles a domingo.');
  });

  it('una variable lleva su tramo y sus anclas', () => {
    const v: Objetivo = { tipo: 'variable', tramo: 'adultez media', desde: 36, hasta: 55, anclas: ['Lanús — su taller (27 a 60)'] };
    const p = armarPromptPregunta(perfilDe({}), v, [], []);
    expect(p).toContain('entre los 36 y los 55');
    expect(p).toContain('Lanús — su taller');
  });

  it('si no se sabe cómo habla, lo dice en vez de elegir por él', () => {
    expect(armarPromptPregunta(perfilDe({}), nucleo(0), [], [])).toContain('no sabés cómo prefiere que le hablen');
    expect(armarPromptPregunta(perfilDe({ comoHabla: { valor: 'vos', fuente: 'deducido' } }), nucleo(0), [], [])).toContain('Hablale de vos');
  });
});

describe('controlarPregunta', () => {
  it('rechaza el trato mezclado (C11)', () => {
    expect(controlarPregunta('Mirá, vos dijiste que... ¿cómo conoció al amor de su vida? Lléveme a ese día.', 'vos').ok).toBe(false);
  });

  it('rechaza sin pregunta, o demasiado larga para leer en el celular', () => {
    expect(controlarPregunta('Contame de tu casa.', 'vos').ok).toBe(false);
    expect(controlarPregunta(`${'palabra '.repeat(60)}?`, 'vos').ok).toBe(false);
  });

  it('acepta una buena', () => {
    expect(controlarPregunta('Contame de la casa de Pelliza: si cerrás los ojos y entrás, ¿qué ves?', 'vos')).toEqual({ ok: true });
  });

  it('sin trato conocido, solo controla la forma', () => {
    expect(controlarPregunta('¿Cómo era la casa donde pasó su infancia?', null).ok).toBe(true);
  });
});
