import { describe, it, expect } from 'vitest';
import { armarNarracionJson, markdownATextoPlano } from '../src/voz/narracion-json.js';

describe('markdownATextoPlano', () => {
  it('saca títulos, énfasis e imágenes y conserva los párrafos', () => {
    const md = '# La infancia\n\nNací en **Rosario**, en _1950_.\n\n![foto](x.jpg)\n*La casa del patio.*\n\nMi padre era ferroviario.';
    expect(markdownATextoPlano(md)).toBe('Nací en Rosario, en 1950.\n\nMi padre era ferroviario.');
  });

  it('una cita (> ...) queda como su propio párrafo, sin el >', () => {
    const md = 'Hola.\n\n> Fue el día más feliz.\n\nChau.';
    expect(markdownATextoPlano(md)).toBe('Hola.\n\nFue el día más feliz.\n\nChau.');
  });
});

describe('armarNarracionJson', () => {
  const historia = (respuestaId: string, orden: number) => ({
    respuesta_id: respuestaId,
    pregunta_orden: orden,
    es_repregunta: false,
    audio_path: `n/dia_${String(orden).padStart(2, '0')}.ogg`,
    segundos: 120,
    pregunta: `Pregunta ${orden}`,
    texto: `Respuesta ${orden}.`,
  });

  it('numera los capítulos en orden y deja el texto plano; sin historias es versión 2 y modo clonado', () => {
    const j = armarNarracionJson({ narradorId: 'n', pedidoId: 'p', titulo: 'T', capitulos: [{ nombre: 'Uno', markdown: '# Uno\n\nHola.' }, { nombre: 'Dos', markdown: 'Chau.' }] });
    expect(j.version).toBe(2);
    expect(j.capitulos).toEqual([
      { numero: 1, nombre: 'Uno', texto: 'Hola.', modo: 'clonado' },
      { numero: 2, nombre: 'Dos', texto: 'Chau.', modo: 'clonado' },
    ]);
  });

  it('un capítulo con historias sale híbrido, con sus historias y conectores; uno sin audio, clonado y sin esas claves', () => {
    const historias = [historia('r1', 1), historia('r2', 2)];
    const conectores = { entrada: 'Empiezo por el principio.', entre: ['Y de ahí, la escuela.'], salida: 'Eso fue la infancia.' };
    const j = armarNarracionJson({
      narradorId: 'n',
      pedidoId: 'p',
      titulo: 'T',
      capitulos: [
        { nombre: 'La infancia', markdown: 'Nací en **Rosario**.', historias, conectores },
        { nombre: 'La familia', markdown: 'Fuimos cinco.', historias: [] },
      ],
    });

    expect(j).toEqual({
      version: 2,
      narrador_id: 'n',
      pedido_id: 'p',
      titulo: 'T',
      capitulos: [
        { numero: 1, nombre: 'La infancia', texto: 'Nací en Rosario.', modo: 'hibrido', historias, conectores },
        { numero: 2, nombre: 'La familia', texto: 'Fuimos cinco.', modo: 'clonado' },
      ],
    });
    expect(j.capitulos[1]).not.toHaveProperty('historias');
    expect(j.capitulos[1]).not.toHaveProperty('conectores');
  });

  it('con una sola historia, entre queda vacío', () => {
    const j = armarNarracionJson({
      narradorId: 'n',
      pedidoId: 'p',
      titulo: 'T',
      capitulos: [{ nombre: 'Uno', markdown: 'Hola.', historias: [historia('r1', 1)], conectores: { entrada: '', entre: [], salida: '' } }],
    });
    expect(j.capitulos[0].modo).toBe('hibrido');
    expect(j.capitulos[0].conectores?.entre).toEqual([]);
  });

  it('el contrato se cuida: entre.length tiene que ser historias.length - 1, y un híbrido sin conectores no sale', () => {
    const historias = [historia('r1', 1), historia('r2', 2)];
    expect(() =>
      armarNarracionJson({
        narradorId: 'n',
        pedidoId: 'p',
        titulo: 'T',
        capitulos: [{ nombre: 'Uno', markdown: 'Hola.', historias, conectores: { entrada: '', entre: [], salida: '' } }],
      })
    ).toThrow(/entre/);
    expect(() =>
      armarNarracionJson({
        narradorId: 'n',
        pedidoId: 'p',
        titulo: 'T',
        capitulos: [{ nombre: 'Uno', markdown: 'Hola.', historias }],
      })
    ).toThrow(/conectores/);
  });
});
