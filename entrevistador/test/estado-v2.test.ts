import { describe, it, expect } from 'vitest';
import {
  estadoNuevo, leerEstado, contextoConEstado, planSiHaceFalta, variablesAsignadas, pendientesParaPerfil,
  preguntaParaCargar, queHaceSiguiente, conversacionDe, yaHechasDe, evitarDe, sumarDias, hoyEn,
  repreguntasParaCansancio, decidirTrasEvaluar, sumarGasto, tratoParaTextos, mensajeHoyNo,
  cierreQuiereParar, mailQuiereParar, despedidaV2, type EstadoV2,
} from '../src/manual/estado-v2.js';
import { proxima, avanzar, registrarObjeto } from '../src/ia/secuencia.js';
import { planificar, TECHO_VARIABLES } from '../src/ia/plan-preguntas.js';
import { NUCLEO } from '../src/ia/pregunta-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';

const BA = 'America/Argentina/Buenos_Aires';
const vars = (e: EstadoV2) => [
  ...e.secuencia.hechas.filter((h) => h.objetivo.tipo === 'variable').map((h) => h.id),
  ...e.secuencia.pendientes.filter((o) => o.tipo === 'variable').map((o) => o.id),
];

describe('estado-v2 (lo que la puerta manual v2 guarda en contexto)', () => {
  it('nace con el perfil de la ficha y la secuencia sin variables; la primera es la presentación', () => {
    const e = estadoNuevo({ anioNacimiento: 1999, trato: 'vos' }, BA);
    expect(e.perfil.persona.anioNacimiento?.valor).toBe('1999');
    expect(proxima(e.secuencia)?.id).toBe('presentacion');
    expect(e.secuencia.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(0);
    expect(e.gastoUsd).toBe(0);
  });
  it('planifica recién cuando hay edad, y no dos veces', () => {
    const sin = planSiHaceFalta(estadoNuevo({}, BA));
    expect(sin.secuencia.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(0);
    const con = planSiHaceFalta(estadoNuevo({ anioNacimiento: 1999 }, BA));
    const n = con.secuencia.pendientes.filter((o) => o.tipo === 'variable').length;
    expect(n).toBeGreaterThanOrEqual(8);
    expect(planSiHaceFalta(con).secuencia.pendientes.filter((o) => o.tipo === 'variable')).toHaveLength(n);
  });
  it('va y vuelve del contexto sin pisar otras claves', () => {
    const e = estadoNuevo({}, 'Europe/Madrid');
    const c = contextoConEstado({ modoRapido: true, evitar: 'x' }, e);
    expect(c.modoRapido).toBe(true);
    expect(c.evitar).toBe('x');
    expect(leerEstado(c, 'Europe/Madrid')?.perfil.castellano).toBe('españa');
    expect(leerEstado({}, 'Europe/Madrid')).toBeNull();
  });
  it('sobrevive a JSON (lo que de verdad pasa al guardarlo en la base)', () => {
    const e = planSiHaceFalta(estadoNuevo({ anioNacimiento: 1999 }, BA));
    const vuelta = leerEstado(JSON.parse(JSON.stringify(contextoConEstado({}, e))), BA)!;
    expect(vuelta.secuencia).toEqual(e.secuencia);
    expect(vuelta.perfil).toEqual(e.perfil);
  });
});

describe('planSiHaceFalta: replanificar con TODAS las variables ya asignadas (hechas + pendientes)', () => {
  // Dos vidas: con solo las pendientes (el borrador del plan), la de 27 terminaba con 12 variables
  // cuando el plan pedía 10 (las de infancia ya hechas se volvían a pedir y caían en otro tramo).
  it.each([
    { anio: 1999, bisagras: ['A los 18 se fue de casa', 'A los 20 murió su abuelo', 'A los 21 empezó a trabajar', 'A los 23 se mudó', 'A los 25 se separó', 'A los 26 cambió de trabajo'] },
    { anio: 1950, bisagras: ['A los 30 se fue a vivir a Madrid', 'A los 45 murió su hermano', 'A los 60 se jubiló'] },
  ])('bisagras nuevas después de haber hecho variables (nacido en $anio): sin ids repetidos, las hechas intactas, el total del plan nuevo y ≤ 19', ({ anio, bisagras }) => {
    let e = planSiHaceFalta(estadoNuevo({ anioNacimiento: anio }, BA));
    // Se avanza hasta haber hecho al menos dos variables.
    let orden = 0;
    while (e.secuencia.hechas.filter((h) => h.objetivo.tipo === 'variable').length < 2) {
      e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, orden++) };
    }
    const hechasAntes = structuredClone(e.secuencia.hechas);
    const perfil = { ...e.perfil, bisagras };
    const despues = planSiHaceFalta({ ...e, perfil });

    const ids = vars(despues);
    expect(new Set(ids).size).toBe(ids.length);
    expect(despues.secuencia.hechas).toEqual(hechasAntes);
    const esperado = Math.min(TECHO_VARIABLES, (planificar(perfil, NUCLEO) as { variables: unknown[] }).variables.length);
    expect(ids.length).toBe(esperado);
    expect(ids.length).toBeGreaterThan(vars(e).length);
    expect(ids.length).toBeLessThanOrEqual(TECHO_VARIABLES);
    expect(despues.bisagrasPlanificadas).toBe(bisagras.length);
  });
  it('con muchas bisagras no pasa el techo', () => {
    let e = planSiHaceFalta(estadoNuevo({ anioNacimiento: 1940 }, BA));
    for (let i = 0; i < 6; i++) e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, i) };
    const perfil = { ...e.perfil, bisagras: Array.from({ length: 12 }, (_, i) => `A los ${10 + i * 5} pasó algo`) };
    const ids = vars(planSiHaceFalta({ ...e, perfil }));
    expect(ids.length).toBeLessThanOrEqual(TECHO_VARIABLES);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('variablesAsignadas junta hechas y pendientes, en orden de asignación', () => {
    let e = planSiHaceFalta(estadoNuevo({ anioNacimiento: 1999 }, BA));
    let orden = 0;
    while (!e.secuencia.hechas.some((h) => h.objetivo.tipo === 'variable')) {
      e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, orden++) };
    }
    expect(variablesAsignadas(e.secuencia)).toHaveLength(vars(e).length);
    expect(variablesAsignadas(e.secuencia)[0].tramo).toBe('infancia');
  });
  it('si la edad llega DESPUÉS de que un tema cubierto ya sumó una variable, igual planifica', () => {
    const e = estadoNuevo({}, BA);
    const conUna = { ...e, secuencia: { ...e.secuencia, pendientes: [...e.secuencia.pendientes, { tipo: 'variable' as const, id: 'var-infancia-1', tramo: 'infancia' as const, desde: 0, hasta: 12, anclas: [] }] } };
    const sinEdad = planSiHaceFalta(conUna);
    expect(vars(sinEdad)).toHaveLength(1);
    const perfil = { ...sinEdad.perfil, persona: { ...sinEdad.perfil.persona, edad: { valor: '27', fuente: 'dicho' as const } } };
    const conEdad = planSiHaceFalta({ ...sinEdad, perfil });
    expect(vars(conEdad).length).toBeGreaterThanOrEqual(8);
    expect(new Set(vars(conEdad)).size).toBe(vars(conEdad).length);
  });
});

describe('qué pregunta está abierta', () => {
  const empezado = (): EstadoV2 => {
    const e = estadoNuevo({ anioNacimiento: 1999 }, BA);
    const s = avanzar(e.secuencia, proxima(e.secuencia)!, 0);
    return { ...e, secuencia: s, preguntasEnviadas: { '0': 'hola, soy el biógrafo' } };
  };
  it('cargar va a la última enviada; con --orden a otra ya enviada; la repregunta tiene que existir', () => {
    let e = empezado();
    e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, 1), preguntasEnviadas: { ...e.preguntasEnviadas, '1': '¿cómo era la casa?' } };
    expect(preguntaParaCargar(e, undefined, false)).toMatchObject({ orden: 1, texto: '¿cómo era la casa?' });
    expect(preguntaParaCargar(e, 0, false)).toMatchObject({ orden: 0, texto: 'hola, soy el biógrafo' });
    expect(preguntaParaCargar(e, 7, false)).toHaveProperty('error');
    expect(preguntaParaCargar(e, undefined, true)).toHaveProperty('error');
    e = { ...e, repreguntasEnviadas: { '1': '¿y el patio?' } };
    expect(preguntaParaCargar(e, undefined, true)).toMatchObject({ orden: 1, texto: '¿y el patio?' });
  });
  it('cargar acepta la respuesta a un objeto (orden 101+), sin repregunta', () => {
    let e = empezado();
    e = { ...e, secuencia: registrarObjeto(e.secuencia, 'infancia', 101), preguntasEnviadas: { ...e.preguntasEnviadas, '101': '¿Tenés algo de esa época?' } };
    expect(preguntaParaCargar(e, 101, false)).toMatchObject({ orden: 101, esObjeto: true, texto: '¿Tenés algo de esa época?', objetivo: { tipo: 'objeto', tramo: 'infancia' } });
    expect(preguntaParaCargar(e, 101, true)).toHaveProperty('error');
    expect(preguntaParaCargar(e, undefined, false)).toMatchObject({ orden: 0, esObjeto: false });
  });
  const fila = (id: string, pregunta_orden: number, es_repregunta = false) => ({ id, pregunta_orden, es_repregunta });
  it('siguiente: la presentación no espera respuesta; las demás sí (salvo --saltar); "hoy no" repite la misma', () => {
    let e = empezado();
    expect(queHaceSiguiente(e, [], false)).toEqual({ tipo: 'seguir' });
    e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, 1), preguntasEnviadas: { ...e.preguntasEnviadas, '1': '¿la casa?' } };
    expect(queHaceSiguiente(e, [], false)).toEqual({ tipo: 'falta-respuesta', orden: 1 });
    expect(queHaceSiguiente(e, [], true)).toEqual({ tipo: 'seguir' });
    const hecha = { ...e, procesadas: ['r1'] };
    expect(queHaceSiguiente(hecha, [fila('r1', 1)], false)).toEqual({ tipo: 'seguir' });
    expect(queHaceSiguiente({ ...hecha, retomar: 1 }, [fila('r1', 1)], false)).toEqual({ tipo: 'retomar', orden: 1, texto: '¿la casa?' });
    // --saltar no saltea un "hoy no".
    expect(queHaceSiguiente({ ...hecha, retomar: 1 }, [fila('r1', 1)], true)).toMatchObject({ tipo: 'retomar' });
  });
  it('siguiente frena con una respuesta que no terminó de procesarse (salvo --saltar), aunque sea de otra orden', () => {
    let e = empezado();
    e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, 1), preguntasEnviadas: { ...e.preguntasEnviadas, '1': '¿la casa?' } };
    const filas = [fila('r0', 0), fila('r1', 1)];
    expect(queHaceSiguiente({ ...e, procesadas: ['r0'] }, filas, false)).toEqual({ tipo: 'sin-procesar', filas: [fila('r1', 1)] });
    expect(queHaceSiguiente({ ...e, procesadas: ['r1'] }, filas, false)).toEqual({ tipo: 'sin-procesar', filas: [fila('r0', 0)] });
    expect(queHaceSiguiente({ ...e, procesadas: ['r0'] }, filas, true)).toEqual({ tipo: 'seguir' });
  });
  it('siguiente frena SIEMPRE con una respuesta que frenó el candado de audio cruzado; no cuenta como contestada', () => {
    let e = empezado();
    e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, 1), preguntasEnviadas: { ...e.preguntasEnviadas, '1': '¿la casa?' } };
    const conCruce = { ...e, bloqueadas: ['ajena'] };
    expect(queHaceSiguiente(conCruce, [fila('ajena', 1)], false)).toEqual({ tipo: 'bloqueada', filas: [fila('ajena', 1)] });
    expect(queHaceSiguiente(conCruce, [fila('ajena', 1)], true)).toMatchObject({ tipo: 'bloqueada' });
    // Descartada (ya no está en la base): vuelve a esperar la respuesta de verdad.
    expect(queHaceSiguiente(conCruce, [], false)).toEqual({ tipo: 'falta-respuesta', orden: 1 });
  });
});

describe('lo que viaja a los prompts', () => {
  it('la conversación: las últimas 6 respuestas, cada una con la pregunta (o repregunta) que la originó', () => {
    const e = { ...estadoNuevo({}, BA), preguntasEnviadas: { '0': 'P0', '1': 'P1', '2': 'P2' }, repreguntasEnviadas: { '1': 'R1' } };
    const filas = [
      { pregunta_orden: 0, es_repregunta: false, transcripcion: 'soy Naza', texto_directo: null },
      { pregunta_orden: 1, es_repregunta: false, transcripcion: 'la casa', texto_directo: null },
      { pregunta_orden: 1, es_repregunta: true, transcripcion: null, texto_directo: 'el patio' },
      { pregunta_orden: 2, es_repregunta: false, transcripcion: '   ', texto_directo: null },
    ];
    expect(conversacionDe(e, filas)).toEqual([
      { pregunta: 'P0', respuesta: 'soy Naza' },
      { pregunta: 'P1', respuesta: 'la casa' },
      { pregunta: 'R1', respuesta: 'el patio' },
    ]);
    expect(conversacionDe(e, filas, 2)).toHaveLength(2);
  });
  it('la conversación va por cuándo llegó cada respuesta: un objeto (101+) contestado antes de ayer no tapa la pregunta de ayer', () => {
    const e = { ...estadoNuevo({}, BA), preguntasEnviadas: { '5': 'P5', '6': 'P6', '101': 'Objeto' } };
    const filas = [
      { pregunta_orden: 5, es_repregunta: false, transcripcion: 'cinco', texto_directo: null, recibido_at: '2026-09-20T10:00:00Z' },
      { pregunta_orden: 101, es_repregunta: false, transcripcion: 'la pelota', texto_directo: null, recibido_at: '2026-09-21T10:00:00Z' },
      { pregunta_orden: 6, es_repregunta: false, transcripcion: 'seis', texto_directo: null, recibido_at: '2026-09-22T10:00:00Z' },
    ];
    expect(conversacionDe(e, filas, 2).map((c) => c.pregunta)).toEqual(['Objeto', 'P6']);
  });
  it('la conversación no lleva lo que frenó el candado de audio cruzado', () => {
    const e = { ...estadoNuevo({}, BA), preguntasEnviadas: { '1': 'P1' }, bloqueadas: ['ajena'] };
    const filas = [
      { id: 'ajena', pregunta_orden: 1, es_repregunta: false, transcripcion: 'lo de otra persona', texto_directo: null },
      { id: 'buena', pregunta_orden: 1, es_repregunta: false, transcripcion: 'lo suyo', texto_directo: null },
    ];
    expect(conversacionDe(e, filas)).toEqual([{ pregunta: 'P1', respuesta: 'lo suyo' }]);
  });
  it('ya hechas: todas las enviadas menos la presentación, con las repreguntas', () => {
    const e = { ...estadoNuevo({}, BA), preguntasEnviadas: { '0': 'hola', '1': 'P1', '101': 'O1' }, repreguntasEnviadas: { '1': 'R1' } };
    expect(yaHechasDe(e)).toEqual(['P1', 'O1', 'R1']);
  });
  it('los temas a evitar: el texto libre del panel, línea por línea, sin la marca de "lo pidió él"', () => {
    expect(evitarDe({ evitar: 'su hermano Rubén\nla guerra (lo pidió él en la entrevista)\n' })).toEqual(['su hermano Rubén', 'la guerra']);
    expect(evitarDe({})).toEqual([]);
  });
  it('los temas pendientes para el perfil: sin la presentación, las variables con su tramo', () => {
    const e = planSiHaceFalta(estadoNuevo({ anioNacimiento: 1999 }, BA));
    const p = pendientesParaPerfil(e.secuencia);
    expect(p.find((x) => x.id === 'presentacion')).toBeUndefined();
    expect(p.find((x) => x.id === 'juegos')?.tema).toMatch(/jugaba/);
    expect(p.find((x) => x.id.startsWith('var-infancia'))?.tema).toMatch(/infancia/);
  });
});

describe('la repregunta: cansancio, hoy no, no quiero seguir', () => {
  const base = { esRepregunta: false, yaHayRepregunta: false, hoy: '2026-09-24', orden: 5, cansancio: false, sinRepreguntarHasta: undefined as string | undefined };
  const pide = { suficiente: false, repregunta: '¿y quién estaba?' };
  it('pide repregunta → se repregunta', () => {
    expect(decidirTrasEvaluar(pide, base)).toEqual({ accion: 'repreguntar', texto: '¿y quién estaba?' });
  });
  it('alcanza → nada', () => {
    expect(decidirTrasEvaluar({ suficiente: true }, base).accion).toBe('nada');
  });
  it('no quiero seguir manda sobre todo; hoy no, después', () => {
    expect(decidirTrasEvaluar({ ...pide, quiereParar: true, hoyNo: true }, base).accion).toBe('parar');
    expect(decidirTrasEvaluar({ ...pide, hoyNo: true }, base).accion).toBe('hoyNo');
  });
  it('la respuesta a una repregunta no se repregunta; tampoco si ya hubo una en esa orden', () => {
    expect(decidirTrasEvaluar(pide, { ...base, esRepregunta: true }).accion).toBe('nada');
    expect(decidirTrasEvaluar(pide, { ...base, yaHayRepregunta: true }).accion).toBe('nada');
  });
  it('un "hoy no" en la respuesta a la repregunta no reabre la pregunta; un "no quiero seguir", sí frena', () => {
    expect(decidirTrasEvaluar({ suficiente: true, hoyNo: true }, { ...base, esRepregunta: true }).accion).toBe('nada');
    expect(decidirTrasEvaluar({ suficiente: true, quiereParar: true }, { ...base, esRepregunta: true }).accion).toBe('parar');
  });
  it('con cansancio no se repregunta y se anota la pausa de 3 días desde hoy', () => {
    expect(decidirTrasEvaluar(pide, { ...base, cansancio: true })).toEqual({
      accion: 'nada', motivo: expect.stringMatching(/cansancio/), sinRepreguntarHasta: '2026-09-27', cansancioDesdeOrden: 5,
    });
  });
  it('mientras la pausa está en el futuro no se repregunta; el día que vence, sí', () => {
    expect(decidirTrasEvaluar(pide, { ...base, sinRepreguntarHasta: '2026-09-26' }).accion).toBe('nada');
    expect(decidirTrasEvaluar(pide, { ...base, sinRepreguntarHasta: '2026-09-24' }).accion).toBe('repreguntar');
  });
  it('el cansancio mira las repreguntas de antes de hoy y posteriores a la última pausa', () => {
    const e = { ...estadoNuevo({}, BA), repreguntasEnviadas: { '2': 'a', '3': 'b', '5': 'c' } };
    expect(repreguntasParaCansancio(e, 5, [])).toEqual([{ contestada: false }, { contestada: false }]);
    expect(repreguntasParaCansancio(e, 5, [3])).toEqual([{ contestada: false }, { contestada: true }]);
    expect(repreguntasParaCansancio({ ...e, cansancioDesdeOrden: 3 }, 6, [])).toEqual([{ contestada: false }]);
  });
  it('fechas: hoy en su zona, y sumar días cruzando el mes', () => {
    expect(hoyEn(BA, new Date('2026-09-25T02:00:00Z'))).toBe('2026-09-24');
    expect(sumarDias('2026-09-29', 3)).toBe('2026-10-02');
  });
});

describe('el gasto', () => {
  it('suma los tokens de Opus y los segundos de transcripción', () => {
    const e = estadoNuevo({}, BA);
    const g = sumarGasto(e, [{ input_tokens: 1_000_000, output_tokens: 0 }, { input_tokens: 0, output_tokens: 40_000 }], 60);
    expect(g.gastoUsd).toBeCloseTo(5 + 1 + 0.0045, 6);
    expect(sumarGasto(g, []).gastoUsd).toBeCloseTo(g.gastoUsd, 9);
  });
});

describe('los textos fijos para la persona', () => {
  const conTrato = (valor: string, castellano: 'rioplatense' | 'españa' = 'rioplatense') => {
    const p = perfilVacio(castellano);
    p.persona.comoHabla = { valor, fuente: 'dicho' };
    return p;
  };
  it('el trato: vos, usted, tú; sin saberlo, usted', () => {
    expect(tratoParaTextos(conTrato('vos'))).toBe('vos');
    expect(tratoParaTextos(conTrato('usted'))).toBe('usted');
    expect(tratoParaTextos(conTrato('tú', 'españa'))).toBe('tu');
    expect(tratoParaTextos(perfilVacio())).toBe('usted');
  });
  it('ninguno pregunta nada y todos llevan su nombre', () => {
    for (const t of ['vos', 'usted', 'tú'] as const) {
      const p = conTrato(t, t === 'tú' ? 'españa' : 'rioplatense');
      for (const texto of [mensajeHoyNo('Naza', p), cierreQuiereParar('Naza', p), despedidaV2('Naza', p)]) {
        expect(texto).not.toMatch(/[?¿]/);
        expect(texto).toContain('Naza');
      }
    }
    expect(mensajeHoyNo('Naza', conTrato('vos'))).toMatch(/te la vuelvo a mandar/);
    expect(mensajeHoyNo('Naza', conTrato('usted'))).toMatch(/se la vuelvo a mandar/);
    expect(cierreQuiereParar('Naza', conTrato('tú', 'españa'))).toMatch(/aquí/);
  });
  it('el mail para los dueños dice quién, qué contestó y qué hacer', () => {
    const m = mailQuiereParar({ nombre: 'Naza', narradorId: 'abc', orden: 7, pregunta: '¿Y tu viejo?', respuesta: 'no quiero seguir', respuestas: 9 });
    expect(m.asunto).toContain('Naza');
    expect(m.cuerpo).toContain('¿Y tu viejo?');
    expect(m.cuerpo).toContain('no quiero seguir');
    expect(m.cuerpo).toContain('en pausa');
  });
});
