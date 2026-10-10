// Herramientas comunes de la receta nueva del escritor (docs/v3/escritor/receta.md).
// La receta es la fuente: los prompts se leen de ahí, no se copian acá.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
// v5.5: la receta es la nueva (docs/v5/escritor-v55); la guía sigue siendo la de la v5.
export const DOCS = path.resolve(AQUI, '../../../docs/v5/escritor');
export const RECETA = path.resolve(AQUI, '../../../docs/v5/escritor-v55/receta.md');

export const leer = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
export const existe = (p) => fs.existsSync(p);
export const leerJSON = (p) => JSON.parse(leer(p).replace(/^﻿/, '').replace(/^```(json)?\s*/, '').replace(/```\s*$/, ''));
export const escribir = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8'); };

/** Bloques de código (```) que siguen a un encabezado "### Paso X" de la receta. */
export function promptsDe(encabezado) {
  const receta = leer(RECETA);
  const i = receta.indexOf(encabezado);
  if (i < 0) throw new Error(`No está "${encabezado}" en la receta`);
  const fin = receta.indexOf('\n### ', i + 5);
  const tramo = receta.slice(i, fin < 0 ? undefined : fin);
  // Línea por línea: un ``` que cierra un ```json no abre un bloque nuevo (pasaba en el Paso 4 y el 6).
  const bloques = [];
  let abierto = null;
  for (const l of tramo.split('\n')) {
    if (abierto === null) { const m = l.match(/^```(\w*)\s*$/); if (m) abierto = { lengua: m[1], lineas: [] }; continue; }
    if (/^```\s*$/.test(l)) { if (!abierto.lengua) bloques.push(abierto.lineas.join('\n').trim()); abierto = null; continue; }
    abierto.lineas.push(l);
  }
  return bloques;
}

export const guia = () => leer(path.join(DOCS, 'guia.md'));

export function norm(s) {
  // v5.4: la ela geminada ("col·legi") no parte la palabra.
  return s.replace(/[·•]/g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
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

// v5.4: el idioma del libro sale de la ficha ("Idioma del libro: catalán"); sin dato, castellano.
export const idiomaDeFicha = (t) => (/^\s*idioma[^:\n]*:\s*(catal|ca\b)/im.test(t) ? 'ca' : 'es');
export const idioma = (dir) => idiomaDeFicha(leer(path.join(dir, 'entradas', 'ficha.xml')));
export const titulosFijos = (id) => (id === 'ca'
  ? { antes: 'Abans de tancar', frases: 'Les seves frases', carta: 'Per als meus' }
  : { antes: 'Antes de cerrar', frases: 'Sus frases', carta: 'Para los míos' });

// v5.5, Paso 3t: el título del capítulo (de 2 a 7 palabras) usa solo palabras con contenido que están en el capítulo.
const VACIAS_T = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'y', 'e', 'o', 'que', 'con', 'por', 'para', 'mi', 'mis', 'su', 'sus', 'lo', 'se', 'me', 'es', 'era', 'l', 'els', 'les', 'i', 'amb', 'per', 'meu', 'meva', 'seu', 'seva', 'd', 'n']);
export function tituloValido(titulo, texto) {
  const ws = palabras(titulo || '');
  if (ws.length < 2 || ws.length > 7) return false;
  const cap = palabras(texto), raiz = (w) => w.slice(0, Math.max(4, w.length - 2));
  return ws.filter((w) => !VACIAS_T.has(w) && w.length > 2).every((w) => cap.some((c) => c === w || (w.length > 4 && c.startsWith(raiz(w)))));
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
  if (existe(s('antes_de_cerrar.md'))) out.push({ pieza: 'antes_de_cerrar', archivo: s('antes_de_cerrar.md'), texto: leer(s('antes_de_cerrar.md')) });
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
  const receta = leer(RECETA);
  const i = receta.indexOf(encabezado);
  const fin = receta.indexOf('\n### ', i + 5);
  const tramo = receta.slice(i, fin < 0 ? undefined : fin);
  const m = tramo.match(/```json\n([\s\S]*?)```\n+([^\n|][^\n]*)?/);
  if (!m) return '';
  const nota = m[2] && !m[2].startsWith('#') ? `\n${m[2].trim()}` : '';
  return `\n\nEsquema de salida:\n${m[1].trim()}${nota}`;
}

/** Marcas de rastreo [[R12,R15]] al final de cada párrafo (receta v2). */
// También [[FICHA]] (lo que sale de la ficha): en la prueba 3.1 quedaron 27 impresas.
export const sinMarcas = (t) => t.replace(/[ \t]*\[\[\s*(?:R\d|FICHA)[^\]]*\]\]/g, '');
export const marcas = (t) => [...t.matchAll(/\[\[([^\]]*)\]\]/g)].flatMap((m) => m[1].split(/[,\s]+/).map((x) => x.trim()).filter((x) => /^R\d+$/.test(x)));

/** El plan puede citar episodios (E..) donde se esperan respuestas (R..): se pasan a sus R. */
export function planConR(plan, reg) {
  const eps = Object.fromEntries((reg?.episodios || []).map((e) => [e.id, e.ids]));
  const aR = (ids) => [...new Set((ids || []).flatMap((i) => (/^E\d+$/.test(i) ? eps[i] || [] : [i])))];
  const p = structuredClone(plan);
  if (p.carta) p.carta.ids = aR(p.carta.ids);
  if (p.antes_de_cerrar) p.antes_de_cerrar.ids = aR(p.antes_de_cerrar.ids);
  p.sus_frases = (p.sus_frases || []).map((f) => ({ ...f, id: /^E\d+$/.test(f.id) ? (eps[f.id] || [f.id])[0] : f.id, ids: aR([f.id]) }));
  return p;
}

/**
 * Opción B (Naza, 01/10): cada paso recibe solo las secciones de la guía que le tocan
 * (las que la receta nombra en "Mandan"), más el resumen de arriba. Claves: "1".."13", "A1".."A7".
 */
export const SECCIONES = { // v4: la tabla del final de docs/v4/escritor/guia.md
  registro: ['2', '6', '9', '14', 'A1', 'A3', 'A4', 'A5'],
  plan: ['1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '13', 'A4', 'A5', 'A7'],
  primera: ['1', '2', '3', '12', '13', 'A2', 'A3', 'A6'],
  capitulo: ['2', '6', 'A3'], // corto a propósito (Naza 02/10): lo demás lo controla el código
  carta: ['2', '3', '11', '14', 'A6'],
  antes: ['2', '3', '11', '14', 'A6'],
  cotejo: ['3', '11', '14'],
  hechos: ['2', '9', '14', '15'],
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

/** Archivo de salida de cada pieza. */
export const archivoDe = (p) => ({ primera_pagina: 'primera_pagina.md', carta: 'carta.md', sus_frases: 'sus_frases.md', antes_de_cerrar: 'antes_de_cerrar.md' })[p] || `capitulo_${String(Number(p.replace('cap_', ''))).padStart(2, '0')}.md`;

/**
 * La pieza a la que le toca una respuesta (tabla R → pieza de la receta, 2b).
 * Con `ps` (piezas con marcas), primero la pieza que ya la marca; si no, la que dice el plan.
 */
export function piezaDeR(plan, reg, rid, ps = []) {
  const yaMarcada = ps.find((p) => p.pieza !== 'sus_frases' && marcas(p.texto).includes(rid));
  if (yaMarcada) return yaMarcada.pieza;
  if ((plan.carta?.ids || []).includes(rid)) return 'carta';
  if ((plan.antes_de_cerrar?.ids || []).includes(rid)) return 'antes_de_cerrar';
  const eps = (reg.episodios || []).filter((e) => e.ids.includes(rid)).map((e) => e.id);
  for (const c of plan.capitulos) if ((c.piezas || []).some((p) => eps.includes(p.episodio))) return `cap_${c.n}`;
  if ((plan.primera_pagina?.que_dice_de_si_ids || []).includes(rid)) return 'primera_pagina';
  return 'cap_' + plan.capitulos[plan.capitulos.length - 1].n;
}

/**
 * Receta v3.1, paso 6: el arreglo devuelve solo cambios (antes → después) y el código los aplica,
 * así lo que no tenía problema queda igual letra por letra. Un `antes` que no está tal cual no se aplica
 * (resultado "no_aplicado": el problema queda abierto). Devuelve el texto nuevo y los cambios, uno por problema.
 */
export function armarCambios(texto, cambios) {
  let t = texto;
  const out = [];
  for (const c of cambios || []) {
    const nums = Array.isArray(c.problema) ? c.problema : [c.problema];
    let resultado = c.resultado;
    if (resultado === 'cambiado') {
      const antes = (c.antes || '').replace(/\r\n/g, '\n').trim();
      if (antes && t.includes(antes)) t = t.replace(antes, () => (c.despues || '').replace(/\r\n/g, '\n').trim());
      else resultado = 'no_aplicado';
    }
    for (const n of nums) out.push({ ...c, problema: n, resultado });
  }
  // Un párrafo borrado (despues vacío) no deja hueco de líneas en blanco (lo vio el juez de la prueba v3.2).
  return { texto: t.replace(/\n{3,}/g, '\n\n'), cambios: out };
}

/**
 * v5 (novelista con red): las respuestas de un capítulo = las de los episodios que el plan le reparte
 * más las que otros capítulos le pasaron (pendientes/cap_N.json, ver afuera.mjs).
 */
export function idsDeCapitulo(dir, n) {
  const plan = leerJSON(salida(dir, 'plan.json')), reg = leerJSON(salida(dir, 'registro.json'));
  const eps = Object.fromEntries((reg.episodios || []).map((e) => [e.id, e.ids]));
  const cap = plan.capitulos.find((c) => c.n === n);
  const ids = new Set((cap?.piezas || []).flatMap((p) => eps[p.episodio] || []).filter((i) => /^R\d+$/.test(i)));
  const pend = path.join(dir, 'pendientes', `cap_${n}.json`);
  if (existe(pend)) for (const i of leerJSON(pend)) ids.add(i);
  return ids;
}

/** v5: el novelista devuelve el capítulo y, después de "---", {"afuera": [...]}. Separa las dos cosas. */
export function separarAfuera(t) {
  const corte = t.lastIndexOf('\n---\n');
  if (corte < 0) return { texto: t.trim(), afuera: [] };
  try {
    const j = JSON.parse(t.slice(corte + 5).trim().replace(/^```(json)?\s*/, '').replace(/```\s*$/, ''));
    return { texto: t.slice(0, corte).trim(), afuera: Array.isArray(j.afuera) ? j.afuera : [] };
  } catch { return { texto: t.trim(), afuera: [] }; }
}

/** v5: a dónde va lo que quedó afuera del capítulo n. Un capítulo posterior lo recibe antes de escribirse; lo demás va al arreglo (C18 lo ve como "falta R.."). */
export function destinosAfuera(afuera, n) {
  const pendientes = {}, alArreglo = [], noEntra = [];
  for (const a of afuera) {
    const m = String(a.a_donde || '').match(/^cap_(\d+)$/);
    if (m && Number(m[1]) > n) (pendientes[`cap_${Number(m[1])}`] ||= []).push(a.id);
    // v5.2: una respuesta que entera es un "no" de la entrevista no va a ningún lado (y C18 no la pide).
    else if (a.a_donde === 'no_entra') noEntra.push(a.id);
    else alArreglo.push(a.id);
  }
  return { pendientes, alArreglo, noEntra };
}

/** v5.2: las respuestas que el novelista declaró "no_entra" (controles/afuera-cap_N.json). */
export function noEntran(dir) {
  const d = path.join(dir, 'controles');
  if (!existe(d)) return new Set();
  return new Set(fs.readdirSync(d).filter((f) => /^afuera-cap_\d+\.json$/.test(f)).flatMap((f) => leerJSON(path.join(d, f)).noEntra || []));
}
