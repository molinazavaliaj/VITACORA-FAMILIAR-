import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { EntradaRespuesta } from '../src/cargar-set-dorado.js';

// El set dorado es la vara de calidad del libro: si alguien lo edita a mano y
// rompe la forma (una respuesta de dos líneas, un orden repetido, una
// adaptativa sin su pregunta), la fábrica genera un libro pobre y nadie se
// entera hasta leerlo. Este test es la red mínima.
const respuestas: EntradaRespuesta[] = JSON.parse(
  readFileSync(fileURLToPath(new URL('../set-dorado/respuestas.json', import.meta.url)), 'utf8')
);

const contarPalabras = (texto: string) => texto.trim().split(/\s+/).length;

describe('set dorado — respuestas.json', () => {
  it('tiene 30 entradas', () => {
    expect(respuestas).toHaveLength(30);
  });

  it('cubre los órdenes 1 a 30 sin repetir', () => {
    const ordenes = respuestas.map((entrada) => entrada.orden);
    expect(new Set(ordenes).size).toBe(30);
    expect([...ordenes].sort((a, b) => a - b)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it('cada respuesta tiene al menos 150 palabras', () => {
    const cortas = respuestas
      .filter((entrada) => contarPalabras(entrada.texto) < 150)
      .map((entrada) => `${entrada.orden} (${contarPalabras(entrada.texto)} palabras)`);
    expect(cortas).toEqual([]);
  });

  it('las adaptativas 26-30 traen su pregunta con texto y capítulo', () => {
    for (const entrada of respuestas.filter((r) => r.orden >= 26)) {
      expect(entrada.pregunta, `falta la pregunta del orden ${entrada.orden}`).toBeDefined();
      expect(entrada.pregunta!.texto.length).toBeGreaterThan(20);
      expect(entrada.pregunta!.capitulo.length).toBeGreaterThan(0);
    }
  });

  it('las fijas 1-25 no traen pregunta propia (vienen del seed)', () => {
    for (const entrada of respuestas.filter((r) => r.orden <= 25)) {
      expect(entrada.pregunta, `el orden ${entrada.orden} no debería traer pregunta`).toBeUndefined();
    }
  });
});
