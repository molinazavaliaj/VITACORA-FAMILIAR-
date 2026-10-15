// Los prompts del escritor de Kids, compilados (scripts/escritor-kids-prompts-json.ts). Nunca se escriben acá.
import compilados from './prompts-kids.json' with { type: 'json' };
import type { ClaveKids, PromptsKids } from './compilar.js';

const P = compilados as unknown as PromptsKids;

export type HuecosKids = Partial<Record<'NOMBRE' | 'EDAD' | 'GENERO' | 'PARTE' | 'TITULO_PARTE' | 'NOMBRES', string>>;

/** La línea fija que va antes de todo en cada llamada. */
export const lineaFijaKids = (): string => P.lineaFija;

/**
 * Las instrucciones de un paso: el prompt con sus huecos llenos y, al final, el esquema de salida con su nota.
 * Si el prompt pide un hueco que nadie llenó, tira (se mira antes de sustituir: el nombre puede traer llaves).
 */
export function instruccionesKids(clave: ClaveKids, huecos: HuecosKids): string {
  let t = P.prompts[clave];
  if (t === undefined) throw new Error(`No está "${clave}" en los prompts de Kids`);
  const faltan = [...new Set(t.match(/\{\{[A-Z_]+\}\}/g) ?? [])].filter((h) => (huecos as Record<string, string | undefined>)[h.slice(2, -2)] === undefined);
  if (faltan.length) throw new Error(`Al prompt "${clave}" le quedaron huecos sin llenar: ${faltan.join(', ')}`);
  for (const [k, v] of Object.entries(huecos)) if (v !== undefined) t = t.replaceAll(`{{${k}}}`, v);
  return `${t}${P.esquemas[clave] ?? ''}`;
}

export const esquemaKids = (clave: ClaveKids): string => P.esquemas[clave] ?? '';
