import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vigilarGastoDelDia } from '../src/aviso-gasto.js';

// El aviso de gasto raro (18/10): el 24/09 un narrador gastó USD 11 de IA en un día
// y nadie se enteró. Avisa al cruzar USD 2 por narrador por día; nunca corta nada.

type Fila = { paso: string; usd: number };
function dbCon(filas: Fila[] | null, error: { message: string } | null = null) {
  const filtros: Array<[string, string, unknown]> = [];
  const cadena = {
    select: () => cadena,
    eq: (c: string, v: unknown) => { filtros.push(['eq', c, v]); return cadena; },
    gte: (c: string, v: unknown) => { filtros.push(['gte', c, v]); return Promise.resolve({ data: filas, error }); },
  };
  return { db: { from: vi.fn(() => cadena) } as unknown as SupabaseClient, filtros };
}

const ahora = new Date('2026-10-18T15:00:00Z');

describe('vigilarGastoDelDia', () => {
  it('la llamada que cruza USD 2 avisa una vez, con el total y el desglose', async () => {
    const { db, filtros } = dbCon([{ paso: 'cazador', usd: 1.5 }, { paso: 'respuesta', usd: 0.3 }, { paso: 'cazador', usd: 0.4 }]);
    const avisar = vi.fn(async () => true);
    expect(await vigilarGastoDelDia(db, 'nar-1', { ahora, avisar })).toBe(true);
    expect(avisar).toHaveBeenCalledTimes(1);
    const [clave, asunto, detalle] = avisar.mock.calls[0] as unknown as [string, string, string];
    expect(clave).toBe('gasto-dia:nar-1');
    expect(asunto).toContain('USD 2');
    expect(detalle).toContain('USD 2.20');
    expect(detalle).toContain('cazador: USD 1.90');
    expect(detalle).toContain('solo un aviso');
    expect(filtros).toEqual([
      ['eq', 'servicio', 'entrevistador'], ['eq', 'narrador_id', 'nar-1'], ['gte', 'fecha', '2026-10-18T00:00:00Z'],
    ]);
  });

  it('por debajo del tope no avisa', async () => {
    const { db } = dbCon([{ paso: 'respuesta', usd: 0.05 }, { paso: 'respuesta', usd: 0.04 }]);
    const avisar = vi.fn(async () => true);
    expect(await vigilarGastoDelDia(db, 'nar-1', { ahora, avisar })).toBe(false);
    expect(avisar).not.toHaveBeenCalled();
  });

  it('arriba del tope avisa con la misma clave del día (avisarSocios no la repite)', async () => {
    const { db } = dbCon([{ paso: 'cazador', usd: 3 }, { paso: 'respuesta', usd: 0.1 }]);
    const avisar = vi.fn(async () => false);
    await vigilarGastoDelDia(db, 'nar-1', { ahora, avisar });
    await vigilarGastoDelDia(db, 'nar-1', { ahora, avisar });
    expect(avisar.mock.calls.map((c) => (c as unknown as string[])[0])).toEqual(['gasto-dia:nar-1', 'gasto-dia:nar-1']);
  });

  it('una base que falla o tira no rompe nada', async () => {
    const avisar = vi.fn(async () => true);
    expect(await vigilarGastoDelDia(dbCon(null, { message: 'caída' }).db, 'nar-1', { ahora, avisar })).toBe(false);
    const rota = { from: () => { throw new Error('boom'); } } as unknown as SupabaseClient;
    expect(await vigilarGastoDelDia(rota, 'nar-1', { ahora, avisar })).toBe(false);
    expect(avisar).not.toHaveBeenCalled();
  });
});
