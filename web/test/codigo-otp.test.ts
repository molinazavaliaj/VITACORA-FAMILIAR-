import { describe, it, expect } from 'vitest';
import { normalizarCodigo, esCodigoCompleto } from '../src/lib/codigo-otp';

describe('normalizarCodigo', () => {
  it('deja pasar un código limpio', () => {
    expect(normalizarCodigo('123456')).toBe('123456');
  });

  it('saca espacios y guiones de un código pegado', () => {
    expect(normalizarCodigo('123 456')).toBe('123456');
    expect(normalizarCodigo(' 123-456 ')).toBe('123456');
  });
});

describe('esCodigoCompleto', () => {
  it('acepta 6 dígitos, con o sin espacios', () => {
    expect(esCodigoCompleto('123456')).toBe(true);
    expect(esCodigoCompleto('123 456')).toBe(true);
  });

  it('acepta códigos de hasta 10 dígitos (Supabase es configurable — un 8 real dejó el botón muerto el 2026-09-05)', () => {
    expect(esCodigoCompleto('14468732')).toBe(true);
    expect(esCodigoCompleto('1234567890')).toBe(true);
  });

  it('rechaza códigos cortos, larguísimos o con letras', () => {
    expect(esCodigoCompleto('12345')).toBe(false);
    expect(esCodigoCompleto('12345678901')).toBe(false);
    expect(esCodigoCompleto('12a456')).toBe(false);
    expect(esCodigoCompleto('')).toBe(false);
  });
});
