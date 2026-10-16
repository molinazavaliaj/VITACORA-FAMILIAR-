// Arma los mensajes que salen: textos del banco con género y variables, a qué
// número van, con qué botones y si son plantilla. Nunca escribe un texto.
// Todo sale del banco del idioma de la ficha (bancoDe: mismo ID, textos y
// botones del idioma); las reglas que llaman acá pasan lo de banco.md.

import { botonEn, BOTON_PASO, extraEn, fijoEn, preguntaEn, type IdMensaje } from '../banco.js';
import { idiomaDe } from '../idioma.js';
import { textoSegunTemas, type Ficha, type ItemGuion } from '../compra.js';
import { conGenero, esPlural, llenar, primerNombre, quedanMarcas } from '../texto.js';
import type { Extra, Foto, Pregunta } from '../tipos.js';
import type { Destino, Estado, Mensaje } from './tipos.js';

/** En canal B, lo del chico también va al número del padre. */
export function destino(e: Estado, paraPadre = false): Destino {
  return paraPadre || e.ficha.canal === 'B' ? 'padre' : 'chico';
}

export function render(e: Estado, texto: string, variables: readonly string[] = []): string {
  const t = llenar(conGenero(texto, e.ficha.genero), variables);
  if (quedanMarcas(t)) throw new Error(`Quedó una marca sin llenar: "${t.slice(0, 60)}…"`);
  return t;
}

/** Variables de mensajes.md: al chico {{1}} cómo le dicen, {{2}} quién se lo regala; al padre {{1}} su primer nombre, {{2}} cómo le dicen (#31). */
export const variables = {
  chico: (f: Ficha) => [f.apodo, f.quienRegala],
  padre: (f: Ficha) => [primerNombre(f.nombrePadre), f.apodo],
  avisoPadre: (f: Ficha) => [primerNombre(f.nombrePadre), f.apodo, f.linkPanel],
  apodo: (f: Ficha) => [f.apodo],
};

const idioma = (e: Estado) => idiomaDe(e.ficha);

/** Los botones fijos que no tienen ID propio en el banco (el de pasar, el [No tengo] de las extras con foto), en el idioma del chico. */
const boton = (e: Estado, canonico: string) => botonEn(idioma(e), canonico);

export function fijoA(e: Estado, id: IdMensaje, o: { variables?: string[]; paraPadre?: boolean } = {}): Mensaje {
  const m = fijoEn(id, idioma(e));
  const vars = o.variables ?? [];
  return { a: destino(e, o.paraPadre), id, texto: render(e, m.texto, vars), botones: [...m.botones], plantilla: m.plantilla ? { nombre: m.plantilla, variables: vars } : null };
}

export function preguntaMsg(e: Estado, p: Pregunta): Mensaje {
  const q = preguntaEn(p.id, idioma(e));
  return { a: destino(e), id: p.id, texto: render(e, textoSegunTemas(p.id, q.texto, e.ficha.temasSacados, idioma(e))), botones: [...q.ramas.map((r) => r.boton), q.botonPaso], plantilla: null };
}

/** El ID de la rama `ri` (0, 1…) de una principal, en su paso 0, 1…: K12-R2, K12-R2-2. */
export const idRama = (clave: string, ri: number, paso = 0) => `${clave}-R${ri + 1}${paso > 0 ? `-${paso + 1}` : ''}`;

/** El mensaje de una rama (paso 0, 1…): K12-R2, K12-R2-2. Lleva el botón para pasar. */
export function ramaMsg(e: Estado, p: Pregunta, ri: number, paso: number): Mensaje {
  const q = preguntaEn(p.id, idioma(e));
  const accion = q.ramas[ri].accion;
  if (accion.tipo !== 'preguntar') throw new Error(`${p.id}: la rama ${p.ramas[ri].boton} no pregunta`);
  const id = idRama(p.id, ri, paso);
  return { a: destino(e), id, texto: render(e, accion.pasos[paso]), botones: [q.botonPaso], plantilla: null };
}

export function opMsg(e: Estado, p: Pregunta): Mensaje {
  const op = preguntaEn(p.id, idioma(e)).op;
  if (!op) throw new Error(`${p.id} no tiene otra puerta`);
  return { a: destino(e), id: `${p.id}-OP`, texto: render(e, op.texto), botones: [boton(e, BOTON_PASO)], plantilla: null };
}

/** La foto pegada de `f.de` (aunque salga mudada en otra principal): su texto y sus botones, en el idioma del chico. */
export function fotoMsg(e: Estado, f: Foto): Mensaje {
  const g = preguntaEn(f.de, idioma(e)).foto;
  if (!g) throw new Error(`${f.de} no tiene foto pegada`);
  return { a: destino(e), id: `${f.de}-FOTO`, texto: render(e, g.texto), botones: [...g.botones], plantilla: null };
}

export function extraMsg(e: Estado, x: Extra): Mensaje {
  return { a: destino(e), id: x.id, texto: render(e, extraEn(x.id, idioma(e)).texto), botones: [boton(e, x.foto ? 'No tengo' : BOTON_PASO)], plantilla: null };
}

/**
 * La pregunta del padre va tal cual la escribió (sin género ni variables); antes, la línea, salvo "sin decir que es mía".
 * En la línea, {{1}} es quién la manda (`quien` de la pregunta) o, si no lo dijo, quién se lo regala.
 */
export function padreMsgs(e: Estado, item: Extract<ItemGuion, { tipo: 'padre' }>, conLinea = item.conLinea): Mensaje[] {
  const ms: Mensaje[] = [];
  const quien = item.quien ?? e.ficha.quienRegala;
  if (conLinea) ms.push(fijoA(e, esPlural(quien) ? 'PADRE-PREG-LINEA-PL' : 'PADRE-PREG-LINEA', { variables: [quien] }));
  ms.push({ a: destino(e), id: item.clave, texto: item.texto, botones: [boton(e, 'Esta la paso')], plantilla: null });
  return ms;
}

/** PREG-NUEVA-CHICO (canal A) o PREG-NUEVA-PADRE (canal B). */
export function avisoPreguntaNueva(e: Estado): Mensaje {
  return e.ficha.canal === 'A' ? fijoA(e, 'PREG-NUEVA-CHICO', { variables: variables.apodo(e.ficha) }) : fijoA(e, 'PREG-NUEVA-PADRE', { variables: variables.padre(e.ficha) });
}
