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

const { memoriaDeCapitulos, limpiarResumen, PROMPT_RESUMEN, MAX_PALABRAS_RESUMEN, MAX_CARACTERES_RESUMEN } = await import('../src/ia/resumenes.js');

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
      return texto(contenido.includes('infancia') ? 'RESUMEN INFANCIA' : 'RESUMEN RAICES');
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
      narrador({ resumenesCapitulos: { 'La infancia': 'ya resumido', 'Las raíces': 'también' } }), 8,
    );
    expect(memoria).toContain('ya resumido');
    expect(memoria).toContain('también');
    expect(mocks.crear).not.toHaveBeenCalled();
    expect(mocks.updates).toHaveLength(0);
  });

  it('sólo resume lo que falta y guarda el resultado', async () => {
    mocks.crear.mockResolvedValue(texto('RESUMEN NUEVO'));
    const memoria = await memoriaDeCapitulos(narrador({ resumenesCapitulos: { 'La infancia': 'viejo' } }), 8);
    expect(memoria).toContain('viejo');
    expect(memoria).toContain('RESUMEN NUEVO');
    expect(mocks.crear).toHaveBeenCalledTimes(1); // sólo "Las raíces"
    const guardado = mocks.updates[0];
    expect(guardado.p.contexto.resumenesCapitulos['La infancia']).toBe('viejo');
    expect(guardado.p.contexto.resumenesCapitulos['Las raíces']).toBe('RESUMEN NUEVO');
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
