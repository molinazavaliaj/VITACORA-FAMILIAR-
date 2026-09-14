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
import { GET as GET_AUDIO } from '../src/app/api/libro/audio/[indice]/route';

// --- helpers de mock de Supabase --------------------------------------

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

// `pedidos` se consulta como una tabla, no como una secuencia: las rutas la
// leen dos veces (primero el entregado, después cualquiera) y las mismas
// filas tienen que responder a los `.eq(...)` que les pasan, como la base.
// Ordena por created_at descendente y respeta `.limit`.
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

function crearAdminFake(
  secuencia: Record<string, unknown[]>,
  opciones: { signedUrl?: { data: unknown; error: unknown } } = {},
) {
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
  // Las rutas leen `?narrador=` de la URL (lib/panel.ts). Sin el parámetro,
  // toman la primera historia del usuario — el comportamiento de antes.
  return { nextUrl: new URL("http://localhost/api") } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    getAll: () => [],
    set: () => {},
  });
});

// --- (la ruta del PDF se fue el 14/09: nada se descarga; el libro se lee en /api/libro/html)

describe('GET /api/libro/audio/[indice]', () => {
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

  it('con un pedido "pendiente" más nuevo sobre el mismo narrador, igual firma el audio del entregado', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      pedidos: [
        {
          data: [
            { id: 'pedido-2', estado: 'pendiente', audiolibro_paths: null, created_at: '2026-09-13T10:00:00Z' },
            { id: 'pedido-1', estado: 'entregado', audiolibro_paths: paths, created_at: '2026-09-01T10:00:00Z' },
          ],
          error: null,
        },
      ],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequest(), { params: Promise.resolve({ indice: '0' }) });
    expect(respuesta.status).toBe(302);
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe(paths.capitulos[0]);
  });

  // --- quién escucha qué (14/09, nada se descarga): todo lo oye cualquiera
  // que vea la historia completa (dueña e invitado); el visitante, nada.

  // Con `?narrador=` el rol sale de historiaAccesible: narrador → familia
  // del usuario (ninguna) → invitaciones.
  function fakeRequestConNarrador(): never {
    return { nextUrl: new URL('http://localhost/api?narrador=narrador-1') } as never;
  }

  function adminComoInvitado(rol: 'invitado' | 'visitante') {
    return crearAdminFake({
      narradores: [{ data: { id: 'narrador-1', familia_id: 'familia-1' }, error: null }],
      familias: [{ data: null, error: null }, { data: null, error: null }],
      invitados: [{ data: [{ narrador_id: 'narrador-1', rol }], error: null }, { data: [], error: null }],
      pedidos: [{ data: [{ id: 'pedido-1', estado: 'entregado', audiolibro_paths: paths }], error: null }],
    });
  }

  it('un invitado con índice numérico escucha el capítulo (302)', async () => {
    mockSesion({ id: 'user-2', email: 'tia@test.com' });
    const admin = adminComoInvitado('invitado');
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequestConNarrador(), { params: Promise.resolve({ indice: '0' }) });
    expect(respuesta.status).toBe(302);
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe(paths.capitulos[0]);
  });

  it('un invitado también escucha el "completo": ya nada se descarga, se escucha en la web (302)', async () => {
    mockSesion({ id: 'user-2', email: 'tia@test.com' });
    const admin = adminComoInvitado('invitado');
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequestConNarrador(), { params: Promise.resolve({ indice: 'completo' }) });
    expect(respuesta.status).toBe(302);
    expect(admin.createSignedUrl.mock.calls[0][0]).toBe(paths.completo);
  });

  it('un visitante con índice numérico recibe 403: la muestra no trae el audiolibro', async () => {
    mockSesion({ id: 'user-4', email: 'vecino@test.com' });
    const admin = adminComoInvitado('visitante');
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_AUDIO(fakeRequestConNarrador(), { params: Promise.resolve({ indice: '0' }) });
    expect(respuesta.status).toBe(403);
    expect(admin.createSignedUrl).not.toHaveBeenCalled();
  });
});
