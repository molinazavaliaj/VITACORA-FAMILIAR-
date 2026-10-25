// Los prompts del escritor de historia, compilados (scripts/escritor-historia-prompts-json.ts). Nunca se escriben acá.
import compilados from './prompts-historia.json' with { type: 'json' };
import { guia } from '../../escritor/prompts/index.js';
import type { ClaveHistoria, PromptsHistoria } from './compilar.js';

const P = compilados as unknown as PromptsHistoria;

/** Los huecos que llena el código (receta, sección 2). */
export type HuecosHistoria = Partial<Record<'NOMBRE' | 'N' | 'ETAPA' | 'TEMA', string>>;

/** La línea fija que va antes de todo en cada llamada. */
export const lineaFijaHistoria = (): string => P.lineaFija;

export function bloquesHistoria(clave: ClaveHistoria): string[] {
  const b = P.prompts[clave];
  if (!b) throw new Error(`No está "${clave}" en los prompts de historia`);
  return b;
}

export const esquemaHistoria = (clave: ClaveHistoria): string => P.esquemas[clave] ?? '';

/** Llena los huecos de un texto de la receta; tira si queda uno sin llenar (se mira antes: el nombre puede traer llaves). */
export function llenar(clave: string, texto: string, huecos: HuecosHistoria): string {
  const faltan = [...new Set(texto.match(/\{\{[A-Z_]+\}\}/g) ?? [])].filter((h) => (huecos as Record<string, string | undefined>)[h.slice(2, -2)] === undefined);
  if (faltan.length) throw new Error(`Al prompt "${clave}" le quedaron huecos sin llenar: ${faltan.join(', ')}`);
  let t = texto;
  for (const [k, v] of Object.entries(huecos)) if (v !== undefined) t = t.replaceAll(`{{${k}}}`, v);
  return t;
}

/** Las instrucciones de un paso: el primer bloque con sus huecos llenos y, al final, el esquema de salida con su nota. */
export function instruccionesHistoria(clave: ClaveHistoria, huecos: HuecosHistoria = {}): string {
  return `${llenar(clave, bloquesHistoria(clave)[0], huecos)}${esquemaHistoria(clave)}`;
}

/**
 * Las secciones de la guía de Familiar que le tocan a cada paso (receta, sección 2). Se sacan las que hablan de la
 * vida entera (1, 4, 10 y 13): lo que decían, para este libro, está en los prompts.
 */
export const SECCIONES_HISTORIA: Record<'registro' | 'plan' | 'hechos', string[]> = {
  registro: ['2', '6', '9', '14', 'A1', 'A3', 'A4', 'A5'],
  plan: ['2', '5', '6', '7', '8', '9', '11', 'A4', 'A5', 'A7'],
  hechos: ['2', '9', '14', '15'],
};

/** La guía de Familiar recortada a las secciones del paso (el mismo corte que guiaDe de Familiar). */
export function guiaHistoria(paso: keyof typeof SECCIONES_HISTORIA): string {
  const claves = SECCIONES_HISTORIA[paso];
  const partes = guia().split(/\n(?=## |### A\d)/);
  const tomar = (p: string) => {
    const m = p.match(/^(?:## (\d+)\.|### (A\d)\.)/);
    return m && claves.includes(m[1] || m[2]);
  };
  const resumen = partes.find((p) => p.startsWith('## Si te acordás'));
  return [partes[0], resumen, ...partes.filter(tomar)].filter(Boolean).join('\n');
}
