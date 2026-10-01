// Paso 6 de la receta nueva: junta los problemas por pieza y aplica lo que devuelve el arreglo.
// Uso: node arreglos.mjs <carpeta> juntar        → arreglos/problemas-<pieza>.json (código + hechos + lectura, numerados)
//      node arreglos.mjs <carpeta> aplicar <pieza> → pasa la pieza de arreglos/respuesta-<pieza>.txt a salidas/
import path from 'node:path';
import { leer, existe, escribir, leerJSON, salida, archivoDe, piezaDeR, piezas, planConR, respuestas } from './lib.mjs';
import { cotejoValido } from './controles.mjs';

const [, , dirArg, que, pieza] = process.argv;
const dir = path.resolve(dirArg);

if (que === 'juntar') {
  const porPieza = new Map();
  const sumar = (p, x) => porPieza.set(p, [...(porPieza.get(p) || []), x]);
  const cod = existe(path.join(dir, 'controles', 'piezas.json')) ? leerJSON(path.join(dir, 'controles', 'piezas.json')) : [];
  for (const c of cod) sumar(c.pieza, { origen: `código ${c.control}`, tipo: c.tipo, frase: c.frase, que: c.que });
  if (existe(salida(dir, 'hechos.json'))) for (const h of leerJSON(salida(dir, 'hechos.json')).problemas) sumar(h.pieza, { origen: 'verificador', tipo: h.tipo, frase: h.frase, que: h.material, ids: h.ids, correccion: h.correccion });
  if (existe(salida(dir, 'lectura.json'))) for (const l of leerJSON(salida(dir, 'lectura.json')).problemas) sumar(l.pieza, { origen: 'lector', tipo: l.tipo, frase: l.frase, que: l.que });
  // receta v3, paso 5b: lo que el cotejo encontró afuera va a la pieza que marca esa respuesta (o a la que le toca según el plan).
  if (existe(salida(dir, 'cotejo.json'))) {
    const reg = leerJSON(salida(dir, 'registro.json')), plan = planConR(leerJSON(salida(dir, 'plan.json')), reg), ps = piezas(dir);
    const { validas, descartadas } = cotejoValido(leerJSON(salida(dir, 'cotejo.json')), respuestas(dir));
    if (descartadas.length) { escribir(path.join(dir, 'controles', 'cotejo-descartado.json'), JSON.stringify(descartadas, null, 1)); console.log(`cotejo: ${descartadas.length} descartadas (id que no existe o frase no textual) → controles/cotejo-descartado.json, al informe`); }
    for (const f of validas) sumar(piezaDeR(plan, reg, f.id, ps), { origen: 'cotejador', tipo: 'falta_frase', frase: '', que: `falta frase de ${f.id}: «${f.frase}»${f.por_que ? ` (${f.por_que})` : ''}`, ids: [f.id] });
  }
  for (const [p, xs] of porPieza) {
    escribir(path.join(dir, 'arreglos', `problemas-${p}.json`), JSON.stringify(xs.map((x, i) => ({ n: i + 1, ...x })), null, 1));
    console.log(`${p}: ${xs.length} problemas (${[...new Set(xs.map((x) => x.origen))].join(', ')})`);
  }
} else if (que === 'aplicar') {
  const r = leer(path.join(dir, 'arreglos', `respuesta-${pieza}.txt`));
  const corte = r.lastIndexOf('\n---\n');
  const texto = (corte < 0 ? r : r.slice(0, corte)).trim();
  escribir(salida(dir, archivoDe(pieza)), texto + '\n');
  console.log(`${pieza} → salidas/${archivoDe(pieza)} (${texto.split(/\s+/).length} palabras)`);
} else { console.error('juntar | aplicar <pieza>'); process.exit(1); }
