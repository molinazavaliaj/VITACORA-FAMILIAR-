import { describe, it, expect, vi, beforeEach } from 'vitest';

// 10/10: a Dora le falló la pregunta del 09/10 (Meta: «número en un experimento», 130472) y a Ñako le
// falla la del día desde el 28/09 (131047, fuera de la ventana de 24 h). Los dos quedaron solo en la
// consola de Railway: nadie se enteró. Un mensaje que no llega es un aviso a los socios.

const mocks = vi.hoisted(() => ({
  fila: null as null | { id: string; entrega: string | null; narrador_id: string; tipo: string },
  nombre: 'Babu' as string | null,
  updates: [] as unknown[],
  avisos: [] as { clave: string; asunto: string; detalle: string }[],
}));

vi.mock('../src/db/cliente.js', () => ({
  db: {
    from: (tabla: string) => {
      const q: any = {
        select: () => q, eq: () => q,
        maybeSingle: async () => (tabla === 'envios'
          ? { data: mocks.fila, error: null }
          : { data: mocks.nombre === null ? null : { como_le_dicen: mocks.nombre }, error: null }),
        update: (v: unknown) => { mocks.updates.push(v); return { eq: async () => ({ error: null }) }; },
      };
      return q;
    },
  },
}));
vi.mock('../src/v3/avisos.js', () => ({
  avisarSocios: async (clave: string, asunto: string, detalle: string) => { mocks.avisos.push({ clave, asunto, detalle }); return true; },
}));

import { anotarEntrega, avisoDeEntregaFallida } from '../src/whatsapp/entregas.js';

const NID = '816dc1d1-9ade-4870-a9fd-12c39c79af79';
const fallo = (errorCodigo?: number) => ({ waMessageId: 'wamid.1', estado: 'fallido' as const, momento: '2026-10-09T22:00:10.000Z', errorCodigo, errorDetalle: 'detalle de Meta' });

beforeEach(() => {
  mocks.fila = { id: 'e1', entrega: 'enviado', narrador_id: NID, tipo: 'v3' };
  mocks.nombre = 'Babu';
  mocks.updates = [];
  mocks.avisos = [];
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('un mensaje que no llegó avisa a los socios', () => {
  it('el caso de Dora: anota el fallo y manda un aviso con quién, qué y qué hacer', async () => {
    await anotarEntrega(fallo(130472));
    expect(mocks.updates).toHaveLength(1);
    expect(mocks.avisos).toHaveLength(1);
    const a = mocks.avisos[0];
    expect(a.clave).toBe(`entrega-fallida|${NID}`);
    expect(a.asunto).toContain('Babu');
    expect(a.detalle).toContain(NID);
    expect(a.detalle).toContain('130472');
    expect(a.detalle).toContain('detalle de Meta');
    expect(a.detalle).toMatch(/experimento/i);
  });

  it('entregado o leído no avisa', async () => {
    await anotarEntrega({ ...fallo(), estado: 'leido' });
    await anotarEntrega({ ...fallo(), estado: 'entregado' });
    expect(mocks.avisos).toEqual([]);
  });

  it('un fallo que ya estaba anotado no avisa de nuevo', async () => {
    mocks.fila = { ...mocks.fila!, entrega: 'fallido' };
    await anotarEntrega(fallo(131047));
    expect(mocks.avisos).toEqual([]);
  });

  it('un fallo que llega después de entregado o leído no avisa (el mensaje llegó)', async () => {
    for (const entrega of ['entregado', 'leido']) {
      mocks.fila = { ...mocks.fila!, entrega };
      await anotarEntrega(fallo(131047));
    }
    expect(mocks.avisos).toEqual([]);
  });

  it('un mensaje que no salió de envios no avisa (no sabemos de quién es)', async () => {
    mocks.fila = null;
    await anotarEntrega(fallo(131047));
    expect(mocks.avisos).toEqual([]);
  });

  it('sin nombre en la base, el aviso sale igual con el id', async () => {
    mocks.nombre = null;
    await anotarEntrega(fallo(131047));
    expect(mocks.avisos).toHaveLength(1);
    expect(mocks.avisos[0].detalle).toContain(NID);
  });
});

describe('qué dice el aviso según el código de Meta', () => {
  const base = { narradorId: NID, nombre: 'Ñako', tipo: 'pregunta' };
  it('131047: fuera de la ventana de 24 h', () => {
    expect(avisoDeEntregaFallida({ ...base, errorCodigo: 131047 }).detalle).toMatch(/24 h/);
  });
  it('130472: número en un experimento de Meta, que escriba primero', () => {
    const { detalle } = avisoDeEntregaFallida({ ...base, errorCodigo: 130472 });
    expect(detalle).toMatch(/experimento/i);
    expect(detalle).toMatch(/escrib/i);
  });
  it('131026: no se pudo entregar en ese número', () => {
    expect(avisoDeEntregaFallida({ ...base, errorCodigo: 131026 }).detalle).toMatch(/llam/i);
  });
  it('un código que no conocemos igual avisa, con el código', () => {
    const a = avisoDeEntregaFallida({ ...base, errorCodigo: 999 });
    expect(a.detalle).toContain('999');
    expect(a.asunto).toContain('Ñako');
  });
  it('sin código igual avisa', () => {
    expect(avisoDeEntregaFallida(base).detalle).toContain('sin código');
  });
});
