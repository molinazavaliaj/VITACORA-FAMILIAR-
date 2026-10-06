// Cuánto puede costar escribir un capítulo, ANTES de llamar (decisión 7 del spec: la prueba paga se avisa).
// Dos números, ninguno es una promesa: la entrada va sin caché, cada fila con el precio del modelo de su
// llamada (modelo/configuracion.ts) y a mitad de precio si va por Batch; la salida son presupuestos supuestos
// (SALIDA_ESTIMADA), no medidos.
//  - típica: el camino sin sobresaltos (un arreglo, una revisión).
//  - peor caso: la típica más una reescritura del capítulo (C30), un reintento de JSON del capítulo y una
//    segunda vuelta de revisión (hechos, veedor, arreglo y repaso). La reescritura de la primera página
//    (C7) NO entra: con --solo-capitulo la etapa C no corre el paso 3a (solo corre con el libro entero).
//    Los arreglos se calculan con el capítulo (real o de relleno) y problemas de relleno.
// Si el capítulo todavía no está escrito, las filas que lo incluirían usan un capítulo de relleno:
// el promedio de los capitulo_NN.md ya escritos; si no hay ninguno, 0,8 × los caracteres de las
// respuestas del plan para ese capítulo (idsDeCapitulo).
import type { Carpeta } from './carpeta.js';
import { PRECIOS_ESCRITOR } from './costos.js';
import { rolDe } from './modelo/configuracion.js';
import { idsDeCapitulo, respuestas, salida } from './lectura.js';
import { llamadaArmador, llamadaArreglo, llamadaCapitulo, llamadaEstilo, llamadaHechos, llamadaResumen, llamadaTitulo, llamadaVeedor, textoParaElModelo, type Llamada } from './llamadas/armar.js';
import { archivoDe } from './texto.js';

export type FilaEstimada = { paso: string; modelo: string; entradaTokens: number; salidaTokens: number; usd: number };
/**
 * Salida con pensamiento, por paso. La prueba paga del 07/10 (todo xhigh) midió: capítulo 43.099, armador 27.049,
 * hechos 61.306, veedor 38.388, arreglo 16.025, repaso 15.834. Con la configuración económica el capítulo sigue
 * en xhigh; lo de pensamiento medio se supone en algo menos de la mitad; Haiku, con su presupuesto de 8.000.
 */
export const SALIDA_ESTIMADA: Record<string, number> = {
  '2h-armador': 12000, '3b-capitulo': 45000, '3r-resumen': 3000, '4-hechos': 30000, '5c-veedor': 16000,
  '6-arreglo': 8000, '4-hechos-repaso': 8000, '7-estilo': 8000, '3t-titulo': 3000,
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

export function estimarUsd(c: Carpeta, o: { soloCapitulo: number; lote?: boolean }): Estimacion {
  const n = o.soloCapitulo;
  const factor = o.lote ? 0.5 : 1;
  const fila = (paso: string, l: Llamada, salidaClave = paso): FilaEstimada => {
    const { modelo } = rolDe(l.nombre);
    const p = PRECIOS_ESCRITOR[modelo];
    const entradaTokens = tokens(textoParaElModelo(l));
    const salidaTokens = SALIDA_ESTIMADA[salidaClave];
    return { paso, modelo, entradaTokens, salidaTokens, usd: redondear(((entradaTokens * p.input + salidaTokens * p.output) / 1e6) * factor) };
  };
  const conRelleno = !c.existe(salida(archivoDe(`cap_${n}`)));
  const armador = llamadaArmador(c, n);
  const capitulo = llamadaCapitulo(c, n);
  const k = c.clonar();
  if (conRelleno) k.escribir(salida(archivoDe(`cap_${n}`)), 'texto '.repeat(Math.ceil(largoDeRelleno(c, n) / 6)));
  const hechos = llamadaHechos(k, { repaso: false });
  const veedor = llamadaVeedor(k);
  const estilo = llamadaEstilo(k, `cap_${n}`, 1);
  // Un arreglo real lleva el capítulo (pieza_actual) y los problemas del veedor; acá, problemas de relleno.
  k.escribir(`arreglos/problemas-cap_${n}.json`, JSON.stringify(Array.from({ length: 5 }, (_, i) => ({ id: `P${i + 1}`, problema: 'problema de relleno '.repeat(10) })), null, 1));
  const arreglo = llamadaArreglo(k, `cap_${n}`);
  const filas = [
    fila('2h-armador', armador),
    fila('3b-capitulo', capitulo),
    fila('3r-resumen', llamadaResumen(k, `cap_${n}`)),
    fila('4-hechos', hechos),
    fila('5c-veedor', veedor),
    fila('6-arreglo', arreglo),
    fila('4-hechos-repaso', hechos),
    fila('7-estilo', estilo),
    fila('7-estilo', estilo),
    fila('3t-titulo', llamadaTitulo(k, n)),
  ];
  const filasPeor = [
    ...filas,
    fila('3b-capitulo-reescritura-C30', llamadaCapitulo(k, n, { error: 'C30' }), '3b-capitulo'),
    fila('3b-capitulo-reintento-json', capitulo, '3b-capitulo'),
    fila('4-hechos-2da-revision', hechos, '4-hechos'),
    fila('5c-veedor-2da-revision', veedor, '5c-veedor'),
    fila('6-arreglo-2da-ronda', arreglo, '6-arreglo'),
    fila('4-hechos-repaso-2da', hechos, '4-hechos-repaso'),
  ];
  const suma = (fs: FilaEstimada[]): number => redondear(fs.reduce((s, f) => s + f.usd, 0));
  return { filas, total: suma(filas), filasPeor, peorCaso: suma(filasPeor), conRelleno };
}
