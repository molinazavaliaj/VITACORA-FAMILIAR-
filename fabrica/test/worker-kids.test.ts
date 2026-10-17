// El worker con chicos de Kids V2 (docs/kids/v2/plan-conexion-bot.md, T4): un narrador con fila en kids_v2 no recibe
// nada del libro de siempre (anticipo, estructura, previsualización, mails de cierre, paquete, escritor V3, libro
// listo, recordatorio de frases). Sin la tabla, nadie es chico; con otro error de base, la rama no corre ese tick.
// El candado de verdad (src/kids/candado.ts) corre sobre la base falsa: solo se mockea lo que escribe o manda.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => {
  // Con 0 respuestas alcanza para el anticipo: la base falsa siempre cuenta 0.
  process.env.RESPUESTAS_PARA_ANTICIPO = '0';
  return {
    narradoresConV3: vi.fn(async () => new Set<string>()),
    revisarEtapaAV3: vi.fn(async () => undefined),
    lanzarLibroV3: vi.fn((_db: unknown, _p: unknown, _fin: () => void) => true),
    generarPaquete: vi.fn(async () => undefined),
    generarEstructura: vi.fn(async () => undefined),
    generarPrevisualizacion: vi.fn(async () => undefined),
    generarAnticipo: vi.fn(async () => undefined),
    enviarMailHito: vi.fn(async () => true),
    enviarMailRecordatorioFrases: vi.fn(async () => true),
    obtenerClienteDb: vi.fn(),
  };
});

vi.mock('../src/v3/candado.js', () => ({ idiomasV3: vi.fn(async () => new Map()), narradoresConV3: m.narradoresConV3, avisarCandadoV3: vi.fn(), exigirSinV3: vi.fn() }));
vi.mock('../src/escritor/produccion/libro-v3.js', () => ({ trabajaOtraCopia: vi.fn(async () => false), alertarLibrosDemorados: vi.fn(), revisarEtapaAV3: m.revisarEtapaAV3, hayLugarParaLibroV3: vi.fn(() => true), lanzarLibroV3: m.lanzarLibroV3 }));
vi.mock('../src/libro/generar-paquete.js', () => ({ generarPaquete: m.generarPaquete }));
vi.mock('../src/libro/estructura.js', () => ({ generarEstructura: m.generarEstructura }));
vi.mock('../src/libro/previsualizar.js', () => ({ generarPrevisualizacion: m.generarPrevisualizacion }));
vi.mock('../src/libro/anticipo.js', () => ({ generarAnticipo: m.generarAnticipo }));
vi.mock('../src/mail/anticipo.js', () => ({ enviarMailAnticipo: vi.fn(async () => false) }));
vi.mock('../src/libro/token-anticipo.js', () => ({ firmarTokenAnticipo: () => 'token' }));
vi.mock('../src/entregas.js', () => ({ mandarEntregasAImprenta: vi.fn(), avisarHitosDeEntrega: vi.fn() }));
vi.mock('../src/latido.js', () => ({ anotarLatido: vi.fn() }));
vi.mock('../src/mail/hitos.js', async () => ({ ...(await vi.importActual<object>('../src/mail/hitos.js')), enviarMailHito: m.enviarMailHito }));
vi.mock('../src/mail/frases.js', async () => ({ ...(await vi.importActual<object>('../src/mail/frases.js')), enviarMailRecordatorioFrases: m.enviarMailRecordatorioFrases }));
vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ urlBase: 'https://x', resendApiKey: '' }) }));
vi.mock('../src/db.js', async () => ({ ...(await vi.importActual<object>('../src/db.js')), obtenerClienteDb: m.obtenerClienteDb }));

import { procesarPedidosPagados, recordarFrasesPendientes, tick } from '../src/worker.js';

type Fila = Record<string, unknown>;
type Tablas = Record<string, Fila[]>;
const HACE = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();

/** Base falsa por tabla. `errores[tabla]` hace fallar toda lectura de esa tabla; `paquetes[narrador]` son sus archivos. */
function base(t: Tablas, o: { errores?: Record<string, { code: string; message: string }>; paquetes?: Record<string, { name: string; created_at?: string }[]> } = {}) {
  const claims: string[] = [];
  const updates: { tabla: string; cambios: Fila; filas: string[] }[] = [];
  const listados: string[] = [];
  const db = {
    from(tabla: string) {
      const filtros: ((f: Fila) => boolean)[] = [];
      let cambios: Fila | null = null;
      const filas = () => (t[tabla] ?? []).filter((f) => filtros.every((x) => x(f)));
      const resultado = () => {
        const error = o.errores?.[tabla];
        if (error) return { data: null, error, count: null };
        const r = filas();
        if (cambios) {
          if (tabla === 'pedidos' && cambios.estado === 'generando') claims.push(...r.map((f) => f.id as string));
          updates.push({ tabla, cambios, filas: r.map((f) => String(f.id)) });
          for (const f of r) Object.assign(f, cambios);
        }
        return { data: r.map((f) => ({ ...f })), error: null, count: 0 };
      };
      const q: any = {
        select: () => q,
        order: () => q,
        limit: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        in: (c: string, vs: unknown[]) => { filtros.push((f) => vs.includes(f[c])); return q; },
        is: (c: string, v: unknown) => { filtros.push((f) => (f[c] ?? null) === v); return q; },
        update: (c: Fila) => { cambios = c; return q; },
        single: async () => { const r = resultado(); return r.error ? r : { data: r.data![0] ?? null, error: r.data![0] ? null : { message: 'sin filas' } }; },
        maybeSingle: async () => { const r = resultado(); return r.error ? r : { data: r.data![0] ?? null, error: null }; },
        then: (ok: any, ko: any) => Promise.resolve(resultado()).then(ok, ko),
      };
      return q;
    },
    storage: {
      from: () => ({
        list: async (ruta: string) => {
          const narrador = ruta.split('/')[0];
          listados.push(narrador);
          return { data: o.paquetes?.[narrador] ?? [], error: null };
        },
        download: async () => ({ data: null, error: { message: 'Object not found' } }),
        upload: async () => ({ error: null }),
      }),
    },
  };
  return { db, claims, updates, listados };
}

const adulto = (extra: Fila = {}): Fila => ({ id: 'adulto', como_le_dicen: 'papá', familia_id: 'f', ...extra });
const chico = (extra: Fila = {}): Fila => ({ id: 'chico', como_le_dicen: 'Juani', familia_id: 'f', ...extra });
const familias = [{ id: 'f', email: 'familia@ejemplo.com', region: 'AR' }];

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  m.narradoresConV3.mockResolvedValue(new Set());
});

describe('worker: un chico de Kids no recibe nada del libro de siempre', () => {
  it('anticipo: al adulto se le arma; al chico, no', async () => {
    const { db } = base({ narradores: [adulto({ estado: 'activo' }), chico({ estado: 'activo' })], kids_v2: [{ narrador_id: 'chico' }], familias });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarAnticipo).toHaveBeenCalledWith('adulto');
    expect(m.generarAnticipo).not.toHaveBeenCalledWith('chico');
  });

  it('estructura: ni la vieja ni la Etapa A del escritor V3 (aunque tuviera fila V3)', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['chico']));
    const { db } = base({ narradores: [adulto({ estado: 'completado' }), chico({ estado: 'completado' })], kids_v2: [{ narrador_id: 'chico' }], familias });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarEstructura).toHaveBeenCalledWith('adulto');
    expect(m.generarEstructura).not.toHaveBeenCalledWith('chico');
    expect(m.revisarEtapaAV3).not.toHaveBeenCalled();
  });

  it('previsualización: con estructura y nombres, al adulto se le arma; al chico, no', async () => {
    const paquete = [{ name: 'estructura.json' }, { name: 'nombres.json' }, { name: 'terminado_enviado.txt' }];
    const { db } = base(
      { narradores: [adulto({ estado: 'completado' }), chico({ estado: 'completado' })], kids_v2: [{ narrador_id: 'chico' }], familias },
      { paquetes: { adulto: paquete, chico: paquete } },
    );
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarPrevisualizacion).toHaveBeenCalledWith('adulto');
    expect(m.generarPrevisualizacion).not.toHaveBeenCalledWith('chico');
  });

  it('mails de cierre: ni «terminó», ni recordatorios, ni el cierre solo a los 30 días', async () => {
    const t = {
      narradores: [
        adulto({ estado: 'completado', ultima_respuesta_at: HACE(31), libro_aprobado_at: null }),
        chico({ estado: 'completado', ultima_respuesta_at: HACE(31), libro_aprobado_at: null }),
      ],
      kids_v2: [{ narrador_id: 'chico' }],
      familias,
    };
    const { db, updates } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    const comoLeDicen = m.enviarMailHito.mock.calls.map((c) => (c as unknown as [{ comoLeDicen: string }])[0].comoLeDicen);
    expect(comoLeDicen).toContain('papá');
    expect(comoLeDicen).not.toContain('Juani');
    expect(updates.filter((u) => u.tabla === 'narradores' && u.filas.includes('chico'))).toEqual([]);
    expect(t.narradores[1].libro_aprobado_at).toBeNull();
    expect(t.narradores[0].libro_aprobado_at).not.toBeNull(); // el adulto sí se cerró solo
  });

  it('pedido pagado con el libro cerrado: no se reclama, ni generarPaquete ni el escritor V3', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['chico']));
    const t = { narradores: [chico({ libro_aprobado_at: HACE(1) })], pedidos: [{ id: 'p1', narrador_id: 'chico', estado: 'pagado' }], kids_v2: [{ narrador_id: 'chico' }] };
    const { db, claims } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(claims).toEqual([]);
    expect(m.generarPaquete).not.toHaveBeenCalled();
    expect(m.lanzarLibroV3).not.toHaveBeenCalled();
    expect(t.pedidos[0].estado).toBe('pagado');
  });

  it('un segundo pedido de un chico con uno ya entregado tampoco se entrega con los mismos archivos', async () => {
    const t = {
      narradores: [chico({ libro_aprobado_at: HACE(1) })],
      pedidos: [{ id: 'p1', narrador_id: 'chico', estado: 'entregado', libro_pdf_path: 'x.pdf', audiolibro_paths: null }, { id: 'p2', narrador_id: 'chico', estado: 'pagado' }],
      kids_v2: [{ narrador_id: 'chico' }],
    };
    const { db } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(t.pedidos[1].estado).toBe('pagado');
  });

  it('pedido entregado: no le sale «el libro está listo» ni el recordatorio de frases', async () => {
    const t = { narradores: [chico({ estado: 'completado', libro_aprobado_at: HACE(1) })], pedidos: [{ id: 'p1', narrador_id: 'chico', estado: 'entregado', extras: {} }], kids_v2: [{ narrador_id: 'chico' }], familias };
    const { db, listados } = base(t, { paquetes: { chico: [{ name: 'frases.json', created_at: HACE(30) }, { name: 'terminado_enviado.txt' }] } });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.enviarMailHito).not.toHaveBeenCalled();
    expect(m.enviarMailRecordatorioFrases).not.toHaveBeenCalled();
    expect(await recordarFrasesPendientes()).toBe(0);
    expect(listados).not.toContain('chico'); // ni siquiera se le mira el paquete
  });
});

describe('worker: la tabla kids_v2', () => {
  it('sin la migración (42P01), nadie es chico: el adulto sigue como siempre', async () => {
    const { db } = base({ narradores: [adulto({ estado: 'completado' })], familias }, { errores: { kids_v2: { code: '42P01', message: 'relation "kids_v2" does not exist' } } });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarEstructura).toHaveBeenCalledWith('adulto');
  });

  it('si no se puede leer (otro error), esas ramas no corren este tick: nada se arma ni se manda', async () => {
    const t = {
      narradores: [adulto({ estado: 'activo' }), adulto({ id: 'otro', estado: 'completado', ultima_respuesta_at: HACE(31), libro_aprobado_at: HACE(1) })],
      pedidos: [{ id: 'p1', narrador_id: 'otro', estado: 'pagado' }, { id: 'p0', narrador_id: 'otro', estado: 'entregado', extras: {} }],
      familias,
    };
    const { db, claims } = base(t, { errores: { kids_v2: { code: '57014', message: 'canceling statement due to statement timeout' } } });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarAnticipo).not.toHaveBeenCalled();
    expect(m.generarEstructura).not.toHaveBeenCalled();
    expect(m.generarPrevisualizacion).not.toHaveBeenCalled();
    expect(m.enviarMailHito).not.toHaveBeenCalled();
    expect(m.enviarMailRecordatorioFrases).not.toHaveBeenCalled();
    expect(claims).toEqual([]);
    expect(m.generarPaquete).not.toHaveBeenCalled();
  });
});
