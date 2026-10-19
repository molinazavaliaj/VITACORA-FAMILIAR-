// El `recibido` de cada respuesta o botón con id, `termino` y `avance`
// (plan-conexion-bot.md, T1). Chicos INVENTADOS.

import { describe, it, expect } from 'vitest';
import { avance, nuevoEstado, paso, SIN_CLAVE_KIDS, termino } from '../src/kids-v2/motor.js';
import type { Estado, Evento, Fase, Mensaje, Salida } from '../src/kids-v2/motor.js';
import { revisar } from '../src/kids-v2/controles.js';
import { correrUno } from '../src/kids-v2/simulacion.js';
import type { Corrida } from '../src/kids-v2/corrida.js';
import { FICHA, estadoEn, ids, iso } from './kids-v2-ayuda.js';

const preg = (clave: string): Fase => ({ tipo: 'pregunta', clave, rama: null, pasoRama: 0 });
const RELOJ: Evento = { tipo: 'reloj' };
const audio = (id: string, seg = 40): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'audio', seg, transcripcion: 'un rato largo en la plaza con la bici' }, id });
const foto = (id: string): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'foto' }, id });
const toca = (boton: string, id: string, aMensaje?: string): Evento => ({ tipo: 'boton', boton, id, ...(aMensaje !== undefined ? { aMensaje } : {}) });

/** Aplica eventos en orden ("AAAA-MM-DD HH:MM" de Buenos Aires). */
function correr(e: Estado, pasos: [string, Evento][]): { e: Estado; s: Salida[] } {
  const s: Salida[] = [];
  for (const [cuando, ev] of pasos) {
    const r = paso(e, ev, iso(cuando.slice(0, 10), cuando.slice(11)));
    e = r.estado;
    s.push(...r.salidas);
  }
  return { e, s };
}
const recibidos = (s: Salida[]) => s.flatMap((x) => (x.tipo === 'recibido' ? [`${x.id}:${x.clave}`] : []));

describe('kids v2: el recibido de cada respuesta o botón con id', () => {
  it('sin id no sale ningún recibido (como hasta ahora)', () => {
    const r = paso(estadoEn('K5', preg('K5')), { tipo: 'respuesta', contenido: { tipo: 'audio', seg: 40 } }, iso('2026-10-10', '18:05'));
    expect(recibidos(r.salidas)).toEqual([]);
  });

  it('una principal: la clave es la principal, uno solo aunque después lo acuse el reloj', () => {
    const { s } = correr(estadoEn('K5', preg('K5')), [
      ['2026-10-10 18:05', audio('w1')],
      ['2026-10-10 18:07', RELOJ],
    ]);
    expect(recibidos(s)).toEqual(['w1:K5']);
    expect(ids(s)).toEqual(['recibido:w1:K5', 'ACUSE-1', 'B-SEGUIR']);
  });

  it('una rama: el botón propio es la rama (K12-R2) y cada respuesta, el paso de la rama que se esperaba (K12-R2, K12-R2-2)', () => {
    const { s } = correr(estadoEn('K12', preg('K12')), [
      ['2026-10-10 18:05', toca('No tengo hermanos', 'w1')],
      ['2026-10-10 18:06', audio('w2')],
      ['2026-10-10 18:08', RELOJ],
      ['2026-10-10 18:09', audio('w3')],
    ]);
    expect(ids(s)).toContain('K12-R2-2');
    expect(recibidos(s)).toEqual(['w1:K12-R2', 'w2:K12-R2', 'w3:K12-R2-2']);
  });

  it('el [Paso] de una principal es la principal', () => {
    const { s } = correr(estadoEn('K5', preg('K5')), [['2026-10-10 18:05', toca('Paso', 'w1')]]);
    expect(recibidos(s)).toEqual(['w1:K5']);
  });

  it('la otra puerta: K-OP', () => {
    const { s } = correr(estadoEn('K2', { tipo: 'op', clave: 'K2' }), [['2026-10-10 18:05', audio('w1')]]);
    expect(recibidos(s)).toEqual(['w1:K2-OP']);
  });

  it('una foto pegada: el ID de su mensaje (K3-FOTO); [No tengo] y el audio que sigue, también', () => {
    const { s } = correr(estadoEn('K3', { tipo: 'foto', clave: 'K3' }), [['2026-10-10 18:05', foto('w1')]]);
    expect(recibidos(s)).toEqual(['w1:K3-FOTO']);
    const t = correr(estadoEn('K3', { tipo: 'foto', clave: 'K3' }), [
      ['2026-10-10 18:05', toca('No tengo', 'w2')],
      ['2026-10-10 18:06', audio('w3')],
    ]);
    expect(recibidos(t.s)).toEqual(['w2:K3-FOTO', 'w3:K3-FOTO']);
  });

  it('una foto mudada (sin "Su papá", la de K11 en K16): en el día, K11-FOTO, como sale su mensaje', () => {
    const e = estadoEn('K16', { tipo: 'foto', clave: 'K16' }, { temasSacados: ['papa'] });
    expect(e.guion.find((x) => x.clave === 'K16')).toMatchObject({ fotoDe: 'K11' });
    const { s } = correr(e, [['2026-10-10 18:05', foto('w1')]]);
    expect(recibidos(s)).toEqual(['w1:K11-FOTO']);
  });

  it('la foto mudada que venció y vuelve al final: K16-FOTO (la extra en curso, como en fotosVencidas)', () => {
    const e = estadoEn('EXTRAS', { tipo: 'extras-oferta' }, { temasSacados: ['papa'] }, { fotosVencidas: ['K16'], extrasDesde: iso('2026-10-10', '11:00') });
    const { s } = correr(e, [
      ['2026-10-10 18:05', toca('Dale, otra', 'w1')],
      ['2026-10-10 18:06', foto('w2')],
    ]);
    expect(ids(s)).toContain('K16-FOTO');
    expect(recibidos(s)).toEqual(['w1:EXTRAS', 'w2:K16-FOTO']);
  });

  it('una extra de "una más": el botón es la una más (UNA-MAS-1) y la respuesta, la extra que salió', () => {
    const { s } = correr(estadoEn('UNA-MAS-1', { tipo: 'una-mas' }), [['2026-10-10 18:05', toca('Dale, otra', 'w1')]]);
    const extra = s.find((x): x is Extract<Salida, { tipo: 'mensaje' }> => x.tipo === 'mensaje' && /^X\d-\d+$/.test(x.id));
    expect(extra).toBeDefined();
    const t = correr(paso(estadoEn('UNA-MAS-1', { tipo: 'una-mas' }), toca('Dale, otra', 'w1'), iso('2026-10-10', '18:05')).estado, [['2026-10-10 18:06', audio('w2')]]);
    expect(recibidos(s)).toEqual(['w1:UNA-MAS-1']);
    expect(recibidos(t.s)).toEqual([`w2:${extra!.id}`]);
  });

  it('la pregunta del padre: PADRE-1, contestada o pasada', () => {
    const f = { preguntasPadre: [{ texto: '¿Cuál fue tu primer recuerdo de la playa?', conLinea: true }] };
    const a = correr(estadoEn('PADRE-1', preg('PADRE-1'), f), [['2026-10-10 18:05', audio('w1')]]);
    expect(recibidos(a.s)).toEqual(['w1:PADRE-1']);
    const b = correr(estadoEn('PADRE-1', preg('PADRE-1'), f), [['2026-10-10 18:05', toca('Esta la paso', 'w2')]]);
    expect(recibidos(b.s)).toEqual(['w2:PADRE-1']);
  });

  it('el cierre: CIERRE-n, con [Sí, hay algo] y lo que cuenta después', () => {
    const { s } = correr(estadoEn('CIERRE-1', { tipo: 'cierre' }), [
      ['2026-10-10 18:05', toca('Sí, hay algo', 'w1')],
      ['2026-10-10 18:06', audio('w2')],
    ]);
    expect(recibidos(s)).toEqual(['w1:CIERRE-1', 'w2:CIERRE-1']);
  });

  it('la bienvenida y un PREG-NUEVA sin tocar: su ID (lo retenido todavía no le llegó)', () => {
    const e = paso(nuevoEstado(FICHA), { tipo: 'inicio' }, iso('2026-10-10', '12:00')).estado;
    expect(recibidos(paso(e, toca('Dale, vamos', 'w1'), iso('2026-10-10', '12:05')).salidas)).toEqual(['w1:BIEN-CHICO']);
    const k2: Mensaje = { a: 'chico', id: 'K2', texto: 'x', botones: ['Paso'], plantilla: null };
    const ret = estadoEn('K2', { tipo: 'retenido', mensajes: [k2], luego: preg('K2') });
    expect(recibidos(paso(ret, toca('Dale, mandámela', 'w2'), iso('2026-10-10', '18:05')).salidas)).toEqual(['w2:PREG-NUEVA-CHICO']);
  });

  it('un botón viejo (su aMensaje ya no vale) o uno que no corresponde: sin clave, y nada más', () => {
    const e = estadoEn('K5', preg('K5'), {}, { esperanBoton: ['7'] });
    const viejo = paso(e, toca('Paso', 'w1', '3'), iso('2026-10-10', '18:05'));
    expect(ids(viejo.salidas)).toEqual([`recibido:w1:${SIN_CLAVE_KIDS}`]);
    expect(viejo.estado.fase).toEqual(e.fase);
    const otro = paso(e, toca('Dale, vamos', 'w2'), iso('2026-10-10', '18:05'));
    expect(ids(otro.salidas)).toEqual([`recibido:w2:${SIN_CLAVE_KIDS}`]);
    expect(SIN_CLAVE_KIDS).toBe('∅');
  });

  it('de noche: no sale al guardarlo; sale una sola vez a las 9, cuando se aplica, con lo que se esperaba a las 9', () => {
    const noche = correr(estadoEn('K12', preg('K12')), [
      ['2026-10-10 23:10', toca('No tengo hermanos', 'w1')],
      ['2026-10-10 23:11', audio('w2')],
    ]);
    expect(recibidos(noche.s)).toEqual([]);
    expect(noche.e.nocturnos).toHaveLength(2);
    const manana = correr(noche.e, [
      ['2026-10-11 09:00', RELOJ],
      ['2026-10-11 09:01', RELOJ],
      ['2026-10-11 09:03', RELOJ],
    ]);
    expect(recibidos(manana.s)).toEqual(['w1:K12-R2', 'w2:K12-R2']);
  });

  it('después del final: sin clave (la marca la pone el reloj)', () => {
    const { s } = correr(estadoEn('FINAL', { tipo: 'terminado' }), [
      ['2026-10-10 18:05', audio('w1')],
      ['2026-10-10 18:07', RELOJ],
      ['2026-10-10 18:08', toca('Dale, otra', 'w2')],
    ]);
    expect(ids(s)).toEqual([`recibido:w1:${SIN_CLAVE_KIDS}`, 'marca:escribio-despues-del-final', `recibido:w2:${SIN_CLAVE_KIDS}`]);
  });

  it('antes de arrancar: sin clave', () => {
    expect(recibidos(paso(nuevoEstado(FICHA), audio('w1'), iso('2026-10-10', '12:00')).salidas)).toEqual([`w1:${SIN_CLAVE_KIDS}`]);
  });

  it('el control de la simulación detecta un recibido de menos y uno de más', () => {
    const base = correrUno(3);
    expect(base.corrida.recibidos.length).toBeGreaterThan(0);
    const sinUno: Corrida = { ...base.corrida, recibidos: base.corrida.recibidos.slice(1) };
    expect(revisar(base.ficha, sinUno, { sigueContestando: true }).map((x) => x.control)).toContain('recibido');
    const doble: Corrida = { ...base.corrida, recibidos: [base.corrida.recibidos[0], ...base.corrida.recibidos] };
    expect(revisar(base.ficha, doble, { sigueContestando: true }).map((x) => x.control)).toContain('recibido');
    expect(revisar(base.ficha, base.corrida, { sigueContestando: true })).toEqual([]);
  });
});

describe('kids v2: termino', () => {
  const alFinal = (canal: 'A' | 'B') =>
    paso(estadoEn('EXTRAS', { tipo: 'extras-oferta' }, { canal }, { extrasDesde: iso('2026-10-10', '11:00') }), toca('No, ya está', 'w1'), iso('2026-10-10', '18:05'));

  it('canal A: termina cuando le llega el final (TERMINO-PADRE sale junto)', () => {
    const r = alFinal('A');
    expect(ids(r.salidas)).toEqual(expect.arrayContaining(['TERMINO-PADRE', 'FINAL-CHICO']));
    expect(r.estado.fase).toEqual({ tipo: 'terminado' });
    expect(termino(r.estado)).toBe(true);
  });

  it('canal B: el final llega, pero termina al día siguiente, cuando sale TERMINO-PADRE', () => {
    const r = alFinal('B');
    expect(r.estado.fase).toEqual({ tipo: 'terminado' });
    expect(termino(r.estado)).toBe(false);
    const d = correr(r.estado, [['2026-10-11 18:00', RELOJ]]);
    expect(ids(d.s)).toEqual(['TERMINO-PADRE']);
    expect(termino(d.e)).toBe(true);
  });

  const retenidoEnExtras = (canal: 'A' | 'B') => {
    const oferta: Mensaje = { a: canal === 'A' ? 'chico' : 'padre', id: 'EXTRAS-OFERTA', texto: 'x', botones: ['Dale, otra'], plantilla: null };
    return estadoEn('EXTRAS', { tipo: 'retenido', mensajes: [oferta], luego: { tipo: 'extras-oferta' } }, { canal }, { extrasDesde: iso('2026-10-08', '18:00'), ultimaEntrada: iso('2026-10-06', '18:29') });
  };

  it('cierre solo a los 2 días con PREG-NUEVA sin tocar, canal A: termina aunque el final siga retenido', () => {
    const e = retenidoEnExtras('A');
    expect(termino(e)).toBe(false);
    const d = correr(e, [['2026-10-10 18:00', RELOJ]]);
    expect(ids(d.s)).toEqual(['TERMINO-PADRE', 'marca:cerro-sin-respuesta']);
    expect(d.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'terminado' } });
    expect(termino(d.e)).toBe(true);
  });

  it('cierre solo a los 2 días con PREG-NUEVA sin tocar, canal B: termina a los 2 días del cierre, cuando sale TERMINO-PADRE', () => {
    const d = correr(retenidoEnExtras('B'), [['2026-10-10 18:00', RELOJ]]);
    expect(ids(d.s)).toEqual(['marca:cerro-sin-respuesta']);
    expect(termino(d.e)).toBe(false);
    const d1 = correr(d.e, [['2026-10-11 18:00', RELOJ]]);
    expect(termino(d1.e)).toBe(false);
    const d2 = correr(d1.e, [['2026-10-12 18:00', RELOJ]]);
    expect(ids(d2.s)).toEqual(['TERMINO-PADRE']);
    expect(d2.e.fase).toMatchObject({ tipo: 'retenido', luego: { tipo: 'terminado' } });
    expect(termino(d2.e)).toBe(true);
  });
});

describe('kids v2: avance', () => {
  it('antes de K1: capítulo 0, preguntas abiertas, sin terminar', () => {
    expect(avance(nuevoEstado(FICHA))).toEqual({ capitulo: 0, preguntasPadreAbiertas: true, terminado: false });
  });

  it('el capítulo del item en curso; las preguntas del padre se cierran al empezar el cap. 4 (la misma regla que el evento ficha)', () => {
    expect(avance(estadoEn('K12', preg('K12')))).toEqual({ capitulo: 2, preguntasPadreAbiertas: true, terminado: false });
    expect(avance(estadoEn('CIERRE-3', { tipo: 'cierre' }))).toMatchObject({ capitulo: 3, preguntasPadreAbiertas: true });
    expect(avance(estadoEn('K31', preg('K31')))).toMatchObject({ capitulo: 4, preguntasPadreAbiertas: false });

    const nueva = [{ texto: '¿Qué te gustaba de la escuela?', conLinea: true }];
    const ficha: Evento = { tipo: 'ficha', cambios: { preguntasPadre: nueva } };
    const abierta = paso(estadoEn('CIERRE-3', { tipo: 'cierre' }), ficha, iso('2026-10-10', '18:05')).estado;
    expect(abierta.ficha.preguntasPadre).toEqual(nueva);
    const cerrada = paso(estadoEn('K31', preg('K31')), ficha, iso('2026-10-10', '18:05')).estado;
    expect(cerrada.ficha.preguntasPadre).toEqual([]);
  });

  it('terminado es termino()', () => {
    const e = estadoEn('FINAL', { tipo: 'terminado' });
    expect(avance(e)).toEqual({ capitulo: 5, preguntasPadreAbiertas: false, terminado: true });
    expect(avance({ ...e, terminoPadre: '2026-10-11' }).terminado).toBe(false);
  });
});
