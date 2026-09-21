import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  updates: [] as { p: any; id?: string }[],
  error: null as null | { message: string },
}));

vi.mock('../src/db/cliente.js', () => ({
  db: {
    from: () => {
      const q: any = {
        update: (p: any) => { mocks.updates.push({ p }); return q; },
        eq: (_c: string, id: string) => { mocks.updates[mocks.updates.length - 1].id = id; return q; },
        then: (res: any) => Promise.resolve({ data: null, error: mocks.error }).then(res),
      };
      return q;
    },
    storage: { from: () => ({}) },
  },
}));
vi.mock('../src/whatsapp/media.js', () => ({ pathDeAudio: vi.fn() }));

import { guardarReserva } from '../src/db/respuestas.js';

// Bitácora 19: la evaluación detecta "esto que no vaya al libro"; acá se guarda
// en la fila para que la fábrica tenga qué respetar.
describe('guardarReserva', () => {
  beforeEach(() => { mocks.updates = []; mocks.error = null; vi.restoreAllMocks(); });

  it('sin reserva no toca la base (la columna nace en false)', async () => {
    expect(await guardarReserva('r1', { reservada: false, tramo: null })).toBe(false);
    expect(mocks.updates).toEqual([]);
  });

  it('con reserva entera marca la fila y deja el tramo vacío', async () => {
    expect(await guardarReserva('r1', { reservada: true, tramo: null })).toBe(true);
    expect(mocks.updates).toEqual([{ p: { reservada: true, reservado_tramo: null }, id: 'r1' }]);
  });

  it('con reserva parcial guarda el tramo textual', async () => {
    await guardarReserva('r2', { reservada: true, tramo: 'locuras de las contables' });
    expect(mocks.updates[0]).toEqual({ p: { reservada: true, reservado_tramo: 'locuras de las contables' }, id: 'r2' });
  });

  // La migración la aplica Naza a mano: si el flujo corre antes, PostgREST
  // devuelve "column does not exist" y eso no puede cortar el día del narrador.
  it('si la columna todavía no existe, avisa y no rompe', async () => {
    mocks.error = { message: 'column "reservada" of relation "respuestas" does not exist' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await guardarReserva('r1', { reservada: true, tramo: null })).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('20260920000100_respuestas_reservadas.sql'));
  });
});

// "Esto es de otra parte" (21/09): la marca de que una respuesta pertenece a
// una pregunta anterior, en su fila, para que la fábrica la ubique.
describe('guardarTemaDeOtraParte', () => {
  beforeEach(() => { mocks.updates = []; mocks.error = null; vi.restoreAllMocks(); });

  it('sin marca no toca la base', async () => {
    const { guardarTemaDeOtraParte } = await import('../src/db/respuestas.js');
    expect(await guardarTemaDeOtraParte('r1', null)).toBe(false);
    expect(mocks.updates).toEqual([]);
  });

  it('con marca guarda la orden y el motivo en las dos columnas', async () => {
    const { guardarTemaDeOtraParte } = await import('../src/db/respuestas.js');
    expect(await guardarTemaDeOtraParte('r1', { temaDeOrden: 2, temaMotivo: 'cuenta los juegos del patio' })).toBe(true);
    expect(mocks.updates).toEqual([{ p: { tema_de_orden: 2, tema_motivo: 'cuenta los juegos del patio' }, id: 'r1' }]);
  });

  // (d) La migración la aplica Naza: si el flujo corre antes, no explota y avisa.
  it('si la columna todavía no existe, avisa y no rompe', async () => {
    const { guardarTemaDeOtraParte } = await import('../src/db/respuestas.js');
    mocks.error = { message: 'column "tema_de_orden" of relation "respuestas" does not exist' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await guardarTemaDeOtraParte('r1', { temaDeOrden: 2, temaMotivo: null })).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('20260921000000_tema_de_otra_parte.sql'));
  });
});
