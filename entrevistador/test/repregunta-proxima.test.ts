import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { armarPromptEvaluar, evaluarV2, sinLoDeLaProxima } from '../src/ia/evaluar-v2.js';
import { objetivoEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { GUION } from '../src/ia/guion-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';

// E17 (piloto esqueleto v2, 25/09): la repregunta de `pruebas` pidió "quién te bancó" y la fila
// siguiente (`fuerza`) pedía lo mismo. La evaluación sabe qué va a tratar la próxima fila y no lo
// pone en "falto"; y lo que se cuele con las mismas palabras se saca en el código.
const nucleo = (id: string): Objetivo => {
  const f = GUION.find((x) => x.id === id)!;
  return { tipo: 'nucleo', id: f.id, tramo: f.tramo, bloque: f.etapa, tema: f.tema, pormenores: f.pormenores, fila: f.id };
};
const pruebas = nucleo('pruebas');
const fuerza = nucleo('fuerza');
const cliente = (texto: string) => ({ messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: texto }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic);

describe('la evaluación mira la próxima fila (E17)', () => {
  it('el prompt dice qué va a tratar la próxima pregunta y que eso no falta', () => {
    const p = armarPromptEvaluar(perfilVacio(), pruebas, '¿Qué pruebas te puso la vida?', 'Perdí la camioneta.', 30, [], [], fuerza);
    expect(p).toContain('LA PRÓXIMA PREGUNTA (otro día) VA A TRATAR:\nDe dónde sacó fuerza y qué aprendió que quiera dejar dicho.');
    expect(p).toContain('Lo que va a tratar LA PRÓXIMA PREGUNTA no falta acá: no lo pongas en "falto", se pregunta ahí.');
  });
  it('sin próxima fila (la última), el prompt es el de siempre', () => {
    const p = armarPromptEvaluar(perfilVacio(), pruebas, '¿Qué pruebas?', 'Muchas.', 30, [], []);
    expect(p).not.toContain('LA PRÓXIMA PREGUNTA');
  });
});

describe('sinLoDeLaProxima', () => {
  it('saca lo que comparte dos palabras o más con la próxima fila (pruebas → fuerza)', () => {
    expect(sinLoDeLaProxima(['de dónde sacó la fuerza', 'qué pasó con la camioneta'], fuerza)).toEqual(['qué pasó con la camioneta']);
  });
  it('una sola palabra en común nunca alcanza para sacarlo (eso lo decide la regla del prompt, que ve el sentido)', () => {
    expect(sinLoDeLaProxima(['qué aprendió de eso'], fuerza)).toEqual(['qué aprendió de eso']);
    expect(sinLoDeLaProxima(['qué aprendió de esa etapa'], fuerza)).toEqual(['qué aprendió de esa etapa']);
    expect(sinLoDeLaProxima(['con quién jugaba', 'olores'], nucleo('la-cuadra-y-los-juegos'))).toEqual(['con quién jugaba', 'olores']);
  });
  it('dos palabras en común pero menos de la mitad de las suyas: queda', () => {
    expect(sinLoDeLaProxima(['qué aprendió y de dónde sacó ánimo cuando perdió la camioneta en Buenos Aires'], fuerza)).toHaveLength(1);
  });
  it('con los pormenores de la próxima también (la-escuela → a-los-quince no comparte; un sábado a la noche sí)', () => {
    expect(sinLoDeLaProxima(['un maestro', 'cómo le iba'], nucleo('a-los-quince'))).toEqual(['un maestro', 'cómo le iba']);
    expect(sinLoDeLaProxima(['un sábado a la noche', 'un maestro'], nucleo('a-los-quince'))).toEqual(['un maestro']);
  });
  it('sin próxima, o una próxima que no es del guion, no saca nada', () => {
    expect(sinLoDeLaProxima(['la fuerza'], null)).toEqual(['la fuerza']);
    expect(sinLoDeLaProxima(['la fuerza'], { tipo: 'objeto', id: 'objeto-hoy', tramo: 'hoy' })).toEqual(['la fuerza']);
  });
});

describe('evaluarV2 con la próxima fila', () => {
  it('si todo lo que faltó es de la próxima, no queda nada: no hay repregunta', async () => {
    const r = await evaluarV2(cliente('{"suficiente": false, "falto": ["de dónde sacó fuerza", "qué aprendió que quiera dejar"]}'), perfilVacio(), pruebas, '¿Qué pruebas?', 'Perdí todo.', 20, [], [], fuerza);
    expect(r.evaluacion.falto).toEqual([]);
  });
  it('lo que no es de la próxima queda', async () => {
    const r = await evaluarV2(cliente('{"suficiente": false, "falto": ["de dónde sacó fuerza", "cómo fue perder la camioneta"]}'), perfilVacio(), pruebas, '¿Qué pruebas?', 'Perdí todo.', 20, [], [], fuerza);
    expect(r.evaluacion).toEqual({ suficiente: false, falto: ['cómo fue perder la camioneta'] });
  });
});

describe('la repregunta sabe qué trata la próxima (E17)', () => {
  it('el objetivo lo dice, para que no lo pida', () => {
    const rep: Objetivo = { tipo: 'repregunta', id: 'pruebas-repregunta', tramo: null, pregunta: '¿Qué pruebas?', falto: ['cómo fue perder la camioneta'], proxima: fuerza.tipo === 'nucleo' ? fuerza.tema : '' };
    expect(objetivoEnTexto(rep, perfilVacio())).toContain('No pidas lo que va a tratar la próxima pregunta: "De dónde sacó fuerza y qué aprendió que quiera dejar dicho."');
  });
  it('sin próxima, el objetivo de la repregunta es el de siempre', () => {
    const rep: Objetivo = { tipo: 'repregunta', id: 'x', tramo: null, pregunta: '¿?', falto: ['a'] };
    expect(objetivoEnTexto(rep, perfilVacio())).not.toContain('próxima');
  });
});
