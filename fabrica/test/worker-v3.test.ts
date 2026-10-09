// El worker con narradores V3: la Etapa A en vez de la estructura vieja, y el pedido pagado + libro cerrado al
// escritor nuevo, en segundo plano (no se espera en el tick). Los narradores viejos siguen con generarPaquete.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  narradoresConV3: vi.fn(async () => new Set<string>()),
  revisarEtapaAV3: vi.fn(async () => undefined),
  hayLugarParaLibroV3: vi.fn(() => true),
  lanzarLibroV3: vi.fn((_db: unknown, _p: unknown, _fin: () => void) => true),
  generarPaquete: vi.fn(async () => undefined),
  generarEstructura: vi.fn(async () => undefined),
  obtenerClienteDb: vi.fn(),
  idiomasV3: vi.fn(async () => new Map<string, string>()),
  enviarMailHito: vi.fn(async () => false),
}));

vi.mock('../src/v3/candado.js', () => ({ idiomasV3: m.idiomasV3, narradoresConV3: m.narradoresConV3, avisarCandadoV3: vi.fn(), exigirSinV3: vi.fn() }));
vi.mock('../src/escritor/produccion/libro-v3.js', () => ({ revisarEtapaAV3: m.revisarEtapaAV3, hayLugarParaLibroV3: m.hayLugarParaLibroV3, lanzarLibroV3: m.lanzarLibroV3 }));
vi.mock('../src/libro/generar-paquete.js', () => ({ generarPaquete: m.generarPaquete }));
vi.mock('../src/libro/estructura.js', () => ({ generarEstructura: m.generarEstructura }));
vi.mock('../src/libro/previsualizar.js', () => ({ generarPrevisualizacion: vi.fn() }));
vi.mock('../src/libro/anticipo.js', () => ({ generarAnticipo: vi.fn() }));
vi.mock('../src/entregas.js', () => ({ mandarEntregasAImprenta: vi.fn(), avisarHitosDeEntrega: vi.fn() }));
vi.mock('../src/latido.js', () => ({ anotarLatido: vi.fn() }));
vi.mock('../src/mail/hitos.js', async () => ({ ...(await vi.importActual<object>('../src/mail/hitos.js')), enviarMailHito: m.enviarMailHito }));
vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ urlBase: 'https://x', resendApiKey: '' }) }));
vi.mock('../src/db.js', async () => ({ ...(await vi.importActual<object>('../src/db.js')), obtenerClienteDb: m.obtenerClienteDb }));

import { procesarPedidosPagados, tick } from '../src/worker.js';

type Fila = Record<string, unknown>;
function base(t: { narradores: Fila[]; pedidos: Fila[] }) {
  const claims: string[] = [];
  const db = {
    from(tabla: string) {
      const filtros: ((f: Fila) => boolean)[] = [];
      let cambios: Fila | null = null;
      const filas = () => ((t as Record<string, Fila[]>)[tabla] ?? []).filter((f) => filtros.every((x) => x(f)));
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        in: (c: string, vs: unknown[]) => { filtros.push((f) => vs.includes(f[c])); return q; },
        is: (c: string, v: unknown) => { filtros.push((f) => (f[c] ?? null) === v); return q; },
        update: (c: Fila) => { cambios = c; return q; },
        single: async () => ({ data: filas()[0] ?? null, error: filas()[0] ? null : { message: 'sin filas' } }),
        then: (ok: any, ko: any) => {
          const r = filas();
          if (cambios) {
            if (tabla === 'pedidos' && cambios.estado === 'generando') claims.push(...r.map((f) => f.id as string));
            for (const f of r) Object.assign(f, cambios);
          }
          return Promise.resolve({ data: r.map((f) => ({ ...f })), error: null, count: 0 }).then(ok, ko);
        },
      };
      return q;
    },
    storage: { from: () => ({ list: async () => ({ data: [], error: null }), download: async () => ({ data: null, error: { message: 'Object not found' } }), upload: async () => ({ error: null }) }) },
  };
  return { db, claims };
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('worker: narradores con entrevista V3', () => {
  it('entrevista terminada: revisa la Etapa A (no la estructura vieja); los viejos siguen igual', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['v3']));
    const { db } = base({ narradores: [{ id: 'v3', estado: 'completado' }, { id: 'viejo', estado: 'completado' }], pedidos: [] });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.revisarEtapaAV3).toHaveBeenCalledWith(db, 'v3');
    expect(m.generarEstructura).toHaveBeenCalledWith('viejo');
    expect(m.generarEstructura).not.toHaveBeenCalledWith('v3');
  });

  it('pedido pagado y libro cerrado: se reclama y se lanza el libro en segundo plano, sin generarPaquete', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['v3']));
    const t = { narradores: [{ id: 'v3', libro_aprobado_at: '2026-10-08' }], pedidos: [{ id: 'p1', narrador_id: 'v3', estado: 'pagado' }] };
    const { db, claims } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(claims).toEqual(['p1']);
    expect(m.lanzarLibroV3).toHaveBeenCalledTimes(1);
    expect(m.generarPaquete).not.toHaveBeenCalled();
    // Mientras corre, el pedido es suyo: el tick siguiente no lo devuelve a 'pagado' por huérfano.
    await procesarPedidosPagados();
    expect(t.pedidos[0].estado).toBe('generando');
    // Al terminar, el trabajo lo suelta (y queda como lo dejó: entregado o fallido).
    const alTerminar = m.lanzarLibroV3.mock.calls[0][2];
    t.pedidos[0].estado = 'entregado';
    alTerminar();
  });

  it('libro sin cerrar: no se reclama', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['v3']));
    const { db, claims } = base({ narradores: [{ id: 'v3', libro_aprobado_at: null }], pedidos: [{ id: 'p1', narrador_id: 'v3', estado: 'pagado' }] });
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(claims).toEqual([]);
    expect(m.lanzarLibroV3).not.toHaveBeenCalled();
  });

  it('sin lugar en la cola: no se reclama (un pedido reclamado sin trabajo quedaría huérfano)', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['v3']));
    m.hayLugarParaLibroV3.mockReturnValueOnce(false);
    const { db, claims } = base({ narradores: [{ id: 'v3', libro_aprobado_at: '2026-10-08' }], pedidos: [{ id: 'p1', narrador_id: 'v3', estado: 'pagado' }] });
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(claims).toEqual([]);
  });

  it('si el libro no arranca, el pedido queda huérfano y el tick siguiente lo devuelve a pagado', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['v3']));
    m.lanzarLibroV3.mockReturnValueOnce(false);
    const t = { narradores: [{ id: 'v3', libro_aprobado_at: '2026-10-08' }], pedidos: [{ id: 'p9', narrador_id: 'v3', estado: 'pagado' }] };
    const { db } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(t.pedidos[0].estado).toBe('generando');
    m.hayLugarParaLibroV3.mockReturnValueOnce(false); // el segundo tick no lo vuelve a reclamar
    await procesarPedidosPagados();
    expect(t.pedidos[0].estado).toBe('pagado');
  });

  it('un segundo pedido de un narrador V3 con el libro ya entregado se entrega con los mismos archivos', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['v3']));
    const t = {
      narradores: [{ id: 'v3', libro_aprobado_at: '2026-10-08' }],
      pedidos: [
        { id: 'p1', narrador_id: 'v3', estado: 'entregado', libro_pdf_path: 'v3/paquete/libro.pdf', audiolibro_paths: null },
        { id: 'p2', narrador_id: 'v3', estado: 'pagado' },
      ],
    };
    const { db } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(m.lanzarLibroV3).not.toHaveBeenCalled();
    expect(t.pedidos[1]).toMatchObject({ estado: 'entregado', libro_pdf_path: 'v3/paquete/libro.pdf' });
  });
});

describe('worker: el mail "terminó de contar" de un narrador V3', () => {
  const terminados = () => ({
    narradores: [
      { id: 'ar', estado: 'completado', como_le_dicen: 'Babu', familia_id: 'f', ultima_respuesta_at: new Date().toISOString(), libro_aprobado_at: null },
      { id: 'ca', estado: 'completado', como_le_dicen: 'Imma', familia_id: 'f', ultima_respuesta_at: new Date().toISOString(), libro_aprobado_at: null },
      { id: 'viejo', estado: 'completado', como_le_dicen: 'papá', familia_id: 'f', ultima_respuesta_at: new Date().toISOString(), libro_aprobado_at: null },
    ],
    pedidos: [],
    familias: [{ id: 'f', email: 'familia@ejemplo.com' }],
  });

  it('V3 de Argentina con vos, V3 de España (o catalán) con tú, el viejo con el texto de siempre', async () => {
    m.idiomasV3.mockResolvedValue(new Map([['ar', 'es-AR'], ['ca', 'ca']]));
    const { db } = base(terminados() as never);
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    const terminado = m.enviarMailHito.mock.calls.map((c) => (c as unknown as [{ hito: string; comoLeDicen: string; variante?: string }])[0]).filter((o) => o.hito === 'terminado');
    expect(terminado.map((o) => [o.comoLeDicen, o.variante])).toEqual([['Babu', 'vos'], ['Imma', 'tu'], ['papá', undefined]]);
  });

  it('sin poder leer entrevistas_v3 no sale ningún mail de cierre (no le llega el texto viejo a una familia V3)', async () => {
    m.idiomasV3.mockRejectedValue(new Error('caída'));
    const { db } = base(terminados() as never);
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.enviarMailHito).not.toHaveBeenCalled();
    m.idiomasV3.mockResolvedValue(new Map());
  });
});

describe('worker: "el libro está listo" con vos para Argentina (V3 o no)', () => {
  it('familia de Argentina con vos; de España, el de siempre', async () => {
    m.idiomasV3.mockResolvedValue(new Map());
    m.narradoresConV3.mockResolvedValue(new Set());
    const t = {
      narradores: [
        { id: 'ar', estado: 'activo', como_le_dicen: 'papá', familia_id: 'fa' },
        { id: 'es', estado: 'activo', como_le_dicen: 'mamá', familia_id: 'fe' },
      ],
      pedidos: [
        { id: 'p1', narrador_id: 'ar', estado: 'entregado' },
        { id: 'p2', narrador_id: 'es', estado: 'entregado' },
      ],
      familias: [{ id: 'fa', email: 'a@ejemplo.com', region: 'AR' }, { id: 'fe', email: 'e@ejemplo.com', region: 'ES' }],
    };
    const { db } = base(t as never);
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    const listos = m.enviarMailHito.mock.calls.map((c) => (c as unknown as [{ hito: string; para: string; variante?: string }])[0]).filter((o) => o.hito === 'libro_listo');
    expect(listos.map((o) => [o.para, o.variante])).toEqual([['a@ejemplo.com', 'vos'], ['e@ejemplo.com', undefined]]);
  });
});
