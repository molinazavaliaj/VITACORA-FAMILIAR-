// Paso 6 de la receta nueva: junta los problemas por pieza y aplica lo que devuelve el arreglo.
// Uso: node arreglos.mjs <carpeta> juntar        → arreglos/problemas-<pieza>.json (código + hechos + lectura, numerados)
//      node arreglos.mjs <carpeta> aplicar <pieza> → pasa la pieza de arreglos/respuesta-<pieza>.txt a salidas/
import path from 'node:path';
import { leer, existe, escribir, leerJSON, salida } from './lib.mjs';

const [, , dirArg, que, pieza] = process.argv;
const dir = path.resolve(dirArg);
const archivo = { primera_pagina: 'primera_pagina.md', carta: 'carta.md', sus_frases: 'sus_frases.md' };
const archivoDe = (p) => archivo[p] || `capitulo_${String(Number(p.replace('cap_', ''))).padStart(2, '0')}.md`;

if (que === 'juntar') {
  const porPieza = new Map();
  const sumar = (p, x) => porPieza.set(p, [...(porPieza.get(p) || []), x]);
  const cod = existe(path.join(dir, 'controles', 'piezas.json')) ? leerJSON(path.join(dir, 'controles', 'piezas.json')) : [];
  for (const c of cod) sumar(c.pieza, { origen: `código ${c.control}`, tipo: c.tipo, frase: c.frase, que: c.que });
  if (existe(salida(dir, 'hechos.json'))) for (const h of leerJSON(salida(dir, 'hechos.json')).problemas) sumar(h.pieza, { origen: 'verificador', tipo: h.tipo, frase: h.frase, que: h.material, ids: h.ids, correccion: h.correccion });
  if (existe(salida(dir, 'lectura.json'))) for (const l of leerJSON(salida(dir, 'lectura.json')).problemas) sumar(l.pieza, { origen: 'lector', tipo: l.tipo, frase: l.frase, que: l.que });
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
