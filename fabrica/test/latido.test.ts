import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { anotarLatido } from '../src/latido.js';

function dbConUpsert(capturadas: Record<string, unknown>[], error: string | null = null) {
  return {
    from: () => ({
      upsert: async (fila: Record<string, unknown>) => {
        capturadas.push(fila);
        return { error: error ? { message: error } : null };
      },
    }),
  } as unknown as SupabaseClient;
}

describe('anotarLatido de la fábrica', () => {
  it('pisa la fila de su servicio con la hora', async () => {
    const capturadas: Record<string, unknown>[] = [];

    await anotarLatido('fabrica', { pedidos: 2 }, dbConUpsert(capturadas));

    expect(capturadas).toHaveLength(1);
    expect(capturadas[0]).toMatchObject({ servicio: 'fabrica', detalle: { pedidos: 2 } });
    expect(typeof capturadas[0].ultimo_ping).toBe('string');
  });

  it('si la tabla no existe (migración sin aplicar) avisa y NO tira', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      anotarLatido('fabrica', null, dbConUpsert([], 'relation "latidos" does not exist'))
    ).resolves.toBeUndefined();

    expect(aviso).toHaveBeenCalledOnce();
    aviso.mockRestore();
  });
});
