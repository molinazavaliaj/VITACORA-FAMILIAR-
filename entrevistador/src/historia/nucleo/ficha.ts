// La ficha de «Vitácora de una historia». Sale de la ficha V3
// (src/v3/ficha.ts) con lo que historia usa: el nombre, el género (para
// {{o/a}}) y el tema. La V3 trae además la vida entera (padres, hermanos,
// parejas, hijos, migración, oficios…) para decidir los bloques de una
// biografía; acá no se usa, así que no se copia (Task 1.1 del plan,
// docs/superpowers/plans/2026-10-21-vitacora-de-una-historia.md).

import type { TemaHistoria } from './entrevista/temas.js';

export type Genero = 'varon' | 'mujer' | 'otro';

export type FichaHistoria = {
  /** Cómo le dicen: es lo que va en {{nombre}}. */
  nombre: string;
  genero: Genero;
  /** Si género = otro: cómo prefiere que le hablen. */
  formaTrato?: 'masculino' | 'femenino';
  /** La clave del tema (docs/historia/temas.md). Con «otra», o si lo eligió el narrador en TEMA-ABIERTO, va con `temaLibre`. */
  tema: TemaHistoria;
  /** La historia en sus palabras (el campo libre de «Otra historia» o lo que contestó en TEMA-ABIERTO). */
  temaLibre?: string;
};
