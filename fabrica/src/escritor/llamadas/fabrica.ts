// fabrica/src/escritor/llamadas/fabrica.ts
// Las tres llamadas que no están en la receta (docs/v5/escritor-v55/fabrica.md).
import { Carpeta, leerJSON } from '../carpeta.js';
import type { Disputa } from '../controles/estado.js';
import type { DudaDeDatos } from '../dudas.js';
import { ficha, nombreDePila, salida } from '../lectura.js';
import { esquemaDe, promptFabrica, promptsDe } from '../prompts/index.js';
import { tag, type Llamada } from './armar.js';

/** En qué idioma se le habla a la familia: el de la ficha ("Idioma del libro: …"). */
export function idiomaDeLaFamilia(c: Carpeta): string {
  const m = c.leer('entradas/ficha.xml').match(/^\s*idioma del libro:\s*(.+)$/im);
  const v = (m?.[1] ?? '').toLowerCase();
  if (v.startsWith('catal')) return 'catalán';
  if (v.includes('españa')) return 'castellano de España (de tú)';
  return 'castellano rioplatense';
}

/** Los mismos documentos que la llamada 4-hechos (así la caché los reusa) y la pregunta de la disputa. */
export const llamadaDisputa = (docsHechos: string[], d: Disputa): Llamada => ({
  nombre: `disputa-${d.clave}`,
  docs: docsHechos,
  instr: promptFabrica('### Disputa', { FRASE: d.frase, ID: d.id, CITA: d.cita }),
});

export const llamadaDudas = (c: Carpeta, dudas: DudaDeDatos[]): Llamada => ({
  nombre: 'dudas',
  docs: [tag('ficha', ficha(c)), tag('dudas', JSON.stringify(dudas, null, 1))],
  instr: promptFabrica('### Dudas para la familia', { NOMBRE: nombreDePila(c), IDIOMA: idiomaDeLaFamilia(c) }) + esquemaDe('### Dudas para la familia'),
});

export const llamadaCorreccion = (c: Carpeta): Llamada => ({
  nombre: 'correccion-registro',
  docs: [tag('ficha', ficha(c)), tag('registro', JSON.stringify(leerJSON(c, salida('registro.json')), null, 1))],
  instr: promptsDe('### Corrección del registro')[0] + esquemaDe('### Corrección del registro'),
});
