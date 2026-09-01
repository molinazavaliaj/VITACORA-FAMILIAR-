import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generarEstructuraMock, obtenerClienteDbMock } = vi.hoisted(() => ({
  generarEstructuraMock: vi.fn().mockResolvedValue(undefined),
  obtenerClienteDbMock: vi.fn(),
}));

vi.mock('../src/libro/estructura.js', () => ({
  generarEstructura: generarEstructuraMock,
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
}) {
  return {
    from: vi.fn((tabla: string) => {
      if (tabla === 'narradores') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: opciones.narradores, error: null }),
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
