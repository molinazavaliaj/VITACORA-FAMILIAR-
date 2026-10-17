import { describe, it, expect } from 'vitest';
import { narradoresConKids } from '../src/kids/candado.js';

function db(o: { filas?: { narrador_id: string }[]; error?: { code: string; message: string } }) {
  return { from: () => ({ select: async () => (o.error ? { data: null, error: o.error } : { data: o.filas ?? [], error: null }) }) } as never;
}

describe('el candado de Kids de la fábrica', () => {
  it('narradoresConKids: los de la tabla; sin la migración (42P01 / PGRST205), ninguno; con otro error, tira', async () => {
    expect(await narradoresConKids(db({ filas: [{ narrador_id: 'c1' }, { narrador_id: 'c2' }] }))).toEqual(new Set(['c1', 'c2']));
    expect(await narradoresConKids(db({ error: { code: '42P01', message: 'relation "kids_v2" does not exist' } }))).toEqual(new Set());
    expect(await narradoresConKids(db({ error: { code: 'PGRST205', message: "Could not find the table 'public.kids_v2'" } }))).toEqual(new Set());
    await expect(narradoresConKids(db({ error: { code: '57014', message: 'timeout' } }))).rejects.toThrow(/kids_v2/);
  });
});
