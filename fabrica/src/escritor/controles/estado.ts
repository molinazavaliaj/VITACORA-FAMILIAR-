// Lo que el orquestador necesita saber entre pasos: fabrica/scripts/escritor-v55/estado.mjs sobre la Carpeta.
import { Carpeta, leerJSON } from '../carpeta.js';
import { salida } from '../lectura.js';
import type { Json } from '../tipos.js';

export type Disputa = { clave: string; pieza: string; n: number; frase: string; id: string; cita: string; origen?: string };

export function estado(c: Carpeta, que: 'capitulos' | 'capitulo-de' | 'arreglos' | 'disputas' | 'repaso', rid?: string): Json {
  const arr = 'arreglos', ctl = 'controles';
  const lista = (d: string, re: RegExp): string[] => (c.existeCarpeta(d) ? c.listar(d).filter((f) => re.test(f)) : []).sort();
  if (que === 'capitulos') {
    const plan = leerJSON(c, salida('plan.json'));
    return { n: plan.capitulos.map((x: Json) => x.n), antes: (plan.antes_de_cerrar?.ids || []).length > 0 };
  }
  if (que === 'capitulo-de') {
    // Para la prueba corta: el capítulo del plan que cuenta la respuesta `rid` (el del hecho que se juzga).
    const plan = leerJSON(c, salida('plan.json')), reg = leerJSON(c, salida('registro.json'));
    const eps = new Set((reg.episodios || []).filter((e: Json) => e.ids.includes(rid)).map((e: Json) => e.id));
    const cap = plan.capitulos.find((x: Json) => (x.piezas || []).some((p: Json) => eps.has(p.episodio)));
    return { n: cap ? cap.n : null, titulo: cap ? (cap.titulo?.texto || cap.etapa || '') : '' };
  }
  if (que === 'arreglos') {
    const ps = lista(arr, /^problemas-.+\.json$/).map((f) => f.replace(/^problemas-|\.json$/g, ''));
    const sf = ps.includes('sus_frases') ? leerJSON(c, `${arr}/problemas-sus_frases.json`).length : 0;
    return { piezas: ps.filter((p) => p !== 'sus_frases'), sus_frases: sf };
  }
  if (que === 'disputas') {
    const out: Disputa[] = [];
    for (const f of lista(ctl, /^c9-.+\.json$/)) {
      const pieza = f.replace(/^c9-|\.json$/g, '');
      for (const a of leerJSON(c, `${ctl}/${f}`).abiertos.filter((x: Json) => x.estado === 'disputa')) out.push({ clave: `${pieza}-${a.n}`, pieza, n: a.n, frase: a.frase || '', id: a.id || '', cita: a.cita || '' });
    }
    return { disputas: out };
  }
  if (que === 'repaso') {
    const r = c.existe(`${ctl}/repaso.json`) ? leerJSON(c, `${ctl}/repaso.json`) : { oscila: [], contradice: [] };
    const d = (pr: Json, i: number, origen: string): Disputa => ({ clave: `repaso-${origen}-${i + 1}`, pieza: pr.pieza, n: pr.n, frase: pr.frase || '', id: (pr.ids || [])[0] || '', cita: pr.material || '', origen });
    return { disputas: [...r.oscila.map((x: Json, i: number) => d(x, i, 'oscila')), ...r.contradice.map((x: Json, i: number) => d(x, i, 'contradice'))] };
  }
  throw new Error('qué: capitulos | arreglos | disputas | repaso');
}
