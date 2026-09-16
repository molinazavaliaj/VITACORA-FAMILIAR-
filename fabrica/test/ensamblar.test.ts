import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks de infraestructura pesada --------------------------------------
// Igual que audiolibro-orquestacion.test.ts: TTS, ffmpeg y Storage quedan
// mockeados, pero la orquestación (qué se descarga, qué se normaliza y
// concatena, qué se sube y con qué nombre) es el código de producción.

const { generarAudioTtsMock } = vi.hoisted(() => ({ generarAudioTtsMock: vi.fn() }));
vi.mock('../src/audio/tts.js', () => ({
  generarAudioTts: generarAudioTtsMock,
}));

const { normalizarAMp3Mock, concatenarMp3sMock } = vi.hoisted(() => ({
  normalizarAMp3Mock: vi.fn(),
  concatenarMp3sMock: vi.fn(),
}));
vi.mock('../src/audio/ffmpeg.js', () => ({
  normalizarAMp3: normalizarAMp3Mock,
  concatenarMp3s: concatenarMp3sMock,
}));

import { ensamblarAudiolibroClonado } from '../src/voz/ensamblar.js';

// --- helpers ---------------------------------------------------------------

function blobFake(contenido: string) {
  // Ver audiolibro-orquestacion.test.ts: `new Uint8Array(...)` copia a un
  // ArrayBuffer del tamaño justo (el `.buffer` de un Buffer chico es el pool).
  const bytes = new Uint8Array(Buffer.from(contenido, 'utf8'));
  return { arrayBuffer: async () => bytes.buffer };
}

function etiquetaDe(buffer: Buffer): string {
  return buffer.toString('utf8');
}

function construirDbFake(opciones: {
  descargas?: Record<string, { data: unknown; error: unknown }>;
  uploadImpl?: (ruta: string, buffer: Buffer, opts: unknown) => Promise<{ data: unknown; error: unknown }>;
}) {
  const download = vi.fn((ruta: string) => {
    const resultado = opciones.descargas?.[ruta];
    return Promise.resolve(resultado ?? { data: null, error: { message: `no existe: ${ruta}` } });
  });
  const upload = vi.fn(opciones.uploadImpl ?? (async () => ({ data: { path: 'x' }, error: null })));
  const storage = { from: vi.fn(() => ({ download, upload })) };
  return { storage, download, upload };
}

const db = (fake: ReturnType<typeof construirDbFake>) => fake as unknown as Parameters<typeof ensamblarAudiolibroClonado>[0];

beforeEach(() => {
  vi.clearAllMocks();

  generarAudioTtsMock.mockImplementation(async (texto: string) => Buffer.from(`TTS(${texto})`));
  normalizarAMp3Mock.mockImplementation(async (buffer: Buffer, extension: string) =>
    Buffer.from(`N(${extension}:${etiquetaDe(buffer)})`)
  );
  concatenarMp3sMock.mockImplementation(async (buffers: Buffer[]) =>
    Buffer.from(`CONCAT[${buffers.map(etiquetaDe).join('|')}]`)
  );
});

describe('ensamblarAudiolibroClonado', () => {
  const args = {
    narradorId: 'n1',
    pedidoId: 'p1',
    capitulosPaths: ['n1/voz/cap_01.mp3', 'n1/voz/cap_02.mp3'],
    estructura: { capitulos: [{ nombre: 'Infancia' }, { nombre: 'El amor' }] },
  };
  const descargas = {
    'n1/voz/cap_01.mp3': { data: blobFake('voz-1'), error: null },
    'n1/voz/cap_02.mp3': { data: blobFake('voz-2'), error: null },
  };

  it('con 2 capítulos sube 2 mp3 de capítulo y el completo, en ese orden, a paquete/', async () => {
    const fake = construirDbFake({ descargas });

    const resultado = await ensamblarAudiolibroClonado(db(fake), args);

    const rutasSubidas = fake.upload.mock.calls.map((llamada) => llamada[0]);
    expect(rutasSubidas).toEqual([
      'n1/paquete/audiolibro_cap_01.mp3',
      'n1/paquete/audiolibro_cap_02.mp3',
      'n1/paquete/audiolibro_completo.mp3',
    ]);
    for (const llamada of fake.upload.mock.calls) {
      expect(llamada[2]).toEqual({ contentType: 'audio/mpeg', upsert: true });
    }
    expect(resultado).toEqual({
      capitulos: ['n1/paquete/audiolibro_cap_01.mp3', 'n1/paquete/audiolibro_cap_02.mp3'],
      completo: 'n1/paquete/audiolibro_completo.mp3',
    });
  });

  it('cada capítulo lleva la intro TTS "Capítulo N: nombre" y después el cuerpo narrado (mp3) normalizado', async () => {
    const fake = construirDbFake({ descargas });

    await ensamblarAudiolibroClonado(db(fake), args);

    expect(generarAudioTtsMock.mock.calls.map((c) => c[0])).toEqual(['Capítulo 1: Infancia', 'Capítulo 2: El amor']);
    expect(fake.download.mock.calls.map((c) => c[0])).toEqual(['n1/voz/cap_01.mp3', 'n1/voz/cap_02.mp3']);
    // el cuerpo que subió el worker es mp3: se normaliza como tal.
    expect(normalizarAMp3Mock).toHaveBeenCalledWith(Buffer.from('voz-1'), 'mp3');
    // intro primero, cuerpo después.
    expect(concatenarMp3sMock).toHaveBeenCalledWith([
      Buffer.from('N(mp3:TTS(Capítulo 1: Infancia))'),
      Buffer.from('N(mp3:voz-1)'),
    ]);
    // el completo concatena los dos capítulos ya armados.
    const ultimoConcat = concatenarMp3sMock.mock.calls[concatenarMp3sMock.mock.calls.length - 1][0] as Buffer[];
    expect(ultimoConcat.map(etiquetaDe)).toEqual([
      'CONCAT[N(mp3:TTS(Capítulo 1: Infancia))|N(mp3:voz-1)]',
      'CONCAT[N(mp3:TTS(Capítulo 2: El amor))|N(mp3:voz-2)]',
    ]);
  });

  it('si el worker dejó menos capítulos que la estructura, tira sin subir nada', async () => {
    const fake = construirDbFake({ descargas });

    await expect(
      ensamblarAudiolibroClonado(db(fake), { ...args, capitulosPaths: ['n1/voz/cap_01.mp3'] })
    ).rejects.toThrow(/p1/);

    expect(fake.upload).not.toHaveBeenCalled();
  });

  it('si una subida falla, rechaza y no llega al completo', async () => {
    const fake = construirDbFake({
      descargas,
      uploadImpl: async (ruta) =>
        ruta === 'n1/paquete/audiolibro_cap_02.mp3'
          ? { data: null, error: { message: 'Storage caído' } }
          : { data: { path: ruta }, error: null },
    });

    await expect(ensamblarAudiolibroClonado(db(fake), args)).rejects.toThrow(/audiolibro_cap_02\.mp3/);

    expect(fake.upload).not.toHaveBeenCalledWith(
      'n1/paquete/audiolibro_completo.mp3',
      expect.anything(),
      expect.anything()
    );
  });
});
