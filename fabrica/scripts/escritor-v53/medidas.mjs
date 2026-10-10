// v5.2: medidas de prosa de uno o más textos (capítulos limpios o libros), para comparar versiones sin juez.
// Uso: node medidas.mjs <nombre>=<archivo.md> [<nombre>=<archivo.md> …]
// Imprime una tabla: oraciones, palabras por oración, % de 10 a 30, más de 40, menos de 6, arranques con "Y", "no" de la entrevista (C32).
import { leer, palabras, sinMarcas } from './lib.mjs';
import { c32 } from './controles.mjs';

const filas = process.argv.slice(2).map((a) => {
  const [nombre, archivo] = a.split(/=(.*)/s);
  const t = sinMarcas(leer(archivo)).split('\n').filter((l) => !l.startsWith('#') && !l.startsWith('>')).join('\n');
  const os = t.replace(/\n+/g, ' \n ').split(/(?<=[.!?…])\s+|\n/).map((s) => s.trim()).filter((s) => palabras(s).length);
  const ls = os.map((o) => palabras(o).length);
  const pct = (f) => `${Math.round((100 * ls.filter(f).length) / ls.length)} %`;
  const pieza = { pieza: 'x', texto: t };
  return [nombre, os.length, (ls.reduce((a, b) => a + b, 0) / ls.length).toFixed(1), pct((n) => n >= 10 && n <= 30), ls.filter((n) => n > 40).length, ls.filter((n) => n < 6).length, os.filter((o) => /^Y\s/.test(o)).length, c32(pieza).length];
});
const cab = ['texto', 'oraciones', 'palabras/oración', 'de 10 a 30', 'más de 40', 'menos de 6', 'arrancan con Y', '"no" (C32)'];
console.log(`| ${cab.join(' | ')} |\n|${cab.map(() => '---').join('|')}|\n${filas.map((f) => `| ${f.join(' | ')} |`).join('\n')}`);
