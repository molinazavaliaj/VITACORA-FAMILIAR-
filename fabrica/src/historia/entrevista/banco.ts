// El banco de la entrevista de historia, tipado. Copia de
// src/v3/entrevista/banco.ts con los json de historia: `banco.json` lo genera
// `scripts/historia-json.ts` desde docs/historia/banco.md (la fuente), y
// banco-ca.json y banco-es-ES.json desde docs/historia/idiomas/ (solo los
// textos, por ID); un test chequea que estén al día.
//
// `bancoDe(idioma)` es el banco ENTERO (todos los temas y todas las
// variantes): sirve para buscar por ID. Lo que recibe un narrador es
// `bancoHistoria(tema, idioma, { temaAbierto })`: la parte común y las de su
// tema, con las variantes en su lugar.

import bancoJson from './banco.json' with { type: 'json' };
import bancoCaJson from './banco-ca.json' with { type: 'json' };
import bancoEsEsJson from './banco-es-ES.json' with { type: 'json' };
import temasJson from './temas.json' with { type: 'json' };
import type { BancoEntrevista, MensajeEntrevista, PreguntaEntrevista } from './banco-md.js';
import type { TextosIdioma } from './banco-idioma-md.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';
import { bancoDeTema, type OpcionesTema, type TemaHistoria } from './temas.js';
import type { TextosTemas } from './temas-md.js';

export type { BancoEntrevista, MensajeEntrevista, PreguntaEntrevista, Condicion, CondicionSimple, Parte, Clase, Boton, ValeBoton, TemaPregunta } from './banco-md.js';
export { condicionesDe } from './banco-md.js';
export type { Idioma } from './idioma.js';

const DATOS = bancoJson as BancoEntrevista;

/** Todas las preguntas del md (todos los temas y las variantes), en el orden del md. */
export const BANCO: readonly PreguntaEntrevista[] = DATOS.preguntas;

/** Arranque y mensajes fijos (BIEN-H, COMO, PR-H1, FOTO-H, FIN-H, M1, M3.1…). */
export const MENSAJES: readonly MensajeEntrevista[] = DATOS.mensajes;

/** Nombre de cada bloque, como en el md ("El antes"). Los md de idiomas no los traen. */
export const NOMBRES_BLOQUE: Readonly<Record<number, string>> = DATOS.nombresBloque;

const POR_ID = new Map(BANCO.map((p) => [p.id, p]));
const MENSAJE_POR_ID = new Map(MENSAJES.map((m) => [m.id, m]));

/** Los idiomas cuyos textos no son los de banco.md. */
export type OtroIdioma = Exclude<Idioma, 'es-AR'>;

/** Los textos de cada idioma que no es el de banco.md. */
export const TEXTOS_IDIOMA: Readonly<Record<OtroIdioma, TextosIdioma>> = { ca: bancoCaJson as TextosIdioma, 'es-ES': bancoEsEsJson as TextosIdioma };

/**
 * Los textos de ese idioma, si está lo que el código usa suelto (la
 * repregunta del cazador y su botón). Si falta, error: mejor frenar que
 * mandar castellano rioplatense.
 */
export function textosDe(idioma: OtroIdioma): TextosIdioma {
  return comprobarTextos(idioma, TEXTOS_IDIOMA[idioma]);
}

/** El control de `textosDe`, con los textos que se le pasan (para los tests). */
export function comprobarTextos(idioma: OtroIdioma, t: TextosIdioma | undefined): TextosIdioma {
  if (!t || !t.repregunta.mensaje || !t.repregunta.boton) {
    throw new Error(`${idioma}: faltan los textos (docs/historia/idiomas/banco-${idioma}.md; después, cd fabrica && npx tsx scripts/historia-json.ts).`);
  }
  return t;
}

export type Armado = {
  banco: BancoEntrevista;
  porId: ReadonlyMap<string, PreguntaEntrevista>;
  mensajePorId: ReadonlyMap<string, MensajeEntrevista>;
};

const ARMADOS = new Map<Idioma, Armado>([[IDIOMA_POR_DEFECTO, { banco: DATOS, porId: POR_ID, mensajePorId: MENSAJE_POR_ID }]]);

/** `armar` con los textos que se le pasan (los tests prueban que con textos incompletos frena). */
export function armarConTextos(idioma: OtroIdioma, t: TextosIdioma): Armado {
  const preguntas = BANCO.map((p): PreguntaEntrevista => {
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
  const banco: BancoEntrevista = { preguntas, mensajes, nombresBloque: DATOS.nombresBloque };
  return { banco, porId: new Map(preguntas.map((p) => [p.id, p])), mensajePorId: new Map(mensajes.map((m) => [m.id, m])) };
}

function armado(idioma: Idioma): Armado {
  let a = ARMADOS.get(idioma);
  if (!a) {
    a = armarConTextos(idioma as OtroIdioma, textosDe(idioma as OtroIdioma));
    ARMADOS.set(idioma, a);
  }
  return a;
}

/** El banco entero en ese idioma (todos los temas y variantes; es-AR: el de banco.md). */
export function bancoDe(idioma: Idioma = IDIOMA_POR_DEFECTO): BancoEntrevista {
  return armado(idioma).banco;
}

/** El banco de un narrador: la parte común y las de su tema, con las variantes en su lugar (temas.ts). */
export function bancoHistoria(tema: TemaHistoria, idioma: Idioma = IDIOMA_POR_DEFECTO, opciones: OpcionesTema = {}): BancoEntrevista {
  return bancoDeTema(bancoDe(idioma), tema, opciones);
}

/** Los mensajes fijos en ese idioma. */
export function mensajesDe(idioma: Idioma = IDIOMA_POR_DEFECTO): readonly MensajeEntrevista[] {
  return armado(idioma).banco.mensajes;
}

export function preguntaPorId(id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): PreguntaEntrevista | undefined {
  return armado(idioma).porId.get(id);
}

export function mensajePorId(id: string, idioma: Idioma = IDIOMA_POR_DEFECTO): MensajeEntrevista | undefined {
  return armado(idioma).mensajePorId.get(id);
}

/** Los textos de docs/historia/temas.md (temas.json). */
export const TEXTOS_TEMAS: Readonly<TextosTemas> = temasJson as TextosTemas;

/**
 * Cómo se nombra la historia en las preguntas ({{historia}}; banco.md,
 * "Notación"): la etiqueta de temas.md en minúscula inicial («sobre irse a
 * vivir lejos», «sobre el primer hijo»).
 */
export function nombreDelTema(tema: TemaHistoria, idioma: Idioma = IDIOMA_POR_DEFECTO): string {
  const etiqueta = TEXTOS_TEMAS[tema]?.[idioma]?.etiqueta;
  if (!etiqueta) throw new Error(`historia: falta la etiqueta de «${tema}» en ${idioma} (docs/historia/temas.md; después, cd fabrica && npx tsx scripts/historia-json.ts).`);
  return etiqueta.charAt(0).toLocaleLowerCase(idioma) + etiqueta.slice(1);
}
