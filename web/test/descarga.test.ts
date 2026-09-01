import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/servidor', () => ({
  crearClienteServidor: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { crearClienteServidor } from '@/lib/supabase/servidor';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { GET as GET_LIBRO } from '../src/app/api/descarga/libro/route';
import { GET as GET_AUDIO } from '../src/app/api/descarga/audio/[indice]/route';

// --- helpers de mock de Supabase --------------------------------------

function construirBuilder(resultado: unknown) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: () => builder,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return builder;
}

function crearAdminFake(
  secuencia: Record<string, unknown[]>,
  opciones: { signedUrl?: { data: unknown; error: unknown } } = {},
) {
  const contadores: Record<string, number> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx];
    return construirBuilder(resultado);
  });
  const createSignedUrl = vi
    .fn()
    .mockResolvedValue(opciones.signedUrl ?? { data: { signedUrl: 'https://signed.example/x' }, error: null });
  const storage = { from: vi.fn(() => ({ createSignedUrl })) };
  return { from, storage, createSignedUrl };
}

function mockSesion(usuario: { id: string; email: string } | null) {
  (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue(
        usuario
          ? { data: { user: usuario }, error: null }
          : { data: { user: null }, error: { message: 'sin sesion' } },
      ),
    },
  });
}

function fakeRequest(): never {
  // Las rutas no leen nada del request más que los params — no hace falta
  // un Request real.
  return undefined as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    getAll: () => [],
    set: () => {},
  });
});

// --- GET /api/descarga/libro --------------------------------------------------

describe('GET /api/descarga/libro', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const respuesta = await GET_LIBRO();
    expect(respuesta.status).toBe(401);
  });

  it('familia de otra sesión (sin fila) responde 403', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({ familias: [{ data: null, error: null }] });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_LIBRO();
    expect(respuesta.status).toBe(403);
  });

  it('sin ningún pedido responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      pedidos: [{ data: [], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_LIBRO();
    expect(respuesta.status).toBe(404);
  });

  it('con pedido "pagado" (todavía no entregado) responde 404 — no hay nada que firmar', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      pedidos: [{ data: [{ id: 'pedido-1', estado: 'pagado', libro_pdf_path: null }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_LIBRO();
    expect(respuesta.status).toBe(404);
  });

  it('con pedido entregado redirige a la url firmada de libro_pdf_path', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      pedidos: [
        {
          data: [{ id: 'pedido-1', estado: 'entregado', libro_pdf_path: 'narrador-1/paquete/libro.pdf' }],
          error: null,
        },
      ],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_LIBRO();
    expect(respuesta.status).toBe(302);
    expect(respuesta.headers.get('location')).toBe('https://signed.example/x');
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe('narrador-1/paquete/libro.pdf');
  });
});

// --- GET /api/descarga/audio/[indice] --------------------------------------------------

describe('GET /api/descarga/audio/[indice]', () => {
  const paths = {
    capitulos: ['narrador-1/paquete/audiolibro_cap_01.mp3', 'narrador-1/paquete/audiolibro_cap_02.mp3'],
    bonus: 'narrador-1/paquete/audiolibro_bonus_saludos.mp3',
    completo: 'narrador-1/paquete/audiolibro_completo.mp3',
  };

  function adminEntregado(pathsAudiolibro: unknown = paths) {
    return crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      pedidos: [
        { data: [{ id: 'pedido-1', estado: 'entregado', audiolibro_paths: pathsAudiolibro }], error: null },
      ],
    });
  }

  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: '0' }) });
    expect(respuesta.status).toBe(401);
  });

  it('indice "completo" firma audiolibro_paths.completo', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminEntregado();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: 'completo' }) });
    expect(respuesta.status).toBe(302);
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe(paths.completo);
  });

  it('indice "bonus" firma audiolibro_paths.bonus', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminEntregado();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: 'bonus' }) });
    expect(respuesta.status).toBe(302);
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe(paths.bonus);
  });

  it('indice "bonus" sin bonus en el pedido (nadie mandó saludos) responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminEntregado({ capitulos: paths.capitulos, completo: paths.completo });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: 'bonus' }) });
    expect(respuesta.status).toBe(404);
  });

  it('indice numérico firma el capítulo correspondiente', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminEntregado();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: '1' }) });
    expect(respuesta.status).toBe(302);
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe(paths.capitulos[1]);
  });

  it('indice numérico fuera de rango responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminEntregado();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: '99' }) });
    expect(respuesta.status).toBe(404);
  });

  it('indice inválido (no numérico, no bonus/completo) responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminEntregado();
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: 'quien-sabe' }) });
    expect(respuesta.status).toBe(404);
  });

  it('pedido todavía no entregado responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      pedidos: [{ data: [{ id: 'pedido-1', estado: 'generando', audiolibro_paths: null }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: '0' }) });
    expect(respuesta.status).toBe(404);
  });
});
