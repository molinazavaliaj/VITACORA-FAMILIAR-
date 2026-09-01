import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';

// --- mocks de infraestructura pesada: nada de esto debe tocarse en CI -----
// vi.mock se hoistea al tope del archivo, así que las variables que usan sus
// factories tienen que declararse con vi.hoisted para no pisar el TDZ.

const { escribirCapituloMock } = vi.hoisted(() => ({ escribirCapituloMock: vi.fn() }));
vi.mock('../src/libro/escribir-capitulo.js', () => ({
  escribirCapitulo: escribirCapituloMock,
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

// execFile con firma de callback (como el real): el mock escribe el archivo
// de salida (para que el readFile posterior encuentre algo), como haría
// ffmpeg de verdad.
const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn((_cmd: string, args: string[], callback: (err: Error | null) => void) => {
    // `fs` se resuelve recién cuando esto se ejecuta (durante el test), no
    // cuando se define acá arriba — para entonces el import ya está listo.
    const salidaPath = args[args.length - 1];
    fs.writeFileSync(salidaPath, Buffer.from('fake-mp3-data'));
    callback(null);
  }),
}));
vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}));

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return {
    ...actual,
    obtenerClienteDb: vi.fn(),
  };
});

import { obtenerClienteDb } from '../src/db.js';
import {
  generarPrevisualizacion,
  formatearNombresCorregidos,
  capituloMarkdownAHtml,
  armarMaterial,
} from '../src/libro/previsualizar.js';

// --- helpers de armado del cliente Supabase fake --------------------------

function blobFake(contenido: string): { text: () => Promise<string>; arrayBuffer: () => Promise<ArrayBuffer> } {
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
  descargas?: Record<string, { data: unknown; error: unknown }>;
  upload?: ReturnType<typeof vi.fn>;
}) {
  const from = vi.fn((tabla: string) => {
    if (tabla === 'narradores') return construirBuilder(opciones.narrador ?? { data: null, error: null });
    if (tabla === 'preguntas') {
      // primera llamada: fijas (is narrador_id null); segunda: del narrador (eq)
      const llamada = fromPreguntasContador++;
      return construirBuilder(
        llamada === 0
          ? opciones.preguntasFijas ?? { data: [], error: null }
          : opciones.preguntasNarrador ?? { data: [], error: null }
      );
    }
    if (tabla === 'respuestas') return construirBuilder(opciones.respuestas ?? { data: [], error: null });
    throw new Error(`tabla no mockeada: ${tabla}`);
  });
  let fromPreguntasContador = 0;

  const download = vi.fn((ruta: string) => {
    const resultado = opciones.descargas?.[ruta];
    return Promise.resolve(resultado ?? { data: null, error: { message: 'no existe' } });
  });
  const upload = opciones.upload ?? vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  const storage = { from: vi.fn(() => ({ download, upload })) };

  return { from, storage, download, upload };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- helpers puros ---------------------------------------------------------

describe('formatearNombresCorregidos', () => {
  it('formatea "original → corregido" por línea', () => {
    const resultado = formatearNombresCorregidos([
      { original: 'Rosorio', corregido: 'Rosario' },
      { original: 'Martiniano', corregido: 'Martín' },
    ]);
    expect(resultado).toBe('Rosorio → Rosario\nMartiniano → Martín');
  });

  it('devuelve "(sin correcciones)" si la lista está vacía', () => {
    expect(formatearNombresCorregidos([])).toBe('(sin correcciones)');
  });
});

describe('capituloMarkdownAHtml', () => {
  it('convierte párrafos separados por línea en blanco a <p>', () => {
    const html = capituloMarkdownAHtml('Primer párrafo.\n\nSegundo párrafo.');
    expect(html).toBe('<p>Primer párrafo.</p>\n<p>Segundo párrafo.</p>');
  });

  it('convierte líneas "> cita" a <blockquote>', () => {
    const html = capituloMarkdownAHtml('Un párrafo normal.\n\n> Una frase potente.\n\nOtro párrafo.');
    expect(html).toBe(
      '<p>Un párrafo normal.</p>\n<blockquote>Una frase potente.</blockquote>\n<p>Otro párrafo.</p>'
    );
  });

  it('escapa HTML para no romper el documento', () => {
    const html = capituloMarkdownAHtml('El & la <cosa>.');
    expect(html).toBe('<p>El &amp; la &lt;cosa&gt;.</p>');
  });
});

describe('armarMaterial', () => {
  it('arma bloques P/R en el orden dado, usando transcripcion o texto_directo', () => {
    const preguntas = new Map([
      [1, { texto: '¿Dónde naciste?' }],
      [2, { texto: '¿Cómo era tu casa?' }],
    ]);
    const respuestas = new Map([
      [1, [{ transcripcion: 'En Rosario.', texto_directo: null }]],
      [2, [{ transcripcion: null, texto_directo: 'Chiquita, de barrio.' }]],
    ]);

    const resultado = armarMaterial([1, 2], preguntas, respuestas);

    expect(resultado).toBe(
      'P: ¿Dónde naciste?\nR: En Rosario.\n\nP: ¿Cómo era tu casa?\nR: Chiquita, de barrio.'
    );
  });

  it('omite respuestas sin transcripción ni texto', () => {
    const preguntas = new Map([[1, { texto: '¿Dónde naciste?' }]]);
    const respuestas = new Map([[1, [{ transcripcion: '  ', texto_directo: null }]]]);

    expect(armarMaterial([1], preguntas, respuestas)).toBe('');
  });
});

// --- generarPrevisualizacion ------------------------------------------------

describe('generarPrevisualizacion', () => {
  it('tira si falta estructura.json', async () => {
    const db = construirDbFake({ descargas: {} });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(generarPrevisualizacion('narrador-1')).rejects.toThrow(/estructura\.json/);
    expect(launchMock).not.toHaveBeenCalled();
    expect(escribirCapituloMock).not.toHaveBeenCalled();
  });

  it('tira si estructura.json existe pero falta nombres.json', async () => {
    const db = construirDbFake({
      descargas: {
        'narrador-1/paquete/estructura.json': {
          data: blobFake(JSON.stringify({ titulo: 'T', capitulos: [], entidades: [] })),
          error: null,
        },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(generarPrevisualizacion('narrador-1')).rejects.toThrow(/nombres\.json/);
    expect(launchMock).not.toHaveBeenCalled();
  });

  it('con estructura y nombres, escribe el capítulo 1, sube preview.pdf y muestra_audiolibro.mp3', async () => {
    const estructura = {
      titulo: 'Roberto — La historia de una vida',
      capitulos: [
        { nombre: 'Infancia', ordenes: [1] },
        { nombre: 'El amor', ordenes: [2] },
      ],
      entidades: [],
    };
    const nombres = { correcciones: [{ original: 'Rosorio', corregido: 'Rosario' }] };

    const db = construirDbFake({
      narrador: { data: { id: 'narrador-1', nombre: 'Roberto', foto_url: 'https://x/foto.jpg' }, error: null },
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
          { pregunta_orden: 1, transcripcion: 'En Rosorio.', texto_directo: null, es_repregunta: false, audio_path: 'narrador-1/dia_01.ogg' },
          { pregunta_orden: 2, transcripcion: 'La conocí bailando.', texto_directo: null, es_repregunta: false, audio_path: null },
        ],
        error: null,
      },
      descargas: {
        'narrador-1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructura)), error: null },
        'narrador-1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
        'narrador-1/dia_01.ogg': { data: blobFake('audio-crudo'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    escribirCapituloMock.mockResolvedValue('Nací en Rosario, en la casa de mi abuela.');

    await generarPrevisualizacion('narrador-1');

    // escribió SOLO el capítulo 1, con narrador + material del capítulo +
    // historia completa (todos los órdenes) + nombres corregidos.
    expect(escribirCapituloMock).toHaveBeenCalledTimes(1);
    const [narradorArg, capituloArg, materialesArg, historiaArg, nombresArg] = escribirCapituloMock.mock.calls[0];
    expect(narradorArg).toMatchObject({ nombre: 'Roberto' });
    expect(capituloArg).toBe('Infancia');
    expect(materialesArg).toContain('En Rosorio.');
    expect(materialesArg).not.toContain('La conocí bailando.');
    expect(historiaArg).toContain('En Rosorio.');
    expect(historiaArg).toContain('La conocí bailando.');
    expect(nombresArg).toBe('Rosorio → Rosario');

    // PDF: playwright arma el html y sube a paquete/preview.pdf
    expect(launchMock).toHaveBeenCalledTimes(1);
    expect(setContentMock).toHaveBeenCalledTimes(1);
    const htmlGenerado = setContentMock.mock.calls[0][0] as string;
    expect(htmlGenerado).toContain('Roberto — La historia de una vida');
    expect(htmlGenerado).toContain('Nací en Rosario, en la casa de mi abuela.');
    expect(htmlGenerado).toContain('Infancia');
    expect(htmlGenerado).toContain('El amor');
    expect(htmlGenerado).toContain('https://x/foto.jpg');
    expect(closeMock).toHaveBeenCalledTimes(1);

    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/preview.pdf',
      expect.anything(),
      { contentType: 'application/pdf', upsert: true }
    );

    // Audio: corta el primer audio (el de menor orden con audio_path) a 60s.
    expect(execFileMock).toHaveBeenCalledTimes(1);
    const argsFfmpeg = execFileMock.mock.calls[0][1] as string[];
    expect(argsFfmpeg).toEqual(
      expect.arrayContaining(['-y', '-i', expect.stringContaining('entrada.ogg'), '-t', '60', '-acodec', 'libmp3lame'])
    );

    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/muestra_audiolibro.mp3',
      expect.anything(),
      { contentType: 'audio/mpeg', upsert: true }
    );

    // Orden: la muestra de audio sube ANTES que el PDF. preview.pdf es el
    // archivo que tick() usa como gate para no reintentar — si se subiera
    // primero y el audio fallara después, el narrador quedaría sin muestra
    // para siempre porque el gate ya estaría cumplido.
    const rutasSubidasEnOrden = db.upload.mock.calls.map((llamada) => llamada[0]);
    expect(rutasSubidasEnOrden).toEqual([
      'narrador-1/paquete/muestra_audiolibro.mp3',
      'narrador-1/paquete/preview.pdf',
    ]);
  });

  it('si falla el corte de audio (ffmpeg), no sube preview.pdf — queda reintentable', async () => {
    const estructura = { titulo: 'T', capitulos: [{ nombre: 'Infancia', ordenes: [1] }], entidades: [] };
    const nombres = { correcciones: [] };

    const db = construirDbFake({
      narrador: { data: { id: 'narrador-1', nombre: 'Roberto', foto_url: null }, error: null },
      preguntasFijas: {
        data: [{ narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia' }],
        error: null,
      },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [
          { pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: 'narrador-1/dia_01.ogg' },
        ],
        error: null,
      },
      descargas: {
        'narrador-1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructura)), error: null },
        'narrador-1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
        'narrador-1/dia_01.ogg': { data: blobFake('audio-crudo'), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    escribirCapituloMock.mockResolvedValue('Capítulo corto.');
    // ffmpeg ausente del PATH, por ejemplo: el mock devuelve error por callback.
    execFileMock.mockImplementationOnce(
      (_cmd: string, _args: string[], callback: (err: Error | null) => void) => {
        callback(new Error('spawn ffmpeg ENOENT'));
      }
    );

    await expect(generarPrevisualizacion('narrador-1')).rejects.toThrow(/ffmpeg/);

    // El PDF nunca se generó ni se subió — la próxima corrida de tick()
    // puede reintentar todo desde cero.
    expect(launchMock).not.toHaveBeenCalled();
    expect(db.upload).not.toHaveBeenCalled();
  });

  it('si ninguna respuesta tiene audio, omite la muestra sin tirar', async () => {
    const estructura = { titulo: 'T', capitulos: [{ nombre: 'Infancia', ordenes: [1] }], entidades: [] };
    const nombres = { correcciones: [] };

    const db = construirDbFake({
      narrador: { data: { id: 'narrador-1', nombre: 'Roberto', foto_url: null }, error: null },
      preguntasFijas: {
        data: [{ narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia' }],
        error: null,
      },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [{ pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, es_repregunta: false, audio_path: null }],
        error: null,
      },
      descargas: {
        'narrador-1/paquete/estructura.json': { data: blobFake(JSON.stringify(estructura)), error: null },
        'narrador-1/paquete/nombres.json': { data: blobFake(JSON.stringify(nombres)), error: null },
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    escribirCapituloMock.mockResolvedValue('Capítulo corto.');

    await expect(generarPrevisualizacion('narrador-1')).resolves.toBeUndefined();

    expect(execFileMock).not.toHaveBeenCalled();
    expect(db.upload).not.toHaveBeenCalledWith(
      'narrador-1/paquete/muestra_audiolibro.mp3',
      expect.anything(),
      expect.anything()
    );
    // el PDF sí se sube.
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/preview.pdf',
      expect.anything(),
      { contentType: 'application/pdf', upsert: true }
    );
  });
});
