import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  generarEstructuraMock,
  generarPrevisualizacionMock,
  generarPaqueteMock,
  enviarMailHitoMock,
  enviarMailRecordatorioFrasesMock,
  obtenerClienteDbMock,
  mandarEntregasAImprentaMock,
  avisarHitosDeEntregaMock,
} = vi.hoisted(() => ({
  generarEstructuraMock: vi.fn().mockResolvedValue(undefined),
  generarPrevisualizacionMock: vi.fn().mockResolvedValue(undefined),
  generarPaqueteMock: vi.fn().mockResolvedValue(undefined),
  enviarMailHitoMock: vi.fn().mockResolvedValue(true),
  enviarMailRecordatorioFrasesMock: vi.fn().mockResolvedValue(true),
  obtenerClienteDbMock: vi.fn(),
  mandarEntregasAImprentaMock: vi.fn().mockResolvedValue(undefined),
  avisarHitosDeEntregaMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/mail/hitos.js', async () => {
  const actual = await vi.importActual<typeof import('../src/mail/hitos.js')>('../src/mail/hitos.js');
  return { ...actual, enviarMailHito: enviarMailHitoMock };
});

vi.mock('../src/mail/frases.js', async () => {
  const actual = await vi.importActual<typeof import('../src/mail/frases.js')>('../src/mail/frases.js');
  return { ...actual, enviarMailRecordatorioFrases: enviarMailRecordatorioFrasesMock };
});

vi.mock('../src/entregas.js', () => ({
  mandarEntregasAImprenta: mandarEntregasAImprentaMock,
  avisarHitosDeEntrega: avisarHitosDeEntregaMock,
}));

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

import { tick, procesarPedidosPagados, recordarFrasesPendientes } from '../src/worker.js';
import { CANDADO_POR_HITO } from '../src/mail/hitos.js';
import { CANDADO_RECORDATORIO_FRASES } from '../src/mail/frases.js';

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
 *
 * Para la voz clonada: `narraciones` se filtra por estado (`.eq` o `.in`),
 * `pedidos.select().in('id', ids).eq('estado', 'esperando_voz')` devuelve los
 * `pedidosEsperandoVoz` con esos ids, la entrega del ensamblado
 * (`update({estado:'entregado', ...}).eq('id').eq('estado','esperando_voz').select('id')`)
 * se anota en `pedidosEntregadosPorVoz` y responde con `entregarPorVoz`, y
 * `storage.download` sirve el `narracion.json` de `narracionJsonPorNarrador`.
 *
 * Para el recordatorio de frases: `storage.download` sirve también el
 * `frases.json` de `frasesPorNarrador` (y "no existe" si no está en el mapa) y
 * `storage.list` devuelve el `created_at` de `creadosPorNarrador` — es la fecha
 * de entrega, porque no hay `pedidos.entregado_at`. Un candado subido queda en
 * `archivosPorNarrador`, así que la segunda corrida lo ve (el candado manda).
 */
function construirClienteDbMock(opciones: {
  narradores: { id: string; [columna: string]: unknown }[];
  archivosPorNarrador: Record<string, string[]>;
  familias?: Record<string, string>;
  pedidosPagados?: { id: string; narrador_id: string; extras?: unknown }[];
  pedidosGenerando?: { id: string }[];
  pedidosEntregados?: { id: string; narrador_id: string; [columna: string]: unknown }[];
  pedidosEsperandoVoz?: { id: string; narrador_id: string }[];
  narraciones?: { id: string; narrador_id: string; estado: string; [columna: string]: unknown }[];
  narracionJsonPorNarrador?: Record<string, unknown>;
  /**
   * `created_at` de cada archivo del paquete (nombre → fecha ISO). Es la única
   * fecha de entrega que hay: no existe `pedidos.entregado_at` y no se migra,
   * así que el recordatorio de frases cuenta los 15 días desde el `created_at`
   * de `frases.json`, que se escribe en el mismo tick que la entrega.
   */
  creadosPorNarrador?: Record<string, Record<string, string | null>>;
  /** El `frases.json` de cada narrador, tal cual lo sirve Storage (o nada: no existe). */
  frasesPorNarrador?: Record<string, unknown>;
  claimarPedido?: (id: string) => { data: unknown; error: unknown };
  entregarPorVoz?: (id: string) => { data: unknown; error: unknown };
  resetearPedidoHuerfano?: (id: string) => { data: unknown; error: unknown };
  cerrarSolo?: (id: string) => { data: unknown; error: unknown };
}) {
  const claimarPedido = opciones.claimarPedido ?? ((id: string) => ({ data: [{ id }], error: null }));
  const entregarPorVoz = opciones.entregarPorVoz ?? ((id: string) => ({ data: [{ id }], error: null }));
  const resetearPedidoHuerfano = opciones.resetearPedidoHuerfano ?? (() => ({ data: null, error: null }));
  const cerrarSolo = opciones.cerrarSolo ?? ((id: string) => ({ data: [{ id }], error: null }));
  const cierresAutomaticos: string[] = [];
  const subidos: Record<string, string[]> = {};
  // `storage.remove(rutas)`: lo que la fábrica borró (los borradores al entregar la voz).
  const borrados: string[][] = [];
  // Invariante (b) del CONTRATO: el tick nunca escribe en `narraciones` (la
  // fila la escribe el worker de voz; la fábrica solo la crea desde
  // generarPaquete y la reintenta desde el CLI). Cualquier insert/update se
  // anota acá y además tira, para que el test lo vea sí o sí.
  const escriturasNarraciones: string[] = [];
  // Los `update(...).eq('id', x)` sin segundo `.eq` sobre pedidos: la copia
  // de un pedido ya entregado (mismo narrador) — se anota qué se escribió.
  const pedidosActualizados: { id: string; valores: Record<string, unknown> }[] = [];
  const pedidosEntregadosPorVoz: { id: string; valores: Record<string, unknown> }[] = [];
  const pedidosPorEstado = (valor: string) => {
    if (valor === 'pagado') return opciones.pedidosPagados ?? [];
    if (valor === 'generando') return opciones.pedidosGenerando ?? [];
    if (valor === 'entregado') return opciones.pedidosEntregados ?? [];
    if (valor === 'esperando_voz') return opciones.pedidosEsperandoVoz ?? [];
    return [];
  };

  return {
    cierresAutomaticos,
    subidos,
    borrados,
    escriturasNarraciones,
    pedidosActualizados,
    pedidosEntregadosPorVoz,
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
            eq: (_col: string, valor: string) => Promise.resolve({ data: pedidosPorEstado(valor), error: null }),
            // narracionesListas: `.in('id', ids).eq('estado', 'esperando_voz')`
            in: (_col: string, ids: string[]) => ({
              eq: (_c: string, valor: string) =>
                Promise.resolve({ data: pedidosPorEstado(valor).filter((p) => ids.includes(p.id)), error: null }),
            }),
          }),
          update: (valores: Record<string, unknown>) => ({
            eq: (_c1: string, id: string) => ({
              eq: (_c2: string, _estadoEsperado: string) => {
                if (valores.estado === 'generando') {
                  // el claim CAS siempre termina en .select('id')
                  return { select: (_cols: string) => Promise.resolve(claimarPedido(id)) };
                }
                if (valores.estado === 'entregado') {
                  // la entrega del audiolibro clonado (desde 'esperando_voz'): CAS con .select('id')
                  pedidosEntregadosPorVoz.push({ id, valores });
                  return { select: (_cols: string) => Promise.resolve(entregarPorVoz(id)) };
                }
                // el reset de huérfanos no encadena .select()
                return Promise.resolve(resetearPedidoHuerfano(id));
              },
              // sin segundo .eq: se espera directo (la copia a 'entregado')
              then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
                pedidosActualizados.push({ id, valores });
                return Promise.resolve({ data: null, error: null }).then(resolve, reject);
              },
            }),
          }),
        };
      }
      if (tabla === 'narraciones') {
        const filas = opciones.narraciones ?? [];
        const escritura = (operacion: string) => () => {
          escriturasNarraciones.push(operacion);
          throw new Error(`el tick no escribe en narraciones (${operacion}): esa fila es del worker de voz`);
        };
        return {
          select: () => ({
            eq: (_col: string, estado: string) =>
              Promise.resolve({ data: filas.filter((n) => n.estado === estado), error: null }),
            in: (_col: string, estados: string[]) =>
              Promise.resolve({ data: filas.filter((n) => estados.includes(n.estado)), error: null }),
          }),
          insert: escritura('insert'),
          update: escritura('update'),
          upsert: escritura('upsert'),
          delete: escritura('delete'),
        };
      }
      throw new Error(`tabla no mockeada en el test: ${tabla}`);
    }),
    storage: {
      from: () => ({
        list: (path: string) => {
          const narradorId = path.split('/')[0];
          const nombres = opciones.archivosPorNarrador[narradorId] ?? [];
          const creados = opciones.creadosPorNarrador?.[narradorId] ?? {};
          return Promise.resolve({
            data: nombres.map((name) => ({ name, created_at: creados[name] ?? null })),
            error: null,
          });
        },
        download: (ruta: string) => {
          const narradorId = ruta.split('/')[0];
          if (ruta.endsWith('/paquete/frases.json')) {
            const frases = opciones.frasesPorNarrador?.[narradorId];
            if (!frases) return Promise.resolve({ data: null, error: { message: 'Object not found' } });
            return Promise.resolve({ data: { text: async () => JSON.stringify(frases) }, error: null });
          }
          const narracion = opciones.narracionJsonPorNarrador?.[narradorId];
          if (!narracion || !ruta.endsWith('/paquete/narracion.json')) {
            return Promise.resolve({ data: null, error: { message: 'Object not found' } });
          }
          return Promise.resolve({ data: { text: async () => JSON.stringify(narracion) }, error: null });
        },
        upload: (ruta: string, _contenido: string, _opts: unknown) => {
          const [narradorId, , nombre] = ruta.split('/');
          (opciones.archivosPorNarrador[narradorId] ??= []).push(nombre);
          (subidos[narradorId] ??= []).push(nombre);
          return Promise.resolve({ data: null, error: null });
        },
        remove: (rutas: string[]) => {
          borrados.push(rutas);
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
    mandarEntregasAImprentaMock.mockClear();
  });

  // Este test cuida el ENGANCHE, no la lógica: el 22/09 `recordarFrasesPendientes`
  // quedó escrita fuera del tick —la función existía, nadie la llamaba— y el mail de
  // los 15 días salió una sola vez al arrancar el proceso. Todo estaba en verde.
  it('abre el portón de impresión en cada tick (si no se llama, el impreso no sale nunca)', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirClienteDbMock({ narradores: [], archivosPorNarrador: {} })
    );

    await tick();

    expect(mandarEntregasAImprentaMock).toHaveBeenCalledTimes(1);
    expect(avisarHitosDeEntregaMock).toHaveBeenCalledTimes(1);
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
        pedidosPagados: [{ id: 'pedido-1', narrador_id: 'narrador-1', extras: { pdf: true, audiolibro: 'clonada' } }],
        claimarPedido,
      })
    );

    await tick();

    // generarPaquete recibe la fila con `extras`: de ahí lee qué se compró
    // (voz clonada → buzón `narraciones`).
    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({
      id: 'pedido-1',
      narrador_id: 'narrador-1',
      extras: { pdf: true, audiolibro: 'clonada' },
    });
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

  // --- Un segundo pedido (extras, copia de un visitante) sobre un narrador
  // que ya tiene el libro entregado: no se vuelve a generar nada.

  it('un pedido pagado de un narrador que YA tiene un pedido entregado: se reclama y pasa a entregado con los mismos archivos, sin generarPaquete', async () => {
    const claimarPedido = vi.fn((id: string) => ({ data: [{ id }], error: null }));
    const paths = { capitulos: ['n1/paquete/audiolibro_cap_01.mp3'], completo: 'n1/paquete/audiolibro_completo.mp3' };
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' }],
      archivosPorNarrador: {},
      pedidosPagados: [{ id: 'p2', narrador_id: 'n1' }],
      pedidosEntregados: [
        { id: 'p1', narrador_id: 'n1', libro_pdf_path: 'n1/paquete/libro.pdf', audiolibro_paths: paths },
      ],
      claimarPedido,
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(generarPaqueteMock).not.toHaveBeenCalled();
    // igual se reclama con el CAS: otro proceso no lo tiene que tomar a la vez.
    expect(claimarPedido).toHaveBeenCalledWith('p2');
    expect(db.pedidosActualizados).toEqual([
      {
        id: 'p2',
        valores: { estado: 'entregado', libro_pdf_path: 'n1/paquete/libro.pdf', audiolibro_paths: paths },
      },
    ]);
  });

  it('un pedido pagado de un narrador SIN pedido entregado (hay entregados de otros narradores) se genera como siempre', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' }],
      archivosPorNarrador: {},
      pedidosPagados: [{ id: 'p1', narrador_id: 'n1' }],
      pedidosEntregados: [
        { id: 'p9', narrador_id: 'otro', libro_pdf_path: 'otro/paquete/libro.pdf', audiolibro_paths: null },
      ],
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'p1', narrador_id: 'n1' });
    expect(db.pedidosActualizados).toEqual([]);
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

  // Bitácora 33: al preparar el redeploy se sembraron los 7 candados de Osvaldo
  // para que no recibiera mails, pero la rama de los 30 días hacía el CAS y
  // llamaba a `mandar('cierre_automatico')` sin mirar el candado (y `mandarHito`
  // tampoco): el mail salía igual. El libro se sigue cerrando; el mail, no.
  it('con el candado sembrado y el libro abierto, cierra a los 30 días pero NO manda el mail', async () => {
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
      archivosPorNarrador: { n1: ['terminado_enviado.txt', 'cierre_automatico_enviado.txt'] },
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await tick();

    expect(db.cierresAutomaticos).toEqual(['n1']); // el libro se cierra igual
    expect(enviarMailHitoMock).not.toHaveBeenCalled();
    expect(db.subidos['n1']).toContain('cierre_automatico.txt');
    expect(db.subidos['n1']).not.toContain('cierre_automatico_enviado.txt');
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

// 23/09: el camino de voz clonada se borró (ensamblar narraciones listas y
// avisar las atascadas). Quedan filas viejas en `narraciones`; el tick no las
// lee, no las ensambla y no les escribe.
describe('tick — la tabla narraciones ya no es cosa de la fábrica', () => {
  it('con narraciones en todos los estados, el tick no entrega nada por voz ni escribe en narraciones', async () => {
    // (console.error se silencia: el branch del anticipo lee `respuestas`, que este fake no mockea.)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const db = construirClienteDbMock({
      narradores: [
        { id: 'n1', estado: 'completado', como_le_dicen: 'papá', familia_id: 'f1', libro_aprobado_at: '2026-09-05T10:00:00Z' },
        { id: 'n2', estado: 'completado', como_le_dicen: 'mamá', familia_id: 'f2', libro_aprobado_at: '2026-09-05T10:00:00Z' },
      ],
      archivosPorNarrador: {
        n1: ['estructura.json', 'nombres.json', 'preview.pdf', 'terminado_enviado.txt'],
        n2: ['estructura.json', 'nombres.json', 'preview.pdf', 'terminado_enviado.txt'],
      },
      familias: { f1: 'a@b.c', f2: 'd@e.f' },
      pedidosEsperandoVoz: [{ id: 'p1', narrador_id: 'n1' }],
      narraciones: [
        { id: 'nar-1', narrador_id: 'n1', pedido_id: 'p1', estado: 'lista', capitulos_paths: ['n1/voz/cap_01.mp3'] },
        { id: 'nar-2', narrador_id: 'n2', pedido_id: 'p2', estado: 'pendiente', created_at: '2020-01-01T00:00:00Z', actualizada_at: '2020-01-01T00:00:00Z', error: null },
        { id: 'nar-4', narrador_id: 'n2', pedido_id: 'p4', estado: 'fallida', created_at: '2020-01-01T00:00:00Z', actualizada_at: '2020-01-01T00:00:00Z', error: 'x' },
      ],
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await expect(tick()).resolves.toBeUndefined();

    expect(db.pedidosEntregadosPorVoz).toEqual([]);
    expect(db.escriturasNarraciones).toEqual([]);
    expect(db.subidos['n1'] ?? []).not.toContainEqual(expect.stringMatching(/^aviso_narracion_/));
    expect(db.subidos['n2'] ?? []).not.toContainEqual(expect.stringMatching(/^aviso_narracion_/));
    errorSpy.mockRestore();
  });
});

describe('tick — branch b: un narrador esperando la voz no se vuelve a generar', () => {
  beforeEach(() => {
    generarPaqueteMock.mockClear();
    generarPaqueteMock.mockResolvedValue(undefined);
  });

  it('un segundo pedido pagado de un narrador con un pedido esperando_voz se deja en pagado: ni claim ni generarPaquete', async () => {
    const claimarPedido = vi.fn((id: string) => ({ data: [{ id }], error: null }));
    const db = construirClienteDbMock({
      narradores: [
        { id: 'n1', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
        { id: 'n2', estado: 'completado', libro_aprobado_at: '2026-09-13T10:00:00Z' },
      ],
      archivosPorNarrador: {},
      pedidosPagados: [
        { id: 'p2', narrador_id: 'n1' },
        { id: 'p3', narrador_id: 'n2' },
      ],
      pedidosEsperandoVoz: [{ id: 'p1', narrador_id: 'n1' }],
      claimarPedido,
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await procesarPedidosPagados();

    expect(claimarPedido).toHaveBeenCalledTimes(1);
    expect(claimarPedido).toHaveBeenCalledWith('p3');
    expect(generarPaqueteMock).toHaveBeenCalledTimes(1);
    expect(generarPaqueteMock).toHaveBeenCalledWith({ id: 'p3', narrador_id: 'n2' });
    expect(db.pedidosActualizados).toEqual([]);
  });
});

describe('tick — recordatorio de frases de «Su voz» (a los 15 días, una sola vez)', () => {
  // "Hoy" fijo para que los días desde la entrega sean exactos.
  const HOY = new Date('2026-09-20T12:00:00Z');
  const haceDias = (dias: number) => new Date(HOY.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();

  /** Un frases.json sin confirmar, con un capítulo y una candidata elegida. */
  const frasesSinConfirmar = (narradorId: string) => ({
    version: 1,
    narrador_id: narradorId,
    pedido_id: `p-${narradorId}`,
    confirmado_at: null,
    capitulos: [
      {
        numero: 1,
        capitulo: 'La infancia',
        candidatas: [{ id: 'c01-01', texto: 'Yo nunca quise ser como mi viejo.', elegida: true }],
      },
    ],
  });

  beforeEach(() => {
    enviarMailRecordatorioFrasesMock.mockClear();
    enviarMailRecordatorioFrasesMock.mockResolvedValue(true);
  });

  it('entregado hace 15 días y sin confirmar → manda el mail a la familia y deja el candado', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['libro.pdf', 'frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(15) } },
      frasesPorNarrador: { n1: frasesSinConfirmar('n1') },
      pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(1);

    expect(enviarMailRecordatorioFrasesMock).toHaveBeenCalledTimes(1);
    expect(enviarMailRecordatorioFrasesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        para: 'a@b.c',
        comoLeDicen: 'papá',
        enlace: expect.stringContaining('/tablero/n1'),
      })
    );
    expect(db.subidos['n1']).toContain(CANDADO_RECORDATORIO_FRASES);
  });

  it('a los 14 días no manda; a los 15 sí (el día exacto ya cuenta)', async () => {
    const db = construirClienteDbMock({
      narradores: [
        { id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' },
        { id: 'n2', como_le_dicen: 'la abuela', familia_id: 'f2' },
      ],
      archivosPorNarrador: { n1: ['frases.json'], n2: ['frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(14) }, n2: { 'frases.json': haceDias(15) } },
      frasesPorNarrador: { n1: frasesSinConfirmar('n1'), n2: frasesSinConfirmar('n2') },
      pedidosEntregados: [
        { id: 'p1', narrador_id: 'n1' },
        { id: 'p2', narrador_id: 'n2' },
      ],
      familias: { f1: 'a@b.c', f2: 'd@e.f' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(1);

    expect(enviarMailRecordatorioFrasesMock).toHaveBeenCalledTimes(1);
    expect(enviarMailRecordatorioFrasesMock).toHaveBeenCalledWith(expect.objectContaining({ para: 'd@e.f' }));
    expect(db.subidos['n1']).toBeUndefined();
    expect(db.subidos['n2']).toContain(CANDADO_RECORDATORIO_FRASES);
  });

  it('si la familia ya confirmó la selección (confirmado_at), no la molestamos', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(20) } },
      frasesPorNarrador: { n1: { ...frasesSinConfirmar('n1'), confirmado_at: '2026-09-18T10:00:00Z' } },
      pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(0);

    expect(enviarMailRecordatorioFrasesMock).not.toHaveBeenCalled();
    expect(db.subidos['n1']).toBeUndefined();
  });

  it('sin pedido entregado (pagado o en generando) no hay recordatorio', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(40) } },
      frasesPorNarrador: { n1: frasesSinConfirmar('n1') },
      pedidosPagados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(0);

    expect(enviarMailRecordatorioFrasesMock).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('entregado pero sin frases.json (libro de antes de Su voz) → no manda', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['libro.pdf'] },
      pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(0);

    expect(enviarMailRecordatorioFrasesMock).not.toHaveBeenCalled();
    // Se saltea por el filtro, no porque algo se haya roto en el camino.
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('con frases.json sin ningún capítulo (libro sin audios) no manda: no hay nada que elegir', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(30) } },
      frasesPorNarrador: { n1: { ...frasesSinConfirmar('n1'), capitulos: [] } },
      pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(0);

    expect(enviarMailRecordatorioFrasesMock).not.toHaveBeenCalled();
  });

  it('corriéndolo dos veces seguidas manda UN solo mail: el candado del paquete manda', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(16) } },
      frasesPorNarrador: { n1: frasesSinConfirmar('n1') },
      pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(1);
    expect(await recordarFrasesPendientes(HOY)).toBe(0);

    expect(enviarMailRecordatorioFrasesMock).toHaveBeenCalledTimes(1);
    expect(db.subidos['n1']).toEqual([CANDADO_RECORDATORIO_FRASES]);
  });

  it('con el candado sembrado a mano (para que no salga), no manda nada', async () => {
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['frases.json', CANDADO_RECORDATORIO_FRASES] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(60) } },
      frasesPorNarrador: { n1: frasesSinConfirmar('n1') },
      pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    expect(await recordarFrasesPendientes(HOY)).toBe(0);

    expect(enviarMailRecordatorioFrasesMock).not.toHaveBeenCalled();
  });

  it('si el mail falla, no deja candado (se reintenta) y no frena a la familia siguiente', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    enviarMailRecordatorioFrasesMock.mockRejectedValueOnce(new Error('Resend caído'));
    const db = construirClienteDbMock({
      narradores: [
        { id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' },
        { id: 'n2', como_le_dicen: 'la abuela', familia_id: 'f2' },
      ],
      archivosPorNarrador: { n1: ['frases.json'], n2: ['frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(16) }, n2: { 'frases.json': haceDias(16) } },
      frasesPorNarrador: { n1: frasesSinConfirmar('n1'), n2: frasesSinConfirmar('n2') },
      pedidosEntregados: [
        { id: 'p1', narrador_id: 'n1' },
        { id: 'p2', narrador_id: 'n2' },
      ],
      familias: { f1: 'a@b.c', f2: 'd@e.f' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await expect(recordarFrasesPendientes(HOY)).resolves.toBe(1);

    expect(enviarMailRecordatorioFrasesMock).toHaveBeenCalledTimes(2);
    // n1: sin candado, así el próximo tick lo reintenta; n2: entregado.
    expect(db.subidos['n1']).toBeUndefined();
    expect(db.subidos['n2']).toEqual([CANDADO_RECORDATORIO_FRASES]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('n1'), expect.anything());
    errorSpy.mockRestore();
  });

  it('una falla del mail no tumba el tick: el bucle sigue vivo', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    enviarMailRecordatorioFrasesMock.mockRejectedValueOnce(new Error('Resend caído'));
    const db = construirClienteDbMock({
      narradores: [{ id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' }],
      archivosPorNarrador: { n1: ['frases.json'] },
      creadosPorNarrador: { n1: { 'frases.json': haceDias(20) } },
      frasesPorNarrador: { n1: frasesSinConfirmar('n1') },
      pedidosEntregados: [{ id: 'p1', narrador_id: 'n1' }],
      familias: { f1: 'a@b.c' },
    });
    obtenerClienteDbMock.mockReturnValue(db);

    await expect(tick()).resolves.toBeUndefined();

    // El latido del final corrió igual: el tick llegó hasta el último paso.
    expect(anotarLatidoCorrio(db)).toBe(true);
    errorSpy.mockRestore();
  });
});

/** El tick anota el latido al empezar y al TERMINAR: si la última tabla que tocó fue `latidos`, llegó hasta el final. */
function anotarLatidoCorrio(db: { from: (tabla: string) => unknown }): boolean {
  const llamadas = (db.from as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  return llamadas.length > 0 && llamadas[llamadas.length - 1][0] === 'latidos';
}
