// Los botones en el flujo (docs/v3/entrevista/simulaciones/textos-finales.md,
// reglas 1 a 8 y 32; PLAN-codigo.md; Naza, 30/09): siguientePregunta dice qué
// botones van, si va la línea de ayuda M31 (una sola vez) y si FO1 espera la
// foto; tocar "Sí" manda M30 y sigue esperando la misma pregunta.

import { describe, expect, it } from 'vitest';
import { BANCO, preguntaPorId } from '../src/v3/entrevista/banco.js';
import { alTocarBoton, siguientePregunta, type Siguiente } from '../src/v3/entrevista/flujo.js';
import { armarTurno } from '../src/v3/entrevista/mensajes.js';
import { simularRecorrido } from '../src/v3/entrevista/seleccion.js';
import { respuestaDeBoton } from '../src/v3/entrevista/respuesta.js';
import { VIDAS_EJEMPLO } from '../src/v3/entrevista/vidas-ejemplo.js';

const p = (id: string) => preguntaPorId(id)!;
const CUENTA = 'Sí, te cuento algo largo que pasó.';
/** Todas las del banco hasta `id` (sin incluirla) contestadas contando algo. */
const hasta = (id: string) => new Map(BANCO.filter((q) => q.orden < p(id).orden).map((q) => [q.id, CUENTA]));
const comoPregunta = (s: Siguiente) => (s.tipo === 'pregunta' ? s : undefined);

describe('siguientePregunta: botones y ayuda (reglas 1 y 8)', () => {
  it('CI1 es el primer mensaje con botones: lleva [No, está todo] y la ayuda M31', () => {
    const s = comoPregunta(siguientePregunta({ respuestas: hasta('CI1') }))!;
    expect(s.pregunta.id).toBe('CI1');
    expect(s.botones).toEqual([{ texto: 'No, está todo', vale: 'no' }]);
    expect(s.ayudaBotones).toBe(true);
  });

  it('después, las que llevan botones los traen sin la ayuda; las que no, sin nada', () => {
    const r = hasta('CA6');
    const ca6 = comoPregunta(siguientePregunta({ respuestas: r }))!;
    expect(ca6.pregunta.id).toBe('CA6');
    expect(ca6.botones?.map((b) => b.texto)).toEqual(['Sí, tuve', 'No tuve hermanos']);
    expect(ca6.ayudaBotones).toBeUndefined();
    const or2 = comoPregunta(siguientePregunta({ respuestas: new Map([['OR1', CUENTA]]) }))!;
    expect(or2.botones).toBeUndefined();
    expect(or2.ayudaBotones).toBeUndefined();
  });

  it('en una vida completa la ayuda va una sola vez, en CI1', () => {
    const v = VIDAS_EJEMPLO.find((x) => x.clave === 'sigue-con-la-primera')!;
    const pasos = simularRecorrido(v.ficha, (id) => v.respuestas[id]);
    const conAyuda = pasos.flatMap((x) => (x.tipo === 'pregunta' && x.ayudaBotones ? [x.pregunta.id] : []));
    expect(conAyuda).toEqual(['CI1']);
    const conBotones = pasos.flatMap((x) => (x.tipo === 'pregunta' && x.botones ? [x.pregunta.id] : []));
    expect(conBotones).toEqual(expect.arrayContaining(['CI1', 'CA6', 'CA17', 'AM0', 'AM3', 'AM9', 'HI0', 'HI8', 'PE1', 'FO1']));
  });
});

describe('FO1 espera la foto (regla 32)', () => {
  it('esperaFoto y el botón [No tengo foto]', () => {
    const r = hasta('FO1');
    const s = comoPregunta(siguientePregunta({ respuestas: r, rondaExtra: 'rechazada' }))!;
    expect(s.pregunta.id).toBe('FO1');
    expect(s.esperaFoto).toBe(true);
    expect(s.botones).toEqual([{ texto: 'No tengo foto', vale: 'no' }]);
  });

  it('las demás no', () => {
    const s = comoPregunta(siguientePregunta({ respuestas: new Map() }))!;
    expect(s.esperaFoto).toBeUndefined();
  });

  it('[No tengo foto] cierra FO1 y sigue LE9', () => {
    const r = hasta('FO1');
    r.set('FO1', respuestaDeBoton('No tengo foto'));
    const s = comoPregunta(siguientePregunta({ respuestas: r, rondaExtra: 'rechazada' }))!;
    expect(s.pregunta.id).toBe('LE9');
  });
});

describe('alTocarBoton (reglas 2 a 5)', () => {
  it('"Sí": se manda M30 solo y se sigue esperando audio en la misma pregunta', () => {
    expect(alTocarBoton(p('HI0'), 'Sí, tuve')).toEqual({ vale: 'si', respuesta: '⟦botón:Sí, tuve⟧', mandar: 'M30', esperaAudio: true });
  });

  it('"No" y "Paso": la respuesta queda cerrada y sigue el flujo', () => {
    expect(alTocarBoton(p('HI0'), 'No tuve hijos')).toEqual({ vale: 'no', respuesta: '⟦botón:No tuve hijos⟧', esperaAudio: false });
    expect(alTocarBoton(p('PE1'), 'Paso esta')).toEqual({ vale: 'paso', respuesta: '⟦botón:Paso esta⟧', esperaAudio: false });
    expect(alTocarBoton(p('CI4'), 'No, está todo')).toMatchObject({ vale: 'no', esperaAudio: false });
  });
});

describe('armarTurno con la ayuda M31 (regla 8)', () => {
  it('va en línea aparte debajo de la pregunta, después de M1 si lo hay', () => {
    expect(armarTurno({ acuse: 'Gracias.', familia: 'M26', pregunta: 'Con esto cerramos…', ayuda: '_Podés tocar…_' })).toEqual(['Gracias.\nCon esto cerramos…\n_Podés tocar…_']);
    expect(armarTurno({ pregunta: '¿Tuviste hermanos?', m1: '_Si no va con vos…_', ayuda: '_Podés tocar…_' })).toEqual(['¿Tuviste hermanos?\n_Si no va con vos…_\n_Podés tocar…_']);
  });
});
