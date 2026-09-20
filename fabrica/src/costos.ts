import type { obtenerClienteDb } from './db.js';
import { descargarTextoOpcional, subirTexto } from './libro/comun.js';

// Cuánto cuesta de verdad cada libro. Hasta ahora el costo por libro se
// estimaba a mano en GASTOS.md; acá se MIDE: cada llamada al modelo devuelve
// `usage` (tokens de entrada, de salida y de caché), y este módulo la
// convierte a USD con la tabla de precios y la anota en
// `{narradorId}/paquete/costos.json` (bucket `audios`), una fila por llamada.
//
// Anotar el costo es secundario a escribir el libro: si Storage falla, se
// avisa por consola y el capítulo sigue. Nunca tira.

type Db = ReturnType<typeof obtenerClienteDb>;

/** Los pasos de la fábrica que le pagan al modelo. */
export type PasoModelo = 'estructura' | 'anticipo' | 'preview' | 'capitulo' | 'editor';

/**
 * Lo que devuelve la API en `message.usage`. Todos opcionales: según el
 * pedido, los de caché vienen en null o no vienen, y los mocks de los tests
 * no traen `usage` en absoluto.
 */
export type Uso = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

/** Una fila de costos.json: una llamada al modelo. Los tokens van desglosados para poder recalcular si cambian los precios. */
export type FilaCosto = {
  fecha: string;
  modelo: string;
  paso: string;
  input: number;
  output: number;
  cache_write: number;
  cache_read: number;
  usd: number;
};

export type Precio = { input: number; output: number; cache_write: number; cache_read: number };

/**
 * USD por millón de tokens. Cache write = 1,25× el input y cache read = 0,1×
 * (la regla de Anthropic; en fable-5 eso da 12,5 y 1). Se busca por nombre
 * exacto y, si no, por prefijo: `claude-haiku-4-5-20251001` cobra como
 * `claude-haiku-4-5`.
 */
export const PRECIOS_USD_POR_MILLON: Record<string, Precio> = {
  'claude-fable-5': { input: 10, output: 50, cache_write: 12.5, cache_read: 1 },
  'claude-opus-5': { input: 5, output: 25, cache_write: 6.25, cache_read: 0.5 },
  'claude-haiku-4-5': { input: 1, output: 5, cache_write: 1.25, cache_read: 0.1 },
};

export const RUTA_COSTOS = (narradorId: string) => `${narradorId}/paquete/costos.json`;

function precioDe(modelo: string): Precio | null {
  if (PRECIOS_USD_POR_MILLON[modelo]) return PRECIOS_USD_POR_MILLON[modelo];
  const base = Object.keys(PRECIOS_USD_POR_MILLON).find((clave) => modelo.startsWith(`${clave}-`));
  return base ? PRECIOS_USD_POR_MILLON[base] : null;
}

/** Seis decimales: la unidad mínima (1 token de haiku) es 0,000001 USD, y así no se arrastra ruido de coma flotante. */
function redondearUsd(valor: number): number {
  return Math.round(valor * 1e6) / 1e6;
}

function tokens(valor: number | null | undefined): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

/**
 * Cuánto costó una llamada en USD. Un modelo que no está en la tabla vale 0
 * y se avisa — los tokens igual quedan anotados, así que se puede recalcular
 * cuando alguien cargue el precio.
 */
export function calcularUsd(modelo: string, usage: Uso): number {
  const precio = precioDe(modelo);
  if (!precio) {
    console.warn(`costos: no hay precio cargado para el modelo ${modelo}; se anota con usd 0.`);
    return 0;
  }
  const porMillon =
    tokens(usage.input_tokens) * precio.input +
    tokens(usage.output_tokens) * precio.output +
    tokens(usage.cache_creation_input_tokens) * precio.cache_write +
    tokens(usage.cache_read_input_tokens) * precio.cache_read;
  return redondearUsd(porMillon / 1_000_000);
}

export function armarFila(modelo: string, paso: string, usage: Uso, fecha: Date = new Date()): FilaCosto {
  return {
    fecha: fecha.toISOString(),
    modelo,
    paso,
    input: tokens(usage.input_tokens),
    output: tokens(usage.output_tokens),
    cache_write: tokens(usage.cache_creation_input_tokens),
    cache_read: tokens(usage.cache_read_input_tokens),
    usd: calcularUsd(modelo, usage),
  };
}

/**
 * Lee el costos.json que hay (null = todavía no existe → lista vacía). Si el
 * archivo está pero no es una lista JSON, tira: mejor no anotar esta llamada
 * que pisar lo que ya había con una lista nueva.
 */
export function parsearCostos(texto: string | null): FilaCosto[] {
  if (texto === null) return [];
  let parseado: unknown;
  try {
    parseado = JSON.parse(texto);
  } catch (err) {
    throw new Error(`costos.json no es JSON válido: ${(err as Error).message}`);
  }
  if (!Array.isArray(parseado)) throw new Error('costos.json no es una lista');
  return parseado as FilaCosto[];
}

/**
 * Anota una llamada al modelo en el costos.json del narrador: baja el que
 * hay, agrega la fila, lo sube. Cualquier fallo (Storage, archivo roto,
 * cliente sin configurar) se loguea con `console.warn` y NO frena al que
 * llama: el libro vale más que la contabilidad.
 *
 * `db` puede ser el cliente o la función que lo consigue
 * (`obtenerClienteDb`): los módulos que no reciben `db` pasan la función y
 * se resuelve acá adentro, dentro del mismo `try`, así un cliente que no
 * arranca tampoco frena nada.
 *
 * `usage` sin valor (los mocks de los tests no lo traen) = no hay nada que
 * anotar; la API real siempre lo manda.
 */
export async function registrarUso(
  db: Db | (() => Db),
  narradorId: string,
  uso: { modelo: string; paso: PasoModelo; usage: Uso | null | undefined }
): Promise<void> {
  if (!uso.usage) return;
  try {
    const cliente = typeof db === 'function' ? db() : db;
    const ruta = RUTA_COSTOS(narradorId);
    const costos = parsearCostos(await descargarTextoOpcional(cliente, ruta));
    costos.push(armarFila(uso.modelo, uso.paso, uso.usage));
    await subirTexto(cliente, ruta, JSON.stringify(costos, null, 2), 'application/json');
  } catch (err) {
    console.warn(
      `registrarUso: no se pudo anotar el costo del paso ${uso.paso} (${uso.modelo}) de ${narradorId}: ${(err as Error).message}`
    );
  }
}

export type ResumenCostos = {
  totalUsd: number;
  llamadas: number;
  porPaso: Record<string, { usd: number; llamadas: number }>;
};

/** Total en USD del libro y desglose por paso (cuánto costó la estructura, los capítulos, el editor...). */
export function resumen(costos: FilaCosto[]): ResumenCostos {
  const porPaso: ResumenCostos['porPaso'] = {};
  let total = 0;
  for (const fila of costos) {
    const usd = tokens(fila.usd);
    total += usd;
    const acumulado = porPaso[fila.paso] ?? { usd: 0, llamadas: 0 };
    porPaso[fila.paso] = { usd: redondearUsd(acumulado.usd + usd), llamadas: acumulado.llamadas + 1 };
  }
  return { totalUsd: redondearUsd(total), llamadas: costos.length, porPaso };
}
