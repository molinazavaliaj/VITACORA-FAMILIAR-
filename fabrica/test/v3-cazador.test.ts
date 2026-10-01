// El cazador de escenas en la entrevista (plan: docs/v3/entrevista/cazador/
// plan-codigo.md, parte B1; Naza, 01/10). Al cerrar un bloque, Opus lee sus
// respuestas y elige hasta 2 para repreguntar; el código controla lo que
// devuelve y descarta lo que falla. NINGÚN test llama a la API: el cliente es
// uno falso, inyectado. Datos inventados.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  armarEntrada,
  BLOQUES_CAZADOR,
  cazarBloque,
  controlarElegida,
  costoUsd,
  extraerPrompt,
  fichaCorta,
  leerSalida,
  loQueViene,
  MAX_TOKENS_CAZADOR,
  mensajeRepregunta,
  MODELO_CAZADOR,
  PROMPT_CAZADOR,
  respuestasParaCazar,
  revisarElegidas,
  TOPE_GASTO_USD,
  type ClienteModelo,
  type PedidoModelo,
} from '../src/v3/entrevista/cazador.js';
import { BOTON_YA_LO_CONTE, type Repregunta } from '../src/v3/entrevista/flujo.js';
import { respuestaDeBoton } from '../src/v3/entrevista/respuesta.js';

const MD = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'v3', 'entrevista', 'cazador', 'prompt-v3-1.md'), 'utf8');

// Un bloque 2 inventado (La casa de chico), con una segunda oportunidad, un paso y un botón.
const RESPUESTAS = new Map<string, string>([
  ['OR1', 'Nací en un pueblo chico de la costa, en una casa con aljibe.'],
  ['CI1', respuestaDeBoton('No, está todo')],
  ['CA1', 'Me acuerdo del patio de baldosas y de la parra donde mi tío colgaba la hamaca.'],
  ['CA2', 'Mi mamá se llamaba Rosa. Cosía para afuera y cantaba tangos mientras pedaleaba la máquina.'],
  ['CA16', 'No me acuerdo.'],
  ['CA16~2', 'Los carnavales del club, con las serpentinas y el corso de los sábados.'],
  ['CA17', 'Paso.'],
  ['CA6', respuestaDeBoton('No tuve hermanos')],
  ['CI2', 'Una cosa más: el día que se inundó el sótano y sacamos los muebles con mi viejo.'],
]);
const textoPregunta = (id: string) => `[pregunta ${id}]`;

describe('el prompt sale del md (prompt-v3-1.md, sección "## Prompt")', () => {
  it('el prompt generado está al día con el md (si falla: npx tsx scripts/v3-cazador-json.ts)', () => {
    expect(PROMPT_CAZADOR).toBe(extraerPrompt(MD));
  });
  it('arranca y termina donde corresponde', () => {
    expect(PROMPT_CAZADOR.startsWith('Sos el cazador de escenas de una entrevista por audios')).toBe(true);
    expect(PROMPT_CAZADOR.endsWith('si no la podés escribir con convicción, no la elijas.')).toBe(true);
  });
});

describe('la llamada: Opus 5, 16000 tokens, tope de USD 3 por entrevista (Naza, 01/10)', () => {
  it('constantes', () => {
    expect(MODELO_CAZADOR).toBe('claude-opus-5');
    expect(MAX_TOKENS_CAZADOR).toBe(16000);
    expect(TOPE_GASTO_USD).toBe(3);
  });
  it('el costo: USD 5 por millón de entrada y 25 por millón de salida', () => {
    expect(costoUsd({ input_tokens: 1000, output_tokens: 200 })).toBeCloseTo(0.01, 10);
    expect(costoUsd({ input_tokens: 1_000_000, output_tokens: 0 })).toBeCloseTo(5, 10);
  });
});

describe('qué respuestas se le pasan', () => {
  const r = respuestasParaCazar(RESPUESTAS, 2, textoPregunta);

  it('solo las del bloque, en orden; sin botones sin texto; la X~2 pegada a su X', () => {
    expect(r.map((x) => x.id)).toEqual(['CA1', 'CA2', 'CA16', 'CA17', 'CI2']);
    expect(r.find((x) => x.id === 'CA16')).toEqual({
      id: 'CA16',
      pregunta: '[pregunta CA16]',
      texto: 'No me acuerdo.\nLos carnavales del club, con las serpentinas y el corso de los sábados.',
      pedidoDia: true,
      paso: false,
    });
  });

  it('marca paso y pedido_dia', () => {
    expect(r.find((x) => x.id === 'CA17')).toMatchObject({ paso: true, pedidoDia: false });
    expect(r.find((x) => x.id === 'CA2')).toMatchObject({ paso: false, pedidoDia: false });
  });

  it('un botón con audio atrás pasa el audio, sin la marca', () => {
    const m = new Map([['HI0', `${respuestaDeBoton('Sí, tuve')} Dos varones, el mayor nació en invierno.`]]);
    expect(respuestasParaCazar(m, 8, textoPregunta)).toEqual([{ id: 'HI0', pregunta: '[pregunta HI0]', texto: 'Dos varones, el mayor nació en invierno.', pedidoDia: false, paso: false }]);
  });

  it('no caza el bloque 15 (legado) ni las respuestas a repreguntas', () => {
    const m = new Map([['LE1', 'Estoy orgulloso de mis hijos.'], ['RP~CA2', 'Era en la cocina, de noche.']]);
    expect(respuestasParaCazar(m, 15, textoPregunta)).toEqual([]);
    expect(respuestasParaCazar(m, 2, textoPregunta)).toEqual([]);
  });
});

describe('la entrada del modelo', () => {
  it('lo que viene: los momentos de los bloques que faltan', () => {
    expect(BLOQUES_CAZADOR).toHaveLength(15);
    expect(loQueViene(13)).toEqual([...BLOQUES_CAZADOR[13].momentos, ...BLOQUES_CAZADOR[14].momentos]);
    expect(loQueViene(14)).toEqual(BLOQUES_CAZADOR[14].momentos);
  });

  it('se arma como en la prueba contra la API (scripts/v3-cazador-prueba-v3.ts)', () => {
    const yaRepreguntado: Repregunta[] = [{ clave: 'RP~OR2', origen: 'OR2', bloque: 1, cita: 'x', pregunta: '¿y?', tema: 'el barco del abuelo' }];
    const entrada = armarEntrada({
      ficha: fichaCorta({ nombre: 'Elvira', genero: 'mujer' }),
      bloque: 14,
      respuestas: [{ id: 'HO1', pregunta: '¿Cómo es un día tuyo?', texto: 'Riego la huerta temprano.', pedidoDia: false, paso: false }, { id: 'HO2', pregunta: '¿Qué te hace reír?', texto: 'Paso.', pedidoDia: true, paso: true }],
      yaRepreguntado,
      escenasContadas: ['la mudanza a la casa nueva'],
    });
    expect(entrada).toBe(
      [
        '<ficha>\nnombre: Elvira\ngénero: mujer\n</ficha>',
        '<bloque>Hoy</bloque>',
        '<ya_repreguntado>\nOR2: el barco del abuelo\n</ya_repreguntado>',
        '<escenas_contadas>\nla mudanza a la casa nueva\n</escenas_contadas>',
        `<lo_que_viene>\n${BLOQUES_CAZADOR[14].momentos.join('\n')}\n</lo_que_viene>`,
        '<respuestas_del_bloque>\n<respuesta id="HO1">\n<pregunta>¿Cómo es un día tuyo?</pregunta>\n<texto>Riego la huerta temprano.</texto>\n</respuesta>\n<respuesta id="HO2" pedido_dia="si" paso="si">\n<pregunta>¿Qué te hace reír?</pregunta>\n<texto>Paso.</texto>\n</respuesta>\n</respuestas_del_bloque>',
      ].join('\n\n'),
    );
  });
});

describe('la salida del modelo', () => {
  it('lee el JSON aunque venga con texto alrededor', () => {
    expect(leerSalida('Acá va:\n{"elegidas": [{"id": "CA2", "cita": "c", "pregunta": "¿p?", "tema": "t"}], "escenas_contadas_bloque": ["e"]}\nlisto')).toEqual({
      elegidas: [{ id: 'CA2', cita: 'c', pregunta: '¿p?', tema: 't' }],
      escenasContadas: ['e'],
    });
  });
  it('sin listas, vacías; ilegible, undefined', () => {
    expect(leerSalida('{}')).toEqual({ elegidas: [], escenasContadas: [] });
    expect(leerSalida('no hay json')).toBeUndefined();
    expect(leerSalida('{"elegidas": [')).toBeUndefined();
  });
});

describe('los controles de código (los de la prueba v3, más ids)', () => {
  const RESP = 'Mi mamá se llamaba Rosa. Cosía para afuera y cantaba tangos mientras pedaleaba la máquina.';
  const bien = { id: 'CA2', cita: 'cantaba tangos mientras pedaleaba la máquina', pregunta: '¿Te acordás de alguna tarde en que la escuchaste cantar, dónde estabas vos?', tema: 'la tarde de los tangos' };
  const delBloque = respuestasParaCazar(RESPUESTAS, 2, textoPregunta);

  it('controlarElegida: cita textual y contigua, un solo "?", hasta 45 palabras, sin tiempos relativos', () => {
    expect(controlarElegida(bien, RESP, false)).toEqual([]);
    expect(controlarElegida({ ...bien, cita: 'cantaba tangos pedaleando' }, RESP, false)).toEqual(['la cita no es textual']);
    expect(controlarElegida({ ...bien, pregunta: '¿Dónde? ¿Con quién?' }, RESP, false)).toEqual(['la pregunta no tiene un solo "?"']);
    expect(controlarElegida({ ...bien, pregunta: `¿${'palabra '.repeat(45)}fin?` }, RESP, false)).toEqual(['pregunta de más de 45 palabras']);
    expect(controlarElegida({ ...bien, pregunta: '¿Qué cantaba anoche?' }, RESP, false)).toEqual(['tiempo relativo']);
    expect(controlarElegida({ ...bien, pregunta: '¿Qué cantás hoy?' }, RESP, false)).toEqual(['tiempo relativo']);
    expect(controlarElegida({ ...bien, pregunta: '¿Qué cantás hoy?' }, RESP, true)).toEqual([]);
  });

  it('pasan las buenas, como repreguntas con clave RP~<id>', () => {
    const r = revisarElegidas([bien], delBloque, 2, []);
    expect(r.descartadas).toEqual([]);
    expect(r.repreguntas).toEqual([{ clave: 'RP~CA2', origen: 'CA2', bloque: 2, cita: bien.cita, pregunta: bien.pregunta, tema: 'la tarde de los tangos' }]);
  });

  it('la que falla se descarta con su motivo; la otra sigue', () => {
    const mala = { id: 'CI2', cita: 'el día que se inundó la casa', pregunta: '¿Cómo fue?', tema: 'la inundación' };
    const r = revisarElegidas([mala, bien], delBloque, 2, []);
    expect(r.repreguntas.map((x) => x.origen)).toEqual(['CA2']);
    expect(r.descartadas).toEqual([{ id: 'CI2', cita: mala.cita, pregunta: '¿Cómo fue?', tema: 'la inundación', fallas: ['la cita no es textual'] }]);
  });

  it('ids distintos: la segunda de la misma respuesta se descarta', () => {
    const otra = { ...bien, cita: 'Cosía para afuera', tema: 'la costura' };
    const r = revisarElegidas([bien, otra], delBloque, 2, []);
    expect(r.repreguntas).toHaveLength(1);
    expect(r.descartadas[0].fallas).toEqual(['dos de la misma respuesta']);
  });

  it('un id ya repreguntado, o que no es de este bloque, se descarta', () => {
    const ya: Repregunta[] = [{ clave: 'RP~CA2', origen: 'CA2', bloque: 2, cita: 'x', pregunta: '¿y?', tema: 't' }];
    expect(revisarElegidas([bien], delBloque, 2, ya).descartadas[0].fallas).toEqual(['ya repreguntado']);
    expect(revisarElegidas([{ ...bien, id: 'OR1' }], delBloque, 2, []).descartadas[0].fallas).toContain('la respuesta no es de este bloque');
  });

  it('hasta 2: una tercera elegida ni se mira', () => {
    const tres = [bien, { id: 'CA1', cita: 'la parra donde mi tío colgaba la hamaca', pregunta: '¿Te acordás de una siesta en esa hamaca?', tema: 'la hamaca' }, { id: 'CI2', cita: 'se inundó el sótano', pregunta: '¿Qué salvaron primero?', tema: 'la inundación' }];
    const r = revisarElegidas(tres, delBloque, 2, []);
    expect(r.repreguntas.map((x) => x.origen)).toEqual(['CA2', 'CA1']);
    expect(r.descartadas).toEqual([]);
  });
});

describe('el mensaje de la repregunta (mitad fijo, mitad escrito; Naza, 01/10)', () => {
  it('letra por letra', () => {
    expect(mensajeRepregunta({ cita: 'la parra donde mi tío colgaba la hamaca', pregunta: '¿Te acordás de una siesta en esa hamaca?' })).toBe(
      'Me quedé pensando en algo que me contaste: «la parra donde mi tío colgaba la hamaca». ¿Te acordás de una siesta en esa hamaca? Y si no te vuelve, o ya me lo contaste todo, decímelo nomás y seguimos con otra.',
    );
  });
  it('con el botón [Ya lo conté todo], que vale "no"', () => {
    expect(BOTON_YA_LO_CONTE).toEqual({ texto: 'Ya lo conté todo', vale: 'no' });
  });
});

// ---------------------------------------------------------------- con cliente falso

type Respuestita = Awaited<ReturnType<ClienteModelo['messages']['create']>>;
const salida = (json: unknown, entrada = 10_000, salidaTokens = 2_000): Respuestita => ({
  content: [{ type: 'text', text: JSON.stringify(json) }],
  usage: { input_tokens: entrada, output_tokens: salidaTokens },
});

/** Un cliente falso: devuelve (o tira) lo que le toca a cada llamada, y anota los pedidos. */
function falso(vueltas: (Respuestita | Error)[]) {
  const pedidos: PedidoModelo[] = [];
  const cliente: ClienteModelo = {
    messages: {
      create: async (p) => {
        pedidos.push(p);
        const v = vueltas.shift();
        if (!v) throw new Error('el falso se quedó sin respuestas');
        if (v instanceof Error) throw v;
        return v;
      },
    },
  };
  return { cliente, pedidos };
}

const BUENA = { id: 'CA2', cita: 'cantaba tangos mientras pedaleaba la máquina', pregunta: '¿Te acordás de alguna tarde en que la escuchaste cantar?', tema: 'la tarde de los tangos' };
const base = { ficha: fichaCorta({ nombre: 'Elvira', genero: 'mujer' as const }), bloque: 2, respuestas: RESPUESTAS, textoPregunta, yaRepreguntado: [], escenasContadas: [], gastoUsd: 0 };

describe('cazarBloque', () => {
  it('llama una vez con el prompt, el modelo y la entrada del bloque; devuelve repreguntas, escenas, tokens y costo', async () => {
    const { cliente, pedidos } = falso([salida({ elegidas: [BUENA], escenas_contadas_bloque: ['el sótano inundado'] })]);
    const r = await cazarBloque({ ...base, cliente, gastoUsd: 0.5 });
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]).toEqual({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: PROMPT_CAZADOR,
      messages: [{ role: 'user', content: armarEntrada({ ...base, respuestas: respuestasParaCazar(RESPUESTAS, 2, textoPregunta) }) }],
    });
    expect(r).toMatchObject({ bloque: 2, llamo: true, escenasContadas: ['el sótano inundado'], tokens: { entrada: 10_000, salida: 2_000 }, descartadas: [] });
    expect(r.repreguntas.map((x) => x.clave)).toEqual(['RP~CA2']);
    expect(r.costoUsd).toBeCloseTo(0.1, 10);
    expect(r.gastoUsd).toBeCloseTo(0.6, 10);
  });

  it('la elegida que falla se descarta y queda registrada', async () => {
    const { cliente } = falso([salida({ elegidas: [{ ...BUENA, pregunta: 'Contame una tarde.' }], escenas_contadas_bloque: [] })]);
    const r = await cazarBloque({ ...base, cliente });
    expect(r.repreguntas).toEqual([]);
    expect(r.descartadas[0].fallas).toEqual(['la pregunta no tiene un solo "?"']);
  });

  it('el bloque 15 no se caza: ni se llama', async () => {
    const { cliente, pedidos } = falso([]);
    const r = await cazarBloque({ ...base, cliente, bloque: 15 });
    expect(pedidos).toHaveLength(0);
    expect(r).toMatchObject({ llamo: false, motivo: 'legado', repreguntas: [], costoUsd: 0, gastoUsd: 0 });
  });

  it('un bloque sin respuestas para cazar (solo botones) no llama', async () => {
    const { cliente, pedidos } = falso([]);
    const r = await cazarBloque({ ...base, cliente, respuestas: new Map([['CA6', respuestaDeBoton('No tuve hermanos')]]) });
    expect(pedidos).toHaveLength(0);
    expect(r).toMatchObject({ llamo: false, motivo: 'sin-respuestas' });
  });

  it('con el tope de USD 3 alcanzado no se llama más: la entrevista sigue sin cazador', async () => {
    const { cliente, pedidos } = falso([]);
    const r = await cazarBloque({ ...base, cliente, gastoUsd: 3 });
    expect(pedidos).toHaveLength(0);
    expect(r).toMatchObject({ llamo: false, motivo: 'tope', repreguntas: [], gastoUsd: 3 });
  });

  it('si falla la red, reintenta una vez', async () => {
    const { cliente, pedidos } = falso([new Error('Connection error.'), salida({ elegidas: [BUENA], escenas_contadas_bloque: [] })]);
    const r = await cazarBloque({ ...base, cliente });
    expect(pedidos).toHaveLength(2);
    expect(r.repreguntas).toHaveLength(1);
  });

  it('si vuelve a fallar, ese bloque no caza y la entrevista sigue igual (sin tirar error)', async () => {
    const { cliente, pedidos } = falso([new Error('Connection error.'), new Error('Connection error.')]);
    const r = await cazarBloque({ ...base, cliente, gastoUsd: 1 });
    expect(pedidos).toHaveLength(2);
    expect(r).toMatchObject({ llamo: true, motivo: 'error', repreguntas: [], costoUsd: 0, gastoUsd: 1, error: 'Connection error.' });
  });

  it('si la salida no se puede leer, no caza, pero el gasto cuenta', async () => {
    const { cliente } = falso([{ content: [{ type: 'text', text: 'perdón, no pude' }], usage: { input_tokens: 1000, output_tokens: 0 } }]);
    const r = await cazarBloque({ ...base, cliente });
    expect(r).toMatchObject({ llamo: true, motivo: 'salida-ilegible', repreguntas: [] });
    expect(r.costoUsd).toBeCloseTo(0.005, 10);
  });
});
