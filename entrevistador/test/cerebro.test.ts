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

  // Bitácora 34, el otro lado: el tema pedido tiene que quedar anotado para el
  // resto de la entrevista, así que el modelo lo nombra en `dejarTema`.
  it('cuando pide cambiar de tema, el modelo nombra el tema (dejarTema) para anotarlo', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const p = PROMPT_EVALUAR('¿Cómo eran los domingos?', 'Mi tío se drogaba, o sea, vamos por otro lado.', 30, '', 'vos');
    expect(p).toContain('agregá "dejarTema"');
    expect(p).toContain('Solo con pedido explícito: esquivar no es pedir');
    expect(p).toMatch(/Respondé SOLO con JSON.*"dejarTema"/);
  });

  // C1 (Ciro, 16/09) y pedido de Naza (23/09): "no puede repreguntar cosas dichas jamás". Contestó
  // "no sé nada de mis abuelos" y la repregunta le pidió "¿de tus abuelos te acordás de alguno?",
  // cuando el primer día había contado que su abuela le cocinaba todos los días. La evaluación no
  // veía lo que había contado antes: es un problema de ENTRADA, no de una regla más.
  it('con lo que ya contó, la evaluación lo ve y tiene prohibido pedirlo de nuevo', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const p = PROMPT_EVALUAR('¿Cómo se llevaban sus abuelos?', 'No sé nada de mis abuelos.', 20, '', 'vos', [], 0,
      'Personas:\n- (sin nombre), abuela materna — vive. Le cocinaba todos los días.');
    expect(p).toContain('LO QUE YA CONTÓ OTROS DÍAS');
    expect(p).toContain('abuela materna');
    expect(p).toContain('LA REPREGUNTA NUNCA PIDE LO QUE YA CONTÓ');
  });

  it('sin lo que ya contó, el prompt es el mismo de siempre (producción no cambia)', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const antes = PROMPT_EVALUAR('¿Cómo era su casa?', 'Linda.', 8, '', 'vos', [], 0);
    expect(PROMPT_EVALUAR('¿Cómo era su casa?', 'Linda.', 8, '', 'vos', [], 0, '')).toBe(antes);
    expect(antes).not.toContain('LO QUE YA CONTÓ OTROS DÍAS');
  });

  it('evaluarRespuesta le pasa al modelo lo que ya contó', async () => {
    crearMock.mockResolvedValue({ content: [{ type: 'text', text: '{"suficiente": true}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    await evaluarRespuesta('¿Y sus abuelos?', 'No sé nada.', 10, '', 'vos', { pausaMs: 0, loQueYaConto: 'su abuela le cocinaba' });
    expect(JSON.stringify(crearMock.mock.calls.at(-1))).toContain('su abuela le cocinaba');
  });

  it('evaluarRespuesta devuelve dejarTema tal como vino', async () => {
    crearMock.mockResolvedValue({ content: [{ type: 'text', text: '{"suficiente": true, "dejarTema": "su tío y las drogas"}' }] });
    const { evaluarRespuesta } = await import('../src/ia/cerebro.js');
    const r = await evaluarRespuesta('¿Cómo eran los domingos?', 'Mi tío se drogaba, vamos por otro lado.', 30, '', 'vos', { pausaMs: 0 });
    expect(r).toEqual({ suficiente: true, dejarTema: 'su tío y las drogas' });
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

  // Un tramo sin el booleano es un pedido igual: el modelo contesta a medias y no
  // se puede perder la reserva por eso (es la peor falla del producto).
  it('un tramo solo, sin "reservado", también reserva', async () => {
    const { reservaDe } = await import('../src/ia/cerebro.js');
    const texto = 'Trabajaba con las contables: locuras de las contables pueden ser por amor.';
    expect(reservaDe({ reservadoTramo: 'locuras de las contables pueden ser por amor' }, texto))
      .toEqual({ reservada: true, tramo: 'locuras de las contables pueden ser por amor' });
  });

  it('un "reservado" que vino como texto ("true", "sí") reserva la respuesta entera', async () => {
    const { reservaDe } = await import('../src/ia/cerebro.js');
    for (const marcado of ['true', 'sí', 'SI', 'yes', true]) {
      expect(reservaDe({ reservado: marcado }, 'Estas historias que queden en mi mente.'))
        .toEqual({ reservada: true, tramo: null });
    }
    // Pero un "no" explícito, sin tramo, no reserva nada.
    expect(reservaDe({ reservado: 'no' }, 'Contó la historia.')).toEqual({ reservada: false, tramo: null });
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

describe('detectarReservaYDejarTema: las marcas de las respuestas que no se evalúan', () => {
  beforeEach(() => crearMock.mockReset());

  const AMPLIACION =
    'Y ahora que me acuerdo: mi tío se drogaba, o sea, vamos por otro lado, porque por ahí, boludo.';

  it('el prompt pide SOLO las dos marcas, con los ejemplos reales', async () => {
    const { PROMPT_MARCAS } = await import('../src/ia/cerebro.js');
    const p = PROMPT_MARCAS(AMPLIACION);
    expect(p).toContain('Fijate SOLO dos cosas');
    expect(p).toContain('"esto prefiero que no vaya al libro"');
    expect(p).toContain('"vamos por otro lado"');
    expect(p).toContain('devolvé {}');
    // No pide juzgar la respuesta: no hay suficiencia ni repregunta acá.
    expect(p).not.toContain('suficiente');
    expect(p).not.toContain('repregunta');
  });

  it('una ampliación que pide reservar una parte queda marcada con ese tramo', async () => {
    crearMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"reservado": true, "reservadoTramo": "locuras de las contables pueden ser por amor"}' }],
    });
    const { detectarReservaYDejarTema } = await import('../src/ia/cerebro.js');
    const r = await detectarReservaYDejarTema('Y después: locuras de las contables pueden ser por amor, nada más.');
    expect(r.reserva).toEqual({ reservada: true, tramo: 'locuras de las contables pueden ser por amor' });
    expect(r.dejarTema).toBeNull();
  });

  it('una ampliación que pide dejar el tema lo devuelve, y no reserva nada', async () => {
    crearMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: `{"dejarTema": "su tío y las drogas"}` }],
    });
    const { detectarReservaYDejarTema } = await import('../src/ia/cerebro.js');
    const r = await detectarReservaYDejarTema(AMPLIACION);
    expect(r.dejarTema).toBe('su tío y las drogas');
    expect(r.reserva).toEqual({ reservada: false, tramo: null });
  });

  it('sin pedido explícito, no hay nada que anotar', async () => {
    crearMock.mockResolvedValueOnce({ content: [{ type: 'text', text: '{}' }] });
    const { detectarReservaYDejarTema } = await import('../src/ia/cerebro.js');
    const r = await detectarReservaYDejarTema('Contó los domingos en la casa de la abuela.');
    expect(r).toEqual({ reserva: { reservada: false, tramo: null }, dejarTema: null });
  });

  it('un tramo que no está textual reserva la respuesta entera (mismo criterio que la evaluación)', async () => {
    crearMock.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"reservado": true, "reservadoTramo": "las locuras de las contables"}' }],
    });
    const { detectarReservaYDejarTema } = await import('../src/ia/cerebro.js');
    const r = await detectarReservaYDejarTema('Hacíamos locuras por amor, nada más.');
    expect(r.reserva).toEqual({ reservada: true, tramo: null });
  });

  it('si el modelo falla, no rompe: reintenta y devuelve sin marcas', async () => {
    crearMock
      .mockRejectedValueOnce(new Error('529 overloaded'))
      .mockRejectedValueOnce(new Error('529 overloaded'));
    const { detectarReservaYDejarTema } = await import('../src/ia/cerebro.js');
    const r = await detectarReservaYDejarTema(AMPLIACION, 'vos', { pausaMs: 0 });
    expect(crearMock).toHaveBeenCalledTimes(2);
    expect(r).toEqual({ reserva: { reservada: false, tramo: null }, dejarTema: null });
  });

  it('si el reintento sale bien, se anota igual', async () => {
    crearMock
      .mockResolvedValueOnce({ content: [] })
      .mockResolvedValueOnce({ content: [{ type: 'text', text: '{"reservado": true}' }] });
    const { detectarReservaYDejarTema } = await import('../src/ia/cerebro.js');
    const r = await detectarReservaYDejarTema('Estas historias prefiero que queden en mi mente.', 'vos', { pausaMs: 0 });
    expect(r.reserva).toEqual({ reservada: true, tramo: null });
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

// El recuerdo que aparece tarde (decisión de Naza, 21/09): el narrador contesta
// la 9 y ahí se acuerda de algo de la 2. Es una MARCA para que la fábrica lo
// ubique en su capítulo — no una bifurcación de la charla.
describe('un recuerdo de otra parte: la marca, sin reencuadrar', () => {
  const HECHAS = [
    { orden: 1, capitulo: 'La infancia', texto: '¿Dónde nació y cómo era esa casa?' },
    { orden: 2, capitulo: 'La infancia', texto: '¿A qué jugaba de chico, y con quién?' },
    { orden: 8, capitulo: 'El trabajo', texto: '¿Cómo fue su primer trabajo?' },
  ];
  beforeEach(() => crearMock.mockReset());

  // Regla dura primero: el bot nunca reencuadra en el momento.
  it('(a) el prompt prohíbe mencionar el cambio de tema o pedir que vuelva, y pide la marca solo si está seguro', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const p = PROMPT_EVALUAR('¿Cómo fue su primer trabajo?', 'Mi primer trabajo... y me acuerdo de chico, en el patio de Villa Domínico, con el Rubén...', 90, '', 'usted', HECHAS, 9);
    expect(p).toContain('SI SE FUE A OTRO TEMA, NO SE LO REENCUADRA');
    expect(p).toContain('NUNCA menciona el cambio de tema, NUNCA le pide que vuelva a la pregunta de hoy');
    expect(p).toContain('"temaDeOrden"');
    expect(p).toContain('Si contestó la pregunta de hoy, aunque haya tocado otros temas de paso, o si dudás, los dos van en null');
    // La lista que ve, con orden y capítulo, solo las anteriores a la de hoy.
    expect(p).toContain('2 · La infancia · ¿A qué jugaba de chico, y con quién?');
    expect(p).toContain('8 · El trabajo');
  });

  it('(a bis) sin preguntas anteriores no se le pide la marca (no hay a dónde mandar el recuerdo)', async () => {
    const { PROMPT_EVALUAR } = await import('../src/ia/cerebro.js');
    const p = PROMPT_EVALUAR('¿Dónde nació?', 'En Pelliza.', 30, '', 'usted', [], 1);
    expect(p).toContain('NO SE LO REENCUADRA'); // la regla dura va siempre
    expect(p).not.toContain('LAS PREGUNTAS QUE YA RESPONDIÓ');
    expect(p).not.toContain('marcá a qué pregunta anterior');
  });

  // Y la respuesta del bot: una evaluación con marca no trae ningún texto que
  // reencuadre — vuelve suficiente, sin repregunta, y la marca aparte.
  it('(b) una respuesta que recuerda un tema anterior vuelve con la marca y sin repregunta que lo interrumpa', async () => {
    crearMock.mockResolvedValue({ content: [{ type: 'text', text: '{"suficiente": true, "temaDeOrden": 2, "temaMotivo": "cuenta los juegos en el patio con el Rubén, que es la pregunta 2"}' }] });
    const { evaluarRespuesta, temaDe } = await import('../src/ia/cerebro.js');
    const e = await evaluarRespuesta('¿Cómo fue su primer trabajo?', 'Y me acuerdo de chico...', 90, '', 'usted', { pausaMs: 0, preguntasHechas: HECHAS, ordenActual: 9 });
    expect(e.repregunta).toBeUndefined();
    expect(temaDe(e, HECHAS, 9)).toEqual({ temaDeOrden: 2, temaMotivo: 'cuenta los juegos en el patio con el Rubén, que es la pregunta 2' });
    // El prompt de verdad llevó la lista.
    expect(crearMock.mock.calls[0][0].messages[0].content).toContain('LAS PREGUNTAS QUE YA RESPONDIÓ ANTES');
  });

  it('(c) si el modelo duda (null) no hay marca; y una orden que no está en la lista, o la de hoy, tampoco', async () => {
    const { temaDe } = await import('../src/ia/cerebro.js');
    expect(temaDe({ temaDeOrden: null, temaMotivo: null }, HECHAS, 9)).toBeNull();
    expect(temaDe({}, HECHAS, 9)).toBeNull();
    expect(temaDe({ temaDeOrden: 5, temaMotivo: 'inventada' }, HECHAS, 9)).toBeNull(); // no está en la lista
    expect(temaDe({ temaDeOrden: 9, temaMotivo: 'la de hoy' }, HECHAS, 9)).toBeNull(); // la misma pregunta
    expect(temaDe({ temaDeOrden: 8.5 as number }, HECHAS, 9)).toBeNull();
    // Un "2" como texto se acepta (el JSON del modelo no está tipado); el motivo vacío queda null.
    expect(temaDe({ temaDeOrden: '2' as unknown as number, temaMotivo: '  ' }, HECHAS, 9)).toEqual({ temaDeOrden: 2, temaMotivo: null });
  });
});
