// fabrica/src/escritor/controles/estructura.ts
// Controles de registro (C14), plan (C12, C13, C20, C33), "todo entra" (C18–C24, C33 en el texto),
// arreglo (C9) y repaso (C26), copiados letra por letra de fabrica/scripts/escritor-v55/controles.mjs.
import { Carpeta, leerJSON } from '../carpeta.js';
import { marcas, norm, palabras, piezaDeR, sinMarcas } from '../texto.js';
import type { Json, PiezaTexto, Problema, Respuesta } from '../tipos.js';
import { esSubsecuencia, parrafos } from './texto.js';

// C33 (v5.2, Naza 03/10): el golpe, lo que lo prepara y su frase van en el mismo capítulo.
const epsDe = (reg: Json): Record<string, string[]> => Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e.ids]));
export function c33(plan: Json, reg: Json): string[] {
  const out = [], eps = epsDe(reg), caps = plan.capitulos || [];
  const capDe = (e: Json) => caps.find((c: Json) => (c.piezas || []).some((x: Json) => x.episodio === e));
  for (const c of caps) {
    const g = c.golpe;
    if (!g?.episodio) continue;
    const orden = (c.piezas || []).map((x: Json) => x.episodio), ig = orden.indexOf(g.episodio);
    if (ig < 0 || c.piezas[ig].peso !== 'clave') { out.push(`C33 cap_${c.n}: el golpe ${g.episodio} no es una pieza "clave" de este capítulo`); continue; }
    for (const e of g.preparacion || []) {
      const ce = capDe(e);
      if (ce === c) { if (orden.indexOf(e) > ig) out.push(`C33 cap_${c.n}: ${e} prepara el golpe pero va después de él`); }
      else if (!ce) out.push(`C33 cap_${c.n}: ${e} prepara el golpe y no está en ningún capítulo`);
      else if (ce.n > c.n) out.push(`C33 cap_${c.n}: ${e} prepara el golpe y está en un capítulo posterior (cap_${ce.n}): va en este, antes del golpe`);
    }
    const propios = new Set(orden.flatMap((e: Json) => eps[e] || []));
    if (g.frase_id && !propios.has(g.frase_id)) out.push(`C33 cap_${c.n}: la frase del golpe (${g.frase_id}) no es de este capítulo: su respuesta va en este capítulo`);
  }
  return out;
}
/** C33 en el texto: el capítulo del golpe marca la frase y algo de cada episodio que lo prepara (los de otras etapas, como recuerdo). */
export function c33Texto(psCrudas: PiezaTexto[], plan: Json, reg: Json): Problema[] {
  const out = [], eps = epsDe(reg);
  for (const c of plan.capitulos || []) {
    const g = c.golpe, p = psCrudas.find((x) => x.pieza === `cap_${c.n}`);
    if (!g?.episodio || !p) continue;
    const ms = new Set(marcas(p.texto));
    for (const e of g.preparacion || []) if (!(eps[e] || []).some((i) => ms.has(i))) out.push({ pieza: p.pieza, control: 'C33', tipo: 'falta', frase: '', que: `falta lo que prepara el golpe: ${e} (${(eps[e] || []).join(', ')}); va antes del golpe (si es de otra etapa, como recuerdo breve)` });
    if (g.frase_id && !ms.has(g.frase_id)) out.push({ pieza: p.pieza, control: 'C33', tipo: 'falta', frase: '', que: `falta la frase del golpe: ${g.frase_id}; va en el golpe o en su salida` });
  }
  return out;
}

export const HECHOS: string[] = ['presente', 'pasado', 'nombre', 'fecha', 'lugar', 'cita', 'motivo', 'sentimiento', 'inventado', 'confirmado_no_usado', 'cortada', 'delicado'];

const VALORACION = ['etapa', 'linda', 'lindo', 'hermosa', 'hermoso', 'gran', 'suenos', 'sueno', 'luchas', 'lucha', 'dificil', 'feliz', 'felicidad', 'importante', 'especial', 'inolvidable'];
const VACIAS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'y', 'a', 'al', 'con', 'que', 'mi', 'mis', 'me', 'se', 'lo', 'por', 'para', 'su', 'sus', 'es', 'era']);
export function c12(plan: Json, rs: Respuesta[], reg: Json): string[] {
  const out = [];
  // v4: el título es "lo que mejor quede, sin inventar" (Naza); ya no tiene que salir de un hecho fuerte.
  const porId = Object.fromEntries(rs.map((r) => [r.id, r.texto]));
  const material = ` ${norm(rs.map((r) => r.texto).join(' '))} `;
  const nombres = new Set((reg.personas || []).flatMap((p: Json) => [p.nombre, ...(p.apodos || [])]).map(norm));
  // Los títulos de capítulo del plan no se imprimen desde la v5.5 (los pone el Paso 3t): C12 ya no los controla, así no
  // hacen repetir el plan (07/10). Quedan el título del libro y el de la carta.
  const titulos = [{ donde: 'libro', t: plan.titulo_libro }];
  if (plan.carta?.titulo && norm(plan.carta.titulo) !== 'para los mios') titulos.push({ donde: 'carta', t: { texto: plan.carta.titulo, id: plan.carta.titulo_id || '' } });
  const vistos = new Set();
  for (const { donde, t } of titulos) {
    if (!t?.texto) continue;
    const ws = palabras(t.texto);
    if (t.id && porId[t.id] && !esSubsecuencia(t.texto, porId[t.id])) out.push(`C12 ${donde}: el título "${t.texto}" no es textual de ${t.id}`);
    if (!t.id) for (const w of ws) if (!VACIAS.has(w) && !material.includes(` ${w} `)) out.push(`C12 ${donde}: "${w}" del título armado no está en el material`);
    for (const w of ws) if (VALORACION.includes(w)) out.push(`C12 ${donde}: el título "${t.texto}" lleva una valoración ("${w}")`);
    if (nombres.has(norm(t.texto))) out.push(`C12 ${donde}: el título es solo un nombre`);
    if (vistos.has(norm(t.texto))) out.push(`C12 ${donde}: título repetido`);
    vistos.add(norm(t.texto));
  }
  return out;
}
export function c13(plan: Json, reg: Json): string[] {
  const out = [];
  const eps = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e]));
  const usados = new Map();
  const usar = (id: Json, donde: Json) => { usados.set(id, [...(usados.get(id) || []), donde]); };
  for (const c of plan.capitulos) for (const p of c.piezas || []) usar(p.episodio, `cap_${c.n}`);
  const idsSf = new Set((plan.sus_frases || []).map((f: Json) => f.id));
  const idsCarta = new Set(plan.carta?.ids || []);
  const idsAntes = new Set(plan.antes_de_cerrar?.ids || []);
  // Una R puede estar en un episodio y en un balance a la vez (variante): esa R va a Antes de cerrar sin culpa del otro episodio.
  const idsBalance = new Set((reg.episodios || []).filter((e: Json) => e.tipo === 'balance' && !e.no_poner).flatMap((e: Json) => e.ids));
  for (const e of reg.episodios || []) {
    if (e.no_poner) continue;
    const u = usados.get(e.id) || [];
    const enOtro = e.ids.some((i: Json) => idsSf.has(i) || idsCarta.has(i) || idsAntes.has(i));
    if (e.tipo !== 'balance' && e.ids.some((i: Json) => idsAntes.has(i) && !idsBalance.has(i))) out.push(`C13: el episodio ${e.id} no es balance y está en antes_de_cerrar.ids (ahí va solo el balance)`);
    if (e.tipo === 'balance' && !e.ids.every((i: Json) => idsAntes.has(i))) out.push(`C13: el episodio ${e.id} es balance y no está entero en antes_de_cerrar.ids`);
    if (e.tipo === 'balance' && u.length) out.push(`C13: el episodio ${e.id} es balance y está en ${u.join(' y ')} (va a Antes de cerrar)`);
    if (u.length > 1) out.push(`C13: el episodio ${e.id} está en ${u.join(' y ')} (va una sola vez)`);
    if (!u.length && !enOtro) out.push(`C13: el episodio ${e.id} ("${e.que.slice(0, 60)}") no quedó en ningún lado`);
  }
  let prev = null;
  for (const c of plan.capitulos) {
    // v4: capítulo = etapa (Naza). Puede no tener escena; el peso va por importancia, no por largo.
    for (const p of c.piezas || []) { const e = eps[p.episodio]; if (!e) out.push(`C13 cap_${c.n}: el episodio ${p.episodio} no existe en el registro`); else if (p.forma === 'escena' && !e.es_escena) out.push(`C13 cap_${c.n}: ${e.id} va como escena y el registro dice que no tiene escena (es_escena: false)`); else if (e.momento_clave && p.peso === 'linea') out.push(`C13 cap_${c.n}: ${e.id} es momento clave (${e.momento_clave}) y va con peso "linea": va con peso "clave"`); }
    if (!(c.hilo_ids || []).length) out.push(`C13 cap_${c.n}: hilo sin ids`);
    // receta v3.2: plan por época. Lo de hoy (dato, gusto o reflexión que sigue) no va a un capítulo del pasado sin decir por qué.
    if (c !== plan.capitulos[plan.capitulos.length - 1]) for (const p of c.piezas || []) {
      const e = eps[p.episodio];
      if (e && ['dato', 'gusto', 'reflexion'].includes(e.tipo) && e.estado === 'sigue_hoy' && !String(p.por_que_aca || '').trim()) out.push(`C13 cap_${c.n}: ${e.id} ("${e.que.slice(0, 50)}") es de hoy (${e.tipo}, sigue_hoy) y está en un capítulo del pasado sin "por_que_aca": va al último capítulo, a Antes de cerrar, a Sus frases o a la carta`);
    }
    if (prev && prev.apertura?.tipo === c.apertura?.tipo) out.push(`C13 cap_${c.n}: abre igual que el anterior (${c.apertura?.tipo})`);
    if (prev && prev.cierre?.tipo === c.cierre?.tipo) out.push(`C13 cap_${c.n}: cierra igual que el anterior (${c.cierre?.tipo})`);
    prev = c;
  }
  const pres = new Map();
  for (const c of plan.capitulos) for (const p of c.presenta || []) pres.set(p, [...(pres.get(p) || []), c.n]);
  for (const [p, cs] of pres) if (cs.length > 1) out.push(`C13: ${p} se presenta en los capítulos ${cs.join(' y ')}`);
  const ult = plan.capitulos[plan.capitulos.length - 1];
  const idsHoy = new Set([...(reg.hoy || []).flatMap((h: Json) => h.ids), ...(reg.episodios || []).filter((e: Json) => e.estado === 'sigue_hoy').flatMap((e: Json) => e.ids)]);
  // v4 (prueba del banco): el plan puede poner episodios (E..) en hilo_de_hoy_ids: valen sus R.
  const epsHoy = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e.ids]));
  const hiloHoy = (ult?.hilo_de_hoy_ids || []).flatMap((i: Json) => (/^E\d+$/.test(i) ? epsHoy[i] || [] : [i]));
  // Receta: si el registro no tiene ninguna escena de hoy, el hilo puede ser una escena (la más reciente). Pasó con Joaquín.
  const hayEscenaHoy = (reg.episodios || []).some((e: Json) => e.estado === 'sigue_hoy' && e.es_escena);
  const hiloEscena = (ult?.hilo_de_hoy_ids || []).some((i: Json) => (reg.episodios || []).find((e: Json) => (e.id === i || e.ids.includes(i)) && e.es_escena));
  if (!hiloHoy.some((i: Json) => idsHoy.has(i)) && (hayEscenaHoy || !hiloEscena)) out.push('C13: el último capítulo no tiene un hilo de hoy respaldado (hilo_de_hoy_ids sin nada de "hoy" ni episodios sigue_hoy)');
  // receta v3: el último capítulo tiene columna y cierra en una imagen de hoy.
  const imf = ult?.imagen_final || {};
  const epImf = eps[imf.episodio];
  if (!ult?.columna?.texto) out.push('C13: el último capítulo no tiene columna (la oración que ordena sus piezas)');
  else if (!(ult.columna.ids || []).length) out.push('C13: la columna del último capítulo no tiene ids (receta v3.1: es lo que sigue abierto hoy, con sus respuestas)');
  if (!epImf) out.push('C13: el último capítulo no tiene imagen_final con un episodio del registro');
  else {
    if (!(ult.piezas || []).some((p: Json) => p.episodio === imf.episodio)) out.push(`C13: la imagen_final ${imf.episodio} no está en las piezas del último capítulo`);
    if (epImf.estado !== 'sigue_hoy' && !epImf.ids.some((i: Json) => idsHoy.has(i))) out.push(`C13: la imagen_final ${imf.episodio} no es de hoy (ni sigue_hoy ni del bloque "hoy")`);
    if (ult.cierre?.episodio !== imf.episodio) out.push(`C13: el último capítulo no cierra en su imagen_final (cierre ${ult.cierre?.episodio || 'vacío'}, imagen ${imf.episodio})`);
  }
  if (norm(plan.carta?.titulo || '') === 'antes de cerrar') out.push('C13: la carta no puede llamarse "Antes de cerrar" (es otra pieza)');
  const tipoDeId = new Map();
  for (const e of reg.episodios || []) for (const i of e.ids) tipoDeId.set(i, [...(tipoDeId.get(i) || []), e.tipo]);
  for (const i of idsCarta) if (!(tipoDeId.get(i) || []).includes('mensaje')) out.push(`C13 carta: ${i} no tiene ningún episodio tipo "mensaje"`);
  const presentaIds = new Set([...(reg.narrador?.como_se_presenta || []), ...(reg.narrador?.cosas_concretas_suyas || [])].flatMap((x) => x.ids));
  for (const i of [...(plan.primera_pagina?.que_dice_de_si_ids || []), ...(plan.primera_pagina?.cosa_concreta?.ids || [])]) if (!presentaIds.has(i)) out.push(`C13 primera página: ${i} no está en como_se_presenta ni en cosas_concretas_suyas`);
  for (const f of plan.sus_frases || []) if (palabras(f.contexto || '').length > 20) out.push(`C13 sus_frases ${f.id}: contexto de más de 20 palabras`);
  return out;
}

// ---------- C14: registro ----------
export function c14(reg: Json, rs: Respuesta[], fichaTxt: string): string[] {
  const out = [];
  const ids = new Set(rs.map((r) => r.id));
  const porId = Object.fromEntries(rs.map((r) => [r.id, r.texto]));
  const citados = new Set();
  const revisar = (x: Json, donde: Json) => { for (const i of x.ids || []) { if (i !== 'FICHA' && !ids.has(i)) out.push(`C14 ${donde}: el id ${i} no existe`); citados.add(i); } };
  for (const k of ['como_se_presenta', 'cosas_concretas_suyas', 'repite_sin_que_se_lo_pregunten', 'conclusiones_propias']) (reg.narrador?.[k] || []).forEach((x: Json) => revisar(x, `narrador.${k}`));
  for (const p of reg.personas || []) { if (!p.estado) out.push(`C14 persona ${p.id}: sin estado`); (p.hechos || []).forEach((h: Json) => revisar(h, `persona ${p.id}`)); revisar({ ids: p.estado_ids }, `persona ${p.id}`); }
  for (const l of reg.lugares || []) { if (!l.estado) out.push(`C14 lugar ${l.id}: sin estado`); revisar(l, `lugar ${l.id}`); }
  for (const e of reg.episodios || []) { if (!e.estado) out.push(`C14 episodio ${e.id}: sin estado`); revisar(e, `episodio ${e.id}`); (e.variantes || []).forEach((v: Json) => revisar(v, `episodio ${e.id}`)); }
  (reg.linea_de_tiempo || []).forEach((x: Json) => revisar(x, 'linea_de_tiempo'));
  (reg.hoy || []).forEach((x: Json) => revisar(x, 'hoy'));
  const conLugar = new Set([...(reg.episodios || []).flatMap((e: Json) => [...e.ids, ...(e.variantes || []).flatMap((v: Json) => v.ids)]), ...(reg.sin_lugar || []).map((s: Json) => s.id)]);
  for (const r of rs) if (!conLugar.has(r.id)) out.push(`C14: ${r.id} no está en ningún episodio ni en sin_lugar`);
  const fr = reg.voz?.frases || [];
  if (fr.length < 15 || fr.length > 20) out.push(`C14 voz: ${fr.length} frases (van de 15 a 20)`);
  for (const f of fr) if (!porId[f.id] || !esSubsecuencia(f.texto, porId[f.id])) out.push(`C14 voz: la frase "${f.texto.slice(0, 60)}" no es textual de ${f.id}`);
  for (const x of [...(reg.linea_de_tiempo || []), ...(reg.episodios || [])]) {
    if (x.segura !== true) continue;
    const textos = (x.ids || []).map((i: Json) => (i === 'FICHA' ? fichaTxt : porId[i] || '')).join(' ');
    const num = /\d/.test(textos) || /\b(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta)\b/.test(norm(textos));
    if (!num) out.push(`C14: "${(x.evento || x.que || '').slice(0, 50)}" está como fecha segura y sus ids no tienen un número`);
  }
  const usadas = new Set((reg.episodios || []).flatMap((e: Json) => e.ids));
  const cortadas = new Set((reg.frases_cortadas || []).map((f: Json) => f.id));
  // Solo cuenta el "…" al final de la respuesta (corte del audio); a mitad de frase es una duda al hablar.
  for (const r of rs) if (usadas.has(r.id) && /(…|\.\.\.)\s*$/.test(r.texto) && !cortadas.has(r.id)) out.push(`C14: ${r.id} tiene "…" y no está en frases_cortadas`);
  const vistos = new Map();
  for (const p of reg.personas || []) { const k = `${norm(p.nombre || '')}|${norm(p.relacion || '')}`; if (p.nombre && vistos.has(k)) out.push(`C14: ${p.id} y ${vistos.get(k)} tienen el mismo nombre y relación`); vistos.set(k, p.id); }
  const conf = (fichaTxt.match(/<confirmado_por_el_narrador>([\s\S]*?)<\/confirmado_por_el_narrador>/) || [])[1] || '';
  const lineas = conf.split('\n').filter((l) => /^\s*-\s+/.test(l));
  if (lineas.length && (reg.confirmados || []).length < lineas.length) out.push(`C14: hay ${lineas.length} confirmados en la ficha y el registro tiene ${(reg.confirmados || []).length}`);
  for (const c of reg.confirmados || []) if (!(c.usado_en || []).length) out.push(`C14: el confirmado "${c.texto.slice(0, 60)}" no tiene usado_en`);
  // receta v2
  for (const e of reg.episodios || []) {
    if (!['familia', 'lector', 'nadie'].includes(e.a_quien)) out.push(`C14 episodio ${e.id}: a_quien tiene que ser familia, lector o nadie`);
    if (e.es_escena && !(e.detalles || []).length) out.push(`C14 episodio ${e.id}: es escena y no tiene detalles`);
  }
  for (const p of reg.personas || []) if (!Array.isArray(p.rasgos_hoy)) out.push(`C14 persona ${p.id}: falta rasgos_hoy (puede ser [])`);
  return out;
}

// ---------- C9: arreglo ----------
export function c9(probs: Json[], nueva: string, vieja: string): { abiertos: Json[]; identicos: number } {
  const out = [];
  // Solo el texto de la pieza: el JSON de cambios de abajo trae las frases viejas en "antes".
  const corte = nueva.lastIndexOf('\n---\n');
  const pieza = corte < 0 ? nueva : nueva.slice(0, corte);
  const n = ` ${norm(pieza)} `;
  const cambios = new Map<number, Json>((corte >= 0 ? safeJSON(nueva.slice(corte + 5))?.cambios || [] : []).map((c: Json) => [c.problema, c]));
  for (const p of probs) {
    const ch = cambios.get(p.n);
    if (ch?.resultado === 'disputa' && HECHOS.includes(p.tipo)) { out.push({ n: p.n, estado: 'disputa', id: ch.disputa_id, cita: ch.disputa_frase, frase: p.frase }); continue; }
    const f = norm(p.frase || '');
    if (f && f.split(' ').length >= 3 && n.includes(` ${f} `)) out.push({ n: p.n, estado: 'sigue', frase: p.frase, tipo: p.tipo });
  }
  const viejos = parrafos(vieja), nuevos = new Set(parrafos(nueva.split(/\n---\n/)[0]).map(norm));
  const marcados = probs.map((p) => norm(p.frase || '')).filter(Boolean);
  const sinProblema = viejos.filter((v) => !marcados.some((m) => norm(v).includes(m)));
  const iguales = sinProblema.filter((v) => nuevos.has(norm(v))).length;
  return { abiertos: out, identicos: sinProblema.length ? Math.round((100 * iguales) / sinProblema.length) : 100 };
}
const safeJSON = (s: string): Json => { try { return JSON.parse(s.replace(/^```(json)?\s*/m, '').replace(/```\s*$/m, '')); } catch { return null; } };

// ---------- receta v2: C18–C22 ----------
const capituloDe = (plan: Json, reg: Json, rid: string): string => piezaDeR(plan, reg, rid);
// C18: toda respuesta aparece en alguna marca [[R..]] o en Sus frases.
export function c18(psCrudas: PiezaTexto[], rs: Respuesta[], reg: Json, plan: Json, noEntran: Set<string> = new Set()): Problema[] {
  const usadas = new Set(psCrudas.flatMap((p) => marcas(p.texto)));
  for (const f of plan.sus_frases || []) for (const i of f.ids || [f.id]) usadas.add(i);
  const fuera = new Set([...(reg.episodios || []).filter((e: Json) => e.no_poner).flatMap((e: Json) => e.ids)]);
  const out = [];
  for (const r of rs) {
    // v5.2: una respuesta que entera es un "no" (afuera con a_donde "no_entra") no se pide.
    if (usadas.has(r.id) || fuera.has(r.id) || noEntran.has(r.id)) continue;
    out.push({ pieza: capituloDe(plan, reg, r.id), control: 'C18', tipo: 'falta', frase: '', que: `falta ${r.id}: "${r.texto.slice(0, 160)}…" no aparece en ninguna marca del libro` });
  }
  // v4: marcas por tramo (no por párrafo); la última línea de la pieza siempre lleva marca, así nada queda sin rastrear.
  for (const p of psCrudas) {
    if (p.pieza === 'sus_frases') continue;
    const pars = p.texto.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
    const ult = pars[pars.length - 1] || '';
    if (ult && !/\[\[[^\]]*\]\]\s*$/.test(ult)) out.push({ pieza: p.pieza, control: 'C18', tipo: 'sin_marca', frase: ult.slice(0, 120), que: 'la pieza termina sin marca [[R..]]: el último tramo tiene que decir qué respuestas usó' });
  }
  return out;
}
// C19: lo que le habla a la familia está en la carta.
export function c19(psCrudas: PiezaTexto[], reg: Json): Problema[] {
  const carta = psCrudas.find((p) => p.pieza === 'carta');
  const enCarta = new Set(carta ? marcas(carta.texto) : []);
  const out = [];
  for (const e of reg.episodios || []) {
    if (e.a_quien !== 'familia' || e.no_poner) continue;
    for (const i of e.ids) if (!enCarta.has(i)) out.push({ pieza: 'carta', control: 'C19', tipo: 'falta', frase: '', que: `${i} le habla a la familia (${e.que.slice(0, 80)}) y no está en la carta` });
  }
  return out;
}
// C20 (plan): el último capítulo no junta más de 2 reflexiones o gustos que no sean media línea.
export function c20(plan: Json, reg: Json): string[] {
  const eps = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e]));
  const ult = plan.capitulos[plan.capitulos.length - 1];
  // receta v3.1: las medias líneas también cuentan (en la prueba 3 la bolsa volvió por ahí).
  const sueltas = (ult.piezas || []).filter((p: Json) => ['reflexion', 'gusto'].includes(eps[p.episodio]?.tipo));
  const otros = [];
  const carta = new Set(plan.carta?.ids || []);
  for (const e of reg.episodios || []) if (e.a_quien === 'familia' && !e.no_poner && !e.ids.some((i: Json) => carta.has(i))) otros.push(`C19: el episodio ${e.id} le habla a la familia y no está en carta.ids`);
  if (!plan.carta?.titulo) otros.push('C13: la carta no tiene título');
  // receta v3: a quien está dedicado el libro y no le dejó mensaje, se dice en faltantes (nunca se inventa).
  const faltan = ` ${norm((plan.faltantes || []).map((f: Json) => `${f.que} ${f.donde || ''}`).join(' '))} `;
  for (const pid of plan.carta?.para_personas || []) {
    const per = (reg.personas || []).find((p: Json) => p.id === pid);
    if (!per) { otros.push(`C19: carta.para_personas tiene ${pid}, que no está en el registro`); continue; }
    // v4 (prueba del banco): "mamá" tiene que encontrar a "su mamá" (relación madre): se comparan también sin "su/mi" y por relación.
    const PAR: Record<string, string[]> = { madre: ['mama', 'vieja'], padre: ['papa', 'viejo'] };
    const rel = norm(per.relacion || '').split(' ')[0];
    const suyos = [per.id, per.nombre, ...(per.apodos || []), rel, ...(PAR[rel] || [])].filter(Boolean).map(norm).flatMap((n) => [n, n.replace(/^(su|mi) /, '')]);
    const leHabla = (reg.episodios || []).some((e: Json) => e.a_quien === 'familia' && !e.no_poner && (e.a_quien_nombres || []).some((n: Json) => suyos.includes(norm(n))));
    if (!leHabla && !suyos.some((n) => n.length > 1 && faltan.includes(` ${n} `))) otros.push(`C19: el libro está dedicado a ${per.nombre} y no hay mensaje para ${per.nombre} ni faltante que lo diga`);
  }
  return [...otros, ...(sueltas.length > 2 ? [`C20: el último capítulo junta ${sueltas.length} reflexiones o gustos (${sueltas.map((p: Json) => p.episodio).join(', ')}); máximo 2: el resto vuelve a su capítulo o es remate de su escena`] : [])];
}
// C21: cada persona con algún hecho aparece en el libro.
export function c21(ps: PiezaTexto[], reg: Json, plan: Json): Problema[] {
  const libro = ` ${norm(ps.filter((p) => p.pieza !== 'sus_frases').map((p) => p.texto).join(' '))} `;
  const out = [];
  for (const p of reg.personas || []) {
    if (!(p.hechos || []).length) continue;
    const nombres = [p.nombre, ...(p.apodos || [])].filter(Boolean).map(norm).filter((n) => n.length > 1);
    if (!nombres.length || nombres.some((n) => libro.includes(` ${n} `) || libro.includes(` ${n.split(' ')[0]} `))) continue;
    const ids = p.hechos.flatMap((h: Json) => h.ids);
    out.push({ pieza: capituloDe(plan, reg, ids[0]), control: 'C21', tipo: 'falta', frase: '', que: `${p.nombre} (${p.relacion}) no aparece en el libro; lo que se dijo: ${p.hechos.map((h: Json) => h.hecho).join('; ').slice(0, 160)}` });
  }
  return out;
}
// C22: en cada escena, al menos 70 % de los detalles de su episodio están en el texto.
export function c22(ps: PiezaTexto[], reg: Json, plan: Json): Problema[] {
  const eps = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e]));
  const out = [];
  for (const c of plan.capitulos) {
    const p = ps.find((x) => x.pieza === `cap_${c.n}`);
    if (!p) continue;
    const txt = ` ${norm(p.texto)} `;
    for (const pz of (c.piezas || []).filter((x: Json) => x.forma === 'escena')) {
      const det = eps[pz.episodio]?.detalles || [];
      if (det.length < 2) continue;
      const falta = det.filter((d: Json) => { const ws = palabras(d).filter((w) => w.length > 3); return ws.length && ws.filter((w) => txt.includes(` ${w}`)).length < Math.ceil(ws.length / 2); });
      if (falta.length > det.length * 0.3) out.push({ pieza: p.pieza, control: 'C22', tipo: 'escena_flaca', frase: '', que: `la escena ${pz.episodio} usa ${det.length - falta.length} de ${det.length} detalles; faltan: ${falta.join(' | ')}` });
    }
  }
  return out;
}

// ---------- receta v3: C20 en el texto, C23–C26 ----------
const idsDeTipo = (reg: Json, tipos: string[]): Set<string> => new Set((reg.episodios || []).filter((e: Json) => tipos.includes(e.tipo)).flatMap((e: Json) => e.ids));
// C20 (texto): el último capítulo no apila reflexiones y cierra en su imagen_final.
export function c20Texto(psCrudas: PiezaTexto[], reg: Json, plan: Json): Problema[] {
  const ult = plan.capitulos[plan.capitulos.length - 1];
  const p = psCrudas.find((x) => x.pieza === `cap_${ult.n}`);
  if (!p) return [];
  const out = [];
  const pars = p.texto.split(/\n\s*\n/).map((x) => x.trim()).filter((x) => x && !x.startsWith('#'));
  const reflex = idsDeTipo(reg, ['reflexion', 'gusto', 'balance']);
  const solo = pars.filter((x) => { const m = marcas(x); return m.length && m.every((i) => reflex.has(i)); });
  if (solo.length > 2) out.push({ pieza: p.pieza, control: 'C20', tipo: 'bolsa', frase: sinMarcas(solo[2]).slice(0, 120), que: `${solo.length} párrafos del último capítulo son solo reflexiones o gustos (máximo 2)` });
  const epImf = (reg.episodios || []).find((e: Json) => e.id === ult.imagen_final?.episodio);
  const deImagen = new Set([...(epImf?.ids || []), ult.imagen_final?.frase_id].filter(Boolean));
  const ultimo = pars[pars.length - 1] || '';
  if (deImagen.size && !marcas(ultimo).some((i) => deImagen.has(i))) out.push({ pieza: p.pieza, control: 'C20', tipo: 'bolsa', frase: sinMarcas(ultimo).slice(0, 120), que: `el último párrafo no es la imagen final del plan (${ult.imagen_final.episodio}${ult.imagen_final.que ? `: ${ult.imagen_final.que}` : ''})` });
  return out;
}

// C23: el balance de vida entra entero en "Antes de cerrar".
export function c23(psCrudas: PiezaTexto[], reg: Json): Problema[] {
  const antes = psCrudas.find((p) => p.pieza === 'antes_de_cerrar');
  const en = new Set(antes ? marcas(antes.texto) : []);
  const out = [];
  for (const e of reg.episodios || []) {
    if (e.tipo !== 'balance' || e.no_poner) continue;
    for (const i of e.ids) if (!en.has(i)) out.push({ pieza: 'antes_de_cerrar', control: 'C23', tipo: 'falta', frase: '', que: `falta ${i}: ${e.que.slice(0, 100)} (balance de vida) no está en Antes de cerrar` });
  }
  return out;
}

// C24: lo que el cotejo encontró afuera está en el libro (la mitad o más de sus palabras de contenido, en su pieza).
export function c24(ps: PiezaTexto[], cotejo: Json, plan: Json, reg: Json, psCrudas: PiezaTexto[] = [], rs: Respuesta[] | null = null): Problema[] {
  const out = [];
  for (const f of cotejoValido(cotejo, rs).validas) {
    const pieza = piezaDeR(plan, reg, f.id, psCrudas);
    const txt = ` ${norm(ps.find((p) => p.pieza === pieza)?.texto || '')} `;
    const ws = palabras(f.frase || '').filter((w) => w.length > 3);
    if (!ws.length) continue;
    const estan = ws.filter((w) => txt.includes(` ${w} `)).length;
    // v4: la frase puede entrar narrada (no textual): alcanza con un tercio de sus palabras de contenido.
    if (estan < Math.ceil(ws.length / 3)) out.push({ pieza, control: 'C24', tipo: 'falta_frase', frase: '', que: `falta frase de ${f.id}: «${f.frase}»${f.por_que ? ` (${f.por_que})` : ''}` });
  }
  return out;
}

/** Lo del cotejo que vale: id que existe y frase textual de esa respuesta (C6). Lo demás se descarta y va al informe. */
export function cotejoValido(cotejo: Json, rs: Respuesta[] | null | undefined): { validas: Json[]; descartadas: Json[] } {
  const validas = [], descartadas = [];
  for (const f of cotejo?.faltan || []) {
    const r = rs?.find((x) => x.id === f.id);
    if (rs && (!r || !esSubsecuencia(f.frase || '', r.texto))) descartadas.push({ ...f, motivo: r ? 'la frase no es textual de esa respuesta' : 'el id no existe' });
    else validas.push(f);
  }
  return { validas, descartadas };
}

// C26: en el repaso, el verificador no puede dar vuelta lo que la ronda anterior ya decidió.
const OPUESTO: Record<string, string> = { presente: 'pasado', pasado: 'presente', nombre: 'nombre' };
const seTocan = (a: string, b: string): boolean => {
  const x = [...new Set(palabras(a || '').filter((w) => w.length > 3))], y = new Set(palabras(b || '').filter((w) => w.length > 3));
  return x.length > 0 && y.size > 0 && x.filter((w) => y.has(w)).length >= Math.ceil(Math.min(x.length, y.size) / 2);
};
export function c26(repaso: Json, anteriores: Record<string, Json[]>): { oscila: Json[]; contradice: Json[]; nuevos: Json[] } {
  const res: { oscila: Json[]; contradice: Json[]; nuevos: Json[] } = { oscila: [], contradice: [], nuevos: [] };
  for (const pr of repaso?.problemas || []) {
    if (pr.tipo === 'contradice_decision') { res.contradice.push(pr); continue; }
    const previas = (anteriores[pr.pieza] || []).filter((d) => OPUESTO[d.tipo] === pr.tipo);
    // Oscila si marca, al revés, lo que la ronda anterior ya cambió (mismo tipo "nombre": solo si de verdad se cambió).
    const choca = previas.find((d) => d.tipo === pr.tipo ? d.resultado === 'cambiado' && d.despues && seTocan(pr.frase, d.despues) : seTocan(pr.frase, d.despues) || seTocan(pr.frase, d.frase));
    if (choca) res.oscila.push({ ...pr, control: 'C26', antes: { tipo: choca.tipo, frase: choca.frase, despues: choca.despues } });
    else res.nuevos.push(pr);
  }
  return res;
}

/** Decisiones de la ronda anterior, por pieza: los problemas de hechos con lo que devolvió el arreglo. */
export function decisionesAnteriores(c: Carpeta): Record<string, Json[]> {
  const carpeta = 'arreglos';
  const out: Record<string, Json[]> = {};
  if (!c.existeCarpeta(carpeta)) return out;
  for (const f of c.listar(carpeta).filter((x) => /^problemas-.+\.json$/.test(x))) {
    const pieza = f.replace(/^problemas-|\.json$/g, '');
    const r = `${carpeta}/respuesta-${pieza}.txt`;
    let cambios: Json[] = [];
    if (c.existe(r)) { const t = c.leer(r); const i = t.lastIndexOf('\n---\n'); cambios = (i >= 0 ? safeJSON(t.slice(i + 5))?.cambios : null) || []; }
    out[pieza] = leerJSON(c, `${carpeta}/${f}`).filter((p: Json) => p.origen === 'verificador' && HECHOS.includes(p.tipo)).map((p: Json) => {
      const c = cambios.find((x) => x.problema === p.n) || {};
      return { n: p.n, tipo: p.tipo, frase: p.frase, correccion: p.correccion || '', resultado: c.resultado || 'sin respuesta', despues: c.despues || '' };
    });
  }
  return out;
}
