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
import { GET as GET_ESTRUCTURA } from '../src/app/api/estructura/route';
import { GET as GET_NOMBRES, POST as POST_NOMBRES } from '../src/app/api/nombres/route';

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
    limit: (...args: unknown[]) => {
      onCall?.('limit', args);
      return builder;
    },
    single: () => builder,
    maybeSingle: () => builder,
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return builder;
}

function blobFake(contenido: string) {
  return { text: async () => contenido };
}

function crearAdminFake(
  secuencia: Record<string, unknown[]>,
  opciones: {
    download?: (ruta: string) => Promise<{ data: unknown; error: unknown }>;
    upload?: { data: unknown; error: unknown };
  } = {},
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
  const download = vi.fn(
    opciones.download ?? (() => Promise.resolve({ data: null, error: { message: 'no existe' } })),
  );
  const upload = vi.fn().mockResolvedValue(opciones.upload ?? { data: { path: 'x' }, error: null });
  const storage = { from: vi.fn(() => ({ download, upload })) };
  return { from, storage, llamadas, download, upload };
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

// --- GET /api/estructura ---------------------------------------------------

describe('GET /api/estructura', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const respuesta = await GET_ESTRUCTURA();
    expect(respuesta.status).toBe(401);
  });

  it('sin familia registrada responde 403', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({ familias: [{ data: null, error: null }] });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_ESTRUCTURA();
    expect(respuesta.status).toBe(403);
  });

  it('sin narrador responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_ESTRUCTURA();
    expect(respuesta.status).toBe(404);
  });

  it('si estructura.json no existe todavía en Storage responde 404', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { download: () => Promise.resolve({ data: null, error: { message: 'not found' } }) },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_ESTRUCTURA();
    expect(respuesta.status).toBe(404);
  });

  it('devuelve el JSON de estructura.json del narrador de la familia', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const estructura = {
      titulo: 'Roberto — La historia de una vida',
      capitulos: [{ nombre: 'Infancia', ordenes: [1] }],
      entidades: [{ texto: 'Rosorio', tipo: 'lugar', contexto: 'ciudad donde nació' }],
    };
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { download: (ruta) => {
        expect(ruta).toBe('narrador-1/paquete/estructura.json');
        return Promise.resolve({ data: blobFake(JSON.stringify(estructura)), error: null });
      } },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_ESTRUCTURA();
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo).toEqual(estructura);
  });
});

// --- GET /api/nombres --------------------------------------------------------

describe('GET /api/nombres', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const respuesta = await GET_NOMBRES();
    expect(respuesta.status).toBe(401);
  });

  it('si nombres.json no existe todavía devuelve { correcciones: [] } con 200', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { download: () => Promise.resolve({ data: null, error: { message: 'not found' } }) },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_NOMBRES();
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo).toEqual({ correcciones: [] });
  });

  it('si nombres.json existe devuelve su contenido', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const nombres = { correcciones: [{ original: 'Rosorio', corregido: 'Rosario' }] };
    const admin = crearAdminFake(
      {
        familias: [{ data: { id: 'familia-1' }, error: null }],
        narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
      },
      { download: () => Promise.resolve({ data: blobFake(JSON.stringify(nombres)), error: null }) },
    );
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await GET_NOMBRES();
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo).toEqual(nombres);
  });
});

// --- POST /api/nombres -------------------------------------------------------

describe('POST /api/nombres', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const request = { json: async () => ({ correcciones: [] }) } as never;
    const respuesta = await POST_NOMBRES(request);
    expect(respuesta.status).toBe(401);
  });

  it('sin familia responde 403', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({ familias: [{ data: null, error: null }] });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ correcciones: [] }) } as never;
    const respuesta = await POST_NOMBRES(request);
    expect(respuesta.status).toBe(403);
  });

  it('body sin correcciones (no es array) responde 400', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ correcciones: 'no es un array' }) } as never;
    const respuesta = await POST_NOMBRES(request);
    expect(respuesta.status).toBe(400);
    expect(admin.upload).not.toHaveBeenCalled();
  });

  it('una corrección con original vacío responde 400', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      json: async () => ({ correcciones: [{ original: '   ', corregido: 'Rosario' }] }),
    } as never;
    const respuesta = await POST_NOMBRES(request);
    expect(respuesta.status).toBe(400);
    expect(admin.upload).not.toHaveBeenCalled();
  });

  it('más de 200 correcciones responde 400', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const correcciones = Array.from({ length: 201 }, (_, i) => ({
      original: `Original${i}`,
      corregido: `Corregido${i}`,
    }));
    const request = { json: async () => ({ correcciones }) } as never;
    const respuesta = await POST_NOMBRES(request);
    expect(respuesta.status).toBe(400);
    expect(admin.upload).not.toHaveBeenCalled();
  });

  it('cuerpo válido sube nombres.json con upsert y contentType JSON', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const correcciones = [{ original: 'Rosorio', corregido: 'Rosario' }];
    const request = { json: async () => ({ correcciones }) } as never;
    const respuesta = await POST_NOMBRES(request);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.ok).toBe(true);
    expect(admin.storage.from).toHaveBeenCalledWith('audios');
    const [rutaSubida, contenidoSubido, opcionesSubida] = admin.upload.mock.calls[0];
    expect(rutaSubida).toBe('narrador-1/paquete/nombres.json');
    expect(JSON.parse(contenidoSubido as string)).toEqual({ correcciones });
    expect(opcionesSubida).toMatchObject({ contentType: 'application/json', upsert: true });
  });

  it('un cuerpo con correcciones vacío también sube nombres.json (marca la revisión hecha)', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => ({ correcciones: [] }) } as never;
    const respuesta = await POST_NOMBRES(request);

    expect(respuesta.status).toBe(200);
    expect(admin.upload).toHaveBeenCalledTimes(1);
  });
});
