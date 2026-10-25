// Los pasos sin modelo del final (receta, secciones 1 y 3): Sus frases y el libro. Como escritor/llamadas/codigo.ts
// (que no se toca), con el orden y los títulos de historia: título del libro, capítulos («I · Título»), la carta a
// quien era (si hay) y Sus frases (si quedan 4 o más que pasan C6). No hay primera página ni Antes de cerrar.
import { Carpeta, leerJSON } from '../escritor/carpeta.js';
import { enAlgunaRespuesta } from '../escritor/controles/texto.js';
import { piezas, respuestas, salida } from '../escritor/lectura.js';
import { sinMarcas, tituloValido } from '../escritor/texto.js';
import type { Json } from '../escritor/tipos.js';
import { idiomaHistoria, titulosFijosHistoria } from './lectura.js';
import { materialDe } from './material/carpeta.js';

/** Con menos frases que pasan C6, la página no va (receta, sección 3). */
export const MINIMO_SUS_FRASES = 4;
export const RUTA_SUS_FRASES_CONTROL = 'controles/sus-frases-historia.json';

/** sus_frases.md con las frases textuales del paso 3e; las que no pasan C6 salen y van al informe. */
export function susFrasesHistoria(c: Carpeta): string {
  const fr: Json[] = c.existe(salida('sus_frases.json')) ? leerJSON(c, salida('sus_frases.json')).frases || [] : [];
  const rs = respuestas(c);
  const valen = fr.filter((f) => String(f.texto || '').trim() && enAlgunaRespuesta(String(f.texto), rs));
  const salen = fr.filter((f) => !valen.includes(f));
  const va = valen.length >= MINIMO_SUS_FRASES;
  c.escribir(RUTA_SUS_FRASES_CONTROL, JSON.stringify({ va, frases: valen.length, salen }, null, 1));
  if (va) c.escribir(salida('sus_frases.md'), valen.map((f) => `> ${String(f.texto).trim()}`).join('\n\n') + '\n');
  else c.borrar(salida('sus_frases.md'));
  return `sus_frases.md: ${valen.length} frases textuales${salen.length ? ` (${salen.length} no pasan C6)` : ''}${va ? '' : `; con menos de ${MINIMO_SUS_FRASES} la página no va`}`;
}

const romano = (k: number): string => ([['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]] as [string, number][]).reduce((s, [l, v]) => { while (k >= v) { s += l; k -= v; } return s; }, '');

/** El título del libro: el del plan; si viene vacío, la historia en sus palabras, y si no hay, la etiqueta del tema. */
export function tituloDelLibro(c: Carpeta): string {
  const p = leerJSON(c, salida('plan.json'));
  const m = materialDe(c);
  return String(p.titulo_libro?.texto || '').trim() || m.temaLibre || m.etiqueta;
}

export function armarLibroHistoria(c: Carpeta): string {
  const p = leerJSON(c, salida('plan.json'));
  const T = titulosFijosHistoria(idiomaHistoria(c));
  const limpio = (t: string): string => sinMarcas(t).replace(/\s*\[\[cita:[^\]]*\]\]/g, '').trim();
  const ps = piezas(c);
  const partes = [`# ${tituloDelLibro(c)}`];
  for (const x of ps.filter((q) => q.pieza.startsWith('cap_'))) {
    const cap = p.capitulos.find((k: Json) => k.n === Number(x.pieza.slice(4)));
    const cuerpo = limpio(x.texto).replace(/^(#[^\n]*\n+)+/, '');
    if (!cap) { partes.push(cuerpo); continue; }
    const ft = salida(`titulos/cap_${cap.n}.json`);
    const t3 = c.existe(ft) ? String(leerJSON(c, ft).titulo || '').trim() : '';
    partes.push(`# ${romano(cap.n)}${t3 && tituloValido(t3, cuerpo) ? ` · ${t3}` : ''}\n\n${cuerpo}`);
  }
  const carta = ps.find((q) => q.pieza === 'carta');
  if (carta) {
    // El título de la carta es una frase suya (con titulo_id) o el fijo.
    const propio = p.carta?.titulo_id && String(p.carta?.titulo || '').trim();
    partes.push(`# ${propio || T.carta}\n\n${limpio(carta.texto)}`);
  }
  const frases = ps.find((q) => q.pieza === 'sus_frases');
  if (frases) partes.push(`# ${T.frases}\n\n${frases.texto.trim()}`);
  c.escribir('libro.md', partes.join('\n\n') + '\n');
  return `libro.md: ${partes.join(' ').split(/\s+/).length} palabras`;
}

/** Lo que el informe de Familiar no sabe de historia: Sus frases que no fue y lo que salió de ella. */
export function informeHistoria(c: Carpeta): string {
  if (!c.existe(RUTA_SUS_FRASES_CONTROL)) return '';
  const s = leerJSON(c, RUTA_SUS_FRASES_CONTROL);
  const L = ['', `## Sus frases: ${s.frases} textuales${s.va ? '' : ` (menos de ${MINIMO_SUS_FRASES}: la página no va)`}`, ''];
  for (const f of s.salen || []) L.push(`- no pasa C6 (no es textual) · ${f.id}: «${String(f.texto || '').slice(0, 140)}»`);
  if (!(s.salen || []).length) L.push('Todas las que propuso el paso 3e son textuales.');
  return L.join('\n') + '\n';
}
