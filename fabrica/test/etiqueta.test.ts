import { describe, it, expect, vi, beforeEach } from 'vitest';

// La etiqueta del envío se pide en el mismo momento en que el libro sale a la
// imprenta (spec 21/09: "al pasar a `en_produccion`, el sistema crea el envío…").
// Así la imprenta imprime el libro y la etiqueta en la misma pasada.

const { armarLibroDeImprentaMock } = vi.hoisted(() => ({
  armarLibroDeImprentaMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('../src/libro/imprenta.js', async () => {
  const actual = await vi.importActual<typeof import('../src/libro/imprenta.js')>('../src/libro/imprenta.js');
  return { ...actual, armarLibroDeImprenta: armarLibroDeImprentaMock };
});

const { mandarEntregasAImprenta } = await import('../src/entregas.js');

type Fila = {
  id: string;
  narrador_id: string;
  pedido_id?: string;
  estado: string;
  origen?: string | null;
};

function baseFalsa(entregas: Fila[], extras: Record<string, unknown> = { copias: 1, marcos: 2 }) {
  const updates: Record<string, unknown>[] = [];
  const db = {
    from: (tabla: string) => ({
      select: () => ({
        // `eq` se usa de dos formas: con await directo (la lista de entregas) y
        // encadenando `.maybeSingle()` (el pedido). El mock soporta las dos.
        eq: () => {
          const resultado =
            tabla === 'pedidos' ? { data: { extras }, error: null } : { data: entregas, error: null };
          return {
            then: (resolver: (v: unknown) => unknown) => Promise.resolve(resultado).then(resolver),
            maybeSingle: async () => resultado,
          };
        },
      }),
      update: (cambios: Record<string, unknown>) => ({
        eq: async () => {
          updates.push(cambios);
          return { error: null };
        },
      }),
    }),
  };
  return { db: db as never, updates };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.AGREGADOR_ES;
  delete process.env.AGREGADOR_AR;
});

describe('la etiqueta al pasar a producción', () => {
  it('guarda el peso y las medidas junto con el paso a en_produccion', async () => {
    const { db, updates } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', pedido_id: 'p1', estado: 'lista', origen: 'ES' },
    ]);

    await mandarEntregasAImprenta(db);

    expect(updates).toHaveLength(1);
    expect(updates[0].estado).toBe('en_produccion');
    // 1 libro (600) + 2 marcos (800) + caja (150)
    expect(updates[0].peso_g).toBe(1550);
    expect(updates[0].dimensiones).toMatch(/^\d+x\d+x\d+$/);
  });

  it('sin agregador elegido, la etiqueta queda como manual: el envío sale igual', async () => {
    const { db, updates } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', pedido_id: 'p1', estado: 'lista', origen: 'AR' },
    ]);

    await mandarEntregasAImprenta(db);

    expect(updates[0].etiqueta_proveedor).toBe('manual');
    expect(updates[0].etiqueta_url).toBeNull();
  });

  it('un agregador configurado pero sin adaptador todavía no rompe el envío', async () => {
    process.env.AGREGADOR_ES = 'sendcloud';
    const { db, updates } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', pedido_id: 'p1', estado: 'lista', origen: 'ES' },
    ]);

    await mandarEntregasAImprenta(db);

    expect(updates[0].estado).toBe('en_produccion');
    expect(updates[0].etiqueta_proveedor).toBe('manual');
  });

  it('si no se puede leer qué lleva el pedido, el libro igual sale a imprenta', async () => {
    const { db, updates } = baseFalsa(
      [{ id: 'e1', narrador_id: 'n1', estado: 'lista', origen: 'ES' }],
      {}
    );

    await mandarEntregasAImprenta(db);

    // El portón no se frena por la etiqueta: lo importante es que el libro se imprima.
    expect(updates[0].estado).toBe('en_produccion');
    expect(updates[0].peso_g).toBeUndefined();
  });
});
