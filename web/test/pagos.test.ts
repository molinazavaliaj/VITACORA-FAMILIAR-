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

vi.mock('stripe', () => ({
  default: vi.fn(),
}));

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Preference: vi.fn(),
  Payment: vi.fn(),
}));

import { crearClienteServidor } from '@/lib/supabase/servidor';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { crearCheckout } from '@/lib/pagos';
import { POST as POST_CHECKOUT } from '../src/app/api/checkout/route';
import { POST as POST_WEBHOOK_STRIPE } from '../src/app/api/webhooks/stripe/route';
import { POST as POST_WEBHOOK_MP } from '../src/app/api/webhooks/mercadopago/route';

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
    insert: (...args: unknown[]) => {
      onCall?.('insert', args);
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

function crearAdminFake(secuencia: Record<string, unknown[]>) {
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
  return { from, llamadas };
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
  process.env.STRIPE_SECRET_KEY = 'sk_test_x';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_x';
  process.env.MP_ACCESS_TOKEN = 'TEST-token';
  process.env.PRECIO_EUR = '49';
  process.env.PRECIO_ARS = '49999';
  process.env.URL_BASE = 'https://vitacorafamiliar.com';
});

// --- crearCheckout -------------------------------------------------------

describe('crearCheckout', () => {
  it('región ES crea una sesión de Stripe con el monto en centavos y el pedido_id en metadata', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/xyz' });
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { checkout: { sessions: { create: mockCreate } } };
    });

    const resultado = await crearCheckout({ id: 'pedido-1', region: 'ES', email: 'martina@test.com' });

    expect(resultado.urlPago).toBe('https://checkout.stripe.com/xyz');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0][0] as {
      mode: string;
      customer_email: string;
      line_items: { price_data: { unit_amount: number; currency: string } }[];
      metadata: { pedido_id: string };
      success_url: string;
      cancel_url: string;
    };
    expect(args.mode).toBe('payment');
    expect(args.customer_email).toBe('martina@test.com');
    expect(args.line_items[0].price_data.unit_amount).toBe(4900);
    expect(args.line_items[0].price_data.currency).toBe('eur');
    expect(args.metadata.pedido_id).toBe('pedido-1');
    expect(args.success_url).toBe('https://vitacorafamiliar.com/tablero/descarga');
    expect(args.cancel_url).toBe('https://vitacorafamiliar.com/comprar');
  });

  it('región AR crea una preferencia de Mercado Pago con el precio en ARS y el pedido_id como referencia externa', async () => {
    const mockPreferenceCreate = vi.fn().mockResolvedValue({ init_point: 'https://mp.example/pref' });
    (Preference as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { create: mockPreferenceCreate };
    });

    const resultado = await crearCheckout({ id: 'pedido-2', region: 'AR', email: 'juan@test.com' });

    expect(resultado.urlPago).toBe('https://mp.example/pref');
    expect(mockPreferenceCreate).toHaveBeenCalledTimes(1);
    const args = mockPreferenceCreate.mock.calls[0][0] as {
      body: {
        items: { unit_price: number; currency_id: string }[];
        external_reference: string;
        back_urls: { success: string; failure: string };
      };
    };
    expect(args.body.items[0].unit_price).toBe(49999);
    expect(args.body.items[0].currency_id).toBe('ARS');
    expect(args.body.external_reference).toBe('pedido-2');
    expect(args.body.back_urls.success).toBe('https://vitacorafamiliar.com/tablero/descarga');
    expect(args.body.back_urls.failure).toBe('https://vitacorafamiliar.com/comprar');
    expect(MercadoPagoConfig).toHaveBeenCalledWith({ accessToken: 'TEST-token' });
  });

  it('redondea los centavos de un precio con decimales (evita el error de coma flotante de *100)', async () => {
    process.env.PRECIO_EUR = '19.99';
    const mockCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/xyz' });
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { checkout: { sessions: { create: mockCreate } } };
    });

    await crearCheckout({ id: 'pedido-3', region: 'ES', email: 'martina@test.com' });

    const args = mockCreate.mock.calls[0][0] as {
      line_items: { price_data: { unit_amount: number } }[];
    };
    expect(args.line_items[0].price_data.unit_amount).toBe(1999);
  });
});

// --- POST /api/webhooks/stripe -------------------------------------------

describe('POST /api/webhooks/stripe', () => {
  it('evento checkout.session.completed válido marca el pedido pagado', async () => {
    const evento = {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_1', metadata: { pedido_id: 'pedido-1' } } },
    };
    const mockConstructEvent = vi.fn().mockReturnValue(evento);
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { webhooks: { constructEvent: mockConstructEvent } };
    });
    const admin = crearAdminFake({ pedidos: [{ data: null, error: null }] });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      text: async () => JSON.stringify(evento),
      headers: { get: (k: string) => (k === 'stripe-signature' ? 'firma-valida' : null) },
    } as never;

    const respuesta = await POST_WEBHOOK_STRIPE(request);

    expect(respuesta.status).toBe(200);
    expect(mockConstructEvent).toHaveBeenCalledWith(
      JSON.stringify(evento),
      'firma-valida',
      'whsec_x',
    );
    const llamadaUpdate = admin.llamadas.pedidos.find(([metodo]) => metodo === 'update');
    expect(llamadaUpdate?.[1]).toMatchObject({ estado: 'pagado', referencia_externa: 'cs_test_1' });
    const llamadasEq = admin.llamadas.pedidos.filter(([metodo]) => metodo === 'eq');
    expect(llamadasEq).toContainEqual(['eq', 'id', 'pedido-1']);
    expect(llamadasEq).toContainEqual(['eq', 'estado', 'pendiente']);
  });

  it('firma inválida responde 400 y no escribe en la base de datos', async () => {
    const mockConstructEvent = vi.fn().mockImplementation(() => {
      throw new Error('firma invalida');
    });
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { webhooks: { constructEvent: mockConstructEvent } };
    });
    const admin = crearAdminFake({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      text: async () => '{}',
      headers: { get: () => 'firma-mala' },
    } as never;

    const respuesta = await POST_WEBHOOK_STRIPE(request);

    expect(respuesta.status).toBe(400);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it('si falla la actualización del pedido en la base responde 500 (para que Stripe reintente)', async () => {
    const evento = {
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_2', metadata: { pedido_id: 'pedido-5' } } },
    };
    const mockConstructEvent = vi.fn().mockReturnValue(evento);
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { webhooks: { constructEvent: mockConstructEvent } };
    });
    const admin = crearAdminFake({
      pedidos: [{ data: null, error: { message: 'fallo de conexion' } }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      text: async () => JSON.stringify(evento),
      headers: { get: (k: string) => (k === 'stripe-signature' ? 'firma-valida' : null) },
    } as never;

    const respuesta = await POST_WEBHOOK_STRIPE(request);

    expect(respuesta.status).toBe(500);
  });
});

// --- POST /api/webhooks/mercadopago ---------------------------------------

describe('POST /api/webhooks/mercadopago', () => {
  it('pago aprobado marca el pedido pagado usando external_reference', async () => {
    const mockPaymentGet = vi
      .fn()
      .mockResolvedValue({ id: 123456, status: 'approved', external_reference: 'pedido-3' });
    (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { get: mockPaymentGet };
    });
    const admin = crearAdminFake({ pedidos: [{ data: null, error: null }] });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      url: 'https://vitacorafamiliar.com/api/webhooks/mercadopago?data.id=123456&type=payment',
      json: async () => ({}),
    } as never;

    const respuesta = await POST_WEBHOOK_MP(request);

    expect(respuesta.status).toBe(200);
    expect(mockPaymentGet).toHaveBeenCalledWith({ id: '123456' });
    const llamadaUpdate = admin.llamadas.pedidos.find(([metodo]) => metodo === 'update');
    expect(llamadaUpdate?.[1]).toMatchObject({ estado: 'pagado', referencia_externa: '123456' });
    const llamadasEq = admin.llamadas.pedidos.filter(([metodo]) => metodo === 'eq');
    expect(llamadasEq).toContainEqual(['eq', 'id', 'pedido-3']);
  });

  it('pago pendiente (no aprobado) no escribe en la base de datos', async () => {
    const mockPaymentGet = vi
      .fn()
      .mockResolvedValue({ id: 789, status: 'pending', external_reference: 'pedido-4' });
    (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { get: mockPaymentGet };
    });
    const admin = crearAdminFake({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      url: 'https://vitacorafamiliar.com/api/webhooks/mercadopago?data.id=789&type=payment',
      json: async () => ({}),
    } as never;

    const respuesta = await POST_WEBHOOK_MP(request);

    expect(respuesta.status).toBe(200);
    expect(admin.from).not.toHaveBeenCalled();
  });

  it('si falla la actualización del pedido en la base responde 500 (para que MP reintente)', async () => {
    const mockPaymentGet = vi
      .fn()
      .mockResolvedValue({ id: 999, status: 'approved', external_reference: 'pedido-6' });
    (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { get: mockPaymentGet };
    });
    const admin = crearAdminFake({
      pedidos: [{ data: null, error: { message: 'fallo de conexion' } }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      url: 'https://vitacorafamiliar.com/api/webhooks/mercadopago?data.id=999&type=payment',
      json: async () => ({}),
    } as never;

    const respuesta = await POST_WEBHOOK_MP(request);

    expect(respuesta.status).toBe(500);
  });

  it('si la consulta a la API de MP tira (red caída, 5xx transitorio) responde 500 para que MP reintente', async () => {
    const mockPaymentGet = vi.fn().mockRejectedValue(new Error('fetch failed'));
    (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { get: mockPaymentGet };
    });
    const admin = crearAdminFake({});
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const request = {
      url: 'https://vitacorafamiliar.com/api/webhooks/mercadopago?data.id=111&type=payment',
      json: async () => ({}),
    } as never;

    const respuesta = await POST_WEBHOOK_MP(request);

    expect(respuesta.status).toBe(500);
    // no llegamos a mirar la base — la falla fue consultando a MP, no nuestra.
    expect(admin.from).not.toHaveBeenCalled();
  });
});

// --- POST /api/checkout ---------------------------------------------------

describe('POST /api/checkout', () => {
  it('sin sesión responde 401', async () => {
    mockSesion(null);
    const respuesta = await POST_CHECKOUT();
    expect(respuesta.status).toBe(401);
  });

  it('narrador con estado que todavía no permite comprar responde 409', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1', email: 'martina@test.com', region: 'ES' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1', estado: 'activo' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await POST_CHECKOUT();

    expect(respuesta.status).toBe(409);
    expect(admin.llamadas.pedidos).toBeUndefined();
  });

  it('si ya existe un pedido pagado para el narrador responde 409', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1', email: 'martina@test.com', region: 'ES' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1', estado: 'completado' }], error: null }],
      pedidos: [{ data: [{ id: 'pedido-1', estado: 'pagado' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);

    const respuesta = await POST_CHECKOUT();
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(409);
    expect(cuerpo.error).toBe('Este pedido ya está pagado.');
    expect(admin.llamadas.pedidos.some(([metodo]) => metodo === 'insert')).toBe(false);
  });

  it('sin pedido previo crea uno pendiente con el monto y la moneda de la región y devuelve la urlPago', async () => {
    mockSesion({ id: 'user-1', email: 'martina@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-1', email: 'martina@test.com', region: 'ES' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-1', estado: 'completado' }], error: null }],
      pedidos: [{ data: [], error: null }, { data: { id: 'pedido-nuevo' }, error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    const mockCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/nuevo' });
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { checkout: { sessions: { create: mockCreate } } };
    });

    const respuesta = await POST_CHECKOUT();
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.urlPago).toBe('https://checkout.stripe.com/nuevo');
    const llamadaInsert = admin.llamadas.pedidos.find(([metodo]) => metodo === 'insert');
    expect(llamadaInsert?.[1]).toMatchObject({
      familia_id: 'familia-1',
      narrador_id: 'narrador-1',
      proveedor: 'stripe',
      estado: 'pendiente',
      monto: 49,
      moneda: 'EUR',
    });
    expect(mockCreate.mock.calls[0][0]).toMatchObject({ metadata: { pedido_id: 'pedido-nuevo' } });
  });

  it('reutiliza un pedido pendiente existente en vez de crear uno nuevo', async () => {
    mockSesion({ id: 'user-1', email: 'juan@test.com' });
    const admin = crearAdminFake({
      familias: [{ data: { id: 'familia-2', email: 'juan@test.com', region: 'AR' }, error: null }],
      narradores: [{ data: [{ id: 'narrador-2', estado: 'cerrado_anticipado' }], error: null }],
      pedidos: [{ data: [{ id: 'pedido-pendiente', estado: 'pendiente' }], error: null }],
    });
    (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    const mockPreferenceCreate = vi.fn().mockResolvedValue({ init_point: 'https://mp.example/existente' });
    (Preference as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { create: mockPreferenceCreate };
    });

    const respuesta = await POST_CHECKOUT();
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.urlPago).toBe('https://mp.example/existente');
    expect(admin.llamadas.pedidos.some(([metodo]) => metodo === 'insert')).toBe(false);
    expect(mockPreferenceCreate.mock.calls[0][0]).toMatchObject({
      body: { external_reference: 'pedido-pendiente' },
    });
  });
});
