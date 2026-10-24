// Los controles del escritor de historia (receta, sección 3). Usa los de Familiar sin tocarlos
// (escritor/controles/correr.ts y estructura.ts) y cambia lo que el libro de una historia tiene distinto:
//   - C14 (registro): `historia`, `propias`, `tramo` en cada episodio, `a_quien` "quien_era"; no hay `balance`;
//     la ficha de voz vale con menos de 15 frases si no hay más (nunca más de 20).
//   - C12: cuentan como material también las palabras de «Tema» y «La historia, en sus palabras» de la ficha; el
//     título fijo de la carta no se controla.
//   - C13 (plan): de 4 a 6 capítulos, `hilo_libro`, un solo golpe del libro, sin primera página ni Antes de cerrar,
//     cada id de `registro.propias` en un capítulo, el último capítulo cierra en una imagen del después.
//   - C19: lo que le habla a quien era va a la carta; lo que le habla a la familia, a un capítulo.
//   - C20: solo el tope de reflexiones del último capítulo (lo de la carta a la familia es de Familiar).
//   - En las piezas, C19 y C23 de Familiar no corren (C19 va con la regla de arriba; no hay Antes de cerrar).
// Mismo formato de salida que Familiar (controles/<que>.json), así el orquestador, los reintentos y el arreglo
// leen lo mismo.
import { Carpeta, leerJSON } from '../escritor/carpeta.js';
import { controlar, type QueControl, type ResultadoControl } from '../escritor/controles/correr.js';
import { c12, c14, c33 } from '../escritor/controles/estructura.js';
import { ficha, respuestas, salida } from '../escritor/lectura.js';
import { marcas, norm, palabras, planConR } from '../escritor/texto.js';
import type { Json, Problema, Respuesta } from '../escritor/tipos.js';
import { respuestasConOrigen, type RespuestaHistoria } from './lectura.js';
import { TRAMOS } from './material/tipos.js';

const A_QUIEN = ['familia', 'lector', 'quien_era', 'nadie'];
const TIPOS = ['episodio', 'dato', 'reflexion', 'gusto', 'mensaje'];
const MOMENTOS = ['', 'alto', 'bajo', 'giro', 'decision_dificil'];
/** Las líneas de C14 de Familiar que en historia son otra regla (abajo). */
const C14_DE_FAMILIA = [/^C14 episodio \S+: a_quien tiene que ser familia, lector o nadie$/, /^C14 voz: \d+ frases \(van de 15 a 20\)$/];
/** Las de quien regala y las del panel (el origen lo dice: material/filas.ts). */
const esPropia = (r: RespuestaHistoria): boolean => /la dejó escrita/.test(r.origen);

export function c14Historia(reg: Json, rs: RespuestaHistoria[], fichaTxt: string): string[] {
  const out = c14(reg, rs, fichaTxt).filter((l) => !C14_DE_FAMILIA.some((re) => re.test(l)));
  const ids = new Set(rs.map((r) => r.id));
  if (!reg?.historia || typeof reg.historia !== 'object') out.push('C14: falta "historia" (de qué se trata el libro, con el tema y sus palabras)');
  for (const e of reg?.episodios || []) {
    if (!A_QUIEN.includes(e.a_quien)) out.push(`C14 episodio ${e.id}: a_quien tiene que ser familia, lector, quien_era o nadie`);
    if (!TRAMOS.includes(e.tramo)) out.push(`C14 episodio ${e.id}: tramo tiene que ser ${TRAMOS.join(', ')}`);
    if (e.tipo === 'balance') out.push(`C14 episodio ${e.id}: en este libro no hay "balance" (lo que dice mirando para atrás es una reflexion pegada a su escena o un episodio del después)`);
    else if (!TIPOS.includes(e.tipo)) out.push(`C14 episodio ${e.id}: tipo tiene que ser ${TIPOS.join(', ')}`);
    if (!MOMENTOS.includes(e.momento_clave ?? '')) out.push(`C14 episodio ${e.id}: momento_clave tiene que ser "", alto, bajo, giro o decision_dificil`);
  }
  const fr = reg?.voz?.frases || [];
  if (!fr.length || fr.length > 20) out.push(`C14 voz: ${fr.length} frases (van de 15 a 20; con menos material, las que haya)`);
  if (!Array.isArray(reg?.propias)) out.push('C14: falta "propias" (puede ser [])');
  const deProp = new Set((reg?.propias || []).map((p: Json) => p.id));
  const epIds = new Set((reg?.episodios || []).map((e: Json) => e.id));
  for (const p of reg?.propias || []) {
    if (!ids.has(p.id)) out.push(`C14 propias: el id ${p.id} no existe`);
    else if (!esPropia(rs.find((r) => r.id === p.id) as RespuestaHistoria)) out.push(`C14 propias: ${p.id} no es una respuesta a una pregunta de quien regala`);
    if (!epIds.has(p.episodio)) out.push(`C14 propias: ${p.id} apunta al episodio ${p.episodio}, que no existe`);
  }
  for (const r of rs) if (esPropia(r) && !deProp.has(r.id)) out.push(`C14 propias: ${r.id} es una respuesta a una pregunta de quien regala y no está en "propias"`);
  return out;
}

/** C12 con las palabras de la ficha (Tema y La historia en sus palabras) como material, y sin el título fijo de la carta. */
export function c12Historia(plan: Json, rs: Respuesta[], reg: Json, fichaTxt: string): string[] {
  const deFicha = fichaTxt.split('\n').filter((l) => /^(Tema|La historia, en sus palabras):/.test(l)).map((l) => l.replace(/^[^:]+:\s*/, '')).join(' ');
  const p = structuredClone(plan);
  if (p.carta && (!p.carta.titulo_id || ['a quien era antes', 'a qui era abans'].includes(norm(p.carta.titulo || '')))) delete p.carta.titulo;
  return c12(p, deFicha ? [...rs, { id: 'FICHA', pregunta: '', texto: deFicha }] : rs, reg);
}

export function c13Historia(plan: Json, reg: Json): string[] {
  const out: string[] = [];
  const caps: Json[] = plan.capitulos || [];
  const eps = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e]));
  const faltan = ` ${norm((plan.faltantes || []).map((f: Json) => `${f.que} ${f.donde || ''}`).join(' '))} `;
  const usados = new Map<string, string[]>();
  for (const c of caps) for (const p of c.piezas || []) usados.set(p.episodio, [...(usados.get(p.episodio) || []), `cap_${c.n}`]);
  const idsSf = new Set((plan.sus_frases || []).map((f: Json) => f.id));
  const idsCarta = new Set(plan.carta?.ids || []);
  for (const e of reg.episodios || []) {
    if (e.no_poner) continue;
    const u = usados.get(e.id) || [];
    if (u.length > 1) out.push(`C13: el episodio ${e.id} está en ${u.join(' y ')} (va una sola vez)`);
    if (!u.length && !e.ids.some((i: string) => idsSf.has(i) || idsCarta.has(i))) out.push(`C13: el episodio ${e.id} ("${String(e.que || '').slice(0, 60)}") no quedó en ningún lado`);
  }
  if (caps.length > 6) out.push(`C13: el plan tiene ${caps.length} capítulos (van de 4 a 6)`);
  if (caps.length < 4 && !faltan.includes(' menos de 4 capitulos ')) out.push(`C13: el plan tiene ${caps.length} capítulos (van de 4 a 6; con menos, un faltante «material para menos de 4 capítulos»)`);
  if (!caps.length) return out;
  if (!plan.hilo_libro?.texto || !(plan.hilo_libro.ids || []).length) out.push('C13: falta hilo_libro con texto e ids (la historia entera en una oración, con un verbo de cambio)');
  if ((plan.primera_pagina && Object.keys(plan.primera_pagina).length) || (plan.antes_de_cerrar?.ids || []).length) out.push('C13: este libro no tiene primera página ni Antes de cerrar');
  const hayEscenas = (reg.episodios || []).some((e: Json) => e.es_escena && !e.no_poner);
  let prev: Json = null;
  for (const c of caps) {
    for (const p of c.piezas || []) {
      const e = eps[p.episodio];
      if (!e) out.push(`C13 cap_${c.n}: el episodio ${p.episodio} no existe en el registro`);
      else if (p.forma === 'escena' && !e.es_escena) out.push(`C13 cap_${c.n}: ${e.id} va como escena y el registro dice que no tiene escena (es_escena: false)`);
      else if (e.momento_clave && p.peso === 'linea') out.push(`C13 cap_${c.n}: ${e.id} es momento clave (${e.momento_clave}) y va con peso "linea": va con peso "clave"`);
    }
    if (hayEscenas && !(c.piezas || []).some((p: Json) => p.forma === 'escena')) out.push(`C13 cap_${c.n}: no tiene ninguna pieza con forma escena (un tramo sin escena se junta con el vecino)`);
    if (!(c.hilo_ids || []).length) out.push(`C13 cap_${c.n}: hilo sin ids`);
    if (c !== caps[caps.length - 1]) for (const p of c.piezas || []) {
      const e = eps[p.episodio];
      if (e && ['dato', 'gusto', 'reflexion'].includes(e.tipo) && e.estado === 'sigue_hoy' && !String(p.por_que_aca || '').trim()) out.push(`C13 cap_${c.n}: ${e.id} ("${String(e.que || '').slice(0, 50)}") es de hoy (${e.tipo}, sigue_hoy) y está en un capítulo anterior sin "por_que_aca": va al último capítulo`);
    }
    if (prev && prev.apertura?.tipo === c.apertura?.tipo) out.push(`C13 cap_${c.n}: abre igual que el anterior (${c.apertura?.tipo})`);
    if (prev && prev.cierre?.tipo === c.cierre?.tipo) out.push(`C13 cap_${c.n}: cierra igual que el anterior (${c.cierre?.tipo})`);
    prev = c;
  }
  const golpes = caps.filter((c) => c.golpe?.episodio);
  if (golpes.length > 1) out.push(`C13: ${golpes.length} capítulos tienen golpe (${golpes.map((c) => `cap_${c.n}`).join(', ')}); el golpe del libro va en uno solo`);
  if (!golpes.length && !(plan.faltantes || []).length) out.push('C13: ningún capítulo tiene el golpe del libro y no hay un faltante que diga por qué');
  const pres = new Map<string, number[]>();
  for (const c of caps) for (const p of c.presenta || []) pres.set(p, [...(pres.get(p) || []), c.n]);
  for (const [p, cs] of pres) if (cs.length > 1) out.push(`C13: ${p} se presenta en los capítulos ${cs.join(' y ')}`);
  // Las respuestas a las preguntas de quien regala, cada una en un capítulo (nunca solas en Sus frases ni en la carta).
  const enCaps = new Set(caps.flatMap((c) => (c.piezas || []).flatMap((p: Json) => eps[p.episodio]?.ids || [])));
  for (const p of reg.propias || []) if (!enCaps.has(p.id)) out.push(`C13: ${p.id} (respuesta a una pregunta de quien regala) no está en ningún capítulo: va al capítulo de su tiempo`);
  // El último capítulo es el del después y cierra en su imagen final.
  const ult = caps[caps.length - 1];
  const imf = ult.imagen_final || {};
  const epImf = eps[imf.episodio];
  const idsHoy = new Set((reg.hoy || []).flatMap((h: Json) => h.ids || []));
  if (!epImf) out.push('C13: el último capítulo no tiene imagen_final con un episodio del registro');
  else {
    if (!(ult.piezas || []).some((p: Json) => p.episodio === imf.episodio)) out.push(`C13: la imagen_final ${imf.episodio} no está en las piezas del último capítulo`);
    if (epImf.tramo !== 'despues' && !epImf.ids.some((i: string) => idsHoy.has(i))) out.push(`C13: la imagen_final ${imf.episodio} no es del después (ni del tramo "despues" ni del bloque "hoy")`);
    if (ult.cierre?.episodio !== imf.episodio) out.push(`C13: el último capítulo no cierra en su imagen_final (cierre ${ult.cierre?.episodio || 'vacío'}, imagen ${imf.episodio})`);
  }
  const tipoDeId = new Map<string, string[]>();
  const aQuienDeId = new Map<string, string[]>();
  for (const e of reg.episodios || []) for (const i of e.ids) { tipoDeId.set(i, [...(tipoDeId.get(i) || []), e.tipo]); aQuienDeId.set(i, [...(aQuienDeId.get(i) || []), e.a_quien]); }
  if (idsCarta.size && plan.carta?.para !== 'quien_era') out.push('C13 carta: "para" es siempre "quien_era"');
  for (const i of idsCarta) if (!(tipoDeId.get(i as string) || []).includes('mensaje') && !(aQuienDeId.get(i as string) || []).includes('quien_era')) out.push(`C13 carta: ${i} no es un mensaje a quien era`);
  for (const f of plan.sus_frases || []) if (palabras(f.contexto || '').length > 20) out.push(`C13 sus_frases ${f.id}: contexto de más de 20 palabras`);
  return out;
}

/** C19 (plan): lo que le habla a quien era va a carta.ids; lo que le habla a la familia, a un capítulo. */
export function c19Historia(plan: Json, reg: Json): string[] {
  const out: string[] = [];
  const carta = new Set(plan.carta?.ids || []);
  for (const e of reg.episodios || []) {
    if (e.no_poner) continue;
    if (e.a_quien === 'quien_era' && !e.ids.every((i: string) => carta.has(i))) out.push(`C19: el episodio ${e.id} le habla a quien era y no está entero en carta.ids`);
    if (e.a_quien === 'familia' && e.ids.length && e.ids.every((i: string) => carta.has(i))) out.push(`C19: el episodio ${e.id} le habla a la familia: va a un capítulo, no a la carta (la carta es a quien era)`);
  }
  return out;
}

/** C20 (plan): el último capítulo no junta más de 2 reflexiones o gustos. */
export function c20Historia(plan: Json, reg: Json): string[] {
  const eps = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e]));
  const ult = plan.capitulos[plan.capitulos.length - 1];
  const sueltas = (ult?.piezas || []).filter((p: Json) => ['reflexion', 'gusto'].includes(eps[p.episodio]?.tipo));
  return sueltas.length > 2 ? [`C20: el último capítulo junta ${sueltas.length} reflexiones o gustos (${sueltas.map((p: Json) => p.episodio).join(', ')}); máximo 2: el resto vuelve a su capítulo o es remate de su escena`] : [];
}

/** C19 en el texto: lo que le habla a quien era está marcado en la carta (si hay carta). */
export function c19Texto(c: Carpeta, reg: Json): Problema[] {
  const p = c.existe(salida('carta.md')) ? c.leer(salida('carta.md')) : null;
  if (p === null) return [];
  const en = new Set(marcas(p));
  const out: Problema[] = [];
  for (const e of reg.episodios || []) {
    if (e.a_quien !== 'quien_era' || e.no_poner) continue;
    for (const i of e.ids) if (!en.has(i)) out.push({ pieza: 'carta', control: 'C19', tipo: 'falta', frase: '', que: `${i} le habla a quien era (${String(e.que || '').slice(0, 80)}) y no está en la carta` });
  }
  return out;
}

export function controlarHistoria(c: Carpeta, que: QueControl, arg?: string): ResultadoControl {
  if (que === 'arreglo' || que === 'repite' || que === 'repaso') return controlar(c, que, arg);
  const reg = c.existe(salida('registro.json')) ? leerJSON(c, salida('registro.json')) : null;
  let problemas: Json[];
  if (que === 'registro') problemas = c14Historia(reg, respuestasConOrigen(c), ficha(c));
  else if (que === 'plan') {
    const plan = planConR(leerJSON(c, salida('plan.json')), reg);
    problemas = [...c12Historia(plan, respuestas(c), reg, ficha(c)), ...c13Historia(plan, reg), ...c19Historia(plan, reg), ...c20Historia(plan, reg), ...c33(plan, reg)];
  } else {
    // Las piezas: los de Familiar menos C19 (su carta es a la familia) y C23 (Antes de cerrar), más el C19 de historia.
    const familia = controlar(c, 'piezas').problemas.filter((p: Json) => p.control !== 'C19' && p.control !== 'C23');
    problemas = [...familia, ...c19Texto(c, reg)];
  }
  c.escribir(`controles/${que}.json`, JSON.stringify(problemas, null, 1));
  if (!problemas.length) return { codigo: 0, problemas, resumen: `${que}: ok` };
  const lineas = [`${que}: ${problemas.length} problemas`, ...problemas.slice(0, 60).map((p: Json) => (typeof p === 'string' ? `- ${p}` : `- [${p.control}] ${p.pieza}: ${p.que} — ${String(p.frase).slice(0, 100)}`))];
  return { codigo: 2, problemas, resumen: lineas.join('\n') };
}
