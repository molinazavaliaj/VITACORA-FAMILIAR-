import { describe, it, expect } from 'vitest';
import { controlarLugar, controlarSupuestos, controlarPregunta } from '../src/ia/control-pregunta.js';
import { perfilVacio, type Perfil } from '../src/ia/perfil.js';
import type { Objetivo } from '../src/ia/pregunta-v2.js';

// Los dos controles nuevos (diseño §2.7). C6: cuatro veces se mandó a Ciro a la ciudad equivocada;
// C12/C13/35: hijos, boda y esposa dados por hecho. Son controles sobre la salida, gratis.

function ciro(): Perfil {
  const p = perfilVacio();
  p.persona.edad = { valor: '28', fuente: 'dicho' };
  p.etapas = [
    { edades: '0 a 12', lugar: 'Concordia', conQuien: 'la madre y la abuela', queHacia: 'la escuela', fuente: 'dicho' },
    { edades: 'desde los 12', lugar: 'Buenos Aires (Núñez)', conQuien: 'el padre', queHacia: '', fuente: 'dicho' },
  ];
  return p;
}
const variable = (desde: number, hasta: number): Objetivo => ({ tipo: 'variable', id: 'v', tramo: 'juventud', desde, hasta, anclas: [] });

describe('controlarLugar', () => {
  it('rechaza la ciudad equivocada para esos años, y dice cuál es la correcta', () => {
    const r = controlarLugar('¿Cómo eran esos sábados en Concordia a tus 16?', ciro(), variable(13, 22));
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.control).toBe('lugar'); expect(r.motivo).toMatch(/Buenos Aires/); expect(r.motivo).toMatch(/Concordia/); }
  });
  it('acepta la ciudad correcta, una ciudad de la época que abarca el tramo, y preguntas sin ciudad', () => {
    expect(controlarLugar('¿Cómo eran esos sábados en Buenos Aires a tus 16?', ciro(), variable(13, 22)).ok).toBe(true);
    expect(controlarLugar('¿Cómo era la casa de Concordia?', ciro(), variable(0, 12)).ok).toBe(true);
    expect(controlarLugar('¿Con quién jugabas?', ciro(), variable(0, 12)).ok).toBe(true);
  });
  it('acentos y mayúsculas no importan; sin etapas en el perfil no controla; un tema sin tramo no controla', () => {
    expect(controlarLugar('¿Y en CONCORDIA?', ciro(), variable(0, 12)).ok).toBe(true);
    expect(controlarLugar('¿Y en Concordia?', perfilVacio(), variable(13, 22)).ok).toBe(true);
    expect(controlarLugar('¿Y en Concordia?', ciro(), { tipo: 'nucleo', id: 'amor', tramo: null, bloque: 'adulto joven', tema: '' } as never).ok).toBe(true);
  });

  it('la ciudad matchea por palabra entera, no como parte de otra (fix ronda 1)', () => {
    const salta = perfilVacio();
    salta.persona.edad = { valor: '20', fuente: 'dicho' };
    salta.etapas = [{ edades: '0 a 12', lugar: 'Salta', conQuien: '', queHacia: '', fuente: 'dicho' }];
    expect(controlarLugar('¿Qué hacías cuando saltabas a la soga?', salta, variable(0, 12)).ok).toBe(true);

    const roma = perfilVacio();
    roma.persona.edad = { valor: '20', fuente: 'dicho' };
    roma.etapas = [{ edades: '0 a 12', lugar: 'Roma', conQuien: '', queHacia: '', fuente: 'dicho' }];
    expect(controlarLugar('¿Tuviste algún amor romántico de chico?', roma, variable(0, 12)).ok).toBe(true);

    const pilar = perfilVacio();
    pilar.persona.edad = { valor: '20', fuente: 'dicho' };
    pilar.etapas = [{ edades: '0 a 12', lugar: 'Pilar', conQuien: '', queHacia: '', fuente: 'dicho' }];
    expect(controlarLugar('¿Recordás los pilares de tu casa?', pilar, variable(0, 12)).ok).toBe(true);
  });

  it('el objeto (la foto de esa época) también pasa por el control de lugar (diseño §2.7)', () => {
    const objeto: Objetivo = { tipo: 'objeto', id: 'objeto-juventud', tramo: 'juventud' };
    const r = controlarLugar('Pedile una foto de esa época en Concordia.', ciro(), objeto);
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.control).toBe('lugar'); expect(r.motivo).toMatch(/Buenos Aires/); }
    expect(controlarLugar('Pedile una foto de esa época en Buenos Aires.', ciro(), objeto).ok).toBe(true);
  });
  it('el objeto final (de toda su vida) no se ata a un tramo: puede nombrar la ciudad de la infancia (I3)', () => {
    const final: Objetivo = { tipo: 'objeto', id: 'objeto-final', tramo: 'juventud', final: true };
    expect(controlarLugar('¿Hay algo que guardes de toda tu vida, de Concordia?', ciro(), { ...final, final: undefined }).ok).toBe(false);
    expect(controlarLugar('¿Hay algo que guardes de toda tu vida, de Concordia?', ciro(), final).ok).toBe(true);
  });
});

describe('controlarSupuestos', () => {
  it('rechaza hijos, nietos, esposa/marido, boda o novia sin respaldo en el perfil', () => {
    for (const t of ['¿Cómo eran tus hijos de chicos?', '¿Qué le dirías a un nieto?', '¿Cómo conociste a tu esposa?', '¿Cómo fue la boda?', '¿La llegaste a presentar a tu novia en casa?']) {
      const r = controlarSupuestos(t, perfilVacio());
      expect(r.ok, t).toBe(false);
      if (!r.ok) expect(r.control).toBe('supuestos');
    }
  });
  it('acepta lo que el perfil respalda (dicho o ficha) y las preguntas que preguntan SI hubo', () => {
    const p = perfilVacio();
    p.personas = [{ nombre: 'Rubén', vinculo: 'marido', vive: 'no', fuente: 'dicho' }, { nombre: 'Ana y Luis', vinculo: 'hijos', vive: 'si', fuente: 'ficha' }];
    expect(controlarSupuestos('¿Cómo conociste a tu marido, Rubén?', p).ok).toBe(true);
    expect(controlarSupuestos('¿Cómo eran tus hijos de chicos?', p).ok).toBe(true);
    expect(controlarSupuestos('¿Tuviste hijos?', perfilVacio()).ok).toBe(true);
    expect(controlarSupuestos('¿Te enamoraste alguna vez?', perfilVacio()).ok).toBe(true);
  });

  it('el escape de "SI hubo" es local al sustantivo, no global a toda la frase (fix ronda 1)', () => {
    const r = controlarSupuestos('¿Alguna vez tus hijos te preguntaron por tu padre?', perfilVacio());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.control).toBe('supuestos');
  });

  it('el censo y la familia de hoy: la pregunta abierta por hijos o nietos pasa sin ficha (arreglo final M1: gastaba hasta 3 llamadas a Opus)', () => {
    for (const t of [
      'Contame quiénes son los tuyos hoy: ¿tenés pareja, hermanos, nietos o sobrinos?',
      '¿Tenés hijos o nietos? Contame de ellos.',
      '¿Cómo están tus sobrinos y tus nietos, si los hay?',
      '¿Y tus hijos, si los hay, qué esperás para ellos?',
      '¿Qué esperás para los tuyos, si hay hijos o nietos?',
      '¿Qué esperás para los tuyos? Si tenés hijos, contame de ellos.',
      '¿Tiene nietos? ¿Cómo se llaman?',
      '¿Hay nietos en la familia?',
    ]) expect(controlarSupuestos(t, perfilVacio()).ok, t).toBe(true);
  });
  it('M1 no afloja las afirmaciones: "tus nietos te quieren" y "tus hijos ya son grandes" siguen rechazadas sin ficha', () => {
    for (const t of ['¿Tus nietos te quieren mucho?', '¿Cómo son tus hijos ahora que ya son grandes?', '¿Qué le dejarías a tus nietos?', '¿Qué hay de tus nietos?']) {
      const r = controlarSupuestos(t, perfilVacio());
      expect(r.ok, t).toBe(false);
    }
  });

  it('los patrones están sin acentos: "señora" y "enamoró" también se cazan (fix ronda 1)', () => {
    expect(controlarSupuestos('¿Cómo conociste a tu señora?', perfilVacio()).ok).toBe(false);
  });
});

describe('controlarPregunta (todos juntos)', () => {
  it('trato, largo, pregunta, lugar y supuestos, en ese orden; y la presentación solo largo y trato', () => {
    const p = ciro(); p.persona.comoHabla = { valor: 'vos', fuente: 'dicho' };
    expect(controlarPregunta('Cuénteme de Concordia.', p, variable(13, 22))).toMatchObject({ ok: false, control: 'trato' });
    expect(controlarPregunta('¿Y tus hijos en Concordia a los 16?', p, variable(13, 22))).toMatchObject({ ok: false, control: 'lugar' });
    expect(controlarPregunta('¿Y tus hijos en Buenos Aires a los 16?', p, variable(13, 22))).toMatchObject({ ok: false, control: 'supuestos' });
    expect(controlarPregunta('Hola, soy tu biógrafo. Voy a escribir el libro de tu vida con lo que me cuentes. Decime cómo te dicen en casa.', p, { tipo: 'nucleo', id: 'presentacion', tramo: null, bloque: 'presentacion', tema: '' } as never)).toEqual({ ok: true });
  });
});

describe('controlarLugar con una repregunta (esqueleto v2)', () => {
  it('una repregunta de la infancia que nombra la ciudad de la juventud se rechaza; sin tramo, no controla', () => {
    const p = perfilVacio();
    p.persona.edad = { valor: '27', fuente: 'dicho' };
    p.etapas.push({ edades: '0 a 12', lugar: 'Concordia', conQuien: '', queHacia: '', fuente: 'dicho' }, { edades: '13 a 22', lugar: 'Buenos Aires', conQuien: '', queHacia: '', fuente: 'dicho' });
    const rep = (tramo: 'infancia' | null): Objetivo => ({ tipo: 'repregunta', id: 'x', tramo, pregunta: 'P', falto: ['a'] });
    expect(controlarPregunta('¿Y en Buenos Aires, qué jugabas de chico?', p, rep('infancia')).ok).toBe(false);
    expect(controlarPregunta('¿Y en Buenos Aires, qué jugabas de chico?', p, rep(null)).ok).toBe(true);
  });
});
