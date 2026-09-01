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
import { GET as GET_PREVIEW_PDF } from '../src/app/api/preview-pdf/route';
import { GET as GET_PREVIEW_AUDIO } from '../src/app/api/preview-audio/route';

// --- helpers de mock de Supabase --------------------------------------

function construirBuilder(resultado: unknown) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return builder;
}

function crearAdminFake(
  secuencia: Record<string, unknown[]>,
  opciones: {
    list?: (ruta: string) => Promise<{ data: unknown; error: unknown }>;
    signedUrl?: { data: unknown; error: unknown };
  } = {},
) {
  const contadores: Record<string, number> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx];
    return construirBuilder(resultado);
  });
  const list = vi.fn(
    opciones.list ?? (() => Promise.resolve({ data: [], error: null })),
  );
  const createSignedUrl = vi
    .fn()
    .mockResolvedValue(opciones.signedUrl ?? { data: { signedUrl: 'https://signed.example/x' }, error: null });
  const storage = { from: vi.fn(() => ({ list, createSignedUrl })) };
  return { from, storage, list, createSignedUrl };
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

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    getAll: () => [],
    set: () => {},
  });
});

// --- GET /api/preview-pdf --------------------------------------------------

describe('GET /api/preview-pdf', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const respuesta = await GET_PREVIEW_PDF();
    expect(respuesta.status).toBe(401);
  });

  it('si preview.pdf todavía no existe en Storage responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { list: () => Promise.resolve({ data: [{ name: 'estructura.json' }], error: null }) },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_PREVIEW_PDF();
    expect(respuesta.status).toBe(404);
  });

  it('si preview.pdf existe redirige a la url firmada', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { list: () => Promise.resolve({ data: [{ name: 'preview.pdf' }], error: null }) },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_PREVIEW_PDF();
    expect(respuesta.status).toBe(302);
    expect(respuesta.headers.get('location')).toBe('https://signed.example/x');
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe('narrador-1/paquete/preview.pdf');
  });
});

// --- GET /api/preview-audio --------------------------------------------------

describe('GET /api/preview-audio', () => {
  it('si muestra_audiolibro.mp3 todavía no existe en Storage responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { list: () => Promise.resolve({ data: [], error: null }) },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_PREVIEW_AUDIO();
    expect(respuesta.status).toBe(404);
  });

  it('si muestra_audiolibro.mp3 existe redirige a la url firmada', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { list: () => Promise.resolve({ data: [{ name: 'muestra_audiolibro.mp3' }], error: null }) },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_PREVIEW_AUDIO();
    expect(respuesta.status).toBe(302);
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe('narrador-1/paquete/muestra_audiolibro.mp3');
  });
});
