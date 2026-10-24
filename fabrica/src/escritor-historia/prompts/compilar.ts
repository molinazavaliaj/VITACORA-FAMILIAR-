// Arma el JSON de prompts del escritor de «Vitácora de una historia» desde docs/historia/escritor/receta.md
// (aprobada por Naza el 22/10). Puro: recibe el texto del md. Lo usan el script que genera el JSON
// (scripts/escritor-historia-prompts-json.ts) y el test que verifica que está al día. Reusa los lectores de la
// receta de Familiar (bloquesDe, esquemaDeMd) sin tocarlos, como Kids.
import { bloquesDe, esquemaDeMd } from '../../escritor/prompts/compilar.js';

/**
 * Los pasos de la receta (sección 4), uno por encabezado de nivel 3, con la cantidad de bloques de prompt que
 * tiene cada uno: Hechos lleva el agregado del repaso, y los de idioma, el de escritura y el del corrector.
 */
export const BLOQUES_HISTORIA = {
  '### Historia · Leer todo': 1,
  '### Historia · Plan': 1,
  '### Historia · Armador': 1,
  '### Historia · Capítulo': 1,
  '### Historia · Carta': 1,
  '### Historia · Sus frases': 1,
  '### Historia · Ficha de lo escrito': 1,
  '### Historia · Hechos': 2,
  '### Historia · Veedor': 1,
  '### Historia · Arreglo': 1,
  '### Historia · Corrector': 1,
  '### Historia · Título del capítulo': 1,
  '### Historia · Idioma · catalán': 2,
  '### Historia · Idioma · España': 2,
} as const;
export type ClaveHistoria = keyof typeof BLOQUES_HISTORIA;
export const CLAVES_HISTORIA = Object.keys(BLOQUES_HISTORIA) as ClaveHistoria[];

export type PromptsHistoria = { version: 'historia-v1'; lineaFija: string; prompts: Record<string, string[]>; esquemas: Record<string, string> };

const sinCR = (s: string): string => s.replace(/\r\n/g, '\n');

/** La línea fija que va antes de todo (sección 2: «Antes de todo va la línea fija `…`»). */
export function lineaFijaDe(md: string): string {
  const m = sinCR(md).match(/Antes de todo va la línea fija `([^`]+)`/);
  if (!m) throw new Error('No está la línea fija en la receta de historia');
  return m[1].replace(/\s+/g, ' ').trim();
}

export function compilarPromptsHistoria(md: string): PromptsHistoria {
  const prompts: Record<string, string[]> = {};
  const esquemas: Record<string, string> = {};
  for (const k of CLAVES_HISTORIA) {
    const bloques = bloquesDe(md, k);
    if (bloques.length !== BLOQUES_HISTORIA[k]) throw new Error(`"${k}" tiene ${bloques.length} bloques de prompt (tiene que tener ${BLOQUES_HISTORIA[k]})`);
    prompts[k] = bloques;
    esquemas[k] = esquemaDeMd(md, k);
  }
  return { version: 'historia-v1', lineaFija: lineaFijaDe(md), prompts, esquemas };
}
