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
import { GET } from '../src/app/api/audio/[respuestaId]/route';
import { PATCH } from '../src/app/api/narrador/[narradorId]/route';

// --- helpers de mock de Supabase --------------------------------------

function construirBuilder(resultado: unknown, onCall?: (metodo: string, args: unknown[]) => void) {
  const builder: Record<string, unknown> = {
    select: (...args: unknown[]) => {
      onCall?.('select', args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      onCall?.('eq', args);
      return builder;
    },
    order: (...args: unknown[]) => {
      onCall?.('order', args);
      return builder;
    },
    update: (...args: unknown[]) => {
      onCall?.('update', args);
      return builder;
    },
    single: () => builder,
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
  const llamadas: Record<string, unknown[][]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx];
    return construirBuilder(resultado, (metodo, args) => {
      llamadas[tabla] = llamadas[tabla] ?? [];
      llamadas[tabla].push([metodo, ...args]);
    });
  });
  const createSignedUrl = vi
    .fn()
    .mockResolvedValue(opciones.signedUrl ?? { data: { signedUrl: 'https://signed.example/x' }, error: null });
  const storage = { from: vi.fn(() => ({ createSignedUrl })) };
  return { from, storage, llamadas, createSignedUrl };
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

// --- GET /api/audio/[respuestaId] ---------------------------------------

describe('GET /api/audio/[respuestaId]', () => {
  it('una respuesta de otra familia devuelve 403', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      respuestas: [
        {
          data: { id: 'resp-1', audio_path: 'narrador-2/dia_01.ogg', narrador_id: 'narrador-2' },
          error: null,
        },
      ],
      narradores: [{ data: { id: 'narrador-2', familia_id: 'familia-OTRA' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { url: 'https://tablero.test/api/audio/resp-1' } as never;
    const respuesta = await GET(request, { params: Promise.resolve({ respuestaId: 'resp-1' }) });

    expect(respuesta.status).toBe(403);
    expect(admin.createSignedUrl).not.toHaveBeenCalled();
  });

  it('una respuesta propia devuelve 302 con Location firmado', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        respuestas: [
          {
            data: { id: 'resp-1', audio_path: 'narrador-1/dia_01.ogg', narrador_id: 'narrador-1' },
            error: null,
          },
        ],
        narradores: [{ data: { id: 'narrador-1', familia_id: 'familia-1' }, error: null }],
      },
      { signedUrl: { data: { signedUrl: 'https://signed.example/audio.ogg' }, error: null } },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { url: 'https://tablero.test/api/audio/resp-1' } as never;
    const respuesta = await GET(request, { params: Promise.resolve({ respuestaId: 'resp-1' }) });

    expect(respuesta.status).toBe(302);
    expect(respuesta.headers.get('location')).toBe('https://signed.example/audio.ogg');
    expect(admin.createSignedUrl).toHaveBeenCalledWith('narrador-1/dia_01.ogg', 3600);
  });

  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const request = { url: 'https://tablero.test/api/audio/resp-1' } as never;
    const respuesta = await GET(request, { params: Promise.resolve({ respuestaId: 'resp-1' }) });
    expect(respuesta.status).toBe(401);
  });
});

// --- PATCH /api/narrador/[narradorId] ------------------------------------

describe('PATCH /api/narrador/[narradorId]', () => {
  it('un narrador de otra familia devuelve 403 (apagar_alerta)', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: { id: 'narrador-2', familia_id: 'familia-OTRA', estado: 'activo' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ accion: 'apagar_alerta' }) } as never;
    const respuesta = await PATCH(request, { params: Promise.resolve({ narradorId: 'narrador-2' }) });

    expect(respuesta.status).toBe(403);
  });

  it('un narrador de otra familia devuelve 403 (cierre_anticipado)', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: { id: 'narrador-2', familia_id: 'familia-OTRA', estado: 'activo' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ accion: 'cierre_anticipado' }) } as never;
    const respuesta = await PATCH(request, { params: Promise.resolve({ narradorId: 'narrador-2' }) });

    expect(respuesta.status).toBe(403);
  });

  it('apagar_alerta en el propio narrador actualiza alerta_silencio a false', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [
        { data: { id: 'narrador-1', familia_id: 'familia-1', estado: 'activo' }, error: null },
        { data: null, error: null }, // update
      ],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ accion: 'apagar_alerta' }) } as never;
    const respuesta = await PATCH(request, { params: Promise.resolve({ narradorId: 'narrador-1' }) });

    expect(respuesta.status).toBe(200);
    const llamadaUpdate = admin.llamadas.narradores.find((l) => l[0] === 'update');
    expect(llamadaUpdate?.[1]).toMatchObject({ alerta_silencio: false });
  });

  it('cierre_anticipado con menos de 10 respuestas responde 400', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: { id: 'narrador-1', familia_id: 'familia-1', estado: 'activo' }, error: null }],
      respuestas: [
        {
          data: [{ pregunta_orden: 1 }, { pregunta_orden: 2 }, { pregunta_orden: 3 }],
          error: null,
        },
      ],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ accion: 'cierre_anticipado' }) } as never;
    const respuesta = await PATCH(request, { params: Promise.resolve({ narradorId: 'narrador-1' }) });

    expect(respuesta.status).toBe(400);
  });

  it('cierre_anticipado con ≥10 respuestas y estado activo pasa a cerrado_anticipado', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const respuestasFake = Array.from({ length: 10 }, (_, i) => ({ pregunta_orden: i + 1 }));
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [
        { data: { id: 'narrador-1', familia_id: 'familia-1', estado: 'pausado' }, error: null },
        { data: null, error: null }, // update
      ],
      respuestas: [{ data: respuestasFake, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ accion: 'cierre_anticipado' }) } as never;
    const respuesta = await PATCH(request, { params: Promise.resolve({ narradorId: 'narrador-1' }) });

    expect(respuesta.status).toBe(200);
    const llamadaUpdate = admin.llamadas.narradores.find((l) => l[0] === 'update');
    expect(llamadaUpdate?.[1]).toMatchObject({ estado: 'cerrado_anticipado' });
  });

  it('cierre_anticipado con estado completado responde 400 (transición inválida)', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: { id: 'narrador-1', familia_id: 'familia-1', estado: 'completado' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ accion: 'cierre_anticipado' }) } as never;
    const respuesta = await PATCH(request, { params: Promise.resolve({ narradorId: 'narrador-1' }) });

    expect(respuesta.status).toBe(400);
  });

  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const request = { json: async () => ({ accion: 'apagar_alerta' }) } as never;
    const respuesta = await PATCH(request, { params: Promise.resolve({ narradorId: 'narrador-1' }) });
    expect(respuesta.status).toBe(401);
  });
});
