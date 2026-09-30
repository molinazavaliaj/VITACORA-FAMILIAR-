// Los hallazgos de la revisión del código (segundo agente, sobre 057e427).
import { describe, it, expect } from 'vitest';
import { armarCalendario, quedaNocheEseDia, ORDEN_PUERTAS } from '../src/viaje-v2/calendario.js';
import { alDecirSi, reaccion, ROTACION_INICIAL, type Rotacion } from '../src/viaje-v2/mensajes.js';
import { iniciarAlbum, pasoAlbum } from '../src/viaje-v2/album.js';
import { anotarEnvio, anotarRespuesta, nochesSinContestar, contestadasAntes, nuevoEstado } from '../src/viaje-v2/estado.js';
import { aInstante, aLocal } from '../src/viaje-v2/horas.js';
import type { Compra } from '../src/viaje-v2/tipos.js';

const BA = 'America/Argentina/Buenos_Aires';
const MADRID = 'Europe/Madrid';
const COMPRA: Compra = {
  nombre: 'Lucía',
  salida: '2026-10-10',
  vuelta: '2026-10-17',
  zonaCasa: BA,
  zonaViaje: MADRID,
  preguntasPropias: [],
  formato: 'impreso',
  fotosAlbum: 20,
};

describe('1. la cadena que se calló por la fecha no es "no hay más preguntas"', () => {
  it('"paso" con la cadena callada (ya es el día de salida): ACM1 o ACM2 solo, nunca PAS-A2', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'callada' }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes).toHaveLength(1);
    expect(r.mensajes[0].ids).toHaveLength(1);
    expect(['ACM1', 'ACM2']).toContain(r.mensajes[0].ids[0]);
  });

  it('audio con la cadena callada: ACM1 o ACM2 solo, sin pregunta atrás', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'callada' }, { tipo: 'audio' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes[0].ids.length).toBe(1);
    expect(['ACM1', 'ACM2']).toContain(r.mensajes[0].ids[0]);
  });

  it('texto con la cadena callada: TXT solo (si queda tope)', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'callada' }, { tipo: 'texto' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes[0].ids).toEqual(['TXT']);
  });

  it('"paso" en VA1 con la cadena abierta (de verdad no hay más): PAS-A2', () => {
    const r = reaccion({ tipo: 'cadena', siguiente: 'fin' }, { tipo: 'paso' }, COMPRA, ROTACION_INICIAL);
    expect(r.mensajes[0].ids).toEqual(['PAS-A2']);
  });
});

describe('2. "Hasta la noche" (ACM3, ACM4) solo si de verdad queda una noche ese día', () => {
  const cal = armarCalendario(COMPRA, []).programados;

  it('quedaNocheEseDia: a la tarde de un día del viaje sí; el día de salida y el de vuelta no; después de la noche, no', () => {
    expect(quedaNocheEseDia(cal, aInstante('2026-10-12', '18:30', MADRID))).toBe(true);
    expect(quedaNocheEseDia(cal, aInstante('2026-10-12', '22:40', MADRID))).toBe(false);
    expect(quedaNocheEseDia(cal, aInstante('2026-10-10', '10:40', BA))).toBe(false);
    expect(quedaNocheEseDia(cal, aInstante('2026-10-17', '13:30', MADRID))).toBe(false);
    expect(quedaNocheEseDia(cal, aInstante('2026-10-18', '11:00', BA))).toBe(true); // CA1 esa noche
  });

  it('UC1, ID1 y VU1 sin noche por delante: solo ACM1 o ACM2, aunque la rueda diga ACM3 (MD, VU0 y fotos sueltas van con ❤️)', () => {
    const rot: Rotacion = { ...ROTACION_INICIAL, ACM: 'ACM2' };
    for (const tipo of ['UC1', 'ID1', 'VU1'] as const) {
      const r = reaccion({ tipo, quedaNoche: false }, { tipo: 'audio' }, COMPRA, rot);
      expect(r.mensajes[0].ids, tipo).toEqual(['ACM1']);
    }
  });

  it('con noche por delante, la rueda sigue entera (ACM3 después de ACM2)', () => {
    const rot: Rotacion = { ...ROTACION_INICIAL, ACM: 'ACM2' };
    for (const tipo of ['ID1', 'VU1'] as const) {
      expect(reaccion({ tipo, quedaNoche: true }, { tipo: 'audio' }, COMPRA, rot).mensajes[0].ids, tipo).toEqual(['ACM3']);
    }
  });

  it('sin decir nada de la noche, se asume que no queda (lo seguro)', () => {
    const rot: Rotacion = { ...ROTACION_INICIAL, ACM: 'ACM2' };
    expect(reaccion({ tipo: 'ID1' }, { tipo: 'audio' }, COMPRA, rot).mensajes[0].ids).toEqual(['ACM1']);
  });
});

describe('3. comienzo, puerta y cierre rotan por separado', () => {
  const comunes = (vuelta: string) => armarCalendario({ ...COMPRA, salida: '2026-10-01', vuelta }, []).programados.filter((p) => p.tipo === 'noche');

  it('en un viaje largo, la noche 10 no repite la combinación de la noche 1 (ni comienzo+puerta)', () => {
    const ns = comunes('2026-10-30'); // 27 noches comunes
    expect(ns[9].ids[1]).toBe(ns[0].ids[1]); // la puerta da la vuelta
    expect(ns[9].ids[0]).not.toBe(ns[0].ids[0]); // pero el comienzo no
    const pares = new Set(ns.map((p) => `${p.ids[0]}+${p.ids[1]}`));
    expect(pares.size).toBe(27); // las 27 de comienzo+puerta, sin repetir
  });

  it('en 81 noches salen las 81 combinaciones, sin repetir', () => {
    const ns = armarCalendario({ ...COMPRA, salida: '2026-01-01', vuelta: '2026-03-25' }, []).programados.filter((p) => p.tipo === 'noche');
    expect(ns).toHaveLength(81);
    expect(new Set(ns.map((p) => p.ids.join('+'))).size).toBe(81);
  });

  it('nunca el mismo comienzo, ni el mismo cierre, dos noches seguidas', () => {
    const ns = armarCalendario({ ...COMPRA, salida: '2026-01-01', vuelta: '2026-03-25' }, []).programados.filter((p) => p.tipo === 'noche');
    for (let i = 1; i < ns.length; i++) {
      expect(ns[i].ids[0], `noche ${i}`).not.toBe(ns[i - 1].ids[0]);
      expect(ns[i].ids[2], `noche ${i}`).not.toBe(ns[i - 1].ids[2]);
    }
    expect(ns.slice(0, 9).map((p) => p.ids[1])).toEqual(ORDEN_PUERTAS);
  });
});

describe('4. el segundo plazo del álbum se cuenta desde que salió AL2 de verdad', () => {
  it('si el reloj llega tarde, AL2 sale a esa hora y las 5 horas corren desde ahí', () => {
    const h = (x: string) => aInstante('2026-10-18', x, BA);
    let e = iniciarAlbum(h('10:00'), COMPRA);
    e = pasoAlbum(e, { tipo: 'foto', en: h('10:30'), cantidad: 5 }, COMPRA).estado; // vence 15:30
    const r = pasoAlbum(e, { tipo: 'reloj', en: h('16:10') }, COMPRA);
    expect(r.salidas.map((s) => s.tipo)).toEqual(['mensaje']);
    expect(aLocal(new Date(r.estado.vence!), BA).hora).toBe('21:10');
  });
});

describe('5. un audio que llegó mal es un intento: no es noche sin contestar', () => {
  it('no dispara ATR', () => {
    let e = anotarEnvio(nuevoEstado(), { clave: 'D2-noche', tipo: 'noche', ids: ['C1', 'NO1', 'F1'], en: 'x' });
    e = anotarRespuesta(e, 'D2-noche', { tipo: 'audio', audioMal: true, en: 'x' });
    expect(nochesSinContestar(e)).toBe(0);
  });

  it('pero en la cadena de antes de salir, un audio malo sola no la saca de pendientes', () => {
    let e = anotarEnvio(nuevoEstado(), { clave: 'AS1', tipo: 'cadena', ids: ['AS1'], en: 'x' });
    e = anotarRespuesta(e, 'AS1', { tipo: 'audio', audioMal: true, en: 'x' });
    expect(contestadasAntes(e).has('AS1')).toBe(false);
  });
});

describe('6. compra el mismo día que sale: ese día van BIEN-2, AS1 y UC1', () => {
  it('AS1 sale siempre con BIEN-2 (el texto promete "Ahí va la primera"), y el calendario igual trae UC1', () => {
    const c: Compra = { ...COMPRA };
    expect(alDecirSi(c).map((m) => m.ids[0])).toEqual(['BIEN-2', 'AS1']);
    const dia0 = armarCalendario(c, ['AS1', 'AS2', 'IM1', 'VA1']).programados.filter((p) => p.dia === 0);
    expect(dia0.map((p) => p.tipo)).toEqual(['UC1']);
  });

  it('armarCalendario no filtra lo que ya pasó: UC1 aparece aunque la compra sea después de las 10 (eso lo filtra el planificador)', () => {
    const uc1 = armarCalendario(COMPRA, []).programados[0];
    expect(uc1.tipo).toBe('UC1');
    expect(uc1.instante.getTime()).toBeLessThan(aInstante('2026-10-10', '15:00', BA).getTime());
  });
});

describe('7. avisos para Naza en el calendario', () => {
  it('sin nada afuera, sin avisos', () => {
    expect(armarCalendario(COMPRA, ['VA1']).avisosNaza).toEqual([]);
  });

  it('las de antes y las propias que no entran, en avisos cortos', () => {
    const r = armarCalendario({ ...COMPRA, vuelta: '2026-10-13', preguntasPropias: ['1', '2'] }, ['AS1', 'AS2']);
    expect(r.avisosNaza).toHaveLength(2);
    expect(r.avisosNaza[0]).toContain('AS2');
    expect(r.avisosNaza[1]).toContain('«1»');
    expect(r.avisosNaza[1]).toContain('«2»');
  });
});
