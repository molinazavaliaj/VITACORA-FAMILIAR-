import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generarEstructuraMock, generarPrevisualizacionMock, generarPaqueteMock, obtenerClienteDbMock } = vi.hoisted(() => ({
  generarEstructuraMock: vi.fn().mockResolvedValue(undefined),
  generarPrevisualizacionMock: vi.fn().mockResolvedValue(undefined),
  generarPaqueteMock: vi.fn().mockResolvedValue(undefined),
  obtenerClienteDbMock: vi.fn(),
}));

vi.mock('../src/libro/estructura.js', () => ({
  generarEstructura: generarEstructuraMock,
}));

vi.mock('../src/libro/previsualizar.js', () => ({
  generarPrevisualizacion: generarPrevisualizacionMock,
}));

vi.mock('../src/libro/generar-paquete.js', () => ({
  generarPaquete: generarPaqueteMock,
}));

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return {
    ...actual,
    obtenerClienteDb: obtenerClienteDbMock,
  };
});

import { tick, procesarPedidosPagados } from '../src/worker.js';

/**
 * Fake de `db.from('pedidos')` que distingue las dos consultas por `estado`
 * ('pagado' para el branch normal, 'generando' para el chequeo de
 * huérfanos), y las dos formas de `update`:
 *   - el claim CAS: `.update({estado:'generando'}).eq('id',x).eq('estado','pagado').select('id')`
 *   - el reset de huérfanos: `.update({estado:'pagado'}).eq('id',x).eq('estado','generando')` (sin `.select`)
 * `claimarPedido`/`resetearPedidoHuerfano` son fixtures por test — devuelven
 * `{ data, error }` para cada llamada, como el resto de los fakes del repo.
 */
function construirClienteDbMock(opciones: {
  narradores: { id: string }[];
  archivosPorNarrador: Record<string, string[]>;
  pedidosPagados?: { id: string; narrador_id: string }[];
  pedidosGenerando?: { id: string }[];
  claimarPedido?: (id: string) => { data: unknown; error: unknown };
  resetearPedidoHuerfano?: (id: string) => { data: unknown; error: unknown };
}) {
  const claimarPedido = opciones.claimarPedido ?? ((id: string) => ({ data: [{ id }], error: null }));
  const resetearPedidoHuerfano = opciones.resetearPedidoHuerfano ?? (() => ({ data: null, error: null }));

  return {
    from: vi.fn((tabla: string) => {
      if (tabla === 'narradores') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: opciones.narradores, error: null }),
          }),
        };
      }
      if (tabla === 'pedidos') {
        return {
          select: () => ({
            eq: (_col: string, valor: string) => {
              if (valor === 'pagado') return Promise.resolve({ data: opciones.pedidosPagados ?? [], error: null });
              if (valor === 'generando') return Promise.resolve({ data: opciones.pedidosGenerando ?? [], error: null });
              return Promise.resolve({ data: [], error: null });
            },
          }),
          update: (valores: Record<string, unknown>) => ({
            eq: (_c1: string, id: string) => ({
              eq: (_c2: string, _estadoEsperado: string) => {
                if (valores.estado === 'generando') {
                  // el claim CAS siempre termina en .select('id')
                  return { select: (_cols: string) => Promise.resolve(claimarPedido(id)) };
                }
                // el reset de huérfanos no encadena .select()
                return Promise.resolve(resetearPedidoHuerfano(id));
              },
            }),
          }),
        };
      }
      throw new Error(`tabla no mockeada en el test: ${tabla}`);
    }),
    storage: {
      from: () => ({
        list: (path: string) => {
          const narradorId = path.split('/')[0];
          const nombres = opciones.archivosPorNarrador[narradorId] ?? [];
          return Promise.resolve({ data: nombres.map((name) => ({ name })), error: null });
        },
      }),
    },
  };
}

describe('tick', () => {
  beforeEach(() => {
    generarEstructuraMock.mockClear();
    generarPrevisualizacionMock.mockClear();
  });

  it('genera la estructura para un narrador completado sin estructura.json en Storage', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }],
        archivosPorNarrador: {},
      })
    );

    await tick();

    expect(generarEstructuraMock).toHaveBeenCalledTimes(1);
    expect(generarEstructuraMock).toHaveBeenCalledWith('narrador-1');
  });

  it('no genera la estructura si estructura.json ya existe en Storage', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }],
        archivosPorNarrador: { 'narrador-1': ['estructura.json'] },
      })
    );

    await tick();

    expect(generarEstructuraMock).not.toHaveBeenCalled();
  });

  it('no se solapa si ya hay un tick corriendo', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }],
        archivosPorNarrador: {},
      })
    );

    // `corriendo` se pone en true de forma síncrona al entrar a tick(), antes
    // de cualquier await — así que llamar tick() de nuevo sin esperar el
    // primero debe no-opear el segundo llamado.
    const primerTick = tick();
    const segundoTick = tick();
    await Promise.all([primerTick, segundoTick]);

    expect(generarEstructuraMock).toHaveBeenCalledTimes(1);
  });
});

describe('tick — branch a2 (previsualización)', () => {
  beforeEach(() => {
    generarEstructuraMock.mockClear();
    generarPrevisualizacionMock.mockClear();
  });

  it('genera la previsualización si tiene estructura.json y nombres.json pero no preview.pdf', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }],
        archivosPorNarrador: { 'narrador-1': ['estructura.json', 'nombres.json'] },
      })
    );

    await tick();

    expect(generarPrevisualizacionMock).toHaveBeenCalledTimes(1);
    expect(generarPrevisualizacionMock).toHaveBeenCalledWith('narrador-1');
  });

  it('no genera la previsualización si preview.pdf ya existe', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }],
        archivosPorNarrador: { 'narrador-1': ['estructura.json', 'nombres.json', 'preview.pdf'] },
      })
    );

    await tick();

    expect(generarPrevisualizacionMock).not.toHaveBeenCalled();
  });

  it('no genera la previsualización si falta nombres.json (aunque tenga estructura.json)', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }],
        archivosPorNarrador: { 'narrador-1': ['estructura.json'] },
      })
    );

    await tick();

    expect(generarPrevisualizacionMock).not.toHaveBeenCalled();
  });

  it('no genera la previsualización si falta estructura.json', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }],
        archivosPorNarrador: {},
      })
    );

    await tick();

    expect(generarPrevisualizacionMock).not.toHaveBeenCalled();
  });

  it('un narrador falla generando la previsualización sin frenar el tick (try/catch por narrador)', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [{ id: 'narrador-1' }, { id: 'narrador-2' }],
        archivosPorNarrador: {
          'narrador-1': ['estructura.json', 'nombres.json'],
          'narrador-2': ['estructura.json', 'nombres.json'],
        },
      })
    );
    generarPrevisualizacionMock.mockRejectedValueOnce(new Error('playwright reventó'));

    await expect(tick()).resolves.toBeUndefined();

    expect(generarPrevisualizacionMock).toHaveBeenCalledTimes(2);
  });
});

describe('tick — branch b (pedidos pagados)', () => {
  beforeEach(() => {
    generarPaqueteMock.mockClear();
    generarPaqueteMock.mockResolvedValue(undefined);
  });

  it('reclama el pedido pagado con compare-and-swap ANTES de generarPaquete, y lo llama con el pedido', async () => {
    const llamadasEnOrden: string[] = [];
    const claimarPedido = (id: string) => {
      llamadasEnOrden.push(`claim:${id}`);
      return { data: [{ id }], error: null };
    };
    generarPaqueteMock.mockImplementationOnce(async (pedido: { id: string }) => {
      llamadasEnOrden.push(`generarPaquete:${pedido.id}`);
    });

    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [{ id: 'pedido-1', narrador_id: 'narrador-1' }],
        claimarPedido,
      })
    );

    await tick();

    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'pedido-1', narrador_id: 'narrador-1' });
    // el claim (CAS a 'generando') pasa ANTES que generarPaquete — así un
    // segundo tick solapado no vuelve a tomar el mismo pedido.
    expect(llamadasEnOrden).toEqual(['claim:pedido-1', 'generarPaquete:pedido-1']);
  });

  it('sin pedidos pagados, no llama a generarPaquete', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [],
      })
    );

    await tick();

    expect(generarPaqueteMock).not.toHaveBeenCalled();
  });

  it('procesa varios pedidos pagados, cada uno reclamado y pasado a generarPaquete', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [
          { id: 'pedido-1', narrador_id: 'narrador-1' },
          { id: 'pedido-2', narrador_id: 'narrador-2' },
        ],
      })
    );

    await tick();

    expect(generarPaqueteMock).toHaveBeenCalledTimes(2);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'pedido-1', narrador_id: 'narrador-1' });
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'pedido-2', narrador_id: 'narrador-2' });
  });

  it('si falla el claim (update) de un pedido, no llama a generarPaquete para ese pedido', async () => {
    const claimarPedido = () => ({ data: null, error: { message: 'fallo de red' } });

    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [{ id: 'pedido-1', narrador_id: 'narrador-1' }],
        claimarPedido,
      })
    );

    await expect(tick()).resolves.toBeUndefined();

    expect(generarPaqueteMock).not.toHaveBeenCalled();
  });

  // --- I4: el claim es compare-and-swap, no un update ciego -------------

  it('si el CAS no devuelve ninguna fila (ya reclamado por otro proceso), no llama a generarPaquete', async () => {
    const claimarPedido = () => ({ data: [], error: null });

    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [{ id: 'pedido-1', narrador_id: 'narrador-1' }],
        claimarPedido,
      })
    );

    await procesarPedidosPagados();

    expect(generarPaqueteMock).not.toHaveBeenCalled();
  });

  // --- C3: pedidos huérfanos en 'generando' ------------------------------

  it('un pedido huérfano en generando (no reclamado por este proceso) se resetea a pagado', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const resetearPedidoHuerfano = vi.fn().mockReturnValue({ data: null, error: null });

    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosGenerando: [{ id: 'pedido-huerfano' }],
        resetearPedidoHuerfano,
      })
    );

    await procesarPedidosPagados();

    expect(resetearPedidoHuerfano).toHaveBeenCalledWith('pedido-huerfano');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('un pedido en generando reclamado por ESTE proceso (mid-run) no se resetea', async () => {
    let avisarLlamado!: () => void;
    let resolverGenerarPaquete!: () => void;
    const generarPaqueteInvocado = new Promise<void>((resolve) => {
      avisarLlamado = resolve;
    });
    const generarPaquetePendiente = new Promise<void>((resolve) => {
      resolverGenerarPaquete = resolve;
    });
    generarPaqueteMock.mockImplementationOnce(async () => {
      avisarLlamado();
      await generarPaquetePendiente;
    });

    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [{ id: 'pedido-1', narrador_id: 'narrador-1' }],
      })
    );

    // Primera "instancia": reclama pedido-1 y se queda a mitad de
    // generarPaquete (todavía no resolvió) — pedido-1 sigue en el Set de
    // este proceso mientras tanto.
    const primeraLlamada = procesarPedidosPagados();
    await generarPaqueteInvocado;

    // Segunda "instancia" (simula el tick siguiente): en la base, pedido-1
    // sigue en 'generando' — pero como sigue en el Set de este proceso, el
    // chequeo de huérfanos NO debe tocarlo.
    const resetearPedidoHuerfano = vi.fn().mockReturnValue({ data: null, error: null });
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [],
        pedidosGenerando: [{ id: 'pedido-1' }],
        resetearPedidoHuerfano,
      })
    );

    await procesarPedidosPagados();

    expect(resetearPedidoHuerfano).not.toHaveBeenCalled();

    resolverGenerarPaquete();
    await primeraLlamada;
  });
});
