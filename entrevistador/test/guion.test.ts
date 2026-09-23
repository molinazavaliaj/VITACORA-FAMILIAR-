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

import { guionDe, preguntaDeOrden, tieneAdaptativas, ultimoOrden, guionDeDias, esUltimaDelCapitulo, objetoDelCapitulo, capitulosDe } from '../src/db/guion.js';

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

// ── Las preguntas de objeto (3t.30) ───────────────────────────────────────
// Viven en la banda 101-108, fuera de la cuenta de días: se ven en el guion
// pero no avanzan el recorrido ni son "la última pregunta" de nadie.
const enCapitulo = (orden: number, capitulo: string, tipo = 'fija') =>
  ({ id: `x${orden}`, orden, texto: `T${orden}`, capitulo, tipo, foto_id: null, narrador_id: 'n1' });

describe('las preguntas de objeto', () => {
  const GUION = [
    enCapitulo(1, 'La infancia'), enCapitulo(2, 'La infancia'),
    enCapitulo(3, 'Las raíces'), enCapitulo(4, 'Las raíces'),
    enCapitulo(101, 'La infancia', 'objeto'), enCapitulo(102, 'Las raíces', 'objeto'),
  ];

  it('no cuentan como la última pregunta: el cierre y las adaptativas miran solo los días', async () => {
    estado.filas = [...GUION];
    expect(await ultimoOrden('n1')).toBe(4);
    expect((await guionDeDias('n1')).map((p) => p.orden)).toEqual([1, 2, 3, 4]);
  });

  it('siguen estando en el guion (el panel las ve, se editan y se borran)', async () => {
    estado.filas = [...GUION];
    const { preguntas } = await guionDe('n1');
    expect(preguntas.map((p) => p.orden)).toEqual([1, 2, 3, 4, 101, 102]);
    expect(await preguntaDeOrden('n1', 101)).toMatchObject({ tipo: 'objeto', capitulo: 'La infancia' });
  });

  it('el pedido sale con la ÚLTIMA de cada capítulo, no con las del medio', async () => {
    estado.filas = [...GUION];
    expect(await esUltimaDelCapitulo('n1', 1)).toBe(false);
    expect(await esUltimaDelCapitulo('n1', 2)).toBe(true);  // cierra La infancia
    expect(await esUltimaDelCapitulo('n1', 3)).toBe(false);
    expect(await esUltimaDelCapitulo('n1', 4)).toBe(true);  // cierra el guion entero
  });

  it('una pregunta de objeto nunca cierra un capítulo (no está en el recorrido)', async () => {
    estado.filas = [...GUION];
    expect(await esUltimaDelCapitulo('n1', 101)).toBe(false);
    expect(await esUltimaDelCapitulo('n1', 999)).toBe(false); // ni una que no existe
  });

  it('cada capítulo encuentra su pedido, y el que no lo tiene devuelve null', async () => {
    estado.filas = [...GUION];
    expect(await objetoDelCapitulo('n1', 'La infancia')).toMatchObject({ orden: 101 });
    expect(await objetoDelCapitulo('n1', 'Las raíces')).toMatchObject({ orden: 102 });
    expect(await objetoDelCapitulo('n1', 'El oficio')).toBeNull();
  });

  it('si la familia borró el pedido del panel, ese capítulo simplemente no lo pide', async () => {
    estado.filas = GUION.filter((p) => p.orden !== 101);
    expect(await objetoDelCapitulo('n1', 'La infancia')).toBeNull();
    expect(await ultimoOrden('n1')).toBe(4);
  });

  it('los capítulos del libro salen de los días: un pedido suelto no inventa un capítulo', async () => {
    estado.filas = [enCapitulo(1, 'La infancia'), enCapitulo(108, 'La sabiduría', 'objeto')];
    expect(await capitulosDe('n1')).toEqual(['La infancia']);
  });
});
