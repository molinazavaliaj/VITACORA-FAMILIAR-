import { describe, it, expect, vi, beforeEach } from 'vitest';

// El paso del tick que abre el portón: recorre las entregas que ya tienen dirección
// y, para las que además tienen las frases confirmadas, arma el libro de imprenta y
// las pasa a `en_produccion` (CONTRATO, sección Entregas: `lista → en_produccion` lo
// escribe la fábrica).

const { armarLibroDeImprentaMock } = vi.hoisted(() => ({
  armarLibroDeImprentaMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('../src/libro/imprenta.js', async () => {
  const actual = await vi.importActual<typeof import('../src/libro/imprenta.js')>('../src/libro/imprenta.js');
  return { ...actual, armarLibroDeImprenta: armarLibroDeImprentaMock };
});

const { mandarEntregasAImprenta } = await import('../src/entregas.js');

type Fila = { id: string; narrador_id: string; estado: string };

/** Base de mentira: devuelve las entregas pedidas y anota los updates. */
function baseFalsa(entregas: Fila[], opciones: { errorAlLeer?: string } = {}) {
  const updates: { id: string; cambios: Record<string, unknown> }[] = [];
  const db = {
    from: () => ({
      select: () => ({
        eq: async (_columna: string, _valor: string) =>
          opciones.errorAlLeer
            ? { data: null, error: { message: opciones.errorAlLeer } }
            : { data: entregas, error: null },
      }),
      update: (cambios: Record<string, unknown>) => ({
        eq: async (_columna: string, id: string) => {
          updates.push({ id, cambios });
          return { error: null };
        },
      }),
    }),
  };
  return { db: db as never, updates };
}

beforeEach(() => vi.clearAllMocks());

describe('mandarEntregasAImprenta', () => {
  it('con las frases confirmadas, arma el libro y pasa la entrega a en_produccion', async () => {
    const { db, updates } = baseFalsa([{ id: 'e1', narrador_id: 'n1', estado: 'lista' }]);

    await mandarEntregasAImprenta(db);

    expect(armarLibroDeImprentaMock).toHaveBeenCalledWith(db, 'n1');
    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe('e1');
    expect(updates[0].cambios.estado).toBe('en_produccion');
    expect(typeof updates[0].cambios.produccion_at).toBe('string');
  });

  it('si todavía no confirmaron las frases, la entrega se queda esperando', async () => {
    armarLibroDeImprentaMock.mockResolvedValueOnce(false);
    const { db, updates } = baseFalsa([{ id: 'e1', narrador_id: 'n1', estado: 'lista' }]);

    await mandarEntregasAImprenta(db);

    expect(updates).toHaveLength(0);
  });

  it('una entrega que falla no frena a las demás', async () => {
    armarLibroDeImprentaMock
      .mockRejectedValueOnce(new Error('Storage caído'))
      .mockResolvedValueOnce(true);
    const { db, updates } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', estado: 'lista' },
      { id: 'e2', narrador_id: 'n2', estado: 'lista' },
    ]);

    await mandarEntregasAImprenta(db);

    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe('e2');
  });

  it('sin la tabla `entregas` aplicada, el tick no se cae', async () => {
    const { db, updates } = baseFalsa([], { errorAlLeer: 'relation "entregas" does not exist' });

    await expect(mandarEntregasAImprenta(db)).resolves.toBeUndefined();
    expect(updates).toHaveLength(0);
    expect(armarLibroDeImprentaMock).not.toHaveBeenCalled();
  });

  it('sin entregas con dirección cargada, no toca nada', async () => {
    const { db, updates } = baseFalsa([]);

    await mandarEntregasAImprenta(db);

    expect(armarLibroDeImprentaMock).not.toHaveBeenCalled();
    expect(updates).toHaveLength(0);
  });
});
