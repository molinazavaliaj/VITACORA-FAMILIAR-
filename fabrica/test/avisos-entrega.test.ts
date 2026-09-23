import { describe, it, expect, vi, beforeEach } from 'vitest';

// Quién manda los mails de lo físico y cuándo (3t.26 fase 2). Un mail por ENTREGA,
// no por narrador: una familia puede tener dos pedidos con impreso —el suyo y el de
// un primo— y cada uno viaja por su cuenta, con su dirección y su candado.

const { enviarMailHitoMock } = vi.hoisted(() => ({
  enviarMailHitoMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('../src/mail/hitos.js', async () => {
  const actual = await vi.importActual<typeof import('../src/mail/hitos.js')>('../src/mail/hitos.js');
  return { ...actual, enviarMailHito: enviarMailHitoMock };
});

vi.mock('../src/config.js', () => ({
  cargarConfig: () => ({ urlBase: 'https://www.vitacorafamiliar.com', resendApiKey: 'x' }),
}));

const { avisarHitosDeEntrega, URL_RESENA } = await import('../src/entregas.js');

type Entrega = {
  id: string;
  narrador_id: string;
  familia_id: string;
  estado: string;
  seguimiento?: string | null;
  created_at?: string;
};

const HACE_DIAS = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

/** Base de mentira: entregas, la familia que las compró, y los candados de Storage. */
function baseFalsa(entregas: Entrega[], candados: string[] = []) {
  const subidos: string[] = [];
  const db = {
    from: (tabla: string) => ({
      select: () => ({
        in: async () => ({ data: entregas, error: null }),
        eq: () => ({
          maybeSingle: async () => ({
            data: tabla === 'familias' ? { email: 'familia@ejemplo.com' } : { como_le_dicen: 'abuela' },
            error: null,
          }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        list: async () => ({ data: candados.map((name) => ({ name })), error: null }),
        upload: async (ruta: string) => {
          subidos.push(ruta);
          return { error: null };
        },
      }),
    },
  };
  return { db: db as never, subidos };
}

beforeEach(() => vi.clearAllMocks());

describe('avisarHitosDeEntrega', () => {
  it('cuando el paquete sale, avisa con el número de seguimiento', async () => {
    const { db } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'enviado', seguimiento: '1234ABC' },
    ]);

    await avisarHitosDeEntrega(db);

    expect(enviarMailHitoMock).toHaveBeenCalledTimes(1);
    const mail = enviarMailHitoMock.mock.calls[0][0];
    expect(mail.hito).toBe('enviado');
    expect(mail.para).toBe('familia@ejemplo.com');
    expect(mail.seguimiento).toBe('1234ABC');
  });

  it('cuando llega, el botón lleva a dejar la reseña', async () => {
    const { db } = baseFalsa([{ id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'entregado' }]);

    await avisarHitosDeEntrega(db);

    const mail = enviarMailHitoMock.mock.calls[0][0];
    expect(mail.hito).toBe('entregado');
    expect(mail.enlace).toBe(URL_RESENA);
  });

  it('pide la dirección recién a los 3 días, no al toque', async () => {
    const { db } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'sin_direccion', created_at: HACE_DIAS(1) },
    ]);

    await avisarHitosDeEntrega(db);

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
  });

  it('a los 3 días sin dirección, pregunta a dónde va', async () => {
    const { db } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'sin_direccion', created_at: HACE_DIAS(4) },
    ]);

    await avisarHitosDeEntrega(db);

    const mail = enviarMailHitoMock.mock.calls[0][0];
    expect(mail.hito).toBe('falta_direccion');
    expect(mail.enlace).toContain('/tablero/n1');
  });

  it('con el candado puesto no repite el mail', async () => {
    const { db } = baseFalsa(
      [{ id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'entregado' }],
      ['entrega_e1_entregado.txt']
    );

    await avisarHitosDeEntrega(db);

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
  });

  it('el candado se deja SOLO si el mail salió de verdad', async () => {
    enviarMailHitoMock.mockResolvedValueOnce(false); // sin clave de Resend
    const { db, subidos } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'entregado' },
    ]);

    await avisarHitosDeEntrega(db);

    expect(subidos).toHaveLength(0);
  });

  it('el candado lleva el id de la entrega: dos pedidos de la misma familia no se tapan', async () => {
    const { db, subidos } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'entregado' },
      { id: 'e2', narrador_id: 'n1', familia_id: 'f2', estado: 'entregado' },
    ]);

    await avisarHitosDeEntrega(db);

    expect(enviarMailHitoMock).toHaveBeenCalledTimes(2);
    expect(subidos).toEqual([
      'n1/paquete/entrega_e1_entregado.txt',
      'n1/paquete/entrega_e2_entregado.txt',
    ]);
  });

  it('una entrega que falla no frena a las demás', async () => {
    enviarMailHitoMock.mockRejectedValueOnce(new Error('Resend caído')).mockResolvedValueOnce(true);
    const { db, subidos } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'entregado' },
      { id: 'e2', narrador_id: 'n2', familia_id: 'f2', estado: 'entregado' },
    ]);

    await avisarHitosDeEntrega(db);

    expect(subidos).toEqual(['n2/paquete/entrega_e2_entregado.txt']);
  });

  it('los estados del medio no mandan nada: imprimiendo no es noticia', async () => {
    const { db } = baseFalsa([
      { id: 'e1', narrador_id: 'n1', familia_id: 'f1', estado: 'en_produccion' },
      { id: 'e2', narrador_id: 'n2', familia_id: 'f2', estado: 'impreso' },
      { id: 'e3', narrador_id: 'n3', familia_id: 'f3', estado: 'lista' },
    ]);

    await avisarHitosDeEntrega(db);

    expect(enviarMailHitoMock).not.toHaveBeenCalled();
  });
});
