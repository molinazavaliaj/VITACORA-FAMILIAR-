import { describe, it, expect } from 'vitest';
import { esCorta, procesarRafaga, sumarARafaga } from '../src/kids-v2/motor/rafaga.js';
import type { Contenido, Fase } from '../src/kids-v2/motor/tipos.js';
import type { Ctx } from '../src/kids-v2/motor/flujo.js';
import { BANCO } from '../src/kids-v2/banco.js';
import { ctx, estadoEn, ids } from './kids-v2-ayuda.js';

const AUDIO = (seg: number): Contenido => ({ tipo: 'audio', seg });
const TEXTO = (texto: string): Contenido => ({ tipo: 'texto', texto });
const FOTO: Contenido = { tipo: 'foto' };
const preg = (clave: string, rama: string | null = null, pasoRama = 0): Fase => ({ tipo: 'pregunta', clave, rama, pasoRama });

function cuenta(c: Ctx, ...cs: Contenido[]): Ctx {
  for (const x of cs) sumarARafaga(c, x);
  procesarRafaga(c);
  return c;
}

describe('kids v2: muy corto (#20)', () => {
  it('audio de menos de 15 s y texto de menos de 8 palabras; una foto nunca es corta', () => {
    expect(esCorta({ seg: 14, palabras: 0, fotos: 0 })).toBe(true);
    expect(esCorta({ seg: 15, palabras: 0, fotos: 0 })).toBe(false);
    expect(esCorta({ seg: 0, palabras: 7, fotos: 0 })).toBe(true);
    expect(esCorta({ seg: 0, palabras: 8, fotos: 0 })).toBe(false);
    expect(esCorta({ seg: 0, palabras: 0, fotos: 1 })).toBe(false);
  });

  it('la ráfaga junta varios audios y textos', () => {
    const c = ctx(estadoEn('K5', preg('K5')));
    sumarARafaga(c, AUDIO(10));
    sumarARafaga(c, AUDIO(10));
    sumarARafaga(c, TEXTO('hola che'));
    expect(c.e.rafaga).toMatchObject({ seg: 20, palabras: 2, fotos: 0, textos: ['hola che'] });
  });
});

describe('kids v2: un día típico (orden: otra puerta → acuse → foto → seguir)', () => {
  it('respuesta larga a una principal con foto: acuse y la foto', () => {
    const c = cuenta(ctx(estadoEn('K1', preg('K1'))), AUDIO(60));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'K1-FOTO']);
    expect(c.e.fase).toEqual({ tipo: 'foto', clave: 'K1' });
  });

  it('respuesta larga sin foto: acuse y B-SEGUIR', () => {
    const c = cuenta(ctx(estadoEn('K5', preg('K5'))), AUDIO(60), AUDIO(30));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('muy corta: la otra puerta, una sola vez; a la otra puerta contestada corta, sin acuse, la foto (revisión final, 05/10)', () => {
    const c = cuenta(ctx(estadoEn('K2', preg('K2'))), AUDIO(5));
    expect(ids(c.salidas)).toEqual(['K2-OP']);
    expect(c.e.opsUsadas).toEqual(['K2']);
    cuenta(c, AUDIO(4));
    expect(ids(c.salidas)).toEqual(['K2-OP', 'K2-FOTO']);
    // Contestada largo: acuse y foto.
    const d = cuenta(ctx(estadoEn('K2', { tipo: 'op', clave: 'K2' })), AUDIO(30));
    expect(ids(d.salidas)).toEqual(['ACUSE-1', 'K2-FOTO']);
  });

  it('una OP que ya salió no vuelve; K39 (sensible) no tiene; la de K12 solo en la rama "Tengo hermanos"', () => {
    const c = cuenta(ctx(estadoEn('K2', preg('K2'), {}, { opsUsadas: ['K2'] })), AUDIO(5));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'K2-FOTO']);
    const k12 = cuenta(ctx(estadoEn('K12', preg('K12'))), AUDIO(5));
    expect(ids(k12.salidas)).toEqual(['ACUSE-1', 'K12-FOTO']);
    const tengo = cuenta(ctx(estadoEn('K12', preg('K12', 'Tengo hermanos'))), AUDIO(5));
    expect(ids(tengo.salidas)).toEqual(['K12-OP']);
  });

  it('rama de dos pasos (K12, "No tengo hermanos"): la segunda sale sin acuse', () => {
    const c = cuenta(ctx(estadoEn('K12', preg('K12', 'No tengo hermanos'))), AUDIO(4));
    expect(ids(c.salidas)).toEqual(['K12-R2-2']);
    cuenta(c, AUDIO(60));
    expect(ids(c.salidas)).toEqual(['K12-R2-2', 'ACUSE-1', 'K12-FOTO']);
  });

  it('escribe en vez de audio: acuses sin "escuché"', () => {
    const c = cuenta(ctx(estadoEn('K5', preg('K5'))), TEXTO('me caí de la bici en la plaza y me raspé toda la rodilla'));
    expect(ids(c.salidas)).toEqual(['ACUSE-2', 'B-SEGUIR']);
  });

  it('la cápsula: acuses sin "libro"', () => {
    const c = cuenta(ctx(estadoEn('K43', preg('K43'), {}, { rotacion: { acuse: 'ACUSE-2', foto: null, diaFeo: null } })), AUDIO(60));
    expect(ids(c.salidas)).toEqual(['ACUSE-4', 'B-SEGUIR']);
  });

  it('foto: acuse de foto y seguir; un audio en vez de la foto también vale', () => {
    const c = cuenta(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), FOTO, FOTO);
    expect(ids(c.salidas)).toEqual(['ACUSE-FOTO-1', 'B-SEGUIR']);
    const d = cuenta(ctx(estadoEn('K1', { tipo: 'foto', clave: 'K1' })), AUDIO(30));
    expect(ids(d.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('el audio después de [No tengo]: acuse y seguir', () => {
    const c = cuenta(ctx(estadoEn('K3', { tipo: 'foto-audio', clave: 'K3', desde: '2026-10-10T21:00:00.000Z' })), AUDIO(20));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('K39 contado: el acuse del día feo y la tranquila', () => {
    const c = cuenta(ctx(estadoEn('K39', preg('K39'))), AUDIO(90), AUDIO(40));
    expect(ids(c.salidas)).toEqual(['B-DIAFEO-ACUSE-1', 'B-TRANQUILA']);
  });

  it('K36 contada sin otra puerta: habilita la extra "cómo se arreglaron"', () => {
    const c = cuenta(ctx(estadoEn('K36', preg('K36'))), AUDIO(60));
    expect(c.e.peleaK36).toBe(true);
    const d = cuenta(ctx(estadoEn('K36', preg('K36'))), AUDIO(5));
    expect(d.e.peleaK36).toBe(false);
  });
});

describe('kids v2: cierres y respuestas fuera de lugar', () => {
  it('cierre: un "no" contado (corto) es como [No, eso fue todo], sin acuse; algo largo lleva acuse', () => {
    const c = cuenta(ctx(estadoEn('CIERRE-1', { tipo: 'cierre' })), TEXTO('no'));
    expect(ids(c.salidas)).toEqual(['B-SEGUIR']);
    const d = cuenta(ctx(estadoEn('CIERRE-1', { tipo: 'cierre' })), AUDIO(40));
    expect(ids(d.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
    const e = cuenta(ctx(estadoEn('CIERRE-1', { tipo: 'cierre-cuenta' })), AUDIO(40));
    expect(ids(e.salidas)).toEqual(['ACUSE-1', 'B-SEGUIR']);
  });

  it('esperando un botón: si cuenta algo, acuse y se queda; si es corto, nada', () => {
    const c = cuenta(ctx(estadoEn('K5', { tipo: 'seguir' })), AUDIO(40));
    expect(ids(c.salidas)).toEqual(['ACUSE-1']);
    expect(c.e.fase).toEqual({ tipo: 'seguir' });
    const d = cuenta(ctx(estadoEn('K5', { tipo: 'seguir' })), TEXTO('ok'));
    expect(ids(d.salidas)).toEqual([]);
  });

  it('en la bienvenida, escribir es como tocar el botón; con PREG-NUEVA sin tocar, escribir suelta lo retenido', () => {
    const c = cuenta(ctx(estadoEn('K1', { tipo: 'bienvenida' })), TEXTO('hola'));
    expect(ids(c.salidas)).toEqual(['ENTRADA-1', 'K1']);
    const m = { a: 'chico' as const, id: 'K6', texto: 'x', botones: ['Paso'], plantilla: null };
    const d = cuenta(ctx(estadoEn('K5', { tipo: 'retenido', mensajes: [m], luego: preg('K6') })), TEXTO('hola'));
    expect(ids(d.salidas)).toEqual(['K6']);
    expect(d.e.fase).toEqual(preg('K6'));
  });

  it('después del final: no contesta, marca a Naza', () => {
    const c = cuenta(ctx(estadoEn('FINAL', { tipo: 'terminado' })), AUDIO(20));
    expect(ids(c.salidas)).toEqual(['marca:escribio-despues-del-final']);
  });
});

describe('kids v2: una foto vencida que vuelve al final (cambio A de Naza, 05/10)', () => {
  const vuelta = (fase: Fase, extra: Partial<Parameters<typeof estadoEn>[3]> = {}) =>
    ctx(estadoEn('EXTRAS', fase, {}, { extra: 'K1-FOTO', ...extra }));

  it('manda la foto: acuse de foto y EXTRAS-OTRA si quedan extras', () => {
    const c = cuenta(vuelta({ tipo: 'foto', clave: 'K1-FOTO' }), FOTO);
    expect(ids(c.salidas)).toEqual(['ACUSE-FOTO-1', 'EXTRAS-OTRA']);
    expect(c.e.fase).toEqual({ tipo: 'extras-otra' });
    expect(c.e.extra).toBeNull();
  });

  it('manda la foto y no queda nada: acuse de foto, EXTRAS-FIN y el final', () => {
    const todas = BANCO.extras.map((x) => x.id);
    const c = cuenta(vuelta({ tipo: 'foto', clave: 'K1-FOTO' }, { extrasUsadas: todas }), FOTO);
    expect(ids(c.salidas)).toEqual(['ACUSE-FOTO-1', 'EXTRAS-FIN', 'TERMINO-PADRE', 'FINAL-CHICO']);
    expect(c.e.fase).toEqual({ tipo: 'terminado' });
  });

  it('un audio en vez de la foto, o después de [No tengo]: acuse normal (no de cápsula) y sigue', () => {
    const c = cuenta(vuelta({ tipo: 'foto', clave: 'K1-FOTO' }), AUDIO(30));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'EXTRAS-OTRA']);
    const d = cuenta(vuelta({ tipo: 'foto-audio', clave: 'K1-FOTO', desde: '2026-10-10T21:00:00.000Z' }), AUDIO(20));
    expect(ids(d.salidas)).toEqual(['ACUSE-1', 'EXTRAS-OTRA']);
  });
});

describe('kids v2: arreglos de la revisión (fotos, bienvenida y retenido, rama que no existe)', () => {
  it('solo fotos, fuera de la fase de foto: acuse de foto, nunca uno con "escuché"', () => {
    const c = cuenta(ctx(estadoEn('K5', preg('K5'))), FOTO);
    expect(ids(c.salidas)).toEqual(['ACUSE-FOTO-1', 'B-SEGUIR']);
    const d = cuenta(ctx(estadoEn('K5', { tipo: 'seguir' })), FOTO, FOTO);
    expect(ids(d.salidas)).toEqual(['ACUSE-FOTO-1']);
  });

  it('texto y foto (sin audio): acuse de escrito, sin "escuché"', () => {
    const c = cuenta(ctx(estadoEn('K5', preg('K5'))), TEXTO('mirá'), FOTO);
    expect(ids(c.salidas)).toEqual(['ACUSE-2', 'B-SEGUIR']);
  });

  it('en la bienvenida o con PREG-NUEVA sin tocar, si cuenta algo: primero el acuse y después se suelta', () => {
    const c = cuenta(ctx(estadoEn('K1', { tipo: 'bienvenida' })), AUDIO(40));
    expect(ids(c.salidas)).toEqual(['ACUSE-1', 'ENTRADA-1', 'K1']);
    const m = { a: 'chico' as const, id: 'K6', texto: 'x', botones: ['Paso'], plantilla: null };
    const d = cuenta(ctx(estadoEn('K5', { tipo: 'retenido', mensajes: [m], luego: preg('K6') })), AUDIO(40));
    expect(ids(d.salidas)).toEqual(['ACUSE-1', 'K6']);
    expect(d.e.fase).toEqual(preg('K6'));
  });

  it('una rama que la pregunta no tiene: error claro', () => {
    const c = ctx(estadoEn('K12', preg('K12', 'Tengo un perro')));
    sumarARafaga(c, AUDIO(30));
    expect(() => procesarRafaga(c)).toThrow('K12: no hay rama "Tengo un perro"');
  });
});
