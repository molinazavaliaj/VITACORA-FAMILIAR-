import { describe, it, expect, vi, beforeEach } from 'vitest';

// El cerebro crea el cliente Anthropic al importarse (usa cargarConfig).
vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'clave');
vi.stubEnv('ANTHROPIC_API_KEY', 'clave');
vi.stubEnv('OPENAI_API_KEY', 'clave');
vi.stubEnv('WA_TOKEN', 'clave');
vi.stubEnv('WA_PHONE_NUMBER_ID', '123');
vi.stubEnv('WA_VERIFY_TOKEN', 'verificador');

const crearMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { create: crearMock }; },
}));

describe('el estilo del cerebro sigue el trato', () => {
  it('con vos tutea y no habla de una persona mayor', async () => {
    const { estiloCerebro } = await import('../src/ia/cerebro.js');
    const e = estiloCerebro('vos');
    expect(e).toContain('Le hablás de vos, con respeto y afecto genuino');
    expect(e).toContain('de la vida de una persona a partir de sus relatos por WhatsApp.');
    expect(e).not.toContain('de usted');
    expect(e).not.toContain('señor o señora mayor');
  });

  it('con usted queda como estaba', async () => {
    const { estiloCerebro } = await import('../src/ia/cerebro.js');
    const e = estiloCerebro('usted');
    expect(e).toContain('Le hablás de usted, con respeto y afecto genuino');
    expect(e).toContain('de la vida de un señor o señora mayor a partir de sus relatos por WhatsApp.');
    expect(e).not.toContain('de vos');
  });

  it('el default es usted', async () => {
    const { estiloCerebro } = await import('../src/ia/cerebro.js');
    expect(estiloCerebro()).toContain('Le hablás de usted');
  });
});

describe('el trato llega a la llamada', () => {
  it('evaluarRespuesta manda el estilo en vos', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    await evaluarRespuesta('¿Cómo era tu casa?', 'Era linda.', 12, '', 'vos');
    expect(crearMock.mock.calls.at(-1)![0].system).toContain('Le hablás de vos');
  });

  it('generarPreguntaReemplazo pide tratarlo de vos', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"texto": "¿Y el taller?", "capitulo": "El trabajo"}' }] });
    const { generarPreguntaReemplazo } = await import('../src/ia/cerebro.js');
    await generarPreguntaReemplazo('Ciro', 'Contó del taller.', ['La infancia'], 'Los hijos', '', 'vos');
    const llamada = crearMock.mock.calls.at(-1)![0];
    expect(llamada.messages[0].content).toContain('tratarlo de vos');
    expect(llamada.system).toContain('Le hablás de vos');
  });

  it('sin trato explícito sigue siendo usted', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    await evaluarRespuesta('¿Cómo era su casa?', 'Era linda.', 12);
    expect(crearMock.mock.calls.at(-1)![0].system).toContain('Le hablás de usted');
  });
});

describe('cerebro', () => {
  // Acá sí importa cuántas veces se llamó al modelo (reintentos): cada test
  // arranca con el contador en cero.
  beforeEach(() => crearMock.mockReset());

  it('genera un reconocimiento de una sola frase', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: 'Qué historia la del taller de su padre, Don Roberto.' }] });
    const { generarReconocimiento } = await import('../src/ia/cerebro.js');
    const frase = await generarReconocimiento('Don Roberto', 'Mi padre tenía un taller...', '¿Cómo era su casa?', '');
    expect(frase).toContain('taller');
  });

  it('evalúa una respuesta corta como insuficiente y trae repregunta', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": false, "repregunta": "¿Y qué sentía usted en ese taller?"}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8);
    expect(r.suficiente).toBe(false);
    expect(r.repregunta).toBeTruthy();
  });

  it('una respuesta larga y rica pasa sin repregunta', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Era una casa de adobe con un patio enorme donde...', 95);
    expect(r.suficiente).toBe(true);
  });

  // Esto no es una precaución teórica: medido con el prompt real de la
  // evaluación, Haiku 4.5 devolvió el JSON dentro de un bloque de código 5 de 5
  // veces (y Opus lo hace de vez en cuando). Antes, eso tiraba la corrida.
  it('lee el JSON aunque venga dentro de un bloque de código', async () => {
    crearMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '```json\n{"suficiente": false, "repregunta": "¿Y qué sentía en ese taller?"}\n```' }],
    });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8);
    expect(r.suficiente).toBe(false);
    expect(r.repregunta).toContain('taller');
  });

  it('si el JSON viene cortado no revienta: sigue sin repregunta', async () => {
    crearMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '```json\n{\n  "suficiente": false,\n  "repregunta": "¿Recuerda algún momento en el que ella se di' }],
    });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8);
    expect(r.suficiente).toBe(true);
    expect(r.repregunta).toBeUndefined();
  });

  // Bitácora 14 y 31: 4 de 30 evaluaciones del piloto volvieron SIN TEXTO y la
  // excepción cortaba el día entero (sin repregunta y, si era la última, sin
  // despedida). Un hipo del modelo no puede tumbar la entrevista.
  it('si el modelo vuelve vacío, reintenta una vez y sigue sin repregunta', async () => {
    crearMock.mockResolvedValue({ content: [] }); // sin bloque de texto
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8, '', 'usted', { pausaMs: 0 });
    expect(crearMock).toHaveBeenCalledTimes(2); // el reintento
    expect(r).toEqual({ suficiente: true });
    crearMock.mockReset();
  });

  it('si el modelo tira un error de la API, tampoco rompe', async () => {
    crearMock.mockRejectedValue(new Error('529 overloaded'));
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8, '', 'usted', { pausaMs: 0 });
    expect(crearMock).toHaveBeenCalledTimes(2);
    expect(r).toEqual({ suficiente: true });
    crearMock.mockReset();
  });

  it('si el reintento sale bien, se usa ESA evaluación (no se pierde la repregunta)', async () => {
    crearMock
      .mockResolvedValueOnce({ content: [] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": false, "repregunta": "¿Y qué sentía usted en ese taller?"}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo era su casa?', 'Linda.', 8, '', 'usted', { pausaMs: 0 });
    expect(r.suficiente).toBe(false);
    expect(r.repregunta).toContain('taller');
  });
});

describe('extraerJson', () => {
  it('saca el JSON limpio de un texto con explicaciones alrededor', async () => {
    const { extraerJson } = await import('../src/ia/cerebro.js');
    expect(extraerJson<{ a: number }>('Claro, acá va:\n{"a": 1}\nEspero que sirva.', null)).toEqual({ a: 1 });
  });

  it('devuelve el respaldo cuando no hay nada que parsear', async () => {
    const { extraerJson } = await import('../src/ia/cerebro.js');
    expect(extraerJson<{ a: number }>('No tengo idea.', { a: 9 })).toEqual({ a: 9 });
    expect(extraerJson<{ a: number }>('', null)).toBeNull();
  });
});
