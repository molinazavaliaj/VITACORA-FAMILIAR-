import { describe, it, expect } from 'vitest';
import { armarNarracionJson, markdownATextoPlano } from '../src/voz/narracion-json.js';

describe('markdownATextoPlano', () => {
  it('saca títulos, énfasis e imágenes y conserva los párrafos', () => {
    const md = '# La infancia\n\nNací en **Rosario**, en _1950_.\n\n![foto](x.jpg)\n*La casa del patio.*\n\nMi padre era ferroviario.';
    expect(markdownATextoPlano(md)).toBe('Nací en Rosario, en 1950.\n\nMi padre era ferroviario.');
  });
});

describe('armarNarracionJson', () => {
  it('numera los capítulos en orden y deja el texto plano', () => {
    const j = armarNarracionJson({ narradorId: 'n', pedidoId: 'p', titulo: 'T', capitulos: [{ nombre: 'Uno', markdown: '# Uno\n\nHola.' }, { nombre: 'Dos', markdown: 'Chau.' }] });
    expect(j.capitulos).toEqual([{ numero: 1, nombre: 'Uno', texto: 'Hola.' }, { numero: 2, nombre: 'Dos', texto: 'Chau.' }]);
  });
});
