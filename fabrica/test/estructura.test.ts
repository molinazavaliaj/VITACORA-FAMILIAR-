import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pregunta } from '../src/db.js';

// El SDK de Claude se mockea en todos los tests: la fábrica nunca debe pegarle
// a la API real en CI. finalMessage() devuelve un array de bloques de texto,
// como hace el SDK real.
const finalMessageMock = vi.fn();
const streamMock = vi.fn(() => ({ finalMessage: finalMessageMock }));

// OJO: mockImplementation necesita una function de verdad (no arrow): el
// código real hace `new Anthropic(...)` y una arrow no puede ser constructor.
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
import { agruparCapitulos, generarEstructura, parsearJsonEntidades } from '../src/libro/estructura.js';

describe('agruparCapitulos', () => {
  it('agrupa los órdenes respondidos por capítulo, en orden de primera aparición', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 3, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor', tipo: 'fija' },
    ];
    const ordenesRespondidos = [1, 2, 3];

    const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

    expect(capitulos).toEqual([
      { nombre: 'Infancia', ordenes: [1, 2] },
      { nombre: 'El amor', ordenes: [3] },
    ]);
  });

  it('excluye los órdenes sin respuesta (soporta cierre anticipado)', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 3, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor', tipo: 'fija' },
    ];
    const ordenesRespondidos = [1, 3];

    const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

    expect(capitulos).toEqual([
      { nombre: 'Infancia', ordenes: [1] },
      { nombre: 'El amor', ordenes: [3] },
    ]);
  });

  it('respeta el orden de primera aparición del capítulo aunque las preguntas no estén ordenadas', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 3, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor', tipo: 'fija' },
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', capitulo: 'Infancia', tipo: 'fija' },
    ];
    const ordenesRespondidos = [1, 2, 3];

    const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

    expect(capitulos.map((c) => c.nombre)).toEqual(['El amor', 'Infancia']);
  });

  it('devuelve vacío si no hay órdenes respondidos', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
    ];

    expect(agruparCapitulos(preguntas, [])).toEqual([]);
  });

  it('dedupe: la pregunta del narrador pisa a la fija con el mismo orden (no duplica en el libro)', () => {
    // Mismo criterio que la web (tablero/page.tsx): un reemplazo o
    // adaptativa con el mismo `orden` que una fija gana — la fija no debe
    // aparecer también con su propio capítulo, o el material de esa
    // respuesta queda duplicado en el libro.
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 19, texto: '¿Y tus hijos?', capitulo: 'Los hijos', tipo: 'fija' },
      { narrador_id: 'narrador-1', orden: 19, texto: '¿Y tus raíces?', capitulo: 'Las raíces', tipo: 'adaptativa' },
    ];
    const ordenesRespondidos = [19];

    const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

    expect(capitulos).toEqual([{ nombre: 'Las raíces', ordenes: [19] }]);
  });
});

describe('parsearJsonEntidades', () => {
  it('mantiene solo las entradas válidas y descarta las mal formadas', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const json = JSON.stringify([
      { texto: 'Roberto', tipo: 'persona', contexto: 'el narrador' },
      { texto: 'Buenos Aires', tipo: 'lugar', contexto: 'ciudad natal' },
      { texto: 'Sin tipo', contexto: 'falta tipo' }, // falta tipo
      { texto: 'Mala', tipo: 'animal', contexto: 'tipo inválido' }, // tipo fuera de enum
      { texto: '   ', tipo: 'persona', contexto: 'texto vacío' }, // texto vacío
      'un string suelto', // no es objeto
      { texto: 'Sin contexto', tipo: 'lugar' }, // falta contexto
    ]);

    const entidades = parsearJsonEntidades(json);

    expect(entidades).toEqual([
      { texto: 'Roberto', tipo: 'persona', contexto: 'el narrador' },
      { texto: 'Buenos Aires', tipo: 'lugar', contexto: 'ciudad natal' },
    ]);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('devuelve vacío si todas las entradas están mal formadas', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const json = JSON.stringify([
      { texto: '', tipo: 'persona', contexto: 'texto vacío' },
      { texto: 'Alguien', tipo: 'planeta', contexto: 'tipo inválido' },
      42,
    ]);

    expect(parsearJsonEntidades(json)).toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('devuelve null (falla de parseo, no vacío legítimo) si el JSON no parsea', () => {
    expect(parsearJsonEntidades('no es json')).toBeNull();
  });

  it('devuelve null (falla de parseo, no vacío legítimo) si el JSON parsea pero no es un array', () => {
    expect(parsearJsonEntidades('{"texto":"x"}')).toBeNull();
  });
});

// --- generarEstructura ------------------------------------------------------
// Este bloque es el que realmente ejercita `new Anthropic(...)` →
// messages.stream → finalMessage; los helpers puros de arriba nunca tocan el SDK.

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
}) {
  let fromPreguntasContador = 0;
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

  const upload = vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null });
  const storage = { from: vi.fn(() => ({ upload })) };

  return { from, storage, upload };
}

describe('generarEstructura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    streamMock.mockImplementation(() => ({ finalMessage: finalMessageMock }));
    process.env.SUPABASE_URL = 'https://x.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-service-role';
    process.env.ANTHROPIC_API_KEY = 'clave-anthropic';
    process.env.OPENAI_API_KEY = 'clave-openai';
  });

  it('arma capítulos, detecta entidades vía el modelo y sube estructura.json', async () => {
    const db = construirDbFake({
      narrador: {
        data: {
          id: 'narrador-1',
          nombre: 'Roberto',
          como_le_dicen: 'Beto',
          // Texto libre por vínculo, como lo guarda la web — no arrays.
          contexto: { arbol: { conyuge: 'Rosario', hijos: 'Martín', padres: 'no tuvo' } },
          foto_url: null,
          estado: 'armando_paquete',
        },
        error: null,
      },
      preguntasFijas: {
        data: [
          { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
          { narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', capitulo: 'Infancia', tipo: 'fija' },
          { narrador_id: null, orden: 3, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor', tipo: 'fija' },
        ],
        error: null,
      },
      preguntasNarrador: { data: [], error: null },
      respuestas: {
        data: [
          { narrador_id: 'narrador-1', pregunta_orden: 1, transcripcion: 'Nací en Rosorio.', texto_directo: null, es_repregunta: false, audio_path: null, duracion_segundos: 30 },
          { narrador_id: 'narrador-1', pregunta_orden: 3, transcripcion: null, texto_directo: 'La conocí bailando.', es_repregunta: false, audio_path: null, duracion_segundos: null },
        ],
        error: null,
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    finalMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify([
            { texto: 'Rosario', tipo: 'persona', contexto: 'su esposa' },
            { texto: 'Rosorio', tipo: 'lugar', contexto: 'donde nació (posible error de transcripción)' },
          ]),
        },
      ],
    });

    const estructura = await generarEstructura('narrador-1');

    // El SDK se instanció y se llamó una sola vez, con las transcripciones y
    // la pista de nombres confirmados del árbol familiar.
    expect(streamMock).toHaveBeenCalledTimes(1);
    const llamada = streamMock.mock.calls[0][0] as { messages: { content: string }[] };
    const prompt = llamada.messages[0].content;
    expect(prompt).toContain('Nací en Rosorio.');
    expect(prompt).toContain('La conocí bailando.');
    // El árbol viaja como frase entera, no desarmado en letras, y el 'no tuvo'
    // del formulario no se cuela como si fuera un nombre confirmado.
    expect(prompt).toContain('Rosario, Martín');
    expect(prompt).not.toContain('no tuvo');
    expect(prompt).not.toContain('R, o, s');

    expect(estructura).toEqual({
      titulo: 'Roberto — La historia de una vida',
      capitulos: [
        { nombre: 'Infancia', ordenes: [1] },
        { nombre: 'El amor', ordenes: [3] },
      ],
      entidades: [
        { texto: 'Rosario', tipo: 'persona', contexto: 'su esposa' },
        { texto: 'Rosorio', tipo: 'lugar', contexto: 'donde nació (posible error de transcripción)' },
      ],
    });

    expect(db.storage.from).toHaveBeenCalledWith('audios');
    expect(db.upload).toHaveBeenCalledWith(
      'narrador-1/paquete/estructura.json',
      JSON.stringify(estructura),
      { contentType: 'application/json', upsert: true }
    );
  });

  it('sin transcripciones no llama al modelo y las entidades quedan vacías', async () => {
    const db = construirDbFake({
      narrador: {
        data: { id: 'narrador-1', nombre: 'Ana', como_le_dicen: 'Ana', contexto: {}, foto_url: null, estado: 'armando_paquete' },
        error: null,
      },
      preguntasFijas: {
        data: [{ narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' }],
        error: null,
      },
      respuestas: { data: [], error: null },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    const estructura = await generarEstructura('narrador-1');

    expect(streamMock).not.toHaveBeenCalled();
    expect(estructura).toEqual({ titulo: 'Ana — La historia de una vida', capitulos: [], entidades: [] });
    expect(db.upload).toHaveBeenCalledTimes(1);
  });

  it('tira si el narrador no existe, sin llamar al modelo ni subir nada', async () => {
    const db = construirDbFake({ narrador: { data: null, error: { message: 'no rows' } } });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(generarEstructura('narrador-x')).rejects.toThrow(/narrador-x/);
    expect(streamMock).not.toHaveBeenCalled();
    expect(db.upload).not.toHaveBeenCalled();
  });

  it('si el modelo responde algo no interpretable como entidades, tira y NO sube estructura.json (para que el tick reintente)', async () => {
    const db = construirDbFake({
      narrador: {
        data: { id: 'narrador-1', nombre: 'Roberto', como_le_dicen: 'Beto', contexto: {}, foto_url: null, estado: 'armando_paquete' },
        error: null,
      },
      preguntasFijas: {
        data: [{ narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' }],
        error: null,
      },
      respuestas: {
        data: [{ narrador_id: 'narrador-1', pregunta_orden: 1, transcripcion: 'Nací en Rosario.', texto_directo: null, es_repregunta: false, audio_path: null, duracion_segundos: 30 }],
        error: null,
      },
    });
    (obtenerClienteDb as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    // Respuesta del modelo que no parsea como JSON — distinto de "[]" (lista
    // vacía legítima).
    finalMessageMock.mockResolvedValue({
      content: [{ type: 'text', text: 'esto no es JSON en absoluto' }],
    });

    await expect(generarEstructura('narrador-1')).rejects.toThrow(/narrador-1/);
    expect(db.upload).not.toHaveBeenCalled();
  });
});
