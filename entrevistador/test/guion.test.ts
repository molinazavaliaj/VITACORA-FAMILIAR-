import { describe, it, expect, vi, beforeEach } from 'vitest';

// Base falsa: `preguntas` con filas propias y globales; el builder filtra por
// eq/is y ordena por orden.
const estado = vi.hoisted(() => ({ filas: [] as any[] }));

vi.mock('../src/db/cliente.js', () => {
  function builder() {
    const filtros: Record<string, unknown> = {};
    const b: any = {};
    b.select = () => b;
    b.order = () => b;
    b.limit = () => b;
    b.eq = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.is = (c: string, v: unknown) => { filtros[c] = v; return b; };
    b.then = (res: (v: unknown) => unknown) => {
      const data = estado.filas
        .filter((f) => Object.entries(filtros).every(([k, v]) => f[k] === v))
        .sort((a, b) => a.orden - b.orden);
      return Promise.resolve({ data, error: null }).then(res);
    };
    return b;
  }
  return { db: { from: () => builder() } };
});

import { guionDe, preguntaDeOrden, tieneAdaptativas, ultimoOrden } from '../src/db/guion.js';

const global = (orden: number) => ({ id: `g${orden}`, orden, texto: `G${orden}`, capitulo: 'La infancia', tipo: 'fija', foto_id: null, narrador_id: null });
const propia = (orden: number, tipo = 'fija') => ({ id: `p${orden}`, orden, texto: `P${orden}`, capitulo: 'La infancia', tipo, foto_id: null, narrador_id: 'n1' });

beforeEach(() => { estado.filas = []; });

describe('guionDe', () => {
  it('con guion propio, la plantilla global no cuenta: si la familia sacó la 26, la última es la 25', async () => {
    estado.filas = [...Array.from({ length: 26 }, (_, i) => global(i + 1)), ...Array.from({ length: 25 }, (_, i) => propia(i + 1))];
    const { preguntas, propio } = await guionDe('n1');
    expect(propio).toBe(true);
    expect(preguntas).toHaveLength(25);
    expect(await ultimoOrden('n1')).toBe(25);
  });

  it('sin copia (narrador viejo): la plantilla, y lo propio pisa al mismo orden', async () => {
    estado.filas = [global(1), global(2), global(3), propia(2, 'adaptativa')];
    const { preguntas, propio } = await guionDe('n1');
    expect(propio).toBe(false);
    expect(preguntas.map((p) => p.id)).toEqual(['g1', 'p2', 'g3']);
    expect((await preguntaDeOrden('n1', 2))?.texto).toBe('P2');
  });

  it('tieneAdaptativas mira solo las del narrador', async () => {
    estado.filas = [propia(1), propia(27, 'adaptativa')];
    expect(await tieneAdaptativas('n1')).toBe(true);
    estado.filas = [propia(1)];
    expect(await tieneAdaptativas('n1')).toBe(false);
  });
});
