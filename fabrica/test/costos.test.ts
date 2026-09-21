import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RUTA_COSTOS,
  armarFila,
  calcularUsd,
  parsearCostos,
  registrarUso,
  resumen,
  type FilaCosto,
} from '../src/costos.js';

// --- Storage fake: solo download/upload sobre el bucket `audios` ------------
// Mismo patrón que fotos.test.ts / ensamblar.test.ts: un objeto mínimo con la
// forma que usa el código, nada de red.

function blobFake(contenido: string) {
  return { text: async () => contenido };
}

function construirDbFake(opciones: {
  /** ruta → contenido existente; ausente = "Object not found" (no existe todavía). */
  archivos?: Record<string, string>;
  download?: ReturnType<typeof vi.fn>;
  upload?: ReturnType<typeof vi.fn>;
}) {
  const download =
    opciones.download ??
    vi.fn((ruta: string) => {
      const contenido = opciones.archivos?.[ruta];
      return Promise.resolve(
        contenido === undefined
          ? { data: null, error: { message: 'Object not found', statusCode: '404' } }
          : { data: blobFake(contenido), error: null }
      );
    });
  const upload = opciones.upload ?? vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  return {
    storage: { from: vi.fn(() => ({ download, upload })) },
    // La tabla del panel: `registrarUso` anota además en consumo_ia, así que el
    // fake tiene que espejar al cliente o "todo bien" deja de significar cero avisos.
    from: vi.fn(() => ({ insert: async () => ({ error: null }) })),
    download,
    upload,
  };
}

const USO_FABLE = { input_tokens: 1_000_000, output_tokens: 100_000, cache_creation_input_tokens: 200_000, cache_read_input_tokens: 500_000 };

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
});

// --- cálculo de USD ---------------------------------------------------------

describe('calcularUsd', () => {
  it('claude-fable-5: 10/50 USD por millón in/out, cache write 12,5, cache read 1', () => {
    // 1M in = 10, 100k out = 5, 200k cache write = 2,5, 500k cache read = 0,5
    expect(calcularUsd('claude-fable-5', USO_FABLE)).toBe(18);
  });

  it('claude-opus-5: 5/25 (cache write 6,25, cache read 0,5)', () => {
    expect(calcularUsd('claude-opus-5', USO_FABLE)).toBe(5 + 2.5 + 1.25 + 0.25);
  });

  it('claude-haiku-4-5: 1/5 (cache write 1,25, cache read 0,1)', () => {
    expect(calcularUsd('claude-haiku-4-5', USO_FABLE)).toBe(1 + 0.5 + 0.25 + 0.05);
  });

  it('tolera campos ausentes o null en usage (los cuenta como 0)', () => {
    expect(calcularUsd('claude-fable-5', { input_tokens: 100_000, output_tokens: null })).toBe(1);
    expect(calcularUsd('claude-fable-5', {})).toBe(0);
  });

  it('un modelo con sufijo de fecha usa el precio del modelo base', () => {
    expect(calcularUsd('claude-haiku-4-5-20251001', { input_tokens: 1_000_000 })).toBe(1);
  });

  it('un modelo desconocido vale 0 y avisa (los tokens igual se anotan)', () => {
    expect(calcularUsd('modelo-inventado', USO_FABLE)).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('modelo-inventado'));
  });

  it('redondea a 6 decimales para no arrastrar ruido de coma flotante', () => {
    // 1 token de input de fable = 0,00001 USD exactos.
    expect(calcularUsd('claude-fable-5', { input_tokens: 1 })).toBe(0.00001);
    expect(calcularUsd('claude-fable-5', { input_tokens: 3, output_tokens: 7 })).toBe(0.00038);
  });
});

describe('armarFila', () => {
  it('arma la fila con fecha ISO, tokens desglosados y usd', () => {
    const fecha = new Date('2026-09-20T12:00:00.000Z');
    expect(armarFila('claude-fable-5', 'capitulo', USO_FABLE, fecha)).toEqual({
      fecha: '2026-09-20T12:00:00.000Z',
      modelo: 'claude-fable-5',
      paso: 'capitulo',
      input: 1_000_000,
      output: 100_000,
      cache_write: 200_000,
      cache_read: 500_000,
      usd: 18,
    });
  });
});

// --- costos.json: leer lo que hay ------------------------------------------

describe('parsearCostos', () => {
  it('null (no existe todavía) → lista vacía', () => {
    expect(parsearCostos(null)).toEqual([]);
  });

  it('parsea la lista existente', () => {
    const fila = armarFila('claude-fable-5', 'capitulo', USO_FABLE, new Date('2026-09-20T12:00:00.000Z'));
    expect(parsearCostos(JSON.stringify([fila]))).toEqual([fila]);
  });

  it('tira si el archivo no es una lista JSON: no se pisa un costos.json roto', () => {
    expect(() => parsearCostos('{"no": "es lista"}')).toThrow(/costos\.json/);
    expect(() => parsearCostos('esto no es json')).toThrow(/costos\.json/);
  });
});

// --- registrarUso: acumula en Storage y nunca frena -------------------------

describe('registrarUso', () => {
  it('sin costos.json previo, crea la lista con una fila', async () => {
    const db = construirDbFake({});

    await registrarUso(db as never, 'narrador-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: USO_FABLE });

    expect(db.download).toHaveBeenCalledWith(RUTA_COSTOS('narrador-1'));
    expect(db.upload).toHaveBeenCalledTimes(1);
    const [ruta, contenido, opciones] = db.upload.mock.calls[0];
    expect(ruta).toBe('narrador-1/paquete/costos.json');
    expect(opciones).toEqual({ contentType: 'application/json', upsert: true });
    const filas = JSON.parse(contenido as string) as FilaCosto[];
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ modelo: 'claude-fable-5', paso: 'capitulo', input: 1_000_000, usd: 18 });
    expect(new Date(filas[0].fecha).toISOString()).toBe(filas[0].fecha);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('con costos.json previo, agrega la fila al final sin perder las anteriores', async () => {
    const previa = armarFila('claude-fable-5', 'estructura', { input_tokens: 10 }, new Date('2026-09-19T00:00:00.000Z'));
    const db = construirDbFake({ archivos: { 'narrador-1/paquete/costos.json': JSON.stringify([previa]) } });

    await registrarUso(db as never, 'narrador-1', { modelo: 'claude-haiku-4-5', paso: 'anticipo', usage: { input_tokens: 1_000_000 } });

    const filas = JSON.parse(db.upload.mock.calls[0][1] as string) as FilaCosto[];
    expect(filas).toHaveLength(2);
    expect(filas[0]).toEqual(previa);
    expect(filas[1]).toMatchObject({ modelo: 'claude-haiku-4-5', paso: 'anticipo', usd: 1 });
  });

  it('si usage no vino (mock sin usage), no anota nada ni toca Storage', async () => {
    const db = construirDbFake({});

    await registrarUso(db as never, 'narrador-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: undefined });

    expect(db.download).not.toHaveBeenCalled();
    expect(db.upload).not.toHaveBeenCalled();
  });

  it('si Storage falla al bajar, avisa con console.warn y no tira', async () => {
    const db = construirDbFake({
      download: vi.fn().mockResolvedValue({ data: null, error: { message: 'red caída', statusCode: '500' } }),
    });

    await expect(
      registrarUso(db as never, 'narrador-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: USO_FABLE })
    ).resolves.toBeUndefined();

    expect(db.upload).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/registrarUso.*narrador-1.*red caída/));
  });

  it('si Storage falla al subir, avisa con console.warn y no tira', async () => {
    const db = construirDbFake({
      upload: vi.fn().mockResolvedValue({ data: null, error: { message: 'sin permisos' } }),
    });

    await expect(
      registrarUso(db as never, 'narrador-1', { modelo: 'claude-fable-5', paso: 'editor', usage: USO_FABLE })
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/registrarUso.*editor.*sin permisos/));
  });

  it('si el costos.json existente está roto, avisa y no lo pisa', async () => {
    const db = construirDbFake({ archivos: { 'narrador-1/paquete/costos.json': 'basura' } });

    await registrarUso(db as never, 'narrador-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: USO_FABLE });

    expect(db.upload).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/registrarUso.*costos\.json/));
  });

  it('acepta la función que consigue el cliente (para los módulos que no reciben db)', async () => {
    const db = construirDbFake({});
    const obtenerDb = vi.fn(() => db);

    await registrarUso(obtenerDb as never, 'narrador-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: USO_FABLE });

    expect(obtenerDb).toHaveBeenCalledTimes(1);
    expect(db.upload).toHaveBeenCalledWith('narrador-1/paquete/costos.json', expect.any(String), expect.anything());
  });

  it('si conseguir el cliente tira (por ejemplo, faltan variables de entorno), tampoco frena', async () => {
    const obtenerDb = () => {
      throw new Error('Faltan variables de entorno');
    };

    await expect(
      registrarUso(obtenerDb as never, 'narrador-1', { modelo: 'claude-fable-5', paso: 'capitulo', usage: USO_FABLE })
    ).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Faltan variables de entorno'));
  });
});

// --- resumen ----------------------------------------------------------------

describe('resumen', () => {
  it('suma el total en USD y lo desglosa por paso, con la cantidad de llamadas', () => {
    const fecha = new Date('2026-09-20T12:00:00.000Z');
    const costos = [
      armarFila('claude-fable-5', 'estructura', { input_tokens: 100_000 }, fecha), // 1
      armarFila('claude-fable-5', 'capitulo', { input_tokens: 200_000, output_tokens: 20_000 }, fecha), // 2 + 1
      armarFila('claude-fable-5', 'capitulo', { input_tokens: 100_000 }, fecha), // 1
      armarFila('claude-fable-5', 'editor', { output_tokens: 10_000 }, fecha), // 0,5
    ];

    expect(resumen(costos)).toEqual({
      totalUsd: 5.5,
      llamadas: 4,
      porPaso: {
        estructura: { usd: 1, llamadas: 1 },
        capitulo: { usd: 4, llamadas: 2 },
        editor: { usd: 0.5, llamadas: 1 },
      },
    });
  });

  it('lista vacía → todo en cero', () => {
    expect(resumen([])).toEqual({ totalUsd: 0, llamadas: 0, porPaso: {} });
  });

  it('el total no arrastra ruido de coma flotante', () => {
    const fecha = new Date('2026-09-20T12:00:00.000Z');
    const costos = Array.from({ length: 10 }, () => armarFila('claude-fable-5', 'capitulo', { input_tokens: 1 }, fecha));
    expect(resumen(costos).totalUsd).toBe(0.0001);
  });
});
