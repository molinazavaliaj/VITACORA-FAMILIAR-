// sus_frases.md y libro.md, igual que `node llamada.mjs <carpeta> sus_frases | libro`.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { armarLibro, susFrasesMd } from '../../src/escritor/llamadas/codigo.js';
import { aDisco, carpetaNelida, correrMjs } from './ayuda.js';

for (const idiomaFicha of ['', 'Idioma del libro: catalán']) {
  describe(`pasos de código${idiomaFicha ? ' (catalán)' : ''}`, () => {
    it('Sus frases desde sus_frases.json y el libro con títulos del Paso 3t', () => {
      const c = carpetaNelida();
      if (idiomaFicha) c.escribir('entradas/ficha.xml', c.leer('entradas/ficha.xml').replace('</ficha>', `${idiomaFicha}\n</ficha>`));
      c.borrar('salidas/sus_frases.md');
      c.escribir('salidas/titulos/cap_1.json', '{"titulo": "La persiana de madera", "por_que": "x"}');
      c.escribir('salidas/titulos/cap_2.json', '{"titulo": "Años de lucha y sueños", "por_que": "no está en el capítulo: queda el número"}');
      const dir = aDisco(c);
      expect(`${susFrasesMd(c)}\n`).toBe(correrMjs('llamada.mjs', [dir, 'sus_frases']).salida);
      expect(c.leer('salidas/sus_frases.md')).toBe(readFileSync(path.join(dir, 'salidas', 'sus_frases.md'), 'utf8'));
      expect(`${armarLibro(c)}\n`).toBe(correrMjs('llamada.mjs', [dir, 'libro']).salida);
      expect(c.leer('libro.md')).toBe(readFileSync(path.join(dir, 'libro.md'), 'utf8'));
      const titulos = c.leer('libro.md').split('\n').filter((l) => l.startsWith('# '));
      expect(titulos).toEqual(idiomaFicha
        ? ['# sumá vos', '# I · La persiana de madera', '# II', '# Abans de tancar', '# Les seves frases', '# Per als meus']
        : ['# sumá vos', '# I · La persiana de madera', '# II', '# Antes de cerrar', '# Sus frases', '# Para los míos']);
      expect(c.leer('libro.md')).not.toContain('[[R');
    });
  });
}
