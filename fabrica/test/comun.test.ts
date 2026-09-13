import { describe, it, expect, vi } from 'vitest';
import { descargarTextoOpcional, esErrorDeNoEncontrado } from '../src/libro/comun.js';

function dbConDescarga(resultado: { data: unknown; error: unknown }) {
  const download = vi.fn(() => Promise.resolve(resultado));
  return { db: { storage: { from: () => ({ download }) } } as never, download };
}

describe('esErrorDeNoEncontrado', () => {
  it('reconoce las formas en que Storage dice "no está"', () => {
    expect(esErrorDeNoEncontrado({ message: 'Object not found' })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'The resource was not found', statusCode: '404' })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'x', statusCode: 404 })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'x', status: 404 })).toBe(true);
    expect(esErrorDeNoEncontrado({ message: 'x', statusCode: '400', error: 'not_found' })).toBe(true);
  });

  it('cualquier otro error no es "no está"', () => {
    expect(esErrorDeNoEncontrado({ message: 'fetch failed' })).toBe(false);
    expect(esErrorDeNoEncontrado({ message: 'Internal server error', statusCode: '500' })).toBe(false);
    expect(esErrorDeNoEncontrado({ message: 'new row violates row-level security policy', statusCode: '403' })).toBe(false);
    expect(esErrorDeNoEncontrado(null)).toBe(false);
    expect(esErrorDeNoEncontrado('no existe')).toBe(false);
  });
});

describe('descargarTextoOpcional', () => {
  it('el archivo está → su texto', async () => {
    const { db } = dbConDescarga({ data: { text: async () => 'hola' }, error: null });
    expect(await descargarTextoOpcional(db, 'n1/paquete/x.md')).toBe('hola');
  });

  it('no está (Object not found) → null', async () => {
    const { db } = dbConDescarga({ data: null, error: { message: 'Object not found', statusCode: '404' } });
    expect(await descargarTextoOpcional(db, 'n1/paquete/x.md')).toBeNull();
  });

  it('un fallo transitorio de Storage tira en vez de hacerse pasar por "no está"', async () => {
    const { db } = dbConDescarga({ data: null, error: { message: 'fetch failed', statusCode: '500' } });
    await expect(descargarTextoOpcional(db, 'n1/paquete/x.md')).rejects.toThrow('No se pudo descargar n1/paquete/x.md: fetch failed');
  });
});
