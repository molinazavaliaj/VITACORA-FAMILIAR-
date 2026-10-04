// El banco de la entrevista tipado. `banco.json` lo genera
// `scripts/v3-entrevista-json.ts` desde docs/v3/entrevista/banco.md (la
// fuente); un test chequea que estén al día.
//
// Otros idiomas (Naza, 04/10): `banco-ca.json` sale de banco-ca.md y trae
// solo los textos; `bancoDe('ca')` es el mismo banco (mismo orden, mismas
// reglas, mismos botones y lo que vale cada uno) con los textos en catalán.

import bancoJson from './banco.json' with { type: 'json' };
import bancoCaJson from './banco-ca.json' with { type: 'json' };
import type { BancoEntrevista, MensajeEntrevista, PreguntaEntrevista } from './banco-md.js';
import type { TextosIdioma } from './banco-idioma-md.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';

export type { BancoEntrevista, MensajeEntrevista, PreguntaEntrevista, Condicion, CondicionSimple, Parte, Clase, Boton, ValeBoton } from './banco-md.js';
export { condicionesDe } from './banco-md.js';
export type { Idioma } from './idioma.js';

const DATOS = bancoJson as BancoEntrevista;

/** Todas las preguntas, en orden de envío. */
export const BANCO: readonly PreguntaEntrevista[] = DATOS.preguntas;

/** Arranque y mensajes fijos (BIEN, M6, M1, M3.1…M3.8, M4.1…M4.4, M8…). */
export const MENSAJES: readonly MensajeEntrevista[] = DATOS.mensajes;

/** Nombre de cada bloque, como en el md ("Amor y pareja"). */
export const NOMBRES_BLOQUE: Readonly<Record<number, string>> = DATOS.nombresBloque;

const POR_ID = new Map(BANCO.map((p) => [p.id, p]));
const MENSAJE_POR_ID = new Map(MENSAJES.map((m) => [m.id, m]));

/** Los textos de cada idioma que no es el de banco.md. */
export const TEXTOS_IDIOMA: Readonly<Record<Exclude<Idioma, 'es-AR'>, TextosIdioma>> = { ca: bancoCaJson as TextosIdioma };

type Armado = {
  banco: readonly PreguntaEntrevista[];
  porId: ReadonlyMap<string, PreguntaEntrevista>;
  mensajes: readonly MensajeEntrevista[];
  mensajePorId: ReadonlyMap<string, MensajeEntrevista>;
};

const ARMADOS = new Map<Idioma, Armado>([[IDIOMA_POR_DEFECTO, { banco: BANCO, porId: POR_ID, mensajes: MENSAJES, mensajePorId: MENSAJE_POR_ID }]]);

/**
 * El banco de banco.md con los textos de otro idioma. Si a una pregunta o un
 * mensaje le falta su texto, error: nunca se manda castellano en una
 * entrevista en catalán.
 */
function armar(idioma: Exclude<Idioma, 'es-AR'>): Armado {
  const t = TEXTOS_IDIOMA[idioma];
  const banco = BANCO.map((p): PreguntaEntrevista => {
    const texto = t.preguntas[p.id];
    if (texto === undefined) throw new Error(`${idioma}: falta el texto de ${p.id}`);
    if (!p.botones) return { ...p, texto };
    const suyos = t.botones[p.id] ?? [];
    if (suyos.length !== p.botones.length) throw new Error(`${idioma}: ${p.id} tiene ${suyos.length} botones y en banco.md ${p.botones.length}`);
    return { ...p, texto, botones: p.botones.map((b, i) => ({ texto: suyos[i], vale: b.vale })) };
  });
  const mensajes = MENSAJES.map((m): MensajeEntrevista => {
    const texto = t.mensajes[m.id];
    if (texto === undefined) throw new Error(`${idioma}: falta el texto de ${m.id}`);
    return { ...m, texto };
  });
  return { banco, porId: new Map(banco.map((p) => [p.id, p])), mensajes, mensajePorId: new Map(mensajes.map((m) => [m.id, m])) };
}

function armado(idioma: Idioma): Armado {
  let a = ARMADOS.get(idioma);
  if (!a) {
    a = armar(idioma as Exclude<Idioma, 'es-AR'>);
    ARMADOS.set(idioma, a);
  }
  return a;
}

/** Todas las preguntas en ese idioma, en orden de envío (es-AR: BANCO). */
export function bancoDe(idioma: Idioma = IDIOMA_POR_DEFECTO): readonly PreguntaEntrevista[] {
  return armado(idioma).banco;
}

/** Los mensajes fijos en ese idioma (es-AR: MENSAJES). */
export function mensajesDe(idioma: Idioma = IDIOMA_POR_DEFECTO): readonly MensajeEntrevista[] {
  return armado(idioma).mensajes;
}

/** El nombre de cada bloque en ese idioma. */
export function nombresBloqueDe(idioma: Idioma = IDIOMA_POR_DEFECTO): Readonly<Record<number, string>> {
  return idioma === 'es-AR' ? NOMBRES_BLOQUE : TEXTOS_IDIOMA[idioma].nombresBloque;
}

export function preguntaPorId(id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): PreguntaEntrevista | undefined {
  return armado(idioma).porId.get(id);
}

export function mensajePorId(id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): MensajeEntrevista | undefined {
  return armado(idioma).mensajePorId.get(id);
}
