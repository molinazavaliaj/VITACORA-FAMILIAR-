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

const { escribirConectoresMock } = vi.hoisted(() => ({ escribirConectoresMock: vi.fn() }));
vi.mock('../src/voz/conectores.js', async () => {
  const actual = await vi.importActual<typeof import('../src/voz/conectores.js')>('../src/voz/conectores.js');
  return { ...actual, escribirConectores: escribirConectoresMock };
});

const { generarEstructuraMock } = vi.hoisted(() => ({ generarEstructuraMock: vi.fn() }));
vi.mock('../src/libro/estructura.js', async () => {
  const actual = await vi.importActual<typeof import('../src/libro/estructura.js')>('../src/libro/estructura.js');
  return { ...actual, generarEstructura: generarEstructuraMock };
});

const { setContentMock, pdfMock, waitForFunctionMock, newPageMock, closeMock, launchMock } = vi.hoisted(() => {
  const setContentMock = vi.fn();
  const pdfMock = vi.fn().mockResolvedValue(Buffer.from('%PDF-fake%'));
  const waitForFunctionMock = vi.fn().mockResolvedValue(undefined);
  const newPageMock = vi
    .fn()
    .mockResolvedValue({ setContent: setContentMock, pdf: pdfMock, waitForFunction: waitForFunctionMock });
  const closeMock = vi.fn();
  const launchMock = vi.fn().mockResolvedValue({ newPage: newPageMock, close: closeMock });
  return { setContentMock, pdfMock, waitForFunctionMock, newPageMock, closeMock, launchMock };
});
vi.mock('playwright', () => ({
  chromium: { launch: launchMock },
}));

const { finalMessageMock, streamMock, createMock } = vi.hoisted(() => {
  const finalMessageMock = vi.fn();
  const streamMock = vi.fn(() => ({ finalMessage: finalMessageMock }));
  // «Su voz» le pide al modelo por `messages.create` (no por stream). Por defecto no elige ninguna
  // frase: los tests que no hablan de frases no dependen de una respuesta del modelo.
  const createMock = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '{"elegidas":[]}' }], stop_reason: 'end_turn' });
  return { finalMessageMock, streamMock, createMock };
});
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return { messages: { stream: streamMock, create: createMock } };
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

// `arrayBuffer` copia a un Uint8Array nuevo: el `.buffer` de un Buffer chico
// es el slab compartido de 8 KB, no los bytes exactos (ver fotos.test.ts).
function blobFake(contenido: string) {
  return {
    text: async () => contenido,
    arrayBuffer: async () => new Uint8Array(Buffer.from(contenido)).buffer,
  };
}

// El libro ya editado, con la página «Sus frases» y una cita textual en cada capítulo: es lo que la
// selección de «Su voz» lee (las citas son las transcripciones r1 y r2 del arnés).
const libroConFrases = () => ({
  data: blobFake(
    [
      '# La infancia',
      '',
      'Nací en Rosario.',
      '',
      '> En Rosario.',
      '',
      '# Los hijos',
      '',
      'Esa noche la conocí.',
      '',
      '> La conocí bailando.',
      '',
      '# Sus frases',
      '',
      '### Las suyas',
      '',
      '«La conocí bailando.»',
      '',
    ].join('\n')
  ),
  error: null,
});

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
  fotos?: { data: unknown; error: unknown };
  descargas?: Record<string, { data: unknown; error: unknown }>;
  archivosNarrador?: string[];
  upload?: ReturnType<typeof vi.fn>;
  pedidosUpdate?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
  /** Cola de resultados para `narraciones`: cada `from('narraciones')` consume uno. */
  narraciones?: { data: unknown; error: unknown }[];
}) {
  let fromPreguntasContador = 0;

  const pedidosUpdate = opciones.pedidosUpdate ?? vi.fn().mockResolvedValue({ data: null, error: null });
  const narracionesInsert = vi.fn();

  const from = vi.fn((tabla: string) => {
    if (tabla === 'narraciones') {
      const resultado = opciones.narraciones?.shift();
      if (!resultado) throw new Error('sin resultado en cola para narraciones');
      const builder = construirBuilder(resultado);
      builder.in = () => builder;
      builder.insert = (valores: Record<string, unknown>) => {
        narracionesInsert(valores);
        return builder;
      };
      return builder;
    }
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
    if (tabla === 'fotos') return construirBuilder(opciones.fotos ?? { data: [], error: null });
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
    // Lo que devuelve Storage cuando el objeto no está (solo eso vale como "no existe").
    return Promise.resolve(resultado ?? { data: null, error: { message: 'Object not found', statusCode: '404' } });
  });
  const upload = opciones.upload ?? vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  const list = vi.fn(() =>
    Promise.resolve({ data: (opciones.archivosNarrador ?? []).map((name) => ({ name })), error: null })
  );
  const remove = opciones.remove ?? vi.fn().mockResolvedValue({ data: null, error: null });
  const storage = { from: vi.fn(() => ({ download, upload, list, remove })) };

  return { from, storage, download, upload, list, remove, pedidosUpdate, narracionesInsert };
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
        data: {
          id: 'narrador-1',
          nombre: 'Roberto',
          foto_url: 'https://x/foto.jpg',
          contexto: { anioNacimiento: 1945 },
          edicion: null,
          familia_id: 'f1',
          libro_aprobado_at: '2026-09-13T10:00:00Z',
          ultima_respuesta_at: null,
        },
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
      completo: 'narrador-1/paquete/audiolibro_completo.mp3',
    });

    // `extras: {}` = pedido anterior al 13/09 (sin la clave `pdf`): PDF +
    // audiolibro con sus audios, como siempre.
    await generarPaquete({ id: 'pedido-1', narrador_id: 'narrador-1', extras: {} });

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
    // ... y el PDF esperó a que el paginador embebido terminara.
    expect(waitForFunctionMock).toHaveBeenCalledWith(
      'window.__libroPaginado === true',
      expect.anything()
    );
    expect(closeMock).toHaveBeenCalledTimes(1);

    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/libro.pdf',
      expect.anything(),
      { contentType: 'application/pdf', upsert: true }
    );

    // el audiolibro se armó con la estructura (cada capítulo lleva además
    // `nombreGuion`, la clave de las fotos) y los archivos disponibles del narrador.
    expect(generarAudiolibroMock).toHaveBeenCalledWith(
      'narrador-1',
      {
        ...estructura,
        capitulos: estructura.capitulos.map((c) => ({ ...c, nombreGuion: c.nombre })),
      },
      ['dia_01.ogg', 'dia_02.ogg']
    );

    // el pedido queda entregado con las rutas del libro y el audiolibro.
    expect(db.pedidosUpdate).toHaveBeenCalledWith(
      {
        estado: 'entregado',
        libro_pdf_path: 'narrador-1/paquete/libro.pdf',
        audiolibro_paths: {
          capitulos: ['narrador-1/paquete/audiolibro_cap_01.mp3', 'narrador-1/paquete/audiolibro_cap_02.mp3'],
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
      { contentType: 'text/markdown', cacheControl: '0', upsert: true }
    );
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/borrador_cap_02.md',
      'La conocí bailando.',
      { contentType: 'text/markdown', cacheControl: '0', upsert: true }
    );
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/borrador_libro.md',
      expect.stringContaining('A mis lectores'),
      { contentType: 'text/markdown', cacheControl: '0', upsert: true }
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
        'narrador-1/paquete/conectores_cap_01.json',
        'narrador-1/paquete/conectores_cap_02.json',
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
    // falta estructura.json y armarla ahí mismo también falla → tira antes
    // de escribir nada.
    const db = construirDbFake({ descargas: {} });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    generarEstructuraMock.mockRejectedValue(new Error('el narrador no tiene respuestas'));

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
      { contentType: 'text/markdown', cacheControl: '0', upsert: true }
    );
    expect(db.remove).not.toHaveBeenCalled();
  });

  it('si Storage falla (no "no existe") al leer el borrador cacheado, el pedido cae a "fallido" sin pagarle al modelo de nuevo', async () => {
    const db = construirDbFake({
      narrador: { data: { id: 'narrador-1', nombre: 'Roberto', foto_url: null, contexto: {} }, error: null },
      preguntasFijas: { data: [{ narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia' }], error: null },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [{ pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: null }],
        error: null,
      },
      descargas: {
        'narrador-1/paquete/estructura.json': {
          data: blobFake(JSON.stringify({ titulo: 'T', capitulos: [{ nombre: 'Infancia', ordenes: [1] }], entidades: [] })),
          error: null,
        },
        'narrador-1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
        // Un 500 de Storage: no dice nada de si el borrador está o no.
        'narrador-1/paquete/borrador_cap_01.md': { data: null, error: { message: 'Internal server error', statusCode: '500' } },
      },
      archivosNarrador: [],
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(generarPaquete({ id: 'pedido-1', narrador_id: 'narrador-1' })).resolves.toBeUndefined();

    expect(db.pedidosUpdate).toHaveBeenCalledWith({ estado: 'fallido' }, 'pedido-1');
    expect(escribirCapituloMock).not.toHaveBeenCalled();
  });

  // --- La edición, las fotos y libro.html -----------------------------------
  //
  // Setup base para lo que sigue, calcado del primer test pero con narrador
  // 'n1' y capítulos ['La infancia', 'El amor']. Cada test pisa solo lo que
  // le importa (edición, fotos, descargas).

  const estructuraN1 = {
    titulo: 'Rosa — La historia de una vida',
    capitulos: [
      { nombre: 'La infancia', ordenes: [1] },
      { nombre: 'El amor', ordenes: [2] },
    ],
    entidades: [],
  };

  function narradorN1(ajustes: Record<string, unknown> = {}) {
    return {
      id: 'n1',
      nombre: 'Rosa',
      foto_url: 'https://x/foto.jpg',
      contexto: { anioNacimiento: 1945 },
      edicion: null,
      familia_id: 'f1',
      libro_aprobado_at: '2026-09-13T10:00:00Z',
      ultima_respuesta_at: null,
      ...ajustes,
    };
  }

  function descargasN1(): Record<string, { data: unknown; error: unknown }> {
    return {
      'n1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructuraN1)), error: null },
      'n1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
    };
  }

  function construirDbN1(ajustes: Parameters<typeof construirDbFake>[0] = {}) {
    const db = construirDbFake({
      narrador: { data: narradorN1(), error: null },
      preguntasFijas: {
        data: [
          { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'La infancia' },
          { narrador_id: null, orden: 2, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor' },
        ],
        error: null,
      },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [
          { id: 'r1', pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: 'n1/dia_01.ogg', duracion_segundos: 120, recibido_at: '2026-09-01T10:00:00Z' },
          { id: 'r2', pregunta_orden: 2, transcripcion: 'La conocí bailando.', texto_directo: null, es_repregunta: false, audio_path: 'n1/dia_02.ogg', duracion_segundos: 95.4, recibido_at: '2026-09-02T10:00:00Z' },
        ],
        error: null,
      },
      descargas: descargasN1(),
      archivosNarrador: ['dia_01.ogg', 'dia_02.ogg'],
      ...ajustes,
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    escribirCapituloMock.mockResolvedValue('Un capítulo con su voz.');
    // Conectores de un capítulo con una sola historia (los de N1): sin puentes.
    escribirConectoresMock.mockResolvedValue({ entrada: 'Empiezo por acá.', entre: [], salida: 'Eso fue.' });
    finalMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '# A mis lectores\n\nHola.\n\n# La infancia\n\nNací en Rosario.\n\n# El amor\n\nLa conocí bailando.',
        },
      ],
    });
    generarAudiolibroMock.mockResolvedValue({
      capitulos: ['n1/paquete/audiolibro_cap_01.mp3', 'n1/paquete/audiolibro_cap_02.mp3'],
      completo: 'n1/paquete/audiolibro_completo.mp3',
    });
    return db;
  }

  it('sin nombres.json escribe igual (la dueña puede no haber revisado nombres; a los 30 días se cierra solo)', async () => {
    const descargas = descargasN1();
    delete descargas['n1/paquete/nombres.json'];
    const db = construirDbN1({ descargas });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(escribirCapituloMock).toHaveBeenCalled();
    // el último argumento de escribirCapitulo (nombresCorregidos) va vacío:
    // el mismo "(sin correcciones)" que produce un nombres.json sin
    // correcciones — el prompt necesita algo ahí.
    expect(escribirCapituloMock.mock.calls[0][4]).toBe('(sin correcciones)');
    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });

  it('aplica ordenCapitulos de la edición: escribe, pagina y graba los capítulos en ese orden', async () => {
    // estructura.json con capítulos ['La infancia', 'El amor']; la dueña
    // quiere 'El amor' primero.
    const db = construirDbN1({ narrador: { data: narradorN1({ edicion: { ordenCapitulos: ['El amor'] } }), error: null } });
    escribirCapituloMock
      .mockResolvedValueOnce('Texto de El amor')
      .mockResolvedValueOnce('Texto de La infancia');
    // El editor devuelve el borrador tal cual le llegó: así el HTML refleja
    // el orden en que se armó el libro y no un texto fijo del test.
    streamMock.mockImplementationOnce((params: { messages: { content: string }[] }) => ({
      finalMessage: () => Promise.resolve({ content: [{ type: 'text', text: params.messages[0].content }] }),
    }));

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['El amor', 'La infancia']);
    const estructuraAlAudiolibro = generarAudiolibroMock.mock.calls[0][1];
    expect(estructuraAlAudiolibro.capitulos.map((c: { nombre: string }) => c.nombre)).toEqual(['El amor', 'La infancia']);
    const html = setContentMock.mock.calls[0][0] as string;
    expect(html.indexOf('El amor')).toBeLessThan(html.indexOf('La infancia'));

    // El caché de borradores se numera por el orden FINAL (la edición está
    // congelada, así que un reintento reusa los mismos archivos), y la
    // limpieza borra esos mismos dos.
    expect(db.upload).toHaveBeenCalledWith('n1/paquete/borrador_cap_01.md', 'Texto de El amor', {
      contentType: 'text/markdown',
      cacheControl: '0',
      upsert: true,
    });
    expect(db.upload).toHaveBeenCalledWith('n1/paquete/borrador_cap_02.md', 'Texto de La infancia', {
      contentType: 'text/markdown',
      cacheControl: '0',
      upsert: true,
    });
    expect(db.remove.mock.calls[0][0]).toEqual(
      expect.arrayContaining(['n1/paquete/borrador_cap_01.md', 'n1/paquete/borrador_cap_02.md'])
    );
  });

  it('título, subtítulo y foto de tapa de la edición llegan a la plantilla; la foto de tapa sale de la tabla fotos', async () => {
    construirDbN1({
      narrador: {
        data: narradorN1({ edicion: { titulo: 'Mi abuela Rosa', subtitulo: 'Rosa Pérez', portadaFotoId: 'f9' } }),
        error: null,
      },
      fotos: {
        data: [{ id: 'f9', capitulo: 'La infancia', storage_path: 'n1/fotos/f9.jpg', principal: false, orden: 0, epigrafe: null }],
        error: null,
      },
      descargas: { ...descargasN1(), 'n1/fotos/f9.jpg': { data: blobFake('TAPA'), error: null } },
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('<div class="portada-nombre-narrador">Mi abuela Rosa</div>');
    expect(html).toContain('<div class="tag">Rosa Pérez</div>');
    expect(html).toContain(`data:image/jpeg;base64,${Buffer.from('TAPA').toString('base64')}`);
  });

  it('portadaFotoId que no existe → frontispicio con narrador.foto_url como siempre', async () => {
    construirDbN1({
      narrador: {
        data: narradorN1({ edicion: { portadaFotoId: 'no-existe' }, foto_url: 'https://x/foto.jpg' }),
        error: null,
      },
      fotos: { data: [], error: null },
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('src="https://x/foto.jpg"');
  });

  it('las fotos de un capítulo entran al HTML', async () => {
    construirDbN1({
      fotos: {
        data: [{ id: 'f1', capitulo: 'La infancia', storage_path: 'n1/fotos/f1.jpg', principal: true, orden: 0, epigrafe: 'En el patio' }],
        error: null,
      },
      descargas: { ...descargasN1(), 'n1/fotos/f1.jpg': { data: blobFake('PATIO'), error: null } },
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('<div class="foto-epigrafe">En el patio</div>');
  });

  // Hallazgo 36 de la bitácora: el wizard deja `titulosCapitulos` (nombre
  // del guion → título elegido) y la fábrica lo ignoraba. Caso real:
  // Joaquín no tiene hijos, en "Los hijos" habló de sus hermanos.
  const estructuraHijos = {
    titulo: 'Rosa — La historia de una vida',
    capitulos: [
      { nombre: 'La infancia', ordenes: [1] },
      { nombre: 'Los hijos', ordenes: [2] },
    ],
    entidades: [],
  };
  const descargasHijos = () => ({
    ...descargasN1(),
    'n1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructuraHijos)), error: null },
  });

  it('aplica titulosCapitulos de la edición: escribe, pagina y narra el capítulo con el título elegido, y las fotos (por nombre del guion) lo siguen', async () => {
    construirDbN1({
      narrador: { data: narradorN1({ edicion: { titulosCapitulos: { 'Los hijos': 'Los hermanos' } } }), error: null },
      fotos: {
        data: [{ id: 'f1', capitulo: 'Los hijos', storage_path: 'n1/fotos/f1.jpg', principal: true, orden: 0, epigrafe: 'Con Sol e Iñaki' }],
        error: null,
      },
      descargas: { ...descargasHijos(), 'n1/fotos/f1.jpg': { data: blobFake('HERMANOS'), error: null } },
    });
    // El editor devuelve el borrador tal cual: el HTML refleja los títulos
    // con los que se armó el libro.
    streamMock.mockImplementationOnce((params: { messages: { content: string }[] }) => ({
      finalMessage: () => Promise.resolve({ content: [{ type: 'text', text: params.messages[0].content }] }),
    }));

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    // El escritor encuadra la prosa desde el nombre del capítulo: tiene que
    // ver el elegido, no el del guion.
    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['La infancia', 'Los hermanos']);

    // HTML/PDF: el capítulo 2 se llama "Los hermanos"; "Los hijos" no
    // aparece en ningún lado.
    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('CAP. 02 · Los hermanos');
    expect(html).toContain('data-etiqueta="Los hermanos"');
    expect(html).not.toContain('Los hijos');
    // La foto estaba cargada bajo el nombre del guion y aun así entra en el
    // capítulo renombrado.
    expect(html).toContain('<div class="foto-epigrafe">Con Sol e Iñaki</div>');
    expect(html).toContain(`data:image/jpeg;base64,${Buffer.from('HERMANOS').toString('base64')}`);

    // El audiolibro (voz real) recibe la estructura con el título elegido:
    // su intro dice "Capítulo 2: Los hermanos".
    const estructuraAlAudiolibro = generarAudiolibroMock.mock.calls[0][1];
    expect(estructuraAlAudiolibro.capitulos.map((c: { nombre: string }) => c.nombre)).toEqual(['La infancia', 'Los hermanos']);
  });

  it('«Su voz»: el pedido se entrega con sus frases y ya no pasa por el buzón de narraciones', async () => {
    const db = construirDbN1({
      descargas: { ...descargasN1(), 'n1/paquete/borrador_libro.md': libroConFrases() },
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1', extras: extrasClonada });

    const rutas = db.upload.mock.calls.map((c) => c[0] as string);
    expect(rutas).toContain('n1/paquete/frases.json');
    expect(rutas).toContain('n1/paquete/frases_pedido.txt');
    expect(rutas).not.toContain('n1/paquete/narracion.json');
    expect(db.from).not.toHaveBeenCalledWith('narraciones');
    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
    expect(db.pedidosUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ estado: 'esperando_voz' }), expect.anything());
  });

  it('sube libro.html además de libro.pdf', async () => {
    const db = construirDbN1();

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    const rutas = db.upload.mock.calls.map((c) => c[0] as string);
    expect(rutas).toContain('n1/paquete/libro.pdf');
    expect(rutas).toContain('n1/paquete/libro.html');
    const llamadaHtml = db.upload.mock.calls.find((c) => c[0] === 'n1/paquete/libro.html')!;
    expect(llamadaHtml[1]).toBe(setContentMock.mock.calls[0][0]);
    expect(llamadaHtml[2]).toMatchObject({ contentType: 'text/html; charset=utf-8', upsert: true });
  });

  // D1 (25/09, da vuelta la decisión del 13/09): lo que la familia excluye o corrige en el tablero llega al libro.
  const SECCION_FAMILIA = 'CORRECCIONES DE LA FAMILIA (mandan sobre lo que se transcribió; aplicalas donde corresponda, sin inventar nada más): Mi hermana es Rosa, no Rosana.';
  const respuestaN1 = (id: string, orden: number, transcripcion: string, audio: string | null, extra: Record<string, unknown> = {}) => ({
    id, pregunta_orden: orden, transcripcion, texto_directo: null, es_repregunta: false, audio_path: audio, duracion_segundos: 60, recibido_at: '2026-09-01T10:00:00Z', ...extra,
  });

  it('excluidas: la respuesta no existe para el libro — ni material, ni historia completa, ni «Su voz», ni audiolibro; un capítulo que se queda sin nada se cae', async () => {
    construirDbN1({
      narrador: { data: narradorN1({ edicion: { excluidas: ['r1'] } }), error: null },
      respuestas: {
        data: [respuestaN1('r1', 1, 'En Rosario.', 'n1/dia_01.ogg'), respuestaN1('r2', 2, 'La conocí bailando.', 'n1/dia_02.ogg')],
        error: null,
      },
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    // «La infancia» solo tenía la r1: se cae; queda «El amor» sin rastro de la excluida.
    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['El amor']);
    for (const llamada of escribirCapituloMock.mock.calls) {
      expect(llamada[2]).not.toContain('En Rosario.');
      expect(llamada[3]).not.toContain('En Rosario.');
    }
    const [, estructuraAudio, archivos] = generarAudiolibroMock.mock.calls[0];
    expect(estructuraAudio.capitulos.map((c: { nombre: string }) => c.nombre)).toEqual(['El amor']);
    expect(archivos).toEqual(['dia_02.ogg']);
    expect(createMock.mock.calls.map((c) => JSON.stringify(c[0])).join(' ')).not.toContain('En Rosario.');
  });

  it('excluidas: sacar una repregunta deja el capítulo, sin ella y sin su audio', async () => {
    construirDbN1({
      narrador: { data: narradorN1({ edicion: { excluidas: ['r1b'] } }), error: null },
      respuestas: {
        data: [
          respuestaN1('r1', 1, 'En Rosario.', 'n1/dia_01.ogg'),
          respuestaN1('r1b', 1, 'Eso no lo cuento.', 'n1/dia_01_2.ogg', { es_repregunta: true }),
          respuestaN1('r2', 2, 'La conocí bailando.', 'n1/dia_02.ogg'),
        ],
        error: null,
      },
      archivosNarrador: ['dia_01.ogg', 'dia_01_2.ogg', 'dia_02.ogg'],
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['La infancia', 'El amor']);
    expect(escribirCapituloMock.mock.calls[0][2]).toBe('P: ¿Dónde naciste?\nR: En Rosario.');
    expect(escribirCapituloMock.mock.calls[0][3]).not.toContain('Eso no lo cuento.');
    expect(generarAudiolibroMock.mock.calls[0][2]).toEqual(['dia_01.ogg', 'dia_02.ogg']);
  });

  it('excluidas: destildar una pregunta en el tablero (su respuesta principal) se lleva también sus repreguntas', async () => {
    construirDbN1({
      narrador: { data: narradorN1({ edicion: { excluidas: ['r1'] } }), error: null },
      respuestas: {
        data: [
          respuestaN1('r1', 1, 'En Rosario.', 'n1/dia_01.ogg'),
          respuestaN1('r1b', 1, 'Y en Funes después.', 'n1/dia_01_2.ogg', { es_repregunta: true }),
          respuestaN1('r2', 2, 'La conocí bailando.', 'n1/dia_02.ogg'),
        ],
        error: null,
      },
      archivosNarrador: ['dia_01.ogg', 'dia_01_2.ogg', 'dia_02.ogg'],
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['El amor']);
    expect(escribirCapituloMock.mock.calls[0][3]).not.toContain('Funes');
    expect(generarAudiolibroMock.mock.calls[0][2]).toEqual(['dia_02.ogg']);
  });

  it('una respuesta reservada tampoco suena en el audiolibro (no se puede recortar su voz)', async () => {
    construirDbN1({
      respuestas: {
        data: [respuestaN1('r1', 1, 'En Rosario.', 'n1/dia_01.ogg'), respuestaN1('r2', 2, 'La conocí bailando.', 'n1/dia_02.ogg', { reservado_tramo: 'bailando' })],
        error: null,
      },
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(generarAudiolibroMock.mock.calls[0][2]).toEqual(['dia_01.ogg']);
  });

  it('correcciones: llegan al escritor de cada capítulo y al editor', async () => {
    construirDbN1({ narrador: { data: narradorN1({ edicion: { correcciones: '  Mi hermana es Rosa, no Rosana. ' } }), error: null } });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(escribirCapituloMock).toHaveBeenCalledTimes(2);
    for (const llamada of escribirCapituloMock.mock.calls) {
      expect(llamada[5]).toBe('capitulo');
      expect(llamada[6]).toBe('Mi hermana es Rosa, no Rosana.');
    }
    expect(streamMock.mock.calls[0][0].messages[0].content).toContain(SECCION_FAMILIA);
  });

  it('sin correcciones ni excluidas, todo como siempre: el editor no recibe ninguna sección nueva', async () => {
    construirDbN1();

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(escribirCapituloMock).toHaveBeenCalledTimes(2);
    for (const llamada of escribirCapituloMock.mock.calls) expect(llamada[6] ?? null).toBeNull();
    expect(streamMock.mock.calls[0][0].messages[0].content).not.toContain('CORRECCIONES DE LA FAMILIA');
    expect(generarAudiolibroMock.mock.calls[0][2]).toEqual(['dia_01.ogg', 'dia_02.ogg']);
  });

  it('si falta estructura.json pero el libro está aprobado, la genera ahí mismo en vez de fallar', async () => {
    const descargas = descargasN1();
    delete descargas['n1/paquete/estructura.json'];
    const db = construirDbN1({ descargas });
    generarEstructuraMock.mockResolvedValue({
      titulo: 'Rosa — La historia de una vida',
      capitulos: [{ nombre: 'La infancia', ordenes: [1] }],
      entidades: [],
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(generarEstructuraMock).toHaveBeenCalledWith('n1');
    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['La infancia']);
    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });

  it('si estructura.json existe pero está rota, NO la regenera: el pedido cae a "fallido"', async () => {
    const db = construirDbN1({
      descargas: { ...descargasN1(), 'n1/paquete/estructura.json': { data: blobFake('{no es json'), error: null } },
    });
    generarEstructuraMock.mockResolvedValue(estructuraN1);

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    // Regenerar sería pagarle al modelo por algo que ya se pagó y pisar el
    // archivo — el error tiene que quedar a la vista.
    expect(generarEstructuraMock).not.toHaveBeenCalled();
    expect(escribirCapituloMock).not.toHaveBeenCalled();
    expect(db.pedidosUpdate).toHaveBeenCalledWith({ estado: 'fallido' }, 'p1');
  });

  it('ya no lee la tabla saludos', async () => {
    const db = construirDbN1();

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(db.from).not.toHaveBeenCalledWith('saludos');
    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });

  // --- Voz clonada: el pedido queda en el buzón `narraciones` ----------------

  const extrasClonada = { pdf: true, audiolibro: 'clonada', impreso: null, copias: 0, marcos: 0 };

  it('«Su voz»: sin frases aprovechables deja el archivo, y no le pide nada a la PC ni al modelo', async () => {
    const db = construirDbN1();

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    const rutas = db.upload.mock.calls.map((c) => c[0] as string);
    expect(rutas).toContain('n1/paquete/frases.json');
    expect(rutas).not.toContain('n1/paquete/frases_pedido.txt');
    expect(createMock).not.toHaveBeenCalled();
    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });

  it('«Su voz»: lo que elige el modelo llega al archivo con su por qué y su respuesta de origen', async () => {
    createMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({ elegidas: [{ id: 'cita-1', capitulo: 1, por_que: 'su casa' }] }) }],
      stop_reason: 'end_turn',
    });
    const db = construirDbN1({
      descargas: { ...descargasN1(), 'n1/paquete/borrador_libro.md': libroConFrases() },
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    const json = JSON.parse(db.upload.mock.calls.find((c) => c[0] === 'n1/paquete/frases.json')![1] as string);
    const candidatas = json.capitulos.flatMap((c: { candidatas: Record<string, unknown>[] }) => c.candidatas);
    const elegida = candidatas.find((f: { elegida: boolean }) => f.elegida)!;
    expect(elegida.texto).toBe('En Rosario.');
    expect(elegida.por_que).toBe('su casa');
    expect(elegida.respuesta_id).toBe('r1');
    expect(elegida.elegida_por).toBe('modelo');
    // Y la otra queda como alternativa para que la familia pueda cambiarla.
    expect(candidatas.filter((f: { elegida: boolean }) => !f.elegida).length).toBeGreaterThan(0);
  });

  it('«Su voz»: si el modelo se cae, el libro se entrega igual con las frases pendientes', async () => {
    createMock.mockRejectedValueOnce(new Error('se cayó')).mockRejectedValueOnce(new Error('se cayó de nuevo'));
    const db = construirDbN1({
      descargas: { ...descargasN1(), 'n1/paquete/borrador_libro.md': libroConFrases() },
    });

    await expect(generarPaquete({ id: 'p1', narrador_id: 'n1' })).resolves.toBeUndefined();

    const rutas = db.upload.mock.calls.map((c) => c[0] as string);
    expect(rutas).toContain('n1/paquete/libro.pdf');
    expect(rutas).toContain('n1/paquete/frases.json');
    expect(rutas).toContain('n1/paquete/frases_pedido.txt');
    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
    expect(db.pedidosUpdate).not.toHaveBeenCalledWith({ estado: 'fallido' }, 'p1');
  });

  it('audiolibro "real" (extras nuevo): exactamente el flujo de siempre, sin tocar el buzón', async () => {
    const db = construirDbN1();

    await generarPaquete({
      id: 'p1',
      narrador_id: 'n1',
      extras: { pdf: true, audiolibro: 'real', impreso: null, copias: 0, marcos: 0 },
    });

    expect(generarAudiolibroMock).toHaveBeenCalledTimes(1);
    expect(db.from).not.toHaveBeenCalledWith('narraciones');
    expect(db.upload.mock.calls.map((c) => c[0])).not.toContain('n1/paquete/narracion.json');
    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });

  // --- La marca `tema_de_orden` (columnas nuevas, migración sin aplicar) -----

  it('sin la marca, el material de cada capítulo es el de siempre (byte por byte)', async () => {
    // Las respuestas del arnés no traen `tema_de_orden` ni `tema_motivo`: es el
    // caso de la migración sin aplicar.
    construirDbN1();

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    expect(escribirCapituloMock.mock.calls[0][2]).toBe('P: ¿Dónde naciste?\nR: En Rosario.');
    expect(escribirCapituloMock.mock.calls[1][2]).toBe('P: ¿Cómo conociste a tu pareja?\nR: La conocí bailando.');
  });

  it('la marca tema_de_orden suma el recuerdo al capítulo de su tema y aclara el número del capítulo FINAL', async () => {
    const historiaDeLa2 = 'La conocí en un baile del club, en el 62.';
    const estructuraTemas = {
      titulo: 'Rosa — La historia de una vida',
      capitulos: [
        { nombre: 'La infancia', ordenes: [1] },
        { nombre: 'El amor', ordenes: [2] },
        { nombre: 'Los nietos', ordenes: [9] },
      ],
      entidades: [],
    };
    const db = construirDbN1({
      // La dueña puso 'Los nietos' primero: en el libro, el capítulo del tema (la
      // orden 2) pasa a ser el 3. El número crudo de estructura.json sería 2 —
      // el que NO tiene que aparecer en la aclaración.
      narrador: { data: narradorN1({ edicion: { ordenCapitulos: ['Los nietos'] } }), error: null },
      preguntasFijas: {
        data: [
          { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'La infancia' },
          { narrador_id: null, orden: 2, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor' },
          { narrador_id: null, orden: 9, texto: '¿Qué le dirías a tus nietos?', capitulo: 'Los nietos' },
        ],
        error: null,
      },
      respuestas: {
        data: [
          { id: 'r1', pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: null, duracion_segundos: 120, recibido_at: '2026-09-01T10:00:00Z' },
          { id: 'r9', pregunta_orden: 9, transcripcion: historiaDeLa2, texto_directo: null, es_repregunta: false, audio_path: null, duracion_segundos: 95, recibido_at: '2026-09-02T10:00:00Z', tema_de_orden: 2, tema_motivo: 'la historia es de cómo conoció a Marta' },
        ],
        error: null,
      },
      descargas: {
        ...descargasN1(),
        'n1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructuraTemas)), error: null },
      },
      archivosNarrador: [],
    });

    await generarPaquete({ id: 'p1', narrador_id: 'n1' });

    // El libro quedó: 1) Los nietos  2) La infancia  3) El amor.
    expect(escribirCapituloMock.mock.calls.map((c) => c[1])).toEqual(['Los nietos', 'La infancia', 'El amor']);
    const materialDeLosNietos = escribirCapituloMock.mock.calls[0][2] as string;
    const materialDeLaInfancia = escribirCapituloMock.mock.calls[1][2] as string;
    const materialDelAmor = escribirCapituloMock.mock.calls[2][2] as string;

    // Donde la contó: la historia sigue ahí, con la aclaración del capítulo FINAL.
    expect(materialDeLosNietos).toContain(historiaDeLa2);
    expect(materialDeLosNietos).toContain('(recuerdo de otro tema: ya va en el capítulo 3)');
    expect(materialDeLosNietos).not.toContain('capítulo 2');

    // Y sumada al capítulo de su tema, con la pregunta de ESE tema.
    expect(materialDelAmor).toContain(
      `P: ¿Cómo conociste a tu pareja? (lo contó respondiendo otra pregunta)\nR: ${historiaDeLa2}`
    );

    // El capítulo del medio no la ve.
    expect(materialDeLaInfancia).not.toContain(historiaDeLa2);

    // La historia completa (el material de coherencia) no cambia: la respuesta
    // sigue en su propia pregunta, sin aclaraciones de ningún tipo.
    const historiaCompleta = escribirCapituloMock.mock.calls[0][3] as string;
    expect(historiaCompleta).toContain(historiaDeLa2);
    expect(historiaCompleta).not.toContain('recuerdo de otro tema');

    expect(db.pedidosUpdate).toHaveBeenCalledWith(expect.objectContaining({ estado: 'entregado' }), 'p1');
  });
});
