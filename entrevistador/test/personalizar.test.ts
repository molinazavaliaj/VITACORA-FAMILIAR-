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

const { esPersonalizacionValida, contarPreguntas, contarPalabras, personalizarPregunta, PROMPT_PERSONALIZAR, rompeElTrato, marcasDelTratoAjeno } =
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

  // El estado civil del alta (21/09): así el biógrafo no pregunta por una boda
  // que no hubo, ni por "su esposa" a alguien viudo.
  it('el estado civil del alta entra a la ficha, en palabras; uno desconocido no', () => {
    expect(fichaEnTexto({ estadoCivil: 'viudo' }, 'Don Osvaldo')).toBe('El narrador es Don Osvaldo. Es viudo: su pareja ya no vive.');
    expect(fichaEnTexto({ estadoCivil: 'soltero', anioNacimiento: 1998 }, 'Joaquín')).toContain('Es soltero: nunca se casó.');
    expect(fichaEnTexto({ estadoCivil: 'complicado' }, 'Joaquín')).toBe('El narrador es Joaquín.');
  });

  // 22/09: los temas que eligió quien compró, y lo que no puede faltar. No
  // cambian qué preguntas existen: le dicen al biógrafo hacia dónde llevarlas.
  it('los temas elegidos y lo imprescindible entran a la ficha, en palabras', () => {
    const f = fichaEnTexto({ temas: ['oficio', 'origen'], imprescindible: 'la casa de Pelliza' }, 'Don Osvaldo');
    expect(f).toContain('Le interesa hablar de');
    expect(f).toContain('su trabajo y lo que construyó');
    expect(f).toContain('de dónde vino su familia');
    expect(f).toContain('No puede faltar: la casa de Pelliza.');
  });
  it('un tema desconocido se ignora y una lista vacía no ensucia la ficha', () => {
    expect(fichaEnTexto({ temas: ['futbol'] }, 'Joaquín')).toBe('El narrador es Joaquín.');
    expect(fichaEnTexto({ temas: [], imprescindible: '   ' }, 'Joaquín')).toBe('El narrador es Joaquín.');
  });

  // 3t.22 (21/09): la compra pregunta dónde vive; entra a la ficha como el lugar de nacimiento.
  it('dónde vive entra a la ficha', () => {
    expect(fichaEnTexto({ dondeVive: 'Rosario, Argentina' }, 'Joaquín')).toBe('El narrador es Joaquín. Vive en Rosario, Argentina.');
    expect(fichaEnTexto({ dondeVive: '   ' }, 'Joaquín')).toBe('El narrador es Joaquín.');
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
  // El trato va decidido a propósito: así estos tests miden la personalización
  // y no la llamada con la que `tratoDe` lo elige la primera vez (eso se prueba
  // aparte, en «el trato manda en el prompt de la pregunta del día»).
  const narrador = { id: 'n1', como_le_dicen: 'Don Osvaldo', contexto: { arbol: { conyuge: 'Élida' }, trato: 'usted' } };

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

describe('el segundo intento cuando el fallback rompería el trato (bitácora 18)', () => {
  const respuesta = (texto: string) => ({ content: [{ type: 'text', text: texto }], usage: {} });
  const ciro = { id: 'n1', como_le_dicen: 'Ciro', contexto: { anioNacimiento: 1998, trato: 'vos' as const } };
  const PERSONALIZADA_EN_VOS =
    '¿Y cómo fue llevarla a la casa de Ramón y Haydée? ¿Qué dijeron cuando la conocieron? ¿Y cómo fue la propuesta, el casamiento y el día de la boda?';

  beforeEach(() => {
    mocks.crear.mockReset();
    mocks.updates = [];
    mocks.respuestas = [{ pregunta_orden: 13, transcripcion: 'La conocí en un baile...', texto_directo: null }];
  });

  // El fallback son las 26 fijas, escritas de usted: con un narrador de vos
  // eso rompe el trato a mitad de la entrevista (pasó 4 de 26 en el piloto).
  it('con vos: si el primero se comió una parte, prueba el prompt corto y usa ese', async () => {
    mocks.crear
      .mockResolvedValueOnce(respuesta(PERSONALIZADA_INCOMPLETA))
      .mockResolvedValueOnce(respuesta(PERSONALIZADA_EN_VOS));
    const r = await personalizarPregunta(ciro, ORIGINAL_NOVIAZGO, 14);
    expect(mocks.crear).toHaveBeenCalledTimes(2);
    expect(r.personalizada).toBe(true);
    expect(r.texto).toBe(PERSONALIZADA_EN_VOS);
    // El segundo prompt exige el trato y conserva todas las preguntas.
    const segundo = mocks.crear.mock.calls[1][0].messages[0].content as string;
    expect(segundo).toContain('a alguien a quien tratás de VOS');
    expect(segundo).toContain('MISMAS preguntas');
    expect(segundo).toContain(ORIGINAL_NOVIAZGO);
    // Y lo que se manda queda guardado para el panel.
    expect(mocks.updates.find((u) => u.tabla === 'narradores')?.p.contexto.preguntasEnviadas['14']).toBe(PERSONALIZADA_EN_VOS);
  });

  it('con vos: si los dos fallan, manda el original y no guarda nada', async () => {
    mocks.crear.mockResolvedValue(respuesta(PERSONALIZADA_INCOMPLETA));
    const r = await personalizarPregunta(ciro, ORIGINAL_NOVIAZGO, 14);
    expect(mocks.crear).toHaveBeenCalledTimes(2);
    expect(r.texto).toBe(ORIGINAL_NOVIAZGO);
    expect(r.personalizada).toBe(false);
    expect(r.motivo).toMatch(/no conservaba/);
    expect(mocks.updates.find((u) => u.tabla === 'narradores')).toBeUndefined();
  });

  // La orden 26 ("cuénteme su vida en cinco minutos") no tiene nada concreto
  // para enganchar, así que el modelo devolvió el original tal cual... escrito
  // de usted, a un narrador de vos. "Ni se intentó personalizar" (17/09).
  it('con vos: si el modelo devuelve el original textual (en usted), va al prompt corto', async () => {
    const ORIGINAL_26 = 'Ya me contó su vida entera, capítulo por capítulo. Cuénteme su vida en cinco minutos. Lo que no puede faltar.';
    const EN_VOS_26 = 'Ya me contaste tu vida entera, capítulo por capítulo. Contame tu vida en cinco minutos. Lo que no puede faltar.';
    mocks.crear
      .mockResolvedValueOnce(respuesta(ORIGINAL_26))
      .mockResolvedValueOnce(respuesta(EN_VOS_26));
    const r = await personalizarPregunta(ciro, ORIGINAL_26, 26);
    expect(mocks.crear).toHaveBeenCalledTimes(2);
    expect(r.texto).toBe(EN_VOS_26);
    expect(r.personalizada).toBe(true);
  });

  it('con vos: si el original textual vuelve dos veces, se manda igual y se dice por qué', async () => {
    const ORIGINAL_26 = 'Cuénteme su vida en cinco minutos. Lo que no puede faltar.';
    mocks.crear.mockResolvedValue(respuesta(ORIGINAL_26));
    const r = await personalizarPregunta(ciro, ORIGINAL_26, 26);
    expect(mocks.crear).toHaveBeenCalledTimes(2);
    expect(r.texto).toBe(ORIGINAL_26);
    expect(r.personalizada).toBe(false);
    expect(r.motivo).toMatch(/en usted/);
  });

  it('con usted, el original textual es un resultado válido (no paga un segundo intento)', async () => {
    const osvaldo = { id: 'n1', como_le_dicen: 'Don Osvaldo', contexto: { trato: 'usted' as const } };
    mocks.crear.mockResolvedValue(respuesta(ORIGINAL_NOVIAZGO));
    const r = await personalizarPregunta(osvaldo, ORIGINAL_NOVIAZGO, 14);
    expect(mocks.crear).toHaveBeenCalledTimes(1);
    expect(r.texto).toBe(ORIGINAL_NOVIAZGO);
    expect(r.personalizada).toBe(false);
  });

  it('con usted no paga un segundo intento: manda el original de una', async () => {
    mocks.crear.mockResolvedValue(respuesta(PERSONALIZADA_INCOMPLETA));
    const osvaldo = { id: 'n1', como_le_dicen: 'Don Osvaldo', contexto: { trato: 'usted' as const } };
    const r = await personalizarPregunta(osvaldo, ORIGINAL_NOVIAZGO, 14);
    expect(mocks.crear).toHaveBeenCalledTimes(1);
    expect(r.texto).toBe(ORIGINAL_NOVIAZGO);
  });
});

describe('las reglas nuevas contra el dolor gratuito (bitácora 13, 20, 22, 24, 27, 33, 35)', () => {
  // Los ejemplos son los literales de la bitácora, no inventados.
  const prompt = PROMPT_PERSONALIZAR(
    '¿A qué jugaba de chico?',
    '',
    'Lo que contó el día 8: salidas de miércoles a domingo, mucho vino, mucha pastilla, mucho clonazepam.',
    '',
    '',
    'vos',
  );

  it('(b) no repite lo que acaba de contestar ni vuelve sobre lo que negó', () => {
    expect(prompt).toContain('NO PREGUNTES LO QUE ACABA DE CONTESTAR');
    // Ciro contó que con el Pelado Bausa y el Beto "no salíamos los tres juntos,
    // creo que nunca" y la pregunta 9 fue "¿cómo era salir con ellos?"
    expect(prompt).toContain('"no salíamos los tres juntos, creo que nunca"');
    expect(prompt).toContain('"¿cómo era salir con ellos?"');
    // Y lo negado no se pregunta ni como suposición ni como condicional.
    expect(prompt).toContain('"no tengo hijos"');
    expect(prompt).toContain('"nunca me casé"');
    expect(prompt).toContain('ni como suposición ni como condicional');
    // Y no se lidera con lo que él nombró de paso (el alcohol de Ciro).
    expect(prompt).toContain('vos no liderás la pregunta con eso');
  });

  it('(c) no da por sentado que la infancia fue linda ni que hubo boda, hijos o nietos', () => {
    expect(prompt).toContain('NO SUPONGAS LA VIDA DEL GUION');
    expect(prompt).toContain('ni que hubo boda, hijos o nietos');
    expect(prompt).toContain('"las travesuras que todavía lo hagan reír"');
    // El "esto no era una película de Disney" de Ciro, textual.
    expect(prompt).toContain('esto no era una película de Disney');
    expect(prompt).toContain('preguntá por lo que había, quién sostenía, qué se rescataba');
  });
});

describe('el trato manda en el prompt de la pregunta del día', () => {
  const respuesta = (texto: string) => ({ content: [{ type: 'text', text: texto }], usage: {} });

  beforeEach(() => {
    mocks.crear.mockReset();
    mocks.updates = [];
    mocks.respuestas = [];
  });

  it('con vos: tutea y cambia el ejemplo del año de nacimiento', () => {
    const p = PROMPT_PERSONALIZAR('¿Cómo era su casa?', 'El narrador es Ciro.', '', '', '', 'vos');
    expect(p).toContain('Tratalo de vos, cálido, en castellano rioplatense (Argentina).');
    expect(p).toContain('"cuando tenías seis años"');
    expect(p).not.toContain('Tratalo de usted');
  });

  it('con usted: queda como estaba', () => {
    const p = PROMPT_PERSONALIZAR('¿Cómo era su casa?', 'El narrador es Don Osvaldo.', '', '', '', 'usted');
    expect(p).toContain('Tratalo de usted, cálido, en castellano rioplatense (Argentina).');
    expect(p).toContain('"cuando usted tenía seis años"');
    expect(p).not.toContain('Tratalo de vos');
  });

  it('sin decir nada, el default sigue siendo usted', () => {
    const p = PROMPT_PERSONALIZAR('¿Cómo era su casa?', 'El narrador es Don Osvaldo.', '');
    expect(p).toContain('Tratalo de usted, cálido, en castellano rioplatense (Argentina).');
  });

  it('personalizarPregunta le pasa al modelo el trato guardado del narrador', async () => {
    mocks.crear.mockResolvedValue(respuesta('¿Cómo era tu casa de Concordia?'));
    const ciro = { id: 'n1', como_le_dicen: 'Ciro', contexto: { anioNacimiento: 1998, trato: 'vos' } };
    await personalizarPregunta(ciro, '¿Cómo era su casa?', 1, { recordar: false });
    expect(mocks.crear).toHaveBeenCalledTimes(1); // el trato ya estaba: no se vuelve a decidir
    expect(mocks.crear.mock.calls[0][0].messages[0].content as string).toContain('Tratalo de vos');
  });

  // recordarEnviada pisa el contexto entero con la copia que tiene en la mano:
  // si tratoDe acaba de guardar el trato, tiene que seguir estando en ese update.
  it('el trato recién decidido sobrevive a que se guarde la pregunta enviada', async () => {
    mocks.crear
      .mockResolvedValueOnce(respuesta('vos'))                              // tratoDe
      .mockResolvedValueOnce(respuesta('¿Cómo era tu casa de Concordia?')); // la pregunta
    const ciro = { id: 'n1', como_le_dicen: 'Ciro', contexto: { anioNacimiento: 1998 } };
    await personalizarPregunta(ciro, '¿Cómo era su casa?', 1);

    expect(mocks.crear.mock.calls[1][0].messages[0].content as string).toContain('Tratalo de vos');
    const guardado = mocks.updates.filter((u) => u.tabla === 'narradores').at(-1);
    expect(guardado!.p.contexto.trato).toBe('vos');
    expect(guardado!.p.contexto.preguntasEnviadas['1']).toBe('¿Cómo era tu casa de Concordia?');
  });
});

// ── C11: el trato mezclado (bitácora de Ciro, 23/09) ───────────────────────
// El modelo escribe el enganche en vos —"Mirá, vos dijiste…"— y después copia
// la cola del guion tal cual, que está en usted: "¿cómo conoció al amor de su
// vida? Lléveme a ese día…". Media pregunta le habla de una manera y media de
// otra. Medido sobre el material real de Ciro: 3 de 6 antes, 0 de 6 después.
describe('rompeElTrato', () => {
  it('caza la cola del guion copiada en usted a un narrador de vos', () => {
    const real = 'Mirá, vos dijiste que en Buenos Aires los primeros meses fueron complicados. ¿Cómo conoció al amor de su vida? Lléveme a ese día.';
    expect(rompeElTrato(real, 'vos')).toBe(true);
    expect(marcasDelTratoAjeno(real, 'vos')).toContain('lleveme');
  });

  it('también sin acentos: el modelo escribe "Lleveme" tan seguido como "Lléveme"', () => {
    expect(rompeElTrato('Mirá, contame. Lleveme a ese día.', 'vos')).toBe(true);
  });

  it('una pregunta entera en vos pasa limpia', () => {
    expect(rompeElTrato('Mirá, vos que me contaste de la plaza, ¿cómo conociste al amor de tu vida? Llevame a ese día.', 'vos')).toBe(false);
  });

  it('el guion original, en usted, es CORRECTO para un narrador de usted', () => {
    const delGuion = '¿Cómo conoció al amor de su vida? Lléveme a ese día: dónde fue, qué pensó cuando la vio.';
    expect(rompeElTrato(delGuion, 'usted')).toBe(false);
    expect(rompeElTrato(delGuion, 'vos')).toBe(true);
  });

  it('el vos metido en una pregunta de usted también rompe', () => {
    expect(rompeElTrato('Cuénteme de su casa. Y contame qué olía.', 'usted')).toBe(true);
    expect(marcasDelTratoAjeno('Mirá, ¿tenés algo de esa época?', 'usted').length).toBeGreaterThan(0);
  });

  it('el tú está mal en los dos tratos, y se distingue del vos por el acento', () => {
    expect(rompeElTrato('Llévame a ese día.', 'vos')).toBe(true);   // tú
    expect(rompeElTrato('Llevame a ese día.', 'vos')).toBe(false);  // vos
    expect(rompeElTrato('Cuéntame de tu casa.', 'usted')).toBe(true);
  });
});
