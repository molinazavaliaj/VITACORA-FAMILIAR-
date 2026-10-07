// fabrica/test/escritor/cli.test.ts
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cargarCarpeta, guardarCarpeta, leerArgs, sinClave, textoEstimacion } from '../../src/escritor/cli.js';
import { estimarUsd } from '../../src/escritor/estimar.js';
import { aDisco, carpetaNelida } from './ayuda.js';

describe('argumentos', () => {
  it('por defecto: etapa C, lote, tope 15 y sin llamar (falta --si)', () => {
    expect(leerArgs(['--carpeta', 'x'])).toEqual({ carpeta: 'x', etapa: 'C', topeUsd: 15, lote: true, si: false });
    expect(leerArgs(['--carpeta', 'x', '--solo-capitulo', '6', '--tope', '4', '--sin-lote', '--si'])).toEqual({ carpeta: 'x', etapa: 'C', soloCapitulo: 6, topeUsd: 4, lote: false, si: true });
    expect(leerArgs(['--carpeta', 'x', '--salida', 'otra', '--solo-escritura'])).toMatchObject({ salida: 'otra', soloEscritura: true });
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

describe('estimación con la configuración económica', () => {
  it('cada fila con el modelo de su llamada: Haiku en resumen, estilo y título; Opus en lo demás', () => {
    const e = estimarUsd(carpetaNelida(), { soloCapitulo: 1 });
    const modelo = Object.fromEntries(e.filas.map((f) => [f.paso, f.modelo]));
    for (const p of ['3r-resumen', '7-estilo', '3t-titulo']) expect(modelo[p], p).toBe('claude-haiku-4-5');
    for (const p of ['2h-armador', '3b-capitulo', '4-hechos', '5c-veedor', '6-arreglo', '4-hechos-repaso']) expect(modelo[p], p).toBe('claude-opus-5-5');
  });
  it('la entrada se cuenta con los caracteres por token medidos (Opus 2,3); sin caché de 1 hora, los hechos pagan la entrada común', () => {
    const f = estimarUsd(carpetaNelida(), { soloCapitulo: 1 }).filas.find((x) => x.paso === '4-hechos')!;
    expect(f.usd).toBeCloseTo((f.entradaTokens * 4 + f.salidaTokens * 20) / 1e6, 4);
    const v = estimarUsd(carpetaNelida(), { soloCapitulo: 1 }).filas.find((x) => x.paso === '5c-veedor')!;
    expect(v.usd).toBeCloseTo((v.entradaTokens * 4 + v.salidaTokens * 20) / 1e6, 4);
  });
  it('con lote, todo a mitad de precio; el texto lo dice', () => {
    const lleno = estimarUsd(carpetaNelida(), { soloCapitulo: 1 });
    const lote = estimarUsd(carpetaNelida(), { soloCapitulo: 1, lote: true });
    lote.filas.forEach((f, i) => expect(f.usd).toBeCloseTo(lleno.filas[i].usd / 2, 3));
    expect(textoEstimacion(carpetaNelida(), { soloCapitulo: 1, topeUsd: 15, lote: true }).join(' ')).toMatch(/todo por Batch/);
  });
});

describe('estimación honesta', () => {
  const sinCap1 = () => { const c = carpetaNelida(); c.borrar('salidas/capitulo_01.md'); return c; };
  it('capítulo sin escribir: usa un capítulo de relleno en las filas que lo incluyen', () => {
    const sin = sinCap1();
    const e = estimarUsd(sin, { soloCapitulo: 1 });
    expect(e.conRelleno).toBe(true);
    for (const paso of ['3r-resumen', '7-estilo', '3t-titulo', '4-hechos', '5c-veedor']) expect(e.filas.find((f) => f.paso === paso)!.entradaTokens).toBeGreaterThan(100);
    const sinRelleno = (() => { const c = sinCap1(); c.borrar('salidas/capitulo_02.md'); return estimarUsd(c, { soloCapitulo: 1 }); })();
    expect(sinRelleno.conRelleno).toBe(true); // sin otros capítulos: 0,8 × las respuestas del plan
    expect(sinRelleno.filas.find((f) => f.paso === '3r-resumen')!.entradaTokens).toBeGreaterThan(100);
    expect(estimarUsd(carpetaNelida(), { soloCapitulo: 1 }).conRelleno).toBe(false);
  });
  it('peor caso: más que la típica', () => {
    const e = estimarUsd(sinCap1(), { soloCapitulo: 1 });
    expect(e.peorCaso).toBeGreaterThan(e.total);
    expect(e.filasPeor.length).toBeGreaterThan(e.filas.length);
  });
  it('el peor caso trae las filas de reescritura, reintento y segunda vuelta (y no C7)', () => {
    const pasos = estimarUsd(sinCap1(), { soloCapitulo: 1 }).filasPeor.map((f) => f.paso);
    for (const p of ['3b-capitulo-reescritura-C30', '3b-capitulo-reintento-json', '4-hechos-2da-revision', '5c-veedor-2da-revision', '6-arreglo-2da-ronda', '4-hechos-repaso-2da']) expect(pasos).toContain(p);
    expect(pasos.some((p) => /C7|primera/.test(p))).toBe(false);
    expect(textoEstimacion(carpetaNelida(), { soloCapitulo: 1, topeUsd: 15 }).join(' ')).toMatch(/C7/);
  });
  it('el arreglo lleva el capítulo: su entrada crece cuando el capítulo está', () => {
    const con = estimarUsd(carpetaNelida(), { soloCapitulo: 1 }).filas.find((f) => f.paso === '6-arreglo')!;
    const c0 = carpetaNelida(); c0.borrar('salidas/capitulo_01.md'); c0.borrar('salidas/capitulo_02.md');
    const sin = estimarUsd(c0, { soloCapitulo: 1 }).filas.find((f) => f.paso === '6-arreglo')!;
    expect(con.entradaTokens).toBeGreaterThan(sin.entradaTokens);
    expect(sin.entradaTokens).toBeGreaterThan(0);
  });
  it('sin --solo-capitulo dice "sin estimación"; con tope justo avisa y recomienda uno', () => {
    expect(textoEstimacion(carpetaNelida(), { topeUsd: 15 }).join(' ')).toMatch(/Sin estimación/);
    const peor = estimarUsd(carpetaNelida(), { soloCapitulo: 1 }).peorCaso;
    const justo = textoEstimacion(carpetaNelida(), { soloCapitulo: 1, topeUsd: Math.ceil(peor) }).join(' ');
    expect(justo).toMatch(/AVISO.*--tope \d+/);
    expect(justo).toMatch(/estimación típica/);
    expect(justo).toMatch(/peor caso/);
    expect(justo).not.toMatch(/cota alta/);
    expect(textoEstimacion(carpetaNelida(), { soloCapitulo: 1, topeUsd: 1000 }).join(' ')).not.toMatch(/AVISO/);
  });
  it('sin clave (vacía o ausente) el mensaje queda igual', () => {
    expect(sinClave('falló', { ANTHROPIC_API_KEY: '' })).toBe('falló');
    expect(sinClave('falló', {})).toBe('falló');
  });
  it('saca la clave de los mensajes', () => {
    expect(sinClave('falló con sk-ant-secreto-123 en la llamada', { ANTHROPIC_API_KEY: 'sk-ant-secreto-123' })).toBe('falló con [clave] en la llamada');
  });
});
