import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registrarUso } from '../src/costos.js';

// El panel de la empresa lee `consumo_ia` y NO el costos.json: la fábrica tiene que
// anotar en los dos lados. Estos tests cuidan que la fila salga con sus columnas y
// que un fallo de la tabla nueva no se lleve puesto el JSON (ni el libro).

function dbFake(opciones: { insertError?: string | null } = {}) {
  const insertadas: Record<string, unknown>[] = [];
  const subidas: string[] = [];
  const download = vi.fn(async () => ({ data: null, error: { message: 'Object not found' } }));
  const upload = vi.fn(async (ruta: string) => {
    subidas.push(ruta);
    return { data: { path: ruta }, error: null };
  });
  return {
    insertadas,
    subidas,
    db: {
      storage: { from: () => ({ download, upload }) },
      from: (tabla: string) => ({
        insert: async (fila: Record<string, unknown>) => {
          if (tabla !== 'consumo_ia') throw new Error(`tabla inesperada: ${tabla}`);
          insertadas.push(fila);
          return { error: opciones.insertError ? { message: opciones.insertError } : null };
        },
      }),
    },
  };
}

const USO = { input_tokens: 1000, output_tokens: 200, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe('la fábrica anota en consumo_ia', () => {
  it('deja la fila con su paso, su modelo, sus tokens y su costo (y el JSON igual)', async () => {
    const f = dbFake();

    await registrarUso(f.db as never, 'n-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: USO });

    expect(f.insertadas).toHaveLength(1);
    expect(f.insertadas[0]).toMatchObject({
      servicio: 'fabrica', paso: 'capitulo', modelo: 'claude-fable-5', proveedor: 'anthropic',
      narrador_id: 'n-1', input_tokens: 1000, output_tokens: 200, usd: 0.02,
    });
    expect(f.subidas).toHaveLength(1); // el costos.json del narrador sigue escribiéndose
  });

  it('sin uso (un mock sin `usage`) no anota nada, como antes', async () => {
    const f = dbFake();

    await registrarUso(f.db as never, 'n-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: null });

    expect(f.insertadas).toEqual([]);
  });

  it('si consumo_ia no existe (migración sin aplicar) avisa y el JSON se sube igual', async () => {
    const f = dbFake({ insertError: 'Could not find the table public.consumo_ia in the schema cache' });

    await expect(
      registrarUso(f.db as never, 'n-1', { modelo: 'claude-fable-5', paso: 'editor', usage: USO })
    ).resolves.toBeUndefined();

    expect(f.subidas).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
  });

  it('el modelo huérfano (sin precio) anota usd 0 pero deja los tokens', async () => {
    const f = dbFake();

    await registrarUso(f.db as never, 'n-1', { modelo: 'modelo-nuevo', paso: 'capitulo', usage: USO });

    expect(f.insertadas[0]).toMatchObject({ usd: 0, input_tokens: 1000 });
    expect(warn).toHaveBeenCalled();
  });
});
