// fabrica/src/escritor/lectura.ts
// Lo que lib.mjs leía de la carpeta del escritor, sobre la Carpeta en memoria (copiado letra por letra).
import { Carpeta, leerJSON } from './carpeta.js';
import { idiomaDeFicha } from './texto.js';
import type { IdiomaLibro, PiezaEscrita, Respuesta } from './tipos.js';

export const salida = (f: string): string => `salidas/${f}`;

/** lib.mjs:44-54. */
export function respuestas(c: Carpeta): Respuesta[] {
  const xml = c.leer('entradas/respuestas.xml');
  const out: Respuesta[] = [];
  for (const m of xml.matchAll(/<respuesta id="(R\d+)"[^>]*>([\s\S]*?)<\/respuesta>/g)) {
    const pregunta = (m[2].match(/<pregunta>([\s\S]*?)<\/pregunta>/) || [])[1] || '';
    const texto = (m[2].match(/<texto>([\s\S]*?)<\/texto>/) || [])[1] || '';
    if (/^\s*paso\s*$/i.test(texto)) continue;
    out.push({ id: m[1], pregunta: pregunta.trim(), texto: texto.trim() });
  }
  return out;
}

/** lib.mjs:58. */
export const idioma = (c: Carpeta): IdiomaLibro => idiomaDeFicha(c.leer('entradas/ficha.xml'));

/** lib.mjs:72-77 (con `<confirmado_por_el_narrador>` si hay entradas/confirmado.xml). */
export function ficha(c: Carpeta): string {
  const f = c.leer('entradas/ficha.xml').trim();
  const r = 'entradas/confirmado.xml';
  const conf = c.existe(r) ? `\n<confirmado_por_el_narrador>\n${c.leer(r).trim()}\n</confirmado_por_el_narrador>` : '';
  return `${f}${conf}`;
}

/** lib.mjs:79-83. */
export function nombreDePila(c: Carpeta): string {
  const f = c.leer('entradas/ficha.xml');
  const m = f.match(/Nombre:\s*([^\s(,]+)/);
  return m ? m[1] : 'quien narra';
}

/** lib.mjs:88-98; `archivo` queda como ruta de la Carpeta (`salidas/capitulo_01.md`). */
export function piezas(c: Carpeta): PiezaEscrita[] {
  const out: PiezaEscrita[] = [];
  const s = (f: string): string => salida(f);
  if (c.existe(s('primera_pagina.md'))) out.push({ pieza: 'primera_pagina', archivo: s('primera_pagina.md'), texto: c.leer(s('primera_pagina.md')) });
  const caps = c.existeCarpeta('salidas') ? c.listar('salidas').filter((f) => /^capitulo_\d+\.md$/.test(f)).sort() : [];
  for (const f of caps) out.push({ pieza: `cap_${Number((f.match(/\d+/) as RegExpMatchArray)[0])}`, archivo: s(f), texto: c.leer(s(f)) });
  if (c.existe(s('antes_de_cerrar.md'))) out.push({ pieza: 'antes_de_cerrar', archivo: s('antes_de_cerrar.md'), texto: c.leer(s('antes_de_cerrar.md')) });
  if (c.existe(s('sus_frases.md'))) out.push({ pieza: 'sus_frases', archivo: s('sus_frases.md'), texto: c.leer(s('sus_frases.md')) });
  if (c.existe(s('carta.md'))) out.push({ pieza: 'carta', archivo: s('carta.md'), texto: c.leer(s('carta.md')) });
  return out;
}

/** lib.mjs:210-218. */
export function idsDeCapitulo(c: Carpeta, n: number): Set<string> {
  const plan = leerJSON(c, salida('plan.json')), reg = leerJSON(c, salida('registro.json'));
  const eps = Object.fromEntries((reg.episodios || []).map((e: { id: string; ids: string[] }) => [e.id, e.ids]));
  const cap = plan.capitulos.find((x: { n: number }) => x.n === n);
  const ids = new Set<string>((cap?.piezas || []).flatMap((p: { episodio: string }) => eps[p.episodio] || []).filter((i: string) => /^R\d+$/.test(i)));
  const pend = `pendientes/cap_${n}.json`;
  if (c.existe(pend)) for (const i of leerJSON(c, pend)) ids.add(i);
  return ids;
}

/** lib.mjs:244-248. */
export function noEntran(c: Carpeta): Set<string> {
  if (!c.existeCarpeta('controles')) return new Set();
  return new Set(c.listar('controles').filter((f) => /^afuera-cap_\d+\.json$/.test(f)).flatMap((f) => leerJSON(c, `controles/${f}`).noEntra || []));
}
