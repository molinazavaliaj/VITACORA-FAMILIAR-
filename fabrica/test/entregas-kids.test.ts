// Lo físico de un chico de Kids V2 (docs/kids/v2/plan-conexion-bot.md, T4): su impreso se diseña aparte. La imprenta
// de siempre no lo arma y los mails de la entrega (que llevan al tablero de biografías) no salen. Sin la tabla
// kids_v2, nadie es chico; con otro error, el paso no corre ese tick.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  armarLibroDeImprenta: vi.fn(async () => true),
  enviarMailHito: vi.fn(async () => true),
}));

vi.mock('../src/libro/imprenta.js', async () => ({ ...(await vi.importActual<object>('../src/libro/imprenta.js')), armarLibroDeImprenta: m.armarLibroDeImprenta }));
vi.mock('../src/mail/hitos.js', async () => ({ ...(await vi.importActual<object>('../src/mail/hitos.js')), enviarMailHito: m.enviarMailHito }));
vi.mock('../src/config.js', () => ({ cargarConfig: () => ({ urlBase: 'https://x', resendApiKey: 'x' }) }));

const { avisarHitosDeEntrega, mandarEntregasAImprenta } = await import('../src/entregas.js');

type Fila = Record<string, unknown>;
const HACE = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();

function base(t: Record<string, Fila[]>, errorKids?: { code: string; message: string }) {
  const updates: string[] = [];
  const db = {
    from(tabla: string) {
      const filtros: ((f: Fila) => boolean)[] = [];
      let cambios: Fila | null = null;
      const resultado = () => {
        if (tabla === 'kids_v2' && errorKids) return { data: null, error: errorKids };
        const r = (t[tabla] ?? []).filter((f) => filtros.every((x) => x(f)));
        if (cambios) { updates.push(...r.map((f) => String(f.id))); for (const f of r) Object.assign(f, cambios); }
        return { data: r.map((f) => ({ ...f })), error: null };
      };
      const q: any = {
        select: () => q,
        eq: (c: string, v: unknown) => { filtros.push((f) => f[c] === v); return q; },
        in: (c: string, vs: unknown[]) => { filtros.push((f) => vs.includes(f[c])); return q; },
        update: (c: Fila) => { cambios = c; return q; },
        maybeSingle: async () => { const r = resultado(); return { data: r.data?.[0] ?? null, error: r.error }; },
        then: (ok: any, ko: any) => Promise.resolve(resultado()).then(ok, ko),
      };
      return q;
    },
    storage: { from: () => ({ list: async () => ({ data: [], error: null }), upload: async () => ({ error: null }) }) },
  };
  return { db: db as never, updates };
}

const tablas = (estado: string) => ({
  entregas: [
    { id: 'e-adulto', narrador_id: 'adulto', familia_id: 'f', estado, pedido_id: null, created_at: HACE(5) },
    { id: 'e-chico', narrador_id: 'chico', familia_id: 'f', estado, pedido_id: null, created_at: HACE(5) },
  ],
  familias: [{ id: 'f', email: 'familia@ejemplo.com', region: 'AR' }],
  narradores: [{ id: 'adulto', como_le_dicen: 'papá' }, { id: 'chico', como_le_dicen: 'Juani' }],
  kids_v2: [{ narrador_id: 'chico' }],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('entregas de un chico de Kids', () => {
  it('la imprenta de siempre no arma el libro del chico; el del adulto sí', async () => {
    const { db, updates } = base(tablas('lista'));
    await mandarEntregasAImprenta(db);
    expect(m.armarLibroDeImprenta).toHaveBeenCalledWith(db, 'adulto');
    expect(m.armarLibroDeImprenta).not.toHaveBeenCalledWith(db, 'chico');
    expect(updates).toEqual(['e-adulto']);
  });

  it('no sale el mail de la entrega del chico («¿a dónde lo mandamos?»); el del adulto sí', async () => {
    const { db } = base(tablas('sin_direccion'));
    await avisarHitosDeEntrega(db);
    const quienes = m.enviarMailHito.mock.calls.map((c) => (c as unknown as [{ comoLeDicen: string }])[0].comoLeDicen);
    expect(quienes).toEqual(['papá']);
  });

  it('sin la migración (42P01), nadie es chico: las dos entregas siguen como siempre', async () => {
    const { db } = base(tablas('sin_direccion'), { code: '42P01', message: 'relation "kids_v2" does not exist' });
    await avisarHitosDeEntrega(db);
    expect(m.enviarMailHito).toHaveBeenCalledTimes(2);
  });

  it('si kids_v2 no se puede leer, ni la imprenta ni los mails corren este tick', async () => {
    const error = { code: '57014', message: 'timeout' };
    const lista = base(tablas('lista'), error);
    await mandarEntregasAImprenta(lista.db);
    expect(m.armarLibroDeImprenta).not.toHaveBeenCalled();
    expect(lista.updates).toEqual([]);
    await avisarHitosDeEntrega(base(tablas('enviado'), error).db);
    expect(m.enviarMailHito).not.toHaveBeenCalled();
  });
});
