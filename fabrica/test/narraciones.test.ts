import { describe, it, expect, vi } from 'vitest';
import {
  RUTA_NARRACION_JSON,
  clasificarAtascadas,
  crearNarracion,
  narracionesAtascadas,
  narracionesListas,
} from '../src/voz/narraciones.js';

// --- fake de admin ----------------------------------------------------------
//
// Mismo patrón que generar-paquete.test.ts: una cola de resultados por tabla
// (cada `from(tabla)` consume el siguiente) y un registro de lo que se
// encadenó — filtros, inserts, updates — para que los tests miren qué se le
// pidió a la base y no solo que "se llamó algo".

type Resultado = { data: unknown; error: { message: string } | null };
type Llamada = { tabla: string; cadena: [string, unknown[]][] };

function construirDbFake(colas: Record<string, Resultado[]>) {
  const llamadas: Llamada[] = [];

  const from = vi.fn((tabla: string) => {
    const resultado = colas[tabla]?.shift();
    if (!resultado) throw new Error(`sin resultado en cola para la tabla ${tabla}`);
    const llamada: Llamada = { tabla, cadena: [] };
    llamadas.push(llamada);

    const builder: Record<string, unknown> = {};
    for (const metodo of ['select', 'eq', 'in', 'insert', 'update', 'order', 'limit']) {
      builder[metodo] = (...args: unknown[]) => {
        llamada.cadena.push([metodo, args]);
        return builder;
      };
    }
    builder.single = () => {
      llamada.cadena.push(['single', []]);
      return Promise.resolve(resultado);
    };
    builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolve, reject);
    return builder;
  });

  return { from, llamadas };
}

const db = (fake: ReturnType<typeof construirDbFake>) => fake as unknown as Parameters<typeof crearNarracion>[0];

const paso = (llamada: Llamada, metodo: string) => llamada.cadena.find(([m]) => m === metodo)?.[1] as any[] | undefined;

describe('RUTA_NARRACION_JSON', () => {
  it('vive en la carpeta paquete del narrador', () => {
    expect(RUTA_NARRACION_JSON('n1')).toBe('n1/paquete/narracion.json');
  });
});

describe('crearNarracion', () => {
  it('inserta la fila pendiente para el pedido y devuelve el id', async () => {
    const fake = construirDbFake({
      narraciones: [
        { data: [], error: null }, // no hay ninguna viva para ese pedido
        { data: { id: 'narr-1' }, error: null }, // el insert
      ],
    });

    const id = await crearNarracion(db(fake), { narradorId: 'n1', pedidoId: 'p1' });

    expect(id).toBe('narr-1');
    expect(fake.llamadas).toHaveLength(2);
    // buscó por pedido y solo entre las que no fallaron.
    expect(paso(fake.llamadas[0], 'eq')).toEqual(['pedido_id', 'p1']);
    expect(paso(fake.llamadas[0], 'in')).toEqual(['estado', ['pendiente', 'procesando', 'lista']]);
    // insertó exactamente lo que la fábrica escribe (el resto lo pone el worker).
    expect(paso(fake.llamadas[1], 'insert')).toEqual([{ narrador_id: 'n1', pedido_id: 'p1', estado: 'pendiente' }]);
  });

  it('si ya hay una pendiente|procesando|lista para ese pedido, no inserta y devuelve esa', async () => {
    const fake = construirDbFake({
      narraciones: [{ data: [{ id: 'narr-ya' }], error: null }],
    });

    const id = await crearNarracion(db(fake), { narradorId: 'n1', pedidoId: 'p1' });

    expect(id).toBe('narr-ya');
    expect(fake.llamadas).toHaveLength(1);
    expect(paso(fake.llamadas[0], 'insert')).toBeUndefined();
  });

  it('si Supabase falla, tira con el mensaje', async () => {
    const fake = construirDbFake({
      narraciones: [{ data: null, error: { message: 'se cayó' } }],
    });

    await expect(crearNarracion(db(fake), { narradorId: 'n1', pedidoId: 'p1' })).rejects.toThrow(/se cayó/);
  });
});

describe('narracionesListas', () => {
  it('devuelve las listas cuyo pedido sigue esperando_voz', async () => {
    const fake = construirDbFake({
      narraciones: [
        {
          data: [
            { id: 'a', narrador_id: 'n1', pedido_id: 'p1', capitulos_paths: ['n1/voz/cap_01.mp3'] },
            { id: 'b', narrador_id: 'n2', pedido_id: 'p2', capitulos_paths: ['n2/voz/cap_01.mp3'] },
          ],
          error: null,
        },
      ],
      // p2 ya no está esperando (alguien lo entregó o lo marcó fallido).
      pedidos: [{ data: [{ id: 'p1' }], error: null }],
    });

    const listas = await narracionesListas(db(fake));

    expect(listas).toEqual([{ id: 'a', narrador_id: 'n1', pedido_id: 'p1', capitulos_paths: ['n1/voz/cap_01.mp3'] }]);
    expect(paso(fake.llamadas[0], 'eq')).toEqual(['estado', 'lista']);
    expect(paso(fake.llamadas[1], 'in')).toEqual(['id', ['p1', 'p2']]);
    expect(paso(fake.llamadas[1], 'eq')).toEqual(['estado', 'esperando_voz']);
  });

  it('sin narraciones listas no consulta pedidos', async () => {
    const fake = construirDbFake({ narraciones: [{ data: [], error: null }] });

    expect(await narracionesListas(db(fake))).toEqual([]);
    expect(fake.llamadas).toHaveLength(1);
  });
});

describe('clasificarAtascadas', () => {
  const ahora = new Date('2026-09-16T12:00:00Z');
  const hace = (horas: number) => new Date(ahora.getTime() - horas * 3_600_000).toISOString();

  it('pendiente de hace 25 h → pendiente_24h; procesando sin avance hace 7 h → procesando_6h; fallida → fallida; pendiente de hace 1 h → nada', () => {
    const filas = [
      { id: 'a', narrador_id: 'n1', estado: 'pendiente', created_at: hace(25), tomada_at: null, actualizada_at: hace(25), error: null },
      { id: 'b', narrador_id: 'n2', estado: 'procesando', created_at: hace(8), tomada_at: hace(7), actualizada_at: hace(7), error: null },
      { id: 'c', narrador_id: 'n3', estado: 'fallida', created_at: hace(2), tomada_at: hace(1), actualizada_at: hace(1), error: 'sin_consentimiento_voz' },
      { id: 'd', narrador_id: 'n4', estado: 'pendiente', created_at: hace(1), tomada_at: null, actualizada_at: hace(1), error: null },
      { id: 'e', narrador_id: 'n5', estado: 'procesando', created_at: hace(3), tomada_at: hace(2), actualizada_at: hace(2), error: null },
    ];

    expect(clasificarAtascadas(filas, ahora)).toEqual([
      { id: 'a', narrador_id: 'n1', motivo: 'pendiente_24h', error: null },
      { id: 'b', narrador_id: 'n2', motivo: 'procesando_6h', error: null },
      { id: 'c', narrador_id: 'n3', motivo: 'fallida', error: 'sin_consentimiento_voz' },
    ]);
  });

  it('un libro largo: procesando tomada hace 9 h pero con un capítulo subido hace 1 h NO está colgada', () => {
    // "Colgada" es sin avance en 6 h: se mide desde `actualizada_at` (cada
    // checkpoint del worker la mueve), no desde `tomada_at`.
    const filas = [
      { id: 'b', narrador_id: 'n2', estado: 'procesando', created_at: hace(10), tomada_at: hace(9), actualizada_at: hace(1), error: null },
    ];

    expect(clasificarAtascadas(filas, ahora)).toEqual([]);
  });
});

describe('narracionesAtascadas', () => {
  it('pide las no terminadas y las clasifica', async () => {
    const ahora = new Date('2026-09-16T12:00:00Z');
    const fake = construirDbFake({
      narraciones: [
        {
          data: [
            { id: 'a', narrador_id: 'n1', estado: 'pendiente', created_at: '2026-09-15T00:00:00Z', tomada_at: null, actualizada_at: '2026-09-15T00:00:00Z', error: null },
            { id: 'd', narrador_id: 'n4', estado: 'pendiente', created_at: '2026-09-16T11:30:00Z', tomada_at: null, actualizada_at: '2026-09-16T11:30:00Z', error: null },
          ],
          error: null,
        },
      ],
    });

    const atascadas = await narracionesAtascadas(db(fake), ahora);

    expect(atascadas).toEqual([{ id: 'a', narrador_id: 'n1', motivo: 'pendiente_24h', error: null }]);
    expect(paso(fake.llamadas[0], 'in')).toEqual(['estado', ['pendiente', 'procesando', 'fallida']]);
    expect(paso(fake.llamadas[0], 'select')).toEqual(['id, narrador_id, estado, created_at, actualizada_at, error']);
  });
});
