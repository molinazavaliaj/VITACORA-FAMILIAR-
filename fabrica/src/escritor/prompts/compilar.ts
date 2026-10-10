// Arma el JSON de prompts del escritor v5.5 desde los md (receta, guía y fabrica.md).
// Puro: recibe el texto de los md. Lo usan el script que genera el JSON y el test que
// verifica que está al día. Los prompts se leen como los leía lib.mjs (promptsDe/esquemaDe).

/** Los encabezados que usa el escritor v5.5 en modo puro (los mismos que llama llamada.mjs). */
export const CLAVES_RECETA = [
  '### Paso 1', '### Paso 2 ·', '### Paso 2h', '### Paso 3a puro', '### Paso 3b puro', '### Paso 3c puro', '### Paso 3d puro',
  '### Paso 3e puro', '### Paso 3r', '### Paso 3t', '### Paso 4', '### Paso 5c', '### Paso 6 puro', '### Paso 7', '### Idioma · catalán',
] as const;
export const CLAVES_FABRICA = ['### Disputa', '### Dudas para la familia', '### Corrección del registro', '### Corrección del plan'] as const;

export type PromptsCompilados = { version: 'v5.5'; prompts: Record<string, string[]>; esquemas: Record<string, string>; guia: string };

const sinCR = (s: string): string => s.replace(/\r\n/g, '\n');

/** lib.mjs promptsDe (líneas 18-33) con el texto de la receta como parámetro. */
export function bloquesDe(md: string, encabezado: string): string[] {
  const receta = sinCR(md);
  const i = receta.indexOf(encabezado);
  if (i < 0) throw new Error(`No está "${encabezado}" en la receta`);
  const fin = receta.indexOf('\n### ', i + 5);
  const tramo = receta.slice(i, fin < 0 ? undefined : fin);
  // Línea por línea: un ``` que cierra un ```json no abre un bloque nuevo (pasaba en el Paso 4 y el 6).
  const bloques: string[] = [];
  let abierto: { lengua: string; lineas: string[] } | null = null;
  for (const l of tramo.split('\n')) {
    if (abierto === null) { const m = l.match(/^```(\w*)\s*$/); if (m) abierto = { lengua: m[1], lineas: [] }; continue; }
    if (/^```\s*$/.test(l)) { if (!abierto.lengua) bloques.push(abierto.lineas.join('\n').trim()); abierto = null; continue; }
    abierto.lineas.push(l);
  }
  return bloques;
}

/** lib.mjs esquemaDe (líneas 111-120) con el texto como parámetro. */
export function esquemaDeMd(md: string, encabezado: string): string {
  const receta = sinCR(md);
  const i = receta.indexOf(encabezado);
  const fin = receta.indexOf('\n### ', i + 5);
  const tramo = receta.slice(i, fin < 0 ? undefined : fin);
  const m = tramo.match(/```json\n([\s\S]*?)```\n+([^\n|][^\n]*)?/);
  if (!m) return '';
  const nota = m[2] && !m[2].startsWith('#') ? `\n${m[2].trim()}` : '';
  return `\n\nEsquema de salida:\n${m[1].trim()}${nota}`;
}

export function compilarPrompts(md: { receta: string; guia: string; fabrica: string }): PromptsCompilados {
  const prompts: Record<string, string[]> = {};
  const esquemas: Record<string, string> = {};
  for (const k of CLAVES_RECETA) {
    prompts[k] = bloquesDe(md.receta, k);
    esquemas[k] = esquemaDeMd(md.receta, k);
  }
  for (const k of CLAVES_FABRICA) {
    prompts[k] = bloquesDe(md.fabrica, k);
    esquemas[k] = esquemaDeMd(md.fabrica, k);
  }
  return { version: 'v5.5', prompts, esquemas, guia: sinCR(md.guia) };
}
