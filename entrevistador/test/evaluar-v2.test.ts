import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { armarPromptEvaluar, parsearEvaluacion, evaluarV2, armarPromptPedidos, evaluarPedidos, hayCansancio } from '../src/ia/evaluar-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';
import type { Objetivo } from '../src/ia/pregunta-v2.js';

const laEscuela: Objetivo = { tipo: 'nucleo', id: 'la-escuela', tramo: 'infancia', bloque: 'infancia', tema: 'La escuela primaria', pormenores: ['un maestro', 'un compañero', 'cómo le iba', 'si cambió de colegio y por qué'], fila: 'la-escuela' };
const clienteCortado = (content: unknown[], stop_reason = 'max_tokens') => ({ messages: { create: vi.fn(async () => ({ content, stop_reason, usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic);
const cliente = (texto: string) => ({ messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: texto }], usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic);

describe('armarPromptEvaluar', () => {
  it('lleva el encargo, la conversación, la fila con sus pormenores, la pregunta y la respuesta con su duración; pide "falto" y no una repregunta', () => {
    const p = armarPromptEvaluar(perfilVacio(), laEscuela, '¿Cómo era tu escuela?', 'Tuve una maestra, la señorita Ana.', 20, [{ pregunta: 'P1', respuesta: 'R1' }], ['la enfermedad']);
    expect(p).toContain('Sos el biógrafo');
    expect(p).toContain('P: P1'); expect(p).toContain('un maestro'); expect(p).toContain('¿Cómo era tu escuela?'); expect(p).toContain('duró 20 segundos');
    expect(p).toContain('"falto"'); expect(p).not.toMatch(/"repregunta"/);
    expect(p).toContain('la enfermedad');
  });
});

describe('parsearEvaluacion', () => {
  it('lee suficiente y falto; lo que viene mal tipado se ignora; roto → alcanza sin falto', () => {
    expect(parsearEvaluacion('{"suficiente": false, "falto": ["un maestro", 3, "cómo le iba"], "dejarTema": "x", "hoyNo": "sí"}')).toEqual({ suficiente: false, falto: ['un maestro', 'cómo le iba'], dejarTema: 'x' });
    expect(parsearEvaluacion('bla')).toEqual({ suficiente: true, falto: [] });
    expect(parsearEvaluacion('{"suficiente": true}')).toEqual({ suficiente: true, falto: [] });
  });
  it('falto se corta en 4 y se limpia', () => {
    const e = parsearEvaluacion('{"suficiente": false, "falto": ["a","b","c","d","e"," "]}');
    expect(e.falto).toEqual(['a', 'b', 'c', 'd']);
  });

  it('si "suficiente" viene mal tipado, igual lee los pedidos (fix ronda 1: no se descartaban)', () => {
    expect(parsearEvaluacion('{"quiereParar": true}')).toEqual({ suficiente: true, falto: [], quiereParar: true });
  });

  it('JSON cortado a mitad de camino: recupera los pedidos booleanos por regex en vez de perderlos todos (fix ronda 1)', () => {
    const cortado = '{"suficiente": false, "hoyNo": true, "dejarTema": "un tema muy largo que se corta a la mit';
    expect(parsearEvaluacion(cortado)).toEqual({ suficiente: true, falto: [], hoyNo: true });
  });
});

describe('evaluarV2', () => {
  it('una sola llamada con Sonnet y max_tokens 4000; devuelve la evaluación y el uso', async () => {
    const c = cliente('{"suficiente": false, "falto": ["un maestro"]}');
    const r = await evaluarV2(c, perfilVacio(), laEscuela, 'P', 'R', 30, [], []);
    expect(r.evaluacion).toEqual({ suficiente: false, falto: ['un maestro'] });
    expect(r.usos).toHaveLength(1);
    const args = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as { model: string; max_tokens: number };
    expect(args.model).toBe('claude-sonnet-5'); expect(args.max_tokens).toBe(4000);
  });
});

describe('evaluarPedidos (repreguntas y objetos: solo lo que la persona pide)', () => {
  it('el prompt es corto (sin ficha ni conversación) y pide solo reservado, dejarTema, hoyNo, quiereParar', () => {
    const p = armarPromptPedidos('esto no lo pongas en el libro');
    expect(p.length).toBeLessThan(2500);
    expect(p).toContain('"reservado"'); expect(p).toContain('"quiereParar"'); expect(p).not.toContain('"suficiente"');
  });
  it('usa Haiku, lee los pedidos y nunca devuelve suficiente', async () => {
    const c = cliente('{"reservado": true, "reservadoTramo": "esto no lo pongas", "dejarTema": "la enfermedad"}');
    const r = await evaluarPedidos(c, 'esto no lo pongas en el libro');
    expect(r.pedidos).toEqual({ reservado: true, reservadoTramo: 'esto no lo pongas', dejarTema: 'la enfermedad' });
    const args = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as { model: string; max_tokens: number };
    expect(args.model).toBe('claude-haiku-4-5'); expect(args.max_tokens).toBe(2000);
    expect((await evaluarPedidos(cliente('roto'), 'x')).pedidos).toEqual({});
  });

  it('un "reservadoTramo" largo corta el JSON (max_tokens de Haiku): igual recupera "reservado" por regex (fix ronda 1)', async () => {
    const cortado = '{"reservado": true, "reservadoTramo": "esto es un tramo larguísimo que se corta justo a la mit';
    const r = await evaluarPedidos(cliente(cortado), 'x');
    expect(r.pedidos).toEqual({ reservado: true });
  });
});

describe('hayCansancio', () => {
  it('dos repreguntas seguidas sin contestar', () => {
    expect(hayCansancio([{ contestada: true }, { contestada: false }, { contestada: false }])).toBe(true);
    expect(hayCansancio([{ contestada: false }])).toBe(false);
  });

  it('la última sí contestada, o sin repreguntas: no hay cansancio', () => {
    expect(hayCansancio([{ contestada: false }, { contestada: true }])).toBe(false);
    expect(hayCansancio([])).toBe(false);
  });
});

describe('salida cortada o vacía (arreglo final I2): se tira, no se lee como "alcanza"', () => {
  it('evaluarV2 con stop_reason max_tokens tira un error claro (aunque traiga medio JSON)', async () => {
    await expect(evaluarV2(clienteCortado([{ type: 'text', text: '{"suficiente": false, "quiereParar": tr' }]), perfilVacio(), laEscuela, 'P', 'R', 30, [], []))
      .rejects.toThrow(/la respuesta del modelo se cortó/);
  });
  it('evaluarV2 sin bloque de texto, o con el texto vacío, tira', async () => {
    await expect(evaluarV2(clienteCortado([], 'end_turn'), perfilVacio(), laEscuela, 'P', 'R', 30, [], [])).rejects.toThrow(/la respuesta del modelo se cortó/);
    await expect(evaluarV2(clienteCortado([{ type: 'text', text: '  ' }], 'end_turn'), perfilVacio(), laEscuela, 'P', 'R', 30, [], [])).rejects.toThrow(/la respuesta del modelo se cortó/);
  });
  it('evaluarPedidos con stop_reason max_tokens o sin texto tira', async () => {
    await expect(evaluarPedidos(clienteCortado([{ type: 'text', text: '{"hoyNo": true, "reservadoTramo": "algo' }]), 'x')).rejects.toThrow(/la respuesta del modelo se cortó/);
    await expect(evaluarPedidos(clienteCortado([], 'end_turn'), 'x')).rejects.toThrow(/la respuesta del modelo se cortó/);
  });
  it('con end_turn y JSON roto, la recuperación por regex sigue andando (no se rompe la Tarea 8)', async () => {
    const r = await evaluarPedidos(clienteCortado([{ type: 'text', text: '{"reservado": true, "reservadoTramo": "a medi' }], 'end_turn'), 'x');
    expect(r.pedidos).toEqual({ reservado: true });
    const e = await evaluarV2(clienteCortado([{ type: 'text', text: '{"suficiente": false, "hoyNo": true, "dejarTema": "a medi' }], 'end_turn'), perfilVacio(), laEscuela, 'P', 'R', 30, [], []);
    expect(e.evaluacion).toEqual({ suficiente: true, falto: [], hoyNo: true });
  });
});
