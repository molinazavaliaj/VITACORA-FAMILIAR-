import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';

// Mismos mocks de infraestructura pesada que previsualizar.test.ts: ni
// Chromium ni ffmpeg ni el modelo se tocan en CI.

const { escribirParrafoMock } = vi.hoisted(() => ({ escribirParrafoMock: vi.fn() }));
vi.mock('../src/libro/parrafo-anticipo.js', () => ({
  escribirParrafoAnticipo: escribirParrafoMock,
}));

const { setContentMock, pdfMock, newPageMock, closeMock, launchMock } = vi.hoisted(() => {
  const setContentMock = vi.fn();
  const pdfMock = vi.fn().mockResolvedValue(Buffer.from('%PDF-fake%'));
  const newPageMock = vi.fn().mockResolvedValue({ setContent: setContentMock, pdf: pdfMock });
  const closeMock = vi.fn();
  const launchMock = vi.fn().mockResolvedValue({ newPage: newPageMock, close: closeMock });
  return { setContentMock, pdfMock, newPageMock, closeMock, launchMock };
});
vi.mock('playwright', () => ({ chromium: { launch: launchMock } }));

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn((_cmd: string, args: string[], callback: (err: Error | null) => void) => {
    const salidaPath = args[args.length - 1];
    fs.writeFileSync(salidaPath, Buffer.from('fake-mp3-data'));
    callback(null);
  }),
}));
vi.mock('node:child_process', () => ({ execFile: execFileMock }));

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return { ...actual, obtenerClienteDb: vi.fn() };
});

import { obtenerClienteDb } from '../src/db.js';
import { generarAnticipo, indiceTentativo } from '../src/libro/anticipo.js';

// --- helpers de armado del cliente Supabase fake --------------------------

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

const PREGUNTAS_FIJAS = [
  { narrador_id: null, orden: 1, texto: 'Donde nacio?', capitulo: 'Los primeros anios', tipo: 'fija' },
  { narrador_id: null, orden: 2, texto: 'Como era su casa?', capitulo: 'Los primeros anios', tipo: 'fija' },
  { narrador_id: null, orden: 3, texto: 'A que jugaba?', capitulo: 'La infancia', tipo: 'fija' },
  { narrador_id: null, orden: 4, texto: 'Y el trabajo?', capitulo: 'El oficio', tipo: 'fija' },
];

const RESPUESTAS_TRES = [
  { narrador_id: 'n1', pregunta_orden: 1, transcripcion: 'En Rosario.', texto_directo: null, audio_path: 'n1/audios/1.ogg' },
  { narrador_id: 'n1', pregunta_orden: 2, transcripcion: 'Chiquita, de barrio.', texto_directo: null, audio_path: 'n1/audios/2.ogg' },
  { narrador_id: 'n1', pregunta_orden: 3, transcripcion: 'A la pelota, todo el dia.', texto_directo: null, audio_path: null },
];

function construirDbFake(opciones: {
  narrador?: { data: unknown; error: unknown };
  preguntasFijas?: { data: unknown; error: unknown };
  respuestas?: { data: unknown; error: unknown };
  descargas?: Record<string, { data: unknown; error: unknown }>;
  upload?: ReturnType<typeof vi.fn>;
}) {
  const from = vi.fn((tabla: string) => {
    if (tabla === 'narradores')
      return construirBuilder(
        opciones.narrador ?? { data: { id: 'n1', nombre: 'Osvaldo Benitez', foto_url: null }, error: null }
      );
    if (tabla === 'preguntas')
      return construirBuilder(opciones.preguntasFijas ?? { data: PREGUNTAS_FIJAS, error: null });
    if (tabla === 'respuestas')
      return construirBuilder(opciones.respuestas ?? { data: RESPUESTAS_TRES, error: null });
    throw new Error(`tabla no mockeada: ${tabla}`);
  });

  const download = vi.fn((ruta: string) => {
    const resultado = opciones.descargas?.[ruta] ?? { data: blobFake('audio-crudo'), error: null };
    return Promise.resolve(resultado);
  });
  const upload = opciones.upload ?? vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  const storage = { from: vi.fn(() => ({ download, upload })) };

  return { from, storage, download, upload };
}

beforeEach(() => {
  vi.clearAllMocks();
  escribirParrafoMock.mockResolvedValue('Naci en Rosario, en una casa chiquita de barrio.');
});

// --- helper puro -----------------------------------------------------------

describe('indiceTentativo', () => {
  it('lista los capitulos sin repetir, en el orden de las preguntas', () => {
    expect(indiceTentativo(PREGUNTAS_FIJAS)).toEqual(['Los primeros anios', 'La infancia', 'El oficio']);
  });

  it('ignora las preguntas del narrador: el indice es el del libro, no el de su rama', () => {
    const conAdaptativa = [
      ...PREGUNTAS_FIJAS,
      { narrador_id: 'n1', orden: 27, texto: 'Y aquello?', capitulo: 'Lo que faltaba', tipo: 'adaptativa' },
    ];
    expect(indiceTentativo(conAdaptativa)).toEqual(['Los primeros anios', 'La infancia', 'El oficio']);
  });
});

// --- generarAnticipo -------------------------------------------------------

describe('generarAnticipo', () => {
  it('escribe el parrafo, arma el PDF y sube los dos archivos', async () => {
    const db = construirDbFake({});
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await generarAnticipo('n1');

    expect(escribirParrafoMock).toHaveBeenCalledOnce();
    const rutasSubidas = db.upload.mock.calls.map((c) => c[0]);
    expect(rutasSubidas).toContain('n1/paquete/anticipo_muestra.mp3');
    expect(rutasSubidas).toContain('n1/paquete/anticipo.pdf');
  });

  it('sube el audio ANTES que el PDF: el PDF es el candado y tiene que ir ultimo', async () => {
    const db = construirDbFake({});
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await generarAnticipo('n1');

    const rutas = db.upload.mock.calls.map((c) => c[0]);
    expect(rutas.indexOf('n1/paquete/anticipo_muestra.mp3')).toBeLessThan(
      rutas.indexOf('n1/paquete/anticipo.pdf')
    );
  });

  it('el PDF lleva el nombre del narrador y el indice del libro', async () => {
    const db = construirDbFake({});
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await generarAnticipo('n1');

    const html = setContentMock.mock.calls[0][0] as string;
    expect(html).toContain('Osvaldo Benitez');
    expect(html).toContain('Los primeros anios');
    expect(html).toContain('El oficio');
    expect(html).toContain('Naci en Rosario');
  });

  it('no le paga al modelo si todavia no hay material', async () => {
    const db = construirDbFake({ respuestas: { data: [], error: null } });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(generarAnticipo('n1')).rejects.toThrow(/material/i);
    expect(escribirParrafoMock).not.toHaveBeenCalled();
    expect(launchMock).not.toHaveBeenCalled();
  });

  it('sigue adelante sin muestra si ninguna respuesta tiene audio (narrador que escribe)', async () => {
    const soloTexto = RESPUESTAS_TRES.map((r) => ({ ...r, audio_path: null }));
    const db = construirDbFake({ respuestas: { data: soloTexto, error: null } });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await generarAnticipo('n1');

    const rutas = db.upload.mock.calls.map((c) => c[0]);
    expect(rutas).toContain('n1/paquete/anticipo.pdf');
    expect(rutas).not.toContain('n1/paquete/anticipo_muestra.mp3');
  });
});
