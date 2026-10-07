// fabrica/test/escritor/configuracion.test.ts
// La configuración económica (Naza, 07/10/2026): qué modelo y cuánto pensamiento lleva cada llamada.
import { describe, expect, it } from 'vitest';
import { cacheDeUnaHora, HAIKU, maxSalidaDe, OPUS, rolDe } from '../../src/escritor/modelo/configuracion.js';

describe('rolDe: modelo y pensamiento por llamada', () => {
  it('el capítulo y la primera página: Opus con pensamiento al máximo (xhigh)', () => {
    for (const n of ['3b-capitulo-01', '3b-capitulo-12', '3a-primera']) expect(rolDe(n)).toEqual({ modelo: OPUS, maxTokens: 128000, esfuerzo: 'xhigh' });
  });

  it('lo demás que escribe o revisa con Opus: pensamiento medio', () => {
    for (const n of ['1-registro', '2-plan', '2h-armador-03', '3c-carta', '3d-antes-de-cerrar', '5c-veedor', '6-arreglo-cap_2', '6-arreglo-primera_pagina', 'disputa-cap_1-1']) {
      expect(rolDe(n)).toEqual({ modelo: OPUS, maxTokens: 64000, esfuerzo: 'medium' });
    }
  });

  it('los hechos y su repaso: Opus medio, con 128.000 de salida desde el primer pedido', () => {
    for (const n of ['4-hechos', '4-hechos-repaso']) expect(rolDe(n)).toEqual({ modelo: OPUS, maxTokens: 128000, esfuerzo: 'medium' });
  });

  it('lo mecánico va con Haiku 4.5: sin niveles de esfuerzo (no los acepta), con un presupuesto chico de pensamiento', () => {
    expect(rolDe('7-estilo-cap_1')).toEqual({ modelo: HAIKU, maxTokens: 64000, pensamiento: 3000 });
    expect(rolDe('7-estilo-carta-2')).toEqual({ modelo: HAIKU, maxTokens: 64000, pensamiento: 3000 });
    for (const n of ['3r-resumen-cap_1', '3r-resumen-primera_pagina', '3t-titulo-04', '3e-sus-frases', 'correccion-registro', 'correccion-plan', 'dudas']) {
      const r = rolDe(n);
      expect(r).toEqual({ modelo: HAIKU, maxTokens: 64000, pensamiento: 8000 });
      expect(r.esfuerzo).toBeUndefined();
    }
  });

  it('una llamada sin rol conocido va con Opus medio (no se abarata nada por descuido)', () => {
    expect(rolDe('algo-nuevo')).toEqual({ modelo: OPUS, maxTokens: 64000, esfuerzo: 'medium' });
  });

  it('el presupuesto de pensamiento de Haiku entra en su salida', () => {
    const h = rolDe('7-estilo-cap_1');
    expect(h.pensamiento).toBeLessThan(h.maxTokens);
    expect(h.maxTokens).toBeLessThanOrEqual(maxSalidaDe(HAIKU));
  });
});

describe('maxSalidaDe', () => {
  it('Opus 5.5 y Sonnet 5.5 sacan hasta 128.000; Haiku 4.5, 64.000', () => {
    expect(maxSalidaDe(OPUS)).toBe(128000);
    expect(maxSalidaDe('claude-sonnet-5-5')).toBe(128000);
    expect(maxSalidaDe(HAIKU)).toBe(64000);
  });
  it('un modelo desconocido corta (si no, un reintento podría pedir más de lo que el modelo da)', () => {
    expect(() => maxSalidaDe('claude-desconocido')).toThrow(/máximo de salida/);
  });
});

describe('cacheDeUnaHora', () => {
  it('los hechos, el repaso y las disputas comparten la caché de 1 hora; el resto, la de 5 minutos', () => {
    for (const n of ['4-hechos', '4-hechos-repaso', 'disputa-cap_1-1']) expect(cacheDeUnaHora(n)).toBe(true);
    for (const n of ['3b-capitulo-01', '1-registro', '7-estilo-cap_1', '5c-veedor']) expect(cacheDeUnaHora(n)).toBe(false);
  });
});

describe('perfiles eco-alto y eco-medio (prueba del 07/10)', () => {
  it('solo cambian el capítulo; la primera página y lo demás quedan como en eco', () => {
    expect(rolDe('3b-capitulo-06', 'eco-alto')).toEqual({ modelo: OPUS, maxTokens: 128000, esfuerzo: 'high' });
    expect(rolDe('3b-capitulo-06', 'eco-medio')).toEqual({ modelo: OPUS, maxTokens: 128000, esfuerzo: 'medium' });
    for (const n of ['3a-primera', '2h-armador-06', '4-hechos', '7-estilo-cap_6']) for (const p of ['eco-alto', 'eco-medio'] as const) expect(rolDe(n, p)).toEqual(rolDe(n));
  });
});
