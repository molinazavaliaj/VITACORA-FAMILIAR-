// Arma entradas/ de la Carpeta desde la entrevista V3 (spec: pieza escritor/material).
// Las respuestas "paso" no llegan al escritor (receta, paso 0); quedan en etiquetas.json.
// Las correcciones de la familia se suman a confirmado.xml (van a todos los pasos dentro de
// <confirmado_por_el_narrador>, que es lo que leen la receta y C14).
import type { Carpeta } from '../carpeta.js';
import type { FichaEntrevista } from '../../v3/entrevista/texto.js';
import { aMaterial, etiquetas, respuestasXml, type EstadoEntrevista, type Fila } from './de-entrevista.js';
import { fichaXml } from './ficha-xml.js';

export type CorreccionFamilia = { texto: string; dudaId?: string };

export function materialACarpeta(c: Carpeta, m: { estado: EstadoEntrevista & { ficha: FichaEntrevista }; confirmadoNarrador?: string[] }): { filas: Fila[]; descartadas: string[] } {
  const filas = aMaterial(m.estado);
  c.escribir('entradas/respuestas.xml', respuestasXml(filas.filter((f) => !f.paso)));
  c.escribir('entradas/etiquetas.json', JSON.stringify(etiquetas(filas), null, 2));
  c.escribir('entradas/ficha.xml', fichaXml(m.estado.ficha));
  if (m.confirmadoNarrador?.length) c.escribir('entradas/confirmado.xml', `(Lo pidió quien narra. Vale como ficha.)\n${m.confirmadoNarrador.map((l) => `- ${l}`).join('\n')}\n`);
  return { filas, descartadas: filas.filter((f) => f.paso).map((f) => f.id) };
}

const ENCABEZADO_FAMILIA = '(Correcciones de la familia antes de escribir el libro. Mandan sobre las respuestas.)';

export function agregarConfirmados(c: Carpeta, correcciones: CorreccionFamilia[]): boolean {
  const lineas = correcciones.map((x) => x.texto.trim().replace(/\s*\n\s*/g, ' ')).filter(Boolean).map((t) => `- ${t}`);
  if (!lineas.length) return false;
  const bloque = `${ENCABEZADO_FAMILIA}\n${lineas.join('\n')}`;
  const antes = c.existe('entradas/confirmado.xml') ? c.leer('entradas/confirmado.xml').trim() : '';
  if (antes.includes(bloque)) return false;
  c.escribir('entradas/confirmado.xml', `${antes ? `${antes}\n\n` : ''}${bloque}\n`);
  return true;
}
