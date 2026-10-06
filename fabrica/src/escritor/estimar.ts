// Cuánto puede costar escribir un capítulo, ANTES de llamar (decisión 7 del spec: la prueba paga se avisa).
// Cota alta: entrada a precio lleno (sin caché ni Batch); la salida incluye lo que piensa en xhigh.
// Lo que todavía no existe (el capítulo nuevo) se estima con lo que hay en la carpeta.
import type { Carpeta } from './carpeta.js';
import { PRECIOS_ESCRITOR } from './costos.js';
import { salida } from './lectura.js';
import { llamadaArmador, llamadaCapitulo, llamadaEstilo, llamadaHechos, llamadaResumen, llamadaTitulo, llamadaVeedor, textoParaElModelo, type Llamada } from './llamadas/armar.js';
import { archivoDe } from './texto.js';

export type FilaEstimada = { paso: string; entradaTokens: number; salidaTokens: number; usd: number };
export const SALIDA_ESTIMADA: Record<string, number> = {
  '2h-armador': 8000, '3b-capitulo': 24000, '3r-resumen': 3000, '4-hechos': 16000, '5c-veedor': 10000,
  '6-arreglo': 10000, '4-hechos-repaso': 12000, '7-estilo': 8000, '3t-titulo': 3000,
};
const tokens = (t: string): number => Math.ceil(t.length / 3.5);

export function estimarUsd(c: Carpeta, o: { soloCapitulo: number }): { filas: FilaEstimada[]; total: number } {
  const n = o.soloCapitulo;
  const p = PRECIOS_ESCRITOR['claude-opus-5-5'];
  const fila = (paso: string, l: Llamada | string): FilaEstimada => {
    const entradaTokens = tokens(typeof l === 'string' ? l : textoParaElModelo(l));
    const salidaTokens = SALIDA_ESTIMADA[paso];
    return { paso, entradaTokens, salidaTokens, usd: Math.round(((entradaTokens * p.input + salidaTokens * p.output) / 1e6) * 1e4) / 1e4 };
  };
  const capitulo = llamadaCapitulo(c, n);
  const hayCap = c.existe(salida(archivoDe(`cap_${n}`)));
  const hechos = llamadaHechos(c, { repaso: false });
  const filas = [
    fila('2h-armador', llamadaArmador(c, n)),
    fila('3b-capitulo', capitulo),
    fila('3r-resumen', hayCap ? llamadaResumen(c, `cap_${n}`) : ''),
    fila('4-hechos', hechos),
    fila('5c-veedor', llamadaVeedor(c)),
    fila('6-arreglo', capitulo),
    fila('4-hechos-repaso', hechos),
    fila('7-estilo', hayCap ? llamadaEstilo(c, `cap_${n}`, 1) : ''),
    fila('7-estilo', hayCap ? llamadaEstilo(c, `cap_${n}`, 1) : ''),
    fila('3t-titulo', hayCap ? llamadaTitulo(c, n) : ''),
  ];
  return { filas, total: Math.round(filas.reduce((s, f) => s + f.usd, 0) * 1e4) / 1e4 };
}
