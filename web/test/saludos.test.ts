import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
import { firmarTokenSaludo, verificarTokenSaludo } from '../src/lib/token-saludo';
import { POST } from '../src/app/api/saludos/route';
import { DELETE } from '../src/app/api/saludos/[saludoId]/route';
import { GET } from '../src/app/api/saludo-audio/[saludoId]/route';

// --- helpers de mock de Supabase --------------------------------------

function construirBuilder(
  resultado: unknown,
  onCall?: (metodo: string, args: unknown[]) => void,
) {
  const builder: Record<string, unknown> = {
    select: (...args: unknown[]) => {
      onCall?.('select', args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      onCall?.('eq', args);
      return builder;
    },
    insert: (...args: unknown[]) => {
      onCall?.('insert', args);
      return builder;
    },
    delete: (...args: unknown[]) => {
      onCall?.('delete', args);
      return builder;
    },
    order: (...args: unknown[]) => {
      onCall?.('order', args);
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
  opciones: {
    signedUrl?: { data: unknown; error: unknown };
    upload?: { data: unknown; error: unknown };
    remove?: { data: unknown; error: unknown };
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
  const createSignedUrl = vi
    .fn()
    .mockResolvedValue(
      opciones.signedUrl ?? { data: { signedUrl: 'https://signed.example/saludo.webm' }, error: null },
    );
  const upload = vi.fn().mockResolvedValue(opciones.upload ?? { data: { path: 'x' }, error: null });
  const remove = vi.fn().mockResolvedValue(opciones.remove ?? { data: {}, error: null });
  const storage = { from: vi.fn(() => ({ createSignedUrl, upload, remove })) };
  return { from, storage, llamadas, createSignedUrl, upload, remove };
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

function construirFormData(campos: Record<string, string | { archivo: File }>) {
  const formData = new FormData();
  for (const [clave, valor] of Object.entries(campos)) {
    if (typeof valor === 'string') {
      formData.append(clave, valor);
    } else {
      formData.append(clave, valor.archivo);
    }
  }
  return formData;
}

const SECRETO_TEST = 'clave-service-role-de-prueba';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = SECRETO_TEST;
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    getAll: () => [],
    set: () => {},
  });
});

afterEach(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

// --- token-saludo ---------------------------------------------------------

describe('firmarTokenSaludo / verificarTokenSaludo', () => {
  it('firma y verifica un token, devolviendo el narradorId original', () => {
    const token = firmarTokenSaludo('narrador-123');
    const datos = verificarTokenSaludo(token);
    expect(datos).toEqual({ narradorId: 'narrador-123' });
  });

  it('produce un token con la forma header.payload.firma', () => {
    const token = firmarTokenSaludo('narrador-123');
    expect(token.split('.')).toHaveLength(3);
  });

  it('rechaza un token adulterado en el payload', () => {
    const token = firmarTokenSaludo('narrador-123');
    const [header, payload, firma] = token.split('.');
    const payloadFalso = Buffer.from(JSON.stringify({ narradorId: 'narrador-OTRO' })).toString(
      'base64url',
    );
    const tokenAdulterado = `${header}.${payloadFalso}.${firma}`;
    expect(verificarTokenSaludo(tokenAdulterado)).toBeNull();
  });

  it('rechaza un token adulterado en la firma', () => {
    const token = firmarTokenSaludo('narrador-123');
    const tokenAdulterado = token.slice(0, -2) + 'zz';
    expect(verificarTokenSaludo(tokenAdulterado)).toBeNull();
  });

  it('rechaza un token con formato inválido (no tiene 3 partes)', () => {
    expect(verificarTokenSaludo('esto-no-es-un-jwt')).toBeNull();
  });

  it('rechaza un token vacío', () => {
    expect(verificarTokenSaludo('')).toBeNull();
  });

  it('un token firmado con otro secreto no verifica', () => {
    const token = firmarTokenSaludo('narrador-123');
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'otra-clave-totalmente-distinta';
    expect(verificarTokenSaludo(token)).toBeNull();
  });
});

// --- POST /api/saludos -----------------------------------------------------

describe('POST /api/saludos', () => {
  it('con token inválido responde 401', async () => {
    const formData = construirFormData({
      token: 'token-invalido',
      nombre: 'Martina',
      vinculo: 'nieta',
      audio: { archivo: new File(['contenido-audio'], 'saludo.webm', { type: 'audio/webm' }) },
    });
    const request = { formData: async () => formData } as never;

    const respuesta = await POST(request);

    expect(respuesta.status).toBe(401);
    expect(crearClienteServidor).not.toHaveBeenCalled();
  });

  it('sin token responde 401', async () => {
    const formData = construirFormData({
      nombre: 'Martina',
      vinculo: 'nieta',
      audio: { archivo: new File(['contenido-audio'], 'saludo.webm', { type: 'audio/webm' }) },
    });
    const request = { formData: async () => formData } as never;

    const respuesta = await POST(request);

    expect(respuesta.status).toBe(401);
  });

  it('con token válido sube el audio con el prefijo narrador_id/saludos/ e inserta la fila', async () => {
    const token = firmarTokenSaludo('narrador-1');
    const admin = crearAdminFake({ saludos: [{ data: null, error: null }] });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const formData = construirFormData({
      token,
      nombre: 'Martina',
      vinculo: 'nieta',
      audio: { archivo: new File(['contenido-audio'], 'saludo.webm', { type: 'audio/webm' }) },
    });
    const request = { formData: async () => formData } as never;

    const respuesta = await POST(request);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.ok).toBe(true);

    expect(admin.storage.from).toHaveBeenCalledWith('audios');
    const [pathSubido] = admin.upload.mock.calls[0];
    expect(pathSubido).toMatch(/^narrador-1\/saludos\/[0-9a-f-]+\.webm$/);

    const insertLlamada = admin.llamadas.saludos.find((l) => l[0] === 'insert');
    expect(insertLlamada?.[1]).toMatchObject({
      narrador_id: 'narrador-1',
      nombre: 'Martina',
      vinculo: 'nieta',
      audio_path: pathSubido,
    });
  });

  it('sin nombre responde 400 y no sube nada', async () => {
    const token = firmarTokenSaludo('narrador-1');
    const admin = crearAdminFake({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const formData = construirFormData({
      token,
      nombre: '   ',
      vinculo: 'nieta',
      audio: { archivo: new File(['contenido-audio'], 'saludo.webm', { type: 'audio/webm' }) },
    });
    const request = { formData: async () => formData } as never;

    const respuesta = await POST(request);

    expect(respuesta.status).toBe(400);
    expect(admin.upload).not.toHaveBeenCalled();
  });

  it('sin audio responde 400', async () => {
    const token = firmarTokenSaludo('narrador-1');
    const admin = crearAdminFake({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const formData = construirFormData({
      token,
      nombre: 'Martina',
      vinculo: 'nieta',
    });
    const request = { formData: async () => formData } as never;

    const respuesta = await POST(request);

    expect(respuesta.status).toBe(400);
  });

  it('un audio más grande que 15MB responde 400', async () => {
    const token = firmarTokenSaludo('narrador-1');
    const admin = crearAdminFake({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const archivoGrande = new File([new Uint8Array(15 * 1024 * 1024 + 1)], 'saludo.webm', {
      type: 'audio/webm',
    });
    const formData = construirFormData({
      token,
      nombre: 'Martina',
      vinculo: 'nieta',
      audio: { archivo: archivoGrande },
    });
    const request = { formData: async () => formData } as never;

    const respuesta = await POST(request);

    expect(respuesta.status).toBe(400);
    expect(admin.upload).not.toHaveBeenCalled();
  });
});

// --- GET /api/saludo-audio/[saludoId] --------------------------------------

describe('GET /api/saludo-audio/[saludoId]', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const request = { url: 'https://tablero.test/api/saludo-audio/saludo-1' } as never;
    const respuesta = await GET(request, { params: Promise.resolve({ saludoId: 'saludo-1' }) });
    expect(respuesta.status).toBe(401);
  });

  it('un saludo de otra familia responde 403', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      saludos: [
        {
          data: { id: 'saludo-1', audio_path: 'narrador-2/saludos/x.webm', narrador_id: 'narrador-2' },
          error: null,
        },
      ],
      narradores: [{ data: { id: 'narrador-2', familia_id: 'familia-OTRA' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { url: 'https://tablero.test/api/saludo-audio/saludo-1' } as never;
    const respuesta = await GET(request, { params: Promise.resolve({ saludoId: 'saludo-1' }) });

    expect(respuesta.status).toBe(403);
    expect(admin.createSignedUrl).not.toHaveBeenCalled();
  });

  it('un saludo propio devuelve 302 con Location firmado', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      saludos: [
        {
          data: { id: 'saludo-1', audio_path: 'narrador-1/saludos/x.webm', narrador_id: 'narrador-1' },
          error: null,
        },
      ],
      narradores: [{ data: { id: 'narrador-1', familia_id: 'familia-1' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { url: 'https://tablero.test/api/saludo-audio/saludo-1' } as never;
    const respuesta = await GET(request, { params: Promise.resolve({ saludoId: 'saludo-1' }) });

    expect(respuesta.status).toBe(302);
    expect(respuesta.headers.get('location')).toBe('https://signed.example/saludo.webm');
  });
});

// --- DELETE /api/saludos/[saludoId] ----------------------------------------

describe('DELETE /api/saludos/[saludoId]', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const request = {} as never;
    const respuesta = await DELETE(request, { params: Promise.resolve({ saludoId: 'saludo-1' }) });
    expect(respuesta.status).toBe(401);
  });

  it('borrar un saludo de otra familia responde 403', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      saludos: [
        {
          data: {
            id: 'saludo-1',
            audio_path: 'narrador-2/saludos/x.webm',
            narrador_id: 'narrador-2',
            entregado: false,
          },
          error: null,
        },
      ],
      narradores: [{ data: { id: 'narrador-2', familia_id: 'familia-OTRA' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {} as never;
    const respuesta = await DELETE(request, { params: Promise.resolve({ saludoId: 'saludo-1' }) });

    expect(respuesta.status).toBe(403);
    expect(admin.storage.from).not.toHaveBeenCalled();
  });

  it('borrar un saludo ya entregado responde 409', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      saludos: [
        {
          data: {
            id: 'saludo-1',
            audio_path: 'narrador-1/saludos/x.webm',
            narrador_id: 'narrador-1',
            entregado: true,
          },
          error: null,
        },
      ],
      narradores: [{ data: { id: 'narrador-1', familia_id: 'familia-1' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {} as never;
    const respuesta = await DELETE(request, { params: Promise.resolve({ saludoId: 'saludo-1' }) });

    expect(respuesta.status).toBe(409);
  });

  it('borrar un saludo propio no entregado borra el archivo y la fila', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1' }, error: null }],
      saludos: [
        {
          data: {
            id: 'saludo-1',
            audio_path: 'narrador-1/saludos/x.webm',
            narrador_id: 'narrador-1',
            entregado: false,
          },
          error: null,
        },
        { data: null, error: null }, // delete
      ],
      narradores: [{ data: { id: 'narrador-1', familia_id: 'familia-1' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {} as never;
    const respuesta = await DELETE(request, { params: Promise.resolve({ saludoId: 'saludo-1' }) });
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.ok).toBe(true);
    expect(admin.remove).toHaveBeenCalledWith(['narrador-1/saludos/x.webm']);
    const deleteLlamada = admin.llamadas.saludos.find((l) => l[0] === 'delete');
    expect(deleteLlamada).toBeTruthy();
  });
});
