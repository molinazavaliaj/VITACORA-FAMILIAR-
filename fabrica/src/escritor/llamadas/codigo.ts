// fabrica/src/escritor/llamadas/codigo.ts
// Los dos pasos de llamada.mjs que no llaman al modelo: Sus frases (líneas 189-200) y el libro (283-311).
import { Carpeta, leerJSON } from '../carpeta.js';
import { idioma, piezas, salida } from '../lectura.js';
import { sinMarcas, tituloImpreso, titulosFijos, tituloValido } from '../texto.js';
import type { Json } from '../tipos.js';

const plan = (c: Carpeta): Json => leerJSON(c, salida('plan.json'));

export function susFrasesMd(c: Carpeta): string {
  // v5.1: si hay salidas/sus_frases.json (paso 3e), solo las frases, sin texto del escritor alrededor.
  if (c.existe(salida('sus_frases.json'))) {
    const fr: Json[] = leerJSON(c, salida('sus_frases.json')).frases || [];
    c.escribir(salida('sus_frases.md'), fr.map((f) => `> ${String(f.texto).trim()}`).join('\n\n') + '\n');
    return `sus_frases.md: ${fr.length} frases (literales, del paso 3e)`;
  }
  const sf: Json[] = plan(c).sus_frases || [];
  c.escribir(salida('sus_frases.md'), sf.map((f) => `> ${f.texto}\n\n${f.contexto}`).join('\n\n') + '\n');
  return `sus_frases.md: ${sf.length} frases`;
}

export function armarLibro(c: Carpeta): string {
  const p = plan(c);
  const ps = piezas(c);
  const limpio = (t: string): string => sinMarcas(t).replace(/\s*\[\[cita:[^\]]*\]\]/g, '');
  const partes = [`# ${p.titulo_libro?.texto || ''}`];
  for (const x of ps) {
    // v5.4: los títulos fijos en el idioma del libro; "Para los míos" (el título por defecto del plan) también.
    const T = titulosFijos(idioma(c));
    if (x.pieza === 'sus_frases') partes.push(`# ${T.frases}\n\n${x.texto.trim()}`);
    else if (x.pieza === 'antes_de_cerrar') partes.push(`# ${T.antes}\n\n${limpio(x.texto.trim())}`);
    else if (x.pieza === 'carta' && p.carta?.titulo) partes.push(`# ${/^para los m[ií]os$/i.test(p.carta.titulo.trim()) ? T.carta : p.carta.titulo}\n\n${limpio(x.texto.trim())}`);
    else if (x.pieza.startsWith('cap_')) {
      // receta v3.2: el título es el del plan y lo imprime el código (en la prueba 3.1 el arreglo lo cambió por otro).
      const cap = p.capitulos.find((k: Json) => k.n === Number(x.pieza.slice(4)));
      const cuerpo = limpio(x.texto.trim()).replace(/^(#[^\n]*\n+)+/, '');
      // v5.1 (Naza 03/10): los capítulos van numerados (I, II, III…); el título lo pone el cliente en el dashboard si quiere.
      const romano = (k: number): string => ([['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]] as [string, number][]).reduce((s, [l, v]) => { while (k >= v) { s += l; k -= v; } return s; }, '');
      // v5.5: el título del paso 3t, si pasa el control (palabras del capítulo); si no, solo el número.
      const ft = salida(`titulos/cap_${cap?.n}.json`);
      const t3 = cap && c.existe(ft) ? String(leerJSON(c, ft).titulo || '').trim() : '';
      const tit = t3 && tituloValido(t3, cuerpo) ? ` · ${t3}` : '';
      partes.push(cap ? `# ${false ? tituloImpreso(cap) : romano(cap.n) + tit}\n\n${cuerpo}` : limpio(x.texto.trim()));
    } else partes.push(limpio(x.texto.trim()));
  }
  c.escribir('libro.md', partes.join('\n\n') + '\n');
  return `libro.md: ${partes.join(' ').split(/\s+/).length} palabras`;
}
