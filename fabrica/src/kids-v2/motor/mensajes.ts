// Arma los mensajes que salen: textos del banco con género y variables, a qué
// número van, con qué botones y si son plantilla. Nunca escribe un texto.

import { fijo, type IdMensaje } from '../banco.js';
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

export function fijoA(e: Estado, id: IdMensaje, o: { variables?: string[]; paraPadre?: boolean } = {}): Mensaje {
  const m = fijo(id);
  const vars = o.variables ?? [];
  return { a: destino(e, o.paraPadre), id, texto: render(e, m.texto, vars), botones: [...m.botones], plantilla: m.plantilla ? { nombre: m.plantilla, variables: vars } : null };
}

export function preguntaMsg(e: Estado, p: Pregunta): Mensaje {
  return { a: destino(e), id: p.id, texto: render(e, textoSegunTemas(p.id, p.texto, e.ficha.temasSacados)), botones: [...p.ramas.map((r) => r.boton), p.botonPaso], plantilla: null };
}

/** El mensaje de una rama (paso 0, 1…): K12-R2, K12-R2-2. Lleva el botón para pasar. */
export function ramaMsg(e: Estado, p: Pregunta, ri: number, paso: number): Mensaje {
  const accion = p.ramas[ri].accion;
  if (accion.tipo !== 'preguntar') throw new Error(`${p.id}: la rama ${p.ramas[ri].boton} no pregunta`);
  const id = `${p.id}-R${ri + 1}${paso > 0 ? `-${paso + 1}` : ''}`;
  return { a: destino(e), id, texto: render(e, accion.pasos[paso]), botones: [p.botonPaso], plantilla: null };
}

export function opMsg(e: Estado, p: Pregunta): Mensaje {
  if (!p.op) throw new Error(`${p.id} no tiene otra puerta`);
  return { a: destino(e), id: `${p.id}-OP`, texto: render(e, p.op.texto), botones: ['Paso'], plantilla: null };
}

export function fotoMsg(e: Estado, f: Foto): Mensaje {
  return { a: destino(e), id: `${f.de}-FOTO`, texto: render(e, f.texto), botones: [...f.botones], plantilla: null };
}

export function extraMsg(e: Estado, x: Extra): Mensaje {
  return { a: destino(e), id: x.id, texto: render(e, x.texto), botones: x.foto ? ['No tengo'] : ['Paso'], plantilla: null };
}

/**
 * La pregunta del padre va tal cual la escribió (sin género ni variables); antes, la línea, salvo "sin decir que es mía".
 * En la línea, {{1}} es quién la manda (`quien` de la pregunta) o, si no lo dijo, quién se lo regala.
 */
export function padreMsgs(e: Estado, item: Extract<ItemGuion, { tipo: 'padre' }>, conLinea = item.conLinea): Mensaje[] {
  const ms: Mensaje[] = [];
  const quien = item.quien ?? e.ficha.quienRegala;
  if (conLinea) ms.push(fijoA(e, esPlural(quien) ? 'PADRE-PREG-LINEA-PL' : 'PADRE-PREG-LINEA', { variables: [quien] }));
  ms.push({ a: destino(e), id: item.clave, texto: item.texto, botones: ['Esta la paso'], plantilla: null });
  return ms;
}

/** PREG-NUEVA-CHICO (canal A) o PREG-NUEVA-PADRE (canal B). */
export function avisoPreguntaNueva(e: Estado): Mensaje {
  return e.ficha.canal === 'A' ? fijoA(e, 'PREG-NUEVA-CHICO', { variables: variables.apodo(e.ficha) }) : fijoA(e, 'PREG-NUEVA-PADRE', { variables: variables.padre(e.ficha) });
}
