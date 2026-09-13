import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { generarEstructuraMock, generarPrevisualizacionMock, generarPaqueteMock, enviarMailHitoMock, obtenerClienteDbMock } =
  vi.hoisted(() => ({
    generarEstructuraMock: vi.fn().mockResolvedValue(undefined),
    generarPrevisualizacionMock: vi.fn().mockResolvedValue(undefined),
    generarPaqueteMock: vi.fn().mockResolvedValue(undefined),
    enviarMailHitoMock: vi.fn().mockResolvedValue(true),
    obtenerClienteDbMock: vi.fn(),
  }));

vi.mock('../src/mail/hitos.js', async () => {
  const actual = await vi.importActual<typeof import('../src/mail/hitos.js')>('../src/mail/hitos.js');
  return { ...actual, enviarMailHito: enviarMailHitoMock };
});

vi.mock('../src/config.js', () => ({
  cargarConfig: () => ({ urlBase: 'https://www.vitacorafamiliar.com', resendApiKey: 'x' }),
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
import { CANDADO_POR_HITO } from '../src/mail/hitos.js';

/**
 * Fake de `db.from('pedidos')` que distingue las consultas por `estado`
 * ('pagado' para el branch normal, 'generando' para el chequeo de
 * huérfanos, 'entregado' para el mail de libro listo), y las dos formas de
 * `update`:
 *   - el claim CAS: `.update({estado:'generando'}).eq('id',x).eq('estado','pagado').select('id')`
 *   - el reset de huérfanos: `.update({estado:'pagado'}).eq('id',x).eq('estado','generando')` (sin `.select`)
 * `claimarPedido`/`resetearPedidoHuerfano` son fixtures por test — devuelven
 * `{ data, error }` para cada llamada, como el resto de los fakes del repo.
 *
 * Para los mails de hitos: `familias` devuelve `{ email }` por id (sin la
 * opción, cualquier familia tiene un mail; con ella, las que faltan fallan),
 * el cierre automático `narradores.update({libro_aprobado_at}).eq('id').is(...).select('id')`
 * se registra en `cierresAutomaticos` y responde con `cerrarSolo`, y
 * `storage.upload` anota el candado en `subidos` Y en `archivosPorNarrador`
 * (así un candado subido en un tick aparece en el `list` del siguiente).
 */
function construirClienteDbMock(opciones: {
  narradores: { id: string; [columna: string]: unknown }[];
  archivosPorNarrador: Record<string, string[]>;
  familias?: Record<string, string>;
  pedidosPagados?: { id: string; narrador_id: string }[];
  pedidosGenerando?: { id: string }[];
  pedidosEntregados?: { id: string; narrador_id: string }[];
  claimarPedido?: (id: string) => { data: unknown; error: unknown };
  resetearPedidoHuerfano?: (id: string) => { data: unknown; error: unknown };
  cerrarSolo?: (id: string) => { data: unknown; error: unknown };
}) {
  const claimarPedido = opciones.claimarPedido ?? ((id: string) => ({ data: [{ id }], error: null }));
  const resetearPedidoHuerfano = opciones.resetearPedidoHuerfano ?? (() => ({ data: null, error: null }));
  const cerrarSolo = opciones.cerrarSolo ?? ((id: string) => ({ data: [{ id }], error: null }));
  const cierresAutomaticos: string[] = [];
  const subidos: Record<string, string[]> = {};

  return {
    cierresAutomaticos,
    subidos,
    from: vi.fn((tabla: string) => {
      if (tabla === 'narradores') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: opciones.narradores, error: null }),
            eq: (_col: string, id: string) => ({
              single: () => {
                const narrador = opciones.narradores.find((n) => n.id === id);
                return Promise.resolve(
                  narrador ? { data: narrador, error: null } : { data: null, error: { message: 'no existe' } }
                );
              },
            }),
          }),
          update: (_valores: Record<string, unknown>) => ({
            eq: (_c1: string, id: string) => ({
              is: (_c2: string, _nulo: null) => ({
                select: (_cols: string) => {
                  cierresAutomaticos.push(id);
                  return Promise.resolve(cerrarSolo(id));
                },
              }),
            }),
          }),
        };
      }
      if (tabla === 'familias') {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              single: () => {
                const email = opciones.familias ? opciones.familias[id] : 'familia@ejemplo.com';
                return Promise.resolve(
                  email ? { data: { email }, error: null } : { data: null, error: { message: 'no existe' } }
                );
              },
            }),
          }),
        };
      }
      if (tabla === 'pedidos') {
        return {
          select: () => ({
            eq: (_col: string, valor: string) => {
              if (valor === 'pagado') return Promise.resolve({ data: opciones.pedidosPagados ?? [], error: null });
              if (valor === 'generando') return Promise.resolve({ data: opciones.pedidosGenerando ?? [], error: null });
              if (valor === 'entregado') return Promise.resolve({ data: opciones.pedidosEntregados ?? [], error: null });
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
        upload: (ruta: string, _contenido: string, _opts: unknown) => {
          const [narradorId, , nombre] = ruta.split('/');
          (opciones.archivosPorNarrador[narradorId] ??= []).push(nombre);
          (subidos[narradorId] ??= []).push(nombre);
          return Promise.resolve({ data: null, error: null });
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
        narradores: [
          { id: 'narrador-1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
          { id: 'narrador-2', estado: 'completado' },
        ],
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

  it('un pedido pagado cuyo narrador terminó pero NO cerró el libro (sin libro_aprobado_at) no se reclama ni se genera', async () => {
    const claimarPedido = vi.fn((id: string) => ({ data: [{ id }], error: null }));
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', estado: 'completado', libro_aprobado_at: null }],
      archivosPorNarrador: {},
      pedidosPagados: [{ id: 'p1', narrador_id: 'n1' }],
      claimarPedido,
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(claimarPedido).not.toHaveBeenCalled();
    expect(generarPaqueteMock).not.toHaveBeenCalled();
  });

  it('un pedido pagado cuyo narrador cerró el libro (libro_aprobado_at) se reclama y se genera', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' }],
      archivosPorNarrador: {},
      pedidosPagados: [{ id: 'p1', narrador_id: 'n1' }],
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'p1', narrador_id: 'n1' });
  });

  it('con dos pedidos pagados, genera solo el del narrador que cerró el libro', async () => {
    const claimarPedido = vi.fn((id: string) => ({ data: [{ id }], error: null }));
    const db = construirClienteDbMock({
      narradores: [
        { id: 'n1', estado: 'completado', libro_aprobado_at: null },
        { id: 'n2', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
      ],
      archivosPorNarrador: {},
      pedidosPagados: [
        { id: 'p1', narrador_id: 'n1' },
        { id: 'p2', narrador_id: 'n2' },
      ],
      claimarPedido,
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    // El claim (CAS) se intenta solo para p2 — p1 ni siquiera llega a esa etapa.
    expect(claimarPedido).toHaveBeenCalledTimes(1);
    expect(claimarPedido).toHaveBeenCalledWith('p2');
    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'p2', narrador_id: 'n2' });
  });

  it('sin pedidos pagados, no llama a generarPaquete', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({
        narradores: [
          { id: 'narrador-1', estado: 'completado' },
          { id: 'narrador-2', estado: 'completado' },
        ],
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
        narradores: [
          { id: 'narrador-1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
          { id: 'narrador-2', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
        ],
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
        narradores: [
          { id: 'narrador-1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
          { id: 'narrador-2', estado: 'completado' },
        ],
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
        narradores: [
          { id: 'narrador-1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
          { id: 'narrador-2', estado: 'completado' },
        ],
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
        narradores: [
          { id: 'narrador-1', estado: 'completado' },
          { id: 'narrador-2', estado: 'completado' },
        ],
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
        narradores: [
          { id: 'narrador-1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
          { id: 'narrador-2', estado: 'completado' },
        ],
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
        narradores: [
          { id: 'narrador-1', estado: 'completado' },
          { id: 'narrador-2', estado: 'completado' },
        ],
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

describe('tick — mails de hitos', () => {
  // "Hoy" fijo para que los días desde `ultima_respuesta_at` sean exactos.
  const HOY = new Date('2026-09-20T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(HOY);
    enviarMailHitoMock.mockClear();
    enviarMailHitoMock.mockResolvedValue(true);
    generarEstructuraMock.mockClear();
    generarPrevisualizacionMock.mockClear();
    generarPaqueteMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const hitosEnviados = () => enviarMailHitoMock.mock.calls.map((llamada) => (llamada[0] as { hito: string }).hito);

  it('narrador completado sin terminado_enviado.txt → manda "terminado" y deja el candado', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-09-19T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: {},
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(enviarMailHitoMock).toHaveBeenCalledTimes(1);
    expect(enviarMailHitoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hito: 'terminado',
        para: 'a@b.c',
        comoLeDicen: 'papá',
        enlace: expect.stringContaining('/tablero/n1'),
      })
    );
    expect(db.subidos['n1']).toContain('terminado_enviado.txt');
  });

  it('con terminado_enviado.txt ya presente, no lo manda de nuevo', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-09-19T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
    expect(db.subidos['n1'] ?? []).not.toContain('terminado_enviado.txt');
  });

  it('si enviarMailHito devuelve false (sin clave), no deja candado', async () => {
    enviarMailHitoMock.mockResolvedValueOnce(false);
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-09-19T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: {},
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(hitosEnviados()).toEqual(['terminado']);
    expect(db.subidos['n1'] ?? []).not.toContain('terminado_enviado.txt');
  });

  it('a los 3 días sin libro_aprobado_at manda recordatorio_3; a los 2, nada', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          // 3 días exactos antes de HOY → recordatorio_3
          ultima_respuesta_at: '2026-09-17T12:00:00Z',
          libro_aprobado_at: null,
        },
        {
          id: 'n2',
          estado: 'completado',
          como_le_dicen: 'la abuela',
          familia_id: 'f2',
          // menos de 3 días → ningún recordatorio
          ultima_respuesta_at: '2026-09-18T13:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt'], n2: ['terminado_enviado.txt'] },
      familias: { f1: 'a@b.c', f2: 'd@e.f' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(hitosEnviados()).toEqual(['recordatorio_3']);
    expect(enviarMailHitoMock).toHaveBeenCalledWith(
      expect.objectContaining({ hito: 'recordatorio_3', para: 'a@b.c', enlace: expect.stringContaining('/tablero/n1') })
    );
    expect(db.subidos['n1']).toContain('recordatorio_cierre_3.txt');
    expect(db.subidos['n2']).toBeUndefined();
  });

  it('a los 9 días con ninguno mandado, manda SOLO recordatorio_7 y marca también el candado del 3', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-09-11T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(hitosEnviados()).toEqual(['recordatorio_7']);
    expect(db.subidos['n1']).toContain('recordatorio_cierre_3.txt');
    expect(db.subidos['n1']).toContain('recordatorio_cierre_7.txt');
    expect(db.subidos['n1']).not.toContain('recordatorio_cierre_14.txt');
  });

  it('con recordatorio_7 ya mandado, a los 9 días no repite nada', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-09-11T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt', 'recordatorio_cierre_3.txt', 'recordatorio_cierre_7.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
  });

  it('con libro_aprobado_at puesto, no manda recordatorios aunque hayan pasado 10 días', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-09-10T12:00:00Z',
          libro_aprobado_at: '2026-09-12T10:00:00Z',
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
    expect(db.cierresAutomaticos).toEqual([]);
    expect(db.subidos['n1']).toBeUndefined();
  });

  it('a los 30 días sin cierre: pone libro_aprobado_at, manda cierre_automatico y deja candado', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-08-20T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(db.cierresAutomaticos).toEqual(['n1']);
    expect(hitosEnviados()).toEqual(['cierre_automatico']);
    expect(enviarMailHitoMock).toHaveBeenCalledWith(
      expect.objectContaining({ hito: 'cierre_automatico', para: 'a@b.c', enlace: expect.stringContaining('/tablero/n1') })
    );
    expect(db.subidos['n1']).toContain('cierre_automatico_enviado.txt');
    expect(db.subidos['n1']).not.toContain('recordatorio_cierre_14.txt');
    // La marca de "fuimos nosotros" queda apenas confirma el CAS, antes del mail.
    expect(db.subidos['n1']).toContain('cierre_automatico.txt');
    expect(db.subidos['n1'].indexOf('cierre_automatico.txt')).toBeLessThan(
      db.subidos['n1'].indexOf('cierre_automatico_enviado.txt')
    );
  });

  it('con la marca cierre_automatico.txt pero sin el mail mandado (falló después del CAS), reintenta el mail sin volver a cerrar', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-08-20T00:00:00Z',
          // ya lo cerró la fábrica en un tick anterior
          libro_aprobado_at: '2026-09-19T12:00:00Z',
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt', 'cierre_automatico.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(hitosEnviados()).toEqual(['cierre_automatico']);
    expect(db.cierresAutomaticos).toEqual([]);
    expect(db.subidos['n1']).toEqual(['cierre_automatico_enviado.txt']);
  });

  it('con la marca y el candado del cierre automático presentes, no manda nada', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-08-20T00:00:00Z',
          libro_aprobado_at: '2026-09-19T12:00:00Z',
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt', 'cierre_automatico.txt', 'cierre_automatico_enviado.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
    expect(db.cierresAutomaticos).toEqual([]);
    expect(db.subidos['n1']).toBeUndefined();
  });

  it('a los 30 días, si la web lo cerró en el medio (el CAS no devuelve fila), no manda cierre_automatico', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-08-20T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt'] },
      familias: { f1: 'a@b.c' },
      cerrarSolo: () => ({ data: [], error: null }),
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(db.cierresAutomaticos).toEqual(['n1']);
    expect(enviarMailHitoMock).not.toHaveBeenCalled();
    expect(db.subidos['n1']).toBeUndefined();
  });

  it('pedido entregado sin libro_listo_enviado.txt → manda "libro_listo" y deja candado; con candado no repite', async () => {
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f1',
          ultima_respuesta_at: '2026-09-01T00:00:00Z',
          libro_aprobado_at: '2026-09-05T10:00:00Z',
        },
      ],
      archivosPorNarrador: { n1: ['terminado_enviado.txt'] },
      familias: { f1: 'a@b.c' },
      // dos pedidos (el libro y un extra) del mismo narrador: un solo mail
      pedidosEntregados: [
        { id: 'p1', narrador_id: 'n1' },
        { id: 'p2', narrador_id: 'n1' },
      ],
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(hitosEnviados()).toEqual(['libro_listo']);
    expect(enviarMailHitoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hito: 'libro_listo',
        para: 'a@b.c',
        comoLeDicen: 'papá',
        enlace: expect.stringContaining('/tablero/n1'),
      })
    );
    expect(db.subidos['n1']).toContain(CANDADO_POR_HITO.libro_listo);

    // Segundo tick: el candado subido ya aparece en el list → no repite.
    enviarMailHitoMock.mockClear();
    await tick();

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
  });

  it('un narrador cuya familia no se puede leer no frena a los demás', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const db = construirClienteDbMock({
      narradores: [
        {
          id: 'n1',
          estado: 'completado',
          como_le_dicen: 'papá',
          familia_id: 'f-que-no-existe',
          ultima_respuesta_at: '2026-09-19T00:00:00Z',
          libro_aprobado_at: null,
        },
        {
          id: 'n2',
          estado: 'completado',
          como_le_dicen: 'la abuela',
          familia_id: 'f2',
          ultima_respuesta_at: '2026-09-19T00:00:00Z',
          libro_aprobado_at: null,
        },
      ],
      archivosPorNarrador: {},
      familias: { f2: 'd@e.f' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await expect(tick()).resolves.toBeUndefined();

    expect(enviarMailHitoMock).toHaveBeenCalledTimes(1);
    expect(enviarMailHitoMock).toHaveBeenCalledWith(
      expect.objectContaining({ hito: 'terminado', para: 'd@e.f', enlace: expect.stringContaining('/tablero/n2') })
    );
    expect(db.subidos['n1']).toBeUndefined();
    expect(db.subidos['n2']).toContain('terminado_enviado.txt');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('n1'), expect.anything());
    errorSpy.mockRestore();
  });
});
