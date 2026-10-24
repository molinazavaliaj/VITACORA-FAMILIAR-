// El worker con «Vitácora de una historia» (plan 2026-10-21, Task 5.3): un narrador con fila en historias no recibe
// nada del libro de siempre (anticipo, estructura, previsualización, paquete, escritor V3, libro listo, recordatorio
// de frases), pero sí los mails de cierre y el cierre solo a los 30 días (Naza, 24/10); su libro lo reclama y lo escribe revisarLibrosHistoria. Sin la tabla, nadie cuenta
// una historia; con otro error de base, la rama no corre ese tick. Copia de worker-kids.test.ts: el candado de verdad
// (src/historia/candado.ts) corre sobre la base falsa y solo se mockea lo que escribe o manda.
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
    revisarLibrosHistoria: vi.fn(async () => undefined),
  };
});

vi.mock('../src/escritor-historia/produccion/libro-historia.js', () => ({ revisarLibrosHistoria: m.revisarLibrosHistoria, historiaTrabaja: vi.fn(async () => false) }));

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
const chico = (extra: Fila = {}): Fila => ({ id: 'chico', como_le_dicen: 'Marta', familia_id: 'f', ...extra });
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

describe('worker: un narrador de historia no recibe nada del libro de siempre', () => {
  it('anticipo: al adulto se le arma; al chico, no', async () => {
    const { db } = base({ narradores: [adulto({ estado: 'activo' }), chico({ estado: 'activo' })], historias: [{ narrador_id: 'chico' }], familias });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarAnticipo).toHaveBeenCalledWith('adulto');
    expect(m.generarAnticipo).not.toHaveBeenCalledWith('chico');
  });

  it('estructura: ni la vieja ni la Etapa A del escritor V3 (aunque tuviera fila V3)', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['chico']));
    const { db } = base({ narradores: [adulto({ estado: 'completado' }), chico({ estado: 'completado' })], historias: [{ narrador_id: 'chico' }], familias });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarEstructura).toHaveBeenCalledWith('adulto');
    expect(m.generarEstructura).not.toHaveBeenCalledWith('chico');
    expect(m.revisarEtapaAV3).not.toHaveBeenCalled();
  });

  it('previsualización: con estructura y nombres, al adulto se le arma; al chico, no', async () => {
    const paquete = [{ name: 'estructura.json' }, { name: 'nombres.json' }, { name: 'terminado_enviado.txt' }];
    const { db } = base(
      { narradores: [adulto({ estado: 'completado' }), chico({ estado: 'completado' })], historias: [{ narrador_id: 'chico' }], familias },
      { paquetes: { adulto: paquete, chico: paquete } },
    );
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.generarPrevisualizacion).toHaveBeenCalledWith('adulto');
    expect(m.generarPrevisualizacion).not.toHaveBeenCalledWith('chico');
  });

  it('mails de cierre: una historia sí los recibe (con los textos de la V3, en su trato) y se cierra sola a los 30 días', async () => {
    const t = {
      narradores: [
        adulto({ estado: 'completado', ultima_respuesta_at: HACE(31), libro_aprobado_at: null }),
        chico({ estado: 'completado', ultima_respuesta_at: HACE(31), libro_aprobado_at: null }),
      ],
      historias: [{ narrador_id: 'chico', idioma: 'es-ES' }],
      familias,
    };
    const { db } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    const llamadas = m.enviarMailHito.mock.calls.map((c) => (c as unknown as [{ comoLeDicen: string; hito: string; variante?: string }])[0]);
    const deMarta = llamadas.filter((c) => c.comoLeDicen === 'Marta');
    expect(deMarta.map((c) => c.hito)).toEqual(['terminado', 'cierre_automatico']);
    expect(deMarta.every((c) => c.variante === 'tu')).toBe(true);
    expect(t.narradores[1].libro_aprobado_at).not.toBeNull();
    expect(t.narradores[0].libro_aprobado_at).not.toBeNull();
  });

  it('mails de cierre: a una historia de Argentina, con vos', async () => {
    const t = { narradores: [chico({ estado: 'completado', ultima_respuesta_at: HACE(4), libro_aprobado_at: null })], historias: [{ narrador_id: 'chico', idioma: 'es-AR' }], familias };
    const { db } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    const llamadas = m.enviarMailHito.mock.calls.map((c) => (c as unknown as [{ hito: string; variante?: string }])[0]);
    expect(llamadas.map((c) => c.hito)).toEqual(['terminado', 'recordatorio_3']);
    expect(llamadas.every((c) => c.variante === 'vos')).toBe(true);
  });

  it('pedido pagado con el libro cerrado: no lo reclama ni la rama V3 ni la vieja; el tick llama a revisarLibrosHistoria', async () => {
    m.narradoresConV3.mockResolvedValue(new Set(['chico']));
    const t = { narradores: [chico({ libro_aprobado_at: HACE(1) })], pedidos: [{ id: 'p1', narrador_id: 'chico', estado: 'pagado' }], historias: [{ narrador_id: 'chico' }] };
    const { db, claims } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(claims).toEqual([]);
    expect(m.generarPaquete).not.toHaveBeenCalled();
    expect(m.lanzarLibroV3).not.toHaveBeenCalled();
    expect(t.pedidos[0].estado).toBe('pagado');
    await tick();
    expect(m.revisarLibrosHistoria).toHaveBeenCalledWith(db);
  });

  it('un segundo pedido de una historia con uno ya entregado tampoco se entrega con los mismos archivos', async () => {
    const t = {
      narradores: [chico({ libro_aprobado_at: HACE(1) })],
      pedidos: [{ id: 'p1', narrador_id: 'chico', estado: 'entregado', libro_pdf_path: 'x.pdf', audiolibro_paths: null }, { id: 'p2', narrador_id: 'chico', estado: 'pagado' }],
      historias: [{ narrador_id: 'chico' }],
    };
    const { db } = base(t);
    m.obtenerClienteDb.mockReturnValue(db);
    await procesarPedidosPagados();
    expect(t.pedidos[1].estado).toBe('pagado');
  });

  it('pedido entregado: no le sale «el libro está listo» ni el recordatorio de frases', async () => {
    const t = { narradores: [chico({ estado: 'completado', libro_aprobado_at: HACE(1) })], pedidos: [{ id: 'p1', narrador_id: 'chico', estado: 'entregado', extras: {} }], historias: [{ narrador_id: 'chico' }], familias };
    const { db } = base(t, { paquetes: { chico: [{ name: 'frases.json', created_at: HACE(30) }, { name: 'terminado_enviado.txt' }] } });
    m.obtenerClienteDb.mockReturnValue(db);
    await tick();
    expect(m.enviarMailHito).not.toHaveBeenCalled();
    expect(m.enviarMailRecordatorioFrases).not.toHaveBeenCalled();
    expect(await recordarFrasesPendientes()).toBe(0);
    // Su paquete lo mira la rama de cierre (los candados de sus mails), no «libro listo» ni el recordatorio de frases.
  });
});

describe('worker: la tabla historias', () => {
  it('sin la migración (42P01), nadie cuenta una historia: el adulto sigue como siempre', async () => {
    const { db } = base({ narradores: [adulto({ estado: 'completado' })], familias }, { errores: { historias: { code: '42P01', message: 'relation "historias" does not exist' } } });
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
    const { db, claims } = base(t, { errores: { historias: { code: '57014', message: 'canceling statement due to statement timeout' } } });
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
