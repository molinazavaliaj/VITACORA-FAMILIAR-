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

describe('el trato de la repregunta que escribe la evaluación', () => {
  beforeEach(() => crearMock.mockReset());

  // Bitácora 4: las 5 repreguntas del piloto salieron en usted con un narrador
  // de vos. El estilo del sistema pide el trato, pero el prompt tiene que
  // exigirlo en la repregunta misma, que es donde se juega el vínculo.
  it('con vos el prompt exige tuteo en la repregunta, con sus conjugaciones', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const p = PROMPT_EVALUAR('¿Cómo era su casa?', 'Linda.', 8, '', 'vos');
    expect(p).toContain('LA REPREGUNTA VA EN vos, SIN EXCEPCIÓN, con sus conjugaciones');
    expect(p).toContain('"¿cómo era tu casa?"');
    expect(p).toContain('"¿te acordás?"');
    expect(p).toContain('nunca "cuénteme"');
    expect(p).not.toContain('de usted de punta a punta');
  });

  it('con usted exige usted (y el default sigue siendo usted)', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    for (const p of [PROMPT_EVALUAR('¿Cómo era su casa?', 'Linda.', 8, '', 'usted'), PROMPT_EVALUAR('¿Cómo era su casa?', 'Linda.', 8)]) {
      expect(p).toContain('LA REPREGUNTA VA EN usted, SIN EXCEPCIÓN, con sus conjugaciones');
      expect(p).toContain('nunca "contame"');
      expect(p).not.toContain('de vos de punta a punta');
    }
  });

  it('evaluarRespuesta le pasa el trato al prompt de verdad', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    await evaluarRespuesta('¿Cómo era tu casa?', 'Era linda.', 12, '', 'vos');
    expect(crearMock.mock.calls.at(-1)![0].messages[0].content).toContain('LA REPREGUNTA VA EN vos');
  });

  // Bitácora 30 y 34 (Ciro): le preguntaron por los domingos familiares,
  // contestó que la familia era un desastre y pidió "vamos por otro lado" — y la
  // repregunta volvió derecho al tío y a las drogas. Para un abuelo, insistir en
  // una herida es contraproducente: si pidió cambiar de tema, no hay repregunta.
  it('si el narrador pide cambiar de tema, la respuesta alcanza y no se insiste', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const p = PROMPT_EVALUAR('¿Qué tradiciones había en su casa?', 'Una mierda, amigo. Mi familia era un desastre. Esto no era una película de Disney.', 40, '', 'vos');
    expect(p).toContain('SI PIDE CAMBIAR DE TEMA, SE LO ESCUCHA');
    expect(p).toContain('"vamos por otro lado"');
    expect(p).toContain('"prefiero no hablar de eso"');
    expect(p).toContain('"eso no lo pongas"');
    expect(p).toContain('la respuesta se da por SUFICIENTE');
    // Y no se insiste en lo que esquivó (bitácora 30): una sola invitación alcanza.
    expect(p).toContain('Tampoco se insiste en lo que esquivó');
  });
});

describe('la reserva: "esto que no vaya al libro" (hallazgo 19)', () => {
  beforeEach(() => crearMock.mockReset());

  it('el prompt pide marcar lo reservado, con los ejemplos reales', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const p = PROMPT_EVALUAR('¿Y aquella historia?', 'Estas historias prefiero que queden en mi mente, no en mi biografía.', 25, '', 'vos');
    expect(p).toContain('SI PIDE QUE ALGO NO VAYA AL LIBRO, SE ANOTA ACÁ');
    expect(p).toContain('"esto prefiero que no vaya al libro"');
    expect(p).toContain('"estas historias prefiero que queden en mi mente"');
    expect(p).toContain('"reservado": true');
    expect(p).toContain('"reservadoTramo"');
    // Ante la duda, reservar: publicar lo que pidió guardar es la peor falla.
    expect(p).toContain('marcá "reservado": true');
  });

  it('devuelve reservado cuando el modelo lo marca', async () => {
    crearMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"suficiente": true, "reservado": true}' }],
    });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Y aquella historia?', 'Estas historias prefiero que queden en mi mente.', 25);
    expect(r.reservado).toBe(true);
  });

  it('devuelve el tramo cuando reserva solo una parte', async () => {
    crearMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"suficiente": true, "reservado": true, "reservadoTramo": "locuras de las contables pueden ser por amor"}' }],
    });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Y aquella historia?', 'Trabajaba con las contables: locuras de las contables pueden ser por amor, y después volvía.', 25);
    expect(r.reservadoTramo).toBe('locuras de las contables pueden ser por amor');
  });
});

describe('reservaDe: qué se guarda como reservado', () => {
  it('sin pedido del narrador, no reserva nada', async () => {
    const { reservaDe } = await import('../src/ia/cerebro.js');
    expect(reservaDe({}, 'Cualquier cosa.')).toEqual({ reservada: false, tramo: null });
    expect(reservaDe({ reservado: false }, 'Cualquier cosa.')).toEqual({ reservada: false, tramo: null });
  });

  it('con reservado y sin tramo, reserva la respuesta entera', async () => {
    const { reservaDe } = await import('../src/ia/cerebro.js');
    expect(reservaDe({ reservado: true }, 'Estas historias que queden en mi mente.')).toEqual({ reservada: true, tramo: null });
  });

  it('con un tramo que está textual, lo guarda tal cual', async () => {
    const { reservaDe } = await import('../src/ia/cerebro.js');
    const texto = 'Trabajaba con las contables: locuras de las contables pueden ser por amor.';
    expect(reservaDe({ reservado: true, reservadoTramo: 'locuras de las contables pueden ser por amor' }, texto))
      .toEqual({ reservada: true, tramo: 'locuras de las contables pueden ser por amor' });
  });

  // Si el modelo parafrasea el tramo, sacarlo del texto no sacaría nada y lo
  // reservado se publicaría igual: se reserva la respuesta entera.
  it('con un tramo que NO está en la transcripción, reserva la respuesta entera', async () => {
    const { reservaDe } = await import('../src/ia/cerebro.js');
    const texto = 'Trabajaba con las contables y hacíamos locuras por amor.';
    expect(reservaDe({ reservado: true, reservadoTramo: 'las locuras de las contables' }, texto))
      .toEqual({ reservada: true, tramo: null });
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
