import { describe, it, expect } from 'vitest';
import { MODELO_PREGUNTA, MODELO_FICHA, MODELO_EVALUACION, MODELO_PEDIDOS, modeloDePaso } from '../src/ia/modelos-v2.js';
import { PRECIOS_USD_POR_MILLON } from '../src/costos.js';

describe('modelos del esqueleto v2 (decisión de Naza, 24/09)', () => {
  it('Opus escribe; Sonnet lee la ficha y evalúa; Haiku solo mira pedidos', () => {
    expect(MODELO_PREGUNTA).toBe('claude-opus-5');
    expect(MODELO_FICHA).toBe('claude-sonnet-5');
    expect(MODELO_EVALUACION).toBe('claude-sonnet-5');
    expect(MODELO_PEDIDOS).toBe('claude-haiku-4-5');
  });
  it('cada paso tiene su modelo y todos tienen precio cargado', () => {
    expect(modeloDePaso('v2-pregunta')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-repregunta')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-presentacion')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-objeto')).toBe(MODELO_PREGUNTA);
    expect(modeloDePaso('v2-perfil')).toBe(MODELO_FICHA);
    expect(modeloDePaso('v2-evaluar')).toBe(MODELO_EVALUACION);
    expect(modeloDePaso('v2-pedidos')).toBe(MODELO_PEDIDOS);
    for (const m of [MODELO_PREGUNTA, MODELO_FICHA, MODELO_EVALUACION, MODELO_PEDIDOS]) expect(PRECIOS_USD_POR_MILLON[m]).toBeDefined();
  });
});
