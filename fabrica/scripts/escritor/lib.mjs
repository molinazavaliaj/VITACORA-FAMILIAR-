// Herramientas comunes de la receta nueva del escritor (docs/v3/escritor/receta.md).
// La receta es la fuente: los prompts se leen de ahí, no se copian acá.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const DOCS = path.resolve(AQUI, '../../../docs/v3/escritor');

export const leer = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
export const existe = (p) => fs.existsSync(p);
export const leerJSON = (p) => JSON.parse(leer(p).replace(/^﻿/, '').replace(/^```(json)?\s*/, '').replace(/```\s*$/, ''));
export const escribir = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8'); };

/** Bloques de código (```) que siguen a un encabezado "### Paso X" de la receta. */
export function promptsDe(encabezado) {
  const receta = leer(path.join(DOCS, 'receta.md'));
  const i = receta.indexOf(encabezado);
  if (i < 0) throw new Error(`No está "${encabezado}" en la receta`);
  const fin = receta.indexOf('\n### ', i + 5);
  const tramo = receta.slice(i, fin < 0 ? undefined : fin);
  return [...tramo.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1].trim());
}

export const guia = () => leer(path.join(DOCS, 'guia-biografia.md'));

export function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export const palabras = (s) => norm(s).split(' ').filter(Boolean);

/** Respuestas del material: [{id, pregunta, texto}] (sin las "paso"). */
export function respuestas(dir) {
  const xml = leer(path.join(dir, 'entradas', 'respuestas.xml'));
  const out = [];
  for (const m of xml.matchAll(/<respuesta id="(R\d+)"[^>]*>([\s\S]*?)<\/respuesta>/g)) {
    const pregunta = (m[2].match(/<pregunta>([\s\S]*?)<\/pregunta>/) || [])[1] || '';
    const texto = (m[2].match(/<texto>([\s\S]*?)<\/texto>/) || [])[1] || '';
    if (/^\s*paso\s*$/i.test(texto)) continue;
    out.push({ id: m[1], pregunta: pregunta.trim(), texto: texto.trim() });
  }
  return out;
}

export function ficha(dir) {
  const f = leer(path.join(dir, 'entradas', 'ficha.xml')).trim();
  const r = path.join(dir, 'entradas', 'confirmado.xml');
  const conf = existe(r) ? `\n<confirmado_por_el_narrador>\n${leer(r).trim()}\n</confirmado_por_el_narrador>` : '';
  return `${f}${conf}`;
}

export function nombreDePila(dir) {
  const f = leer(path.join(dir, 'entradas', 'ficha.xml'));
  const m = f.match(/Nombre:\s*([^\s(,]+)/);
  return m ? m[1] : 'quien narra';
}

export const salida = (dir, f) => path.join(dir, 'salidas', f);

/** Piezas escritas, en orden: [{pieza, archivo, texto}] */
export function piezas(dir) {
  const out = [];
  const s = (f) => salida(dir, f);
  if (existe(s('primera_pagina.md'))) out.push({ pieza: 'primera_pagina', archivo: s('primera_pagina.md'), texto: leer(s('primera_pagina.md')) });
  const caps = fs.existsSync(path.join(dir, 'salidas')) ? fs.readdirSync(path.join(dir, 'salidas')).filter((f) => /^capitulo_\d+\.md$/.test(f)).sort() : [];
  for (const f of caps) out.push({ pieza: `cap_${Number(f.match(/\d+/)[0])}`, archivo: s(f), texto: leer(s(f)) });
  if (existe(s('sus_frases.md'))) out.push({ pieza: 'sus_frases', archivo: s('sus_frases.md'), texto: leer(s('sus_frases.md')) });
  if (existe(s('carta.md'))) out.push({ pieza: 'carta', archivo: s('carta.md'), texto: leer(s('carta.md')) });
  return out;
}

export function tituloImpreso(cap) {
  if (cap.titulo?.texto) return cap.titulo.texto;
  const a = cap.anios || {};
  return a.seguros && a.desde ? `${cap.etapa}, ${a.desde}–${a.hasta || 'hoy'}` : cap.etapa || `Capítulo ${cap.n}`;
}

export function respuestasXML(rs) {
  return rs.map((r) => `<respuesta id="${r.id}">\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`).join('\n\n');
}

/** Esquema JSON del paso (bloque ```json) más la línea de "Valores cerrados" o la que sigue al esquema, si hay. */
export function esquemaDe(encabezado) {
  const receta = leer(path.join(DOCS, 'receta.md'));
  const i = receta.indexOf(encabezado);
  const fin = receta.indexOf('\n### ', i + 5);
  const tramo = receta.slice(i, fin < 0 ? undefined : fin);
  const m = tramo.match(/```json\n([\s\S]*?)```\n+([^\n|][^\n]*)?/);
  if (!m) return '';
  const nota = m[2] && !m[2].startsWith('#') ? `\n${m[2].trim()}` : '';
  return `\n\nEsquema de salida:\n${m[1].trim()}${nota}`;
}
