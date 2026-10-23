// Los temas de «Vitácora de una historia» (docs/historia/temas.md, aprobado
// por Naza el 21/10) y el banco que le toca a cada uno (docs/historia/
// banco.md, "Reglas del flujo" 3 y 4). Las claves viven acá porque las usa el
// código; el texto de cada tema vive en el md (temas-md.ts lo lee y banco.ts
// lo carga de temas.json). Puro y sin json: lo importa el parser del banco.

import type { BancoEntrevista, PreguntaEntrevista } from './banco-md.js';

/** Las claves de docs/historia/temas.md. El texto de cada tema vive en el md, no acá. */
export const TEMAS_HISTORIA = ['mudanza', 'negocio', 'enfermedad', 'conocimos', 'padres', 'trabajo', 'otra'] as const;
export type TemaHistoria = (typeof TEMAS_HISTORIA)[number];

export function esTema(x: unknown): x is TemaHistoria {
  return typeof x === 'string' && (TEMAS_HISTORIA as readonly string[]).includes(x);
}

export type OpcionesTema = {
  /**
   * El narrador eligió su historia en TEMA-ABIERTO (`estado.temaAbierto`;
   * banco.md, regla 2): las variantes con `Tema = comun` (HC1-A) reemplazan a
   * su común. Con el tema elegido en la compra, no.
   */
  temaAbierto?: boolean;
};

/**
 * El banco que recibe un narrador: la parte común y las de su tema, en el
 * orden del md. Una variante ocupa el lugar de la común que reemplaza (HC8-Q
 * en lugar de HC8, en «conocimos»); las variantes con `Tema = comun` (HC1-A)
 * solo con `temaAbierto`. Los mensajes y los nombres de bloque son los mismos.
 */
export function bancoDeTema(banco: BancoEntrevista, tema: TemaHistoria, { temaAbierto = false }: OpcionesTema = {}): BancoEntrevista {
  const variantes = new Map<string, PreguntaEntrevista>();
  for (const p of banco.preguntas) {
    if (p.reemplaza && (p.tema === tema || (p.tema === 'comun' && temaAbierto))) variantes.set(p.reemplaza, p);
  }
  const preguntas = banco.preguntas.filter((p) => !p.reemplaza && (p.tema === 'comun' || p.tema === tema)).map((p) => variantes.get(p.id) ?? p);
  return { ...banco, preguntas };
}
