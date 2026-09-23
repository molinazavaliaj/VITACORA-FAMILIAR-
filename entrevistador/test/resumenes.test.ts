import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

const mocks = vi.hoisted(() => ({
  crear: vi.fn(),
  respuestas: [] as any[],
  preguntas: [] as any[],
  updates: [] as any[],
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: mocks.crear }; },
}));

// Cliente de base falso, fiel a Supabase: encadena y APLICA los filtros
// (eq/lt/in), como haría PostgREST. Un mock que devuelve todo esconde bugs.
vi.mock('../src/db/cliente.js', () => {
  const cadena = (tabla: string) => {
    const filtros: ((f: any) => boolean)[] = [];
    const q: any = {
      _single: false,
      select: () => q,
      eq: (campo: string, valor: any) => { filtros.push((f) => f[campo] === valor); return q; },
      lt: (campo: string, valor: any) => { filtros.push((f) => f[campo] < valor); return q; },
      in: (campo: string, valores: any[]) => { filtros.push((f) => valores.includes(f[campo])); return q; },
      or: () => q,
      order: () => q,
      limit: () => q,
      maybeSingle: () => { q._single = true; return q; },
      update: (p: any) => { mocks.updates.push({ tabla, p }); return q; },
      then: (resolver: any) => {
        const filas = tabla === 'respuestas' ? mocks.respuestas : tabla === 'preguntas' ? mocks.preguntas : null;
        const filtradas = (filas ?? []).filter((f) => filtros.every((fn) => fn(f)));
        return Promise.resolve({ data: q._single ? (filtradas[0] ?? null) : filtradas, error: null }).then(resolver);
      },
    };
    return q;
  };
  return { db: { from: (tabla: string) => cadena(tabla) } };
});

const { memoriaDeCapitulos, limpiarResumen, PROMPT_RESUMEN, MAX_PALABRAS_RESUMEN, MAX_CARACTERES_RESUMEN, preguntaEnTexto } = await import('../src/ia/resumenes.js');

const narrador = (contexto: Record<string, any> = {}) => ({
  id: 'n1', como_le_dicen: 'Don Osvaldo', contexto,
});

const texto = (t: string) => ({ content: [{ type: 'text', text: t }], usage: {} });

describe('PROMPT_RESUMEN', () => {
  const prompt = PROMPT_RESUMEN('Don Osvaldo', 'La infancia', 'Pregunta 1:\nLa casa de Villa Domínico.');

  it('pide lo que el biógrafo necesita recordar', () => {
    expect(prompt).toContain('La infancia');
    expect(prompt).toContain('Villa Domínico');
    expect(prompt).toContain('nombres propios');
    expect(prompt).toContain('Pendiente:');
  });

  it('corta el largo y prohíbe inventar', () => {
    expect(prompt).toContain(`Máximo ${MAX_PALABRAS_RESUMEN} palabras`);
    expect(prompt).toContain('No inventes nada');
  });

  it('deja claro que no es material del libro', () => {
    expect(prompt).toContain('no van al libro');
  });
});

describe('limpiarResumen', () => {
  it('saca el título en negrita que el modelo agrega igual', () => {
    const bruto = '**RESUMEN CAPÍTULO "LAS PRUEBAS"**\n\nDon Osvaldo cuenta la muerte de su hermano Rubén.\n\nPendiente: la fe.';
    const limpio = limpiarResumen(bruto);
    expect(limpio).not.toContain('**');
    expect(limpio).not.toContain('RESUMEN CAPÍTULO');
    expect(limpio).toContain('Don Osvaldo cuenta la muerte de su hermano Rubén.');
  });

  it('rescata la línea Pendiente aunque el resumen venga larguísimo', () => {
    const bruto = `Don Osvaldo cuenta su vida en el taller. ${'Y sigue contando cosas del oficio sin parar. '.repeat(40)}\n\nPendiente: la relación con su hijo Sergio.`;
    const limpio = limpiarResumen(bruto);
    expect(limpio).toContain('Pendiente: la relación con su hijo Sergio.');
    expect(limpio.length).toBeLessThan(MAX_CARACTERES_RESUMEN + 80);
  });

  it('corta en un punto, no a mitad de frase', () => {
    const bruto = `${'Primera frase larga del recuerdo. '.repeat(60)}Ultima frase.`;
    const limpio = limpiarResumen(bruto);
    expect(limpio.endsWith('.')).toBe(true);
    expect(limpio).not.toContain('Ultima frase.');
  });

  it('deja intacto un resumen que ya viene bien', () => {
    const bueno = 'Don Osvaldo nació en Avellaneda. Su padre era Ramón.\n\nPendiente: la infancia en el campo.';
    expect(limpiarResumen(bueno)).toBe(bueno);
  });
});

describe('memoriaDeCapitulos', () => {
  beforeEach(() => {
    mocks.crear.mockReset();
    mocks.updates = [];
    // El narrador va por la pregunta 8 (capítulo "La juventud") y ya cerró dos capítulos.
    mocks.respuestas = [
      { pregunta_orden: 1, narrador_id: 'n1', es_repregunta: false, transcripcion: 'La casa de Villa Domínico.', texto_directo: null },
      { pregunta_orden: 5, narrador_id: 'n1', es_repregunta: false, transcripcion: 'Mi abuelo Aparicio, de Goya.', texto_directo: null },
    ];
    mocks.preguntas = [
      { orden: 1, capitulo: 'La infancia', narrador_id: null },
      { orden: 5, capitulo: 'Las raíces', narrador_id: null },
      { orden: 8, capitulo: 'La juventud', narrador_id: null },
    ];
  });

  it('resume los capítulos ya contados y los devuelve como memoria', async () => {
    mocks.crear.mockImplementation(async (args: any) => {
      const contenido = args.messages[0].content as string;
      return texto(contenido.includes('«La infancia»') ? 'RESUMEN INFANCIA' : 'RESUMEN RAICES');
    });
    const memoria = await memoriaDeCapitulos(narrador(), 8);
    expect(memoria).toContain('CAPÍTULO «La infancia» (ya contado):\nRESUMEN INFANCIA');
    expect(memoria).toContain('CAPÍTULO «Las raíces» (ya contado):\nRESUMEN RAICES');
    expect(mocks.crear).toHaveBeenCalledTimes(2);
  });

  it('NO resume el capítulo que se está contando ahora', async () => {
    mocks.preguntas.push({ orden: 9, capitulo: 'La juventud', narrador_id: null });
    mocks.respuestas.push({ pregunta_orden: 9, narrador_id: 'n1', es_repregunta: false, transcripcion: 'El baile del club.', texto_directo: null });
    mocks.crear.mockResolvedValue(texto('RESUMEN'));
    const memoria = await memoriaDeCapitulos(narrador(), 9);
    expect(memoria).not.toContain('La juventud');
  });

  it('mete en el capítulo lo que contó cuando se le repreguntó', async () => {
    mocks.respuestas.push({
      pregunta_orden: 1, narrador_id: 'n1', es_repregunta: true,
      transcripcion: 'Y ahora que me acuerdo: la bomba del patio la puso mi viejo.', texto_directo: null,
    });
    mocks.crear.mockResolvedValue(texto('RESUMEN'));
    await memoriaDeCapitulos(narrador(), 8);
    const enviado = mocks.crear.mock.calls[0][0].messages[0].content as string;
    expect(enviado).toContain('Pregunta 1 (lo amplió después):');
    expect(enviado).toContain('la bomba del patio la puso mi viejo');
  });

  it('usa el resumen guardado y NO vuelve a llamar al modelo', async () => {
    const memoria = await memoriaDeCapitulos(
      narrador({
        resumenesCapitulos: { 'La infancia': 'ya resumido', 'Las raíces': 'también' },
        resumenesHasta: { 'La infancia': { orden: 1, respuestas: 1 }, 'Las raíces': { orden: 5, respuestas: 1 } },
      }), 8,
    );
    expect(memoria).toContain('ya resumido');
    expect(memoria).toContain('también');
    expect(mocks.crear).not.toHaveBeenCalled();
    expect(mocks.updates).toHaveLength(0);
  });

  it('sólo resume lo que falta y guarda el resultado (con la marca del material)', async () => {
    mocks.crear.mockResolvedValue(texto('RESUMEN NUEVO'));
    const memoria = await memoriaDeCapitulos(
      narrador({ resumenesCapitulos: { 'La infancia': 'viejo' }, resumenesHasta: { 'La infancia': { orden: 1, respuestas: 1 } } }), 8,
    );
    expect(memoria).toContain('viejo');
    expect(memoria).toContain('RESUMEN NUEVO');
    expect(mocks.crear).toHaveBeenCalledTimes(1); // sólo "Las raíces"
    const guardado = mocks.updates[0];
    expect(guardado.p.contexto.resumenesCapitulos['La infancia']).toBe('viejo');
    expect(guardado.p.contexto.resumenesCapitulos['Las raíces']).toBe('RESUMEN NUEVO');
    // La marca es lo que después permite saber si el resumen quedó viejo.
    expect(guardado.p.contexto.resumenesHasta['Las raíces']).toEqual({ orden: 5, respuestas: 1 });
  });

  // Bitácora 16 ("lo último manda"): si el narrador corrigió algo de un capítulo
  // ya resumido, el resumen viejo puede estar afirmando un dato que él ya cambió.
  it('rehace el resumen de un capítulo ya resumido si contó más de ese capítulo después', async () => {
    mocks.preguntas.push({ orden: 3, capitulo: 'La infancia', narrador_id: null });
    mocks.respuestas.push({
      pregunta_orden: 3, narrador_id: 'n1', es_repregunta: false,
      transcripcion: 'No, a los 12 ya estábamos en otro lado.', texto_directo: null,
    });
    mocks.crear.mockResolvedValue(texto('RESUMEN AL DÍA'));

    const memoria = await memoriaDeCapitulos(
      narrador({ resumenesCapitulos: { 'La infancia': 'viejo' }, resumenesHasta: { 'La infancia': { orden: 1, respuestas: 1 } } }), 8,
    );

    expect(memoria).toContain('RESUMEN AL DÍA');
    expect(memoria).not.toContain('viejo');
    const enviado = mocks.crear.mock.calls[0][0].messages[0].content as string;
    // Se rehace con TODO el material del capítulo (lo viejo y la corrección nueva).
    expect(enviado).toContain('La casa de Villa Domínico.');
    expect(enviado).toContain('No, a los 12 ya estábamos en otro lado.');
    // Y queda anotado con qué material se escribió.
    expect(mocks.updates[0].p.contexto.resumenesHasta['La infancia']).toEqual({ orden: 3, respuestas: 2 });
  });

  // La corrección puede llegar como AMPLIACIÓN (repregunta) el mismo día: ahí el
  // `pregunta_orden` no cambia, así que la marca tiene que mirar también cuántas
  // respuestas hay. Con el orden solo, el resumen viejo quedaba para siempre.
  it('rehace el resumen cuando lo que llegó fue una ampliación de la misma orden', async () => {
    mocks.respuestas.push({
      pregunta_orden: 1, narrador_id: 'n1', es_repregunta: true,
      transcripcion: 'Y ahora que me acuerdo: no, a los 12 ya estábamos en otro lado.', texto_directo: null,
    });
    mocks.crear.mockResolvedValue(texto('RESUMEN AL DÍA'));

    const memoria = await memoriaDeCapitulos(
      narrador({ resumenesCapitulos: { 'La infancia': 'viejo' }, resumenesHasta: { 'La infancia': { orden: 1, respuestas: 1 } } }), 8,
    );

    expect(memoria).toContain('RESUMEN AL DÍA');
    expect(memoria).not.toContain('viejo');
    expect(mocks.updates[0].p.contexto.resumenesHasta['La infancia']).toEqual({ orden: 1, respuestas: 2 });
  });

  it('un resumen guardado sin marca (de antes de este cambio) se rehace una vez y queda al día', async () => {
    mocks.crear.mockResolvedValue(texto('RESUMEN AL DÍA'));
    const n = narrador({ resumenesCapitulos: { 'La infancia': 'viejo' } });

    await memoriaDeCapitulos(n, 8);
    expect(mocks.crear).toHaveBeenCalledTimes(2); // "La infancia" (una vez) y "Las raíces"
    expect(mocks.updates[0].p.contexto.resumenesHasta['La infancia']).toEqual({ orden: 1, respuestas: 1 });

    // La segunda pasada ya no lo vuelve a tocar: la marca quedó guardada en el
    // contexto del narrador (se muta el mismo objeto que usan los que escriben después).
    mocks.crear.mockClear();
    mocks.updates = [];
    await memoriaDeCapitulos(n, 8);
    expect(mocks.crear).not.toHaveBeenCalled();
  });

  it('si el modelo falla al rehacer, queda el resumen viejo y no se marca como al día', async () => {
    mocks.preguntas.push({ orden: 3, capitulo: 'La infancia', narrador_id: null });
    mocks.respuestas.push({ pregunta_orden: 3, narrador_id: 'n1', es_repregunta: false, transcripcion: 'Otra cosa más.', texto_directo: null });
    mocks.crear.mockRejectedValue(new Error('529 overloaded'));

    const memoria = await memoriaDeCapitulos(
      narrador({ resumenesCapitulos: { 'La infancia': 'viejo' }, resumenesHasta: { 'La infancia': { orden: 1, respuestas: 1 } } }), 8,
    );

    expect(memoria).toContain('viejo');
    expect(mocks.updates).toHaveLength(0);
  });

  // `regenerar: true` (la puerta manual) rehace todo, pero un capítulo que falla
  // no puede llevarse puesto el resumen viejo ya pagado.
  it('con regenerar:true, lo que falla conserva el resumen anterior', async () => {
    mocks.crear
      .mockRejectedValueOnce(new Error('529 overloaded'))
      .mockResolvedValue(texto('RAICES NUEVO'));

    await memoriaDeCapitulos(
      narrador({
        resumenesCapitulos: { 'La infancia': 'viejo' },
        resumenesHasta: { 'La infancia': { orden: 1, respuestas: 1 } },
      }), 8, { regenerar: true },
    );

    const guardado = mocks.updates[0];
    expect(guardado.p.contexto.resumenesCapitulos['La infancia']).toBe('viejo');
    expect(guardado.p.contexto.resumenesCapitulos['Las raíces']).toBe('RAICES NUEVO');
  });

  it('el prompt pide lo último y el tono del capítulo (bitácora 16 y 33)', () => {
    const p = PROMPT_RESUMEN('Ciro', 'La infancia', 'Pregunta 2:\nMi vieja se fue.');
    expect(p).toContain('LO ÚLTIMO MANDA');
    expect(p).toContain('descartá el dato viejo');
    expect(p).toContain('"Tono:"');
    expect(p).toContain('no volver a preguntar por las fiestas de una familia que se desarmó');
  });

  it('si el modelo falla devuelve lo que ya tenía y no rompe nada', async () => {
    mocks.crear.mockRejectedValue(new Error('529 overloaded'));
    const memoria = await memoriaDeCapitulos(narrador({ resumenesCapitulos: { 'La infancia': 'viejo' } }), 8);
    expect(memoria).toContain('viejo');
    expect(memoria).not.toContain('Las raíces');
  });

  it('sin respuestas previas no llama al modelo ni guarda nada', async () => {
    mocks.respuestas = [];
    const memoria = await memoriaDeCapitulos(narrador(), 1);
    expect(memoria).toBe('');
    expect(mocks.crear).not.toHaveBeenCalled();
    expect(mocks.updates).toHaveLength(0);
  });
});

// C6 (bitácora de Ciro, 23/09): el resumidor leía SOLO las respuestas. Media
// conversación. Con Ciro escribió «Juventud descontrolada en Concordia» — él
// nunca nombró esa ciudad para su juventud: la única que aparecía en sus
// respuestas era "yo venía de Concordia", y el modelo, obligado a ubicar el
// capítulo, agarró la única que había. Buenos Aires estaba en NUESTRAS
// preguntas, que no le mandábamos. Medido sobre su material real: 2 de 3 antes,
// 0 de 6 después de mandar la pregunta.
describe('preguntaEnTexto — la pregunta entra al material del resumen', () => {
  const guion = new Map<number, { texto?: string | null }>([[8, { texto: "¿Cómo era un sábado a la noche?" }]]);

  it('manda la pregunta que de verdad recibió, no la del guion', () => {
    const enviadas = { "8": "¿Cómo era un sábado a la noche en Buenos Aires?" };
    expect(preguntaEnTexto(8, guion, enviadas)).toContain("en Buenos Aires");
  });

  it('sin personalizada guardada, cae en la del guion', () => {
    expect(preguntaEnTexto(8, guion, {})).toContain("¿Cómo era un sábado a la noche?");
  });

  it('sin ningún texto, queda la etiqueta sola y no rompe el material', () => {
    expect(preguntaEnTexto(9, new Map(), {})).toBe("Pregunta 9:");
    expect(preguntaEnTexto(8, guion, { "8": "   " })).toContain("¿Cómo era un sábado a la noche?");
  });

  it('el número de pregunta sigue estando: el orden cronológico se lee igual', () => {
    expect(preguntaEnTexto(8, guion, {})).toMatch(/^Pregunta 8 /);
  });
});
