// fabrica/test/escritor/cli.test.ts
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cargarCarpeta, guardarCarpeta, leerArgs } from '../../src/escritor/cli.js';
import { estimarUsd } from '../../src/escritor/estimar.js';
import { aDisco, carpetaNelida } from './ayuda.js';

describe('argumentos', () => {
  it('por defecto: etapa C, lote, tope 15 y sin llamar (falta --si)', () => {
    expect(leerArgs(['--carpeta', 'x'])).toEqual({ carpeta: 'x', etapa: 'C', topeUsd: 15, lote: true, si: false });
    expect(leerArgs(['--carpeta', 'x', '--solo-capitulo', '6', '--tope', '4', '--sin-lote', '--si'])).toEqual({ carpeta: 'x', etapa: 'C', soloCapitulo: 6, topeUsd: 4, lote: false, si: true });
  });
  it('rechaza lo que no entiende', () => {
    expect(() => leerArgs([])).toThrow(/--carpeta/);
    expect(() => leerArgs(['--carpeta', 'x', '--tope', 'mucho'])).toThrow(/--tope/);
    expect(() => leerArgs(['--carpeta', 'x', '--etapa', 'A', '--solo-capitulo', '2'])).toThrow(/etapa C/);
    expect(() => leerArgs(['--carpeta', 'x', '--etapa', 'B'])).toThrow(/--correcciones/);
    expect(() => leerArgs(['--carpeta', 'x', '--loquesea'])).toThrow(/desconocido/);
  });
});

describe('carpeta en disco', () => {
  it('carga entradas, salidas y pendientes, sin la revisión vieja; y guarda', () => {
    const c = carpetaNelida();
    c.escribir('salidas/hechos.json', '{}');
    c.escribir('salidas/lectura-final.json', '{}');
    c.escribir('controles/piezas.json', '[]');
    c.escribir('pendientes/cap_2.json', '["R10"]');
    const leida = cargarCarpeta(aDisco(c));
    expect(leida.existe('salidas/plan.json') && leida.existe('pendientes/cap_2.json')).toBe(true);
    expect(leida.existe('salidas/hechos.json') || leida.existe('salidas/lectura-final.json') || leida.existe('controles/piezas.json')).toBe(false);
    const dir = mkdtempSync(path.join(tmpdir(), 'guardar-'));
    guardarCarpeta(leida, dir);
    expect(readFileSync(path.join(dir, 'salidas', 'plan.json'), 'utf8')).toBe(c.leer('salidas/plan.json'));
  });
});

describe('estimación', () => {
  it('un capítulo: una fila por paso y un total positivo', () => {
    const e = estimarUsd(carpetaNelida(), { soloCapitulo: 1 });
    expect(e.filas.map((f) => f.paso)).toEqual(['2h-armador', '3b-capitulo', '3r-resumen', '4-hechos', '5c-veedor', '6-arreglo', '4-hechos-repaso', '7-estilo', '7-estilo', '3t-titulo']);
    expect(e.total).toBe(Math.round(e.filas.reduce((s, f) => s + f.usd, 0) * 1e4) / 1e4);
    expect(e.total).toBeGreaterThan(0);
  });
});
