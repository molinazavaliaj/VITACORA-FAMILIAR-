// Paso 7 de la receta: informe.md para Naza (y para quien ajuste la entrevista). Lo arma el código con lo que dejó el circuito.
// Uso: node informe.mjs <carpeta>
// Lee: plan.faltantes, controles/piezas-1.json (antes del arreglo) y piezas.json (después), c9-*.json, cotejo-descartado.json,
// repaso.json, arreglos/disputa-<clave>.json ({"respalda": bool, "por_que": ""}) y arreglos/problemas-sus_frases.json.
import path from 'node:path';
import { readdirSync } from 'node:fs';
import { leer, existe, leerJSON, escribir, salida } from './lib.mjs';
import { estado } from './estado.mjs';

const recorte = (s, n = 140) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t; };
const celda = (s) => recorte(s).replace(/\|/g, '/');

export function informe(dir) {
  const ctl = (f) => path.join(dir, 'controles', f), arr = (f) => path.join(dir, 'arreglos', f);
  const leerSi = (p, def) => (existe(p) ? leerJSON(p) : def);
  const plan = leerJSON(salida(dir, 'plan.json'));
  const L = ['# Informe del escritor', ''];

  const falt = plan.faltantes || [];
  L.push(`## Lo que el material no trae (faltantes del plan): ${falt.length}`, '');
  if (falt.length) { L.push('| Qué | Dónde |', '|---|---|'); for (const f of falt) L.push(`| ${celda(f.que)} | ${celda(f.donde)} |`); } else L.push('Ninguno.');

  const antes = leerSi(ctl('piezas-1.json'), []), despues = leerSi(ctl('piezas.json'), []);
  const porPieza = (xs) => xs.reduce((m, x) => ({ ...m, [x.pieza]: (m[x.pieza] || 0) + 1 }), {});
  const a = porPieza(antes), d = porPieza(despues.filter((x) => x.control !== 'C24'));
  L.push('', '## Controles del código, antes y después de la única ronda', '', '| Pieza | Antes | Después |', '|---|---|---|');
  for (const p of [...new Set([...Object.keys(a), ...Object.keys(d)])]) L.push(`| ${p} | ${a[p] || 0} | ${d[p] || 0} |`);
  const abiertos = despues.filter((x) => x.control !== 'C24');
  if (abiertos.length) { L.push('', '**Abiertos después del arreglo** (no hay segunda ronda):', '', '| Pieza | Control | Qué | Frase |', '|---|---|---|---|'); for (const x of abiertos) L.push(`| ${x.pieza} | ${x.control} | ${celda(x.que)} | ${celda(x.frase)} |`); }

  const c24 = despues.filter((x) => x.control === 'C24'), desc = leerSi(ctl('cotejo-descartado.json'), []);
  L.push('', `## Lo que el cotejo encontró y no entró (C24): ${c24.length}`, '');
  for (const x of c24) L.push(`- ${x.pieza}: ${x.que}`);
  if (desc.length) { L.push('', `Descartado del cotejo (id inexistente o frase no textual): ${desc.length}`); for (const x of desc) L.push(`- ${x.id}: «${recorte(x.frase)}»`); }

  const c9s = existe(path.join(dir, 'controles')) ? readdirSync(path.join(dir, 'controles')).filter((f) => /^c9-.+\.json$/.test(f)) : [];
  L.push('', '## Arreglo (C9)', '', '| Pieza | Siguen | Disputas | Párrafos sin problema idénticos |', '|---|---|---|---|');
  for (const f of c9s) { const r = leerJSON(ctl(f)); L.push(`| ${f.replace(/^c9-|\.json$/g, '')} | ${r.abiertos.filter((x) => x.estado === 'sigue').length} | ${r.abiertos.filter((x) => x.estado === 'disputa').length} | ${r.identicos} %${r.identicos < 70 ? ' (deriva)' : ''} |`); }
  const siguen = c9s.flatMap((f) => leerJSON(ctl(f)).abiertos.filter((x) => x.estado === 'sigue').map((x) => ({ ...x, pieza: f.replace(/^c9-|\.json$/g, '') })));
  if (siguen.length) { L.push('', 'Marcados "cambiado" que siguen en el texto:'); for (const x of siguen) L.push(`- ${x.pieza} #${x.n} (${x.tipo}): «${recorte(x.frase)}»`); }

  const disp = [...estado(dir, 'disputas').disputas, ...estado(dir, 'repaso').disputas];
  L.push('', `## Disputas: ${disp.length}`, '');
  if (disp.length) {
    L.push('| Pieza | Origen | Frase | Respuesta | Verificador |', '|---|---|---|---|---|');
    for (const x of disp) {
      const r = leerSi(arr(`disputa-${x.clave}.json`), null);
      const v = !r ? 'sin decidir' : r.respalda ? 'respalda' : `no respalda: ${r.por_que || ''}`;
      const origen = x.origen === 'oscila' ? 'C26 oscila' : x.origen === 'contradice' ? 'contradice decisión' : 'escritor (C9)';
      L.push(`| ${x.pieza} | ${origen} | ${celda(x.frase)} | ${x.id} «${celda(x.cita)}» | ${celda(v)} |`);
    }
    L.push('', 'Lectura: en "escritor (C9)", "respalda" cierra el problema; en "C26 oscila", "respalda" significa que el verificador oscila (va acá con las dos decisiones), "no respalda" lo cierra.');
  }

  const rep = leerSi(ctl('repaso.json'), null);
  if (rep) {
    L.push('', `## Repaso de hechos sobre las piezas arregladas: ${rep.nuevos.length} nuevos (abiertos)`, '');
    for (const x of rep.nuevos) L.push(`- ${x.pieza} (${x.tipo}): «${recorte(x.frase)}» → ${recorte(x.correccion)}`);
  }

  const sf = leerSi(arr('problemas-sus_frases.json'), []);
  if (sf.length) { L.push('', `## Sus frases (no se arreglan: van acá): ${sf.length}`, ''); for (const x of sf) L.push(`- ${x.origen} (${x.tipo}): ${recorte(x.que)} «${recorte(x.frase)}»`); }

  const libro = existe(path.join(dir, 'libro.md')) ? leer(path.join(dir, 'libro.md')) : '';
  if (libro) L.push('', `Largo del libro: ${libro.split(/\s+/).filter(Boolean).length} palabras.`);
  return L.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('informe.mjs')) {
  const dir = path.resolve(process.argv[2]);
  escribir(path.join(dir, 'informe.md'), informe(dir));
  console.log(`informe.md listo (${path.join(dir, 'informe.md')})`);
}
