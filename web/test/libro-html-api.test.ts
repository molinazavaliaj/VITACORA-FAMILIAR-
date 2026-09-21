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
import { GET } from '../src/app/api/libro/html/route';

// --- helpers de mock de Supabase (el mismo patrón que descarga.test.ts) ---

function construirBuilder(resultado: unknown) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    in: () => builder,
    is: () => builder,
    ilike: () => builder,
    update: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return builder;
}

// `pedidos` se consulta como una tabla, no como una secuencia: la ruta la lee
// dos veces (primero el entregado, después cualquiera) y las mismas filas
// responden a los `.eq(...)` que les pasan, como la base. Ordena por
// created_at descendente y respeta `.limit`.
function construirBuilderPedidos(resultado: { data: unknown; error: unknown }) {
  const filtros: [string, unknown][] = [];
  let tope: number | null = null;
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (col: string, valor: unknown) => {
      filtros.push([col, valor]);
      return builder;
    },
    order: () => builder,
    limit: (n: number) => {
      tope = n;
      return builder;
    },
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) => {
      if (!Array.isArray(resultado.data)) return Promise.resolve(resultado).then(resolve, reject);
      const filas = (resultado.data as Record<string, unknown>[])
        .filter((fila) => filtros.every(([col, valor]) => !(col in fila) || fila[col] === valor))
        .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
      return Promise.resolve({ ...resultado, data: tope === null ? filas : filas.slice(0, tope) }).then(resolve, reject);
    },
  };
  return builder;
}

function crearAdminFake(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const from = vi.fn((tabla: string) => {
    if (tabla === 'pedidos') {
      return construirBuilderPedidos((secuencia.pedidos?.[0] as { data: unknown; error: unknown }) ?? { data: [], error: null });
    }
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    const resultado = secuencia[tabla]?.[idx] ?? { data: null, error: null };
    return construirBuilder(resultado);
  });
  // Desde el 21/09 el libro no se redirige a la url firmada (Supabase lo
  // entregaría como text/plain): la ruta baja libro.html y lo sirve como HTML.
  const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.example/libro' }, error: null });
  const download = vi.fn().mockResolvedValue({ data: { text: async () => '<!DOCTYPE html><html><body>El libro</body></html>' }, error: null });
  const storage = { from: vi.fn(() => ({ createSignedUrl, download })) };
  return { from, storage, createSignedUrl, download };
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

// Con `?narrador=n1` la ruta pasa por historiaAccesible: primero busca el
// narrador, después la familia del usuario y por último sus invitaciones.
function fakeRequest(): never {
  return { nextUrl: new URL('http://localhost/api/libro/html?narrador=n1') } as never;
}

const narradorN1 = {
  id: 'n1', nombre: 'Osvaldo', como_le_dicen: 'Abuelo', estado: 'completado',
  dia_actual: 30, alerta_silencio: false, familia_id: 'familia-1', created_at: '2026-09-01',
};

function adminComoDuena(pedidos: unknown[]) {
  return crearAdminFake({
    narradores: [{ data: narradorN1, error: null }],
    familias: [{ data: { id: 'familia-1' }, error: null }],
    pedidos: [{ data: pedidos, error: null }],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    getAll: () => [],
    set: () => {},
  });
});

describe('GET /api/libro/html', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(401);
  });

  it('pedido entregado → sirve libro.html como HTML de verdad (no una redirección a Storage)', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminComoDuena([{ id: 'pedido-1', estado: 'entregado' }]);
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await respuesta.text()).toContain('El libro');
    expect(admin.storage.from).toHaveBeenCalledWith('audios');
    expect(admin.download.mock.calls[0][0]).toBe('n1/paquete/libro.html');
    expect(admin.createSignedUrl).not.toHaveBeenCalled();
  });

  it('pedido no entregado → 404, aunque la fábrica ya haya subido el html', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminComoDuena([{ id: 'pedido-1', estado: 'generando' }]);
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(404);
    expect(await respuesta.json()).toEqual({ error: 'El libro todavía no está listo.' });
    expect(admin.download).not.toHaveBeenCalled();
  });

  it('con un pedido "pendiente" más nuevo (el checkout abandonado de un desconocido) igual sirve el libro entregado', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminComoDuena([
      { id: 'pedido-2', estado: 'pendiente', created_at: '2026-09-13T10:00:00Z' },
      { id: 'pedido-1', estado: 'entregado', created_at: '2026-09-01T10:00:00Z' },
    ]);
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(200);
    expect(admin.download.mock.calls[0][0]).toBe('n1/paquete/libro.html');
  });

  it('sin ningún pedido → 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = adminComoDuena([]);
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(404);
  });

  it('un invitado (no dueña) también recibe el libro — lee, no baja', async () => {
    mockSesion({ id: 'user-2', email: 'tia@test.com' });
    // Sin familia propia: la historia le llega por la tabla invitados.
    const admin = crearAdminFake({
      narradores: [{ data: narradorN1, error: null }],
      familias: [{ data: null, error: null }, { data: null, error: null }],
      invitados: [{ data: [{ narrador_id: 'n1', rol: 'invitado' }], error: null }, { data: [], error: null }],
      pedidos: [{ data: [{ id: 'pedido-1', estado: 'entregado' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(200);
    expect(admin.download.mock.calls[0][0]).toBe('n1/paquete/libro.html');
  });

  it('un visitante (guardó el link público) recibe 403: la muestra no incluye el libro', async () => {
    mockSesion({ id: 'user-4', email: 'vecino@test.com' });
    const admin = crearAdminFake({
      narradores: [{ data: narradorN1, error: null }],
      familias: [{ data: null, error: null }, { data: null, error: null }],
      invitados: [{ data: [{ narrador_id: 'n1', rol: 'visitante' }], error: null }, { data: [], error: null }],
      pedidos: [{ data: [{ id: 'pedido-1', estado: 'entregado' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(403);
    expect(await respuesta.json()).toEqual({ error: 'La muestra no incluye el libro completo.' });
    expect(admin.download).not.toHaveBeenCalled();
  });

  it('quien no tiene acceso a esa historia recibe 403', async () => {
    mockSesion({ id: 'user-3', email: 'nadie@test.com' });
    const admin = crearAdminFake({
      narradores: [{ data: narradorN1, error: null }],
      familias: [{ data: null, error: null }, { data: null, error: null }],
      invitados: [{ data: [], error: null }, { data: [], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET(fakeRequest());
    expect(respuesta.status).toBe(403);
    expect(admin.download).not.toHaveBeenCalled();
  });
});
