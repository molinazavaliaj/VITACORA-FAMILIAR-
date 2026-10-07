// Funciones puras de fabrica/scripts/escritor-v55/lib.mjs, portadas letra por letra.
// Si cambia el .mjs, cambia esto: test/escritor/texto.test.ts compara las dos.
import type { IdiomaLibro, Json, PiezaTexto, Respuesta } from './tipos.js';

export function norm(s: string): string {
  // v5.4: la ela geminada ("col·legi") no parte la palabra.
  return s.replace(/[·•]/g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}
export const palabras = (s: string): string[] => norm(s).split(' ').filter(Boolean);

// v5.4: el idioma del libro sale de la ficha ("Idioma del libro: catalán"); sin dato, castellano.
export const idiomaDeFicha = (t: string): IdiomaLibro => (/^\s*idioma[^:\n]*:\s*(catal|ca\b)/im.test(t) ? 'ca' : 'es');
export const titulosFijos = (id: IdiomaLibro): { antes: string; frases: string; carta: string } => (id === 'ca'
  ? { antes: 'Abans de tancar', frases: 'Les seves frases', carta: 'Per als meus' }
  : { antes: 'Antes de cerrar', frases: 'Sus frases', carta: 'Para los míos' });

// v5.5, Paso 3t: el título del capítulo (de 2 a 7 palabras) usa solo palabras con contenido que están en el capítulo.
const VACIAS_T = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'en', 'y', 'e', 'o', 'que', 'con', 'por', 'para', 'mi', 'mis', 'su', 'sus', 'lo', 'se', 'me', 'es', 'era', 'l', 'els', 'les', 'i', 'amb', 'per', 'meu', 'meva', 'seu', 'seva', 'd', 'n']);
export function tituloValido(titulo: string, texto: string): boolean {
  const ws = palabras(titulo || '');
  if (ws.length < 2 || ws.length > 7) return false;
  const cap = palabras(texto), raiz = (w: string) => w.slice(0, Math.max(4, w.length - 2));
  // 07/10: también las palabras de 4 letras aceptan otra conjugación ("saca" en un capítulo que dice "sacaba").
  return ws.filter((w) => !VACIAS_T.has(w) && w.length > 2).every((w) => cap.some((c) => c === w || (w.length >= 4 && c.startsWith(raiz(w)))));
}

export function tituloImpreso(cap: Json): string {
  if (cap.titulo?.texto) return cap.titulo.texto;
  const a = cap.anios || {};
  return a.seguros && a.desde ? `${cap.etapa}, ${a.desde}–${a.hasta || 'hoy'}` : cap.etapa || `Capítulo ${cap.n}`;
}

export function respuestasXML(rs: Respuesta[]): string {
  return rs.map((r) => `<respuesta id="${r.id}">\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`).join('\n\n');
}

/** Marcas de rastreo [[R12,R15]] al final de cada párrafo (receta v2). */
// También [[FICHA]] (lo que sale de la ficha): en la prueba 3.1 quedaron 27 impresas.
export const sinMarcas = (t: string): string => t.replace(/[ \t]*\[\[\s*(?:R\d|FICHA)[^\]]*\]\]/g, '');
export const marcas = (t: string): string[] => [...t.matchAll(/\[\[([^\]]*)\]\]/g)].flatMap((m) => m[1].split(/[,\s]+/).map((x) => x.trim()).filter((x) => /^R\d+$/.test(x)));

/** El plan puede citar episodios (E..) donde se esperan respuestas (R..): se pasan a sus R. */
export function planConR(plan: Json, reg: Json): Json {
  const eps = Object.fromEntries((reg?.episodios || []).map((e: Json) => [e.id, e.ids]));
  const aR = (ids: Json) => [...new Set((ids || []).flatMap((i: string) => (/^E\d+$/.test(i) ? eps[i] || [] : [i])))];
  const p = structuredClone(plan);
  if (p.carta) p.carta.ids = aR(p.carta.ids);
  if (p.antes_de_cerrar) p.antes_de_cerrar.ids = aR(p.antes_de_cerrar.ids);
  p.sus_frases = (p.sus_frases || []).map((f: Json) => ({ ...f, id: /^E\d+$/.test(f.id) ? (eps[f.id] || [f.id])[0] : f.id, ids: aR([f.id]) }));
  return p;
}

/** Archivo de salida de cada pieza. */
export const archivoDe = (p: string): string => ({ primera_pagina: 'primera_pagina.md', carta: 'carta.md', sus_frases: 'sus_frases.md', antes_de_cerrar: 'antes_de_cerrar.md' })[p] || `capitulo_${String(Number(p.replace('cap_', ''))).padStart(2, '0')}.md`;

/**
 * La pieza a la que le toca una respuesta (tabla R → pieza de la receta, 2b).
 * Con `ps` (piezas con marcas), primero la pieza que ya la marca; si no, la que dice el plan.
 */
export function piezaDeR(plan: Json, reg: Json, rid: string, ps: PiezaTexto[] = []): string {
  const yaMarcada = ps.find((p) => p.pieza !== 'sus_frases' && marcas(p.texto).includes(rid));
  if (yaMarcada) return yaMarcada.pieza;
  if ((plan.carta?.ids || []).includes(rid)) return 'carta';
  if ((plan.antes_de_cerrar?.ids || []).includes(rid)) return 'antes_de_cerrar';
  const eps = (reg.episodios || []).filter((e: Json) => e.ids.includes(rid)).map((e: Json) => e.id);
  for (const c of plan.capitulos) if ((c.piezas || []).some((p: Json) => eps.includes(p.episodio))) return `cap_${c.n}`;
  if ((plan.primera_pagina?.que_dice_de_si_ids || []).includes(rid)) return 'primera_pagina';
  return 'cap_' + plan.capitulos[plan.capitulos.length - 1].n;
}

/**
 * Receta v3.1, paso 6: el arreglo devuelve solo cambios (antes → después) y el código los aplica,
 * así lo que no tenía problema queda igual letra por letra. Un `antes` que no está tal cual no se aplica
 * (resultado "no_aplicado": el problema queda abierto). Devuelve el texto nuevo y los cambios, uno por problema.
 */
export function armarCambios(texto: string, cambios: Json[]): { texto: string; cambios: Json[] } {
  let t = texto;
  const out: Json[] = [];
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

/** v5: el novelista devuelve el capítulo y, después de "---", {"afuera": [...]}. Separa las dos cosas. */
export function separarAfuera(t: string): { texto: string; afuera: Json[] } {
  const corte = t.lastIndexOf('\n---\n');
  if (corte < 0) return { texto: t.trim(), afuera: [] };
  try {
    const j = JSON.parse(t.slice(corte + 5).trim().replace(/^```(json)?\s*/, '').replace(/```\s*$/, ''));
    return { texto: t.slice(0, corte).trim(), afuera: Array.isArray(j.afuera) ? j.afuera : [] };
  } catch { return { texto: t.trim(), afuera: [] }; }
}

/** v5: a dónde va lo que quedó afuera del capítulo n. Un capítulo posterior lo recibe antes de escribirse; lo demás va al arreglo (C18 lo ve como "falta R.."). */
export function destinosAfuera(afuera: Json[], n: number): { pendientes: Record<string, string[]>; alArreglo: string[]; noEntra: string[] } {
  const pendientes: Record<string, string[]> = {}, alArreglo: string[] = [], noEntra: string[] = [];
  for (const a of afuera) {
    const m = String(a.a_donde || '').match(/^cap_(\d+)$/);
    if (m && Number(m[1]) > n) (pendientes[`cap_${Number(m[1])}`] ||= []).push(a.id);
    // v5.2: una respuesta que entera es un "no" de la entrevista no va a ningún lado (y C18 no la pide).
    else if (a.a_donde === 'no_entra') noEntra.push(a.id);
    else alArreglo.push(a.id);
  }
  return { pendientes, alArreglo, noEntra };
}
