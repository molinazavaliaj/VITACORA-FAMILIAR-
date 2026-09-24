import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { encargoDelBiografo, ENCARGO_FIJO, encargoVariable } from '../src/ia/encargo-entrevista.js';
import { armarPromptPregunta, escribirPregunta, type Objetivo } from '../src/ia/pregunta-v2.js';
import { armarPromptEvaluar, evaluarV2, armarPromptPedidos, evaluarPedidos } from '../src/ia/evaluar-v2.js';
import { armarPromptPerfil, actualizarPerfil, perfilVacio, recortarPerfil, type Perfil } from '../src/ia/perfil.js';
import { sumarGasto, estadoNuevo } from '../src/manual/estado-v2.js';
import { calcularUsd, registrarUso } from '../src/costos.js';

// Ajuste B (24/09, aprobado por Naza): la parte FIJA de cada prompt (reglas e instrucciones, igual
// en todas las llamadas del mismo tipo) va primero, en su propio bloque con `cache_control`; lo que
// cambia (ficha, conversación, respuesta) va después (solo pregunta y ficha: la evaluación y los
// pedidos no llegan al mínimo cacheable y van enteros, en su orden). El modelo ve LAS MISMAS PALABRAS que antes: solo
// cambia el orden (lo fijo adelante, porque la caché es por prefijo). Y la ficha, la evaluación y los
// pedidos van sin "pensar" (`thinking: {type: 'disabled'}`); la pregunta (Opus) no se toca.

/** Las líneas del texto, sin sangría ni vacías, ordenadas: mismas palabras aunque cambie el orden. */
const lineas = (t: string) => t.split('\n').map((l) => l.trim()).filter(Boolean).sort();

type Bloque = { type: string; text: string; cache_control?: { type: string } };
type Pedido = { model: string; messages: { role: string; content: string | Bloque[] }[]; thinking?: { type: string } };

function clienteQueGuarda(textos: string[]) {
  const pedidos: Pedido[] = [];
  let i = 0;
  const c = {
    messages: {
      create: vi.fn(async (p: Pedido) => {
        pedidos.push(p);
        return { content: [{ type: 'text', text: textos[Math.min(i++, textos.length - 1)] }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 } };
      }),
    },
  } as unknown as Anthropic;
  return { c, pedidos };
}

function bloques(p: Pedido): Bloque[] {
  expect(p.messages).toHaveLength(1);
  expect(p.messages[0].role).toBe('user');
  const content = p.messages[0].content;
  expect(Array.isArray(content)).toBe(true);
  return content as Bloque[];
}

/** Dos bloques de texto: el fijo con caché (5 minutos, el default) y el variable sin. */
function esperarPartido(p: Pedido): { fijo: string; variable: string } {
  const b = bloques(p);
  expect(b).toHaveLength(2);
  expect(b[0]).toMatchObject({ type: 'text', cache_control: { type: 'ephemeral' } });
  expect(b[1].type).toBe('text');
  expect(b[1].cache_control).toBeUndefined();
  return { fijo: b[0].text, variable: b[1].text };
}

const perfilLleno = (): Perfil => {
  const p = recortarPerfil({ noTuvo: [], ...JSON.parse(readFileSync(new URL('./fixtures/perfil-naza-piloto.json', import.meta.url), 'utf8')) }) as Perfil;
  return { ...p, hoyFueFuerte: true };
};
const laEscuela: Objetivo = { tipo: 'nucleo', id: 'la-escuela', tramo: 'infancia', bloque: 'infancia', tema: 'La escuela primaria', pormenores: ['un maestro', 'un compañero'], fila: 'la-escuela' } as Objetivo;
const conversacion = [{ pregunta: '¿Qué ves al entrar a esa casa?', respuesta: 'Una casa de tres pisos.' }];
const evitar = ['la enfermedad', 'el tío'];

describe('el encargo, partido en fijo y variable', () => {
  it('lo fijo no depende de la persona; fijo + variable son las mismas líneas que el encargo de antes', () => {
    for (const [p, ev] of [[perfilVacio(), []], [perfilLleno(), evitar]] as const) {
      expect(lineas(`${ENCARGO_FIJO}\n${encargoVariable(p, [...ev])}`)).toEqual(lineas(encargoDelBiografo(p, [...ev])));
    }
    expect(ENCARGO_FIJO).not.toContain('QUIÉN ES');
    expect(ENCARGO_FIJO).not.toContain('Temas que pidió dejar');
  });
});

describe('escribirPregunta (Opus): caché de la parte fija, el thinking no se toca', () => {
  it('manda fijo (con cache_control) + variable, con las mismas líneas que armarPromptPregunta; sin parámetro thinking', async () => {
    const { c, pedidos } = clienteQueGuarda(['¿Cómo era tu escuela, y quién era tu maestra?']);
    await escribirPregunta(c, perfilLleno(), laEscuela, conversacion, [{ id: 'x', tema: 'La casa' }], evitar);
    const { fijo, variable } = esperarPartido(pedidos[0]);
    expect(lineas(fijo + variable)).toEqual(lineas(armarPromptPregunta(perfilLleno(), laEscuela, conversacion, [{ id: 'x', tema: 'La casa' }], evitar)));
    expect(fijo).not.toContain('QUIÉN ES'); // la ficha va en lo variable
    expect(pedidos[0]).not.toHaveProperty('thinking');
    expect(pedidos[0].model).toBe('claude-opus-5');
  });
  it('lo fijo es idéntico para dos personas distintas (si no, la caché no pega)', async () => {
    const a = clienteQueGuarda(['¿Cómo era tu escuela?']);
    const b = clienteQueGuarda(['¿Cómo era tu escuela?']);
    await escribirPregunta(a.c, perfilVacio(), laEscuela, [], []);
    await escribirPregunta(b.c, perfilLleno(), laEscuela, conversacion, [], evitar);
    expect(esperarPartido(a.pedidos[0]).fijo).toBe(esperarPartido(b.pedidos[0]).fijo);
  });
  it('en el reintento, lo fijo es el mismo bloque y el motivo va al final de lo variable', async () => {
    const { c, pedidos } = clienteQueGuarda(['Contame de tu escuela.', '¿Cómo era tu escuela?']);
    await escribirPregunta(c, perfilLleno(), laEscuela, [], []);
    const uno = esperarPartido(pedidos[0]);
    const dos = esperarPartido(pedidos[1]);
    expect(dos.fijo).toBe(uno.fijo);
    expect(dos.variable.startsWith(uno.variable)).toBe(true);
    expect(dos.variable).toMatch(/no sirvió porque/);
  });
});

describe('evaluarV2 (Sonnet): sin pensar; el prompt no se parte (lo fijo no llega al mínimo cacheable de Sonnet)', () => {
  it('manda el prompt de siempre, entero y en su orden, con thinking disabled', async () => {
    const { c, pedidos } = clienteQueGuarda(['{"suficiente": true, "falto": []}']);
    await evaluarV2(c, perfilLleno(), laEscuela, '¿Cómo era tu escuela?', 'Tuve una maestra.', 20, conversacion, evitar);
    expect(pedidos[0].messages[0].content).toBe(armarPromptEvaluar(perfilLleno(), laEscuela, '¿Cómo era tu escuela?', 'Tuve una maestra.', 20, conversacion, evitar));
    expect(pedidos[0].thinking).toEqual({ type: 'disabled' });
    expect(pedidos[0].model).toBe('claude-sonnet-5');
  });
});

describe('actualizarPerfil (Sonnet): caché de la parte fija y sin pensar', () => {
  it('fijo + variable son las mismas líneas que armarPromptPerfil; thinking disabled; lo fijo no cambia con la ficha', async () => {
    const a = clienteQueGuarda(['{}']);
    const b = clienteQueGuarda(['{}']);
    await actualizarPerfil(a.c, perfilLleno(), '¿Pregunta?', 'Respuesta.', [{ id: 'la-escuela', tema: 'La escuela' }]);
    await actualizarPerfil(b.c, perfilVacio(), 'Otra', 'Otra respuesta', []);
    const { fijo, variable } = esperarPartido(a.pedidos[0]);
    expect(lineas(fijo + variable)).toEqual(lineas(armarPromptPerfil(perfilLleno(), '¿Pregunta?', 'Respuesta.', [{ id: 'la-escuela', tema: 'La escuela' }])));
    expect(esperarPartido(b.pedidos[0]).fijo).toBe(fijo);
    expect(a.pedidos[0].thinking).toEqual({ type: 'disabled' });
    expect(a.pedidos[0].model).toBe('claude-sonnet-5');
  });
});

describe('evaluarPedidos (Haiku): sin pensar; el prompt no se parte (no llega al mínimo cacheable de Haiku)', () => {
  it('manda el mismo prompt de antes, con thinking disabled', async () => {
    const { c, pedidos } = clienteQueGuarda(['{}']);
    await evaluarPedidos(c, 'esto no lo pongas');
    expect(pedidos[0].messages[0].content).toBe(armarPromptPedidos('esto no lo pongas'));
    expect(pedidos[0].thinking).toEqual({ type: 'disabled' });
    expect(pedidos[0].model).toBe('claude-haiku-4-5');
  });
});

describe('el gasto con caché se suma bien (sumarGasto del manual-v2 y registrarUso de anotarUsos)', () => {
  const conCache = { input_tokens: 1000, output_tokens: 100, cache_creation_input_tokens: 0, cache_read_input_tokens: 1_000_000 };
  it('sumarGasto cobra la lectura de caché a su precio (Opus: 0,5 por millón), además de entrada y salida', () => {
    const e = sumarGasto(estadoNuevo({}, 'America/Argentina/Buenos_Aires', 2026), [conCache], 0, 'claude-opus-5');
    expect(e.gastoUsd).toBeCloseTo(0.5 + 1000 * 5 / 1e6 + 100 * 25 / 1e6, 6);
    const s = sumarGasto(estadoNuevo({}, 'America/Argentina/Buenos_Aires', 2026), [{ ...conCache, cache_read_input_tokens: 0, cache_creation_input_tokens: 1_000_000 }], 0, 'claude-sonnet-5');
    expect(s.gastoUsd).toBeCloseTo(2.5 + 1000 * 2 / 1e6 + 100 * 10 / 1e6, 6);
  });
  it('registrarUso anota cache_read y su costo', async () => {
    const filas: Record<string, unknown>[] = [];
    const db = { from: () => ({ insert: async (f: Record<string, unknown>) => { filas.push(f); return { error: null }; } }) } as unknown as Parameters<typeof registrarUso>[0];
    await registrarUso(db, { servicio: 'entrevistador', paso: 'v2-pregunta', modelo: 'claude-opus-5', proveedor: 'anthropic', uso: conCache });
    expect(filas[0]).toMatchObject({ cache_read: 1_000_000, cache_write: 0, input_tokens: 1000, output_tokens: 100, usd: calcularUsd('claude-opus-5', conCache) });
  });
});
