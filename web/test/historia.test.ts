// Vitácora de una historia en la web (plan 2026-10-21, Task 4.1): temas, validación de la compra e interruptor de venta.
import { describe, expect, it } from 'vitest';
import { HISTORIA_TEMAS, historiaVende, historiaVendeEn, validarHistoria } from '@/lib/historia';

describe('historia en la web', () => {
  it('se vende solo con HISTORIA_VENTA=1', () => {
    expect(historiaVende('ES', {} as NodeJS.ProcessEnv)).toBe(false);
    expect(historiaVende('ES', { HISTORIA_VENTA: '1' } as NodeJS.ProcessEnv)).toBe(true);
    expect(historiaVende('AR', { HISTORIA_VENTA: '0' } as NodeJS.ProcessEnv)).toBe(false);
    expect(historiaVendeEn('ca', { HISTORIA_VENTA: '1' } as NodeJS.ProcessEnv)).toBe(true);
  });
  it('los temas son los de docs/historia/temas.md, en ese orden', () => {
    expect(HISTORIA_TEMAS).toEqual(['mudanza', 'negocio', 'enfermedad', 'conocimos', 'padres', 'trabajo', 'otra']);
  });
  it('tema de la lista', () => {
    expect(validarHistoria({ tema: 'mudanza', preguntasPropias: [] }, { regalo: false })).toEqual({ ok: true, historia: { tema: 'mudanza', preguntasPropias: [] } });
    expect(validarHistoria({ tema: 'viaje', preguntasPropias: [] }, { regalo: false }).ok).toBe(false);
    expect(validarHistoria(null, { regalo: false }).ok).toBe(false);
  });
  it('otra pide el texto, sin espacios de más y con tope', () => {
    expect(validarHistoria({ tema: 'otra', preguntasPropias: [] }, { regalo: false }).ok).toBe(false);
    expect(validarHistoria({ tema: 'otra', temaLibre: '  El campo  ', preguntasPropias: [] }, { regalo: false }))
      .toEqual({ ok: true, historia: { tema: 'otra', temaLibre: 'El campo', preguntasPropias: [] } });
    expect(validarHistoria({ tema: 'otra', temaLibre: 'x'.repeat(121), preguntasPropias: [] }, { regalo: false }).ok).toBe(false);
  });
  it('con un tema de la lista, el texto libre no viaja', () => {
    expect(validarHistoria({ tema: 'negocio', temaLibre: 'algo', preguntasPropias: [] }, { regalo: false }))
      .toEqual({ ok: true, historia: { tema: 'negocio', preguntasPropias: [] } });
  });
  it('tema abierto y propias solo en regalo, hasta 3 de hasta 300 caracteres', () => {
    expect(validarHistoria({ temaAbierto: true, preguntasPropias: [] }, { regalo: false }).ok).toBe(false);
    expect(validarHistoria({ temaAbierto: true, preguntasPropias: [] }, { regalo: true }))
      .toEqual({ ok: true, historia: { tema: 'otra', temaAbierto: true, preguntasPropias: [] } });
    expect(validarHistoria({ tema: 'negocio', preguntasPropias: ['a'] }, { regalo: false }).ok).toBe(false);
    expect(validarHistoria({ tema: 'negocio', preguntasPropias: ['a', 'b', 'c', 'd'] }, { regalo: true }).ok).toBe(false);
    expect(validarHistoria({ tema: 'negocio', preguntasPropias: ['x'.repeat(301)] }, { regalo: true }).ok).toBe(false);
    expect(validarHistoria({ tema: 'negocio', preguntasPropias: [' ¿Qué extrañabas? ', '', 7] }, { regalo: true }))
      .toEqual({ ok: true, historia: { tema: 'negocio', preguntasPropias: ['¿Qué extrañabas?'] } });
  });
});
