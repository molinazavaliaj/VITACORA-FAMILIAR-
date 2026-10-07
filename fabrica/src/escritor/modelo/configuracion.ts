// fabrica/src/escritor/modelo/configuracion.ts
// La configuración económica (Naza, 07/10/2026: "no podemos aceptar más de 9 el libro entero").
// Qué modelo y cuánto pensamiento lleva cada llamada, por su nombre (Llamada.nombre):
// - pensamiento al máximo (xhigh) solo en el capítulo y la primera página (Naza eligió la primera página;
//   la carta y "Antes de cerrar" van con medio);
// - Opus con pensamiento medio en lo demás que escribe o revisa;
// - Haiku 4.5 en lo mecánico. Haiku 4.5 no acepta `effort` ni pensamiento adaptativo: piensa con
//   `budget_tokens` (skill claude-api, 07/10/2026); su salida máxima es 64.000;
// - los hechos y su repaso piden 128.000 de salida desde el primer pedido (el lote de la prueba del 07/10
//   los cortó a 64.000 y se pagaron dos veces), y comparten con las disputas una caché de 1 hora.
import type { Esfuerzo } from './tipos.js';

export const OPUS = 'claude-opus-5-5';
export const HAIKU = 'claude-haiku-4-5';

/** `esfuerzo`: pensamiento adaptativo con ese nivel (Opus). `pensamiento`: presupuesto fijo (Haiku). */
export type Rol = { modelo: string; maxTokens: number; esfuerzo?: Esfuerzo; pensamiento?: number };

const MAX_SALIDA: Record<string, number> = { [OPUS]: 128000, 'claude-sonnet-5-5': 128000, [HAIKU]: 64000 };

/** Máximo de salida del modelo: lo que pide el reintento de un corte por max_tokens. */
export function maxSalidaDe(modelo: string): number {
  const m = MAX_SALIDA[modelo];
  if (!m) throw new Error(`configuración del escritor: no hay máximo de salida para ${modelo}`);
  return m;
}

const opus = (esfuerzo: Esfuerzo, maxTokens = 64000): Rol => ({ modelo: OPUS, maxTokens, esfuerzo });
const HAIKU_ROL: Rol = { modelo: HAIKU, maxTokens: 64000, pensamiento: 8000 };
/** El corrector de estilo con Haiku piensa menos (Fable, 07/10: sacaba ~7.000 de pensamiento para ~1.000 de cambios). */
const ESTILO_ROL: Rol = { modelo: HAIKU, maxTokens: 64000, pensamiento: 3000 };

const MAXIMO = /^(3b-capitulo-|3a-primera)/;
const HECHOS = /^4-hechos(-repaso)?$/;
const MECANICO = /^(3r-resumen-|3t-titulo-|3e-sus-frases|7-estilo-|correccion-registro|correccion-plan|dudas$)/;

const CAPITULO = /^3b-capitulo-/;

export function rolDe(nombre: string): Rol {
  // 128.000 de salida: en xhigh el capítulo sacó 52.800 y 44.400 de 64.000; un corte se pagaría dos veces (Fable, idea 3).
  // Naza, 07/10: leyó a ciegas el capítulo VI de Joaquín en medio, máximo y alto y eligió el de medio ("me encantó";
  // el de máximo le pareció con más errores). Cuesta 0,22 contra 0,59–1,10. La primera página sigue en máximo.
  if (CAPITULO.test(nombre)) return opus('medium', 128000);
  if (MAXIMO.test(nombre)) return opus('xhigh', 128000);
  if (HECHOS.test(nombre)) return opus('medium', 128000);
  if (nombre.startsWith('7-estilo-')) return { ...ESTILO_ROL };
  if (MECANICO.test(nombre)) return { ...HAIKU_ROL };
  // Registro, plan, armador, carta, Antes de cerrar, veedor, arreglos, disputas y cualquier llamada nueva.
  return opus('medium');
}

/**
 * Caché de 1 hora: apagada (07/10, Fable con los números del libro de Joaquín: escribirla costó 0,36 de más y el repaso
 * ahorró 0,27; solo paga con dos o más disputas, y hubo cero). Los hechos quedan con la caché común de 5 minutos.
 */
export const cacheDeUnaHora = (_nombre: string): boolean => false;
