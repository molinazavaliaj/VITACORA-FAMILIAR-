// Task 1.4 del plan de «Vitácora de una historia»: el cazador de escenas pide
// como mucho UNA repregunta por bloque y nunca dos sobre la misma respuesta
// (spec §4.2, banco.md regla 9), con el tope de USD 3 por entrevista. NINGÚN
// test llama a la API: el cliente es falso.

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import promptJson from '../src/historia/entrevista/cazador-prompt.json';
import promptCaJson from '../src/historia/entrevista/cazador-prompt-ca.json';
import promptEsEsJson from '../src/historia/entrevista/cazador-prompt-es-ES.json';
import { bancoHistoria, preguntaPorId } from '../src/historia/entrevista/banco';
import {
  cazarBloque,
  extraerPrompt,
  fichaCazador,
  loQueViene,
  MAX_ELEGIDAS,
  PROMPT_CAZADOR_DE,
  respuestasParaCazar,
  TOPE_GASTO_USD,
  type ClienteModelo,
  type PedidoCaza,
  type PedidoModelo,
} from '../src/historia/entrevista/cazador';
import { claveRepregunta, FOTO, type Repregunta } from '../src/historia/entrevista/flujo';
import { respuestaDeBoton } from '../src/historia/entrevista/respuesta';

type Respuestita = Awaited<ReturnType<ClienteModelo['messages']['create']>>;

/** Un cliente falso: devuelve (o tira) lo que le toca a cada llamada, y anota los pedidos. */
function falso(vueltas: (Respuestita | Error)[]) {
  const pedidos: PedidoModelo[] = [];
  const cliente: ClienteModelo = {
    messages: {
      create: async (p) => {
        pedidos.push(p);
        const v = vueltas.shift();
        if (!v) throw new Error('el cliente falso no tiene más vueltas');
        if (v instanceof Error) throw v;
        return v;
      },
    },
  };
  return { cliente, pedidos };
}

const salida = (json: unknown, tokens = { input_tokens: 10_000, output_tokens: 2_000 }): Respuestita => ({ content: [{ type: 'text', text: JSON.stringify(json) }], usage: tokens });

const HC1 = 'Vivía en Rosario con mi hermana, trabajaba en la panadería del barrio y los domingos íbamos al río.';
const HC2 = 'Era muy callada, pero una vez le tiré un balde de agua al dueño de la pensión porque no nos daba la llave.';
const banco = bancoHistoria('mudanza').preguntas;
const base: Omit<PedidoCaza, 'cliente'> = {
  ficha: '<ficha>\nnombre: Ana\ngénero: mujer\n</ficha>',
  bloque: 1,
  banco,
  respuestas: new Map([['HC1', HC1], ['HC2', HC2]]),
  textoPregunta: (id) => preguntaPorId(id)!.texto,
  yaRepreguntado: [],
  escenasContadas: [],
  gastoUsd: 0,
};
const ELEGIDA_1 = { id: 'HC2', cita: 'le tiré un balde de agua al dueño de la pensión', pregunta: '¿Te acordás de ese día, qué te dijo él después?', tema: 'el balde de agua' };
const ELEGIDA_2 = { id: 'HC1', cita: 'los domingos íbamos al río', pregunta: '¿Hay algún domingo en el río que te haya quedado más que otros?', tema: 'el río' };

describe('cazador de historia', () => {
  it('pide como mucho UNA repregunta por bloque, aunque el modelo elija dos', async () => {
    expect(MAX_ELEGIDAS).toBe(1);
    const { cliente } = falso([salida({ elegidas: [ELEGIDA_1, ELEGIDA_2], escenas_contadas_bloque: [] })]);
    const r = await cazarBloque({ ...base, cliente });
    expect(r.repreguntas).toEqual([{ clave: claveRepregunta('HC2'), origen: 'HC2', bloque: 1, cita: ELEGIDA_1.cita, pregunta: ELEGIDA_1.pregunta, tema: 'el balde de agua' }]);
    expect(r.descartadas).toEqual([]);
  });
  it('si la primera elegida falla los controles, entra la siguiente que pasa', async () => {
    const inventada = { ...ELEGIDA_2, cita: 'una cita que no dijo nunca' };
    const { cliente } = falso([salida({ elegidas: [inventada, ELEGIDA_1], escenas_contadas_bloque: [] })]);
    const r = await cazarBloque({ ...base, cliente });
    expect(r.repreguntas.map((x) => x.origen)).toEqual(['HC2']);
    expect(r.descartadas.map((x) => x.fallas)).toEqual([['la cita no es textual']]);
  });
  it('nunca dos veces sobre la misma respuesta', async () => {
    const ya: Repregunta = { clave: claveRepregunta('HC2'), origen: 'HC2', bloque: 1, cita: 'x', pregunta: '¿x?', tema: 'x' };
    const { cliente } = falso([salida({ elegidas: [ELEGIDA_1], escenas_contadas_bloque: [] })]);
    const r = await cazarBloque({ ...base, cliente, yaRepreguntado: [ya] });
    expect(r.repreguntas).toEqual([]);
    expect(r.descartadas[0].fallas).toContain('ya repreguntado');
  });
  it('respeta el tope de USD 3 por entrevista: alcanzado, no llama', async () => {
    expect(TOPE_GASTO_USD).toBe(3);
    const { cliente, pedidos } = falso([]);
    const r = await cazarBloque({ ...base, cliente, gastoUsd: 3 });
    expect(r).toMatchObject({ llamo: false, motivo: 'tope', repreguntas: [] });
    expect(pedidos).toHaveLength(0);
  });
  it('suma lo que cuesta cada llamada al gasto de la entrevista', async () => {
    const { cliente } = falso([salida({ elegidas: [], escenas_contadas_bloque: ['el río'] })]);
    const r = await cazarBloque({ ...base, cliente, gastoUsd: 1 });
    expect(r.costoUsd).toBeCloseTo(10_000 * 4e-6 + 2_000 * 20e-6);
    expect(r.gastoUsd).toBeCloseTo(1 + r.costoUsd);
    expect(r.escenasContadas).toEqual(['el río']);
  });
  it('no caza el bloque del cierre (HC10): después no hay dónde repreguntar', async () => {
    const { cliente, pedidos } = falso([]);
    const r = await cazarBloque({ ...base, cliente, bloque: preguntaPorId('HC10')!.bloque, respuestas: new Map([['HC10', HC2]]) });
    expect(r).toMatchObject({ llamo: false, motivo: 'cierre' });
    expect(pedidos).toHaveLength(0);
  });
  it('sin respuestas con texto no llama; FOTO-H, las de quien regala y las repreguntas no se cazan', async () => {
    const respuestas = new Map([['HC3', respuestaDeBoton('No')], [FOTO, HC1], ['PR-H1', HC1], [claveRepregunta('HC1'), HC1]]);
    const { cliente, pedidos } = falso([]);
    const r = await cazarBloque({ ...base, cliente, bloque: 2, respuestas });
    expect(r).toMatchObject({ llamo: false, motivo: 'sin-respuestas' });
    expect(pedidos).toHaveLength(0);
  });
  it('si el modelo falla dos veces, ese bloque no caza y la entrevista sigue', async () => {
    const { cliente, pedidos } = falso([new Error('Connection error.'), new Error('Connection error.')]);
    const r = await cazarBloque({ ...base, cliente });
    expect(r).toMatchObject({ llamo: true, motivo: 'error', repreguntas: [] });
    expect(pedidos).toHaveLength(2);
  });
  it('las variantes se cazan en el bloque de la común que reemplazan', () => {
    const conocimos = bancoHistoria('conocimos').preguntas;
    const r = respuestasParaCazar(new Map([['HC8-Q', HC1]]), preguntaPorId('HC8')!.bloque, (id) => id);
    expect(r.map((x) => x.id)).toEqual(['HC8-Q']);
    expect(conocimos.some((p) => p.id === 'HC8-Q')).toBe(true);
  });
});

describe('lo que ve el modelo', () => {
  it('la ficha trae el tema (la etiqueta de temas.md) y, si la hay, la historia en sus palabras', () => {
    expect(fichaCazador({ nombre: 'Ana', genero: 'mujer', tema: 'mudanza' })).toBe('<ficha>\nnombre: Ana\ngénero: mujer\ntema: Irse a vivir lejos\n</ficha>');
    expect(fichaCazador({ nombre: 'Juan', genero: 'varon', tema: 'otra', temaLibre: ' cuando me quebré la pierna ', idioma: 'ca' })).toBe(
      '<ficha>\nnombre: Juan\ngénero: varón\ntema: Una altra història\nen sus palabras: cuando me quebré la pierna\n</ficha>',
    );
  });
  it('en es-AR va el prompt de historia: como mucho UNA, sin bloque Hoy ni pedido_dia (Naza, 23/10)', () => {
    const p = PROMPT_CAZADOR_DE['es-AR'];
    expect(p).toContain('elegís como mucho UNA respuesta');
    expect(p).toContain('el tema de su historia');
    expect(p).not.toMatch(/bloque Hoy|pedido_dia|DOS respuestas|pareja de hoy/);
    expect(p).toContain('{"elegidas": [');
  });
  it('ninguna respuesta lleva la marca pedido_dia', () => {
    const r = respuestasParaCazar(new Map([['HC1', HC1]]), 1, (id) => id);
    expect(r).toEqual([{ id: 'HC1', pregunta: 'HC1', texto: HC1, paso: false }]);
  });
  it('el prompt del idioma, el nombre del bloque de banco.md y lo que viene del banco de su tema', async () => {
    const { cliente, pedidos } = falso([salida({ elegidas: [], escenas_contadas_bloque: [] })]);
    await cazarBloque({ ...base, cliente });
    const [p] = pedidos;
    expect(p.system).toBe(PROMPT_CAZADOR_DE['es-AR']);
    expect(p.model).toBe('claude-opus-5-5');
    const entrada = p.messages[0].content;
    expect(entrada).toContain('<bloque>El antes</bloque>');
    expect(entrada).toContain(preguntaPorId('HM1')!.texto);
    expect(entrada).not.toContain(preguntaPorId('HQ1')!.texto);
    expect(entrada).toContain(`<texto>${HC2}</texto>`);
  });
  it('lo que viene: las preguntas de los bloques que faltan, menos el cierre', () => {
    const viene = loQueViene(5, banco, (id) => id);
    expect(viene).toEqual(['HC8', 'HC9']);
  });
  it('en catalán y en es-ES, su prompt', async () => {
    const { cliente, pedidos } = falso([salida({ elegidas: [], escenas_contadas_bloque: [] })]);
    await cazarBloque({ ...base, cliente, idioma: 'ca' });
    expect(pedidos[0].system).toBe(PROMPT_CAZADOR_DE.ca);
    expect(PROMPT_CAZADOR_DE.ca).not.toBe(PROMPT_CAZADOR_DE['es-AR']);
    expect(PROMPT_CAZADOR_DE['es-ES']).not.toBe(PROMPT_CAZADOR_DE['es-AR']);
  });
});

describe('los prompts al día (si falla: cd fabrica && npx tsx scripts/historia-cazador-json.ts)', () => {
  for (const [json, propio, deV3] of [
    [promptJson, 'docs/historia/cazador/prompt.md', 'docs/v3/entrevista/cazador/prompt-v3-1.md'],
    [promptCaJson, 'docs/historia/cazador/prompt-ca.md', 'docs/v3/entrevista/cazador/prompt-v3-1-ca.md'],
    [promptEsEsJson, 'docs/historia/cazador/prompt-es-ES.md', 'docs/v3/entrevista/cazador/prompt-v3-1-es-ES.md'],
  ] as const) {
    it(`el prompt sale de ${propio} si existe, si no de ${deV3}`, () => {
      // La fuente se decide acá igual que en el script: si aparece el prompt de historia, el json viejo (de V3) falla.
      const fuente = existsSync(`../${propio}`) ? propio : deV3;
      expect(json).toEqual({ fuente, prompt: extraerPrompt(readFileSync(`../${fuente}`, 'utf8')) });
    });
  }
});
