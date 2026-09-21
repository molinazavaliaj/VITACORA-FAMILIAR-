import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';

// El webhook de Mercado Pago, mirado por el MÉTODO con el que entra.
//
// MP llama a la misma URL de dos maneras: el Webhooks nuevo manda POST con
// `?data.id=`, y el IPN viejo manda sus parámetros en la query (`?topic=payment&id=`).
// Cuando el método pedido no está exportado, Next corta con un 405 ANTES de
// ejecutar una sola línea del handler: no hay firma, no hay log, no hay nada.
// Es lo que pasó el 21/09 (pedido 4333e8fd de Mariano): dos GET a las 19:37 se
// comieron un 405 y el pago quedó aprobado en MP con el pedido en `pendiente`.

vi.mock('mercadopago', () => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn(),
}));

vi.mock('@/lib/supabase/servidor', () => ({
  crearClienteServidor: vi.fn(),
}));

vi.mock('@/lib/confirmar-pago', () => ({
  confirmarPago: vi.fn(),
}));

import { Payment } from 'mercadopago';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { confirmarPago } from '@/lib/confirmar-pago';
import { GET, POST } from '../src/app/api/webhooks/mercadopago/route';

const URL_MP = 'https://vitacorafamiliar.com/api/webhooks/mercadopago';

// Mínimo para que el handler pueda leer `url.searchParams` y los headers. Un
// GET real no trae cuerpo, así que `json()` tira: el handler tiene que
// aguantarlo sin cortar (el catch que ya existía).
function peticion(url: string, opciones: { headers?: HeadersInit; cuerpo?: unknown } = {}) {
  return {
    url,
    headers: new Headers(opciones.headers),
    json: async () => {
      if (opciones.cuerpo === undefined) throw new SyntaxError('Unexpected end of JSON input');
      return opciones.cuerpo;
    },
  } as never;
}

// Mockea `new Payment(...).get()` y devuelve la espía para mirar con qué id se
// consultó el pago (que es lo único que decide si el pedido se confirma).
function pagoAprobado(id: number | string, referencia = 'pedido-3') {
  const get = vi.fn().mockResolvedValue({ id, status: 'approved', external_reference: referencia });
  (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
    return { get };
  });
  return get;
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.MP_WEBHOOK_SECRET;
  process.env.MP_ACCESS_TOKEN = 'TEST-token';
  (crearClienteServidor as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ from: vi.fn() });
  (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, yaEstaba: false, email: null });
});

describe('el webhook de MP acepta GET y POST por el mismo camino', () => {
  it('exporta GET: sin GET, Next contesta 405 y el handler nunca corre', () => {
    expect(typeof GET).toBe('function');
    // El criterio de la tarea, literal: los dos métodos son el MISMO camino, no
    // dos copias que se pueden separar con el tiempo.
    expect(GET).toBe(POST);
  });

  it('un GET con ?topic=payment&id= (IPN viejo) NO devuelve 405 y consulta el pago', async () => {
    const get = pagoAprobado(123456);

    const respuesta = await GET(peticion(`${URL_MP}?topic=payment&id=123456`));

    expect(respuesta.status).not.toBe(405);
    expect(respuesta.status).toBe(200);
    expect(get).toHaveBeenCalledWith({ id: '123456' });
    expect(confirmarPago).toHaveBeenCalledTimes(1);
    expect((confirmarPago as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({
      pedidoId: 'pedido-3',
      referenciaExterna: '123456',
    });
  });

  it('GET y POST con la misma notificación dan la misma respuesta y la misma confirmación', async () => {
    const get = pagoAprobado(123456);
    const url = `${URL_MP}?data.id=123456&type=payment`;

    const porGet = await GET(peticion(url));
    const idsGet = get.mock.calls.map((c) => c[0]);
    const confirmacionesGet = (confirmarPago as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1]);
    expect(porGet.status).not.toBe(405);

    vi.clearAllMocks();
    const porPost = await POST(peticion(url, { cuerpo: { type: 'payment', data: { id: '123456' } } }));

    expect(porPost.status).toBe(porGet.status);
    expect(await porPost.json()).toEqual(await porGet.json());
    expect(get.mock.calls.map((c) => c[0])).toEqual(idsGet);
    expect((confirmarPago as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1])).toEqual(confirmacionesGet);
  });

  it('un GET sin id (el ping de la configuración de MP) responde 200 y no consulta nada', async () => {
    const get = pagoAprobado(1);

    const respuesta = await GET(peticion(`${URL_MP}?topic=payment`));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ received: true });
    expect(get).not.toHaveBeenCalled();
    // Un 404/405 acá hace que MP marque la URL como caída y deje de avisar.
    expect(respuesta.status).not.toBe(405);
  });

  it('un GET con firma válida pasa el candado igual que el POST', async () => {
    process.env.MP_WEBHOOK_SECRET = 'secreto-webhook';
    const ts = '1704908010';
    const v1 = createHmac('sha256', 'secreto-webhook').update(`id:123456;request-id:req-1;ts:${ts};`).digest('hex');
    const get = pagoAprobado(123456);

    const respuesta = await GET(
      peticion(`${URL_MP}?data.id=123456&type=payment`, {
        headers: { 'x-request-id': 'req-1', 'x-signature': `ts=${ts},v1=${v1}` },
      }),
    );

    expect(respuesta.status).toBe(200);
    expect(get).toHaveBeenCalledWith({ id: '123456' });
  });

  it('LÍMITE declarado: un GET sin firma con MP_WEBHOOK_SECRET configurado da 401, no 405', async () => {
    // La doc de MP dice que las notificaciones IPN reciben `x-signature` pero NO
    // se pueden validar con la clave secreta. Con el candado puesto, ese GET
    // queda en 401 en vez de 405: deja de chocar contra la pared de Next, pero
    // todavía no se procesa. Es una decisión de seguridad, no un bug del refactor
    // (ver la nota de la tarea).
    process.env.MP_WEBHOOK_SECRET = 'secreto-webhook';
    const get = pagoAprobado(123456);

    const respuesta = await GET(peticion(`${URL_MP}?topic=payment&id=123456`));

    expect(respuesta.status).toBe(401);
    expect(respuesta.status).not.toBe(405);
    expect(get).not.toHaveBeenCalled();
  });

  it('el POST sigue aceptando el id en el cuerpo JSON (camino viejo, sin query)', async () => {
    const get = pagoAprobado(777, 'pedido-9');

    const respuesta = await POST(
      peticion(URL_MP, { cuerpo: { action: 'payment.created', type: 'payment', data: { id: 777 } } }),
    );

    expect(respuesta.status).toBe(200);
    expect(get).toHaveBeenCalledWith({ id: '777' });
  });

  it('un GET cuya consulta a MP falla responde 500, igual que el POST', async () => {
    const get = vi.fn().mockRejectedValue(new Error('fetch failed'));
    (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { get };
    });

    const respuesta = await GET(peticion(`${URL_MP}?topic=payment&id=111`));

    expect(respuesta.status).toBe(500);
  });
});
