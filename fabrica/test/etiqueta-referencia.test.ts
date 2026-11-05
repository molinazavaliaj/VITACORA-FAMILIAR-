import { describe, it, expect, vi, beforeEach } from 'vitest';

// La referencia del paquete es el número de pedido (VF-1001), el mismo que se ve en
// /admin/pedidos. Sin la migración aplicada la columna no existe: el envío sale igual.

const { armarMock, emitirMock } = vi.hoisted(() => ({
  armarMock: vi.fn().mockResolvedValue(true),
  emitirMock: vi.fn().mockResolvedValue({ proveedor: 'manual', etiquetaUrl: null, envioExternoId: null, transportista: null, seguimiento: null, seguimientoUrl: null }),
}));

vi.mock('../src/libro/imprenta.js', async () => {
  const actual = await vi.importActual<typeof import('../src/libro/imprenta.js')>('../src/libro/imprenta.js');
  return { ...actual, armarLibroDeImprenta: armarMock };
});
vi.mock('../src/envio/proveedor.js', () => ({ proveedorDe: () => ({ nombre: 'manual', emitir: emitirMock }) }));

const { mandarEntregasAImprenta } = await import('../src/entregas.js');

function baseFalsa(lecturaNumero: { data: unknown; error: unknown }) {
  const updates: Record<string, unknown>[] = [];
  const db = {
    from: (tabla: string) => ({
      select: (columnas: string) => ({
        eq: () => {
          const resultado =
            tabla === 'entregas'
              ? { data: [{ id: 'e1234567-x', narrador_id: 'n1', pedido_id: 'p1', estado: 'lista', origen: 'ES' }], error: null }
              : columnas === 'numero'
                ? lecturaNumero
                : { data: { extras: { copias: 1, marcos: 0 } }, error: null };
          return { then: (r: (v: unknown) => unknown) => Promise.resolve(resultado).then(r), maybeSingle: async () => resultado };
        },
      }),
      update: (cambios: Record<string, unknown>) => ({
        eq: async () => {
          updates.push(cambios);
          return { error: null };
        },
      }),
    }),
  };
  return { db: db as never, updates };
}

beforeEach(() => vi.clearAllMocks());

describe('la referencia del paquete', () => {
  it('es el número de pedido', async () => {
    const { db } = baseFalsa({ data: { numero: 1023 }, error: null });
    await mandarEntregasAImprenta(db);
    expect(emitirMock.mock.calls[0][0].referencia).toBe('VF-1023');
  });

  it('sin la migración aplicada, sale con la referencia de antes y conserva el peso', async () => {
    const { db, updates } = baseFalsa({ data: null, error: { code: '42703', message: 'column pedidos.numero does not exist' } });
    await mandarEntregasAImprenta(db);
    expect(emitirMock.mock.calls[0][0].referencia).toBe('Vitácora e1234567');
    expect(updates[0].peso_g).toBe(750);
  });

  it('un pedido sin número tampoco la deja vacía', async () => {
    const { db } = baseFalsa({ data: { numero: null }, error: null });
    await mandarEntregasAImprenta(db);
    expect(emitirMock.mock.calls[0][0].referencia).toBe('Vitácora e1234567');
  });
});
