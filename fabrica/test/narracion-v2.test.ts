import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

// --- mocks de infraestructura pesada ---------------------------------------
//
// Mismo patrón que generar-paquete.test.ts: los conectores y el cliente de
// Anthropic mockeados, `obtenerClienteDb` mockeado y una base/Storage fake con
// la forma que usa el script. Nada de red, nada contra la base de nadie.

const { escribirConectoresMock } = vi.hoisted(() => ({ escribirConectoresMock: vi.fn() }));
vi.mock('../src/voz/conectores.js', async () => {
  const actual = await vi.importActual<typeof import('../src/voz/conectores.js')>('../src/voz/conectores.js');
  return { ...actual, escribirConectores: escribirConectoresMock };
});

const { finalMessageMock, streamMock } = vi.hoisted(() => {
  const finalMessageMock = vi.fn();
  const streamMock = vi.fn(() => ({ finalMessage: finalMessageMock }));
  return { finalMessageMock, streamMock };
});
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return { messages: { stream: streamMock } };
  }),
}));

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return { ...actual, obtenerClienteDb: vi.fn() };
});

import { obtenerClienteDb } from '../src/db.js';
import { correrNarracionV2, parsearArgs } from '../scripts/narracion-v2.js';

// `text` es lo único que usa `descargarTextoOpcional`.
function blobFake(contenido: string) {
  return { text: async () => contenido };
}

type Resultado = { data: unknown; error: unknown };

function construirBuilder(resultado: Resultado) {
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
  narrador?: Resultado;
  pedido?: Resultado;
  preguntasFijas?: Resultado;
  preguntasNarrador?: Resultado;
  respuestas?: Resultado;
  descargas?: Record<string, Resultado>;
  /** Cola para `narraciones`: cada `from('narraciones')` consume un resultado. */
  narraciones?: Resultado[];
  upload?: ReturnType<typeof vi.fn>;
  pedidosUpdate?: ReturnType<typeof vi.fn>;
} = {}) {
  let fromPreguntasContador = 0;

  const pedidosUpdate = opciones.pedidosUpdate ?? vi.fn().mockResolvedValue({ data: null, error: null });
  const narracionesInsert = vi.fn();
  const narracionesUpdate = vi.fn();

  const from = vi.fn((tabla: string) => {
    if (tabla === 'narraciones') {
      // Sin cola: el pedido no tiene narraciones (el script las lee siempre
      // primero, antes de pagar conectores). Con cola, cada llamada consume una.
      const resultado = opciones.narraciones?.shift() ?? { data: [], error: null };
      const builder = construirBuilder(resultado);
      builder.in = () => builder;
      builder.insert = (valores: Record<string, unknown>) => {
        narracionesInsert(valores);
        return builder;
      };
      builder.update = (valores: Record<string, unknown>) => {
        narracionesUpdate(valores);
        return builder;
      };
      return builder;
    }
    if (tabla === 'narradores') return construirBuilder(opciones.narrador ?? { data: null, error: { message: 'no está' } });
    if (tabla === 'preguntas') {
      const llamada = fromPreguntasContador++;
      return construirBuilder(
        llamada === 0
          ? opciones.preguntasFijas ?? { data: [], error: null }
          : opciones.preguntasNarrador ?? { data: [], error: null }
      );
    }
    if (tabla === 'respuestas') return construirBuilder(opciones.respuestas ?? { data: [], error: null });
    if (tabla === 'pedidos') {
      const builder = construirBuilder(opciones.pedido ?? { data: null, error: { message: 'no está' } });
      builder.update = (valores: Record<string, unknown>) => ({
        eq: (_columna: string, id: string) => pedidosUpdate(valores, id),
      });
      return builder;
    }
    throw new Error(`tabla no mockeada: ${tabla}`);
  });

  const download = vi.fn((ruta: string) => {
    const resultado = opciones.descargas?.[ruta];
    // Lo que devuelve Storage cuando el objeto no está (solo eso vale como "no existe").
    return Promise.resolve(resultado ?? { data: null, error: { message: 'Object not found', statusCode: '404' } });
  });
  const upload = opciones.upload ?? vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  const remove = vi.fn().mockResolvedValue({ data: null, error: null });
  const storage = { from: vi.fn(() => ({ download, upload, list: vi.fn(), remove })) };

  return { from, storage, download, upload, remove, pedidosUpdate, narracionesInsert, narracionesUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = 'https://x.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-service-role';
  process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
  process.env.OPENAI_API_KEY = 'clave-openai';
});

// --- El libro de Joaquín, en chico -----------------------------------------

const ESTRUCTURA = {
  titulo: 'Joaquín — La historia de una vida',
  capitulos: [
    { nombre: 'La infancia', ordenes: [1] },
    { nombre: 'Los hijos', ordenes: [3] },
    { nombre: 'El trabajo', ordenes: [2] },
  ],
  entidades: [],
};

// El v1 que la fábrica dejó el 18/09: los capítulos en el orden final de
// entonces, con el texto YA en plano (una línea en blanco entre párrafos).
const NARRACION_V1 = {
  narrador_id: 'j1',
  pedido_id: 'p1',
  titulo: 'Mi viejo',
  capitulos: [
    { numero: 1, nombre: 'El trabajo', texto: 'Trabajé en el ferrocarril.\n\nTreinta años.' },
    { numero: 2, nombre: 'La infancia', texto: 'Nací en Rosario.' },
    { numero: 3, nombre: 'Los hermanos', texto: 'Mis hermanos me criaron.' },
  ],
};

const EDICION = {
  titulo: 'Mi viejo',
  subtitulo: null,
  ordenCapitulos: ['El trabajo', 'La infancia', 'Los hijos'],
  titulosCapitulos: { 'Los hijos': 'Los hermanos' },
  portadaFotoId: null,
};

const RESPUESTAS = [
  { id: 'r2', pregunta_orden: 2, transcripcion: 'Trabajé en el ferrocarril.', texto_directo: null, es_repregunta: false, audio_path: 'j1/dia_02.ogg', duracion_segundos: 210.6, recibido_at: '2026-09-02T10:00:00Z' },
  { id: 'r1', pregunta_orden: 1, transcripcion: 'Nací en Rosario.', texto_directo: null, es_repregunta: false, audio_path: 'j1/dia_01.ogg', duracion_segundos: 120, recibido_at: '2026-09-01T10:00:00Z' },
  { id: 'r1b', pregunta_orden: 1, transcripcion: 'Y mi vieja cosía para afuera.', texto_directo: null, es_repregunta: true, audio_path: 'j1/dia_01_2.ogg', duracion_segundos: 40, recibido_at: '2026-09-01T11:00:00Z' },
  { id: 'r3', pregunta_orden: 3, transcripcion: null, texto_directo: 'Mis hermanos me criaron.', es_repregunta: false, audio_path: null, duracion_segundos: null, recibido_at: '2026-09-03T10:00:00Z' },
];

const PREGUNTAS_FIJAS = {
  data: [
    { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'La infancia' },
    { narrador_id: null, orden: 2, texto: '¿De qué trabajaste?', capitulo: 'El trabajo' },
  ],
  error: null,
};

// Conectores como los devuelve el modelo: el capítulo 2 tiene dos historias
// (respuesta + repregunta), así que lleva UN puente (contrato: historias − 1).
const CONECTORES_CAP_1 = { entrada: 'Arranco por el trabajo.', entre: [], salida: 'Eso fue.' };
const CONECTORES_CAP_2 = { entrada: 'Del principio.', entre: ['Y en esa casa estaba mi vieja.'], salida: 'Así fue.' };

/** Los dos capítulos con audio piden conectores: el modelo devuelve uno por capítulo. */
function conectoresDelModelo(): void {
  escribirConectoresMock.mockResolvedValueOnce(CONECTORES_CAP_1).mockResolvedValueOnce(CONECTORES_CAP_2);
}

const PREGUNTAS_NARRADOR = {
  data: [{ narrador_id: 'j1', orden: 3, texto: '¿Quiénes fueron tus hermanos?', capitulo: 'Los hijos' }],
  error: null,
};

// `descargas` con el v1 y la estructura: el mínimo para armar el v2.
function descargasBase(ajustes: Record<string, Resultado> = {}): Record<string, Resultado> {
  return {
    'j1/paquete/narracion.json': { data: blobFake(JSON.stringify(NARRACION_V1)), error: null },
    'j1/paquete/estructura.json': { data: blobFake(JSON.stringify(ESTRUCTURA)), error: null },
    ...ajustes,
  };
}

function narradorJ1(ajustes: Record<string, unknown> = {}) {
  return {
    data: { id: 'j1', nombre: 'Joaquín', foto_url: null, contexto: {}, edicion: EDICION, ...ajustes },
    error: null,
  };
}

function pedidoP1(ajustes: Record<string, unknown> = {}) {
  return { data: { id: 'p1', narrador_id: 'j1', estado: 'entregado', extras: {}, ...ajustes }, error: null };
}

function construirDb(ajustes: Parameters<typeof construirDbFake>[0] = {}) {
  const db = construirDbFake({
    narrador: narradorJ1(),
    pedido: pedidoP1(),
    preguntasFijas: PREGUNTAS_FIJAS,
    preguntasNarrador: PREGUNTAS_NARRADOR,
    respuestas: { data: RESPUESTAS, error: null },
    descargas: descargasBase(),
    ...ajustes,
  });
  (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
  return db;
}

/** El contenido con el que se subió una ruta (tira si no se subió). */
function subido(db: ReturnType<typeof construirDb>, ruta: string): unknown {
  const llamada = db.upload.mock.calls.find((c) => c[0] === ruta);
  expect(llamada, `no se subió ${ruta}`).toBeDefined();
  return llamada![1];
}

describe('scripts/narracion-v2 — correrNarracionV2', () => {
  it('convierte el narracion.json v1 en v2: historias con audio, conectores cacheados, capítulo sin audio clonado, narración pendiente y el pedido esperando_voz', async () => {
    const db = construirDb({
      narraciones: [
        // La narración de la entrega anterior (el audiolibro todo-clonado del 19/09).
        { data: [{ id: 'narr-vieja', estado: 'lista' }], error: null },
        { data: [{ id: 'narr-vieja' }], error: null }, // el update a reemplazada
        { data: null, error: null }, // el insert de la nueva pendiente
      ],
    });
    conectoresDelModelo();

    const resultado = await correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false });

    // El JSON v2: orden y títulos de la edición, textos del v1 tal cual, y
    // cada capítulo en su modo.
    expect(JSON.parse(subido(db, 'j1/paquete/narracion.json') as string)).toEqual({
      version: 2,
      narrador_id: 'j1',
      pedido_id: 'p1',
      titulo: 'Mi viejo',
      capitulos: [
        {
          numero: 1,
          nombre: 'El trabajo',
          texto: 'Trabajé en el ferrocarril.\n\nTreinta años.',
          modo: 'hibrido',
          historias: [
            {
              respuesta_id: 'r2',
              pregunta_orden: 2,
              es_repregunta: false,
              audio_path: 'j1/dia_02.ogg',
              segundos: 211,
              pregunta: '¿De qué trabajaste?',
              texto: 'Trabajé en el ferrocarril.',
            },
          ],
          conectores: CONECTORES_CAP_1,
        },
        {
          numero: 2,
          nombre: 'La infancia',
          texto: 'Nací en Rosario.',
          modo: 'hibrido',
          historias: [
            { respuesta_id: 'r1', pregunta_orden: 1, es_repregunta: false, audio_path: 'j1/dia_01.ogg', segundos: 120, pregunta: '¿Dónde naciste?', texto: 'Nací en Rosario.' },
            { respuesta_id: 'r1b', pregunta_orden: 1, es_repregunta: true, audio_path: 'j1/dia_01_2.ogg', segundos: 40, pregunta: '¿Dónde naciste?', texto: 'Y mi vieja cosía para afuera.' },
          ],
          conectores: CONECTORES_CAP_2,
        },
        { numero: 3, nombre: 'Los hermanos', texto: 'Mis hermanos me criaron.', modo: 'clonado' },
      ],
    });
    expect(db.upload).toHaveBeenCalledWith('j1/paquete/narracion.json', expect.any(String), {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });

    // Los conectores se piden SOLO para los capítulos con audio, y el
    // capítulo clonado no dispara ninguna llamada al modelo.
    expect(escribirConectoresMock).toHaveBeenCalledTimes(2);
    expect(escribirConectoresMock.mock.calls[0][1]).toEqual({
      nombre: 'Joaquín',
      capitulo: 'El trabajo',
      textoCapitulo: 'Trabajé en el ferrocarril.\n\nTreinta años.',
      historias: [{ pregunta: '¿De qué trabajaste?', texto: 'Trabajé en el ferrocarril.' }],
    });
    expect(escribirConectoresMock.mock.calls[1][1]).toEqual({
      nombre: 'Joaquín',
      capitulo: 'La infancia',
      textoCapitulo: 'Nací en Rosario.',
      historias: [
        { pregunta: '¿Dónde naciste?', texto: 'Nací en Rosario.' },
        { pregunta: '¿Dónde naciste?', texto: 'Y mi vieja cosía para afuera.' },
      ],
    });

    // Los conectores quedan cacheados (numerados por el orden FINAL, como los
    // borradores) ANTES de narracion.json: un reintento no le vuelve a pagar
    // al modelo.
    const rutas = db.upload.mock.calls.map((c) => c[0] as string);
    expect(subido(db, 'j1/paquete/conectores_cap_01.json')).toBe(JSON.stringify(CONECTORES_CAP_1, null, 2));
    expect(subido(db, 'j1/paquete/conectores_cap_02.json')).toBe(JSON.stringify(CONECTORES_CAP_2, null, 2));
    expect(rutas).not.toContain('j1/paquete/conectores_cap_03.json');
    expect(rutas.indexOf('j1/paquete/conectores_cap_02.json')).toBeLessThan(rutas.indexOf('j1/paquete/narracion.json'));

    // El buzón: la vieja queda reemplazada (diciendo por cuál), la nueva va
    // pendiente, y el pedido vuelve a esperando_voz recién al final.
    expect(db.narracionesUpdate).toHaveBeenCalledTimes(1);
    const update = db.narracionesUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(db.narracionesInsert).toHaveBeenCalledTimes(1);
    const insertada = db.narracionesInsert.mock.calls[0][0] as { id: string };
    expect(insertada).toMatchObject({ narrador_id: 'j1', pedido_id: 'p1', estado: 'pendiente' });
    expect(update.estado).toBe('reemplazada');
    expect(update.error).toBe(`reemplazada por ${insertada.id}`);
    expect(db.pedidosUpdate).toHaveBeenCalledTimes(1);
    expect(db.pedidosUpdate).toHaveBeenCalledWith({ estado: 'esperando_voz' }, 'p1');
    expect(resultado.narracionId).toBe(insertada.id);
    expect(resultado.rutaSalida).toBeNull();

    // Orden: primero se saca de circulación la vieja, después se encola la nueva
    // y el pedido se toca último — con una lista vieja y el pedido en
    // esperando_voz, la fábrica ensamblaría esa voz como si fuera la nueva.
    const [ordenUpdate] = db.narracionesUpdate.mock.invocationCallOrder;
    const [ordenInsert] = db.narracionesInsert.mock.invocationCallOrder;
    const [ordenPedido] = db.pedidosUpdate.mock.invocationCallOrder;
    expect(ordenUpdate).toBeLessThan(ordenInsert);
    expect(ordenInsert).toBeLessThan(ordenPedido);
  });

  it('reusa el caché de conectores si está y no le vuelve a pagar al modelo', async () => {
    const cacheados = {
      1: { entrada: 'Cacheado uno.', entre: [], salida: 'Fin uno.' },
      2: { entrada: 'Cacheado dos.', entre: ['Puente cacheado.'], salida: 'Fin dos.' },
    };
    const db = construirDb({
      descargas: descargasBase({
        'j1/paquete/conectores_cap_01.json': { data: blobFake(JSON.stringify(cacheados[1])), error: null },
        'j1/paquete/conectores_cap_02.json': { data: blobFake(JSON.stringify(cacheados[2])), error: null },
      }),
      narraciones: [
        { data: [], error: null },
        { data: { id: 'narr-1' }, error: null },
        { data: { id: 'narr-1', estado: 'pendiente' }, error: null },
      ],
    });

    await correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false });

    expect(escribirConectoresMock).not.toHaveBeenCalled();
    const json = JSON.parse(subido(db, 'j1/paquete/narracion.json') as string);
    expect(json.capitulos.map((c: { conectores?: unknown }) => c.conectores)).toEqual([cacheados[1], cacheados[2], undefined]);
    // Lo que ya estaba cacheado no se vuelve a escribir.
    expect(db.upload.mock.calls.map((c) => c[0])).not.toContain('j1/paquete/conectores_cap_01.json');
  });

  it('si el v1 quedó con el nombre del guion (o con otro), empareja el capítulo igual', async () => {
    // Un v1 anterior al renombre: 'Los hijos' donde la edición ya dice 'La familia'.
    const v1Viejo = {
      ...NARRACION_V1,
      capitulos: [
        { numero: 1, nombre: 'El trabajo', texto: 'Trabajé en el ferrocarril.' },
        { numero: 2, nombre: 'La infancia', texto: 'Nací en Rosario.' },
        { numero: 3, nombre: 'Los hijos', texto: 'Mis hermanos me criaron.' },
      ],
    };
    const db = construirDb({
      descargas: descargasBase({ 'j1/paquete/narracion.json': { data: blobFake(JSON.stringify(v1Viejo)), error: null } }),
      narraciones: [
        { data: [], error: null },
        { data: { id: 'narr-1' }, error: null },
        { data: { id: 'narr-1', estado: 'pendiente' }, error: null },
      ],
    });
    conectoresDelModelo();

    await correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false });

    const json = JSON.parse(subido(db, 'j1/paquete/narracion.json') as string);
    expect(json.capitulos.map((c: { nombre: string; texto: string }) => [c.nombre, c.texto])).toEqual([
      ['El trabajo', 'Trabajé en el ferrocarril.'],
      ['La infancia', 'Nací en Rosario.'],
      ['Los hermanos', 'Mis hermanos me criaron.'],
    ]);
  });

  it('--solo-json: no toca nada en la base, deja el JSON en un archivo local y no cachea los conectores', async () => {
    // Sin cola para `narraciones`: cualquier acceso a la tabla explota.
    const db = construirDb();
    conectoresDelModelo();
    const dir = await mkdtemp(path.join(tmpdir(), 'narracion-v2-'));
    try {
      const ruta = path.join(dir, 'v2.json');
      const resultado = await correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: true, rutaSalida: ruta });

      expect(db.upload).not.toHaveBeenCalled();
      expect(db.pedidosUpdate).not.toHaveBeenCalled();
      expect(resultado.narracionId).toBeNull();
      expect(resultado.rutaSalida).toBe(ruta);
      expect(JSON.parse(await readFile(ruta, 'utf8'))).toEqual(resultado.narracion);
      expect(resultado.narracion.capitulos).toHaveLength(3);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('--solo-json --cachear-conectores: guarda solo los conectores ya pagados (nada más)', async () => {
    const db = construirDb();
    conectoresDelModelo();
    const dir = await mkdtemp(path.join(tmpdir(), 'narracion-v2-'));
    try {
      await correrNarracionV2(db, {
        narradorId: 'j1',
        pedidoId: 'p1',
        soloJson: true,
        rutaSalida: path.join(dir, 'v2.json'),
        cachearConectores: true,
      });

      expect(db.upload.mock.calls.map((c) => c[0])).toEqual([
        'j1/paquete/conectores_cap_01.json',
        'j1/paquete/conectores_cap_02.json',
      ]);
      expect(db.pedidosUpdate).not.toHaveBeenCalled();
      expect(db.narracionesInsert).not.toHaveBeenCalled();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // --- Cuando NO hay que seguir: se planta y explica -------------------------

  it('el pedido de otro narrador no se toca (un id cruzado escribiría el v2 del narrador equivocado)', async () => {
    const db = construirDb({ pedido: pedidoP1({ narrador_id: 'otro' }) });

    await expect(correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false })).rejects.toThrow(
      /es del narrador otro, no de j1/
    );

    expect(db.upload).not.toHaveBeenCalled();
    expect(db.pedidosUpdate).not.toHaveBeenCalled();
    expect(escribirConectoresMock).not.toHaveBeenCalled();
  });

  it('sin estructura.json se planta: no la inventa ni la regenera', async () => {
    const descargas = descargasBase();
    delete descargas['j1/paquete/estructura.json'];
    const db = construirDb({ descargas });

    await expect(correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false })).rejects.toThrow(
      /No hay j1\/paquete\/estructura\.json/
    );

    expect(db.upload).not.toHaveBeenCalled();
    expect(db.pedidosUpdate).not.toHaveBeenCalled();
  });

  it('sin el narracion.json que dejó la fábrica no hay texto de capítulos: se planta', async () => {
    const descargas = descargasBase();
    delete descargas['j1/paquete/narracion.json'];
    const db = construirDb({ descargas });

    await expect(correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false })).rejects.toThrow(
      /No hay j1\/paquete\/narracion\.json/
    );

    expect(db.upload).not.toHaveBeenCalled();
  });

  it('si el narracion.json viejo no trae el texto de un capítulo, se planta (no inventa texto)', async () => {
    const v1Corto = { ...NARRACION_V1, capitulos: NARRACION_V1.capitulos.slice(0, 2) };
    const db = construirDb({
      descargas: descargasBase({ 'j1/paquete/narracion.json': { data: blobFake(JSON.stringify(v1Corto)), error: null } }),
    });

    await expect(correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false })).rejects.toThrow(
      /no trae el texto del capítulo 3 \(«Los hermanos»\)/
    );

    expect(db.upload).not.toHaveBeenCalled();
  });

  it('con una narración en curso (pendiente o procesando) no toca el pedido: se narraría dos veces', async () => {
    const db = construirDb({
      narraciones: [{ data: [{ id: 'narr-curso', estado: 'procesando' }], error: null }],
    });
    conectoresDelModelo();

    await expect(correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false })).rejects.toThrow(
      /ya tiene una narración en curso \(narr-curso 'procesando'\)/
    );

    // Se corta ANTES de pagar conectores y de pisar nada (revisión 21/09):
    // ni Storage ni el modelo ni el pedido se tocan.
    expect(db.upload).not.toHaveBeenCalled();
    expect(escribirConectoresMock).not.toHaveBeenCalled();
    expect(db.narracionesUpdate).not.toHaveBeenCalled();
    expect(db.narracionesInsert).not.toHaveBeenCalled();
    expect(db.pedidosUpdate).not.toHaveBeenCalled();
  });

  it('si el pedido todavía no se entregó (no hay voz que reemplazar) se planta antes de pedirle conectores al modelo', async () => {
    const db = construirDb({ pedido: pedidoP1({ estado: 'pagado' }) });

    await expect(correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false })).rejects.toThrow(
      /El pedido p1 está 'pagado'/
    );

    expect(escribirConectoresMock).not.toHaveBeenCalled();
    expect(db.upload).not.toHaveBeenCalled();
    expect(db.pedidosUpdate).not.toHaveBeenCalled();
  });

  it('empareja el capítulo por número (con aviso) cuando el v1 no tiene ni el título ni el nombre del guion', async () => {
    const v1SinNombres = {
      ...NARRACION_V1,
      capitulos: [
        { numero: 1, nombre: 'Uno', texto: 'Trabajé en el ferrocarril.' },
        { numero: 2, nombre: 'Dos', texto: 'Nací en Rosario.' },
        { numero: 3, nombre: 'Tres', texto: 'Mis hermanos me criaron.' },
      ],
    };
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const db = construirDb({
        descargas: descargasBase({ 'j1/paquete/narracion.json': { data: blobFake(JSON.stringify(v1SinNombres)), error: null } }),
        narraciones: [
          { data: [{ id: 'narr-vieja', estado: 'lista' }], error: null },
          { data: [{ id: 'narr-vieja' }], error: null },
          { data: null, error: null },
        ],
      });
      conectoresDelModelo();

      await correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false });

      const json = JSON.parse(subido(db, 'j1/paquete/narracion.json') as string);
      expect(json.capitulos.map((c: { texto: string }) => c.texto)).toEqual([
        'Trabajé en el ferrocarril.',
        'Nací en Rosario.',
        'Mis hermanos me criaron.',
      ]);
      expect(avisos.mock.calls.flat().join(' ')).toMatch(/capítulo 3 no está por nombre/);
    } finally {
      avisos.mockRestore();
    }
  });

  it('si el narracion.json que ya estaba es v2, reusa sus textos (así un reintento no vuelve a escribir nada)', async () => {
    const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const db = construirDb({
        descargas: descargasBase({
          'j1/paquete/narracion.json': { data: blobFake(JSON.stringify({ version: 2, ...NARRACION_V1 })), error: null },
        }),
        narraciones: [
          { data: [{ id: 'narr-vieja', estado: 'lista' }], error: null },
          { data: [{ id: 'narr-vieja' }], error: null },
          { data: null, error: null },
        ],
      });
      conectoresDelModelo();

      await correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false });

      const json = JSON.parse(subido(db, 'j1/paquete/narracion.json') as string);
      expect(json.version).toBe(2);
      expect(json.capitulos.map((c: { texto: string }) => c.texto)).toEqual([
        'Trabajé en el ferrocarril.\n\nTreinta años.',
        'Nací en Rosario.',
        'Mis hermanos me criaron.',
      ]);
      expect(avisos.mock.calls.flat().join(' ')).toMatch(/ya estaba es v2/);
    } finally {
      avisos.mockRestore();
    }
  });

  it('un caché de conectores roto se explica en vez de tirar un error críptico', async () => {
    const db = construirDb({
      descargas: descargasBase({ 'j1/paquete/conectores_cap_01.json': { data: blobFake('{no es json'), error: null } }),
    });

    await expect(correrNarracionV2(db, { narradorId: 'j1', pedidoId: 'p1', soloJson: false })).rejects.toThrow(
      /no es JSON válido.*volvé a correr para regenerarlo/s
    );

    expect(db.upload).not.toHaveBeenCalled();
  });
});

describe('scripts/narracion-v2 — parsearArgs', () => {
  it('pide narrador y pedido (sin argumentos, el uso)', () => {
    expect(() => parsearArgs([])).toThrow(/Uso: npx tsx scripts\/narracion-v2\.ts/);
    expect(() => parsearArgs(['j1'])).toThrow(/Uso: npx tsx scripts\/narracion-v2\.ts/);
  });

  it('sin flags: escribe en Storage (nada de solo-json ni caché aparte)', () => {
    expect(parsearArgs(['j1', 'p1'])).toEqual({
      narradorId: 'j1',
      pedidoId: 'p1',
      soloJson: false,
      rutaSalida: null,
      cachearConectores: false,
    });
  });

  it('--solo-json con --salida, y --cachear-conectores', () => {
    expect(parsearArgs(['j1', 'p1', '--solo-json', '--salida', 'salida.json', '--cachear-conectores'])).toEqual({
      narradorId: 'j1',
      pedidoId: 'p1',
      soloJson: true,
      rutaSalida: 'salida.json',
      cachearConectores: true,
    });
  });

  it('--salida sin --solo-json no vale (el v2 iría a Storage, no a ese archivo)', () => {
    expect(() => parsearArgs(['j1', 'p1', '--salida', 'salida.json'])).toThrow(/--salida solo vale con --solo-json/);
  });

  it('una flag desconocida (o --salida sin ruta) avisa en vez de seguir', () => {
    expect(() => parsearArgs(['j1', 'p1', '--narra-todo'])).toThrow(/No entiendo «--narra-todo»/);
    expect(() => parsearArgs(['j1', 'p1', '--solo-json', '--salida'])).toThrow(/--salida necesita una ruta/);
  });
});
