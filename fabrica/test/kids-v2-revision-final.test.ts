// Los arreglos de la revisión final de la rama (05/10): botones viejos con el
// ID del mensaje, un "no" escrito en una foto, la ventana de 24 h, la espera
// del audio con una ráfaga pendiente, los botones del banco compartidos y el
// día sobrio con la hora cambiada. Chicos INVENTADOS.

import { describe, it, expect } from 'vitest';
import { fijo } from '../src/kids-v2/banco.js';
import { nuevoEstado, paso, proximoDespertar, type Estado, type Evento, type Salida } from '../src/kids-v2/motor.js';
import { FICHA, en, estadoEn, ids, iso } from './kids-v2-ayuda.js';

type Paso = [cuando: string | Date, ev: Evento];

/** Aplica eventos en orden. `cuando`: "AAAA-MM-DD HH:MM" de Buenos Aires, o un Date. */
function correr(e: Estado, pasos: Paso[]): { e: Estado; s: Salida[]; porPaso: Salida[][] } {
  const s: Salida[] = [];
  const porPaso: Salida[][] = [];
  for (const [cuando, ev] of pasos) {
    const t = typeof cuando === 'string' ? iso(cuando.slice(0, 10), cuando.slice(11)) : cuando.toISOString();
    const r = paso(e, ev, t);
    e = r.estado;
    s.push(...r.salidas);
    porPaso.push(r.salidas);
  }
  return { e, s, porPaso };
}
const RELOJ: Evento = { tipo: 'reloj' };
const toca = (boton: string, aMensaje?: string): Evento => (aMensaje === undefined ? { tipo: 'boton', boton } : { tipo: 'boton', boton, aMensaje });
const texto = (t: string): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'texto', texto: t } });
const audio = (seg: number, transcripcion?: string): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'audio', seg, ...(transcripcion ? { transcripcion } : {}) } });

/** El `envio` del último mensaje con ese ID que salió. */
function envio(s: Salida[], id: string): string {
  const m = [...s].reverse().find((x) => x.tipo === 'mensaje' && x.id === id);
  if (!m || m.tipo !== 'mensaje') throw new Error(`No salió ${id}: ${ids(s).join(', ')}`);
  return m.envio;
}

/** Un estado parado en el B-SEGUIR del item anterior a `clave` (así [Dale, otra] la manda de verdad). */
function antesDe(clave: string, cambios: Parameters<typeof estadoEn>[2] = {}, extra: Partial<Estado> = {}): Estado {
  const e = nuevoEstado({ ...FICHA, ...cambios });
  const i = e.guion.findIndex((x) => x.clave === clave);
  return estadoEn(e.guion[i - 1].clave, { tipo: 'seguir' }, cambios, extra);
}

describe('kids v2, revisión final 1: botones viejos o repetidos (decisión 22)', () => {
  it('cada mensaje que sale lleva un `envio` único y creciente', () => {
    const { s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06 17:30', { tipo: 'inicio' }],
      ['2026-10-06 17:40', toca('Dale, vamos')],
    ]);
    const envios = s.flatMap((x) => (x.tipo === 'mensaje' ? [x.envio] : []));
    expect(envios.length).toBe(4);
    expect(new Set(envios).size).toBe(4);
    expect(envios.map(Number)).toEqual([...envios.map(Number)].sort((a, b) => a - b));
  });

  it('A) en K5, el [Paso] del K4 de ayer no saltea K5', () => {
    const a = correr(antesDe('K4'), [
      ['2026-10-09 18:05', toca('Dale, otra')],
    ]);
    const k4 = envio(a.s, 'K4');
    const b1 = correr(a.e, [['2026-10-09 18:10', toca('Paso', k4)]]);
    const b2 = correr(b1.e, [
      ['2026-10-09 18:12', toca('No tengo', envio(b1.s, 'K4-FOTO'))],
      ['2026-10-09 18:30', RELOJ],
    ]);
    const b = { e: b2.e, s: [...b1.s, ...b2.s] };
    expect(ids(b.s)).toEqual(['B-PASO', 'K4-FOTO', 'B-FOTO-NOTENGO', 'B-SEGUIR']);
    const c = correr(b.e, [['2026-10-09 18:31', toca('Dale, otra', envio(b.s, 'B-SEGUIR'))]]);
    expect(ids(c.s)).toEqual(['K5']);
    // Al día siguiente toca el [Paso] del K4 (el mensaje de ayer): no hace nada.
    const d = correr(c.e, [['2026-10-10 12:00', toca('Paso', k4)]]);
    expect(ids(d.s)).toEqual([]);
    expect(d.e.fase).toEqual({ tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 });
    // El [Paso] del K5 sí.
    expect(ids(correr(d.e, [['2026-10-10 12:01', toca('Paso', envio(c.s, 'K5'))]]).s)).toEqual(['B-PASO', 'B-SEGUIR']);
  });

  it('A sin ID (compatible con lo de antes): el botón actúa sobre lo que se espera', () => {
    const e = estadoEn('K5', { tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 });
    expect(ids(paso(e, toca('Paso'), iso('2026-10-10', '12:00')).salidas)).toEqual(['B-PASO', 'B-SEGUIR']);
  });

  it('B) sin "mama": el doble toque del [No tengo] de K16 no contesta la foto que se mudó (sale como K10-FOTO)', () => {
    const a = correr(antesDe('K16', { temasSacados: ['mama'] }), [['2026-10-10 18:05', toca('Dale, otra')]]);
    const k16 = envio(a.s, 'K16');
    const b = correr(a.e, [
      ['2026-10-10 18:06', toca('No tengo', k16)],
      ['2026-10-10 18:06', toca('No tengo', k16)],
    ]);
    expect(ids(b.porPaso[0])).toEqual(['B-NO-PASA-NADA', 'K10-FOTO']);
    expect(ids(b.porPaso[1])).toEqual([]);
    expect(b.e.fase).toEqual({ tipo: 'foto', clave: 'K16' });
    // El [No tengo] de la foto, sí.
    expect(ids(correr(b.e, [['2026-10-10 18:07', toca('No tengo', envio(b.s, 'K10-FOTO'))]]).s)).toEqual(['B-FOTO-NOTENGO']);
  });

  it('canal B: un [Estamos listos] viejo (el de la bienvenida) con la fase libre no manda la pregunta', () => {
    const a = correr(nuevoEstado({ ...FICHA, canal: 'B' }), [['2026-10-06 17:30', { tipo: 'inicio' }]]);
    const bien = envio(a.s, 'BIEN-PADRE');
    const b = correr(a.e, [['2026-10-06 17:40', toca('Estamos listos', bien)]]);
    const c = correr(b.e, [
      ['2026-10-06 17:41', toca('Paso', envio(b.s, 'K1'))],
    ]);
    const d = correr(c.e, [['2026-10-06 17:42', toca('No tengo', envio(c.s, 'K1-FOTO'))], ['2026-10-06 17:55', RELOJ]]);
    const f = correr(d.e, [['2026-10-06 17:56', toca('Mañana sigo', envio(d.s, 'B-SEGUIR'))]]);
    expect(f.e.fase).toEqual({ tipo: 'libre', siguiente: 1 });
    const g = correr(f.e, [['2026-10-06 19:00', toca('Estamos listos', bien)]]);
    expect(ids(g.s)).toEqual([]);
    expect(g.e.fase).toEqual({ tipo: 'libre', siguiente: 1 });
  });

  it('canal B: el [Paso] de la pregunta sigue andando después de un RECORD-B (se suma, no la pisa)', () => {
    const a = correr(antesDe('K5', { canal: 'B' }), [['2026-10-09 18:05', toca('Dale, otra')]]);
    const k5 = envio(a.s, 'K5');
    const b = correr(a.e, [['2026-10-13 18:00', RELOJ]]);
    expect(ids(b.s)).toEqual(['RECORD-B']);
    expect(ids(correr(b.e, [['2026-10-13 18:30', toca('Paso', k5)]]).s)).toEqual(['B-PASO', 'B-SEGUIR']);
    // Y el [Estamos listos] del RECORD-B vuelve a mandar K5.
    expect(ids(correr(b.e, [['2026-10-13 18:30', toca('Estamos listos', envio(b.s, 'RECORD-B'))]]).s)).toEqual(['K5']);
  });

  it('el día sobrio no gasta el botón: al otro día el mismo [Dale, otra] de la oferta anda', () => {
    const oferta = correr(antesDe('EXTRAS'), [['2026-10-10 09:30', toca('Dale, otra')]]);
    expect(ids(oferta.s)).toContain('EXTRAS-OFERTA');
    const id = envio(oferta.s, 'EXTRAS-OFERTA');
    const b = correr(oferta.e, [
      ['2026-10-10 10:00', audio(40, 'mi primo me pega a veces')],
      ['2026-10-10 10:02', RELOJ],
      ['2026-10-10 10:05', toca('Dale, otra', id)],
    ]);
    expect(ids(b.porPaso[1])).toEqual([expect.stringMatching(/^B-DIAFEO-ACUSE-/), 'marca:preocupante']);
    expect(ids(b.porPaso[2])).toEqual([]);
    const c = correr(b.e, [['2026-10-11 18:30', toca('Dale, otra', id)]]);
    expect(ids(c.s)).toEqual(['EXTRAS-SI', expect.stringMatching(/^(K\d+-FOTO|X\d-\d+)$/)]);
  });
});

describe('kids v2, revisión final 2: un "no" escrito en una foto o en la otra puerta', () => {
  const rot = { rotacion: { acuse: 'ACUSE-2', foto: null, diaFeo: null } };

  it('K1 foto: escribe "no tengo" → como [No tengo], sin acuse', () => {
    const { s, e } = correr(estadoEn('K1', { tipo: 'foto', clave: 'K1' }, {}, rot), [
      ['2026-10-10 18:05', texto('no tengo')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual(['B-FOTO-NOTENGO']);
    expect(e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K1' });
  });

  it('K29 foto: el "no" escrito lleva su propio [No tengo] (B-FOTO-PLATA)', () => {
    const { s } = correr(estadoEn('K29', { tipo: 'foto', clave: 'K29' }, {}, rot), [
      ['2026-10-10 18:05', texto('no')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual(['B-FOTO-PLATA']);
  });

  it('la foto de una extra (X1-7) y una foto vencida al final (K1-FOTO): igual', () => {
    const x = correr(estadoEn('UNA-MAS-1', { tipo: 'foto', clave: 'X1-7' }, {}, { ...rot, extra: 'X1-7' }), [
      ['2026-10-10 18:05', texto('no tengo nada así')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(x.s)).toEqual(['B-FOTO-NOTENGO']);
    const v = correr(estadoEn('EXTRAS', { tipo: 'foto', clave: 'K1-FOTO' }, {}, { ...rot, extra: 'K1-FOTO' }), [
      ['2026-10-10 18:05', audio(4)],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(v.s)).toEqual(['B-FOTO-NOTENGO']);
  });

  it('algo largo en la foto sin foto: acuse y sigue, como antes', () => {
    const { s } = correr(estadoEn('K1', { tipo: 'foto', clave: 'K1' }, {}, rot), [
      ['2026-10-10 18:05', audio(40)],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual(['ACUSE-3', 'B-SEGUIR']);
  });

  it('la otra puerta contestada corta: sin acuse, sigue con la foto', () => {
    const { s } = correr(estadoEn('K1', { tipo: 'op', clave: 'K1' }, {}, rot), [
      ['2026-10-10 18:05', texto('no sé')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual(['K1-FOTO']);
  });

  it('la otra puerta contestada largo: acuse y la foto, como antes', () => {
    const { s } = correr(estadoEn('K1', { tipo: 'op', clave: 'K1' }, {}, rot), [
      ['2026-10-10 18:05', audio(40)],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(ids(s)).toEqual(['ACUSE-3', 'K1-FOTO']);
  });
});

describe('kids v2, revisión final 3: nada de texto libre fuera de las 24 h', () => {
  it('en las extras, la espera del audio después del día sobrio no manda EXTRAS-OTRA 33 h después', () => {
    const e0 = estadoEn('EXTRAS', { tipo: 'foto', clave: 'K1-FOTO' }, {}, { extra: 'K1-FOTO', fotosVencidas: ['K2'], extrasDesde: iso('2026-10-09', '18:00'), ultimaEntrada: iso('2026-10-09', '18:00') });
    const a = correr(e0, [
      ['2026-10-10 10:00', toca('No tengo')],
      ['2026-10-10 10:05', audio(40, 'mi primo me pega a veces')],
      ['2026-10-10 10:07', RELOJ],
    ]);
    expect(ids(a.s)).toEqual(['B-FOTO-NOTENGO', expect.stringMatching(/^B-DIAFEO-ACUSE-/), 'marca:preocupante']);
    const b = correr(a.e, [['2026-10-11 18:00', RELOJ]]);
    expect(b.s.filter((x) => x.tipo === 'mensaje' && x.plantilla === null)).toEqual([]);
    // Y el reloj no queda pidiendo despertar en el pasado.
    const t = proximoDespertar(b.e, en('2026-10-11', '18:00'));
    expect(t === null || t > en('2026-10-11', '18:00')).toBe(true);
    // A los 2 días cierra solo, con el final por plantilla.
    const c = correr(b.e, [['2026-10-12 18:00', RELOJ]]);
    expect(c.s.filter((x) => x.tipo === 'mensaje').every((x) => x.tipo === 'mensaje' && x.plantilla !== null)).toBe(true);
    expect(ids(c.s)).toContain('FINAL-CHICO');
  });

  it('con la ventana abierta la espera del audio vence como siempre (B-SEGUIR a los 10 minutos)', () => {
    const { s } = correr(estadoEn('K1', { tipo: 'foto', clave: 'K1' }), [
      ['2026-10-10 17:00', toca('No tengo')],
      ['2026-10-10 17:11', RELOJ],
    ]);
    expect(ids(s)).toEqual(['B-FOTO-NOTENGO', 'B-SEGUIR']);
  });
});

describe('kids v2, revisión final 4: la espera del audio no vence con una ráfaga pendiente', () => {
  it('K1: [No tengo] 17:00, audio 17:09, reloj 17:10 → nada; a los 90 s, acuse y después B-SEGUIR', () => {
    const e0 = estadoEn('K1', { tipo: 'foto', clave: 'K1' });
    const a = correr(e0, [
      ['2026-10-10 17:00', toca('No tengo')],
      ['2026-10-10 17:09', audio(40)],
      ['2026-10-10 17:10', RELOJ],
    ]);
    expect(ids(a.s)).toEqual(['B-FOTO-NOTENGO']);
    const t = proximoDespertar(a.e, en('2026-10-10', '17:10'))!;
    expect(t.getTime()).toBe(en('2026-10-10', '17:09').getTime() + 90_000);
    const b = correr(a.e, [[t, RELOJ]]);
    expect(ids(b.s)).toEqual([expect.stringMatching(/^ACUSE-\d$/), 'B-SEGUIR']);
  });
});

describe('kids v2, revisión final 5: los botones que salen son copias, nunca los del banco', () => {
  it('cambiar los botones de una salida no le cambia nada al chico siguiente', () => {
    const r1 = paso(nuevoEstado(FICHA), { tipo: 'inicio' }, iso('2026-10-06', '17:30'));
    for (const s of r1.salidas) if (s.tipo === 'mensaje') s.botones.push('ROTO');
    expect(fijo('BIEN-CHICO').botones).toEqual(['Dale, vamos']);
    const r2 = paso(nuevoEstado(FICHA), { tipo: 'inicio' }, iso('2026-10-06', '17:30'));
    expect(r2.salidas.find((s) => s.tipo === 'mensaje' && s.id === 'BIEN-CHICO')).toMatchObject({ botones: ['Dale, vamos'] });
  });

  it('también la foto, la extra, la pregunta, la rama y lo retenido', () => {
    const casos: [Estado, Evento][] = [
      [estadoEn('K1', { tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 }), toca('Paso')], // B-PASO + K1-FOTO
      [antesDe('K12'), toca('Dale, otra')], // K12
      [estadoEn('K12', { tipo: 'pregunta', clave: 'K12', rama: null, pasoRama: 0 }), toca('Tengo hermanos')], // K12-R1
      [estadoEn('UNA-MAS-1', { tipo: 'una-mas' }), toca('Dale, otra')], // la extra
      [estadoEn('K2', { tipo: 'retenido', mensajes: [], luego: { tipo: 'libre', siguiente: 2 } }), toca('Dale, mandámela')],
    ];
    for (const [e, ev] of casos) {
      const r1 = paso(e, ev, iso('2026-10-10', '18:05'));
      for (const s of r1.salidas) if (s.tipo === 'mensaje') s.botones.splice(0, s.botones.length, 'ROTO');
      const r2 = paso(e, ev, iso('2026-10-10', '18:05'));
      for (const s of r2.salidas) if (s.tipo === 'mensaje') expect(s.botones, s.id).not.toContain('ROTO');
    }
    expect(fijo('B-SEGUIR').botones).toEqual(['Dale, otra', 'Mañana sigo']);
  });

  it('lo retenido detrás de un PREG-NUEVA no comparte botones con el banco', () => {
    const a = correr(antesDe('K2'), [['2026-10-12 18:00', RELOJ]]);
    expect(ids(a.s)).toEqual(['PREG-NUEVA-CHICO']);
    expect(a.e.fase.tipo).toBe('retenido');
    if (a.e.fase.tipo === 'retenido') a.e.fase.mensajes.forEach((m) => m.botones.push('ROTO'));
    expect(fijo('PREG-NUEVA-CHICO').botones).toEqual(['Dale, mandámela']);
  });
});

describe('kids v2, revisión final 6: día sobrio y la hora cambiada desde el panel', () => {
  it('si en el día sobrio la hora pasa a más temprano, al día siguiente sigue a la hora nueva (no un día tarde)', () => {
    const e0 = estadoEn('K5', { tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 }, {}, { ultimaEntrada: iso('2026-10-10', '15:00') });
    const a = correr(e0, [
      ['2026-10-10 15:00', audio(40, 'mi primo me pega a veces')],
      ['2026-10-10 15:02', RELOJ],
      ['2026-10-10 16:00', { tipo: 'ficha', cambios: { hora: '10:00' } }],
    ]);
    expect(a.e.sobrioHasta).toBe(iso('2026-10-11', '10:00'));
    const b = correr(a.e, [['2026-10-11 10:00', RELOJ]]);
    expect(ids(b.s)).toEqual(['K6']);
  });

  it('a una hora más tarde, también se corre', () => {
    const e0 = estadoEn('K5', { tipo: 'pregunta', clave: 'K5', rama: null, pasoRama: 0 });
    const a = correr(e0, [
      ['2026-10-10 15:00', audio(40, 'mi primo me pega a veces')],
      ['2026-10-10 15:02', RELOJ],
      ['2026-10-10 16:00', { tipo: 'ficha', cambios: { hora: '20:00' } }],
    ]);
    expect(a.e.sobrioHasta).toBe(iso('2026-10-11', '20:00'));
  });
});
