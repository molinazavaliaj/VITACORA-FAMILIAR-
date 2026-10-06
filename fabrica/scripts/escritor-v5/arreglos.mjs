// Paso 6 de la receta nueva: junta los problemas por pieza y aplica lo que devuelve el arreglo.
// Uso: node arreglos.mjs <carpeta> juntar        → arreglos/problemas-<pieza>.json (código + hechos + lectura, numerados)
//      node arreglos.mjs <carpeta> armar <pieza>   → aplica arreglos/cambios-<pieza>.json a la pieza actual y deja arreglos/respuesta-<pieza>.txt (receta v3.1)
//      node arreglos.mjs <carpeta> aplicar <pieza> → pasa la pieza de arreglos/respuesta-<pieza>.txt a salidas/
import path from 'node:path';
import { leer, existe, escribir, leerJSON, salida, archivoDe, piezaDeR, piezas, planConR, respuestas, armarCambios } from './lib.mjs';
import { cotejoValido } from './controles.mjs';

const [, , dirArg, que, pieza] = process.argv;
const dir = path.resolve(dirArg);

if (que === 'juntar') {
  const porPieza = new Map();
  const sumar = (p, x) => porPieza.set(p, [...(porPieza.get(p) || []), x]);
  const cod = existe(path.join(dir, 'controles', 'piezas.json')) ? leerJSON(path.join(dir, 'controles', 'piezas.json')) : [];
  // v5, revisión solo de hechos (SOLO_HECHOS=1): del código entran solo hechos y que todo entre; no entran el lector ni el cotejo (no se toca el relato).
  const SOLO = !!process.env.SOLO_HECHOS, DE_HECHOS = ['C2', 'C4', 'C5', 'C6', 'C18', 'C19', 'C23', 'C31'];
  for (const c of cod) if (!SOLO || DE_HECHOS.includes(c.control)) sumar(c.pieza, { origen: `código ${c.control}`, tipo: c.tipo, frase: c.frase, que: c.que });
  if (existe(salida(dir, 'hechos.json'))) for (const h of leerJSON(salida(dir, 'hechos.json')).problemas) sumar(h.pieza, { origen: 'verificador', tipo: h.tipo, frase: h.frase, que: h.material, ids: h.ids, correccion: h.correccion });
  // v5.1: el veedor final (paso 5c) siempre entra al arreglo.
  if (existe(salida(dir, 'veedor.json'))) for (const v of leerJSON(salida(dir, 'veedor.json')).problemas || []) sumar(v.pieza, { origen: 'veedor', tipo: v.tipo, frase: v.frase, que: v.que });
  if (!SOLO && existe(salida(dir, 'lectura.json'))) {
    // receta v3.2: el título es del plan; lo que el lector diga de un título no va al arreglo, va al informe.
    const lectura = leerJSON(salida(dir, 'lectura.json')).problemas;
    const titulos = lectura.filter((l) => /^titulo/.test(l.tipo || ''));
    if (titulos.length) escribir(path.join(dir, 'controles', 'titulos.json'), JSON.stringify(titulos, null, 1));
    for (const l of lectura.filter((x) => !titulos.includes(x))) sumar(l.pieza, { origen: 'lector', tipo: l.tipo, frase: l.frase, que: l.que });
  }
  // receta v3, paso 5b: lo que el cotejo encontró afuera va a la pieza que marca esa respuesta (o a la que le toca según el plan).
  if (!SOLO && existe(salida(dir, 'cotejo.json'))) {
    const reg = leerJSON(salida(dir, 'registro.json')), plan = planConR(leerJSON(salida(dir, 'plan.json')), reg), ps = piezas(dir);
    const { validas, descartadas } = cotejoValido(leerJSON(salida(dir, 'cotejo.json')), respuestas(dir));
    if (descartadas.length) { escribir(path.join(dir, 'controles', 'cotejo-descartado.json'), JSON.stringify(descartadas, null, 1)); console.log(`cotejo: ${descartadas.length} descartadas (id que no existe o frase no textual) → controles/cotejo-descartado.json, al informe`); }
    for (const f of validas) sumar(piezaDeR(plan, reg, f.id, ps), { origen: 'cotejador', tipo: 'falta_frase', frase: '', que: `falta frase de ${f.id}: «${f.frase}»${f.por_que ? ` (${f.por_que})` : ''}`, ids: [f.id] });
  }
  for (const [p, xs] of porPieza) {
    escribir(path.join(dir, 'arreglos', `problemas-${p}.json`), JSON.stringify(xs.map((x, i) => ({ n: i + 1, ...x })), null, 1));
    console.log(`${p}: ${xs.length} problemas (${[...new Set(xs.map((x) => x.origen))].join(', ')})`);
  }
} else if (que === 'armar') {
  const actual = piezas(dir).find((p) => p.pieza === pieza);
  if (!actual) throw new Error(`no existe la pieza ${pieza}`);
  const { texto, cambios } = armarCambios(actual.texto.trim(), leerJSON(path.join(dir, 'arreglos', `cambios-${pieza}.json`)).cambios);
  escribir(path.join(dir, 'arreglos', `respuesta-${pieza}.txt`), `${texto}
---
${JSON.stringify({ cambios }, null, 1)}
`);
  const no = cambios.filter((c) => c.resultado === 'no_aplicado').length;
  console.log(`${pieza}: ${cambios.length} cambios por problema, ${no} no aplicados (el "antes" no estaba tal cual)`);
} else if (que === 'aplicar') {
  const r = leer(path.join(dir, 'arreglos', `respuesta-${pieza}.txt`));
  const corte = r.lastIndexOf('\n---\n');
  const texto = (corte < 0 ? r : r.slice(0, corte)).trim();
  escribir(salida(dir, archivoDe(pieza)), texto + '\n');
  console.log(`${pieza} → salidas/${archivoDe(pieza)} (${texto.split(/\s+/).length} palabras)`);
} else { console.error('juntar | aplicar <pieza>'); process.exit(1); }
