import { describe, it, expect } from 'vitest';
import { FRASES_PREOCUPANTES, fraseQueSalta, normalizar } from '../src/kids-v2/preocupante.js';
import { alBoton } from '../src/kids-v2/motor/botones.js';
import { extrasDelFinal } from '../src/kids-v2/motor/flujo.js';
import { procesarRafaga, sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import { alReloj, proximoDespertar } from '../src/kids-v2/motor/reloj.js';
import { ctx, en, estadoEn, ids, iso } from './kids-v2-ayuda.js';

const PREOCUPANTE = { tipo: 'audio' as const, seg: 70, transcripcion: 'y encima mi primo me pegó cuando nadie miraba' };

describe('kids v2: la lista de palabras', () => {
  it('compara sin mayúsculas ni tildes y por palabras enteras', () => {
    expect(normalizar('¡Me PEGÓ!')).toBe(' me pego ');
    expect(fraseQueSalta('Mi primo ME PEGÓ ayer')).toBe('me pegó');
    expect(fraseQueSalta('me pegaron en el recreo')).toBe('me pegaron');
    expect(fraseQueSalta('a veces me quiero morir')).toBe('me quiero morir');
    expect(fraseQueSalta('me pegue un golpe en la rodilla')).toBeNull(); // "me pegué" no es "me pegó"
    expect(fraseQueSalta('me toca lavar los platos')).toBeNull();
    expect(fraseQueSalta('jugamos a la mancha')).toBeNull();
  });

  it('ninguna frase de la lista está vacía ni repetida', () => {
    const norm = FRASES_PREOCUPANTES.map(normalizar);
    expect(norm.every((f) => f.trim().length > 0)).toBe(true);
    expect(new Set(norm).size).toBe(norm.length);
  });
});

describe('kids v2: algo preocupante en el momento', () => {
  it('ese día solo un acuse sobrio, sin foto ni seguir, y marca a Naza', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.salidas[1]).toMatchObject({ detalle: '"me pegó" en K1' });
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor + 1 });
    expect(c.e.diaHecho).toBe('2026-10-10');
  });

  it('el resto del día: lo que cuente recibe solo el acuse sobrio; los botones no hacen nada', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    sumarARafaga(c, { tipo: 'audio', seg: 40 });
    procesarRafaga(c);
    alBoton(c, 'Dale, otra');
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante', 'B-DIAFEO-ACUSE-2']);
  });

  it('al otro día, a la hora, sigue con la siguiente', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }, {}, { ultimaEntrada: iso('2026-10-10', '18:05') }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    c.ahora = en('2026-10-11', '18:00');
    alReloj(c);
    expect(ids(c.salidas).slice(2)).toEqual(['K2']);
    expect(c.e.sobrioHasta).toBeNull();
  });

  it('en un texto escrito también salta; nada automático hacia el padre', () => {
    const c = ctx(estadoEn('K36', { tipo: 'pregunta', clave: 'K36', rama: null, pasoRama: 0 }));
    sumarARafaga(c, { tipo: 'texto', texto: 'en casa me pegan' });
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.salidas.some((s) => s.tipo === 'mensaje' && s.a === 'padre')).toBe(false);
  });
});

describe('kids v2: la foto perdida por algo preocupante vuelve al final (cambio A, 05/10)', () => {
  it('en una pregunta con foto pegada: la foto no sale ese día y su clave queda en fotosVencidas', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    expect(ids(c.salidas)).not.toContain('K1-FOTO');
    expect(c.e.fotosVencidas).toEqual(['K1']);
    expect(extrasDelFinal(c.e).map((x) => x.id).slice(0, 2)).toEqual(['K1-FOTO', 'X1-1']);
  });

  it('con la foto ya mandada y esperando (sin foto en la ráfaga): se guarda, sin duplicar', () => {
    const c = ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' }, {}, { fotosVencidas: ['K1'] }));
    sumarARafaga(c, { tipo: 'texto', texto: 'no quiero volver a mi casa' });
    procesarRafaga(c);
    expect(c.e.fotosVencidas).toEqual(['K1']);
    const d = ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' }));
    sumarARafaga(d, { tipo: 'texto', texto: 'no quiero volver a mi casa' });
    procesarRafaga(d);
    expect(d.e.fotosVencidas).toEqual(['K1']);
  });

  it('si en la ráfaga vino la foto, la foto llegó: no vuelve', () => {
    const c = ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' }));
    sumarARafaga(c, { tipo: 'foto' });
    sumarARafaga(c, { tipo: 'texto', texto: 'mi tío me pegaba' });
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.e.fotosVencidas).toEqual([]);
  });
});

describe('kids v2: el día sobrio gana a los otros acuses', () => {
  it('una foto sola en el día sobrio lleva el acuse sobrio, no el de foto', () => {
    const c = ctx(estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    sumarARafaga(c, { tipo: 'foto' });
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante', 'B-DIAFEO-ACUSE-2']);
  });

  it('con un PREG-NUEVA sin tocar: el acuse sobrio y no se suelta lo retenido', () => {
    const retenido = { tipo: 'retenido' as const, mensajes: [], luego: { tipo: 'pregunta' as const, clave: 'K2', rama: null, pasoRama: 0 } };
    const c = ctx(estadoEn('K2', retenido, {}, { sobrioHasta: iso('2026-10-11', '18:00') }));
    sumarARafaga(c, { tipo: 'audio', seg: 40 });
    procesarRafaga(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1']);
    expect(c.e.fase.tipo).toBe('retenido');
  });

  it('en las extras del final no se toca lo que se esperaba: al otro día el botón anda', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' }));
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    alBoton(c, 'Dale, otra');
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.e.fase).toEqual({ tipo: 'extras-oferta' });
    c.ahora = en('2026-10-11', '18:30');
    alReloj(c);
    alBoton(c, 'Dale, otra');
    expect(ids(c.salidas).slice(2, 4)).toEqual(['EXTRAS-SI', 'X1-1']);
  });
});

describe('kids v2: en el día sobrio ningún reloj hace avanzar el flujo (arreglo de la revisión)', () => {
  it('esperando el audio de una foto en las extras: no vence ese día; al otro día, a la hora, sigue donde estaba', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' }, {}, { ultimaEntrada: iso('2026-10-10', '18:05') }));
    alBoton(c, 'Dale, otra');
    expect(ids(c.salidas)).toEqual(['EXTRAS-SI', 'X1-1']);
    c.e.fase = { tipo: 'foto-audio', clave: 'X1-1', desde: c.ahora.toISOString() };
    sumarARafaga(c, { tipo: 'audio', seg: 30, transcripcion: 'nadie me quiere' });
    procesarRafaga(c);
    c.ahora = en('2026-10-10', '18:30');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['EXTRAS-SI', 'X1-1', 'B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.e.fase.tipo).toBe('foto-audio');
    // No despierta sin parar por la espera vencida: la hora de hoy (que esperó por estar activo) y después mañana a la hora.
    expect(proximoDespertar(c.e, c.ahora)).toEqual(en('2026-10-10', '18:35'));
    c.ahora = en('2026-10-10', '18:35');
    alReloj(c);
    expect(ids(c.salidas)).toHaveLength(4);
    expect(proximoDespertar(c.e, c.ahora)).toEqual(en('2026-10-11', '18:00'));
    c.ahora = en('2026-10-11', '09:30');
    alReloj(c);
    expect(ids(c.salidas)).toHaveLength(4);
    c.ahora = en('2026-10-11', '18:00');
    alReloj(c);
    expect(ids(c.salidas).slice(4)).toEqual(['EXTRAS-OTRA']);
    expect(c.e.sobrioHasta).toBeNull();
  });

  it('a la hora del mismo día sobrio no sale nada (ni cierre de extras ni recordatorio ni pregunta)', () => {
    const c = ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' }, {}, { extrasDesde: iso('2026-10-07', '18:00'), ultimaEntrada: iso('2026-10-07', '18:00') }), '2026-10-10', '10:00');
    sumarARafaga(c, PREOCUPANTE);
    procesarRafaga(c);
    c.ahora = en('2026-10-10', '18:00');
    alReloj(c);
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'marca:preocupante']);
    expect(c.e.fase).toEqual({ tipo: 'extras-oferta' });
  });
});
