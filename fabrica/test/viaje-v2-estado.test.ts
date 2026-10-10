import { describe, it, expect } from 'vitest';
import { nuevoEstado, anotarEnvio, anotarRespuesta, nochesSinContestar, contestadasAntes, type Estado } from '../src/viaje-v2/estado.js';

const T = '2026-10-11T19:30:00.000Z';

function conNoches(contestadas: boolean[]): Estado {
  let e = nuevoEstado();
  contestadas.forEach((si, i) => {
    e = anotarEnvio(e, { clave: `D${i + 1}-noche`, tipo: 'noche', ids: ['C1', 'NO1', 'F1'], en: T });
    if (si) e = anotarRespuesta(e, `D${i + 1}-noche`, { tipo: 'audio', en: T });
  });
  return e;
}

describe('viaje v2: estado', () => {
  it('cuenta las noches del viaje seguidas sin contestar, desde la última', () => {
    expect(nochesSinContestar(conNoches([]))).toBe(0);
    expect(nochesSinContestar(conNoches([true, false]))).toBe(1);
    expect(nochesSinContestar(conNoches([false, false]))).toBe(2);
    expect(nochesSinContestar(conNoches([false, true]))).toBe(0);
  });

  it('"paso" cuenta como contestada', () => {
    const e = anotarRespuesta(conNoches([false]), 'D1-noche', { tipo: 'paso', en: T });
    expect(nochesSinContestar(e)).toBe(0);
  });

  it('un audio que llegó mal es un intento: para el ATR no cuenta como noche sin contestar (revisión)', () => {
    const e = anotarRespuesta(conNoches([false]), 'D1-noche', { tipo: 'audio', en: T, audioMal: true });
    expect(nochesSinContestar(e)).toBe(0);
  });

  it('el mediodía, la mañana y CA1 no cuentan como noches del viaje', () => {
    let e = conNoches([false]);
    e = anotarEnvio(e, { clave: 'D2-mediodia', tipo: 'MD', ids: ['MD1'], en: T });
    expect(nochesSinContestar(e)).toBe(1);
    e = anotarEnvio(e, { clave: 'D9-noche', tipo: 'CA1', ids: ['CA1'], en: T });
    expect(nochesSinContestar(e)).toBe(1);
  });

  it('las de antes de salir contestadas (o pasadas) salen de la cadena', () => {
    let e = nuevoEstado();
    for (const id of ['AS1', 'AS2', 'IM1']) e = anotarEnvio(e, { clave: id, tipo: 'cadena', ids: [id], en: T });
    e = anotarRespuesta(e, 'AS1', { tipo: 'audio', en: T });
    e = anotarRespuesta(e, 'IM1', { tipo: 'paso', en: T });
    expect([...contestadasAntes(e)]).toEqual(['AS1', 'IM1']);
  });

  it('anotar una respuesta a algo que no se mandó es un error', () => {
    expect(() => anotarRespuesta(nuevoEstado(), 'D1-noche', { tipo: 'audio', en: T })).toThrow(/D1-noche/);
  });
});
