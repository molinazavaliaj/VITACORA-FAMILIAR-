import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks de infraestructura pesada --------------------------------------
// A diferencia de audiolibro.test.ts (que solo ejerce la función pura
// armarListaConcat), acá corre la orquestación REAL de generarAudiolibro:
// TTS, ffmpeg y Storage quedan mockeados, pero el flujo (qué se descarga,
// en qué orden se normaliza/concatena, qué se sube y con qué nombre) es el
// código de producción.

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

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return {
    ...actual,
    obtenerClienteDb: vi.fn(),
  };
});

import { obtenerClienteDb } from '../src/db.js';
import { generarAudiolibro } from '../src/audio/audiolibro.js';

// --- helpers ---------------------------------------------------------------

function blobFake(contenido: string) {
  // OJO: `Buffer.from(contenido).buffer` NO alcanza acá — para strings
  // chicas, Node reutiliza un pool interno de 8KB, así que `.buffer` es el
  // pool entero (con basura de otras allocations), no el contenido exacto.
  // `new Uint8Array(...)` sobre un Buffer copia los bytes a un
  // ArrayBuffer nuevo, del tamaño justo — recién ahí las comparaciones
  // `toHaveBeenCalledWith(Buffer.from('audio-1'))` funcionan.
  const bytes = new Uint8Array(Buffer.from(contenido, 'utf8'));
  return { arrayBuffer: async () => bytes.buffer };
}

// Buffers "trazables": en vez de bytes de audio de verdad, cada mock escribe
// una etiqueta de texto que describe qué se le pidió — así los asserts
// pueden verificar QUÉ se normalizó/concatenó sin decodificar mp3 de mentira.
function etiquetaDe(buffer: Buffer): string {
  return buffer.toString('utf8');
}

function construirDbFake(opciones: {
  descargas?: Record<string, { data: unknown; error: unknown }>;
  uploadImpl?: (
    ruta: string,
    buffer: Buffer,
    opts: unknown
  ) => Promise<{ data: unknown; error: unknown }>;
}) {
  const download = vi.fn((ruta: string) => {
    const resultado = opciones.descargas?.[ruta];
    return Promise.resolve(resultado ?? { data: null, error: { message: `no existe: ${ruta}` } });
  });
  const upload = vi.fn(opciones.uploadImpl ?? (async () => ({ data: { path: 'x' }, error: null })));
  const storage = { from: vi.fn(() => ({ download, upload })) };
  return { storage, download, upload };
}

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

describe('generarAudiolibro (orquestación real)', () => {
  const estructura = {
    capitulos: [
      { nombre: 'Infancia', ordenes: [1] },
      { nombre: 'El amor', ordenes: [2] },
    ],
  };
  const archivosDisponibles = ['dia_01.ogg', 'dia_02.ogg'];

  it('sube cada capítulo a paquete/audiolibro_cap_NN.mp3 con contentType audio/mpeg', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/dia_01.ogg': { data: blobFake('audio-1'), error: null },
        'narrador-1/dia_02.ogg': { data: blobFake('audio-2'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await generarAudiolibro('narrador-1', estructura, archivosDisponibles, []);

    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/audiolibro_cap_01.mp3',
      expect.any(Buffer),
      { contentType: 'audio/mpeg', upsert: true }
    );
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/audiolibro_cap_02.mp3',
      expect.any(Buffer),
      { contentType: 'audio/mpeg', upsert: true }
    );
  });

  it('la intro TTS de cada capítulo es "Capítulo N: {nombre}"', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/dia_01.ogg': { data: blobFake('audio-1'), error: null },
        'narrador-1/dia_02.ogg': { data: blobFake('audio-2'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await generarAudiolibro('narrador-1', estructura, archivosDisponibles, []);

    expect(generarAudioTtsMock).toHaveBeenCalledWith('Capítulo 1: Infancia');
    expect(generarAudioTtsMock).toHaveBeenCalledWith('Capítulo 2: El amor');
  });

  it('normaliza la intro y cada audio descargado antes de concatenar el capítulo', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/dia_01.ogg': { data: blobFake('audio-1'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    const estructuraUnCapitulo = { capitulos: [{ nombre: 'Infancia', ordenes: [1] }] };
    await generarAudiolibro('narrador-1', estructuraUnCapitulo, ['dia_01.ogg'], []);

    // la intro (TTS, siempre mp3) se normaliza como 'mp3'...
    expect(normalizarAMp3Mock).toHaveBeenCalledWith(
      Buffer.from('TTS(Capítulo 1: Infancia)'),
      'mp3'
    );
    // ...y el audio descargado se normaliza según su extensión real.
    expect(normalizarAMp3Mock).toHaveBeenCalledWith(Buffer.from('audio-1'), 'ogg');

    // el capítulo se concatena con la intro normalizada PRIMERO.
    expect(concatenarMp3sMock).toHaveBeenCalledWith([
      Buffer.from('N(mp3:TTS(Capítulo 1: Infancia))'),
      Buffer.from('N(ogg:audio-1)'),
    ]);
  });

  it('con saludos: sube el bonus, lo incluye en el concat final y lo devuelve en el resultado', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/dia_01.ogg': { data: blobFake('audio-1'), error: null },
        'narrador-1/dia_02.ogg': { data: blobFake('audio-2'), error: null },
        'narrador-1/saludos/marta.webm': { data: blobFake('saludo-marta'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    const saludos = [{ nombre: 'Marta', vinculo: 'hija', audio_path: 'narrador-1/saludos/marta.webm' }];

    const resultado = await generarAudiolibro('narrador-1', estructura, archivosDisponibles, saludos);

    expect(generarAudioTtsMock).toHaveBeenCalledWith('Mensajes para usted');
    expect(normalizarAMp3Mock).toHaveBeenCalledWith(Buffer.from('saludo-marta'), 'webm');

    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/audiolibro_bonus_saludos.mp3',
      expect.any(Buffer),
      { contentType: 'audio/mpeg', upsert: true }
    );
    expect(resultado.bonus).toBe('narrador-1/paquete/audiolibro_bonus_saludos.mp3');

    // el buffer subido como bonus es el mismo que entra en el concat final
    // (junto con los dos capítulos) — no un cálculo aparte y desconectado.
    const bufferBonusSubido = db.upload.mock.calls.find(
      (llamada) => llamada[0] === 'narrador-1/paquete/audiolibro_bonus_saludos.mp3'
    )?.[1] as Buffer;
    const argsConcatFinal = concatenarMp3sMock.mock.calls[concatenarMp3sMock.mock.calls.length - 1][0] as Buffer[];
    expect(argsConcatFinal).toHaveLength(3); // 2 capítulos + bonus
    expect(argsConcatFinal[2]).toEqual(bufferBonusSubido);
  });

  it('sin saludos: no sube bonus, no llama a la intro de saludos, y el resultado no trae la clave bonus', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/dia_01.ogg': { data: blobFake('audio-1'), error: null },
        'narrador-1/dia_02.ogg': { data: blobFake('audio-2'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    const resultado = await generarAudiolibro('narrador-1', estructura, archivosDisponibles, []);

    expect(generarAudioTtsMock).not.toHaveBeenCalledWith('Mensajes para usted');
    expect(db.upload).not.toHaveBeenCalledWith(
      'narrador-1/paquete/audiolibro_bonus_saludos.mp3',
      expect.anything(),
      expect.anything()
    );
    expect(resultado.bonus).toBeUndefined();
    expect('bonus' in resultado).toBe(false);

    // el concat final solo lleva los dos capítulos.
    const argsConcatFinal = concatenarMp3sMock.mock.calls[concatenarMp3sMock.mock.calls.length - 1][0] as Buffer[];
    expect(argsConcatFinal).toHaveLength(2);
  });

  it('el resultado devuelto coincide con lo efectivamente subido', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/dia_01.ogg': { data: blobFake('audio-1'), error: null },
        'narrador-1/dia_02.ogg': { data: blobFake('audio-2'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    const resultado = await generarAudiolibro('narrador-1', estructura, archivosDisponibles, []);

    expect(resultado).toEqual({
      capitulos: [
        'narrador-1/paquete/audiolibro_cap_01.mp3',
        'narrador-1/paquete/audiolibro_cap_02.mp3',
      ],
      bonus: undefined,
      completo: 'narrador-1/paquete/audiolibro_completo.mp3',
    });

    const rutasSubidas = db.upload.mock.calls.map((llamada) => llamada[0]);
    expect(rutasSubidas).toEqual([
      'narrador-1/paquete/audiolibro_cap_01.mp3',
      'narrador-1/paquete/audiolibro_cap_02.mp3',
      'narrador-1/paquete/audiolibro_completo.mp3',
    ]);
  });

  it('si una subida falla, generarAudiolibro rechaza en vez de resolver silenciosamente', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/dia_01.ogg': { data: blobFake('audio-1'), error: null },
        'narrador-1/dia_02.ogg': { data: blobFake('audio-2'), error: null },
      },
      uploadImpl: async (ruta) => {
        if (ruta === 'narrador-1/paquete/audiolibro_cap_02.mp3') {
          return { data: null, error: { message: 'Storage caído' } };
        }
        return { data: { path: ruta }, error: null };
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(
      generarAudiolibro('narrador-1', estructura, archivosDisponibles, [])
    ).rejects.toThrow(/audiolibro_cap_02\.mp3/);

    // no debería haber llegado a armar/subir el concat final si un capítulo falló.
    expect(db.upload).not.toHaveBeenCalledWith(
      'narrador-1/paquete/audiolibro_completo.mp3',
      expect.anything(),
      expect.anything()
    );
  });
});
