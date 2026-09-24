import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { NUCLEO, BLOQUES, armarPromptPregunta, escribirPregunta, objetivoEnTexto, type Objetivo } from '../src/ia/pregunta-v2.js';
import { GUION } from '../src/ia/guion-v2.js';
import { perfilVacio } from '../src/ia/perfil.js';

const fila = (id: string): Objetivo => {
  const f = GUION.find((x) => x.id === id)!;
  return { tipo: 'nucleo', id: f.id, tramo: f.tramo, bloque: f.id === 'presentacion' ? 'presentacion' : f.etapa, tema: f.tema, pormenores: f.pormenores, pideEscena: f.pideEscena, fila: f.id };
};
const perfilDeVos = () => { const p = perfilVacio(); p.persona.comoHabla = { valor: 'vos', fuente: 'dicho' }; p.persona.edad = { valor: '27', fuente: 'dicho' }; return p; };

describe('NUCLEO y BLOQUES (el guion, para quien lee contexto.v2)', () => {
  it('NUCLEO son las filas del guion con id, tramo, bloque y tema; futuro entra antes de la reflexión', () => {
    expect(NUCLEO.map((n) => n.id)).toEqual(GUION.map((f) => f.id));
    expect(NUCLEO.find((n) => n.id === 'presentacion')?.bloque).toBe('presentacion');
    expect(NUCLEO.find((n) => n.id === 'oficio')?.bloque).toBe('adulto joven');
    expect(BLOQUES.indexOf('futuro')).toBe(BLOQUES.indexOf('reflexion') - 1);
  });
});

describe('objetivoEnTexto', () => {
  it('la presentación rellena los huecos: de vos o de usted (o tú/usted en España) y la edad solo si falta', () => {
    const p = perfilVacio();
    expect(objetivoEnTexto(fila('presentacion'), p)).toContain('de vos o de usted');
    expect(objetivoEnTexto(fila('presentacion'), p)).toContain('cuántos años tiene');
    const conEdad = perfilDeVos();
    expect(objetivoEnTexto(fila('presentacion'), conEdad)).not.toContain('cuántos años tiene');
    const es = perfilVacio('españa');
    expect(objetivoEnTexto(fila('presentacion'), es)).toContain('de tú o de usted');
  });
  it('una fila lleva el tema y los pormenores que puede juntar, con la consigna de elegir dos o tres y pedirlos juntos', () => {
    const t = objetivoEnTexto(fila('la-cuadra-y-los-juegos'), perfilDeVos());
    expect(t).toContain('a qué jugaba');
    expect(t).toMatch(/dos o tres/i);
    expect(t).toMatch(/una sola pregunta|juntos/i);
  });
  it('una fila que pide escena lo dice; una que pide "cómo era" no pide escena como resumen', () => {
    expect(objetivoEnTexto(fila('casa-infancia'), perfilDeVos())).toMatch(/escena/i);
    expect(objetivoEnTexto(fila('padres-como-eran'), perfilDeVos())).toMatch(/carácter/i);
  });
  it('una libre lleva lo que nombró y no contó, con su etapa', () => {
    const v: Objetivo = { tipo: 'variable', id: 'libre-juventud-1', tramo: 'juventud', desde: 13, hasta: 22, anclas: ['Cómo se arreglaron después con Ciano tras el problema por Vicky'] };
    const t = objetivoEnTexto(v, perfilDeVos());
    expect(t).toContain('Ciano');
    expect(t).toMatch(/13 y los 22/);
    expect(t).toMatch(/nombró y no contó/i);
  });
  it('el objeto pide UNA cosa con foto de esa época y no insiste', () => {
    const t = objetivoEnTexto({ tipo: 'objeto', id: 'objeto-juventud', tramo: 'juventud' }, perfilDeVos());
    expect(t).toMatch(/UNA cosa/); expect(t).toMatch(/foto/); expect(t).toMatch(/no se insiste/i);
  });
  it('el objeto final tiene su propio encargo: la cosa que guardaría de toda su vida, no "de esa época" (arreglo final I3)', () => {
    const t = objetivoEnTexto({ tipo: 'objeto', id: 'objeto-final', tramo: 'hoy', final: true }, perfilDeVos());
    expect(t).toMatch(/UNA cosa/); expect(t).toMatch(/toda su vida/); expect(t).toMatch(/foto/); expect(t).toMatch(/no se insiste/i);
    expect(t).not.toMatch(/esa época/); expect(t).not.toContain('(hoy)');
    const deTramo = objetivoEnTexto({ tipo: 'objeto', id: 'objeto-hoy', tramo: 'hoy' }, perfilDeVos());
    expect(Math.abs(t.length - deTramo.length)).toBeLessThan(40);
  });
  it('la repregunta pide junto lo que faltó de la pregunta de hoy, sin decir que es una repregunta ni pedir resumen', () => {
    const r: Objetivo = { tipo: 'repregunta', id: 'la-escuela-repregunta', tramo: 'infancia', pregunta: '¿Cómo era tu escuela?', falto: ['un maestro', 'si cambió de colegio y por qué'] };
    const t = objetivoEnTexto(r, perfilDeVos());
    expect(t).toContain('un maestro'); expect(t).toContain('¿Cómo era tu escuela?');
    expect(t).toMatch(/junt/i); expect(t).toMatch(/no digas que es una repregunta/i); expect(t).toMatch(/resum/i);
  });
});

describe('armarPromptPregunta', () => {
  it('lleva el encargo, la conversación, los TEMAS ya preguntados (no los textos) y el objetivo; no lleva textos enteros de preguntas viejas', () => {
    const p = perfilDeVos();
    const prompt = armarPromptPregunta(p, fila('la-escuela'), [{ pregunta: '¿Qué ves al entrar a esa casa?', respuesta: 'Una casa de tres pisos en Martínez.' }], [{ id: 'casa-infancia', tema: 'La casa de la infancia' }, { id: 'los-tuyos-hoy', tema: 'Quiénes son los suyos hoy' }]);
    expect(prompt).toContain('Sos el biógrafo');
    expect(prompt).toContain('P: ¿Qué ves al entrar a esa casa?');
    expect(prompt).toContain('- casa-infancia: La casa de la infancia');
    expect(prompt).toContain('TEMAS QUE YA LE PREGUNTASTE');
    expect(prompt).toContain('un maestro');
    expect(prompt).toContain('el guion\nte da el tema, no el texto');
  });
  it('con 40 temas hechos y 3 respuestas, el prompt sigue corto (el texto fijo + ficha vacía + 40 líneas)', () => {
    const ya = Array.from({ length: 40 }, (_, i) => ({ id: `fila-${i}`, tema: 'Un tema de una línea para el biógrafo, de unas quince palabras más o menos' }));
    const conv = Array.from({ length: 3 }, () => ({ pregunta: 'P '.repeat(20), respuesta: 'R '.repeat(400) }));
    const prompt = armarPromptPregunta(perfilDeVos(), fila('mensaje'), conv, ya);
    expect(prompt.length).toBeLessThan(12_000);
  });
});

describe('escribirPregunta (cliente falso)', () => {
  const clienteQueDevuelve = (textos: string[]) => {
    let i = 0;
    return { messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: textos[Math.min(i++, textos.length - 1)] }], usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic;
  };
  it('usa Opus, da lugar al pensamiento (max_tokens 4000) y devuelve la pregunta limpia de comillas', async () => {
    const c = clienteQueDevuelve(['«¿Cómo era tu escuela, Naza?»']);
    const r = await escribirPregunta(c, perfilDeVos(), fila('la-escuela'), [], []);
    expect(r.ok).toBe(true); expect(r.texto).toBe('¿Cómo era tu escuela, Naza?');
    const args = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as { model: string; max_tokens: number };
    expect(args.model).toBe('claude-opus-5'); expect(args.max_tokens).toBe(4000);
  });
  it('tres intentos con el motivo y marcada si el tercero también falla; un texto vacío queda marcado como "pregunta"', async () => {
    const c = clienteQueDevuelve(['Contame de tu escuela.', '', '']);
    const r = await escribirPregunta(c, perfilDeVos(), fila('la-escuela'), [], []);
    expect(r.ok).toBe(false); expect(r.usos).toHaveLength(3); expect(r.marca?.control).toBe('pregunta');
    const segunda = (c.messages.create as ReturnType<typeof vi.fn>).mock.calls[1][0] as { messages: { content: string }[] };
    expect(segunda.messages[0].content).toMatch(/no sirvió porque/);
  });
  it('stop_reason max_tokens o sin bloque de texto: tira un error claro, no manda media pregunta (I2)', async () => {
    const cortado = (content: unknown[], stop_reason: string) => ({ messages: { create: vi.fn(async () => ({ content, stop_reason, usage: { input_tokens: 10, output_tokens: 5 } })) } } as unknown as Anthropic);
    await expect(escribirPregunta(cortado([{ type: 'text', text: '¿Cómo era tu escuela y qu' }], 'max_tokens'), perfilDeVos(), fila('la-escuela'), [], [])).rejects.toThrow(/la respuesta del modelo se cortó/);
    await expect(escribirPregunta(cortado([], 'end_turn'), perfilDeVos(), fila('la-escuela'), [], [])).rejects.toThrow(/la respuesta del modelo se cortó/);
  });
});
