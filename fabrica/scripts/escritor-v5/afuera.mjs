// v5 (novelista con red), C30: separa el JSON "afuera" del capítulo recién escrito y manda cada respuesta a su destino.
// Uso: node afuera.mjs <carpeta> <n>
//   → salidas/capitulo_NN.md queda solo con el texto; controles/afuera-cap_N.json; pendientes/cap_M.json (para capítulos posteriores).
//   Sale con 3 si dejó afuera más de un tercio de sus respuestas (el workflow lo reescribe una vez).
import path from 'node:path';
import { leer, existe, escribir, leerJSON, salida, archivoDe, idsDeCapitulo, separarAfuera, destinosAfuera } from './lib.mjs';

const [, , dirArg, nArg] = process.argv;
const dir = path.resolve(dirArg), n = Number(nArg);
const archivo = salida(dir, archivoDe(`cap_${n}`));
const { texto, afuera } = separarAfuera(leer(archivo));
escribir(archivo, texto + '\n');
const propios = idsDeCapitulo(dir, n);
const { pendientes, alArreglo } = destinosAfuera(afuera, n);
for (const [cap, ids] of Object.entries(pendientes)) {
  const p = path.join(dir, 'pendientes', `${cap}.json`);
  escribir(p, JSON.stringify([...new Set([...(existe(p) ? leerJSON(p) : []), ...ids])], null, 1));
}
const fuera = afuera.filter((a) => propios.has(a.id)).length;
const demasiado = propios.size > 0 && fuera > propios.size / 3;
escribir(path.join(dir, 'controles', `afuera-cap_${n}.json`), JSON.stringify({ afuera, pendientes, alArreglo, propias: propios.size, fuera, demasiado }, null, 1));
console.log(`cap_${n}: ${fuera} de ${propios.size} respuestas afuera (${Object.entries(pendientes).map(([c, i]) => `${i.length} → ${c}`).join(', ') || 'ninguna a otro capítulo'}; ${alArreglo.length} al arreglo)${demasiado ? ' — MÁS DE UN TERCIO: se reescribe' : ''}`);
process.exit(demasiado ? 3 : 0);
