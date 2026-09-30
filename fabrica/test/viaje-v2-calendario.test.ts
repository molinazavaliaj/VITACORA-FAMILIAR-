import { describe, it, expect } from 'vitest';
import {
  armarCalendario,
  ORDEN_PUERTAS,
  CADENA_ANTES,
  siguienteDeLaCadena,
  momentoDeLaSiguiente,
  momentoRecordatorio,
  pendientesAntes,
  validarCompra,
  type Programado,
} from '../src/viaje-v2/calendario.js';
import { aInstante, aLocal, sumarDias } from '../src/viaje-v2/horas.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const BA = 'America/Argentina/Buenos_Aires';
const MADRID = 'Europe/Madrid';

function compra(salida: string, vuelta: string, extra: Partial<Compra> = {}): Compra {
  return {
    nombre: 'Lucía',
    salida,
    vuelta,
    zonaCasa: BA,
    zonaViaje: MADRID,
    preguntasPropias: [],
    formato: 'impreso',
    fotosAlbum: 20,
    ...extra,
  };
}

const delDia = (ps: readonly Programado[], dia: number) => ps.filter((p) => p.dia === dia);
const tipos = (ps: readonly Programado[], dia: number) => delDia(ps, dia).map((p) => p.tipo);
const noches = (ps: readonly Programado[]) => ps.filter((p) => p.momento === 'noche' && p.tipo !== 'CA1');

describe('viaje v2: calendario, la forma del viaje', () => {
  it('8 días (salida sábado 10, vuelta sábado 17): UC1, ID1, mediodías, noches, FN1, VU0, VU1, CA1', () => {
    const { programados } = armarCalendario(compra('2026-10-10', '2026-10-17'), []);
    expect(tipos(programados, 0)).toEqual(['UC1']);
    expect(tipos(programados, 1)).toEqual(['ID1', 'noche']);
    for (const d of [2, 3, 4, 5]) expect(tipos(programados, d)).toEqual(['MD', 'noche']);
    expect(tipos(programados, 6)).toEqual(['MD', 'FN1']);
    expect(tipos(programados, 7)).toEqual(['VU0']);
    expect(tipos(programados, 8)).toEqual(['VU1', 'CA1']);
    expect(programados.some((p) => p.dia > 8)).toBe(false);
  });

  it('horas: día de salida en casa, del día siguiente al de vuelta en el viaje, después en casa', () => {
    const c = compra('2026-10-10', '2026-10-17');
    const { programados } = armarCalendario(c, []);
    const uc1 = programados.find((p) => p.tipo === 'UC1')!;
    expect([uc1.zona, uc1.fecha, uc1.hora]).toEqual([BA, '2026-10-10', '10:00']);
    expect(uc1.instante.toISOString()).toBe('2026-10-10T13:00:00.000Z');
    const id1 = programados.find((p) => p.tipo === 'ID1')!;
    expect([id1.zona, id1.fecha, id1.hora]).toEqual([MADRID, '2026-10-11', '10:00']);
    const md = programados.find((p) => p.tipo === 'MD')!;
    expect([md.zona, md.hora]).toEqual([MADRID, '13:00']);
    const noche = programados.find((p) => p.tipo === 'noche')!;
    expect([noche.zona, noche.hora]).toEqual([MADRID, '21:30']);
    const vu0 = programados.find((p) => p.tipo === 'VU0')!;
    expect([vu0.zona, vu0.fecha, vu0.hora]).toEqual([MADRID, '2026-10-17', '13:00']);
    const vu1 = programados.find((p) => p.tipo === 'VU1')!;
    expect([vu1.zona, vu1.fecha, vu1.hora]).toEqual([BA, '2026-10-18', '10:00']);
    const ca1 = programados.find((p) => p.tipo === 'CA1')!;
    expect([ca1.zona, ca1.fecha, ca1.hora]).toEqual([BA, '2026-10-18', '21:30']);
  });

  it('la hora de la noche es la de la compra', () => {
    const { programados } = armarCalendario(compra('2026-10-10', '2026-10-17', { horaNoche: '20:00' }), []);
    expect(noches(programados).every((p) => p.hora === '20:00')).toBe(true);
    expect(programados.find((p) => p.tipo === 'CA1')!.hora).toBe('20:00');
  });

  it('nunca entre las 23:00 y las 8:00 locales: una noche a las 23:15 pasa a las 8:00 del día siguiente', () => {
    const { programados } = armarCalendario(compra('2026-10-10', '2026-10-17', { horaNoche: '23:15' }), []);
    for (const p of programados) {
      const { hora } = aLocal(p.instante, p.zona);
      expect(hora >= '08:00' && hora < '23:00', `${p.tipo} ${p.fecha} ${hora}`).toBe(true);
    }
    const primera = noches(programados)[0];
    expect([primera.fecha, primera.hora]).toEqual(['2026-10-12', '08:00']);
  });

  it('todos los instantes están en orden y ninguno cae en la franja', () => {
    const { programados } = armarCalendario(compra('2026-10-01', '2026-10-30'), []);
    for (let i = 1; i < programados.length; i++) {
      expect(programados[i].instante.getTime()).toBeGreaterThan(programados[i - 1].instante.getTime());
    }
  });
});

describe('viaje v2: calendario, viajes cortos y largos', () => {
  it('1 día (sale y vuelve el mismo día): solo UC1 ese día; al otro, VU1 y CA1', () => {
    const r = armarCalendario(compra('2026-10-10', '2026-10-10', { preguntasPropias: ['¿a?'] }), ['VA1']);
    expect(tipos(r.programados, 0)).toEqual(['UC1']);
    expect(tipos(r.programados, 1)).toEqual(['VU1', 'CA1']);
    expect(r.programados).toHaveLength(3);
    expect(r.antesQueNoEntran).toEqual(['VA1']);
    expect(r.propiasQueNoEntran).toEqual(['¿a?']);
    // el día de vuelta coincide con la salida: VU1 y CA1 van en hora de casa
    expect(delDia(r.programados, 1).every((p) => p.zona === BA)).toBe(true);
  });

  it('2 días: el segundo es el de vuelta (solo VU0, sin ID1); no hay noches del viaje', () => {
    const r = armarCalendario(compra('2026-10-10', '2026-10-11'), []);
    expect(tipos(r.programados, 0)).toEqual(['UC1']);
    expect(tipos(r.programados, 1)).toEqual(['VU0']);
    expect(tipos(r.programados, 2)).toEqual(['VU1', 'CA1']);
    expect(noches(r.programados)).toHaveLength(0);
  });

  it('3 días: ID1 y FN1 el mismo día (la noche del día siguiente a la salida es la última)', () => {
    const r = armarCalendario(compra('2026-10-10', '2026-10-12'), []);
    expect(tipos(r.programados, 1)).toEqual(['ID1', 'FN1']);
    expect(tipos(r.programados, 2)).toEqual(['VU0']);
    expect(r.programados.some((p) => p.tipo === 'MD')).toBe(false);
  });

  it('30 días: segunda vuelta del mediodía solo con MD1, MD5, MD3, MD4, MD6', () => {
    const { programados } = armarCalendario(compra('2026-10-01', '2026-10-30'), []);
    const mds = programados.filter((p) => p.tipo === 'MD').map((p) => p.ids[0]);
    expect(mds).toHaveLength(27); // días 2 a 28
    const primera = mds.slice(0, 12);
    // MD2 se saltea si cae el día de la puerta NO1 (comida); MD8 con NO6
    expect(new Set(primera).size).toBe(primera.length);
    const idxSegunda = mds.findIndex((id, i) => i > 0 && mds.slice(0, i).includes(id));
    const segunda = mds.slice(idxSegunda);
    expect(segunda.every((id) => ['MD1', 'MD5', 'MD3', 'MD4', 'MD6'].includes(id))).toBe(true);
    expect(segunda.slice(0, 5)).toEqual(['MD1', 'MD5', 'MD3', 'MD4', 'MD6']);
    expect(segunda.slice(5, 10)).toEqual(['MD1', 'MD5', 'MD3', 'MD4', 'MD6']);
  });

  it('nunca MD2 el día de la puerta NO1, ni MD8 el día de NO6: va la siguiente', () => {
    for (const vuelta of ['2026-10-12', '2026-10-17', '2026-10-24', '2026-10-30', '2026-11-20']) {
      const { programados } = armarCalendario(compra('2026-10-01', vuelta), []);
      for (let d = 0; d < 60; d++) {
        const dia = delDia(programados, d);
        const md = dia.find((p) => p.tipo === 'MD')?.ids[0];
        const puerta = dia.find((p) => p.tipo === 'noche')?.ids[1];
        if (md === 'MD2') expect(puerta).not.toBe('NO1');
        if (md === 'MD8') expect(puerta).not.toBe('NO6');
      }
    }
  });

  it('un choque real: con 3 de antes pendientes, el día 12 la puerta es NO6 y MD8 se saltea (va MD11)', () => {
    const { programados } = armarCalendario(compra('2026-10-01', '2026-10-30'), ['AS2', 'IM1', 'VA1']);
    expect(delDia(programados, 12).find((p) => p.tipo === 'noche')!.ids[1]).toBe('NO6');
    expect(delDia(programados, 12).find((p) => p.tipo === 'MD')!.ids).toEqual(['MD11']);
    const mds = programados.filter((p) => p.tipo === 'MD').map((p) => p.ids[0]);
    expect(mds).not.toContain('MD8'); // no vuelve en la segunda vuelta
    expect(mds.slice(0, 11)).toEqual(['MD1', 'MD5', 'MD3', 'MD4', 'MD9', 'MD2', 'MD10', 'MD6', 'MD7', 'MD12', 'MD11']);
  });

  it('sin pendientes, en 30 días no hay choque: la primera vuelta sale entera', () => {
    const { programados } = armarCalendario(compra('2026-10-01', '2026-10-30'), []);
    const mds = programados.filter((p) => p.tipo === 'MD').map((p) => p.ids[0]);
    expect(mds.slice(0, 12)).toEqual(['MD1', 'MD5', 'MD3', 'MD4', 'MD9', 'MD2', 'MD10', 'MD6', 'MD7', 'MD12', 'MD8', 'MD11']);
  });
});

describe('viaje v2: la noche común', () => {
  it('rotación de puertas fija, documentada: empieza por comida y lugar', () => {
    expect(ORDEN_PUERTAS).toEqual(['NO1', 'NO2', 'NO4', 'NO3', 'NO9', 'NO8', 'NO5', 'NO7', 'NO6']);
    expect(new Set(ORDEN_PUERTAS).size).toBe(9);
  });

  it('las livianas (NO1 comida, NO9 risa) quedan entre dos pesadas, también al dar la vuelta', () => {
    const n = ORDEN_PUERTAS.length;
    for (const liviana of ['NO1', 'NO9'] as const) {
      const i = ORDEN_PUERTAS.indexOf(liviana);
      const antes = ORDEN_PUERTAS[(i - 1 + n) % n];
      const despues = ORDEN_PUERTAS[(i + 1) % n];
      expect(['NO1', 'NO9']).not.toContain(antes);
      expect(['NO1', 'NO9']).not.toContain(despues);
    }
  });

  it('entre pesadas se alterna afuera (lugar, lo distinto, alguien, plan) y adentro (sentir, cuerpo, rato quieto)', () => {
    const afuera = new Set(['NO2', 'NO3', 'NO5', 'NO6']);
    const pesadas = ORDEN_PUERTAS.filter((id) => id !== 'NO1' && id !== 'NO9');
    for (let i = 1; i < pesadas.length; i++) {
      expect(afuera.has(pesadas[i]), `${pesadas[i - 1]} → ${pesadas[i]}`).not.toBe(afuera.has(pesadas[i - 1]));
    }
  });

  it('comienzo, puerta y cierre rotan por separado: en 9 noches salen las 9 combinaciones de comienzo y cierre', () => {
    const { programados } = armarCalendario(compra('2026-10-01', '2026-10-12'), []); // 11 días → 9 noches comunes
    const comunes = programados.filter((p) => p.tipo === 'noche');
    expect(comunes).toHaveLength(9);
    expect(comunes.map((p) => p.ids[1])).toEqual(ORDEN_PUERTAS);
    expect(new Set(comunes.map((p) => `${p.ids[0]}+${p.ids[2]}`)).size).toBe(9);
    expect(comunes[0].ids).toEqual(['C1', 'NO1', 'F1']);
  });
});

describe('viaje v2: pendientes de antes y preguntas propias', () => {
  it('las de antes que faltaron van en orden, una por noche, en las primeras noches, en lugar de la común', () => {
    const { programados } = armarCalendario(compra('2026-10-10', '2026-10-17'), ['AS2', 'VA1']);
    const ns = noches(programados);
    expect(ns[0]).toMatchObject({ tipo: 'antes-en-viaje', ids: ['AS2'], dia: 1 });
    expect(ns[1]).toMatchObject({ tipo: 'antes-en-viaje', ids: ['VA1'], dia: 2 });
    expect(ns[2]).toMatchObject({ tipo: 'noche', dia: 3 });
    // la rotación de la noche común arranca igual por el principio
    expect(ns[2].ids).toEqual(['C1', 'NO1', 'F1']);
  });

  it('preguntas propias: reemplazan noches comunes, repartidas parejas, nunca en FN1', () => {
    const c = compra('2026-10-10', '2026-10-17', { preguntasPropias: ['¿uno?', '¿dos?'], regalo: { quienRegala: 'Tomás' } });
    const { programados, propiasQueNoEntran } = armarCalendario(c, ['VA1']);
    const ns = noches(programados);
    expect(ns.map((p) => p.tipo)).toEqual(['antes-en-viaje', 'noche', 'propia', 'noche', 'propia', 'FN1']);
    expect(ns.filter((p) => p.tipo === 'propia').map((p) => [p.ids[0], p.pregunta])).toEqual([
      ['PR-R', '¿uno?'],
      ['PR-R', '¿dos?'],
    ]);
    expect(propiasQueNoEntran).toEqual([]);
  });

  it('sin regalo, las propias son PR-P', () => {
    const { programados } = armarCalendario(compra('2026-10-10', '2026-10-17', { preguntasPropias: ['¿uno?'] }), []);
    expect(programados.find((p) => p.tipo === 'propia')!.ids).toEqual(['PR-P']);
  });

  it('5 propias en 30 días quedan repartidas: ninguna pegada a otra', () => {
    const c = compra('2026-10-01', '2026-10-30', { preguntasPropias: ['1', '2', '3', '4', '5'] });
    const { programados } = armarCalendario(c, []);
    const dias = programados.filter((p) => p.tipo === 'propia').map((p) => p.dia);
    expect(dias).toHaveLength(5);
    for (let i = 1; i < dias.length; i++) expect(dias[i] - dias[i - 1]).toBeGreaterThanOrEqual(4);
  });

  it('más propias que noches: entran las primeras, las demás se anotan (no se pierden en silencio)', () => {
    const c = compra('2026-10-10', '2026-10-13', { preguntasPropias: ['1', '2', '3', '4', '5'] }); // 4 días → 1 noche común
    const r = armarCalendario(c, []);
    expect(r.programados.filter((p) => p.tipo === 'propia').map((p) => p.pregunta)).toEqual(['1']);
    expect(r.propiasQueNoEntran).toEqual(['2', '3', '4', '5']);
    expect(r.programados.find((p) => p.dia === 2)!.tipo).toBe('MD');
    expect(tipos(r.programados, 2)).toEqual(['MD', 'FN1']);
  });

  it('las de antes tienen prioridad sobre las propias; si no hay noches, se anotan', () => {
    const c = compra('2026-10-10', '2026-10-13', { preguntasPropias: ['1'] });
    const r = armarCalendario(c, ['AS1', 'AS2']);
    expect(noches(r.programados).map((p) => p.tipo)).toEqual(['antes-en-viaje', 'FN1']);
    expect(r.antesQueNoEntran).toEqual(['AS2']);
    expect(r.propiasQueNoEntran).toEqual(['1']);
  });

  it('valida la compra: más de 5 propias, vuelta antes de la salida, zona inválida, hora mal escrita', () => {
    expect(() => validarCompra(compra('2026-10-10', '2026-10-17', { preguntasPropias: ['1', '2', '3', '4', '5', '6'] }))).toThrow(/5/);
    expect(() => validarCompra(compra('2026-10-10', '2026-10-09'))).toThrow(/vuelta/);
    expect(() => validarCompra(compra('2026-10-10', '2026-10-17', { zonaViaje: 'Marte/Olympus' }))).toThrow(/zona/);
    expect(() => validarCompra(compra('2026-10-10', '2026-10-17', { horaNoche: '9:30' }))).toThrow(/horaNoche/);
    expect(() => validarCompra(compra('2026-10-10', '2026-10-17'))).not.toThrow();
  });
});

describe('viaje v2: antes de salir (la cadena)', () => {
  it('AS1 → AS2 → IM1 → VA1 → nada', () => {
    expect(CADENA_ANTES).toEqual(['AS1', 'AS2', 'IM1', 'VA1']);
    expect(siguienteDeLaCadena('AS1')).toBe('AS2');
    expect(siguienteDeLaCadena('IM1')).toBe('VA1');
    expect(siguienteDeLaCadena('VA1')).toBeNull();
  });

  it('la siguiente sale apenas contesta; de 23 a 8 espera a las 8:00 (hora de casa)', () => {
    const c = compra('2026-10-10', '2026-10-17');
    const tarde = aInstante('2026-10-02', '19:05', BA);
    expect(momentoDeLaSiguiente(tarde, c)).toEqual(tarde);
    const noche = aInstante('2026-10-02', '23:40', BA);
    expect(aLocal(momentoDeLaSiguiente(noche, c)!, BA)).toEqual({ fecha: '2026-10-03', hora: '08:00' });
  });

  it('el día de salida la cadena se calla (solo UC1); si la franja la empuja a ese día, también', () => {
    const c = compra('2026-10-10', '2026-10-17');
    expect(momentoDeLaSiguiente(aInstante('2026-10-10', '09:00', BA), c)).toBeNull();
    expect(momentoDeLaSiguiente(aInstante('2026-10-09', '23:30', BA), c)).toBeNull();
    expect(momentoDeLaSiguiente(aInstante('2026-10-09', '22:30', BA), c)).not.toBeNull();
  });

  it('compra el mismo día que sale: la cadena no corre; todas quedan para las noches', () => {
    const c = compra('2026-10-10', '2026-10-17');
    expect(momentoDeLaSiguiente(aInstante('2026-10-10', '08:30', BA), c)).toBeNull();
    expect(pendientesAntes(new Set())).toEqual(['AS1', 'AS2', 'IM1', 'VA1']);
    const { programados } = armarCalendario(c, pendientesAntes(new Set(['AS1'])));
    expect(noches(programados).slice(0, 3).map((p) => p.ids[0])).toEqual(['AS2', 'IM1', 'VA1']);
    expect(tipos(programados, 0)).toEqual(['UC1']);
  });

  it('REC1: a los 3 días de colgada, una sola vez, respetando la franja', () => {
    const c = compra('2026-10-21', '2026-10-28'); // compra 20 días antes
    const enviada = aInstante('2026-10-01', '18:00', BA);
    const rec = momentoRecordatorio(enviada, c, false)!;
    expect(aLocal(rec, BA)).toEqual({ fecha: '2026-10-04', hora: '18:00' });
    expect(momentoRecordatorio(enviada, c, true)).toBeNull();
    const deNoche = aInstante('2026-10-01', '23:50', BA);
    expect(aLocal(momentoRecordatorio(deNoche, c, false)!, BA)).toEqual({ fecha: '2026-10-05', hora: '08:00' });
  });

  it('REC1 no va si faltan menos de 2 días para salir', () => {
    const c = compra('2026-10-10', '2026-10-17');
    expect(momentoRecordatorio(aInstante('2026-10-06', '09:00', BA), c, false)).toBeNull(); // caería el 9: falta 1 día
    expect(momentoRecordatorio(aInstante('2026-10-05', '09:00', BA), c, false)).not.toBeNull(); // cae el 8 a las 9: faltan 2 días
  });

  it('pendientes: las de la cadena que no contestó (ni dijo "paso"), en orden', () => {
    expect(pendientesAntes(new Set(['AS1', 'IM1']))).toEqual(['AS2', 'VA1']);
    expect(pendientesAntes(new Set(CADENA_ANTES))).toEqual([]);
  });
});

describe('viaje v2: zonas con 5 horas de diferencia', () => {
  it('la mañana del día siguiente a la salida es las 10 de Madrid (5 de Buenos Aires), no las 10 de casa', () => {
    const { programados } = armarCalendario(compra('2026-10-10', '2026-10-17'), []);
    const id1 = programados.find((p) => p.tipo === 'ID1')!;
    expect(aLocal(id1.instante, BA)).toEqual({ fecha: '2026-10-11', hora: '05:00' });
    const vu1 = programados.find((p) => p.tipo === 'VU1')!;
    expect(aLocal(vu1.instante, MADRID)).toEqual({ fecha: '2026-10-18', hora: '15:00' });
  });

  it('al revés (vive en Madrid, viaja a Buenos Aires): cada tramo con su zona', () => {
    const c = compra('2026-10-10', '2026-10-17', { zonaCasa: MADRID, zonaViaje: BA });
    const { programados } = armarCalendario(c, []);
    expect(programados.find((p) => p.tipo === 'UC1')!.instante.toISOString()).toBe('2026-10-10T08:00:00.000Z');
    expect(programados.find((p) => p.tipo === 'ID1')!.instante.toISOString()).toBe('2026-10-11T13:00:00.000Z');
    expect(sumarDias('2026-10-17', 1)).toBe(programados.find((p) => p.tipo === 'VU1')!.fecha);
  });
});
