import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// Mínimo para que el handler pueda leer `url.searchParams`, los headers y el
// método (que va en la línea de log). Un GET real no trae cuerpo, así que
// `json()` tira: el handler tiene que aguantarlo sin cortar (el catch que ya
// existía).
function peticion(url: string, opciones: { headers?: HeadersInit; cuerpo?: unknown; metodo?: string } = {}) {
  return {
    url,
    method: opciones.metodo,
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

// T3.13: el webhook tiene que LOGUEAR todos los caminos de salida.
//
// El incidente del 21/09 tardó en detectarse porque las dos salidas más
// probables eran MUDAS: (1) una notificación sin id de pago contesta 200
// `{received:true}` y MP se da por notificado (no reintenta) sin que quede una
// sola línea; (2) un pago que llega pero no está aprobado (o no trae
// external_reference) contesta 200 y tampoco escribe nada. Sin estas líneas, la
// próxima vez que un pago no confirme hay que ir a la base y deducir a mano.
//
// La forma de la línea es una sola, greppable, con el motivo adelante y los
// campos atrás: `webhook mercadopago: <motivo> | metodo=… id=… origen=… firma=…
// pago=…`.
describe('cada salida del webhook deja su línea de log con el motivo', () => {
  let porLog: string[] = [];
  let porWarn: string[] = [];
  let porError: string[] = [];

  beforeEach(() => {
    porLog = [];
    porWarn = [];
    porError = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      porLog.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      porWarn.push(args.map(String).join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      porError.push(args.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Las líneas de salida del webhook (y no los avisos sueltos, como el de
  // MP_WEBHOOK_SECRET sin configurar, que no es una salida).
  function salidas(lineas: string[]) {
    return lineas
      .filter((l) => l.startsWith('webhook mercadopago:') && l.includes(' | metodo='))
      .map((l) => {
        const [motivo, campos] = l.replace('webhook mercadopago: ', '').split(' | ');
        const valores = Object.fromEntries(
          campos
            .split(' ')
            .filter(Boolean)
            .map((par) => [par.slice(0, par.indexOf('=')), par.slice(par.indexOf('=') + 1)]),
        );
        return { motivo, ...valores } as Record<string, string>;
      });
  }

  function pagoCon(estado: string, id: number | string = 1, referencia?: string) {
    const get = vi
      .fn()
      .mockResolvedValue({ id, status: estado, ...(referencia ? { external_reference: referencia } : {}) });
    (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { get };
    });
    return get;
  }

  it('una notificación sin id de pago: 200 y la línea que dice por qué no se confirmó', async () => {
    // Era el agujero más peligroso: MP recibe un 200, se da por notificado y no
    // reintenta, así que el pedido se queda cobrado y pendiente, en silencio.
    const get = pagoCon('approved');

    const respuesta = await POST(peticion(URL_MP, { metodo: 'POST', cuerpo: { action: 'payment.created' } }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ received: true });
    expect(get).not.toHaveBeenCalled();

    const lineas = salidas(porWarn);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].motivo).toContain('no trae id de pago');
    expect(lineas[0]).toMatchObject({
      metodo: 'POST',
      id: 'ninguno',
      origen: 'ninguno',
      firma: 'no-evaluada',
      pago: 'no-consultado',
    });
  });

  it('un pago que no está aprobado: 200 y la línea con el status que trajo MP', async () => {
    const get = pagoCon('rejected', 55, 'pedido-7');

    const respuesta = await GET(peticion(`${URL_MP}?data.id=55&type=payment`, { metodo: 'GET' }));

    expect(respuesta.status).toBe(200);
    expect(confirmarPago).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledWith({ id: '55' });

    const lineas = salidas(porWarn);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].motivo).toContain('no está aprobado');
    expect(lineas[0]).toMatchObject({ metodo: 'GET', id: '55', origen: 'query', firma: 'no-evaluada', pago: 'rejected' });
  });

  it('un pago aprobado pero sin external_reference: 200 y la línea que lo dice', async () => {
    // Con `approved` y sin referencia no hay a qué pedido confirmarle nada: es
    // la otra mitad muda del incidente.
    pagoCon('approved', 66);

    const respuesta = await GET(peticion(`${URL_MP}?data.id=66&type=payment`, { metodo: 'GET' }));

    expect(respuesta.status).toBe(200);
    expect(confirmarPago).not.toHaveBeenCalled();

    const lineas = salidas(porWarn);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].motivo).toContain('external_reference');
    expect(lineas[0]).toMatchObject({ metodo: 'GET', id: '66', pago: 'approved' });
  });

  it('una firma inválida: 401 y la línea dice que la firma no validó', async () => {
    process.env.MP_WEBHOOK_SECRET = 'secreto-webhook';
    const get = pagoCon('approved', 123456, 'pedido-3');

    const respuesta = await POST(peticion(`${URL_MP}?data.id=123456&type=payment`, { metodo: 'POST' }));

    expect(respuesta.status).toBe(401);
    expect(get).not.toHaveBeenCalled();

    const lineas = salidas(porWarn);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].motivo).toBe('firma inválida, se ignora');
    expect(lineas[0]).toMatchObject({
      metodo: 'POST',
      id: '123456',
      origen: 'query',
      firma: 'invalida',
      pago: 'no-consultado',
    });
  });

  it('si la consulta a MP falla: 500 y la línea del error (no un error pelado)', async () => {
    const get = vi.fn().mockRejectedValue(new Error('fetch failed'));
    (Payment as unknown as ReturnType<typeof vi.fn>).mockImplementation(function () {
      return { get };
    });

    const respuesta = await GET(peticion(`${URL_MP}?topic=payment&id=111`, { metodo: 'GET' }));

    expect(respuesta.status).toBe(500);
    expect(salidas(porWarn)).toHaveLength(0);

    const lineas = salidas(porError);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].motivo).toContain('no se pudo consultar el pago');
    expect(lineas[0]).toMatchObject({ metodo: 'GET', id: '111', origen: 'query', pago: 'error' });
  });

  it('si confirmar el pago falla: 500 y la línea con el motivo, no muda', async () => {
    (confirmarPago as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      error: 'la base no respondió',
    });
    pagoCon('approved', 999, 'pedido-9');

    const respuesta = await GET(peticion(`${URL_MP}?topic=payment&id=999`, { metodo: 'GET' }));

    expect(respuesta.status).toBe(500);
    const lineas = salidas(porError);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].motivo).toContain('no se pudo actualizar el pedido');
    expect(lineas[0]).toMatchObject({ metodo: 'GET', id: '999', origen: 'query', pago: 'approved' });
  });

  it('un pago confirmado: 200 y la línea del caso feliz (por log, no por warn)', async () => {
    pagoCon('approved', 123456, 'pedido-3');

    const respuesta = await POST(peticion(`${URL_MP}?data.id=123456&type=payment`, { metodo: 'POST' }));

    expect(respuesta.status).toBe(200);
    expect(confirmarPago).toHaveBeenCalledTimes(1);
    expect(salidas(porWarn)).toHaveLength(0);

    const lineas = salidas(porLog);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].motivo).toContain('pedido confirmado');
    expect(lineas[0].motivo).toContain('pedido-3');
    expect(lineas[0]).toMatchObject({ metodo: 'POST', id: '123456', origen: 'query', pago: 'approved' });
  });

  it('el id que llega en el cuerpo JSON queda declarado como origen=cuerpo', async () => {
    pagoCon('approved', 777, 'pedido-9');

    const respuesta = await POST(peticion(URL_MP, { metodo: 'POST', cuerpo: { data: { id: 777 } } }));

    expect(respuesta.status).toBe(200);
    const lineas = salidas(porLog);
    expect(lineas).toHaveLength(1);
    expect(lineas[0]).toMatchObject({ metodo: 'POST', id: '777', origen: 'cuerpo', pago: 'approved' });
  });
});
