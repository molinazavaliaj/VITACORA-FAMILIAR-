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

// PRUEBA del 07/10 (perfiles de otros proveedores, solo con el material de Naza).
export const DEEPSEEK = 'deepseek-v4-pro';
export const GEMINI_PRO = 'gemini-3.1-pro-preview';
export const GEMINI_FLASH = 'gemini-3.8-flash';

const MAX_SALIDA: Record<string, number> = { [OPUS]: 128000, 'claude-sonnet-5-5': 128000, [HAIKU]: 64000, [DEEPSEEK]: 384000, [GEMINI_PRO]: 65536, [GEMINI_FLASH]: 65536 };

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

/**
 * Perfiles de la PRUEBA del 07/10 (Naza: "que tareas podemos delegar en deepseek"; después sumó Gemini):
 * - eco: la configuración económica (la de producción);
 * - deepseek / gemini: el capítulo y la primera página siguen con Opus xhigh; lo demás, al otro proveedor
 *   (lo de Opus medio con pensamiento alto; lo de Haiku con pensamiento bajo). En Google todo va con Flash:
 *   la key de Naza es gratis y la capa gratis no deja usar Gemini 3.1 Pro (429 "exceeded your current quota", 07/10);
 * - deepseek-todo / gemini-todo: también el capítulo y la primera página (pensamiento al máximo que tengan);
 * - eco-alto / eco-medio: la económica con el capítulo (no la primera página) en pensamiento alto o medio
 *   (Fable, idea 1; la prueba la lee Naza).
 */
export type Perfil = 'eco' | 'eco-alto' | 'eco-medio' | 'deepseek' | 'gemini' | 'deepseek-todo' | 'gemini-todo';
export const PERFILES: Perfil[] = ['eco', 'eco-alto', 'eco-medio', 'deepseek', 'gemini', 'deepseek-todo', 'gemini-todo'];
const CAPITULO = /^3b-capitulo-/;

export function rolDe(nombre: string, perfil: Perfil = 'eco'): Rol {
  if (perfil === 'eco') return rolEco(nombre);
  if (perfil === 'eco-alto' || perfil === 'eco-medio') return CAPITULO.test(nombre) ? opus(perfil === 'eco-alto' ? 'high' : 'medium', 128000) : rolEco(nombre);
  const fuera = perfil.startsWith('deepseek') ? 'deepseek' : 'gemini';
  const todo = perfil.endsWith('-todo');
  if (MAXIMO.test(nombre) && !todo) return opus('xhigh');
  const max = fuera === 'deepseek' ? 128000 : 65536;
  if (MAXIMO.test(nombre)) return { modelo: fuera === 'deepseek' ? DEEPSEEK : GEMINI_FLASH, maxTokens: max, esfuerzo: 'xhigh' };
  if (MECANICO.test(nombre)) return { modelo: fuera === 'deepseek' ? DEEPSEEK : GEMINI_FLASH, maxTokens: max, esfuerzo: 'low' };
  return { modelo: fuera === 'deepseek' ? DEEPSEEK : GEMINI_FLASH, maxTokens: max, esfuerzo: 'high' };
}

function rolEco(nombre: string): Rol {
  // 128.000 de salida: en xhigh el capítulo sacó 52.800 y 44.400 de 64.000; un corte se pagaría dos veces (Fable, idea 3).
  if (MAXIMO.test(nombre)) return opus('xhigh', 128000);
  if (HECHOS.test(nombre)) return opus('medium', 128000);
  if (nombre.startsWith('7-estilo-')) return { ...ESTILO_ROL };
  if (MECANICO.test(nombre)) return { ...HAIKU_ROL };
  // Registro, plan, armador, carta, Antes de cerrar, veedor, arreglos, disputas y cualquier llamada nueva.
  return opus('medium');
}

/** Las llamadas que leen el libro entero: su caché dura 1 hora (la reusan las disputas y el repaso, que llegan después de un lote). */
export const cacheDeUnaHora = (nombre: string): boolean => HECHOS.test(nombre) || nombre.startsWith('disputa-');
