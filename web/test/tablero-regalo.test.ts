import { describe, it, expect, vi, beforeEach } from 'vitest';

// /tablero/<id>/regalo: la dueña va a la tarjeta de su regalo; nadie más la ve.

const redirect = vi.fn((url: string) => { throw new Error(`REDIRECT ${url}`); });
const notFound = vi.fn(() => { throw new Error('NOT_FOUND'); });
vi.mock('next/navigation', () => ({ redirect: (u: string) => redirect(u), notFound: () => notFound() }));

const getUser = vi.fn();
vi.mock('@/lib/supabase/sesion', () => ({ crearClienteSesion: async () => ({ auth: { getUser } }) }));

let filaRegalo: unknown = null;
const eq = vi.fn(() => ({ maybeSingle: async () => ({ data: filaRegalo, error: null }) }));
const from = vi.fn(() => ({ select: () => ({ eq }) }));
vi.mock('@/lib/supabase/servidor', () => ({ crearClienteServidor: () => ({ from }) }));

const historiaAccesible = vi.fn();
vi.mock('@/lib/panel', () => ({ historiaAccesible: (...a: unknown[]) => historiaAccesible(...a) }));

import PaginaRegalo from '../src/app/tablero/[narradorId]/regalo/page';

const props = { params: Promise.resolve({ narradorId: 'n1' }) };

describe('/tablero/[narradorId]/regalo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    filaRegalo = { codigo: 'ABC123' };
  });

  it('sin sesión va a entrar', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(PaginaRegalo(props)).rejects.toThrow('REDIRECT /entrar');
  });

  it('la dueña va a la tarjeta de su regalo', async () => {
    historiaAccesible.mockResolvedValue({ historia: { narrador: { id: 'n1' }, rol: 'duena' }, error: null });
    await expect(PaginaRegalo(props)).rejects.toThrow('REDIRECT /regalo/ABC123/tarjeta');
    expect(from).toHaveBeenCalledWith('regalos');
    expect(eq).toHaveBeenCalledWith('narrador_id', 'n1');
  });

  it('un invitado no la ve', async () => {
    historiaAccesible.mockResolvedValue({ historia: { narrador: { id: 'n1' }, rol: 'invitado' }, error: null });
    await expect(PaginaRegalo(props)).rejects.toThrow('NOT_FOUND');
    expect(from).not.toHaveBeenCalled();
  });

  it('sin acceso, no existe', async () => {
    historiaAccesible.mockResolvedValue({ historia: null, error: null });
    await expect(PaginaRegalo(props)).rejects.toThrow('NOT_FOUND');
  });

  it('si la historia no es un regalo, no existe', async () => {
    historiaAccesible.mockResolvedValue({ historia: { narrador: { id: 'n1' }, rol: 'duena' }, error: null });
    filaRegalo = null;
    await expect(PaginaRegalo(props)).rejects.toThrow('NOT_FOUND');
  });
});
