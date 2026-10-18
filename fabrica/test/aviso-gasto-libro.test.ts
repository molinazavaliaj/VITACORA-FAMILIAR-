import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vigilarGastoDelLibro, olvidarAvisosDeGasto } from '../src/aviso-gasto-libro.js';

// El aviso de libro caro (18/10): un libro cuesta USD 3 a 8; pasando USD 20 avisa una
// vez a los socios. Nunca frena el libro.

type Fila = { paso: string; usd: number };
function dbCon(filas: Fila[] | null, error: { message: string } | null = null) {
  const filtros: Array<[string, unknown]> = [];
  const cadena = {
    select: () => cadena,
    eq: (c: string, v: unknown) => {
      filtros.push([c, v]);
      return filtros.length === 2 ? Promise.resolve({ data: filas, error }) : cadena;
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: { from: vi.fn(() => cadena) } as any, filtros };
}

beforeEach(() => olvidarAvisosDeGasto());

describe('vigilarGastoDelLibro', () => {
  it('pasando USD 20 avisa con el total y el desglose, y una sola vez', async () => {
    const { db, filtros } = dbCon([{ paso: 'escritor-A', usd: 12 }, { paso: 'escritor-B', usd: 6 }, { paso: 'escritor-A', usd: 3 }]);
    const avisar = vi.fn(async () => true);
    expect(await vigilarGastoDelLibro(db, 'nar-9', { avisar })).toBe(true);
    expect(await vigilarGastoDelLibro(db, 'nar-9', { avisar })).toBe(false);
    expect(avisar).toHaveBeenCalledTimes(1);
    const [asunto, texto] = avisar.mock.calls[0] as unknown as [string, string];
    expect(asunto).toContain('USD 20');
    expect(texto).toContain('USD 21.00');
    expect(texto).toContain('escritor-A: USD 15.00');
    expect(texto).toContain('El libro sigue');
    expect(filtros).toEqual([['servicio', 'fabrica'], ['narrador_id', 'nar-9']]);
  });

  it('un libro normal no avisa', async () => {
    const avisar = vi.fn(async () => true);
    expect(await vigilarGastoDelLibro(dbCon([{ paso: 'escritor-A', usd: 5 }, { paso: 'escritor-C', usd: 2.5 }]).db, 'nar-9', { avisar })).toBe(false);
    expect(avisar).not.toHaveBeenCalled();
  });

  it('una base que falla o tira no rompe el libro', async () => {
    const avisar = vi.fn(async () => true);
    expect(await vigilarGastoDelLibro(dbCon(null, { message: 'caída' }).db, 'nar-9', { avisar })).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(await vigilarGastoDelLibro({ from: () => { throw new Error('boom'); } } as any, 'nar-9', { avisar })).toBe(false);
    expect(avisar).not.toHaveBeenCalled();
  });
});
