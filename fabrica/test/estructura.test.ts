import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Pregunta } from '../src/db.js';

// El SDK de Claude se mockea en todos los tests: la fábrica nunca debe pegarle
// a la API real en CI. finalMessage() devuelve un array de bloques de texto,
// como hace el SDK real.
const finalMessageMock = vi.fn();
const streamMock = vi.fn(() => ({ finalMessage: finalMessageMock }));

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { stream: streamMock },
    })),
  };
});

vi.mock('../src/db.js', async () => {
  const actual = await vi.importActual<typeof import('../src/db.js')>('../src/db.js');
  return {
    ...actual,
    obtenerClienteDb: vi.fn(),
  };
});

import { agruparCapitulos, parsearJsonEntidades } from '../src/libro/estructura.js';

describe('agruparCapitulos', () => {
  it('agrupa los órdenes respondidos por capítulo, en orden de primera aparición', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 3, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor', tipo: 'fija' },
    ];
    const ordenesRespondidos = [1, 2, 3];

    const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

    expect(capitulos).toEqual([
      { nombre: 'Infancia', ordenes: [1, 2] },
      { nombre: 'El amor', ordenes: [3] },
    ]);
  });

  it('excluye los órdenes sin respuesta (soporta cierre anticipado)', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 3, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor', tipo: 'fija' },
    ];
    const ordenesRespondidos = [1, 3];

    const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

    expect(capitulos).toEqual([
      { nombre: 'Infancia', ordenes: [1] },
      { nombre: 'El amor', ordenes: [3] },
    ]);
  });

  it('respeta el orden de primera aparición del capítulo aunque las preguntas no estén ordenadas', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 3, texto: '¿Cómo conociste a tu pareja?', capitulo: 'El amor', tipo: 'fija' },
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
      { narrador_id: null, orden: 2, texto: '¿Cómo era tu casa?', capitulo: 'Infancia', tipo: 'fija' },
    ];
    const ordenesRespondidos = [1, 2, 3];

    const capitulos = agruparCapitulos(preguntas, ordenesRespondidos);

    expect(capitulos.map((c) => c.nombre)).toEqual(['El amor', 'Infancia']);
  });

  it('devuelve vacío si no hay órdenes respondidos', () => {
    const preguntas: Pregunta[] = [
      { narrador_id: null, orden: 1, texto: '¿Dónde naciste?', capitulo: 'Infancia', tipo: 'fija' },
    ];

    expect(agruparCapitulos(preguntas, [])).toEqual([]);
  });
});

describe('parsearJsonEntidades', () => {
  it('mantiene solo las entradas válidas y descarta las mal formadas', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const json = JSON.stringify([
      { texto: 'Roberto', tipo: 'persona', contexto: 'el narrador' },
      { texto: 'Buenos Aires', tipo: 'lugar', contexto: 'ciudad natal' },
      { texto: 'Sin tipo', contexto: 'falta tipo' }, // falta tipo
      { texto: 'Mala', tipo: 'animal', contexto: 'tipo inválido' }, // tipo fuera de enum
      { texto: '   ', tipo: 'persona', contexto: 'texto vacío' }, // texto vacío
      'un string suelto', // no es objeto
      { texto: 'Sin contexto', tipo: 'lugar' }, // falta contexto
    ]);

    const entidades = parsearJsonEntidades(json);

    expect(entidades).toEqual([
      { texto: 'Roberto', tipo: 'persona', contexto: 'el narrador' },
      { texto: 'Buenos Aires', tipo: 'lugar', contexto: 'ciudad natal' },
    ]);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('devuelve vacío si todas las entradas están mal formadas', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const json = JSON.stringify([
      { texto: '', tipo: 'persona', contexto: 'texto vacío' },
      { texto: 'Alguien', tipo: 'planeta', contexto: 'tipo inválido' },
      42,
    ]);

    expect(parsearJsonEntidades(json)).toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it('devuelve vacío si el JSON no parsea', () => {
    expect(parsearJsonEntidades('no es json')).toEqual([]);
  });

  it('devuelve vacío si el JSON parsea pero no es un array', () => {
    expect(parsearJsonEntidades('{"texto":"x"}')).toEqual([]);
  });
});
