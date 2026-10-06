// Cuánto puede costar escribir un capítulo, ANTES de llamar (decisión 7 del spec: la prueba paga se avisa).
// Dos números, ninguno es una promesa: la entrada va a precio lleno (sin caché ni Batch) y la salida son
// presupuestos supuestos (SALIDA_ESTIMADA), no medidos.
//  - típica: el camino sin sobresaltos (un arreglo, una revisión).
//  - peor caso: la típica más una reescritura del capítulo (C30), un reintento de JSON del capítulo y una
//    segunda vuelta de revisión (hechos, veedor, arreglo y repaso).
// Si el capítulo todavía no está escrito, las filas que lo incluirían usan un capítulo de relleno:
// el promedio de los capitulo_NN.md ya escritos; si no hay ninguno, 0,8 × los caracteres de las
// respuestas del plan para ese capítulo (idsDeCapitulo).
import type { Carpeta } from './carpeta.js';
import { PRECIOS_ESCRITOR } from './costos.js';
import { idsDeCapitulo, respuestas, salida } from './lectura.js';
import { llamadaArmador, llamadaCapitulo, llamadaEstilo, llamadaHechos, llamadaResumen, llamadaTitulo, llamadaVeedor, textoParaElModelo, type Llamada } from './llamadas/armar.js';
import { archivoDe } from './texto.js';

export type FilaEstimada = { paso: string; entradaTokens: number; salidaTokens: number; usd: number };
export const SALIDA_ESTIMADA: Record<string, number> = {
  '2h-armador': 8000, '3b-capitulo': 24000, '3r-resumen': 3000, '4-hechos': 16000, '5c-veedor': 10000,
  '6-arreglo': 10000, '4-hechos-repaso': 12000, '7-estilo': 8000, '3t-titulo': 3000,
};
const tokens = (t: string): number => Math.ceil(t.length / 3.5);
const redondear = (x: number): number => Math.round(x * 1e4) / 1e4;

/** Cuántos caracteres tendría el capítulo n si todavía no está escrito (regla en el encabezado). */
export function largoDeRelleno(c: Carpeta, n: number): number {
  const hechos = c.listar('salidas').filter((f) => /^capitulo_\d+\.md$/.test(f)).map((f) => c.leer(`salidas/${f}`).length);
  if (hechos.length) return Math.round(hechos.reduce((a, b) => a + b, 0) / hechos.length);
  const ids = idsDeCapitulo(c, n);
  return Math.round(0.8 * respuestas(c).filter((r) => ids.has(r.id)).reduce((s, r) => s + r.texto.length, 0));
}

export type Estimacion = { filas: FilaEstimada[]; total: number; filasPeor: FilaEstimada[]; peorCaso: number; conRelleno: boolean };

export function estimarUsd(c: Carpeta, o: { soloCapitulo: number }): Estimacion {
  const n = o.soloCapitulo;
  const p = PRECIOS_ESCRITOR['claude-opus-5-5'];
  const fila = (paso: string, l: Llamada | string, salidaClave = paso): FilaEstimada => {
    const entradaTokens = tokens(typeof l === 'string' ? l : textoParaElModelo(l));
    const salidaTokens = SALIDA_ESTIMADA[salidaClave];
    return { paso, entradaTokens, salidaTokens, usd: redondear((entradaTokens * p.input + salidaTokens * p.output) / 1e6) };
  };
  const conRelleno = !c.existe(salida(archivoDe(`cap_${n}`)));
  const armador = llamadaArmador(c, n);
  const capitulo = llamadaCapitulo(c, n);
  const k = c.clonar();
  if (conRelleno) k.escribir(salida(archivoDe(`cap_${n}`)), 'texto '.repeat(Math.ceil(largoDeRelleno(c, n) / 6)));
  const hechos = llamadaHechos(k, { repaso: false });
  const veedor = llamadaVeedor(k);
  const estilo = llamadaEstilo(k, `cap_${n}`, 1);
  const filas = [
    fila('2h-armador', armador),
    fila('3b-capitulo', capitulo),
    fila('3r-resumen', llamadaResumen(k, `cap_${n}`)),
    fila('4-hechos', hechos),
    fila('5c-veedor', veedor),
    fila('6-arreglo', capitulo),
    fila('4-hechos-repaso', hechos),
    fila('7-estilo', estilo),
    fila('7-estilo', estilo),
    fila('3t-titulo', llamadaTitulo(k, n)),
  ];
  const filasPeor = [
    ...filas,
    fila('3b-capitulo-reescritura-C30', llamadaCapitulo(c, n, { error: 'C30' }), '3b-capitulo'),
    fila('3b-capitulo-reintento-json', capitulo, '3b-capitulo'),
    fila('4-hechos-2da-revision', hechos, '4-hechos'),
    fila('5c-veedor-2da-revision', veedor, '5c-veedor'),
    fila('6-arreglo-2da-ronda', capitulo, '6-arreglo'),
    fila('4-hechos-repaso-2da', hechos, '4-hechos-repaso'),
  ];
  const suma = (fs: FilaEstimada[]): number => redondear(fs.reduce((s, f) => s + f.usd, 0));
  return { filas, total: suma(filas), filasPeor, peorCaso: suma(filasPeor), conRelleno };
}
