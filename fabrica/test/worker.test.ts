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

import { tick } from '../src/worker.js';

function construirClienteDbMock(opciones: {
  narradores: { id: string }[];
  archivosPorNarrador: Record<string, string[]>;
  pedidosPagados?: { id: string; narrador_id: string }[];
  pedidosUpdateMock?: ReturnType<typeof vi.fn>;
}) {
  const pedidosUpdate =
    opciones.pedidosUpdateMock ?? vi.fn().mockResolvedValue({ data: null, error: null });

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
            eq: () => Promise.resolve({ data: opciones.pedidosPagados ?? [], error: null }),
          }),
          update: (valores: Record<string, unknown>) => ({
            eq: (_col: string, id: string) => pedidosUpdate(valores, id),
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
  });

  it('reclama el pedido pagado (estado generando) ANTES de generarPaquete, y lo llama con el pedido', async () => {
    const pedidosUpdateMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const llamadasEnOrden: string[] = [];
    pedidosUpdateMock.mockImplementation((valores: Record<string, unknown>) => {
      llamadasEnOrden.push(`update:${valores.estado}`);
      return Promise.resolve({ data: null, error: null });
    });
    generarPaqueteMock.mockImplementationOnce(async () => {
      llamadasEnOrden.push('generarPaquete');
    });

    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [{ id: 'pedido-1', narrador_id: 'narrador-1' }],
        pedidosUpdateMock,
      })
    );

    await tick();

    expect(pedidosUpdateMock).toHaveBeenCalledWith({ estado: 'generando' }, 'pedido-1');
    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'pedido-1', narrador_id: 'narrador-1' });
    // el claim (update a 'generando') pasa ANTES que generarPaquete — así un
    // segundo tick solapado no vuelve a tomar el mismo pedido.
    expect(llamadasEnOrden).toEqual(['update:generando', 'generarPaquete']);
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
    const pedidosUpdateMock = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'fallo de red' } });

    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [],
        archivosPorNarrador: {},
        pedidosPagados: [{ id: 'pedido-1', narrador_id: 'narrador-1' }],
        pedidosUpdateMock,
      })
    );

    await expect(tick()).resolves.toBeUndefined();

    expect(generarPaqueteMock).not.toHaveBeenCalled();
  });
});
