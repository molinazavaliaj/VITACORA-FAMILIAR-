// Arma entradas/ de la Carpeta desde la entrevista V3 (spec: pieza escritor/material).
// Las respuestas "paso" no llegan al escritor (receta, paso 0); quedan en etiquetas.json.
// Las correcciones de la familia se suman a confirmado.xml (van a todos los pasos dentro de
// <confirmado_por_el_narrador>, que es lo que leen la receta y C14). Cada línea de la familia va en una sola
// línea (C14 cuenta las líneas "- ") y sin < ni > (no puede cerrar la etiqueta). La respuesta a una duda va con su
// pregunta: suelta, un «13» o un «OMAR» no dice de qué habla (libro de Juan Domingo, 01/11: el modelo barato dejó
// afuera 11 de 25 respuestas, falló C14 y Opus rehízo registro y plan, USD 2,26 de más).
import { parseJSONTolerante, type Carpeta } from '../carpeta.js';
import { salida } from '../lectura.js';
import { aMaterial, esc, etiquetas, respuestasXml, type EstadoEntrevista, type Fila } from './de-entrevista.js';
import { fichaXml, type FichaParaXml } from './ficha-xml.js';

export type CorreccionFamilia = { texto: string; dudaId?: string };

/** Una línea de la familia para confirmado.xml: sin saltos de línea y sin < ni >. */
const lineaFamilia = (t: string): string => esc(t.trim().replace(/\s*\n\s*/g, ' '));

export function materialACarpeta(c: Carpeta, m: { estado: EstadoEntrevista & { ficha: FichaParaXml }; confirmadoNarrador?: string[] }): { filas: Fila[]; descartadas: string[] } {
  const filas = aMaterial(m.estado);
  c.escribir('entradas/respuestas.xml', respuestasXml(filas.filter((f) => !f.paso)));
  c.escribir('entradas/etiquetas.json', JSON.stringify(etiquetas(filas), null, 2));
  c.escribir('entradas/ficha.xml', fichaXml(m.estado.ficha));
  const confirmados = (m.confirmadoNarrador ?? []).map(lineaFamilia).filter(Boolean);
  if (confirmados.length) c.escribir('entradas/confirmado.xml', `(Lo pidió quien narra. Vale como ficha.)\n${confirmados.map((l) => `- ${l}`).join('\n')}\n`);
  return { filas, descartadas: filas.filter((f) => f.paso).map((f) => f.id) };
}

const ENCABEZADO_FAMILIA = '(Correcciones de la familia antes de escribir el libro. Mandan sobre las respuestas.)';

/** Qué preguntaba cada duda, de la salida de la Etapa A. Sin el archivo o roto, ninguna: la respuesta va sola. */
function preguntasDeLasDudas(c: Carpeta): Map<string, string> {
  const archivo = salida('dudas-familia.json');
  if (!c.existe(archivo)) return new Map();
  try {
    const dudas = (parseJSONTolerante(c.leer(archivo)) as { dudas?: { id?: unknown; pregunta?: unknown }[] }).dudas ?? [];
    return new Map(dudas.flatMap((d) => (typeof d.id === 'string' && typeof d.pregunta === 'string' && d.pregunta.trim() ? [[d.id, lineaFamilia(d.pregunta)] as [string, string]] : [])));
  } catch {
    return new Map();
  }
}

export function agregarConfirmados(c: Carpeta, correcciones: CorreccionFamilia[]): boolean {
  const preguntas = preguntasDeLasDudas(c);
  const lineas = correcciones.flatMap((x) => {
    const t = lineaFamilia(x.texto);
    if (!t) return [];
    const pregunta = x.dudaId ? preguntas.get(x.dudaId) : undefined;
    return [pregunta ? `- Pregunta: ${pregunta} Respuesta: ${t}` : `- ${t}`];
  });
  if (!lineas.length) return false;
  const bloque = `${ENCABEZADO_FAMILIA}\n${lineas.join('\n')}`;
  const antes = c.existe('entradas/confirmado.xml') ? c.leer('entradas/confirmado.xml').trim() : '';
  if (antes.includes(bloque)) return false;
  c.escribir('entradas/confirmado.xml', `${antes ? `${antes}\n\n` : ''}${bloque}\n`);
  return true;
}
