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

/** Marcas de rastreo [[R12,R15]] al final de cada párrafo (receta v2). */
export const sinMarcas = (t) => t.replace(/[ \t]*\[\[\s*R[^\]]*\]\]/g, '');
export const marcas = (t) => [...t.matchAll(/\[\[([^\]]*)\]\]/g)].flatMap((m) => m[1].split(/[,\s]+/).map((x) => x.trim()).filter((x) => /^R\d+$/.test(x)));

/** El plan puede citar episodios (E..) donde se esperan respuestas (R..): se pasan a sus R. */
export function planConR(plan, reg) {
  const eps = Object.fromEntries((reg?.episodios || []).map((e) => [e.id, e.ids]));
  const aR = (ids) => [...new Set((ids || []).flatMap((i) => (/^E\d+$/.test(i) ? eps[i] || [] : [i])))];
  const p = structuredClone(plan);
  if (p.carta) p.carta.ids = aR(p.carta.ids);
  p.sus_frases = (p.sus_frases || []).map((f) => ({ ...f, id: /^E\d+$/.test(f.id) ? (eps[f.id] || [f.id])[0] : f.id, ids: aR([f.id]) }));
  return p;
}

/**
 * Opción B (Naza, 01/10): cada paso recibe solo las secciones de la guía que le tocan
 * (las que la receta nombra en "Mandan"), más el resumen de arriba. Claves: "1".."13", "A1".."A7".
 */
export const SECCIONES = {
  registro: ['5', '10', 'A1', 'A3', 'A4', 'A5'],
  plan: ['1', '2', '6', '7', '8', 'A4', 'A5', 'A7'],
  primera: ['1', '9', 'A3'],
  capitulo: ['2', '3', '4', '5', '7', '8', '9', '10', 'A2', 'A6', 'A7'],
  carta: ['8', '10'],
  hechos: ['5', '10', '13'],
  lectura: null, // la lectura no lleva el material: va la guía entera
};
export function guiaDe(paso) {
  const g = guia();
  const claves = SECCIONES[paso];
  if (!claves) return g;
  const partes = g.split(/\n(?=## |### A\d)/);
  const tomar = (p) => {
    const m = p.match(/^(?:## (\d+)\.|### (A\d)\.)/);
    return m && claves.includes(m[1] || m[2]);
  };
  const resumen = partes.find((p) => p.startsWith('## Si te acordás'));
  return [partes[0], resumen, ...partes.filter(tomar)].filter(Boolean).join('\n');
}
