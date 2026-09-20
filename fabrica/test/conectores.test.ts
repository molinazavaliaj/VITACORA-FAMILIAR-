import { describe, it, expect, vi, beforeEach } from 'vitest';
import { escribirConectores, historiasDelCapitulo } from '../src/voz/conectores.js';

// --- historiasDelCapitulo ----------------------------------------------------

const preguntasPorOrden = new Map([
  [1, { texto: '¿Dónde naciste?' }],
  [2, { texto: '¿Cómo era tu casa?' }],
  [3, { texto: '¿Quiénes fueron tus abuelos?' }],
]);

function respuesta(
  ajustes: Partial<{
    id: string;
    pregunta_orden: number;
    es_repregunta: boolean;
    audio_path: string | null;
    duracion_segundos: number | null;
    transcripcion: string | null;
    texto_directo: string | null;
    recibido_at: string | null;
    reservada?: boolean | null;
    reservado_tramo?: string | null;
  }>
) {
  return {
    id: 'r',
    pregunta_orden: 1,
    es_repregunta: false,
    audio_path: 'n/dia_01.ogg',
    duracion_segundos: 100,
    transcripcion: 'Texto.',
    texto_directo: null,
    recibido_at: '2026-09-01T10:00:00Z',
    ...ajustes,
  };
}

describe('historiasDelCapitulo', () => {
  it('un orden repetido en el capítulo no duplica la historia (el audio sonaría dos veces)', () => {
    const r = { id: 'r1', narrador_id: 'n', pregunta_orden: 1, texto_directo: null, transcripcion: 'Hola', es_repregunta: false, audio_path: 'n/dia_01.ogg', duracion_segundos: 10, recibido_at: '2026-09-01T00:00:00Z' };
    const historias = historiasDelCapitulo([1, 1], new Map(), new Map([[1, [r]]]));
    expect(historias.map((h) => h.respuesta_id)).toEqual(['r1']);
  });

  it('sigue el orden de `ordenes` del capítulo, no el numérico, y arma cada historia con la pregunta y el texto', () => {
    const respuestasPorOrden = new Map([
      [1, [respuesta({ id: 'r1', pregunta_orden: 1, audio_path: 'n/dia_01.ogg', transcripcion: 'En Rosario.' })]],
      [3, [respuesta({ id: 'r3', pregunta_orden: 3, audio_path: 'n/dia_03.ogg', transcripcion: 'Mis abuelos eran de Italia.' })]],
    ]);

    const historias = historiasDelCapitulo([3, 1], preguntasPorOrden, respuestasPorOrden);

    expect(historias).toEqual([
      {
        respuesta_id: 'r3',
        pregunta_orden: 3,
        es_repregunta: false,
        audio_path: 'n/dia_03.ogg',
        segundos: 100,
        pregunta: '¿Quiénes fueron tus abuelos?',
        texto: 'Mis abuelos eran de Italia.',
      },
      {
        respuesta_id: 'r1',
        pregunta_orden: 1,
        es_repregunta: false,
        audio_path: 'n/dia_01.ogg',
        segundos: 100,
        pregunta: '¿Dónde naciste?',
        texto: 'En Rosario.',
      },
    ]);
  });

  it('dentro de una pregunta va primero la respuesta y después las repreguntas, por recibido_at', () => {
    const respuestasPorOrden = new Map([
      [
        1,
        [
          respuesta({ id: 'rep-2', es_repregunta: true, audio_path: 'n/dia_01_3.ogg', recibido_at: '2026-09-01T12:00:00Z' }),
          respuesta({ id: 'rep-1', es_repregunta: true, audio_path: 'n/dia_01_2.ogg', recibido_at: '2026-09-01T11:00:00Z' }),
          respuesta({ id: 'principal', es_repregunta: false, audio_path: 'n/dia_01.ogg', recibido_at: '2026-09-01T13:00:00Z' }),
        ],
      ],
    ]);

    const historias = historiasDelCapitulo([1], preguntasPorOrden, respuestasPorOrden);

    expect(historias.map((h) => h.respuesta_id)).toEqual(['principal', 'rep-1', 'rep-2']);
    expect(historias.map((h) => h.es_repregunta)).toEqual([false, true, true]);
  });

  it('excluye las respuestas sin audio (respondió escribiendo) y los órdenes sin respuesta', () => {
    const respuestasPorOrden = new Map([
      [1, [respuesta({ id: 'r1', audio_path: null, texto_directo: 'Escrito.', transcripcion: null })]],
      [2, [respuesta({ id: 'r2', pregunta_orden: 2, audio_path: 'n/dia_02.ogg' })]],
    ]);

    const historias = historiasDelCapitulo([1, 2, 3], preguntasPorOrden, respuestasPorOrden);

    expect(historias.map((h) => h.respuesta_id)).toEqual(['r2']);
  });

  // Hallazgo 19: el audiolibro publica igual que el libro. Lo que el narrador
  // pidió guardar no se narra, ni siquiera con su propia voz.
  it('excluye las respuestas que el narrador pidió reservar', () => {
    const respuestasPorOrden = new Map([
      [1, [
        respuesta({ id: 'reservada-entera', reservada: true }),
        respuesta({ id: 'publicable', audio_path: 'n/dia_01b.ogg' }),
      ]],
    ]);

    const historias = historiasDelCapitulo([1], preguntasPorOrden, respuestasPorOrden);

    expect(historias.map((h) => h.respuesta_id)).toEqual(['publicable']);
  });

  it('segundos es duracion_segundos redondeado (0 si null) y la pregunta cae a "Pregunta N" si no está', () => {
    const respuestasPorOrden = new Map([
      [7, [respuesta({ id: 'r7', pregunta_orden: 7, duracion_segundos: 265.6 })]],
      [8, [respuesta({ id: 'r8', pregunta_orden: 8, duracion_segundos: null })]],
    ]);

    const historias = historiasDelCapitulo([7, 8], preguntasPorOrden, respuestasPorOrden);

    expect(historias[0].segundos).toBe(266);
    expect(historias[0].pregunta).toBe('Pregunta 7');
    expect(historias[1].segundos).toBe(0);
  });

  it('el texto sale de textoRespuesta (la transcripción, o el texto directo); sin nada queda vacío', () => {
    const respuestasPorOrden = new Map([
      [1, [respuesta({ id: 'r1', transcripcion: '  ', texto_directo: 'Lo escribió él.' })]],
      [2, [respuesta({ id: 'r2', pregunta_orden: 2, transcripcion: null, texto_directo: null })]],
    ]);

    const historias = historiasDelCapitulo([1, 2], preguntasPorOrden, respuestasPorOrden);

    expect(historias[0].texto).toBe('Lo escribió él.');
    expect(historias[1].texto).toBe('');
  });
});

// --- escribirConectores ------------------------------------------------------

// El SDK de Claude no se toca: se pasa un cliente fake con la misma forma que
// usa la fábrica (`messages.stream(...).finalMessage()` → bloques de texto).
const finalMessageMock = vi.fn();
const streamMock = vi.fn(() => ({ finalMessage: finalMessageMock }));
const clienteFake = { messages: { stream: streamMock } } as unknown as Parameters<typeof escribirConectores>[0];

function respuestaDelModelo(texto: string) {
  return { content: [{ type: 'text', text: texto }] };
}

const argsBase = {
  nombre: 'Rosa',
  capitulo: 'La infancia',
  textoCapitulo: 'Nací en Rosario, en la casa de mi abuela.\n\nMi vieja cosía para afuera.',
  historias: [
    { pregunta: '¿Dónde naciste?', texto: 'En Rosario, en la casa de mi abuela.' },
    { pregunta: '¿Cómo era tu casa?', texto: 'Era chiquita, con un patio grande.' },
    { pregunta: '¿Quiénes fueron tus abuelos?', texto: 'Mis abuelos eran de Italia.' },
  ],
};

describe('escribirConectores', () => {
  beforeEach(() => {
    streamMock.mockClear();
    finalMessageMock.mockReset();
  });

  it('pide a claude-fable-5 un JSON con entrada, entre y salida, y lo devuelve aunque venga con fences', async () => {
    finalMessageMock.mockResolvedValue(
      respuestaDelModelo(
        'Acá va:\n```json\n{"entrada": "Empiezo por Rosario.", "entre": ["Y esa casa...", "Y los abuelos..."], "salida": "Eso fue la infancia."}\n```'
      )
    );

    const conectores = await escribirConectores(clienteFake, argsBase);

    expect(conectores).toEqual({
      entrada: 'Empiezo por Rosario.',
      entre: ['Y esa casa...', 'Y los abuelos...'],
      salida: 'Eso fue la infancia.',
    });

    expect(streamMock).toHaveBeenCalledTimes(1);
    const llamada = streamMock.mock.calls[0][0] as {
      model: string;
      max_tokens: number;
      messages: { role: string; content: string }[];
    };
    expect(llamada.model).toBe('claude-fable-5');
    expect(llamada.max_tokens).toBe(4000);
    expect(llamada.messages).toHaveLength(1);
    expect(llamada.messages[0].role).toBe('user');

    const prompt = llamada.messages[0].content;
    // El narrador, el capítulo, el texto ya escrito en su voz y las historias en orden.
    expect(prompt).toContain('Rosa');
    expect(prompt).toContain('La infancia');
    expect(prompt).toContain('Mi vieja cosía para afuera.');
    expect(prompt).toContain('¿Dónde naciste?');
    expect(prompt).toContain('Era chiquita, con un patio grande.');
    expect(prompt.indexOf('En Rosario, en la casa de mi abuela.')).toBeLessThan(prompt.indexOf('Mis abuelos eran de Italia.'));
    // Las reglas de siempre: su voz, nada inventado, sin perfume a IA, y la cantidad exacta de puentes.
    expect(prompt).toContain('Primera persona');
    expect(prompt).toContain('No inventes NADA');
    expect(prompt).toContain('fue una época llena de desafíos');
    expect(prompt).toContain('2 puentes');
    expect(prompt).toContain('"entrada"');
  });

  it('si el JSON no cumple (entre con largo malo), reintenta UNA vez avisando el error y devuelve lo bueno', async () => {
    finalMessageMock
      .mockResolvedValueOnce(respuestaDelModelo('{"entrada": "Hola.", "entre": ["uno"], "salida": "Chau."}'))
      .mockResolvedValueOnce(respuestaDelModelo('{"entrada": "Hola.", "entre": ["uno", "dos"], "salida": "Chau."}'));

    const conectores = await escribirConectores(clienteFake, argsBase);

    expect(conectores.entre).toEqual(['uno', 'dos']);
    expect(streamMock).toHaveBeenCalledTimes(2);
    const promptReintento = (streamMock.mock.calls[1][0] as { messages: { content: string }[] }).messages[0].content;
    expect(promptReintento).toContain('Tu respuesta anterior no sirvió');
    expect(promptReintento).toContain('trae 1 puentes');
  });

  it('un puente vacío no sirve: se pide de nuevo (el worker no tendría qué narrar)', async () => {
    finalMessageMock
      .mockResolvedValueOnce(respuestaDelModelo('{"entrada": "Hola.", "entre": ["uno", "   "], "salida": "Chau."}'))
      .mockResolvedValueOnce(respuestaDelModelo('{"entrada": "Hola.", "entre": ["uno", "dos"], "salida": "Chau."}'));

    const conectores = await escribirConectores(clienteFake, argsBase);

    expect(conectores.entre).toEqual(['uno', 'dos']);
    expect(streamMock).toHaveBeenCalledTimes(2);
  });

  it('si falla dos veces, tira un error claro y no sigue insistiendo', async () => {
    finalMessageMock
      .mockResolvedValueOnce(respuestaDelModelo('esto no es JSON'))
      .mockResolvedValueOnce(respuestaDelModelo('{"entrada": 3, "entre": ["uno", "dos"], "salida": "Chau."}'));

    await expect(escribirConectores(clienteFake, argsBase)).rejects.toThrow(/conectores.*La infancia/);
    expect(streamMock).toHaveBeenCalledTimes(2);
  });

  it('con una sola historia, entre es [] y así lo pide', async () => {
    finalMessageMock.mockResolvedValue(respuestaDelModelo('{"entrada": "Hola.", "entre": [], "salida": "Chau."}'));

    const conectores = await escribirConectores(clienteFake, { ...argsBase, historias: [argsBase.historias[0]] });

    expect(conectores).toEqual({ entrada: 'Hola.', entre: [], salida: 'Chau.' });
    const prompt = (streamMock.mock.calls[0][0] as { messages: { content: string }[] }).messages[0].content;
    expect(prompt).toContain('"entre": []');
  });
});
