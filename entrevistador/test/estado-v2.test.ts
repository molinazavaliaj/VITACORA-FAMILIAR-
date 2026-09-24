import { describe, it, expect } from 'vitest';
import {
  estadoNuevo, leerEstado, contextoConEstado, rearmarSiHaceFalta, pendientesParaPerfil,
  preguntaParaCargar, queHaceSiguiente, conversacionDe, yaHechasDe, evitarDe, sumarDias, hoyEn,
  repreguntasParaCansancio, decidirTrasEvaluar, repreguntasEnEtapa, sumarGasto, tratoParaTextos, mensajeHoyNo,
  cierreQuiereParar, mailQuiereParar, despedidaV2, type EstadoV2,
} from '../src/manual/estado-v2.js';
import { proxima, avanzar, registrarObjeto } from '../src/ia/secuencia.js';
import { aplicarCambios, perfilVacio } from '../src/ia/perfil.js';
import { firmaGuion as firmaGuionDe } from '../src/ia/guion-v2.js';

const BA = 'America/Argentina/Buenos_Aires';

describe('estado-v2 (lo que la puerta manual v2 guarda en contexto)', () => {
  it('nace con el perfil de la ficha y el guion armado; la primera es la presentación', () => {
    const e = estadoNuevo({ anioNacimiento: 1999, trato: 'vos' }, BA, 2026);
    expect(e.perfil.persona.anioNacimiento?.valor).toBe('1999');
    expect(proxima(e.secuencia)?.id).toBe('presentacion');
    expect(e.secuencia.pendientes.some((o) => o.id === 'oficio')).toBe(true);
    expect(e.firmaGuion).toBeTypeOf('string');
    expect(e.gastoUsd).toBe(0);
  });
  it('rearma solo cuando cambia lo que decide el guion (edad, árbol), y respeta lo hecho', () => {
    let e = estadoNuevo({}, BA, 2026);
    e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, 0) };
    const igual = rearmarSiHaceFalta(e, 2026);
    expect(igual.secuencia).toBe(e.secuencia);
    const conEdad = rearmarSiHaceFalta({ ...e, perfil: aplicarCambios(e.perfil, { persona: { edad: { valor: '70', fuente: 'dicho' } } }) }, 2026);
    expect(conEdad.secuencia).not.toBe(e.secuencia);
    expect(conEdad.secuencia.hechas).toHaveLength(1);
    expect(conEdad.secuencia.pendientes.some((o) => o.id === 'dejar-el-trabajo')).toBe(true);
    expect(conEdad.firmaGuion).not.toBe(e.firmaGuion);
  });
  it('va y vuelve del contexto sin pisar otras claves', () => {
    const e = estadoNuevo({}, 'Europe/Madrid');
    const c = contextoConEstado({ modoRapido: true, evitar: 'x' }, e);
    expect(c.modoRapido).toBe(true);
    expect(c.evitar).toBe('x');
    expect(leerEstado(c, 'Europe/Madrid')?.perfil.castellano).toBe('españa');
    expect(leerEstado({}, 'Europe/Madrid')).toBeNull();
  });
  it('sobrevive a JSON', () => {
    const e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    const vuelta = leerEstado(JSON.parse(JSON.stringify(contextoConEstado({}, e))), BA)!;
    expect(vuelta.secuencia).toEqual(e.secuencia);
    expect(vuelta.perfil).toEqual(e.perfil);
  });
  it('un contexto.v2 guardado sin firmaGuion (el piloto del 24/09) no coincide, y rearma en el primer llamado', () => {
    const e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    const { firmaGuion, ...sinFirma } = e;
    const leido = leerEstado({ v2: sinFirma }, BA)!;
    expect(leido.firmaGuion).not.toBe(firmaGuionDe(leido.perfil, 2026));
    const rearmado = rearmarSiHaceFalta(leido, 2026);
    expect(rearmado.firmaGuion).toBe(firmaGuionDe(leido.perfil, 2026));
    expect(rearmado.secuencia).toEqual(e.secuencia);
  });
  it('un contexto.v2 guardado sin caidas/libres en la secuencia (piloto viejo) se completa con [] y 0', () => {
    const e = estadoNuevo({}, BA, 2026);
    const { caidas, libres, ...restoSecuencia } = e.secuencia;
    const leido = leerEstado({ v2: { ...e, secuencia: restoSecuencia } }, BA)!;
    expect(leido.secuencia.caidas).toEqual([]);
    expect(leido.secuencia.libres).toBe(0);
  });
  it('un objeto registrado (registrarObjeto) nunca entra a hechas: no cuenta para el techo ni para yaHechasDe', () => {
    let e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, 0) };
    const hechasAntes = e.secuencia.hechas.length;
    e = { ...e, secuencia: registrarObjeto(e.secuencia, 'infancia', 101) };
    expect(e.secuencia.hechas).toHaveLength(hechasAntes);
    expect(e.secuencia.hechas.some((h) => h.objetivo.tipo === 'objeto')).toBe(false);
    expect(yaHechasDe(e).some((y) => y.tema.includes('objeto'))).toBe(false);
  });
});

describe('pendientesParaPerfil y yaHechasDe', () => {
  it('los pendientes para la ficha son las filas (id: tema), sin la presentación ni las libres', () => {
    const e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    const p = pendientesParaPerfil(e.secuencia);
    expect(p.find((x) => x.id === 'la-escuela')?.tema).toMatch(/escuela primaria/i);
    expect(p.some((x) => x.id === 'presentacion')).toBe(false);
    expect(p.some((x) => x.id.startsWith('libre-'))).toBe(false);
  });
  it('yaHechas trae id y tema de cada hecha (no el texto), sin la presentación, y las repreguntas marcadas', () => {
    let e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    for (let i = 0; i < 3; i++) e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, i), preguntasEnviadas: { ...e.preguntasEnviadas, [i]: `texto ${i}` } };
    e = { ...e, repreguntasEnviadas: { '1': '¿Y el olor de esa casa?' } };
    const ya = yaHechasDe(e);
    expect(ya.map((y) => y.id)).toEqual(['casa-infancia', 'los-tuyos-hoy', 'casa-infancia-repregunta']);
    expect(ya[0].tema).toMatch(/casa donde pasó su infancia/i);
    expect(ya[2].tema).toContain('¿Y el olor de esa casa?');
    expect(JSON.stringify(ya)).not.toContain('texto 1');
  });
});

describe('qué pregunta está abierta', () => {
  const empezado = (): EstadoV2 => {
    const e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
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

describe('conversacionDe: las últimas 3', () => {
  it('por defecto trae 3, por llegada', () => {
    const e = estadoNuevo({}, BA, 2026);
    const filas = Array.from({ length: 5 }, (_, i) => ({ id: String(i), pregunta_orden: i, es_repregunta: false, transcripcion: `r${i}`, texto_directo: null, recibido_at: `2026-09-24T0${i}:00:00Z` }));
    const c = conversacionDe({ ...e, preguntasEnviadas: Object.fromEntries(filas.map((f) => [f.pregunta_orden, `p${f.pregunta_orden}`])) }, filas);
    expect(c.map((x) => x.respuesta)).toEqual(['r2', 'r3', 'r4']);
  });
  it('la conversación va por cuándo llegó cada respuesta: un objeto (101+) contestado antes de ayer no tapa la pregunta de ayer', () => {
    const e = { ...estadoNuevo({}, BA, 2026), preguntasEnviadas: { '5': 'P5', '6': 'P6', '101': 'Objeto' } };
    const filas = [
      { pregunta_orden: 5, es_repregunta: false, transcripcion: 'cinco', texto_directo: null, recibido_at: '2026-09-20T10:00:00Z' },
      { pregunta_orden: 101, es_repregunta: false, transcripcion: 'la pelota', texto_directo: null, recibido_at: '2026-09-21T10:00:00Z' },
      { pregunta_orden: 6, es_repregunta: false, transcripcion: 'seis', texto_directo: null, recibido_at: '2026-09-22T10:00:00Z' },
    ];
    expect(conversacionDe(e, filas, 2).map((c) => c.pregunta)).toEqual(['Objeto', 'P6']);
  });
  it('la conversación no lleva lo que frenó el candado de audio cruzado', () => {
    const e = { ...estadoNuevo({}, BA, 2026), preguntasEnviadas: { '1': 'P1' }, bloqueadas: ['ajena'] };
    const filas = [
      { id: 'ajena', pregunta_orden: 1, es_repregunta: false, transcripcion: 'lo de otra persona', texto_directo: null },
      { id: 'buena', pregunta_orden: 1, es_repregunta: false, transcripcion: 'lo suyo', texto_directo: null },
    ];
    expect(conversacionDe(e, filas)).toEqual([{ pregunta: 'P1', respuesta: 'lo suyo' }]);
  });
});

describe('lo que viaja a los prompts (lo que no cambió)', () => {
  it('los temas a evitar: el texto libre del panel, línea por línea, sin la marca de "lo pidió él"', () => {
    expect(evitarDe({ evitar: 'su hermano Rubén\nla guerra (lo pidió él en la entrevista)\n' })).toEqual(['su hermano Rubén', 'la guerra']);
    expect(evitarDe({})).toEqual([]);
  });
});

describe('decidirTrasEvaluar (una repregunta por etapa, más una si la respuesta fue corta y saltó pormenores)', () => {
  const base = { esRepregunta: false, yaHayRepregunta: false, hoy: '2026-09-24', orden: 5, cansancio: false, repreguntasEnEtapa: 0, segundos: 90 };
  const noAlcanza = { suficiente: false, falto: ['un maestro', 'cómo le iba'] };
  it('parar manda sobre todo; una respuesta a repregunta u objeto no se repregunta', () => {
    expect(decidirTrasEvaluar({ ...noAlcanza, quiereParar: true }, base)).toEqual({ accion: 'parar' });
    expect(decidirTrasEvaluar(noAlcanza, { ...base, esRepregunta: true }).accion).toBe('nada');
  });
  it('hoy no → hoyNo; alcanza o sin falto → nada', () => {
    expect(decidirTrasEvaluar({ suficiente: true, falto: [], hoyNo: true }, base)).toEqual({ accion: 'hoyNo' });
    expect(decidirTrasEvaluar({ suficiente: true, falto: [] }, base).accion).toBe('nada');
    expect(decidirTrasEvaluar({ suficiente: false, falto: [] }, base).accion).toBe('nada');
  });
  it('primera de la etapa: repregunta con lo que faltó', () => {
    expect(decidirTrasEvaluar(noAlcanza, base)).toEqual({ accion: 'repreguntar', falto: ['un maestro', 'cómo le iba'] });
  });
  it('ya hubo una en la etapa: solo si la respuesta duró menos de 40 s y faltaron dos o más pormenores', () => {
    expect(decidirTrasEvaluar(noAlcanza, { ...base, repreguntasEnEtapa: 1, segundos: 90 }).accion).toBe('nada');
    expect(decidirTrasEvaluar(noAlcanza, { ...base, repreguntasEnEtapa: 1, segundos: 30 }).accion).toBe('repreguntar');
    expect(decidirTrasEvaluar({ suficiente: false, falto: ['uno'] }, { ...base, repreguntasEnEtapa: 1, segundos: 30 }).accion).toBe('nada');
  });
  it('ya hubo repregunta en esta orden, pausa por cansancio o cansancio nuevo: nada (y la pausa se anota)', () => {
    expect(decidirTrasEvaluar(noAlcanza, { ...base, yaHayRepregunta: true }).accion).toBe('nada');
    expect(decidirTrasEvaluar(noAlcanza, { ...base, sinRepreguntarHasta: '2026-09-30' }).accion).toBe('nada');
    const d = decidirTrasEvaluar(noAlcanza, { ...base, cansancio: true });
    expect(d).toMatchObject({ accion: 'nada', sinRepreguntarHasta: '2026-09-27', cansancioDesdeOrden: 5 });
  });
});

describe('repreguntasEnEtapa', () => {
  it('cuenta las repreguntas enviadas en hechas de ese tramo', () => {
    let e = estadoNuevo({ anioNacimiento: 1999 }, BA, 2026);
    let orden = 0;
    while (proxima(e.secuencia) && proxima(e.secuencia)!.id !== 'a-los-quince') e = { ...e, secuencia: avanzar(e.secuencia, proxima(e.secuencia)!, orden++) };
    const deInfancia = e.secuencia.hechas.filter((h) => h.tramo === 'infancia').map((h) => String(h.orden));
    e = { ...e, repreguntasEnviadas: { [deInfancia[0]]: 'r1', [deInfancia[1]]: 'r2' } };
    expect(repreguntasEnEtapa(e, 'infancia')).toBe(2);
    expect(repreguntasEnEtapa(e, 'juventud')).toBe(0);
  });
});

describe('el cansancio (sin cambios)', () => {
  it('el cansancio mira las repreguntas de antes de hoy y posteriores a la última pausa', () => {
    const e = { ...estadoNuevo({}, BA, 2026), repreguntasEnviadas: { '2': 'a', '3': 'b', '5': 'c' } };
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
    const e = estadoNuevo({}, BA, 2026);
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
