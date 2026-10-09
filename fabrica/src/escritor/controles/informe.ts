// Paso 7 de la receta: el informe interno (para Naza), fabrica/scripts/escritor-v55/informe.mjs sobre la Carpeta.
// Sin lectura final (decisión del 06/10): si no está salidas/lectura-final.json, esa sección no sale (igual que el original).
import { Carpeta, leerJSON } from '../carpeta.js';
import { salida } from '../lectura.js';
import type { Json } from '../tipos.js';
import { estado } from './estado.js';

const recorte = (s: unknown, n = 140): string => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n)}…` : t; };
const celda = (s: unknown): string => recorte(s).replace(/\|/g, '/');

export function informe(c: Carpeta): string {
  const ctl = (f: string): string => `controles/${f}`, arr = (f: string): string => `arreglos/${f}`;
  const leerSi = (p: string, def: Json): Json => (c.existe(p) ? leerJSON(c, p) : def);
  const plan = leerJSON(c, salida('plan.json'));
  const L = ['# Informe del escritor', ''];

  const falt = plan.faltantes || [];
  L.push(`## Lo que el material no trae (faltantes del plan): ${falt.length}`, '');
  if (falt.length) { L.push('| Qué | Dónde |', '|---|---|'); for (const f of falt) L.push(`| ${celda(f.que)} | ${celda(f.donde)} |`); } else L.push('Ninguno.');

  const antes = leerSi(ctl('piezas-1.json'), []), despues = leerSi(ctl('piezas.json'), []);
  const porPieza = (xs: Json[]) => xs.reduce((m: Json, x: Json) => ({ ...m, [x.pieza]: (m[x.pieza] || 0) + 1 }), {});
  const a = porPieza(antes), d = porPieza(despues.filter((x: Json) => x.control !== 'C24'));
  L.push('', '## Controles del código, antes y después de la única ronda', '', '| Pieza | Antes | Después |', '|---|---|---|');
  for (const p of [...new Set([...Object.keys(a), ...Object.keys(d)])]) L.push(`| ${p} | ${a[p] || 0} | ${d[p] || 0} |`);
  const abiertos = despues.filter((x: Json) => x.control !== 'C24');
  if (abiertos.length) { L.push('', '**Abiertos después del arreglo** (no hay segunda ronda):', '', '| Pieza | Control | Qué | Frase |', '|---|---|---|---|'); for (const x of abiertos) L.push(`| ${x.pieza} | ${x.control} | ${celda(x.que)} | ${celda(x.frase)} |`); }

  const c24 = despues.filter((x: Json) => x.control === 'C24'), desc = leerSi(ctl('cotejo-descartado.json'), []);
  L.push('', `## Lo que el cotejo encontró y no entró (C24): ${c24.length}`, '');
  for (const x of c24) L.push(`- ${x.pieza}: ${x.que}`);
  if (desc.length) { L.push('', `Descartado del cotejo (id inexistente o frase no textual): ${desc.length}`); for (const x of desc) L.push(`- ${x.id}: «${recorte(x.frase)}»`); }

  const c9s = c.existeCarpeta('controles') ? c.listar('controles').filter((f) => /^c9-.+\.json$/.test(f)) : [];
  // receta v3.1: cambios cuyo "antes" no estaba tal cual en la pieza (no se aplicaron; el problema queda abierto).
  const noAplicados = (pieza: string): Json[] => {
    const r = arr(`respuesta-${pieza}.txt`);
    if (!c.existe(r)) return [];
    const t = c.leer(r), i = t.lastIndexOf('\n---\n');
    try { return (JSON.parse(t.slice(i + 5)).cambios || []).filter((x: Json) => x.resultado === 'no_aplicado'); } catch { return []; }
  };
  L.push('', '## Arreglo (C9)', '', '| Pieza | Siguen | Disputas | No aplicados | Párrafos sin problema idénticos |', '|---|---|---|---|---|');
  for (const f of c9s) { const r = leerJSON(c, ctl(f)), p = f.replace(/^c9-|\.json$/g, ''); L.push(`| ${p} | ${r.abiertos.filter((x: Json) => x.estado === 'sigue').length} | ${r.abiertos.filter((x: Json) => x.estado === 'disputa').length} | ${noAplicados(p).length} | ${r.identicos} %${r.identicos < 70 ? ' (deriva)' : ''} |`); }
  const siguen = c9s.flatMap((f) => leerJSON(c, ctl(f)).abiertos.filter((x: Json) => x.estado === 'sigue').map((x: Json) => ({ ...x, pieza: f.replace(/^c9-|\.json$/g, '') })));
  if (siguen.length) { L.push('', 'Marcados "cambiado" que siguen en el texto:'); for (const x of siguen) L.push(`- ${x.pieza} #${x.n} (${x.tipo}): «${recorte(x.frase)}»`); }

  const disp = [...estado(c, 'disputas').disputas, ...estado(c, 'repaso').disputas];
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
    const ap = leerSi(ctl('repaso-aplicado.json'), null) as { aplicados: Json[]; salteados: (Json & { motivo: string })[] } | null;
    if (ap) {
      L.push('', `## Repaso de hechos sobre las piezas arregladas: ${rep.nuevos.length} nuevos (${ap.aplicados.length} corregidos por código, ${ap.salteados.length} abiertos)`, '');
      for (const x of ap.aplicados) L.push(`- corregido · ${x.pieza} (${x.tipo}): «${recorte(x.frase)}» → ${recorte(x.correccion)}`);
      for (const x of ap.salteados) L.push(`- abierto · ${x.pieza} (${x.tipo}, ${x.motivo}): «${recorte(x.frase)}» → ${recorte(x.correccion)}`);
    } else {
      L.push('', `## Repaso de hechos sobre las piezas arregladas: ${rep.nuevos.length} nuevos (abiertos)`, '');
      for (const x of rep.nuevos) L.push(`- ${x.pieza} (${x.tipo}): «${recorte(x.frase)}» → ${recorte(x.correccion)}`);
    }
  }

  const sf = leerSi(arr('problemas-sus_frases.json'), []);
  if (sf.length) { L.push('', `## Sus frases (no se arreglan: van acá): ${sf.length}`, ''); for (const x of sf) L.push(`- ${x.origen} (${x.tipo}): ${recorte(x.que)} «${recorte(x.frase)}»`); }

  // v4: la lectura final (después del arreglo) no tiene segunda ronda: va acá, para ajustar la receta.
  const lf = c.existe(salida('lectura-final.json')) ? (leerJSON(c, salida('lectura-final.json')).problemas || []) : null;
  if (lf) { L.push('', `## Lectura final, sobre el libro arreglado: ${lf.length}`, ''); for (const x of lf) L.push(`- ${x.pieza} (${x.tipo}): «${recorte(x.frase)}» — ${recorte(x.que)}`); }

  const tit = leerSi(ctl('titulos.json'), []);
  if (tit.length) { L.push('', `## Títulos que el lector marcó (el título es del plan: se arregla la receta o el plan, no el libro): ${tit.length}`, ''); for (const x of tit) L.push(`- ${x.pieza} (${x.tipo}): «${recorte(x.frase)}» — ${recorte(x.que)}`); }

  const libro = c.existe('libro.md') ? c.leer('libro.md') : '';
  if (libro) L.push('', `Largo del libro: ${libro.split(/\s+/).filter(Boolean).length} palabras.`);
  return L.join('\n') + '\n';
}
