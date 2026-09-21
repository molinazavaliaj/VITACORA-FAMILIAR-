import { describe, it, expect, vi, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calcularUsd, calcularUsdPorUnidad, registrarUso } from '../src/costos.js';

/** El doble es del BORDE (el cliente de Supabase), nunca de una función de adentro. */
function dbQueCaptura(capturadas: { tabla: string; fila: Record<string, unknown> }[], error: string | null = null) {
  return {
    from: (tabla: string) => ({
      insert: async (fila: Record<string, unknown>) => {
        capturadas.push({ tabla, fila });
        return { error: error ? { message: error } : null };
      },
    }),
  } as unknown as SupabaseClient;
}

afterEach(() => vi.restoreAllMocks());

describe('calcularUsd', () => {
  it('cobra opus-5 por millón de tokens de entrada y de salida', () => {
    expect(calcularUsd('claude-opus-5', { input_tokens: 1_000_000, output_tokens: 1_000_000 })).toBe(30); // 5 + 25
  });

  it('cobra el caché a la regla de Anthropic (escritura 1,25x, lectura 0,1x)', () => {
    expect(calcularUsd('claude-fable-5', { cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 })).toBe(13.5); // 12,5 + 1
  });

  it('deja el usd en 0 y avisa cuando el modelo no está en la tabla', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(calcularUsd('modelo-desconocido', { input_tokens: 5000 })).toBe(0);
    expect(aviso).toHaveBeenCalledOnce();
  });
});

describe('calcularUsdPorUnidad', () => {
  it('cobra la transcripción por segundo', () => {
    // Medido en GASTOS.md: USD 0,0045 por minuto.
    expect(calcularUsdPorUnidad('gpt-transcribe', 60)).toBeCloseTo(0.0045, 6);
  });
});

describe('registrarUso', () => {
  it('inserta en consumo_ia con los campos que espera el panel', async () => {
    const capturadas: { tabla: string; fila: Record<string, unknown> }[] = [];
    await registrarUso(dbQueCaptura(capturadas), {
      servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5', proveedor: 'anthropic',
      cuenta: 'joaquin', narradorId: 'n-1', uso: { input_tokens: 2000, output_tokens: 300 },
    });
    expect(capturadas).toHaveLength(1);
    expect(capturadas[0].tabla).toBe('consumo_ia');
    expect(capturadas[0].fila).toMatchObject({
      servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5',
      proveedor: 'anthropic', cuenta: 'joaquin', narrador_id: 'n-1',
      input_tokens: 2000, output_tokens: 300, cache_write: 0, cache_read: 0, usd: 0.0175,
    });
  });

  it('anota lo que se cobra por unidad (transcripción) y guarda cantidad y unidad', async () => {
    const capturadas: { tabla: string; fila: Record<string, unknown> }[] = [];
    await registrarUso(dbQueCaptura(capturadas), {
      servicio: 'entrevistador', paso: 'transcribir', modelo: 'gpt-transcribe', proveedor: 'openai',
      cantidad: 191, unidad: 'segundos',
    });
    expect(capturadas[0].fila).toMatchObject({ cantidad: 191, unidad: 'segundos' });
    expect(capturadas[0].fila.usd as number).toBeCloseTo(0.0143, 4);
  });

  it('no inserta nada cuando no hay ni tokens ni unidades (un mock, una respuesta rara)', async () => {
    const capturadas: { tabla: string; fila: Record<string, unknown> }[] = [];
    await registrarUso(dbQueCaptura(capturadas), {
      servicio: 'entrevistador', paso: 'evaluar', modelo: 'claude-opus-5', proveedor: 'anthropic',
    });
    expect(capturadas).toHaveLength(0);
  });

  it('si la tabla no existe (migración sin aplicar) avisa y NO tira', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      registrarUso(dbQueCaptura([], 'Could not find the table public.consumo_ia in the schema cache'), {
        servicio: 'fabrica', paso: 'capitulo', modelo: 'claude-fable-5', proveedor: 'anthropic',
        uso: { input_tokens: 10 },
      })
    ).resolves.toBeUndefined();
    expect(aviso).toHaveBeenCalledOnce();
  });
});
