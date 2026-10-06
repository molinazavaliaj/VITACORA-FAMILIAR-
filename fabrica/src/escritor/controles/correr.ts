// fabrica/src/escritor/controles/correr.ts
// El main de fabrica/scripts/escritor-v55/controles.mjs (líneas 743-795), sobre la Carpeta:
// en vez de imprimir y salir con 0 o 2, devuelve el código y el resumen. Mismo orden de controles.
import { Carpeta, leerJSON } from '../carpeta.js';
import { ficha, noEntran, piezas, respuestas, salida } from '../lectura.js';
import { palabras, planConR, sinMarcas } from '../texto.js';
import type { Json } from '../tipos.js';
import { c12, c13, c14, c18, c19, c20, c20Texto, c21, c23, c24, c26, c33, c33Texto, c9, decisionesAnteriores } from './estructura.js';
import { c1, c10, c15, c17, c2, c28, c29, c3, c31, c32, c4, c5, c6, c7, c8, enAlgunaRespuesta, esSubsecuencia, repite } from './texto.js';

export type QueControl = 'registro' | 'plan' | 'piezas' | 'arreglo' | 'repite' | 'repaso';
export type ResultadoControl = { codigo: 0 | 2; problemas: Json[]; resumen: string };

export function controlar(c: Carpeta, que: QueControl, arg?: string): ResultadoControl {
  const lineas: string[] = [];
  const fin = (codigo: 0 | 2, problemas: Json[]): ResultadoControl => ({ codigo, problemas, resumen: lineas.join('\n') });
  const rs = respuestas(c);
  const fichaTxt = ficha(c);
  const reg = c.existe(salida('registro.json')) ? leerJSON(c, salida('registro.json')) : null;
  let problemas: Json[] = [];
  if (que === 'registro') problemas = c14(reg, rs, fichaTxt);
  else if (que === 'plan') {
    const plan = planConR(leerJSON(c, salida('plan.json')), reg);
    problemas = [...c12(plan, rs, reg), ...c13(plan, reg), ...c20(plan, reg), ...c33(plan, reg)];
  } else if (que === 'piezas') {
    const crudas = piezas(c);
    const ps = crudas.map((p) => ({ ...p, texto: sinMarcas(p.texto) }));
    const plan = planConR(leerJSON(c, salida('plan.json')), reg);
    problemas.push(...c18(crudas, rs, reg, plan, noEntran(c)), ...c33Texto(crudas, plan, reg), ...c19(crudas, reg), ...c21(ps, reg, plan), ...c20Texto(crudas, reg, plan), ...c23(crudas, reg));
    const arreglado = c.existeCarpeta('arreglos') && c.listar('arreglos').some((f: string) => f.startsWith('respuesta-'));
    if (arreglado && c.existe(salida('cotejo.json'))) problemas.push(...c24(ps, leerJSON(c, salida('cotejo.json')), plan, reg, crudas, rs));
    const regTxt = JSON.stringify(reg || {});
    // El último capítulo es el del plan (en la prueba corta hay un solo capítulo escrito y no es el último).
    const ultimo = `cap_${plan.capitulos[plan.capitulos.length - 1].n}`;
    for (const p of ps) {
      const deEsta = [...c1(p, rs), ...c2(p), ...c3(p), ...c4(p, rs, fichaTxt, regTxt), ...c5(p, rs, fichaTxt), ...(p.pieza === 'sus_frases' ? [] : c6(p, rs)), ...c8(p, rs), ...c10(p, rs, reg?.voz?.trato), ...(p.pieza === ultimo ? c15(p) : []), ...(p.pieza.startsWith('cap_') && p.pieza !== ultimo ? c28(p) : []), ...(p.pieza !== 'sus_frases' ? c29(p, reg) : []), ...(p.pieza !== 'sus_frases' ? c31(p) : []), ...(p.pieza !== 'sus_frases' ? c32(p) : [])];
      problemas.push(...deEsta.map((x) => ({ pieza: p.pieza, ...x })));
      if (p.pieza === 'sus_frases') for (const l of p.texto.split('\n').filter((l) => l.startsWith('>'))) if (!enAlgunaRespuesta(l.slice(1), rs)) problemas.push({ pieza: 'sus_frases', control: 'C6', tipo: 'cita', frase: l.slice(1).trim(), que: 'frase de Sus frases que no es textual' });
    }
    const estribillos = (reg?.voz?.frases || []).map((f: { texto?: string }) => f.texto || '').filter((t: string) => palabras(t).length >= 3 && rs.filter((r) => esSubsecuencia(t, r.texto)).length >= 2);
    problemas.push(...c7(ps, estribillos), ...c17(ps));
  } else if (que === 'arreglo') {
    const pieza = String(arg);
    const probs = leerJSON(c, `arreglos/problemas-${pieza}.json`);
    const nueva = c.leer(`arreglos/respuesta-${pieza}.txt`);
    const vieja = piezas(c).find((p) => p.pieza === pieza)?.texto || '';
    const r = c9(probs, nueva, vieja);
    c.escribir(`controles/c9-${pieza}.json`, JSON.stringify(r, null, 1));
    lineas.push(`C9 ${pieza}: ${r.abiertos.filter((a) => a.estado === 'sigue').length} siguen, ${r.abiertos.filter((a) => a.estado === 'disputa').length} disputas, ${r.identicos} % de párrafos sin problema idénticos${r.identicos < 70 ? ' (AVISO de deriva)' : ''}`);
    return fin(r.abiertos.length ? 2 : 0, r.abiertos);
  } else if (que === 'repite') {
    // v5.3: lo que la pieza <arg> comparte (6 palabras seguidas) con las demás; sale con 2 si hay algo.
    const pieza = String(arg);
    const ps = piezas(c).map((p) => ({ ...p, texto: sinMarcas(p.texto) }));
    const r = repite(ps, pieza);
    c.escribir(`controles/repite-${pieza}.json`, JSON.stringify(r, null, 1));
    lineas.push(`repite ${pieza}: ${r.length} tramos repetidos${r.length ? ': ' + r.map((x) => `"${x.frase}" (${x.que.replace('repite seis palabras seguidas de ', '')})`).join('; ') : ''}`);
    return fin(r.length ? 2 : 0, r);
  } else if (que === 'repaso') {
    const r = c26(leerJSON(c, salida('hechos-repaso.json')), decisionesAnteriores(c));
    c.escribir('controles/repaso.json', JSON.stringify(r, null, 1));
    lineas.push(`C26 repaso: ${r.nuevos.length} nuevos, ${r.oscila.length} el verificador oscila (no van al arreglo), ${r.contradice.length} contradicen una decisión con respuesta (van a disputa)`);
    return fin(r.nuevos.length || r.contradice.length ? 2 : 0, [...r.nuevos, ...r.contradice]);
  }
  c.escribir(`controles/${que}.json`, JSON.stringify(problemas, null, 1));
  if (!problemas.length) {
    lineas.push(`${que}: ok`);
    return fin(0, problemas);
  }
  lineas.push(`${que}: ${problemas.length} problemas`);
  for (const p of problemas.slice(0, 60)) lineas.push(typeof p === 'string' ? `- ${p}` : `- [${p.control}] ${p.pieza}: ${p.que} — ${String(p.frase).slice(0, 100)}`);
  return fin(2, problemas);
}
