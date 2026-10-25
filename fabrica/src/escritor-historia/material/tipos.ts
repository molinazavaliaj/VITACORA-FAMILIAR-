// El material del escritor de historia: lo que sale de la fila de `historias` (y de `respuestas`) ya limpio de lo
// reservado y de lo sacado, con el formato del estado del entrevistador (entrevistador/src/historia/tipos.ts). Puro.
import type { PreguntaPanel } from '../../historia/entrevista/flujo.js';
import type { Idioma } from '../../historia/entrevista/idioma.js';
import type { TemaHistoria } from '../../historia/entrevista/temas.js';
import type { Genero } from '../../historia/ficha.js';

/** Un globo de la charla, como lo guarda el entrevistador (el mismo formato que V3). */
export type GloboHistoria =
  | { de: 'bio'; partes: { id: string; texto: string }[]; botones?: string[] }
  | { de: 'persona'; pregunta: string; texto: string; boton?: string }
  | { de: 'bloque'; bloque: number; nombre: string };

/** `historias.ficha` (entrevistador/src/historia/tipos.ts, FichaFila). */
export type FichaHistoriaFila = {
  nombre: string;
  genero: Genero;
  formaTrato?: 'masculino' | 'femenino';
  quienRegala?: string;
  tema: TemaHistoria;
  temaLibre?: string;
};

/** La entrevista de una historia, lista para pasar a la Carpeta. */
export type EntrevistaHistoria = {
  ficha: FichaHistoriaFila;
  idioma: Idioma;
  /** [clave, texto] en el orden en que llegó, sin lo reservado ni lo sacado. */
  respuestas: [string, string][];
  /** Sin los globos 'persona' (lo que dijo): solo para saber qué se le mandó. */
  charla: GloboHistoria[];
  /** Las preguntas de quien regala, en el orden de la compra (PR-H1, PR-H2, PR-H3). */
  propias: string[];
  /** Las preguntas sumadas desde el panel (F:<id>). */
  panel: PreguntaPanel[];
};

/** El tramo de la historia de cada pregunta del banco (receta, sección 2). */
export type Tramo = 'antes' | 'comienzo' | 'tema' | 'dificil' | 'giro' | 'despues' | 'cierre';
export const TRAMOS: readonly Tramo[] = ['antes', 'comienzo', 'tema', 'dificil', 'giro', 'despues', 'cierre'];

/** Una respuesta del material (R01…), como en Familiar más el tramo. */
export type FilaHistoria = {
  id: string;
  clave: string;
  pregunta: string;
  texto: string;
  origen: string;
  tramo?: Tramo;
  paso: boolean;
};

/** entradas/material.json: lo que el escritor y la producción leen sin volver a la base. */
export type MaterialHistoria = {
  nombre: string;
  idioma: Idioma;
  tema: TemaHistoria;
  /** La etiqueta del tema en el idioma del libro (docs/historia/temas.md). */
  etiqueta: string;
  /** La historia en sus palabras: la de la compra, la que eligió en TEMA-ABIERTO o nada. */
  temaLibre?: string;
  quienRegala?: string;
  filas: FilaHistoria[];
};
