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
import { POST } from '../src/app/api/registro/route';
import { normalizarTelefono, validarYConstruir } from '../src/lib/registro';

// --- helpers de mock de Supabase --------------------------------------

function construirBuilder(resultado: unknown, onInsert?: (valores: unknown) => void) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    insert: (valores: unknown) => {
      onInsert?.(valores);
      return builder;
    },
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return builder;
}

function crearAdminFake(secuencia: Record<string, unknown[]>) {
  const contadores: Record<string, number> = {};
  const inserts: Record<string, unknown[]> = {};
  const from = vi.fn((tabla: string) => {
    const idx = contadores[tabla] ?? 0;
    contadores[tabla] = idx + 1;
    inserts[tabla] = inserts[tabla] ?? [];
    const resultado = secuencia[tabla]?.[idx];
    return construirBuilder(resultado, (valores) => inserts[tabla].push(valores));
  });
  return { from, inserts };
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

function cuerpoValido(overridesNarrador: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}) {
  return {
    nombreComprador: 'Martina',
    vinculoComprador: 'nieta',
    region: 'AR',
    ...overrides,
    narrador: {
      nombre: 'Roberto',
      comoLeDicen: 'Don Roberto',
      telefonoWhatsapp: '1155551234',
      ...overridesNarrador,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    getAll: () => [],
    set: () => {},
  });
});

// --- lógica pura --------------------------------------------------------

describe('normalizarTelefono', () => {
  it('deja el número tal cual si ya viene con +', () => {
    expect(normalizarTelefono('+5491155551234', 'AR')).toBe('+5491155551234');
  });

  it('agrega +549 a un número argentino sin prefijo', () => {
    expect(normalizarTelefono('1155551234', 'AR')).toBe('+5491155551234');
  });

  it('agrega +34 a un número español sin prefijo', () => {
    expect(normalizarTelefono('612345678', 'ES')).toBe('+34612345678');
  });

  it('limpia espacios y guiones antes de normalizar', () => {
    expect(normalizarTelefono('11 5555-1234', 'AR')).toBe('+5491155551234');
  });
});

describe('validarYConstruir', () => {
  it('rechaza un año de nacimiento fuera de rango', () => {
    const resultado = validarYConstruir(
      cuerpoValido({ contexto: { anioNacimiento: 1850 } }) as never,
    );
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.status).toBe(400);
  });

  it('"no tuvo hijos" se guarda como arbol.hijos = "no tuvo"', () => {
    const resultado = validarYConstruir(
      cuerpoValido({ contexto: { arbol: { hijos: 'no tuvo' } } }) as never,
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.narrador.contexto.arbol).toMatchObject({ hijos: 'no tuvo' });
    }
  });

  it('rechaza un WhatsApp que no tiene dígitos (solo letras)', () => {
    const resultado = validarYConstruir(
      cuerpoValido({ telefonoWhatsapp: 'abcdefgh' }) as never,
    );
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.status).toBe(400);
  });

  it('rechaza un WhatsApp con muy pocos dígitos', () => {
    const resultado = validarYConstruir(
      cuerpoValido({ telefonoWhatsapp: '123' }) as never,
    );
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.status).toBe(400);
  });

  it('acepta un WhatsApp válido normalizado', () => {
    const resultado = validarYConstruir(
      cuerpoValido({ telefonoWhatsapp: '1155551234' }, { region: 'AR' }) as never,
    );
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.narrador.telefono_whatsapp).toBe('+5491155551234');
    }
  });

  it('usa la hora preferida por defecto 10:00 si no viene', () => {
    const resultado = validarYConstruir(cuerpoValido() as never);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.narrador.hora_preferida).toBe('10:00');
  });

  it('el narrador queda en estado invitado', () => {
    const resultado = validarYConstruir(cuerpoValido() as never);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.narrador.estado).toBe('invitado');
  });
});

// --- POST /api/registro --------------------------------------------------

describe('POST /api/registro', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const request = { json: async () => cuerpoValido() } as never;

    const respuesta = await POST(request);

    expect(respuesta.status).toBe(401);
  });

  it('un registro válido inserta familia y narrador con estado invitado y teléfono normalizado (AR sin prefijo -> +549...)', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [
        { data: null, error: null }, // no existe familia todavía
        { data: { id: 'familia-1' }, error: null }, // insert
      ],
      narradores: [{ data: { id: 'narrador-1' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => cuerpoValido({ telefonoWhatsapp: '1155551234' }, { region: 'AR' }) } as never;

    const respuesta = await POST(request);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.narradorId).toBe('narrador-1');

    const insertFamilia = admin.inserts.familias[0] as Record<string, unknown>;
    expect(insertFamilia).toMatchObject({
      auth_user_id: 'user-1',
      email: 'martina@test.com',
      nombre: 'Martina',
      region: 'AR',
    });

    const insertNarrador = admin.inserts.narradores[0] as Record<string, unknown>;
    expect(insertNarrador).toMatchObject({
      familia_id: 'familia-1',
      nombre: 'Roberto',
      como_le_dicen: 'Don Roberto',
      telefono_whatsapp: '+5491155551234',
      estado: 'invitado',
    });
  });

  it('un número español sin prefijo se normaliza a +34...', async () => {
    mockSesion({ id: 'user-2', email: 'juan@test.com' });
    const admin = crearAdminFake({
      familias: [
        { data: null, error: null },
        { data: { id: 'familia-2' }, error: null },
      ],
      narradores: [{ data: { id: 'narrador-2' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      json: async () => cuerpoValido({ telefonoWhatsapp: '612345678' }, { region: 'ES' }),
    } as never;

    const respuesta = await POST(request);
    expect(respuesta.status).toBe(200);

    const insertNarrador = admin.inserts.narradores[0] as Record<string, unknown>;
    expect(insertNarrador.telefono_whatsapp).toBe('+34612345678');
  });

  it('reutiliza la familia si ya existe para ese auth_user_id', async () => {
    mockSesion({ id: 'user-3', email: 'ana@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-existente' }, error: null }],
      narradores: [{ data: { id: 'narrador-3' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => cuerpoValido() } as never;
    const respuesta = await POST(request);

    expect(respuesta.status).toBe(200);
    expect(admin.inserts.familias ?? []).toHaveLength(0);
    const insertNarrador = admin.inserts.narradores[0] as Record<string, unknown>;
    expect(insertNarrador.familia_id).toBe('familia-existente');
  });

  it('un teléfono ya registrado responde 409 con mensaje claro', async () => {
    mockSesion({ id: 'user-4', email: 'pedro@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-4' }, error: null }],
      narradores: [
        {
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint' },
        },
      ],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = { json: async () => cuerpoValido() } as never;
    const respuesta = await POST(request);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(409);
    expect(cuerpo.error).toBe('Ese número de WhatsApp ya tiene una bitácora en marcha.');
  });

  it('"no tuvo hijos" en el body llega tal cual a la fila insertada', async () => {
    mockSesion({ id: 'user-5', email: 'lucia@test.com' });
    const admin = crearAdminFake({
      familias: [
        { data: null, error: null },
        { data: { id: 'familia-5' }, error: null },
      ],
      narradores: [{ data: { id: 'narrador-5' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      json: async () =>
        cuerpoValido({
          contexto: { arbol: { hijos: 'no tuvo', conyuge: 'no tuvo' } },
        }),
    } as never;

    const respuesta = await POST(request);
    expect(respuesta.status).toBe(200);

    const insertNarrador = admin.inserts.narradores[0] as { contexto: { arbol?: Record<string, string> } };
    expect(insertNarrador.contexto.arbol).toMatchObject({ hijos: 'no tuvo', conyuge: 'no tuvo' });
  });
});
