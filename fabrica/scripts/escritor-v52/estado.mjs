// Lo que el workflow necesita saber entre pasos, en JSON por stdout (el workflow no lee archivos).
// Uso: node estado.mjs <carpeta> capitulos | arreglos | disputas | repaso
//   capitulos → {"n": [1,2,…], "antes": true|false}
//   arreglos  → {"piezas": ["cap_3", …], "sus_frases": n}   (piezas con arreglos/problemas-<pieza>.json; sus_frases no se arregla: va al informe)
//   disputas  → {"disputas": [{clave, pieza, n, frase, id, cita}]}  (C9: "disputa" en controles/c9-<pieza>.json)
//   repaso    → {"disputas": [{clave, pieza, n, frase, id, cita, origen}]}  (C26: oscila y contradice_decision de controles/repaso.json)
import path from 'node:path';
import { readdirSync } from 'node:fs';
import { existe, leerJSON, salida } from './lib.mjs';

export function estado(dir, que, rid) {
  const arr = path.join(dir, 'arreglos'), ctl = path.join(dir, 'controles');
  const lista = (d, re) => (existe(d) ? readdirSync(d).filter((f) => re.test(f)).sort() : []);
  if (que === 'capitulos') {
    const plan = leerJSON(salida(dir, 'plan.json'));
    return { n: plan.capitulos.map((c) => c.n), antes: (plan.antes_de_cerrar?.ids || []).length > 0 };
  }
  if (que === 'capitulo-de') {
    // Para la prueba corta: el capítulo del plan que cuenta la respuesta `rid` (el del hecho que se juzga).
    const plan = leerJSON(salida(dir, 'plan.json')), reg = leerJSON(salida(dir, 'registro.json'));
    const eps = new Set((reg.episodios || []).filter((e) => e.ids.includes(rid)).map((e) => e.id));
    const c = plan.capitulos.find((x) => (x.piezas || []).some((p) => eps.has(p.episodio)));
    return { n: c ? c.n : null, titulo: c ? (c.titulo?.texto || c.etapa || '') : '' };
  }
  if (que === 'arreglos') {
    const ps = lista(arr, /^problemas-.+\.json$/).map((f) => f.replace(/^problemas-|\.json$/g, ''));
    const sf = ps.includes('sus_frases') ? leerJSON(path.join(arr, 'problemas-sus_frases.json')).length : 0;
    return { piezas: ps.filter((p) => p !== 'sus_frases'), sus_frases: sf };
  }
  if (que === 'disputas') {
    const out = [];
    for (const f of lista(ctl, /^c9-.+\.json$/)) {
      const pieza = f.replace(/^c9-|\.json$/g, '');
      for (const a of leerJSON(path.join(ctl, f)).abiertos.filter((x) => x.estado === 'disputa')) out.push({ clave: `${pieza}-${a.n}`, pieza, n: a.n, frase: a.frase || '', id: a.id || '', cita: a.cita || '' });
    }
    return { disputas: out };
  }
  if (que === 'repaso') {
    const r = existe(path.join(ctl, 'repaso.json')) ? leerJSON(path.join(ctl, 'repaso.json')) : { oscila: [], contradice: [] };
    const d = (pr, i, origen) => ({ clave: `repaso-${origen}-${i + 1}`, pieza: pr.pieza, n: pr.n, frase: pr.frase || '', id: (pr.ids || [])[0] || '', cita: pr.material || '', origen });
    return { disputas: [...r.oscila.map((x, i) => d(x, i, 'oscila')), ...r.contradice.map((x, i) => d(x, i, 'contradice'))] };
  }
  throw new Error('qué: capitulos | arreglos | disputas | repaso');
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('estado.mjs')) {
  const [, , dirArg, que, rid] = process.argv;
  console.log(JSON.stringify(estado(path.resolve(dirArg), que, rid)));
}
