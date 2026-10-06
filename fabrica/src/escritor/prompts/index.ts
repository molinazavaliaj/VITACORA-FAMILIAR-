// Los prompts del escritor v5.5, compilados (scripts/escritor-prompts-json.ts). Nunca se escriben acá.
import compilados from './prompts-v55.json' with { type: 'json' };
import type { PromptsCompilados } from './compilar.js';

// El JSON importado tiene un tipo literal por clave: se pasa por unknown al tipo general.
const P = compilados as unknown as PromptsCompilados;

export function promptsDe(encabezado: string): string[] {
  const b = P.prompts[encabezado];
  if (!b) throw new Error(`No está "${encabezado}" en los prompts compilados`);
  return b;
}

export const esquemaDe = (encabezado: string): string => P.esquemas[encabezado] ?? '';
export const guia = (): string => P.guia;

/** lib.mjs SECCIONES (líneas 142-152), copiado. */
export const SECCIONES: Record<string, string[] | null> = {
  registro: ['2', '6', '9', '14', 'A1', 'A3', 'A4', 'A5'],
  plan: ['1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '13', 'A4', 'A5', 'A7'],
  primera: ['1', '2', '3', '12', '13', 'A2', 'A3', 'A6'],
  capitulo: ['2', '6', 'A3'], // corto a propósito (Naza 02/10): lo demás lo controla el código
  carta: ['2', '3', '11', '14', 'A6'],
  antes: ['2', '3', '11', '14', 'A6'],
  cotejo: ['3', '11', '14'],
  hechos: ['2', '9', '14', '15'],
  lectura: null, // la lectura no lleva el material: va la guía entera
};

/** lib.mjs guiaDe (líneas 153-164), copiado; `guia()` es la compilada. */
export function guiaDe(paso: string): string {
  const g = guia();
  const claves = SECCIONES[paso];
  if (!claves) return g;
  const partes = g.split(/\n(?=## |### A\d)/);
  const tomar = (p: string) => {
    const m = p.match(/^(?:## (\d+)\.|### (A\d)\.)/);
    return m && claves.includes(m[1] || m[2]);
  };
  const resumen = partes.find((p) => p.startsWith('## Si te acordás'));
  return [partes[0], resumen, ...partes.filter(tomar)].filter(Boolean).join('\n');
}

/** Un prompt de docs/v5/escritor-v55/fabrica.md con sus huecos {{X}} llenos. */
export function promptFabrica(encabezado: string, huecos: Record<string, string> = {}): string {
  let t = promptsDe(encabezado)[0];
  // Los huecos que pide el prompt y nadie llenó (se mira antes de sustituir: el texto de la familia puede traer llaves).
  const faltan = [...new Set(t.match(/\{\{[A-Z_]+\}\}/g) ?? [])].filter((h) => !(h.slice(2, -2) in huecos));
  if (faltan.length) throw new Error(`Al prompt "${encabezado}" le quedaron huecos sin llenar: ${faltan.join(', ')}`);
  for (const [k, v] of Object.entries(huecos)) t = t.replaceAll(`{{${k}}}`, v);
  return t;
}
