// Paso 6: fabrica/scripts/escritor-v55/arreglos.mjs sobre la Carpeta (juntar, armar, aplicar).
// `SOLO_HECHOS=1` pasa a ser `o.soloHechos`; cada console.log se junta en el resumen que se devuelve.
import { Carpeta, leerJSON } from '../carpeta.js';
import { piezas, respuestas, salida } from '../lectura.js';
import { archivoDe, armarCambios, piezaDeR, planConR } from '../texto.js';
import type { Json } from '../tipos.js';
import { cotejoValido } from './estructura.js';

export function juntar(c: Carpeta, o: { soloHechos: boolean }): string {
  const lineas: string[] = [];
  const porPieza = new Map<string, Json[]>();
  const sumar = (p: string, x: Json) => porPieza.set(p, [...(porPieza.get(p) || []), x]);
  const cod = c.existe('controles/piezas.json') ? leerJSON(c, 'controles/piezas.json') : [];
  // v5, revisión solo de hechos (SOLO_HECHOS=1): del código entran solo hechos y que todo entre; no entran el lector ni el cotejo (no se toca el relato).
  const SOLO = o.soloHechos, DE_HECHOS = ['C2', 'C4', 'C5', 'C6', 'C7', 'C18', 'C19', 'C23', 'C31', 'C32', 'C33', 'C17']; // v5.2: C32 (los "no") y C33 (el golpe junto); v5.3: C7 (una frase en un solo lugar); v5.5: C17 (presentación completa repetida)
  for (const co of cod) if (!SOLO || DE_HECHOS.includes(co.control)) sumar(co.pieza, { origen: `código ${co.control}`, tipo: co.tipo, frase: co.frase, que: co.que });
  if (c.existe(salida('hechos.json'))) for (const h of leerJSON(c, salida('hechos.json')).problemas) sumar(h.pieza, { origen: 'verificador', tipo: h.tipo, frase: h.frase, que: h.material, ids: h.ids, correccion: h.correccion });
  // v5.1: el veedor final (paso 5c) siempre entra al arreglo.
  if (c.existe(salida('veedor.json'))) for (const v of leerJSON(c, salida('veedor.json')).problemas || []) sumar(v.pieza, { origen: 'veedor', tipo: v.tipo, frase: v.frase, que: v.que });
  if (!SOLO && c.existe(salida('lectura.json'))) {
    // receta v3.2: el título es del plan; lo que el lector diga de un título no va al arreglo, va al informe.
    const lectura = leerJSON(c, salida('lectura.json')).problemas;
    const titulos = lectura.filter((l: Json) => /^titulo/.test(l.tipo || ''));
    if (titulos.length) c.escribir('controles/titulos.json', JSON.stringify(titulos, null, 1));
    for (const l of lectura.filter((x: Json) => !titulos.includes(x))) sumar(l.pieza, { origen: 'lector', tipo: l.tipo, frase: l.frase, que: l.que });
  }
  // receta v3, paso 5b: lo que el cotejo encontró afuera va a la pieza que marca esa respuesta (o a la que le toca según el plan).
  if (!SOLO && c.existe(salida('cotejo.json'))) {
    const reg = leerJSON(c, salida('registro.json')), plan = planConR(leerJSON(c, salida('plan.json')), reg), ps = piezas(c);
    const { validas, descartadas } = cotejoValido(leerJSON(c, salida('cotejo.json')), respuestas(c));
    if (descartadas.length) { c.escribir('controles/cotejo-descartado.json', JSON.stringify(descartadas, null, 1)); lineas.push(`cotejo: ${descartadas.length} descartadas (id que no existe o frase no textual) → controles/cotejo-descartado.json, al informe`); }
    for (const f of validas) sumar(piezaDeR(plan, reg, f.id, ps), { origen: 'cotejador', tipo: 'falta_frase', frase: '', que: `falta frase de ${f.id}: «${f.frase}»${f.por_que ? ` (${f.por_que})` : ''}`, ids: [f.id] });
  }
  for (const [p, xs] of porPieza) {
    c.escribir(`arreglos/problemas-${p}.json`, JSON.stringify(xs.map((x, i) => ({ n: i + 1, ...x })), null, 1));
    lineas.push(`${p}: ${xs.length} problemas (${[...new Set(xs.map((x) => x.origen))].join(', ')})`);
  }
  return lineas.join('\n');
}

export function armar(c: Carpeta, pieza: string): string {
  const actual = piezas(c).find((p) => p.pieza === pieza);
  if (!actual) throw new Error(`no existe la pieza ${pieza}`);
  const { texto, cambios } = armarCambios(actual.texto.trim(), leerJSON(c, `arreglos/cambios-${pieza}.json`).cambios);
  c.escribir(`arreglos/respuesta-${pieza}.txt`, `${texto}
---
${JSON.stringify({ cambios }, null, 1)}
`);
  const no = cambios.filter((x) => x.resultado === 'no_aplicado').length;
  return `${pieza}: ${cambios.length} cambios por problema, ${no} no aplicados (el "antes" no estaba tal cual)`;
}

export function aplicar(c: Carpeta, pieza: string): string {
  const r = c.leer(`arreglos/respuesta-${pieza}.txt`);
  const corte = r.lastIndexOf('\n---\n');
  const texto = (corte < 0 ? r : r.slice(0, corte)).trim();
  c.escribir(salida(archivoDe(pieza)), texto + '\n');
  return `${pieza} → salidas/${archivoDe(pieza)} (${texto.split(/\s+/).length} palabras)`;
}
