import { describe, it, expect, vi, beforeEach } from 'vitest';

// La rama del anticipo del tick, aislada. Archivo aparte de worker.test.ts
// para no tocar los fakes que ya cubren estructura/preview/pedidos.

const {
  generarAnticipoMock,
  enviarMailAnticipoMock,
  subirTextoMock,
  firmarTokenMock,
  obtenerClienteDbMock,
} = vi.hoisted(() => ({
  generarAnticipoMock: vi.fn().mockResolvedValue(undefined),
  enviarMailAnticipoMock: vi.fn().mockResolvedValue(true),
  subirTextoMock: vi.fn().mockResolvedValue(undefined),
  firmarTokenMock: vi.fn(() => 'token-firmado'),
  obtenerClienteDbMock: vi.fn(),
}));

vi.mock('../src/libro/anticipo.js', () => ({ generarAnticipo: generarAnticipoMock }));
vi.mock('../src/mail/anticipo.js', () => ({ enviarMailAnticipo: enviarMailAnticipoMock }));
vi.mock('../src/libro/token-anticipo.js', () => ({ firmarTokenAnticipo: firmarTokenMock }));
vi.mock('../src/config.js', () => ({
  cargarConfig: () => ({ urlBase: 'https://www.vitacorafamiliar.com', resendApiKey: 'x' }),
}));
vi.mock('../src/libro/comun.js', async () => {
  const actual = await vi.importActual<typeof import('../src/libro/comun.js')>('../src/libro/comun.js');
  return { ...actual, subirTexto: subirTextoMock };
});
vi.mock('../src/libro/estructura.js', () => ({ generarEstructura: vi.fn() }));
vi.mock('../src/libro/previsualizar.js', () => ({ generarPrevisualizacion: vi.fn() }));
vi.mock('../src/libro/generar-paquete.js', () => ({ generarPaquete: vi.fn() }));
vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return { ...actual, obtenerClienteDb: obtenerClienteDbMock };
});

import { tick } from '../src/worker.js';

const NARRADOR = { id: 'n1', como_le_dicen: 'papá', familia_id: 'f1' };

function construirDb(opciones: { archivos: string[]; respuestas: number }) {
  const list = vi.fn().mockResolvedValue({
    data: opciones.archivos.map((name) => ({ name })),
    error: null,
  });

  const from = vi.fn((tabla: string) => {
    if (tabla === 'narradores') {
      return { select: () => ({ in: () => Promise.resolve({ data: [NARRADOR], error: null }) }) };
    }
    if (tabla === 'respuestas') {
      // dos usos: contar (head:true) y traer la primera respondida
      return {
        select: (_cols: string, opts?: { head?: boolean }) => {
          if (opts?.head) {
            return { eq: () => Promise.resolve({ count: opciones.respuestas, error: null }) };
          }
          return {
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [{ pregunta_orden: 1 }], error: null }),
              }),
            }),
          };
        },
      };
    }
    if (tabla === 'familias') {
      return {
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: { email: 'martina@ejemplo.com' }, error: null }) }),
        }),
      };
    }
    if (tabla === 'preguntas') {
      return {
        select: () => ({
          is: () => ({
            eq: () => ({ single: () => Promise.resolve({ data: { texto: '¿Dónde nació?' }, error: null }) }),
          }),
        }),
      };
    }
    if (tabla === 'pedidos') {
      return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
    }
    throw new Error(`tabla no mockeada: ${tabla}`);
  });

  return { from, storage: { from: vi.fn(() => ({ list })) }, list };
}

beforeEach(() => {
  vi.clearAllMocks();
  enviarMailAnticipoMock.mockResolvedValue(true);
});

describe('rama del anticipo en el tick', () => {
  it('con 3 respuestas y sin anticipo: lo genera y manda el mail', async () => {
    obtenerClienteDbMock.mockReturnValue(construirDb({ archivos: [], respuestas: 3 }));

    await tick();

    expect(generarAnticipoMock).toHaveBeenCalledWith('n1');
    expect(enviarMailAnticipoMock).toHaveBeenCalledOnce();
    expect(enviarMailAnticipoMock.mock.calls[0][0]).toMatchObject({
      para: 'martina@ejemplo.com',
      comoLeDicen: 'papá',
      enlace: 'https://www.vitacorafamiliar.com/anticipo/token-firmado',
    });
  });

  it('con 2 respuestas todavía no hace nada: no le paga al modelo', async () => {
    obtenerClienteDbMock.mockReturnValue(construirDb({ archivos: [], respuestas: 2 }));

    await tick();

    expect(generarAnticipoMock).not.toHaveBeenCalled();
    expect(enviarMailAnticipoMock).not.toHaveBeenCalled();
  });

  it('si ya se envió, no repite ni el mail ni la generación', async () => {
    obtenerClienteDbMock.mockReturnValue(
      construirDb({ archivos: ['anticipo.pdf', 'anticipo_enviado.txt'], respuestas: 12 })
    );

    await tick();

    expect(generarAnticipoMock).not.toHaveBeenCalled();
    expect(enviarMailAnticipoMock).not.toHaveBeenCalled();
  });

  it('si el anticipo ya existe pero el mail no salió, reintenta SOLO el mail', async () => {
    obtenerClienteDbMock.mockReturnValue(construirDb({ archivos: ['anticipo.pdf'], respuestas: 5 }));

    await tick();

    expect(generarAnticipoMock).not.toHaveBeenCalled();
    expect(enviarMailAnticipoMock).toHaveBeenCalledOnce();
  });

  it('deja el candado solo si el mail salió de verdad', async () => {
    obtenerClienteDbMock.mockReturnValue(construirDb({ archivos: [], respuestas: 3 }));

    await tick();

    expect(subirTextoMock).toHaveBeenCalledOnce();
    expect(subirTextoMock.mock.calls[0][1]).toBe('n1/paquete/anticipo_enviado.txt');
  });

  it('si falta la clave de Resend no deja el candado: el próximo tick reintenta', async () => {
    enviarMailAnticipoMock.mockResolvedValue(false);
    obtenerClienteDbMock.mockReturnValue(construirDb({ archivos: [], respuestas: 3 }));

    await tick();

    expect(enviarMailAnticipoMock).toHaveBeenCalledOnce();
    expect(subirTextoMock).not.toHaveBeenCalled();
  });
});
