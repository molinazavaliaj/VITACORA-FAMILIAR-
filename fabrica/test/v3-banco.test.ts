import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsearBancoMd } from '../src/v3/banco-md.js';
import { BANCO, preguntaPorId, entraEnTamanio } from '../src/v3/banco.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MD = readFileSync(path.join(RAIZ, 'docs', 'v3', 'banco-v3.md'), 'utf8');

// Tabla "Resumen de conteos" de docs/v3/banco-v3.md: filas B / E / E-joven / C por bloque.
const FILAS_POR_BLOQUE: Record<number, [number, number, number, number]> = {
  1: [3, 0, 0, 4],
  2: [6, 1, 2, 9],
  3: [3, 3, 2, 4],
  4: [4, 2, 2, 7],
  5: [3, 10, 2, 6],
  6: [5, 13, 0, 2],
  7: [6, 7, 0, 10],
  8: [4, 9, 0, 0],
  9: [2, 2, 0, 4],
  10: [2, 2, 0, 4],
  11: [3, 8, 0, 2],
  12: [2, 0, 0, 3],
  13: [2, 2, 0, 11],
  14: [2, 1, 0, 5],
  15: [4, 4, 0, 1],
};

describe('banco v3 (parseo del md)', () => {
  const banco = parsearBancoMd(MD);
  const historia = banco.filter((p) => p.clase === 'historia');

  it('tiene 195 filas de historia, 13 puertas y 12 válvulas', () => {
    expect(historia).toHaveLength(195);
    expect(banco.filter((p) => p.clase === 'puerta')).toHaveLength(13);
    expect(banco.filter((p) => p.clase === 'valvula')).toHaveLength(12);
  });

  it('las filas por bloque y tamaño coinciden con la tabla resumen del md', () => {
    for (const [bloque, [b, e, ej, c]] of Object.entries(FILAS_POR_BLOQUE)) {
      const delBloque = historia.filter((p) => p.bloque === Number(bloque));
      const cuenta = (t: string) => delBloque.filter((p) => p.tamanio === t).length;
      expect([cuenta('B'), cuenta('E'), cuenta('E-joven'), cuenta('C')], `bloque ${bloque}`).toEqual([b, e, ej, c]);
    }
  });

  it('entran 51 en Breve, 115 en Estándar, 123 en Estándar joven y 195 en Completo (sin gates)', () => {
    const cuenta = (t: 'B' | 'E' | 'C', joven: boolean) => historia.filter((p) => entraEnTamanio(p, t, joven)).length;
    expect(cuenta('B', false)).toBe(51);
    expect(cuenta('E', false)).toBe(115);
    expect(cuenta('E', true)).toBe(123);
    expect(cuenta('C', false)).toBe(195);
  });

  it('parsea el tipo: gate, negado, sensible, edad y repetición por hijo', () => {
    const por = (id: string) => banco.find((p) => p.id === id)!;
    expect(por('CA8')).toMatchObject({ gate: 'HERMANOS', gateNegado: true, sensible: false });
    expect(por('AM9')).toMatchObject({ gate: 'PAREJA_TERMINO', sensible: true, tamanio: 'B' });
    expect(por('PE3')).toMatchObject({ gate: null, sensible: true });
    expect(por('TR9')).toMatchObject({ gate: 'JUBILADO', edadMin: 45 });
    expect(por('DES1')).toMatchObject({ edadMin: 60, sensible: true });
    expect(por('HI2')).toMatchObject({ gate: 'HIJOS', repite: 'hijo' });
    expect(por('HI3b')).toMatchObject({ gate: 'HIJOS_MAS_DE_4' });
    expect(por('OR6.2')).toMatchObject({ gate: 'APODO', bloque: 1 });
    expect(por('AD1').texto).toMatch(/^Contame cómo eras a los quince/);
  });

  it('puertas y válvulas: la puerta de cada bloque y una válvula por bloque que la lleva', () => {
    const puertas = banco.filter((p) => p.clase === 'puerta');
    expect(puertas.map((p) => p.bloque)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15]);
    const valvulas = banco.filter((p) => p.clase === 'valvula');
    expect(valvulas.map((p) => p.bloque)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14]);
    expect(valvulas[0].id).toBe('MAS1');
    expect(valvulas[0].texto).toMatch(/^De lo que contaste de esta época/);
  });

  it('el banco-v3.json commiteado está al día con el md', () => {
    expect(BANCO).toEqual(banco);
  });

  it('preguntaPorId encuentra y devuelve undefined si no existe', () => {
    expect(preguntaPorId('LE8')?.bloque).toBe(15);
    expect(preguntaPorId('ZZ9')).toBeUndefined();
  });
});
