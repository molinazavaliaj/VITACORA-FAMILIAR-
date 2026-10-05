import { describe, it, expect } from 'vitest';
import { alReloj, bloqueante, proximoDespertar } from '../src/kids-v2/motor/reloj.js';
import { procesarRafaga, sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import { alBoton } from '../src/kids-v2/motor/botones.js';
import { extrasDelFinal } from '../src/kids-v2/motor/flujo.js';
import { aInstante } from '../src/kids-v2/horas.js';
import type { Fase, Mensaje } from '../src/kids-v2/motor/tipos.js';
import { ctx, en, estadoEn, ids, iso } from './kids-v2-ayuda.js';

const preg = (clave: string): Fase => ({ tipo: 'pregunta', clave, rama: null, pasoRama: 0 });

describe('kids v2: 90 s de silencio (#19)', () => {
  it('la ráfaga se contesta recién cuando pasan 90 s sin nada nuevo', () => {
    const c = ctx(estadoEn('K5', preg('K5'), {}, { diaHecho: '2026-10-10' }), '2026-10-10', '18:05');
    sumarARafaga(c, { tipo: 'audio', seg: 60 });
    const a89 = { ...c, ahora: new Date(c.ahora.getTime() + 89_000) };
    alReloj(a89);
    expect(ids(a89.salidas)).toEqual([]);
    const a90 = { ...a89, ahora: new Date(c.ahora.getTime() + 90_000) };
    alReloj(a90);
    expect(ids(a90.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });
});

describe('kids v2: espera del audio de la foto', () => {
  it('a los 10 minutos sin audio, sigue', () => {
    const c = ctx(estadoEn('K3', { tipo: 'foto-audio', clave: 'K3', desde: iso('2026-10-10', '18:05') }, {}, { diaHecho: '2026-10-10' }), '2026-10-10', '18:14');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
    c.ahora = en('2026-10-10', '18:15');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
  });
});

describe('kids v2: la hora (mínimo una principal por día)', () => {
  it('a la hora, si está libre, sale la siguiente; una sola vez por día', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { diaHecho: '2026-10-09' }), '2026-10-10', '17:59');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
    c.ahora = en('2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
    c.ahora = en('2026-10-10', '20:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
  });

  it('si mandó algo hace menos de 30 minutos, la hora espera (no se le cruza una pregunta mientras cuenta)', () => {
    const c = ctx(estadoEn('K5', { tipo: 'seguir' }, {}, { diaHecho: '2026-10-09', ultimaEntrada: iso('2026-10-10', '17:50') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.horaHecha).toBeNull();
    expect(proximoDespertar(c.e, c.ahora)).toEqual(en('2026-10-10', '18:20'));
    c.ahora = en('2026-10-10', '18:20');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
  });

  it('si ese día ya tuvo su principal o dijo "mañana", la hora no manda nada', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { diaHecho: '2026-10-10' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
  });

  it('lo que esperaba un botón vence a la hora: seguir → la siguiente; "una más" → el cierre', () => {
    const c = ctx(estadoEn('K5', { tipo: 'seguir' }, {}, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K6']);
    const d = ctx(estadoEn('UNA-MAS-1', { tipo: 'una-mas' }, {}, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(d);
    expect(ids(d.salidas)).toEqual(['CIERRE-1']);
  });

  it('no se acumulan: con una principal sin contestar, la hora no manda otra', () => {
    expect(bloqueante(estadoEn('K5', preg('K5')))).toBe(true);
    expect(bloqueante(estadoEn('K5', { tipo: 'seguir' }))).toBe(false);
    const c = ctx(estadoEn('K5', preg('K5'), {}, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
  });

  it('a la hora con la ventana cerrada: PREG-NUEVA-CHICO', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { diaHecho: '2026-10-08', ultimaEntrada: iso('2026-10-08', '18:30') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['PREG-NUEVA-CHICO']);
  });

  it('de noche no corre nada', () => {
    const c = ctx(estadoEn('K5', { tipo: 'libre', siguiente: 5 }, { hora: '21:30' }, { diaHecho: '2026-10-09' }), '2026-10-10', '22:10');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
  });
});

describe('kids v2: la foto que vence vuelve al final (cambio A, 05/10)', () => {
  it('foto de K1 vencida → fotosVencidas = [K1] y luego aparece en la oferta de extras antes que X1-1', () => {
    const c = ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' }, {}, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K2']);
    expect(c.e.fotosVencidas).toEqual(['K1']);
    expect(extrasDelFinal(c.e).map((x) => x.id).slice(0, 2)).toEqual(['K1-FOTO', 'X1-1']);
  });

  it('no se duplica: si ya estaba en la lista, queda una sola vez', () => {
    const c = ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' }, {}, { diaHecho: '2026-10-09', fotosVencidas: ['K1'] }), '2026-10-10', '18:00');
    alReloj(c);
    expect(c.e.fotosVencidas).toEqual(['K1']);
  });

  it('una foto mudada (tema sacado) guarda la clave del item que la llevaba y vuelve con la foto original', () => {
    const c = ctx(estadoEn('K16', { tipo: 'foto', clave: 'K16' }, { temasSacados: ['mama'] }, { diaHecho: '2026-10-09' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(c.e.fotosVencidas).toEqual(['K16']);
    const [x] = extrasDelFinal(c.e);
    expect(x).toMatchObject({ tipo: 'foto-vencida', id: 'K16-FOTO', de: 'K16', foto: { de: 'K10' } });
  });

  it('si vence la otra puerta de una principal con foto, la foto (que no llegó a salir) también vuelve; la otra puerta se pierde', () => {
    const c = ctx(estadoEn('K1', { tipo: 'op', clave: 'K1' }, {}, { diaHecho: '2026-10-09', opsUsadas: ['K1'] }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['K2']);
    expect(c.e.fotosVencidas).toEqual(['K1']);
  });

  it('la extra con foto de "una más" que vence no es una foto pegada: no vuelve', () => {
    const c = ctx(estadoEn('UNA-MAS-1', { tipo: 'foto', clave: 'X1-1' }, {}, { diaHecho: '2026-10-09', extra: 'X1-1' }), '2026-10-10', '18:00');
    alReloj(c);
    expect(c.e.fotosVencidas).toEqual([]);
  });
});

describe('kids v2: recordatorios al padre (4 y 8 días)', () => {
  it('canal A: RECORD-A-4 a los 4 días, RECORD-A-8 y marca a los 8; después nada', () => {
    const e = estadoEn('K5', preg('K5'), {}, { ultimaEntrada: iso('2026-10-06', '18:10') });
    const d3 = ctx(e, '2026-10-09', '18:00');
    alReloj(d3);
    expect(ids(d3.salidas)).toEqual([]);
    const d4 = ctx(d3.e, '2026-10-10', '18:00');
    alReloj(d4);
    expect(ids(d4.salidas)).toEqual(['RECORD-A-4']);
    expect(d4.salidas[0]).toMatchObject({ a: 'padre', plantilla: { nombre: 'kids_recordatorio_padre', variables: ['Laura', 'Bruno'] } });
    const d8 = ctx(d4.e, '2026-10-14', '18:00');
    alReloj(d8);
    expect(ids(d8.salidas)).toEqual(['RECORD-A-8', 'marca:silencio-8-dias']);
    const d12 = ctx(d8.e, '2026-10-18', '18:00');
    alReloj(d12);
    expect(ids(d12.salidas)).toEqual([]);
  });

  it('canal B: RECORD-B con [Estamos listos], que después vuelve a mandar la pendiente', () => {
    const c = ctx(estadoEn('K5', preg('K5'), { canal: 'B' }, { ultimaEntrada: iso('2026-10-06', '18:10') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['RECORD-B']);
    expect(c.salidas[0]).toMatchObject({ botones: ['Estamos listos'] });
    expect(c.e.reenviar).toBe(true);
  });

  it('canal B a los 8 días: RECORD-B-8 y la marca a Naza', () => {
    const d4 = ctx(estadoEn('K5', preg('K5'), { canal: 'B' }, { ultimaEntrada: iso('2026-10-06', '18:10') }), '2026-10-10', '18:00');
    alReloj(d4);
    const d8 = ctx(d4.e, '2026-10-14', '18:00');
    alReloj(d8);
    expect(ids(d8.salidas)).toEqual(['RECORD-B-8', 'marca:silencio-8-dias']);
    expect(d8.salidas[0]).toMatchObject({ a: 'padre' });
    expect(d8.e.reenviar).toBe(true);
  });

  it('si nunca tocó [Dale, vamos], cuenta desde el arranque', () => {
    const c = ctx(estadoEn('K1', { tipo: 'bienvenida' }, {}, { cursor: -1, ultimaEntrada: null, inicio: iso('2026-10-06', '17:30') }), '2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['RECORD-A-4']);
  });
});

describe('kids v2: el final por reloj', () => {
  it('sin respuesta a la oferta de extras, a los 2 días cierra solo (ventana cerrada: FINAL-CHICO como plantilla kids_final, sin PREG-NUEVA)', () => {
    const e = estadoEn('EXTRAS', { tipo: 'extras-oferta' }, {}, { extrasDesde: iso('2026-10-08', '18:30'), ultimaEntrada: iso('2026-10-08', '18:29') });
    const d1 = ctx(e, '2026-10-09', '18:00');
    alReloj(d1);
    expect(ids(d1.salidas)).toEqual([]);
    const d2 = ctx(d1.e, '2026-10-10', '18:00');
    alReloj(d2);
    expect(ids(d2.salidas)).toEqual(['FINAL-CHICO', 'TERMINO-PADRE']);
    expect(d2.salidas[0]).toMatchObject({ plantilla: { nombre: 'kids_final', variables: ['Bruno', 'tu mamá'] } });
    expect(d2.e.fase).toEqual({ tipo: 'terminado' });
  });

  const retenidoEnExtras = (canal: 'A' | 'B' = 'A') => {
    const oferta: Mensaje = { a: canal === 'A' ? 'chico' : 'padre', id: 'EXTRAS-OFERTA', texto: 'x', botones: ['Dale, otra'], plantilla: null };
    return estadoEn('EXTRAS', { tipo: 'retenido', mensajes: [oferta], luego: { tipo: 'extras-oferta' } }, { canal }, {
      extrasDesde: iso('2026-10-08', '18:00'),
      ultimaEntrada: iso('2026-10-06', '18:29'),
    });
  };

  it('con un PREG-NUEVA sin tocar en la etapa de extras: al día siguiente no pasa nada', () => {
    const c = ctx(retenidoEnExtras(), '2026-10-09', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'extras-oferta' } });
  });

  it('con un PREG-NUEVA sin tocar, a los 2 días cierra igual: TERMINO-PADRE y marca a Naza, nada al chico (nunca dos plantillas seguidas); el final queda retenido', () => {
    const d2 = ctx(retenidoEnExtras(), '2026-10-10', '18:00');
    alReloj(d2);
    expect(ids(d2.salidas)).toEqual(['TERMINO-PADRE', 'marca:cerro-sin-respuesta']);
    expect(d2.salidas[0]).toMatchObject({ a: 'padre' });
    expect(d2.e.guion[d2.e.cursor].tipo).toBe('final');
    expect(d2.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'terminado' }, mensajes: [{ id: 'FINAL-CHICO', plantilla: null }] });

    // Un día después (y los que siguen) no sale nada más.
    const d3 = ctx(d2.e, '2026-10-11', '18:00');
    alReloj(d3);
    expect(ids(d3.salidas)).toEqual([]);
    const d9 = ctx(d3.e, '2026-10-17', '18:00');
    alReloj(d9);
    expect(ids(d9.salidas)).toEqual([]);

    // Toca [Dale, mandámela]: le llega el final (la ventana la abre él) y termina; no vuelven las extras.
    const t = ctx(structuredClone(d9.e), '2026-10-18', '10:00');
    alBoton(t, 'Dale, mandámela');
    expect(ids(t.salidas)).toEqual(['FINAL-CHICO']);
    expect(t.salidas[0]).toMatchObject({ plantilla: null });
    expect(t.e.fase).toEqual({ tipo: 'terminado' });

    // O escribe algo corto: lo mismo.
    const w = ctx(structuredClone(d9.e), '2026-10-18', '10:00');
    sumarARafaga(w, { tipo: 'texto', texto: 'hola' });
    procesarRafaga(w);
    expect(ids(w.salidas)).toEqual(['FINAL-CHICO']);
    expect(w.e.fase).toEqual({ tipo: 'terminado' });
    const despues = ctx(w.e, '2026-10-19', '18:00');
    alReloj(despues);
    expect(ids(despues.salidas)).toEqual([]);
  });

  it('canal B: el mismo cierre deja TERMINO-PADRE para el día siguiente, a la hora', () => {
    const d2 = ctx(retenidoEnExtras('B'), '2026-10-10', '18:00');
    alReloj(d2);
    expect(ids(d2.salidas)).toEqual(['marca:cerro-sin-respuesta']);
    const d3 = ctx(d2.e, '2026-10-11', '18:00');
    alReloj(d3);
    expect(ids(d3.salidas)).toEqual(['TERMINO-PADRE']);
    const d4 = ctx(d3.e, '2026-10-12', '18:00');
    alReloj(d4);
    expect(ids(d4.salidas)).toEqual([]);
  });

  it('de noche no cierra: espera a la hora', () => {
    const c = ctx(retenidoEnExtras(), '2026-10-10', '22:30');
    alReloj(c);
    expect(ids(c.salidas)).toEqual([]);
  });

  it('canal B: TERMINO-PADRE sale al día siguiente, a la hora', () => {
    const c = ctx(estadoEn('FINAL', { tipo: 'terminado' }, { canal: 'B' }, { terminoPadre: '2026-10-11' }), '2026-10-11', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['TERMINO-PADRE']);
    expect(c.e.terminoPadre).toBeNull();
  });
});

describe('kids v2: proximoDespertar', () => {
  it('la ráfaga a los 90 s; si no, la hora de hoy o de mañana; nunca de noche', () => {
    const e = estadoEn('K5', preg('K5'), {}, { rafaga: { desde: iso('2026-10-10', '18:05'), ultima: iso('2026-10-10', '18:05'), seg: 60, palabras: 0, fotos: 0, textos: [] } });
    expect(proximoDespertar(e, en('2026-10-10', '18:05'))).toEqual(new Date(en('2026-10-10', '18:05').getTime() + 90_000));
    const libre = estadoEn('K5', { tipo: 'libre', siguiente: 5 }, {}, { horaHecha: '2026-10-10' });
    expect(proximoDespertar(libre, en('2026-10-10', '19:00'))).toEqual(en('2026-10-11', '18:00'));
    const tarde = estadoEn('K5', preg('K5'), {}, { rafaga: { desde: iso('2026-10-10', '21:59'), ultima: iso('2026-10-10', '21:59'), seg: 60, palabras: 0, fotos: 0, textos: [] } });
    expect(proximoDespertar(tarde, en('2026-10-10', '21:59'))).toEqual(en('2026-10-11', '09:00'));
    expect(proximoDespertar(estadoEn('FINAL', { tipo: 'terminado' }), en('2026-10-10', '19:00'))).toBeNull();
  });
});

describe('kids v2: los días se cuentan en el calendario local (cambio de horario de Madrid, 25/10/2026)', () => {
  const MADRID = 'Europe/Madrid';
  const m = (fecha: string, hora: string) => aInstante(fecha, hora, MADRID);

  it('la hora de mañana sigue siendo las 18:00 aunque esa noche se atrase el reloj', () => {
    const e = estadoEn('K5', { tipo: 'libre', siguiente: 5 }, { zona: MADRID }, { horaHecha: '2026-10-24', diaHecho: '2026-10-24', ultimaEntrada: m('2026-10-24', '17:00').toISOString() });
    const despertar = proximoDespertar(e, m('2026-10-24', '19:00'));
    expect(despertar).toEqual(m('2026-10-25', '18:00'));
    expect(despertar!.getTime() - m('2026-10-24', '18:00').getTime()).toBe(25 * 3_600_000);
    const antes = { e, ahora: m('2026-10-25', '17:59'), salidas: [], replay: false };
    alReloj(antes);
    expect(ids(antes.salidas)).toEqual([]);
    const justo = { ...antes, ahora: m('2026-10-25', '18:00') };
    alReloj(justo);
    expect(ids(justo.salidas)).toEqual(['PREG-NUEVA-CHICO']);
  });

  it('el recordatorio de los 4 días y el cierre solo de los 2 días cruzan el cambio sin correrse', () => {
    const r = estadoEn('K5', preg('K5'), { zona: MADRID }, { ultimaEntrada: m('2026-10-22', '18:10').toISOString() });
    const d4 = { e: r, ahora: m('2026-10-26', '18:00'), salidas: [], replay: false };
    alReloj(d4);
    expect(ids(d4.salidas)).toEqual(['RECORD-A-4']);

    // Las extras empezaron el 24 a las 21:30: a las 18:00 del 26 pasaron menos de 48 h, pero son 2 días de calendario.
    const x = estadoEn('EXTRAS', { tipo: 'extras-oferta' }, { zona: MADRID }, { extrasDesde: m('2026-10-24', '21:30').toISOString(), ultimaEntrada: m('2026-10-24', '21:29').toISOString() });
    const d2 = { e: x, ahora: m('2026-10-26', '18:00'), salidas: [], replay: false };
    alReloj(d2);
    expect(ids(d2.salidas)).toEqual(['FINAL-CHICO', 'TERMINO-PADRE']);
  });
});
