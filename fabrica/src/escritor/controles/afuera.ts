// C30 (v5, novelista con red): fabrica/scripts/escritor-v55/afuera.mjs sobre la Carpeta. En vez de
// salir con 3 devuelve `codigo: 3`: el orquestador reescribe el capítulo una vez.
import type { Carpeta } from '../carpeta.js';
import { leerJSON } from '../carpeta.js';
import { idsDeCapitulo, salida } from '../lectura.js';
import { archivoDe, destinosAfuera, separarAfuera } from '../texto.js';

export function controlarAfuera(c: Carpeta, n: number): { codigo: 0 | 3; resumen: string } {
  const archivo = salida(archivoDe(`cap_${n}`));
  const { texto, afuera } = separarAfuera(c.leer(archivo));
  c.escribir(archivo, texto + '\n');
  const propios = idsDeCapitulo(c, n);
  const { pendientes, alArreglo, noEntra } = destinosAfuera(afuera, n);
  for (const [cap, ids] of Object.entries(pendientes)) {
    const p = `pendientes/${cap}.json`;
    c.escribir(p, JSON.stringify([...new Set([...(c.existe(p) ? leerJSON(c, p) : []), ...ids])], null, 1));
  }
  // v5.2: los "no" de la entrevista (no_entra) no cuentan para el tercio.
  const fuera = afuera.filter((a) => propios.has(a.id) && a.a_donde !== 'no_entra').length;
  const demasiado = propios.size > 0 && fuera > propios.size / 3;
  c.escribir(`controles/afuera-cap_${n}.json`, JSON.stringify({ afuera, pendientes, alArreglo, noEntra, propias: propios.size, fuera, demasiado }, null, 1));
  const resumen = `cap_${n}: ${fuera} de ${propios.size} respuestas afuera (${Object.entries(pendientes).map(([cp, i]) => `${i.length} → ${cp}`).join(', ') || 'ninguna a otro capítulo'}; ${alArreglo.length} al arreglo; ${noEntra.length} no entran: ${noEntra.join(', ') || '-'})${demasiado ? ' — MÁS DE UN TERCIO: se reescribe' : ''}`;
  return { codigo: demasiado ? 3 : 0, resumen };
}
