// La entrevista en castellano de España, de tú (Naza, 05/10: Argentina va de
// vos, España de tú, catalán en catalán). Lo que NO depende de los textos de
// banco-es-ES.md: el idioma, el detector, la transcripción, el cazador (su
// prompt entero en es-ES y sus controles), y que el flujo, la simulación, la
// página y el material usen los textos es-ES y nunca el rioplatense.
//
// Para eso banco-es-ES.json se reemplaza acá por textos de prueba: los de
// banco.md con una marca "§" al principio de cada línea. Si un mensaje que ve
// el narrador tiene una línea sin "§", es castellano rioplatense que se coló.
// Los tests con los textos reales están en v3-banco-es-ES.test.ts.
// Vidas inventadas. Nada llama a una API.

import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/v3/entrevista/banco-es-ES.json', async () => {
  const es = (await import('../src/v3/entrevista/banco.json')).default as {
    preguntas: { id: string; texto: string; botones?: { texto: string }[] }[];
    mensajes: { id: string; texto: string }[];
    nombresBloque: Record<string, string>;
  };
  const marcar = (t: string) => t.split('\n').map((l) => (l ? `§${l}` : l)).join('\n');
  return {
    default: {
      preguntas: Object.fromEntries(es.preguntas.map((p) => [p.id, marcar(p.texto)])),
      botones: Object.fromEntries(es.preguntas.filter((p) => p.botones).map((p) => [p.id, p.botones!.map((b) => `§${b.texto}`)])),
      mensajes: Object.fromEntries(es.mensajes.map((m) => [m.id, marcar(m.texto)])),
      nombresBloque: Object.fromEntries(Object.entries(es.nombresBloque).map(([k, v]) => [k, `§${v}`])),
      repregunta: { mensaje: '§Me he quedado pensando en algo que me contaste: «{cita}». {pregunta} Y si no te viene, dímelo.', boton: '§Ya lo conté todo' },
    },
  };
});

const { BANCO, bancoDe, comprobarTextos, mensajePorId, nombresBloqueDe, preguntaPorId, TEXTOS_IDIOMA, armarConTextos } = await import('../src/v3/entrevista/banco.js');
const { IDIOMAS, idiomaDe } = await import('../src/v3/entrevista/idioma.js');
const { interpretar } = await import('../src/v3/entrevista/respuesta.js');
const { botonRepregunta, contradiccionesConFicha, siguientePregunta } = await import('../src/v3/entrevista/flujo.js');
const { acuseNeutro } = await import('../src/v3/entrevista/mensajes.js');
const {
  armarEntrada, BLOQUES_CAZADOR, BLOQUES_CAZADOR_ES, cazarBloque, controlarElegida, extraerPrompt, mensajeRepregunta, PROMPT_CAZADOR, PROMPT_CAZADOR_DE, respuestasParaCazar,
} = await import('../src/v3/entrevista/cazador.js');
const { promptDeTranscripcion, transcribirConOpenAI } = await import('../src/v3/entrevista/transcribir.js');
const { main, nuevaEntrevista, responder, tocarBoton } = await import('../scripts/v3-entrevista-turno.js');
const { crearManejador, botonesAbiertos } = await import('../scripts/v3-entrevista-web.js');
const { aMaterial } = await import('../scripts/v3-entrevista-a-material.js');
import type { ClienteModelo, PedidoModelo } from '../src/v3/entrevista/cazador.js';
import type { Vista } from '../scripts/v3-entrevista-web.js';
import type { Respuestas } from '../src/v3/entrevista/flujo.js';
import type { TextosIdioma } from '../src/v3/entrevista/banco-idioma-md.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const raiz = mkdtempSync(join(tmpdir(), 'v3-es-ES-'));
afterAll(() => rmSync(raiz, { recursive: true, force: true }));

/** Formas de vos y palabras rioplatenses que no pueden aparecer en nada que se le escriba a alguien de España. */
const VOSEO = /(?<![\p{L}])(vos|sos|tenés|querés|sabés|podés|contás|acordás|sentís|vivís|contame|contanos|decime|decímelo|contámelo|mandame|acordate|fijate|mirá|pensá|nomás|dale|laburo|laburar|pibe|piba|plata|celular|acá)(?![\p{L}])/iu;

const p = (id: string) => preguntaPorId(id)!;
const es = (id: string, r: string) => interpretar(p(id), r, 'es-ES');
const ar = (id: string, r: string) => interpretar(p(id), r);

describe('el idioma es-ES', () => {
  it('se conoce; vacío sigue siendo es-AR y uno desconocido, error', () => {
    expect(IDIOMAS).toEqual(['es-AR', 'ca', 'es-ES']);
    expect(idiomaDe({ idioma: 'es-ES' })).toBe('es-ES');
    expect(idiomaDe({})).toBe('es-AR');
    expect(() => idiomaDe({ idioma: 'es' })).toThrow(/desconocido/);
    expect(() => idiomaDe({ idioma: 'es-MX' })).toThrow(/desconocido/);
  });
});

describe('sin sus textos, una entrevista no arranca (nunca se manda rioplatense)', () => {
  const vacios: TextosIdioma = { preguntas: {}, botones: {}, mensajes: {}, nombresBloque: {}, repregunta: { mensaje: '', boton: '' } };
  it('sin repregunta ni bloques: error', () => {
    expect(() => comprobarTextos('es-ES', vacios)).toThrow(/faltan los textos.*banco-es-ES\.md/);
  });
  it('sin el texto de una pregunta: error', () => {
    expect(() => armarConTextos('es-ES', vacios)).toThrow(/es-ES: falta el texto de OR1/);
  });
  it('los botones tienen que ser los mismos que en banco.md', () => {
    const t = TEXTOS_IDIOMA['es-ES'];
    expect(() => armarConTextos('es-ES', { ...t, botones: { ...t.botones, HI0: ['§Sí'] } })).toThrow(/HI0 tiene 1 botones/);
  });
});

describe('el detector entiende el castellano de España', () => {
  it('"paso" y sus formas', () => {
    for (const r of ['Paso.', 'La siguiente.', 'Otra.', 'Esta no.', 'Prefiero no hablar de eso.', 'Déjalo.', 'Déjalo estar.', 'Paso de esa.', 'Eso me lo reservo.', 'Mejor lo dejamos.', 'Prefiero no hablar de ello.', 'No me apetece.']) {
      expect(es('CA2', r), r).toBe('paso');
    }
  });
  it('"paso" como verbo sigue contando', () => {
    expect(es('CA2', 'Paso muchas horas en el huerto de mi abuelo, allí aprendí a plantar.')).toBe('conto');
    expect(es('CA2', 'Paso por la casa donde nací cada domingo y todavía la miro.')).toBe('conto');
  });
  it('olvido', () => {
    for (const r of ['No me acuerdo.', 'No lo recuerdo.', 'Ni idea.', 'No sé.', 'No lo sé.', 'Se me ha olvidado.', 'La memoria me falla.', 'No tengo ni idea.', 'Vale, no me acuerdo.', 'Hombre, no lo recuerdo.']) {
      expect(es('CA2', r), r).toBe('olvido');
    }
  });
  it('olvido a medias: arranca sin acordarse y cuenta', () => {
    expect(es('CA2', 'No lo recuerdo bien, pero sé que había un patio con una higuera enorme y que allí jugábamos todos los primos.')).toBe('olvido-a-medias');
  });
  it('"ya te lo he contado"', () => {
    for (const r of ['Ya te lo he contado.', 'Ya te lo conté.', 'Ya te lo he dicho.', 'Eso ya te lo había contado.']) expect(es('CA2', r), r).toBe('ya-conto');
  });
  it('cierres: "ya está", "es todo", "eso es todo", "nada más"', () => {
    for (const r of ['Ya está.', 'Es todo.', 'Eso es todo.', 'Nada más.', 'Está todo dicho.', 'Vale, ya está.']) expect(es('CI1', r), r).toBe('no');
    expect(es('CI1', 'Ya está, y me he acordado de algo: mi tío tenía un barco en Cádiz.')).toBe('conto');
  });
  it('"Vale" es un sí, no nada', () => {
    expect(es('CA2', 'Vale.')).toBe('conto');
    expect(es('AMH', 'Vale.')).toBe('conto');
    expect(ar('CA2', 'Vale.')).toBe('conto');
  });
  it('AMH: hoy en pareja', () => {
    for (const r of ['Sí, estoy con Andrés.', 'Estoy casada con Luis desde hace cuarenta años.', 'Tengo pareja, sí.', 'No, estoy con Paco.']) expect(es('AMH', r), r).toBe('conto');
  });
  it('AMH: hoy no', () => {
    for (const r of ['Estoy sola.', 'Estoy viuda desde hace años.', 'Ya no.', 'Murió en 2010.', 'Falleció hace tres años.', 'Nos separamos.', 'Me divorcié en los ochenta.', 'Me quedé viuda muy joven.', 'Me he quedado sola.', 'No, ha muerto.']) {
      expect(es('AMH', r), r).toBe('no');
    }
  });
  it('AMH: negar "estoy casada" o "tengo novio" no es estar en pareja (revisión)', () => {
    for (const r of ['No tengo novia.', 'No estoy casado.', 'No, ya no sigo casada.', 'Ya no estoy casada, me separé.']) expect(es('AMH', r), r).toBe('no');
  });
  it('HI0: los criados son un sí', () => {
    for (const r of ['No, pero lo crié como un hijo.', 'No tuve hijos propios, la criamos nosotros.', 'No, aunque a mi sobrino lo quise como si fuera mío.', 'No, pero tuvimos que criarla nosotros.']) {
      expect(es('HI0', r), r).toBe('conto');
    }
    expect(es('HI0', 'No, no tuve.')).toBe('no');
  });
  it('entiende también lo rioplatense', () => {
    expect(es('CA2', 'Salteala.')).toBe('paso');
    expect(es('CA2', 'Se me borró.')).toBe('olvido');
  });
});

describe('el castellano rioplatense y el catalán no cambian', () => {
  it('es-AR: lo de España que no se dice allá sigue como antes', () => {
    expect(ar('CA2', 'La siguiente.')).toBe('conto');
    expect(ar('CA2', 'Déjalo.')).toBe('conto');
    expect(ar('CA2', 'Vale, no me acuerdo.')).toBe('conto');
    expect(ar('CA2', 'Se me ha olvidado.')).toBe('conto');
    expect(ar('CA2', 'Paso.')).toBe('paso');
    expect(ar('CA2', 'No me acuerdo.')).toBe('olvido');
  });
  it('ca: igual', () => {
    expect(interpretar(p('CA2'), 'Vale.', 'ca')).toBe('conto');
    expect(interpretar(p('CA2'), 'Déjalo.', 'ca')).toBe('conto');
    expect(interpretar(p('CA2'), "No me'n recordo.", 'ca')).toBe('olvido');
  });
});

describe('la transcripción en es-ES', () => {
  it('manda language "es" y el vocabulario de España, con el nombre', async () => {
    const forms: FormData[] = [];
    const fetchFalso = (async (_url: string, init: { body: FormData }) => {
      forms.push(init.body);
      return new Response(JSON.stringify({ text: 'Hola', usage: { seconds: 3 } }), { status: 200 });
    }) as unknown as typeof fetch;
    await transcribirConOpenAI({ key: () => 'k', fetch: fetchFalso })(Buffer.from('a'), { tipo: 'audio/webm', nombreArchivo: 'a.webm', narrador: 'Pilar', idioma: 'es-ES' });
    expect(forms[0].get('language')).toBe('es');
    expect(forms[0].get('prompt')).toBe(promptDeTranscripcion('Pilar', 'es-ES'));
    expect(String(forms[0].get('prompt'))).toMatch(/^Pilar cuenta su vida en castellano de España\./);
    expect(promptDeTranscripcion('Pilar', 'es-ES')).not.toMatch(/rioplatense|laburo|pibe/);
    expect(promptDeTranscripcion('Naza')).toMatch(/castellano rioplatense/);
  });
});

describe('el cazador en es-ES', () => {
  const MD = readFileSync(path.join(RAIZ, 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v3-1-es-ES.md'), 'utf8');
  it('su prompt es copia entera, al día con el md (si falla: npx tsx scripts/v3-cazador-json.ts)', () => {
    expect(PROMPT_CAZADOR_DE['es-ES']).toBe(extraerPrompt(MD));
    expect(PROMPT_CAZADOR_DE['es-ES']).not.toBe(PROMPT_CAZADOR);
    expect(PROMPT_CAZADOR_DE['es-AR']).toBe(PROMPT_CAZADOR);
  });
  it('etiquetas, campos y el esquema JSON adentro, sin traducir', () => {
    for (const x of ['<ficha>', '<bloque>', '<respuestas_del_bloque>', '<ya_repreguntado>', '<escenas_contadas>', '<lo_que_viene>', 'pedido_dia="si"', 'paso="si"', '{cita}', '{pregunta}', '"elegidas"', '"escenas_contadas_bloque"', '"ya_contado_chequeo"']) {
      expect(PROMPT_CAZADOR_DE['es-ES'], x).toContain(x);
    }
  });
  it('de tú: nada de vos ni rioplatense en el prompt', () => {
    const sinNotas = PROMPT_CAZADOR_DE['es-ES'].replace(/nunca de vos ni con giros argentinos/, '');
    expect(sinNotas).not.toMatch(VOSEO);
    expect(sinNotas).not.toMatch(/(?<![\p{L}])(elegí|dejalo|elegila|escribís|leés|elegís|recibís|querés|devolvé|tomá|sumá|descartá|galpón|vieja|viejos)(?![\p{L}])/iu);
  });
  it('los bloques en es-ES: mismos 15, el 14 se llama Hoy, sin rioplatense', () => {
    expect(BLOQUES_CAZADOR_ES).toHaveLength(BLOQUES_CAZADOR.length);
    BLOQUES_CAZADOR_ES.forEach((b, i) => expect(b.momentos.length, b.nombre).toBe(BLOQUES_CAZADOR[i].momentos.length));
    expect(BLOQUES_CAZADOR_ES[13].nombre).toBe('Hoy');
    expect(JSON.stringify(BLOQUES_CAZADOR_ES)).not.toMatch(VOSEO);
    expect(JSON.stringify(BLOQUES_CAZADOR_ES)).not.toMatch(/de chico|de grande|mamá|papá|barra|querés|vivís/);
  });
  const resp = 'Todos los veranos íbamos al pueblo de mis abuelos, cerca de Soria, y ayudábamos a recoger el trigo.';
  const cita = 'íbamos al pueblo de mis abuelos';
  it('una pregunta buena pasa', () => {
    expect(controlarElegida({ cita, pregunta: '¿Hay algún verano de esos que se te haya quedado más que los otros, y qué pasó?' }, resp, false, 'es-ES')).toEqual([]);
  });
  it('tiempos relativos: ayer, anoche, hace un rato, el otro día, esta semana, hace un momento, ahora mismo', () => {
    for (const pregunta of ['¿Qué me contabas ayer del pueblo?', '¿Soñaste anoche con el pueblo?', '¿Lo que me dijiste hace un rato del pueblo, cómo fue?', '¿Cómo era el pueblo que me contaste el otro día?', '¿Has vuelto al pueblo esta semana?', '¿Lo de hace un momento, dónde fue?', '¿Ahora mismo piensas en el pueblo?']) {
      expect(controlarElegida({ cita, pregunta }, resp, false, 'es-ES'), pregunta).toContain('tiempo relativo');
    }
  });
  it('"hoy" solo en el bloque Hoy', () => {
    const pregunta = '¿Cómo es hoy un día tuyo en el pueblo?';
    expect(controlarElegida({ cita, pregunta }, resp, false, 'es-ES')).toContain('tiempo relativo');
    expect(controlarElegida({ cita, pregunta }, resp, true, 'es-ES')).toEqual([]);
  });
  it('es-AR no suma "el otro día" (sigue igual)', () => {
    expect(controlarElegida({ cita, pregunta: '¿Cómo era el pueblo que me contaste el otro día?' }, resp, false)).toEqual([]);
  });
  it('el mensaje y el botón de la repregunta salen de los textos es-ES', () => {
    expect(mensajeRepregunta({ cita: 'el pueblo', pregunta: '¿Qué verano recuerdas más?' }, 'es-ES')).toBe(
      '§Me he quedado pensando en algo que me contaste: «el pueblo». ¿Qué verano recuerdas más? Y si no te viene, dímelo.',
    );
    expect(botonRepregunta('es-ES')).toEqual({ texto: '§Ya lo conté todo', vale: 'no' });
    expect(botonRepregunta()).toEqual({ texto: 'Ya lo conté todo', vale: 'no' });
  });
  it('cazarBloque usa el prompt y los bloques es-ES (cliente falso)', async () => {
    const respuestas: Respuestas = new Map([
      ['CA2', 'Era una casa pequeña en la calle Mayor, con un patio y una higuera. Vivíamos seis.'],
      ['CA3', 'Mi madre cosía para fuera y cantaba mientras cosía.'],
      ['CA4', 'Paso de esa.'],
    ]);
    const pedidos: PedidoModelo[] = [];
    const cliente: ClienteModelo = {
      messages: {
        create: async (x) => {
          pedidos.push(x);
          return { content: [{ type: 'text', text: JSON.stringify({ elegidas: [{ id: 'CA2', cita: 'con un patio y una higuera', pregunta: '¿Te acuerdas de alguna tarde bajo esa higuera, quién estaba y qué hacíais?', tema: 'la higuera' }], escenas_contadas_bloque: [] }) }], usage: { input_tokens: 1000, output_tokens: 100 } };
        },
      },
    };
    const r = await cazarBloque({ cliente, ficha: '<ficha>\nnombre: Pilar\n</ficha>', bloque: 2, respuestas, textoPregunta: (id) => preguntaPorId(id, 'es-ES')!.texto, yaRepreguntado: [], escenasContadas: [], gastoUsd: 0, idioma: 'es-ES' });
    expect(pedidos[0].system).toBe(PROMPT_CAZADOR_DE['es-ES']);
    expect(pedidos[0].messages[0].content).toContain('<bloque>La casa de pequeño</bloque>');
    expect(pedidos[0].messages[0].content).toContain('el primer día de colegio');
    expect(pedidos[0].messages[0].content).toMatch(/<respuesta id="CA4" paso="si">/);
    expect(r.repreguntas).toHaveLength(1);
    const entradaAr = armarEntrada({ ficha: '', bloque: 2, respuestas: respuestasParaCazar(respuestas, 2, (id) => p(id).texto), yaRepreguntado: [], escenasContadas: [] });
    expect(entradaAr).toContain('<bloque>La casa de chico</bloque>');
  });
});

describe('el flujo en es-ES usa sus textos', () => {
  it('bancoDe, mensajes y bloques', () => {
    expect(bancoDe('es-ES').map((x) => x.id)).toEqual(BANCO.map((x) => x.id));
    expect(bancoDe('es-ES').every((x) => x.texto.startsWith('§'))).toBe(true);
    expect(mensajePorId('BIEN', 'es-ES')!.texto.startsWith('§')).toBe(true);
    expect(nombresBloqueDe('es-ES')[14]).toBe(`§${nombresBloqueDe()[14]}`);
    expect(bancoDe()).toBe(BANCO);
  });
  it('la primera pregunta y la segunda oportunidad', () => {
    const s = siguientePregunta({ respuestas: new Map(), idioma: 'es-ES' });
    expect(s.tipo === 'pregunta' && s.pregunta.texto.startsWith('§')).toBe(true);
    expect(siguientePregunta({ respuestas: new Map([['CA16', 'Se me ha olvidado.']]), idioma: 'es-ES' })).toMatchObject({ tipo: 'segunda-oportunidad', de: 'CA16', mensaje: 'M33.1' });
  });
  it('las dudas del dashboard nombran el tema en es-ES', () => {
    const ficha = { nombre: 'Pilar', anioNacimiento: 1948, genero: 'mujer' as const, paisNacimiento: 'España', paisResidencia: 'España', idioma: 'es-ES' as const };
    expect(contradiccionesConFicha({ ...ficha, migracion: { paises: ['Francia'] } } as never, new Map([['JU8', 'No, nunca.']]))).toEqual([expect.objectContaining({ temaTexto: 'vivir en otro sitio' })]);
  });
  it('el listado de preguntas (simulador y recuento) sale en el idioma de la ficha (revisión: antes, siempre rioplatense)', async () => {
    const { preguntasCompletas, preguntasDelNucleo } = await import('../src/v3/entrevista/seleccion.js');
    expect(preguntasCompletas({ nombre: 'Pilar', genero: 'mujer', idioma: 'es-ES' }).every((x) => x.texto.startsWith('§'))).toBe(true);
    expect(preguntasDelNucleo({ nombre: 'Pilar', genero: 'mujer', idioma: 'es-ES' }).every((x) => x.texto.startsWith('§'))).toBe(true);
    expect(preguntasDelNucleo({ nombre: 'Naza', genero: 'varon' })[0].texto.startsWith('§')).toBe(false);
  });
  it('"Bien, seguimos." no va delante de "Continuamos…"', () => {
    expect(acuseNeutro(0, 'Continuamos con la escuela.')).toBe('M25.3');
  });
});

/** Responde hasta el final con respuestas variadas (y toca botones de vez en cuando); devuelve todo lo que leyó el narrador. */
function entrevistaEntera(): string[] {
  const variadas = [
    'Nací en un pueblo de Teruel; mi padre era herrero y mi madre cosía para fuera.',
    'No me acuerdo.',
    'Paso.',
    'Se me ha olvidado, la verdad.',
    'Vale.',
    'Recuerdo la plaza del pueblo en fiestas, con la orquesta y mis primas bailando hasta las tantas.',
  ];
  let r = nuevaEntrevista({ nombre: 'Pilar', genero: 'mujer', idioma: 'es-ES' });
  const leidos = [...r.mensajes];
  for (let i = 0; i < 600 && !r.estado.terminada; i++) {
    const botones = botonesAbiertos(r.estado);
    r = botones.length > 0 && i % 3 === 0 && !r.estado.tocoSi ? tocarBoton(r.estado, botones.at(-1)!) : responder(r.estado, variadas[i % variadas.length]);
    leidos.push(...r.mensajes);
  }
  expect(r.estado.terminada).toBe(true);
  return leidos;
}

describe('la simulación por turnos con --idioma es-ES: ninguna línea en rioplatense', () => {
  it('una entrevista entera: cada línea que lee el narrador sale de los textos es-ES', () => {
    const leidos = entrevistaEntera();
    expect(leidos.length).toBeGreaterThan(100);
    const sueltas = leidos.flatMap((m) => m.split('\n')).filter((l) => l.trim() && !l.includes('§'));
    expect(sueltas).toEqual([]);
  });
  it('el CLI acepta --idioma es-ES', () => {
    const ruta = join(raiz, 'estado.json');
    expect(main(['nueva', ruta, '--nombre', 'Pilar', '--genero', 'mujer', '--idioma', 'es-ES'])).toContain("§Hola, Pilar");
    expect(() => main(['nueva', ruta, '--nombre', 'Pilar', '--genero', 'mujer', '--idioma', 'es'])).toThrow(/desconocido/);
  });
  it('el material del escritor lee la entrevista es-ES con su banco y su detector', () => {
    const ficha = { nombre: 'Pilar', genero: 'mujer' as const, idioma: 'es-ES' as const };
    const filas = aMaterial({ ficha, respuestas: [['CA2', 'Déjalo.'], ['CA3', `⟦botón:x⟧`], ['CA4', 'Mi padre me enseñó a nadar en el río.']], charla: [], familia: [] } as never);
    expect(filas[0].interpretacion).toBe('paso');
    expect(filas[0].pregunta.startsWith('§')).toBe(true);
    expect(filas[2].interpretacion).toBe('conto');
  });
});

describe('la página de prueba con --idioma es-ES', () => {
  const servidores: Server[] = [];
  afterEach(async () => {
    await Promise.all(servidores.splice(0).map((s) => new Promise((ok) => s.close(ok))));
  });
  it('la entrevista nueva es en es-ES y el audio se transcribe con idioma es-ES', async () => {
    const llamadas: { idioma?: string }[] = [];
    const s = createServer(
      crearManejador({
        datos: join(raiz, 'web'),
        log: () => {},
        dormir: async () => {},
        idioma: 'es-ES',
        transcribir: async (_audio, info) => {
          llamadas.push(info);
          return { texto: 'Nací en Soria.', duracionSegundos: 3 };
        },
      }),
    );
    servidores.push(s);
    await new Promise<void>((ok) => s.listen(0, '127.0.0.1', ok));
    const base = `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
    const nueva = (await (await fetch(base + '/api/nueva', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nombre: 'Pilar', genero: 'mujer' }) })).json()) as Vista;
    expect(JSON.stringify(nueva.globos)).toContain('§Hola, Pilar');
    await fetch(base + '/api/audio', { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: Buffer.from('audio-falso') });
    expect(llamadas[0].idioma).toBe('es-ES');
  });
});
