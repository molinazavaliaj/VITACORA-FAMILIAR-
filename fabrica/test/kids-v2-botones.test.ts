import { describe, it, expect } from 'vitest';
import { alBoton } from '../src/kids-v2/motor/botones.js';
import type { Ctx } from '../src/kids-v2/motor/flujo.js';
import type { Estado, Fase } from '../src/kids-v2/motor/tipos.js';
import { procesarRafaga, sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import { ctx, estadoEn, ids } from './kids-v2-ayuda.js';

const preg = (clave: string, rama: string | null = null, pasoRama = 0): Fase => ({ tipo: 'pregunta', clave, rama, pasoRama });
function toca(c: Ctx, ...bs: string[]): Ctx {
  for (const b of bs) alBoton(c, b);
  return c;
}

describe('kids v2: botones de la pregunta', () => {
  it('[Paso] en todas: B-PASO, y la foto pegada igual sale', () => {
    expect(ids(toca(ctx(estadoEn('K5', preg('K5'))), 'Paso').salidas)).toEqual(['B-PASO', 'B-SEGUIR']);
    expect(ids(toca(ctx(estadoEn('K1', preg('K1'))), 'Paso').salidas)).toEqual(['B-PASO', 'K1-FOTO']);
    expect(ids(toca(ctx(estadoEn('K10', preg('K10'))), 'Esta la paso').salidas)).toEqual(['B-PASO', 'K10-FOTO']);
  });

  it('K39 pasada: B-PASO y K40 directo, sin la tranquila', () => {
    expect(ids(toca(ctx(estadoEn('K39', preg('K39'))), 'Esta la paso').salidas)).toEqual(['B-PASO', 'K40']);
  });

  it('ramas: preguntan (K12 marca hermanos) o "no aplica" (B-NO-PASA-NADA y sigue)', () => {
    const c = toca(ctx(estadoEn('K12', preg('K12'))), 'Tengo hermanos');
    expect(ids(c.salidas)).toEqual(['K12-R1']);
    expect(c.e.fase).toEqual(preg('K12', 'Tengo hermanos'));
    expect(c.e.hermanos).toBe(true);
    toca(c, 'No tengo hermanos'); // ya eligió: no hace nada
    expect(ids(c.salidas)).toEqual(['K12-R1']);
    expect(ids(toca(ctx(estadoEn('K16', preg('K16'))), 'No tengo').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
    expect(ids(toca(ctx(estadoEn('K38', preg('K38'))), 'No se me ocurre').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
  });

  it('otra puerta: [Paso] la saltea y sigue a la foto', () => {
    expect(ids(toca(ctx(estadoEn('K2', { tipo: 'op', clave: 'K2' })), 'Paso').salidas)).toEqual(['B-PASO', 'K2-FOTO']);
  });

  it('pregunta del padre y extra: [Esta la paso] / [Paso]', () => {
    const p = toca(ctx(estadoEn('PADRE-1', preg('PADRE-1'), { preguntasPadre: [{ texto: 'x', conLinea: true }] })), 'Esta la paso');
    expect(ids(p.salidas)).toEqual(['B-PASO', 'B-SEGUIR']);
    const x = toca(ctx(estadoEn('UNA-MAS-1', preg('X1-6'), {}, { extra: 'X1-6' })), 'Paso');
    expect(ids(x.salidas)).toEqual(['B-PASO', 'CIERRE-1']);
  });
});

describe('kids v2: botones de la foto', () => {
  it('[No tengo]: le ofrece contarlo en audio y espera; K29 con su texto', () => {
    const c = toca(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), 'No tengo');
    expect(ids(c.salidas)).toEqual(['B-FOTO-NOTENGO']);
    expect(c.e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K1' });
    expect(ids(toca(ctx(estadoEn('K29', { tipo: 'foto', clave: 'K29' })), 'No tengo').salidas)).toEqual(['B-FOTO-PLATA']);
  });

  it('[Hoy no la como]: no dice nada, espera el audio', () => {
    const c = toca(ctx(estadoEn('K24', { tipo: 'foto', clave: 'K24' })), 'Hoy no la como');
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K24' });
  });

  it('[No hago] / [De ninguno] / [No miro]: B-NO-PASA-NADA y sigue; un botón que no es de esta foto no hace nada', () => {
    expect(ids(toca(ctx(estadoEn('K11', { tipo: 'foto', clave: 'K11' })), 'No hago').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
    expect(ids(toca(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), 'No hago').salidas)).toEqual([]);
  });

  it('la foto que se mudó por un tema sacado lleva sus botones', () => {
    expect(ids(toca(ctx(estadoEn('K16', { tipo: 'foto', clave: 'K16' }, { temasSacados: ['papa'] })), 'No hago').salidas)).toEqual(['B-NO-PASA-NADA', 'B-SEGUIR']);
  });
});

describe('kids v2: seguir, aviso, tranquila, una más, cierres y extras', () => {
  it('seguir: [Dale, otra] trae la siguiente (con su entrada si cambia de capítulo); [Mañana sigo] B-MAÑANA y el día hecho', () => {
    expect(ids(toca(ctx(estadoEn('K5', { tipo: 'seguir' })), 'Dale, otra').salidas)).toEqual(['K6']);
    expect(ids(toca(ctx(estadoEn('CIERRE-1', { tipo: 'seguir' })), 'Dale, otra').salidas)).toEqual(['ENTRADA-2', 'K10']);
    const c = toca(ctx(estadoEn('K5', { tipo: 'seguir' })), 'Mañana sigo');
    expect(ids(c.salidas)).toEqual(['B-MAÑANA']);
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor + 1 });
    expect(c.e.diaHecho).toBe('2026-10-10');
  });

  it('aviso: [Voy ahora] sale K39; [Mañana mejor] B-MAÑANA y mañana vuelve el aviso', () => {
    expect(ids(toca(ctx(estadoEn('K39', { tipo: 'aviso-seria' })), 'Voy ahora').salidas)).toEqual(['K39']);
    const c = toca(ctx(estadoEn('K39', { tipo: 'aviso-seria' })), 'Mañana mejor');
    expect(ids(c.salidas)).toEqual(['B-MAÑANA']);
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor });
  });

  it('tranquila: [Dale, una tranquila] K40; [Mañana sigo] queda K40 para mañana', () => {
    expect(ids(toca(ctx(estadoEn('K39', { tipo: 'tranquila' })), 'Dale, una tranquila').salidas)).toEqual(['K40']);
    const c = toca(ctx(estadoEn('K39', { tipo: 'tranquila' })), 'Mañana sigo');
    expect(c.e.fase).toEqual({ tipo: 'libre', siguiente: c.e.cursor + 1 });
  });

  it('una más: [Dale, otra] la primera extra disponible (en el cap. 4, liviana); [No, cerramos] el cierre', () => {
    const c = toca(ctx(estadoEn('UNA-MAS-1', { tipo: 'una-mas' }, {}, { opsUsadas: ['K1'] })), 'Dale, otra');
    expect(ids(c.salidas)).toEqual(['X1-2']);
    expect(c.e.extra).toBe('X1-2');
    expect(ids(toca(ctx(estadoEn('UNA-MAS-4', { tipo: 'una-mas' }, {}, { peleaK36: true })), 'Dale, otra').salidas)).toEqual(['X4-1']);
    expect(ids(toca(ctx(estadoEn('UNA-MAS-2', { tipo: 'una-mas' })), 'No, cerramos').salidas)).toEqual(['CIERRE-2']);
  });

  it('cierre: [No, eso fue todo] sigue sin acuse; [Sí, hay algo] espera sin decir nada', () => {
    expect(ids(toca(ctx(estadoEn('CIERRE-3', { tipo: 'cierre' })), 'No, eso fue todo').salidas)).toEqual(['B-SEGUIR']);
    const c = toca(ctx(estadoEn('CIERRE-3', { tipo: 'cierre' })), 'Sí, hay algo');
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.fase).toEqual({ tipo: 'cierre-cuenta' });
  });

  it('extras del final: [Dale, otra] EXTRAS-SI y la primera; [No, ya está] / [Lo dejamos acá] el final', () => {
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' })), 'Dale, otra').salidas)).toEqual(['EXTRAS-SI', 'X1-1']);
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' }, {}, { extrasUsadas: ['X1-1'] })), 'Dale, otra').salidas)).toEqual(['X1-2']);
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-oferta' })), 'No, ya está').salidas)).toEqual(['TERMINO-PADRE', 'FINAL-CHICO']);
    expect(ids(toca(ctx(estadoEn('EXTRAS', { tipo: 'extras-otra' })), 'Lo dejamos acá').salidas)).toEqual(['TERMINO-PADRE', 'FINAL-CHICO']);
  });

  it('botones viejos o repetidos no hacen nada', () => {
    expect(ids(toca(ctx(estadoEn('K5', preg('K5'))), 'Dale, otra', 'Mañana sigo', 'No, cerramos', 'Dale, vamos').salidas)).toEqual([]);
  });
});

describe('kids v2: arranque y [Estamos listos] (canal B)', () => {
  it('canal A: [Dale, vamos] → ENTRADA-1 y K1', () => {
    expect(ids(toca(ctx(estadoEn('K1', { tipo: 'bienvenida' })), 'Dale, vamos').salidas)).toEqual(['ENTRADA-1', 'K1']);
  });

  it('PREG-NUEVA: [Dale, mandámela] suelta lo retenido', () => {
    const m = { a: 'chico' as const, id: 'K6', texto: 'x', botones: ['Paso'], plantilla: null };
    expect(ids(toca(ctx(estadoEn('K5', { tipo: 'retenido', mensajes: [m], luego: preg('K6') })), 'Dale, mandámela').salidas)).toEqual(['K6']);
  });

  it('canal B: [Estamos listos] arranca, suelta lo retenido y, solo después de RECORD-B, vuelve a mandar la pendiente', () => {
    const B = { canal: 'B' as const };
    expect(ids(toca(ctx(estadoEn('K1', { tipo: 'bienvenida' }, B)), 'Estamos listos').salidas)).toEqual(['ENTRADA-1', 'K1']);
    expect(ids(toca(ctx(estadoEn('K5', preg('K5'), B)), 'Estamos listos').salidas)).toEqual([]);
    const c = toca(ctx(estadoEn('K5', preg('K5'), B, { reenviar: true })), 'Estamos listos', 'Estamos listos');
    expect(ids(c.salidas)).toEqual(['K5']);
    expect(c.salidas[0]).toMatchObject({ a: 'padre' });
  });
});

describe('kids v2: la foto vencida que vuelve al final lleva sus botones de siempre (cambio A, 05/10)', () => {
  const vuelta = (clave: string, extra: Partial<Estado> = {}) =>
    ctx(estadoEn('EXTRAS', { tipo: 'foto', clave: `${clave}-FOTO` }, {}, { extra: `${clave}-FOTO`, ...extra }));

  it('[No tengo]: B-FOTO-NOTENGO, espera el audio y, cuando llega, sigue con las extras', () => {
    const c = toca(vuelta('K1'), 'No tengo');
    expect(ids(c.salidas)).toEqual(['B-FOTO-NOTENGO']);
    expect(c.e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K1-FOTO' });
    sumarARafaga(c, { tipo: 'audio', seg: 20 });
    procesarRafaga(c);
    expect(ids(c.salidas).slice(-1)).toEqual(['EXTRAS-OTRA']);
    expect(c.e.fase).toEqual({ tipo: 'extras-otra' });
    expect(c.e.extra).toBeNull();
  });

  it('K29 vencida: [No tengo] con su texto (B-FOTO-PLATA)', () => {
    expect(ids(toca(vuelta('K29'), 'No tengo').salidas)).toEqual(['B-FOTO-PLATA']);
  });

  it('[No hago] / [Hoy no la como] de la foto original funcionan; uno que no es suyo no hace nada', () => {
    expect(ids(toca(vuelta('K11'), 'No hago').salidas)).toEqual(['B-NO-PASA-NADA', 'EXTRAS-OTRA']);
    const c = toca(vuelta('K24'), 'Hoy no la como');
    expect(ids(c.salidas)).toEqual([]);
    expect(c.e.fase).toMatchObject({ tipo: 'foto-audio', clave: 'K24-FOTO' });
    expect(ids(toca(vuelta('K1'), 'No hago').salidas)).toEqual([]);
  });
});
