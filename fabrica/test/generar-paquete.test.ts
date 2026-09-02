import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks de infraestructura pesada -------------------------------------

const { escribirCapituloMock } = vi.hoisted(() => ({ escribirCapituloMock: vi.fn() }));
vi.mock('../src/libro/escribir-capitulo.js', () => ({
  escribirCapitulo: escribirCapituloMock,
}));

const { generarAudiolibroMock } = vi.hoisted(() => ({ generarAudiolibroMock: vi.fn() }));
vi.mock('../src/audio/audiolibro.js', () => ({
  generarAudiolibro: generarAudiolibroMock,
}));

const { setContentMock, pdfMock, newPageMock, closeMock, launchMock } = vi.hoisted(() => {
  const setContentMock = vi.fn();
  const pdfMock = vi.fn().mockResolvedValue(Buffer.from('%PDF-fake%'));
  const newPageMock = vi.fn().mockResolvedValue({ setContent: setContentMock, pdf: pdfMock });
  const closeMock = vi.fn();
  const launchMock = vi.fn().mockResolvedValue({ newPage: newPageMock, close: closeMock });
  return { setContentMock, pdfMock, newPageMock, closeMock, launchMock };
});
vi.mock('playwright', () => ({
  chromium: { launch: launchMock },
}));

const { finalMessageMock, streamMock } = vi.hoisted(() => {
  const finalMessageMock = vi.fn();
  const streamMock = vi.fn(() => ({ finalMessage: finalMessageMock }));
  return { finalMessageMock, streamMock };
});
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return { messages: { stream: streamMock } };
    }),
  };
});

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return {
    ...actual,
    obtenerClienteDb: vi.fn(),
  };
});

import { obtenerClienteDb } from '../src/db.js';
import { generarPaquete } from '../src/libro/generar-paquete.js';

function blobFake(contenido: string) {
  return {
    text: async () => contenido,
    arrayBuffer: async () => Buffer.from(contenido).buffer,
  };
}

function construirBuilder(resultado: unknown) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    order: () => builder,
    single: () => Promise.resolve(resultado),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resultado).then(resolve, reject),
  };
  return builder;
}

function construirDbFake(opciones: {
  narrador?: { data: unknown; error: unknown };
  preguntasFijas?: { data: unknown; error: unknown };
  preguntasNarrador?: { data: unknown; error: unknown };
  respuestas?: { data: unknown; error: unknown };
  saludos?: { data: unknown; error: unknown };
  descargas?: Record<string, { data: unknown; error: unknown }>;
  archivosNarrador?: string[];
  upload?: ReturnType<typeof vi.fn>;
  pedidosUpdate?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
}) {
  let fromPreguntasContador = 0;

  const pedidosUpdate = opciones.pedidosUpdate ?? vi.fn().mockResolvedValue({ data: null, error: null });

  const from = vi.fn((tabla: string) => {
    if (tabla === 'narradores') return construirBuilder(opciones.narrador ?? { data: null, error: null });
    if (tabla === 'preguntas') {
      const llamada = fromPreguntasContador++;
      return construirBuilder(
        llamada === 0
          ? opciones.preguntasFijas ?? { data: [], error: null }
          : opciones.preguntasNarrador ?? { data: [], error: null }
      );
    }
    if (tabla === 'respuestas') return construirBuilder(opciones.respuestas ?? { data: [], error: null });
    if (tabla === 'saludos') return construirBuilder(opciones.saludos ?? { data: [], error: null });
    if (tabla === 'pedidos') {
      return {
        update: (valores: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => pedidosUpdate(valores, id),
        }),
      };
    }
    throw new Error(`tabla no mockeada: ${tabla}`);
  });

  const download = vi.fn((ruta: string) => {
    const resultado = opciones.descargas?.[ruta];
    return Promise.resolve(resultado ?? { data: null, error: { message: 'no existe' } });
  });
  const upload = opciones.upload ?? vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  const list = vi.fn(() =>
    Promise.resolve({ data: (opciones.archivosNarrador ?? []).map((name) => ({ name })), error: null })
  );
  const remove = opciones.remove ?? vi.fn().mockResolvedValue({ data: null, error: null });
  const storage = { from: vi.fn(() => ({ download, upload, list, remove })) };

  return { from, storage, download, upload, list, remove, pedidosUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-service-role';
  process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
  process.env.OPENAI_API_KEY = 'clave-openai';
});

describe('generarPaquete', () => {
  const estructura = {
    titulo: 'Roberto — La historia de una vida',
    capitulos: [
      { nombre: 'Infancia', ordenes: [1] },
      { nombre: 'El amor', ordenes: [2] },
    ],
    entidades: [],
  };
  const nombres = { correcciones: [] };

  it('escribe cada capítulo, edita el libro entero, sube el PDF, arma el audiolibro y entrega el pedido', async () => {
    const db = construirDbFake({
      narrador: {
        data: { id: 'narrador-1', nombre: 'Roberto', foto_url: 'https://x/foto.jpg', contexto: { anioNacimiento: 1945 } },
        error: null,
      },
      preguntasFijas: {
        data: [
          { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia' },
          { narrador_id: null, orden: 2, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor' },
        ],
        error: null,
      },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [
          { pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: 'narrador-1/dia_01.ogg' },
          { pregunta_orden: 2, transcripcion: 'La conocí bailando.', texto_directo: null, es_repregunta: false, audio_path: 'narrador-1/dia_02.ogg' },
        ],
        error: null,
      },
      saludos: {
        data: [{ nombre: 'Marta', vinculo: 'hija', audio_path: 'narrador-1/saludos/marta.webm' }],
        error: null,
      },
      descargas: {
        'narrador-1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructura)), error: null },
        'narrador-1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
      },
      archivosNarrador: ['dia_01.ogg', 'dia_02.ogg'],
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    escribirCapituloMock
      .mockResolvedValueOnce('Nací en Rosario.')
      .mockResolvedValueOnce('La conocí bailando.');
    finalMessageMock.mockResolvedValue({
      content: [{ type: 'text', text: '# A mis lectores\n\nHola.\n\n# Infancia\n\nNací en Rosario.' }],
    });
    generarAudiolibroMock.mockResolvedValue({
      capitulos: ['narrador-1/paquete/audiolibro_cap_01.mp3', 'narrador-1/paquete/audiolibro_cap_02.mp3'],
      bonus: 'narrador-1/paquete/audiolibro_bonus_saludos.mp3',
      completo: 'narrador-1/paquete/audiolibro_completo.mp3',
    });

    await generarPaquete({ id: 'pedido-1', narrador_id: 'narrador-1' });

    // escribió los DOS capítulos, en el orden de la estructura.
    expect(escribirCapituloMock).toHaveBeenCalledTimes(2);
    expect(escribirCapituloMock.mock.calls[0][1]).toBe('Infancia');
    expect(escribirCapituloMock.mock.calls[1][1]).toBe('El amor');

    // la pasada de editor recibió el borrador completo (los dos capítulos).
    expect(streamMock).toHaveBeenCalledTimes(1);
    const promptEditor = streamMock.mock.calls[0][0].messages[0].content as string;
    expect(promptEditor).toContain('Nací en Rosario.');
    expect(promptEditor).toContain('La conocí bailando.');
    expect(promptEditor).toContain('Devolvé el libro completo en Markdown');
    expect(streamMock.mock.calls[0][0].max_tokens).toBe(64000);

    // el HTML armado con el resultado del editor se mandó a Playwright.
    expect(launchMock).toHaveBeenCalledTimes(1);
    const htmlGenerado = setContentMock.mock.calls[0][0] as string;
    expect(htmlGenerado).toContain('A mis lectores');
    expect(htmlGenerado).toContain('https://x/foto.jpg');
    expect(htmlGenerado).toContain('1945');
    expect(closeMock).toHaveBeenCalledTimes(1);

    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/libro.pdf',
      expect.anything(),
      { contentType: 'application/pdf', upsert: true }
    );

    // el audiolibro se armó con la estructura y los archivos disponibles del narrador.
    expect(generarAudiolibroMock).toHaveBeenCalledWith(
      'narrador-1',
      estructura,
      ['dia_01.ogg', 'dia_02.ogg'],
      [{ nombre: 'Marta', vinculo: 'hija', audio_path: 'narrador-1/saludos/marta.webm' }]
    );

    // el pedido queda entregado con las rutas del libro y el audiolibro.
    expect(db.pedidosUpdate).toHaveBeenCalledWith(
      {
        estado: 'entregado',
        libro_pdf_path: 'narrador-1/paquete/libro.pdf',
        audiolibro_paths: {
          capitulos: ['narrador-1/paquete/audiolibro_cap_01.mp3', 'narrador-1/paquete/audiolibro_cap_02.mp3'],
          bonus: 'narrador-1/paquete/audiolibro_bonus_saludos.mp3',
          completo: 'narrador-1/paquete/audiolibro_completo.mp3',
        },
      },
      'pedido-1'
    );

    // Checkpoints: cada capítulo y la pasada de editor se cachearon en
    // Storage apenas se generaron — ANTES del PDF, que es el paso barato que
    // puede fallar y disparar un reintento.
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/borrador_cap_01.md',
      'Nací en Rosario.',
      { contentType: 'text/markdown', upsert: true }
    );
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/borrador_cap_02.md',
      'La conocí bailando.',
      { contentType: 'text/markdown', upsert: true }
    );
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/borrador_libro.md',
      expect.stringContaining('A mis lectores'),
      { contentType: 'text/markdown', upsert: true }
    );
    const indiceBorradorCap01 = db.upload.mock.calls.findIndex(
      (llamada) => llamada[0] === 'narrador-1/paquete/borrador_cap_01.md'
    );
    const indicePdf = db.upload.mock.calls.findIndex((llamada) => llamada[0] === 'narrador-1/paquete/libro.pdf');
    expect(indiceBorradorCap01).toBeGreaterThanOrEqual(0);
    expect(indicePdf).toBeGreaterThan(indiceBorradorCap01);

    // Limpieza: entregado el pedido, los borradores ya no hacen falta y se
    // borran.
    expect(db.remove).toHaveBeenCalledTimes(1);
    expect(db.remove.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        'narrador-1/paquete/borrador_cap_01.md',
        'narrador-1/paquete/borrador_cap_02.md',
        'narrador-1/paquete/borrador_libro.md',
      ])
    );
  });

  it('si ya hay borradores cacheados de un reintento anterior, los reusa y no le vuelve a pagar al modelo', async () => {
    const db = construirDbFake({
      narrador: {
        data: { id: 'narrador-1', nombre: 'Roberto', foto_url: 'https://x/foto.jpg', contexto: { anioNacimiento: 1945 } },
        error: null,
      },
      preguntasFijas: {
        data: [
          { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia' },
          { narrador_id: null, orden: 2, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor' },
        ],
        error: null,
      },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [
          { pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: 'narrador-1/dia_01.ogg' },
          { pregunta_orden: 2, transcripcion: 'La conocí bailando.', texto_directo: null, es_repregunta: false, audio_path: 'narrador-1/dia_02.ogg' },
        ],
        error: null,
      },
      saludos: { data: [], error: null },
      descargas: {
        'narrador-1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructura)), error: null },
        'narrador-1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
        'narrador-1/paquete/borrador_cap_01.md': { data: blobFake('Cap. 1 ya pagado antes.'), error: null },
        'narrador-1/paquete/borrador_cap_02.md': { data: blobFake('Cap. 2 ya pagado antes.'), error: null },
        'narrador-1/paquete/borrador_libro.md': {
          data: blobFake('# A mis lectores\n\nYa editado antes.'),
          error: null,
        },
      },
      archivosNarrador: ['dia_01.ogg', 'dia_02.ogg'],
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    generarAudiolibroMock.mockResolvedValue({
      capitulos: ['narrador-1/paquete/audiolibro_cap_01.mp3', 'narrador-1/paquete/audiolibro_cap_02.mp3'],
      bonus: 'narrador-1/paquete/audiolibro_bonus_saludos.mp3',
      completo: 'narrador-1/paquete/audiolibro_completo.mp3',
    });

    await generarPaquete({ id: 'pedido-1', narrador_id: 'narrador-1' });

    // Ni el modelo de capítulos ni el editor se llamaron: todo salió del caché.
    expect(escribirCapituloMock).not.toHaveBeenCalled();
    expect(streamMock).not.toHaveBeenCalled();

    // El HTML se armó con el libro cacheado.
    const htmlGenerado = setContentMock.mock.calls[0][0] as string;
    expect(htmlGenerado).toContain('Ya editado antes.');

    // El pedido igual quedó entregado, y los borradores (ya usados) se
    // borraron.
    expect(db.pedidosUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'entregado' }),
      'pedido-1'
    );
    expect(db.remove).toHaveBeenCalledTimes(1);
  });

  it('ante cualquier excepción, marca el pedido "fallido" y no tira (el tick sigue)', async () => {
    // falta estructura.json → descargarJson tira antes de escribir nada.
    const db = construirDbFake({ descargas: {} });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(generarPaquete({ id: 'pedido-1', narrador_id: 'narrador-1' })).resolves.toBeUndefined();

    expect(escribirCapituloMock).not.toHaveBeenCalled();
    expect(launchMock).not.toHaveBeenCalled();
    expect(generarAudiolibroMock).not.toHaveBeenCalled();
    expect(db.pedidosUpdate).toHaveBeenCalledWith({ estado: 'fallido' }, 'pedido-1');
    // no llegó a generar nada que cachear, así que tampoco hay nada que borrar.
    expect(db.remove).not.toHaveBeenCalled();
  });

  it('si falla generarAudiolibro (después de subir el PDF), igual marca el pedido "fallido"', async () => {
    const db = construirDbFake({
      narrador: {
        data: { id: 'narrador-1', nombre: 'Roberto', foto_url: null, contexto: {} },
        error: null,
      },
      preguntasFijas: {
        data: [{ narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia' }],
        error: null,
      },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [{ pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: 'narrador-1/dia_01.ogg' }],
        error: null,
      },
      saludos: { data: [], error: null },
      descargas: {
        'narrador-1/paquete/estructura.json': {
          data: blobFake(JSON.stringify({ titulo: 'T', capitulos: [{ nombre: 'Infancia', ordenes: [1] }], entidades: [] })),
          error: null,
        },
        'narrador-1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
      },
      archivosNarrador: ['dia_01.ogg'],
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    escribirCapituloMock.mockResolvedValue('Capítulo corto.');
    finalMessageMock.mockResolvedValue({ content: [{ type: 'text', text: '# Infancia\n\nCapítulo corto.' }] });
    generarAudiolibroMock.mockRejectedValue(new Error('ffmpeg reventó'));

    await expect(generarPaquete({ id: 'pedido-1', narrador_id: 'narrador-1' })).resolves.toBeUndefined();

    expect(db.pedidosUpdate).toHaveBeenCalledWith({ estado: 'fallido' }, 'pedido-1');
    // no llegó a marcar 'entregado'.
    expect(db.pedidosUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), expect.anything());
    // el borrador del capítulo (ya pagado al modelo) quedó cacheado en
    // Storage — el próximo tick lo reusa en vez de pagar de nuevo. Como
    // nunca se llegó a entregar, tampoco se disparó la limpieza.
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/borrador_cap_01.md',
      'Capítulo corto.',
      { contentType: 'text/markdown', upsert: true }
    );
    expect(db.remove).not.toHaveBeenCalled();
  });
});
