// Arma el JSON de prompts del escritor de Kids desde docs/kids/v2/escritor/receta.md. Puro: recibe el texto
// del md. Lo usan el script que genera el JSON (scripts/escritor-kids-prompts-json.ts) y el test que verifica
// que está al día. Reusa los lectores de la receta de Familiar (bloquesDe, esquemaDeMd) sin tocarlos.
import { bloquesDe, esquemaDeMd } from '../../escritor/prompts/compilar.js';

/** Los pasos de la receta de Kids (sección 3), uno por encabezado de nivel 3. */
export const CLAVES_KIDS = ['### Kids · Leer todo', '### Kids · Parte', '### Kids · Sobre', '### Kids · Álbum', '### Kids · Veedor', '### Kids · Arreglo'] as const;
export type ClaveKids = (typeof CLAVES_KIDS)[number];

export type PromptsKids = { version: 'kids-v1'; lineaFija: string; prompts: Record<string, string>; esquemas: Record<string, string> };

const sinCR = (s: string): string => s.replace(/\r\n/g, '\n');

/** La línea fija que va antes de todo (sección 2 de la receta: «Antes de todo va la línea fija `…`»). */
export function lineaFijaDe(md: string): string {
  const m = sinCR(md).match(/Antes de todo va la línea fija `([^`]+)`/);
  if (!m) throw new Error('No está la línea fija en la receta de Kids');
  return m[1].replace(/\s+/g, ' ').trim();
}

export function compilarPromptsKids(md: string): PromptsKids {
  const prompts: Record<string, string> = {};
  const esquemas: Record<string, string> = {};
  for (const k of CLAVES_KIDS) {
    const bloques = bloquesDe(md, k);
    if (bloques.length !== 1) throw new Error(`"${k}" tiene ${bloques.length} bloques de prompt (tiene que tener uno)`);
    prompts[k] = bloques[0];
    esquemas[k] = esquemaDeMd(md, k);
    if (!esquemas[k]) throw new Error(`"${k}" no tiene esquema json`);
  }
  return { version: 'kids-v1', lineaFija: lineaFijaDe(md), prompts, esquemas };
}
