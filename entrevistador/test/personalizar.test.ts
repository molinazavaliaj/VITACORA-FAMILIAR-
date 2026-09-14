import { describe, it, expect, vi, beforeEach } from 'vitest';

// personalizar.ts importa el cliente de la base (config al importarse) y el SDK.
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
  updates: [] as { tabla: string; p: any }[],
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

const { esPersonalizacionValida, contarPreguntas, contarPalabras, personalizarPregunta, PROMPT_PERSONALIZAR } =
  await import('../src/ia/personalizar.js');
const { arbolEtiquetado, fichaEnTexto } = await import('../src/ia/ficha.js');

// Los pares original/personalizada son REALES: salieron de correr el prototipo
// contra las 30 respuestas del set dorado (la vida de Osvaldo).
const ORIGINAL_NOVIAZGO =
  '¿Cómo era el noviazgo en esa época? Cuénteme el día que la presentó en su casa — ¿qué dijeron sus padres, cómo lo recibieron sus suegros? ¿Y cómo fue la propuesta de casamiento y el día de la boda?';
const PERSONALIZADA_COMPLETA =
  'Don Osvaldo, ¿cómo fue llevarla a Élida a la casa de Ramón y Haydée? ¿Qué dijeron sus padres cuando la conocieron? ¿Y cómo fue la propuesta, el casamiento y el día de la boda?';
const PERSONALIZADA_INCOMPLETA =
  'Entonces el Flaco lo empujó y salió caminando de trompo hasta ella. ¿Qué le dijo en ese momento? Y después, ¿cómo fue llevar a Élida a la casa, qué dijeron Ramón y Haydée cuando la conocieron?';

describe('esPersonalizacionValida', () => {
  it('acepta una versión que conserva todas las preguntas del original', () => {
    expect(esPersonalizacionValida(ORIGINAL_NOVIAZGO, PERSONALIZADA_COMPLETA)).toBe(true);
    expect(contarPreguntas(ORIGINAL_NOVIAZGO)).toBe(contarPreguntas(PERSONALIZADA_COMPLETA));
  });

  it('RECHAZA la que perdió una parte (el caso real que motivó el guardrail)', () => {
    expect(contarPreguntas(PERSONALIZADA_INCOMPLETA)).toBeLessThan(contarPreguntas(ORIGINAL_NOVIAZGO));
    expect(esPersonalizacionValida(ORIGINAL_NOVIAZGO, PERSONALIZADA_INCOMPLETA)).toBe(false);
  });

  it('rechaza una respuesta vacía o sin sustancia', () => {
    expect(esPersonalizacionValida(ORIGINAL_NOVIAZGO, '')).toBe(false);
    expect(esPersonalizacionValida(ORIGINAL_NOVIAZGO, '   ')).toBe(false);
  });

  it('rechaza algo que ya no se puede leer en un celular', () => {
    const larga = `${'¿Cuénteme de aquella época? '.repeat(20)}`;
    expect(contarPalabras(larga)).toBeGreaterThan(60);
    expect(esPersonalizacionValida('¿Cuénteme de aquella época?', larga)).toBe(false);
  });

  it('con una pregunta imperativa (sin signos) no exige signos, pero sí sustancia', () => {
    expect(esPersonalizacionValida('Hábleme de sus hermanos.', 'Hábleme del Rubén y de la Marta.')).toBe(true);
    expect(esPersonalizacionValida('Hábleme de sus hermanos.', 'Ok.')).toBe(false);
  });

  it('lo que el modelo devuelve igual al original es válido', () => {
    expect(esPersonalizacionValida(ORIGINAL_NOVIAZGO, ORIGINAL_NOVIAZGO)).toBe(true);
  });
});

describe('la ficha que se le pasa al modelo', () => {
  it('nombra el rol de cada persona (el bug de la madre confundida)', () => {
    const arbol = arbolEtiquetado({ arbol: { padres: 'Ramón y Haydée', conyuge: 'Élida', hijos: 'Claudia', hermanos: '' } });
    expect(arbol).toContain('Sus padres: Ramón y Haydée');
    expect(arbol).toContain('Su esposa / el amor de su vida: Élida');
    expect(arbol).toContain('Sus hijos: Claudia');
    expect(arbol).not.toContain('hermanos:');
  });

  it('junta árbol, lugar, oficio y año', () => {
    const ficha = fichaEnTexto({
      arbol: { conyuge: 'Élida' }, lugarNacimiento: 'Avellaneda', oficio: 'mecánico', anioNacimiento: 1952,
    }, 'Don Osvaldo');
    expect(ficha).toContain('El narrador es Don Osvaldo');
    expect(ficha).toContain('Avellaneda');
    expect(ficha).toContain('mecánico');
    expect(ficha).toContain('1952');
  });

  it('sin datos no inventa nada', () => {
    expect(fichaEnTexto({}, 'Joaquín')).toBe('El narrador es Joaquín.');
  });
});

describe('PROMPT_PERSONALIZAR', () => {
  const prompt = PROMPT_PERSONALIZAR('¿A qué jugaba de chico?', 'Sus padres: Ramón y Haydée.', 'Lo que contó el día 1: jugaba en el patio.');

  it('lleva la ficha con roles y lo que ya contó', () => {
    expect(prompt).toContain('Sus padres: Ramón y Haydée');
    expect(prompt).toContain('jugaba en el patio');
    expect(prompt).toContain('¿A qué jugaba de chico?');
  });

  it('lleva las reglas que evitan los errores reales', () => {
    expect(prompt).toContain('RESPETÁ EL PARENTESCO');
    expect(prompt).toContain('CONSERVÁ TODAS LAS PREGUNTAS');
    expect(prompt).toContain('NUNCA inventes');
  });
});

describe('personalizarPregunta', () => {
  const narrador = { id: 'n1', como_le_dicen: 'Don Osvaldo', contexto: { arbol: { conyuge: 'Élida' } } };

  const respuesta = (texto: string) => ({ content: [{ type: 'text', text: texto }], usage: {} });

  beforeEach(() => {
    mocks.crear.mockReset();
    mocks.updates = [];
    mocks.respuestas = [{ pregunta_orden: 13, transcripcion: 'La conocí en un baile...', texto_directo: null }];
  });

  it('devuelve la versión personalizada y la guarda para el panel', async () => {
    mocks.crear.mockResolvedValue(respuesta('¿Cómo conoció a Élida? Lléveme a ese día.'));
    const r = await personalizarPregunta(narrador, '¿Cómo conoció al amor de su vida? Lléveme a ese día.', 14);
    expect(r.personalizada).toBe(true);
    expect(r.texto).toBe('¿Cómo conoció a Élida? Lléveme a ese día.');
    const guardado = mocks.updates.find((u) => u.tabla === 'narradores');
    expect(guardado?.p.contexto.preguntasEnviadas['14']).toBe('¿Cómo conoció a Élida? Lléveme a ese día.');
  });

  it('manda el ORIGINAL si el modelo se comió una parte', async () => {
    mocks.crear.mockResolvedValue(respuesta(PERSONALIZADA_INCOMPLETA));
    const r = await personalizarPregunta(narrador, ORIGINAL_NOVIAZGO, 14);
    expect(r.texto).toBe(ORIGINAL_NOVIAZGO);
    expect(r.personalizada).toBe(false);
    expect(r.motivo).toMatch(/no conservaba/);
    // Y no queda guardada una versión que nunca se mandó.
    expect(mocks.updates.find((u) => u.tabla === 'narradores')).toBeUndefined();
  });

  it('manda el ORIGINAL si el modelo falla (el entrevistador nunca se queda sin pregunta)', async () => {
    mocks.crear.mockRejectedValue(new Error('529 overloaded'));
    const r = await personalizarPregunta(narrador, '¿Cómo era su casa?', 1);
    expect(r.texto).toBe('¿Cómo era su casa?');
    expect(r.motivo).toMatch(/falló/);
  });

  it('reusa la guardada en un envío anterior: no se le paga dos veces al modelo', async () => {
    const yaGuardada = { ...narrador, contexto: { ...narrador.contexto, preguntasEnviadas: { 14: '¿Cómo conoció a Élida?' } } };
    const r = await personalizarPregunta(yaGuardada, '¿Cómo conoció al amor de su vida?', 14);
    expect(r.texto).toBe('¿Cómo conoció a Élida?');
    expect(mocks.crear).not.toHaveBeenCalled();
  });

  it('sin nada contado todavía, igual pide la personalización (el día 1 usa la ficha)', async () => {
    mocks.respuestas = [];
    mocks.crear.mockResolvedValue(respuesta('¿Cómo era esa casa en Avellaneda?'));
    const r = await personalizarPregunta(narrador, '¿Cómo era su casa?', 1);
    expect(r.personalizada).toBe(true);
    const enviado = mocks.crear.mock.calls[0][0].messages[0].content as string;
    expect(enviado).toContain('todavía no contó nada');
    expect(enviado).toContain('Su esposa / el amor de su vida: Élida');
  });

  it('con recordar:false la mira pero no la congela (pregunta que todavía no se mandó)', async () => {
    mocks.crear.mockResolvedValue(respuesta('¿Cómo era esa casa en Avellaneda?'));
    const r = await personalizarPregunta(narrador, '¿Cómo era su casa?', 1, { recordar: false });
    expect(r.personalizada).toBe(true);
    expect(mocks.updates.find((u) => u.tabla === 'narradores')).toBeUndefined();
  });

  it('le pasa la memoria de los capítulos ya cerrados (para no repetir lo ya contado)', async () => {
    const conMemoria = {
      ...narrador,
      contexto: { ...narrador.contexto, resumenesCapitulos: { 'La infancia': 'Villa Domínico, el limonero, la señorita Nélida.' } },
    };
    mocks.crear.mockResolvedValue(respuesta('¿Cómo era ese patio con la bomba y el limonero?'));
    await personalizarPregunta(conMemoria, '¿Cómo era su casa?', 8);
    const enviado = mocks.crear.mock.calls[0][0].messages[0].content as string;
    expect(enviado).toContain('MEMORIA DE LOS CAPÍTULOS QUE YA CERRÓ');
    expect(enviado).toContain('Villa Domínico, el limonero, la señorita Nélida.');
    expect(mocks.crear).toHaveBeenCalledTimes(1); // el resumen ya estaba: no se regenera
  });

  // Lo que contesta cuando se le repregunta suele ser lo mejor de la historia:
  // tiene que llegarle al biógrafo, marcado como ampliación de esa misma pregunta.
  it('incluye lo que contó al ampliar, agrupado con su pregunta', async () => {
    mocks.respuestas = [
      { pregunta_orden: 1, narrador_id: 'n1', es_repregunta: false, transcripcion: 'Una casa común.', texto_directo: null },
      { pregunta_orden: 1, narrador_id: 'n1', es_repregunta: true, transcripcion: 'La bomba del patio la puso mi viejo.', texto_directo: null },
    ];
    mocks.crear.mockResolvedValue(respuesta('¿Cómo era ese patio con la bomba?'));
    await personalizarPregunta(narrador, '¿Cómo era su casa?', 2, { recordar: false });
    const enviado = mocks.crear.mock.calls[0][0].messages[0].content as string;
    expect(enviado).toContain('Una casa común.');
    expect(enviado).toContain('(le repregunté y amplió): La bomba del patio la puso mi viejo.');
  });
});
