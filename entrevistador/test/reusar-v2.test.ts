import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { armarPromptReusar, parsearReusar, buscarReusable, MAX_PREGUNTA_VIEJA, MAX_RESPUESTA_VIEJA } from '../src/ia/reusar-v2.js';
import { viejasDe, candidatasPara, seBusca, pasaPorCandado, lineaReusada, opcionesDeReuso, reusadasEnTexto } from '../src/manual/reusar-v2.js';
import { modeloDePaso, MODELO_EVALUACION } from '../src/ia/modelos-v2.js';
import type { Objetivo } from '../src/ia/pregunta-v2.js';

// Ajuste D (24/09, pedido de Naza): el piloto de cero, reusando las respuestas del piloto anterior.
// Todo con modelo falso: nada pago.

const laEscuela: Objetivo = { tipo: 'nucleo', id: 'la-escuela', tramo: 'infancia', bloque: 'infancia', tema: 'La escuela primaria', pormenores: ['un maestro', 'un compañero'], fila: 'la-escuela' };
const cliente = (texto: string, stop_reason = 'end_turn') => ({ messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: texto }], stop_reason, usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic);
const candidatas = [
  { corto: 'R1', pregunta: '¿Cómo era tu casa?', respuesta: 'Una casa de tres pisos en Martínez.' },
  { corto: 'R2', pregunta: '¿Cómo era tu escuela?', respuesta: 'Fui al Saint John\'s y a los 8 me cambiaron al Fátima.' },
];

describe('el prompt de la búsqueda (v2-reusar)', () => {
  it('lleva el tema con sus pormenores, la pregunta nueva y cada vieja con su id, su pregunta y el comienzo de la respuesta', () => {
    const p = armarPromptReusar(laEscuela, '¿Qué te acordás de la escuela?', candidatas);
    expect(p).toContain('La escuela primaria');
    expect(p).toContain('un maestro; un compañero');
    expect(p).toContain('¿Qué te acordás de la escuela?');
    expect(p).toContain('[R2]');
    expect(p).toContain('Fui al Saint John');
    expect(p).toContain('"cubre"');
    expect(p).toMatch(/Ante la duda, ninguna/);
    // Que no lo confunda el modelo falso ni la evaluación: sus marcas no están.
    expect(p).not.toContain('LA PREGUNTA DE HOY');
    expect(p).not.toContain('LO QUE TE TOCA PREGUNTAR HOY');
  });
  it('corta la pregunta vieja en 200 caracteres y la respuesta en 600', () => {
    const larga = [{ corto: 'R1', pregunta: 'p'.repeat(500), respuesta: 'r'.repeat(2000) }];
    const p = armarPromptReusar(laEscuela, '¿?', larga);
    expect(p).toContain('p'.repeat(MAX_PREGUNTA_VIEJA));
    expect(p).not.toContain('p'.repeat(MAX_PREGUNTA_VIEJA + 1));
    expect(p).toContain('r'.repeat(MAX_RESPUESTA_VIEJA));
    expect(p).not.toContain('r'.repeat(MAX_RESPUESTA_VIEJA + 1));
  });
});

describe('parsearReusar', () => {
  const validos = ['R1', 'R2'];
  it('entero o parcial con un id válido: se reusa', () => {
    expect(parsearReusar('{"respuesta": "R2", "cubre": "entero"}', validos)).toEqual({ corto: 'R2', cubre: 'entero' });
    expect(parsearReusar('Mirá: {"respuesta": "R1", "cubre": "parcial"}', validos)).toEqual({ corto: 'R1', cubre: 'parcial' });
  });
  it('"no", null, un id que no existe o ya usado, o basura: ninguna', () => {
    expect(parsearReusar('{"respuesta": "R2", "cubre": "no"}', validos).corto).toBeNull();
    expect(parsearReusar('{"respuesta": null, "cubre": "no"}', validos).corto).toBeNull();
    expect(parsearReusar('{"respuesta": "R9", "cubre": "entero"}', validos).corto).toBeNull();
    expect(parsearReusar('{"respuesta": "R2", "cubre": "quizás"}', validos).corto).toBeNull();
    expect(parsearReusar('bla bla', validos).corto).toBeNull();
    expect(parsearReusar('{"respuesta": "R2", "cub', validos).corto).toBeNull();
  });
});

describe('buscarReusable', () => {
  it('usa el modelo de la evaluación, sin pensar, y devuelve la elegida con sus usos', async () => {
    const c = cliente('{"respuesta": "R2", "cubre": "entero"}');
    const r = await buscarReusable(c, laEscuela, '¿La escuela?', candidatas);
    expect(r).toMatchObject({ corto: 'R2', cubre: 'entero' });
    expect(r.usos).toHaveLength(1);
    const pedido = (c.messages.create as unknown as { mock: { calls: any[][] } }).mock.calls[0][0];
    expect(pedido.model).toBe(MODELO_EVALUACION);
    expect(pedido.thinking).toEqual({ type: 'disabled' });
    expect(modeloDePaso('v2-reusar')).toBe(MODELO_EVALUACION);
  });
  it('salida cortada (max_tokens) o basura: sin coincidencia, sin tirar, y el gasto igual se cuenta', async () => {
    const cortada = await buscarReusable(cliente('{"respuesta": "R2", "cu', 'max_tokens'), laEscuela, '¿?', candidatas);
    expect(cortada.corto).toBeNull();
    expect(cortada.usos).toHaveLength(1);
    expect(cortada.motivo).toMatch(/cortó/);
    expect((await buscarReusable(cliente('no sé'), laEscuela, '¿?', candidatas)).corto).toBeNull();
  });
  it('si la llamada se cae: sin coincidencia, sin tirar (se le pregunta en vivo)', async () => {
    const caido = { messages: { create: vi.fn(async () => { throw new Error('529 overloaded'); }) } } as unknown as Anthropic;
    const r = await buscarReusable(caido, laEscuela, '¿?', candidatas);
    expect(r).toMatchObject({ corto: null, usos: [] });
    expect(r.motivo).toMatch(/529/);
  });
  it('sin candidatas no llama al modelo', async () => {
    const c = cliente('{}');
    expect((await buscarReusable(c, laEscuela, '¿?', [])).corto).toBeNull();
    expect(c.messages.create).not.toHaveBeenCalled();
  });
});

describe('las respuestas viejas', () => {
  const datos = {
    contexto: { v2: { preguntasEnviadas: { 0: 'Hola, soy el biógrafo…', 1: '¿Cómo era tu casa?', 2: '¿Y la escuela?' }, repreguntasEnviadas: { 1: '¿Quién vivía ahí?' }, bloqueadas: ['v-ajena'] } },
    respuestas: [
      { id: 'v-0', pregunta_orden: 0, es_repregunta: false, transcripcion: 'Tengo 27, me dicen Naza.', texto_directo: null, recibido_at: '2026-09-20T10:00:00Z' },
      { id: 'v-1', pregunta_orden: 1, es_repregunta: false, transcripcion: null, texto_directo: 'Una casa de tres pisos.', recibido_at: '2026-09-20T11:00:00Z' },
      { id: 'v-1r', pregunta_orden: 1, es_repregunta: true, transcripcion: 'Mis viejos y mis hermanos.', texto_directo: null, recibido_at: '2026-09-20T12:00:00Z' },
      { id: 'v-ajena', pregunta_orden: 2, es_repregunta: false, transcripcion: 'El audio de Ciro.', texto_directo: null, recibido_at: '2026-09-20T13:00:00Z' },
      { id: 'v-vacia', pregunta_orden: 2, es_repregunta: false, transcripcion: '  ', texto_directo: null, recibido_at: '2026-09-20T14:00:00Z' },
    ],
  };
  it('con su pregunta (o repregunta) real; sin las vacías ni las que frenó el candado; ids cortos estables por llegada', () => {
    const v = viejasDe(datos);
    expect(v.map((x) => [x.corto, x.id, x.pregunta, x.respuesta])).toEqual([
      ['R1', 'v-0', 'Hola, soy el biógrafo…', 'Tengo 27, me dicen Naza.'],
      ['R2', 'v-1', '¿Cómo era tu casa?', 'Una casa de tres pisos.'],
      ['R3', 'v-1r', '¿Quién vivía ahí?', 'Mis viejos y mis hermanos.'],
    ]);
  });
  it('las ya usadas no vuelven a ser candidatas', () => {
    const v = viejasDe(datos);
    expect(candidatasPara(v, { 0: 'v-0', 3: 'v-1r' }).map((x) => x.corto)).toEqual(['R2']);
  });
  it('la línea de lo reusado corta la pregunta vieja en 80 caracteres', () => {
    const l = lineaReusada({ id: 'x', corto: 'R1', orden: 1, esRepregunta: false, pregunta: 'a'.repeat(100), respuesta: 'b' });
    expect(l).toBe(`Reusé tu respuesta del piloto anterior a «${'a'.repeat(80)}…» para esta pregunta.`);
  });
});

describe('qué se busca', () => {
  it('la presentación, un núcleo o una libre sí; una repregunta o un objeto nunca', () => {
    expect(seBusca(laEscuela)).toBe(true);
    expect(seBusca({ tipo: 'variable', id: 'libre-infancia-1', tramo: 'infancia', desde: 0, hasta: 12, anclas: ['los perros'] })).toBe(true);
    expect(seBusca({ tipo: 'repregunta', id: 'x-repregunta', tramo: null, pregunta: '¿?', falto: ['a'] })).toBe(false);
    expect(seBusca({ tipo: 'objeto', id: 'objeto-infancia', tramo: 'infancia' })).toBe(false);
  });
});

describe('el candado de audio cruzado y las reusadas', () => {
  it('una reusada nunca pasa por el candado; un audio sí (salvo --es-suyo); el texto escrito, como antes, no', () => {
    expect(pasaPorCandado('reusada')).toBe(false);
    expect(pasaPorCandado('audio')).toBe(true);
    expect(pasaPorCandado('audio', true)).toBe(false);
    expect(pasaPorCandado('texto')).toBe(false);
  });
});

describe('opciones y estado', () => {
  it('--seguido por defecto sí (con "--seguido no" se apaga); --max por defecto 8', () => {
    expect(opcionesDeReuso({})).toEqual({ seguido: true, max: 8 });
    expect(opcionesDeReuso({ seguido: 'no', max: '3' })).toEqual({ seguido: false, max: 3 });
    expect(opcionesDeReuso({ seguido: true })).toEqual({ seguido: true, max: 8 });
    expect(() => opcionesDeReuso({ max: 'x' })).toThrow(/--max/);
  });
  it('estado: cuántas de cuántas, y orden → tema', () => {
    const lineas = reusadasEnTexto({ desde: 'viejo', usadas: { 0: 'v-0', 2: 'v-1' } }, 32, [{ orden: 0, id: 'presentacion' }, { orden: 2, id: 'casa-infancia' }]);
    expect(lineas[0]).toBe('reusadas: 2 de 32 (del narrador viejo)');
    expect(lineas.slice(1)).toEqual(['   0 · presentacion', '   2 · casa-infancia']);
  });
});
