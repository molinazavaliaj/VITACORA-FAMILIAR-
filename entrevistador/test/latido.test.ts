import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// latido.ts importa el cliente de Supabase (que lee el entorno al importarse),
// así que el entorno se arma ANTES y el módulo se importa adentro del test.
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

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

describe('anotarLatido', () => {
  it('pisa la fila de su servicio con la hora', async () => {
    const { anotarLatido } = await import('../src/latido.js');
    const capturadas: Record<string, unknown>[] = [];

    await anotarLatido('entrevistador', { vuelta: 12 }, dbConUpsert(capturadas));

    expect(capturadas).toHaveLength(1);
    expect(capturadas[0]).toMatchObject({ servicio: 'entrevistador', detalle: { vuelta: 12 } });
    expect(typeof capturadas[0].ultimo_ping).toBe('string');
  });

  it('si no puede latir, avisa y NO tira (el worker no se cae por el latido)', async () => {
    const { anotarLatido } = await import('../src/latido.js');
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(anotarLatido('voz', null, dbConUpsert([], 'fetch failed'))).resolves.toBeUndefined();

    expect(aviso).toHaveBeenCalledOnce();
    aviso.mockRestore();
  });
});
