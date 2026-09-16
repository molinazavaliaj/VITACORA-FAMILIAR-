import { describe, it, expect, vi } from 'vitest';
import { reintentarNarracion } from '../src/reintentar-narracion.js';
import { CANDADO_AVISO } from '../src/mail/socios.js';

// --- fake de admin ----------------------------------------------------------
//
// Mismo patrón que narraciones.test.ts: un resultado por `from(tabla)` y el
// registro de lo que se encadenó; `storage.from('audios').remove` anota las
// rutas que se pidieron borrar y responde lo que diga `borrar`.

type Resultado = { data: unknown; error: { message: string } | null };
type Llamada = { tabla: string; cadena: [string, unknown[]][] };

function construirDbFake(opciones: { narraciones: Resultado; borrar?: Resultado }) {
  const llamadas: Llamada[] = [];
  const borrados: string[][] = [];

  const from = vi.fn((tabla: string) => {
    const llamada: Llamada = { tabla, cadena: [] };
    llamadas.push(llamada);
    const builder: Record<string, unknown> = {};
    for (const metodo of ['select', 'eq', 'update']) {
      builder[metodo] = (...args: unknown[]) => {
        llamada.cadena.push([metodo, args]);
        return builder;
      };
    }
    builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(opciones.narraciones).then(resolve, reject);
    return builder;
  });

  const remove = vi.fn((rutas: string[]) => {
    borrados.push(rutas);
    return Promise.resolve(opciones.borrar ?? { data: null, error: null });
  });

  return { from, llamadas, borrados, remove, storage: { from: vi.fn(() => ({ remove })) } };
}

const db = (fake: ReturnType<typeof construirDbFake>) => fake as unknown as Parameters<typeof reintentarNarracion>[0];
const paso = (llamada: Llamada, metodo: string) => llamada.cadena.find(([m]) => m === metodo)?.[1] as any[] | undefined;
const pasos = (llamada: Llamada, metodo: string) => llamada.cadena.filter(([m]) => m === metodo).map(([, args]) => args);

describe('reintentarNarracion', () => {
  it('una fallida vuelve a pendiente (solo si sigue fallida) y se borra el candado de su aviso', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const fake = construirDbFake({ narraciones: { data: [{ id: 'abc', narrador_id: 'n1' }], error: null } });

    await reintentarNarracion(db(fake), 'abc');

    expect(fake.llamadas).toHaveLength(1);
    expect(fake.llamadas[0].tabla).toBe('narraciones');
    expect(paso(fake.llamadas[0], 'update')![0]).toMatchObject({ estado: 'pendiente', error: null });
    expect(pasos(fake.llamadas[0], 'eq')).toEqual([
      ['id', 'abc'],
      ['estado', 'fallida'],
    ]);
    // El candado es por (narración, motivo): sin borrarlo, un segundo fallo
    // no avisaría a nadie.
    expect(fake.borrados).toEqual([[`n1/paquete/${CANDADO_AVISO('abc', 'fallida')}`]]);
    logSpy.mockRestore();
  });

  it('si no está fallida (o no existe), tira y no toca Storage', async () => {
    const fake = construirDbFake({ narraciones: { data: [], error: null } });

    await expect(reintentarNarracion(db(fake), 'abc')).rejects.toThrow(/solo se reintenta una narración fallida/);

    expect(fake.borrados).toEqual([]);
  });

  it('si Supabase falla, tira con el mensaje', async () => {
    const fake = construirDbFake({ narraciones: { data: null, error: { message: 'se cayó' } } });

    await expect(reintentarNarracion(db(fake), 'abc')).rejects.toThrow(/se cayó/);
  });

  it('si el candado no está (o Storage no lo puede borrar), la narración igual quedó pendiente: avisa y no tira', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fake = construirDbFake({
      narraciones: { data: [{ id: 'abc', narrador_id: 'n1' }], error: null },
      borrar: { data: null, error: { message: 'Object not found' } },
    });

    await expect(reintentarNarracion(db(fake), 'abc')).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('candado'));
    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
