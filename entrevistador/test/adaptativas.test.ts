import { describe, it, expect, vi, beforeEach } from 'vitest';

// Las env vars se cargan al importar el módulo, así que van en un bloque hoisted.
vi.hoisted(() => {
  Object.assign(process.env, {
    SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'clave',
    ANTHROPIC_API_KEY: 'clave', OPENAI_API_KEY: 'clave',
    WA_TOKEN: 'clave', WA_PHONE_NUMBER_ID: '123', WA_VERIFY_TOKEN: 'verificador',
  });
});

const mocks = vi.hoisted(() => ({
  crear: vi.fn(),
  armarHistoria: vi.fn(),
  yaHayAdaptativas: false,
  capturas: [] as any[],
}));

vi.mock('@anthropic-ai/sdk', () => ({ default: class { messages = { create: mocks.crear }; } }));
vi.mock('../src/db/historia.js', () => ({
  armarHistoria: mocks.armarHistoria, ultimaTranscripcion: vi.fn(), traerRespuestas: vi.fn(),
}));
vi.mock('../src/db/cliente.js', () => {
  function crearBuilder(tabla: string) {
    const b: any = { _op: 'select', _filtros: {} as Record<string, any> };
    const eq = (col: string, val: any) => { b._filtros[col] = val; return b; };
    b.select = () => b; b.or = () => b; b.is = () => b; b.order = () => b; b.limit = () => b;
    b.eq = eq; b.gte = eq; b.in = eq;
    b.insert = (p: any) => { b._op = 'insert'; mocks.capturas.push({ tabla, p }); return b; };
    const resolver = () => {
      if (b._op === 'insert') return { data: null, error: null };
      if (tabla === 'preguntas' && b._filtros.orden !== undefined) {
        return { data: mocks.yaHayAdaptativas ? [{ id: 'p26' }] : [] }; // el chequeo de idempotencia
      }
      if (tabla === 'preguntas') return { data: [{ capitulo: 'La infancia' }, { capitulo: 'El amor' }] };
      if (tabla === 'narradores') return { data: { como_le_dicen: 'Don Osvaldo' } };
      return { data: null };
    };
    b.single = () => Promise.resolve(resolver());
    b.maybeSingle = () => Promise.resolve(resolver());
    b.then = (res: any, rej: any) => Promise.resolve(resolver()).then(res, rej);
    return b;
  }
  return { db: { from: (t: string) => crearBuilder(t) } };
});

import { generarPreguntasAdaptativas } from '../src/ia/adaptativas.js';

const CUATRO = JSON.stringify([
  { texto: 'Hábleme de su hermano Tito, que nombró varias veces.', capitulo: 'Las raíces' },
  { texto: '¿Cómo fue volver al barrio después de tantos años?', capitulo: 'La sabiduría' },
  { texto: 'Cuénteme más de aquel viaje a Mar del Plata.', capitulo: 'La juventud' },
  { texto: '¿Qué pasó con el taller cuando su padre ya no estuvo?', capitulo: 'El oficio' },
]);

beforeEach(() => {
  mocks.capturas = [];
  mocks.yaHayAdaptativas = false;
  mocks.crear.mockReset();
  mocks.armarHistoria.mockReset().mockResolvedValue('Toda la historia de Osvaldo...');
});

describe('generarPreguntasAdaptativas', () => {
  it('inserta exactamente 4 preguntas con orden 27-30', async () => {
    mocks.crear.mockResolvedValueOnce({ content: [{ type: 'text', text: CUATRO }] });
    await generarPreguntasAdaptativas('n1');
    const insert = mocks.capturas.find((c) => c.tabla === 'preguntas');
    expect(insert.p).toHaveLength(4);
    expect(insert.p.map((f: any) => f.orden)).toEqual([27, 28, 29, 30]);
    expect(insert.p[0]).toMatchObject({ narrador_id: 'n1', tipo: 'adaptativa', capitulo: 'Las raíces' });
  });

  it('es idempotente: si ya existen, no llama al modelo ni inserta', async () => {
    mocks.yaHayAdaptativas = true;
    await generarPreguntasAdaptativas('n1');
    expect(mocks.crear).not.toHaveBeenCalled();
    expect(mocks.capturas).toHaveLength(0);
  });
});
