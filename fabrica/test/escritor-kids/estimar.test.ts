import { describe, expect, it } from 'vitest';
import { leerArgsKids } from '../../src/escritor-kids/cli.js';
import { estimarKids, textoEstimacionKids } from '../../src/escritor-kids/estimar.js';
import { carpetaDeFilas } from '../../src/escritor-kids/material/carpeta.js';
import { filasDeFijo } from '../../src/escritor-kids/material/de-fijo.js';

describe('estimación del libro de Kids', () => {
  const e = estimarKids(carpetaDeFilas(filasDeFijo('chico-inventado')));

  it('una fila por paso, el pensamiento contado aparte, Batch a mitad de precio', () => {
    expect(e.tipico.map((f) => f.paso)).toEqual([
      'A · Leer todo', 'B · Parte 1', 'B · Parte 2', 'B · Parte 3', 'B · Parte 4', 'B · Sobre', 'B · Álbum',
      'C · Veedor 1', 'C · Veedor 2', 'C · Veedor 3', 'C · Veedor 4', 'C · Arreglo 2', 'C · Arreglo 4',
    ]);
    for (const f of e.tipico) {
      expect(f.pensamientoTokens).toBeGreaterThan(0);
      expect(f.usdLote).toBeCloseTo(f.usd / 2, 3);
      expect(f.modelo).toBe('claude-opus-5-5');
    }
    expect(e.total.tipicoLote).toBeCloseTo(e.total.tipico / 2, 2);
    expect(e.total.peor).toBeGreaterThan(e.total.tipico * 2);
    expect(e.peor.filter((f) => f.paso.startsWith('C · Arreglo'))).toHaveLength(4);
    expect(e.pensamientoParte.tipico).toBeGreaterThan(0.5);
  });

  it('el texto avisa con y sin Batch y cuánto tarda', () => {
    const t = textoEstimacionKids(e, { lote: true, topeUsd: 8 }).join('\n');
    expect(t).toMatch(/típico: USD \d+\.\d\d sin Batch · USD \d+\.\d\d con Batch/);
    expect(t).toContain('4 lotes uno detrás de otro');
  });

  it('argumentos del script', () => {
    expect(leerArgsKids(['--fijo', 'chico-inventado'])).toMatchObject({ nombre: 'chico-inventado', si: false, lote: true, falso: false, topeUsd: 8 });
    expect(leerArgsKids(['--fijo', 'chico-inventado', '--falso', '--sin-lote', '--tope', '3'])).toMatchObject({ falso: true, lote: false, topeUsd: 3 });
    expect(() => leerArgsKids([])).toThrow(/--fijo/);
    expect(() => leerArgsKids(['--fijo', 'chico-inventado', '--si', '--falso'])).toThrow(/no van juntos/);
    expect(() => leerArgsKids(['--fijo', 'no-existe'])).toThrow(/kids_v2.json/);
  });
});
