import { describe, it, expect } from 'vitest';
import { nuevoEstado, paso, type Estado, type Evento, type Salida } from '../src/kids-v2/motor.js';
import { FICHA, estadoEn, ids, iso } from './kids-v2-ayuda.js';
import type { Mensaje } from '../src/kids-v2/motor.js';

/** Aplica eventos en orden; cada uno con su hora de Buenos Aires. Devuelve el estado y todas las salidas. */
function correr(e: Estado, pasos: [fecha: string, hora: string, ev: Evento][]): { e: Estado; s: Salida[] } {
  const s: Salida[] = [];
  for (const [fecha, hora, ev] of pasos) {
    const r = paso(e, ev, iso(fecha, hora));
    e = r.estado;
    s.push(...r.salidas);
  }
  return { e, s };
}
const RELOJ: Evento = { tipo: 'reloj' };
const audio = (seg: number): Evento => ({ tipo: 'respuesta', contenido: { tipo: 'audio', seg } });
const toca = (boton: string): Evento => ({ tipo: 'boton', boton });

describe('kids v2: paso() es puro', () => {
  it('no toca el estado que recibe y es determinístico', () => {
    const e = nuevoEstado(FICHA);
    const copia = structuredClone(e);
    const a = paso(e, { tipo: 'inicio' }, iso('2026-10-06', '17:30'));
    const b = paso(e, { tipo: 'inicio' }, iso('2026-10-06', '17:30'));
    expect(e).toEqual(copia);
    expect(a).toEqual(b);
  });
});

describe('kids v2: el arranque', () => {
  it('canal A: BIEN-CHICO al chico y AVISO-PADRE al padre; [Dale, vamos] → ENTRADA-1 y K1', () => {
    const { e, s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
    ]);
    expect(ids(s)).toEqual(['BIEN-CHICO', 'AVISO-PADRE', 'ENTRADA-1', 'K1']);
    expect(s.map((x) => (x.tipo === 'mensaje' ? x.a : '-'))).toEqual(['chico', 'padre', 'chico', 'chico']);
    expect(e.fase).toEqual({ tipo: 'pregunta', clave: 'K1', rama: null, pasoRama: 0 });
  });

  it('plural: "Tus abuelos" → BIEN-CHICO-PL', () => {
    const { s } = correr(nuevoEstado({ ...FICHA, quienRegala: 'Tus abuelos' }), [['2026-10-06', '17:30', { tipo: 'inicio' }]]);
    expect(ids(s)).toEqual(['BIEN-CHICO-PL', 'AVISO-PADRE']);
  });

  it('canal B: solo BIEN-PADRE; [Estamos listos] → ENTRADA-1 y K1, al número del padre', () => {
    const { s } = correr(nuevoEstado({ ...FICHA, canal: 'B' }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '20:00', toca('Estamos listos')],
    ]);
    expect(ids(s)).toEqual(['BIEN-PADRE', 'ENTRADA-1', 'K1']);
    expect(s.every((x) => x.tipo === 'mensaje' && x.a === 'padre')).toBe(true);
  });

  it('si paga de noche, la bienvenida sale a las 9 (#37); un segundo inicio no hace nada', () => {
    const { e, s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '23:30', { tipo: 'inicio' }],
      ['2026-10-06', '23:31', { tipo: 'inicio' }],
      ['2026-10-07', '08:59', RELOJ],
    ]);
    expect(ids(s)).toEqual([]);
    const r = paso(e, RELOJ, iso('2026-10-07', '09:00'));
    expect(ids(r.salidas)).toEqual(['BIEN-CHICO', 'AVISO-PADRE']);
    expect(ids(paso(r.estado, { tipo: 'inicio' }, iso('2026-10-07', '10:00')).salidas)).toEqual([]);
  });
});

describe('kids v2: un día típico, de punta a punta', () => {
  it('respuesta → (90 s) acuse y foto → foto → acuse de foto y seguir → [Dale, otra] → K2', () => {
    const { s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
      ['2026-10-06', '18:00', audio(40)],
      ['2026-10-06', '18:00', audio(30)],
      ['2026-10-06', '18:01', RELOJ],
      ['2026-10-06', '18:02', RELOJ],
      ['2026-10-06', '18:05', { tipo: 'respuesta', contenido: { tipo: 'foto' } }],
      ['2026-10-06', '18:07', RELOJ],
      ['2026-10-06', '18:08', toca('Dale, otra')],
    ]);
    expect(ids(s)).toEqual(['BIEN-CHICO', 'AVISO-PADRE', 'ENTRADA-1', 'K1', 'ACUSE-1', 'K1-FOTO', 'ACUSE-FOTO-1', 'B-SEGUIR', 'K2']);
  });

  it('un botón que llega con una ráfaga abierta: primero se contesta la ráfaga', () => {
    const { s } = correr(nuevoEstado(FICHA), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
      ['2026-10-06', '18:00', audio(40)],
      ['2026-10-06', '18:00', toca('Paso')],
    ]);
    expect(ids(s).slice(4)).toEqual(['ACUSE-1', 'K1-FOTO']);
  });
});

describe('kids v2: nada de noche', () => {
  it('lo que llega de noche se contesta a las 9; [Mañana sigo] de noche no dice "ya está por hoy" a la mañana', () => {
    const base = correr(nuevoEstado({ ...FICHA, hora: '21:00' }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '21:00', toca('Dale, vamos')],
    ]);
    const noche = correr(base.e, [
      ['2026-10-06', '22:30', audio(60)],
      ['2026-10-06', '22:35', RELOJ],
      ['2026-10-07', '01:00', RELOJ],
    ]);
    expect(ids(noche.s)).toEqual([]);
    const manana = correr(noche.e, [
      ['2026-10-07', '09:00', RELOJ],
      ['2026-10-07', '09:02', RELOJ],
    ]);
    expect(ids(manana.s)).toEqual(['ACUSE-1', 'K1-FOTO']);
    const mas = correr(manana.e, [
      ['2026-10-07', '09:05', { tipo: 'respuesta', contenido: { tipo: 'foto' } }],
      ['2026-10-07', '09:07', RELOJ],
      ['2026-10-07', '23:00', toca('Mañana sigo')],
      ['2026-10-08', '09:00', RELOJ],
    ]);
    expect(ids(mas.s)).toEqual(['ACUSE-FOTO-1', 'B-SEGUIR']);
    expect(mas.e.fase).toMatchObject({ tipo: 'libre' });
    expect(ids(paso(mas.e, RELOJ, iso('2026-10-08', '21:00')).salidas)).toEqual(['K2']);
  });
});

describe('kids v2: cambios desde el panel (#34)', () => {
  const empezado = () =>
    correr(nuevoEstado({ ...FICHA, preguntasPadre: [{ texto: 'Una', conLinea: true }] }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
    ]).e;

  it('la hora y los temas de lo que todavía no salió se pueden cambiar', () => {
    const e = paso(empezado(), { tipo: 'ficha', cambios: { hora: '19:30', temasSacados: ['mama'] } }, iso('2026-10-06', '18:00')).estado;
    expect(e.ficha.hora).toBe('19:30');
    expect(e.guion.map((x) => x.clave)).not.toContain('K10');
    expect(e.guion[e.cursor].clave).toBe('K1');
  });

  it('las preguntas del padre, hasta que empieza el cap. 4; después ya no', () => {
    const e = paso(empezado(), { tipo: 'ficha', cambios: { preguntasPadre: [{ texto: 'Otra', conLinea: false }] } }, iso('2026-10-06', '18:00')).estado;
    expect(e.guion.find((x) => x.clave === 'PADRE-1')).toMatchObject({ texto: 'Otra', conLinea: false });
    const enCap4 = { ...e, cursor: e.guion.findIndex((x) => x.clave === 'K31') };
    const f = paso(enCap4, { tipo: 'ficha', cambios: { preguntasPadre: [] } }, iso('2026-10-20', '18:00')).estado;
    expect(f.guion.find((x) => x.clave === 'PADRE-1')).toMatchObject({ texto: 'Otra' });
  });

  it('sacar el tema de lo que se está preguntando ahora no hace nada (ya salió)', () => {
    const e = empezado();
    const enK10 = { ...e, cursor: e.guion.findIndex((x) => x.clave === 'K10') };
    const f = paso(enK10, { tipo: 'ficha', cambios: { temasSacados: ['mama'] } }, iso('2026-10-10', '18:00')).estado;
    expect(f.guion).toEqual(enK10.guion);
    expect(f.ficha.temasSacados).toEqual([]);
  });
});

describe('kids v2: panel, arreglo de la revisión (decisión 27: lo actual queda, lo demás se aplica)', () => {
  const empezado = (preguntasPadre = [{ texto: 'Una', conLinea: true }, { texto: 'Dos', conLinea: false }]) =>
    correr(nuevoEstado({ ...FICHA, preguntasPadre }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
    ]).e;
  const en = (e: Estado, clave: string): Estado => ({ ...e, cursor: e.guion.findIndex((x) => x.clave === clave) });

  it('en K10, sacar "mama" y "mudanza" en el mismo guardado: K10 sigue (con su foto), K38 ya no está, y la hora se aplica', () => {
    const e = en(empezado(), 'K10');
    const f = paso(e, { tipo: 'ficha', cambios: { hora: '19:00', temasSacados: ['mama', 'mudanza'] } }, iso('2026-10-10', '18:00')).estado;
    expect(f.guion[f.cursor].clave).toBe('K10');
    expect(f.guion.slice(0, f.cursor + 1)).toEqual(e.guion.slice(0, e.cursor + 1));
    expect(f.guion.map((x) => x.clave)).not.toContain('K38');
    expect(f.ficha.temasSacados).toEqual(['mudanza']);
    expect(f.ficha.hora).toBe('19:00');
    // La foto de K10 no se muda a K16: ya salió con K10.
    expect(f.guion.find((x) => x.clave === 'K16')).toMatchObject({ fotoDe: null });
    expect(f.guion.filter((x) => x.tipo === 'principal' && x.fotoDe === 'K10')).toHaveLength(1);
  });

  it('un tema ya sacado cuya principal ya pasó sigue sacado (y su foto mudada no se repite)', () => {
    const e0 = correr(nuevoEstado({ ...FICHA, temasSacados: ['mama'] }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '17:50', toca('Dale, vamos')],
    ]).e;
    const e = en(e0, 'K20');
    const f = paso(e, { tipo: 'ficha', cambios: { temasSacados: ['mudanza'] } }, iso('2026-10-12', '18:00')).estado;
    expect(f.ficha.temasSacados).toEqual(['mama', 'mudanza']);
    expect(f.guion.map((x) => x.clave)).not.toContain('K10');
    expect(f.guion.map((x) => x.clave)).not.toContain('K38');
    expect(f.guion.filter((x) => x.tipo === 'principal' && x.fotoDe === 'K10')).toHaveLength(1);
  });

  it('en PADRE-1, un guardado con menos preguntas del padre: PADRE-1 sigue y, ya empezado el cap. 4, la lista no cambia; la hora sí', () => {
    const e = en(empezado(), 'PADRE-1');
    const f = paso(e, { tipo: 'ficha', cambios: { hora: '20:00', preguntasPadre: [{ texto: 'Una', conLinea: true }] } }, iso('2026-10-20', '18:00')).estado;
    expect(f.guion[f.cursor].clave).toBe('PADRE-1');
    expect(f.guion.map((x) => x.clave)).toContain('PADRE-2');
    expect(f.ficha.preguntasPadre).toHaveLength(2);
    expect(f.ficha.hora).toBe('20:00');
  });

  it('antes del cap. 4, menos preguntas del padre: las que siguen salen de la lista nueva', () => {
    const e = en(empezado(), 'K20');
    const f = paso(e, { tipo: 'ficha', cambios: { preguntasPadre: [{ texto: 'Otra', conLinea: false }] } }, iso('2026-10-12', '18:00')).estado;
    expect(f.guion.filter((x) => x.tipo === 'padre').map((x) => x.clave)).toEqual(['PADRE-1']);
    expect(f.guion.find((x) => x.clave === 'PADRE-1')).toMatchObject({ texto: 'Otra' });
  });

  it('una hora mal escrita tira error igual que una fuera de 09:00–21:59, y el estado de quien llama queda intacto', () => {
    const e = empezado();
    const copia = structuredClone(e);
    expect(() => paso(e, { tipo: 'ficha', cambios: { hora: '7 de la tarde' } }, iso('2026-10-06', '18:00'))).toThrow(/hora/);
    expect(() => paso(e, { tipo: 'ficha', cambios: { hora: '23:00' } }, iso('2026-10-06', '18:00'))).toThrow(/hora/);
    expect(e).toEqual(copia);
  });
});

describe('kids v2: canal B, [Estamos listos] después de que ya contestó', () => {
  it('sale RECORD-B, el chico contesta y después el padre toca [Estamos listos]: no se repite nada', () => {
    const base = correr(nuevoEstado({ ...FICHA, canal: 'B' }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '18:10', toca('Estamos listos')],
      ['2026-10-10', '18:00', RELOJ],
    ]);
    expect(ids(base.s)).toEqual(['BIEN-PADRE', 'ENTRADA-1', 'K1', 'RECORD-B']);
    expect(base.e.reenviar).toBe(true);
    const r = correr(base.e, [
      ['2026-10-10', '18:30', audio(40)],
      ['2026-10-10', '18:32', RELOJ],
      ['2026-10-10', '18:40', toca('Estamos listos')],
    ]);
    expect(ids(r.s)).toEqual(['ACUSE-1', 'K1-FOTO']);
    expect(r.e.reenviar).toBe(false);
    expect(r.e.recordatorios).toBe(0);
  });

  it('si toca [Estamos listos] sin haber contestado, sí vuelve a mandar la pendiente (una vez)', () => {
    const r = correr(nuevoEstado({ ...FICHA, canal: 'B' }), [
      ['2026-10-06', '17:30', { tipo: 'inicio' }],
      ['2026-10-06', '18:10', toca('Estamos listos')],
      ['2026-10-10', '18:00', RELOJ],
      ['2026-10-10', '18:40', toca('Estamos listos')],
      ['2026-10-10', '18:41', toca('Estamos listos')],
    ]);
    expect(ids(r.s)).toEqual(['BIEN-PADRE', 'ENTRADA-1', 'K1', 'RECORD-B', 'K1']);
  });
});

describe('kids v2: el final retenido (cerró solo a los 2 días) y lo que escribe después', () => {
  const cerrado = () => {
    const oferta: Mensaje = { a: 'chico', id: 'EXTRAS-OFERTA', texto: 'x', botones: ['Dale, otra'], plantilla: null };
    const e = estadoEn('EXTRAS', { tipo: 'retenido', mensajes: [oferta], luego: { tipo: 'extras-oferta' } }, {}, {
      extrasDesde: iso('2026-10-08', '18:00'),
      ultimaEntrada: iso('2026-10-06', '18:29'),
    });
    const r = paso(e, RELOJ, iso('2026-10-10', '18:00'));
    expect(ids(r.salidas)).toEqual(['TERMINO-PADRE', 'marca:cerro-sin-respuesta']);
    return r.estado;
  };

  it('lo primero que escribe suelta FINAL-CHICO; recién lo que sigue es "escribió después del final" (sin respuesta)', () => {
    const r = correr(cerrado(), [
      ['2026-10-12', '17:00', audio(30)],
      ['2026-10-12', '17:02', RELOJ],
    ]);
    expect(ids(r.s)).toEqual(['ACUSE-1', 'FINAL-CHICO']);
    expect(r.e.fase).toEqual({ tipo: 'terminado' });
    const despues = correr(r.e, [
      ['2026-10-12', '17:10', audio(30)],
      ['2026-10-12', '17:12', RELOJ],
      ['2026-10-12', '17:20', toca('Dale, otra')],
    ]);
    expect(ids(despues.s)).toEqual(['marca:escribio-despues-del-final']);
  });

  it('si escribe de noche, a las 9 le llega FINAL-CHICO (no se lo traga la noche ni cuenta como "después del final")', () => {
    const noche = correr(cerrado(), [
      ['2026-10-12', '23:00', { tipo: 'respuesta', contenido: { tipo: 'texto', texto: 'hola' } }],
      ['2026-10-12', '23:05', RELOJ],
    ]);
    expect(ids(noche.s)).toEqual([]);
    const manana = correr(noche.e, [
      ['2026-10-13', '09:00', RELOJ],
      ['2026-10-13', '09:02', RELOJ],
    ]);
    expect(ids(manana.s)).toEqual(['FINAL-CHICO']);
    expect(manana.e.fase).toEqual({ tipo: 'terminado' });
    const otra = correr(manana.e, [
      ['2026-10-13', '23:30', { tipo: 'respuesta', contenido: { tipo: 'texto', texto: 'chau' } }],
      ['2026-10-14', '09:00', RELOJ],
      ['2026-10-14', '09:02', RELOJ],
    ]);
    expect(ids(otra.s)).toEqual(['marca:escribio-despues-del-final']);
  });

  it('si toca [Dale, mandámela] (aunque sea con una ráfaga abierta), le llega FINAL-CHICO una sola vez', () => {
    const r = correr(cerrado(), [
      ['2026-10-12', '17:00', { tipo: 'respuesta', contenido: { tipo: 'texto', texto: 'hola' } }],
      ['2026-10-12', '17:00', toca('Dale, mandámela')],
      ['2026-10-12', '17:05', RELOJ],
    ]);
    expect(ids(r.s)).toEqual(['FINAL-CHICO']);
    expect(r.e.fase).toEqual({ tipo: 'terminado' });
  });
});
