// Arma las llamadas de la receta v5.5 (fabrica/scripts/escritor-v55/llamada.mjs) en modo puro, sobre
// la Carpeta. No escribe archivos: devuelve documentos e instrucciones. Los textos salen de los prompts
// compilados (nunca se escriben acá). Copiado letra por letra; ver la tabla de reemplazos del plan.
import { Carpeta, leerJSON } from '../carpeta.js';
import { decisionesAnteriores } from '../controles/estructura.js';
import { pasados, presentes } from '../controles/texto.js';
import { ficha, idioma, idsDeCapitulo, nombreDePila, piezas, respuestas, salida } from '../lectura.js';
import { esquemaDe, guiaDe, promptsDe } from '../prompts/index.js';
import { marcas, respuestasXML, sinMarcas } from '../texto.js';
import type { Json, PiezaTexto } from '../tipos.js';

export type Llamada = { nombre: string; docs: string[]; instr: string };
type ConError = { error?: string };

const LINEA = 'La guía habla de "la narradora" y sus ejemplos, igual que los de las instrucciones, son de una narradora inventada (Nélida). Quien narra en este libro es otra persona: su nombre, su género y su trato están en la ficha, y se escribe con ese género.';
export const tag = (t: string, s: string): string => `<${t}>\n${s.trim()}\n</${t}>`;
export const libroComo = (ps: PiezaTexto[]): string => ps.map((p) => `=== ${p.pieza} ===\n${p.texto.trim()}`).join('\n\n');

const registro = (c: Carpeta): Json => leerJSON(c, salida('registro.json'));
const plan = (c: Carpeta): Json => leerJSON(c, salida('plan.json'));
const voz = (c: Carpeta): string => JSON.stringify(registro(c).voz, null, 1);
const base = (c: Carpeta, paso: string): string[] => [LINEA, tag('guia', guiaDe(paso)), tag('ficha', ficha(c)), tag('respuestas', respuestasXML(respuestas(c)))];
const conError = (instr: string, error?: string): string => (error ? `${instr}\n\nTu respuesta anterior no pasó estos controles. Devolvé el JSON completo corregido:\n${error}` : instr);

// ---------- llamada.mjs:53-131, modo puro ----------
const aR = (c: Carpeta, ids: string[] | undefined): string[] => { const eps = Object.fromEntries((registro(c).episodios || []).map((e: Json) => [e.id, e.ids])); return [...new Set((ids || []).flatMap((i) => (/^E\d+$/.test(i) ? eps[i] || [] : [i])).filter((i: string) => /^R\d+$/.test(i)))] as string[]; };
/** Respuestas en el orden del tiempo (el del plan, que es cronológico) y con su "cuándo" del registro. */
function respuestasEnElTiempo(c: Carpeta, ids: Set<string>): string {
  const reg = registro(c), p = plan(c), orden = new Map<string, number>(), cuando = new Map<string, string>();
  const ep = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e]));
  // "cuándo": primero el del registro (el de un episodio que lo tenga); si ninguno lo tiene, la etapa del capítulo donde aparece.
  for (const e of reg.episodios || []) if (e.cuando) for (const r of e.ids) if (!cuando.has(r)) cuando.set(r, e.cuando);
  for (const cp of p.capitulos) for (const pz of cp.piezas || []) for (const r of ep[pz.episodio]?.ids || []) if (!orden.has(r)) { orden.set(r, orden.size); if (!cuando.has(r)) cuando.set(r, cp.etapa || ''); }
  const rs = respuestas(c).filter((r) => ids.has(r.id)).sort((a, b) => (orden.get(a.id) ?? 1e9) - (orden.get(b.id) ?? 1e9) || Number(a.id.slice(1)) - Number(b.id.slice(1)));
  return rs.map((r) => `<respuesta id="${r.id}" cuando="${(cuando.get(r.id) || '').replace(/"/g, "'")}">\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`).join('\n\n');
}
/** Fichas cortas de lo ya escrito (salidas/resumenes/<pieza>.md), en orden. */
function resumenHastaAca(c: Carpeta, antesDe: (pieza: string) => boolean): string {
  const ps = piezas(c).filter((x) => x.pieza !== 'sus_frases' && antesDe(x.pieza));
  return ps.map((x) => { const f = salida(`resumenes/${x.pieza}.md`); return c.existe(f) ? `=== ${x.pieza} ===\n${c.leer(f).trim()}` : ''; }).filter(Boolean).join('\n\n') || '(todavía nada)';
}
const idsDePieza = (c: Carpeta, pieza: string): Set<string> => {
  const p = plan(c);
  if (pieza === 'primera_pagina') return new Set(aR(c, [...(p.primera_pagina?.que_dice_de_si_ids || []), ...(p.primera_pagina?.cosa_concreta?.ids || [])]));
  if (pieza === 'carta') return new Set(aR(c, p.carta?.ids));
  if (pieza === 'antes_de_cerrar') return new Set(aR(c, p.antes_de_cerrar?.ids));
  return idsDeCapitulo(c, Number(pieza.slice(4)));
};
/** v5.2: el golpe del capítulo (plan.golpe), lo que lo prepara y su frase, para el armador y el novelista. */
function golpeTexto(c: Carpeta, g: Json, propias: Set<string>): string {
  if (!g) return '(esta etapa no tiene un golpe: contá su hilo)';
  const ep = Object.fromEntries((registro(c).episodios || []).map((e: Json) => [e.id, e]));
  const rs = Object.fromEntries(respuestas(c).map((r) => [r.id, r.texto]));
  const linea = (id: string) => { const e = ep[id]; return e ? `${id} — ${e.que || ''} (${(e.ids || []).join(', ')}${(e.ids || []).some((i: string) => propias.has(i)) ? '' : '; de otra etapa: está en <para_preparar>, va como recuerdo breve'})` : id; };
  return [
    `El golpe: ${linea(g.episodio)}`,
    `Lo prepara, en este orden: ${(g.preparacion || []).length ? '' : '(nada en el plan)'}`,
    ...(g.preparacion || []).map((e: string) => `- ${linea(e)}`),
    g.frase_id ? `Su frase está en ${g.frase_id}: "${rs[g.frase_id] || ''}". Elegí de ahí la frase que lo dice, con sus palabras, y ponela en el golpe o en su salida.` : '',
    'Los tres van en este capítulo: la preparación antes, el golpe con su tiempo, la frase en el golpe o en su salida.',
  ].filter(Boolean).join('\n');
}

function llamadaPura(c: Carpeta, pieza: string, env: { error?: string; armador?: boolean }): { docs: string[]; instr: string } {
  const p = plan(c), nombre = nombreDePila(c);
  const docs = [tag('ficha', ficha(c)), tag('voz', voz(c)), tag('respuestas', respuestasEnElTiempo(c, idsDePieza(c, pieza)))];
  if (pieza === 'primera_pagina') {
    // v5.3: la primera página se escribe al final, con las fichas de todo el libro y sin las respuestas que ya marcó un capítulo.
    const enCaps = new Set(piezas(c).filter((x) => x.pieza.startsWith('cap_')).flatMap((x) => marcas(x.texto)));
    const todas = idsDePieza(c, pieza), libres = new Set([...todas].filter((i) => !enCaps.has(i)));
    docs[2] = tag('respuestas', respuestasEnElTiempo(c, libres.size >= 3 ? libres : todas));
    docs.push(tag('resumen_hasta_aca', resumenHastaAca(c, (x) => x !== 'primera_pagina')));
    const aviso = env.error ? `\n\nTu versión anterior repetía tramos de otras piezas del libro. Escribila de nuevo sin contar nada de esto:\n${env.error}` : '';
    return { docs, instr: promptsDe('### Paso 3a puro')[0].replaceAll('{{NOMBRE}}', nombre) + aviso };
  }
  if (pieza === 'carta' || pieza === 'antes_de_cerrar') {
    docs.push(tag('resumen_hasta_aca', resumenHastaAca(c, (x) => !['carta', 'antes_de_cerrar'].includes(x))));
    return { docs, instr: promptsDe(pieza === 'carta' ? '### Paso 3c puro' : '### Paso 3d puro')[0].replaceAll('{{NOMBRE}}', nombre) };
  }
  const n = Number(pieza.slice(4)), cap = p.capitulos.find((k: Json) => k.n === n), a = cap?.anios || {};
  const propias = idsDePieza(c, pieza);
  // Lo que prepara la historia de este capítulo, de OTRAS etapas (plan.preparacion e imagen): se recuerda, no se vuelve a contar.
  // v5.2: lo que prepara el golpe (plan.golpe.preparacion) también, si es de otra etapa.
  const g = cap?.golpe?.episodio ? cap.golpe : null;
  const prep = new Set(aR(c, [...(cap?.preparacion || []), ...(g?.preparacion || []), ...(cap?.imagen?.ids || []), cap?.imagen?.episodio].filter(Boolean)).filter((i) => !propias.has(i)));
  docs.push(tag('para_preparar', prep.size ? respuestasEnElTiempo(c, prep) : '(nada)'));
  docs.push(tag('golpe', golpeTexto(c, g, propias)));
  docs.push(tag('resumen_hasta_aca', resumenHastaAca(c, (x) => x === 'primera_pagina' || (x.startsWith('cap_') && Number(x.slice(4)) < n))));
  const etapa = `${cap?.etapa || ''}${a.desde ? ` (${a.desde}–${a.hasta || 'hoy'})` : ''}`;
  // v5.1: el mapa del armador (paso 2h), si ya está.
  const hist = salida(`historias/cap_${n}.md`);
  if (c.existe(hist)) docs.push(tag('historias', c.leer(hist)));
  if (env.armador) {
    // Paso 2h: el armador recibe lo mismo que el escritor (sin voz ni ficha) más los episodios del registro de este capítulo.
    const eps = (registro(c).episodios || []).filter((e: Json) => e.ids.some((i: string) => propias.has(i) || prep.has(i))).map(({ id, que, cuando, tipo, es_escena, momento_clave, detalles, ids }: Json) => ({ id, que, cuando, tipo, es_escena, momento_clave, detalles, ids }));
    const d = docs.filter((x) => /^<(respuestas|para_preparar|golpe|resumen_hasta_aca)>/.test(x));
    d.push(tag('episodios', JSON.stringify(eps, null, 1)));
    return { docs: d, instr: promptsDe('### Paso 2h')[0].replaceAll('{{N}}', String(n)).replaceAll('{{ETAPA}}', etapa) };
  }
  return { docs, instr: promptsDe('### Paso 3b puro')[0].replaceAll('{{N}}', String(n)).replaceAll('{{ETAPA}}', etapa).replaceAll('{{NOMBRE}}', nombre) };
}

// ---------- llamada.mjs:131-149: idioma y guardar ----------
const ESCRIBEN = /^(3a-|3b-|3c-|3d-|3t-|6-arreglo-)/;
const CORRIGE = /^7-estilo-/;
function conIdioma(c: Carpeta, nombre: string, instr: string): string {
  if (idioma(c) !== 'ca') return instr;
  const [escritura, corrector] = promptsDe('### Idioma · catalán');
  if (ESCRIBEN.test(nombre)) return `${instr}\n\n${escritura}`;
  if (CORRIGE.test(nombre)) return `${instr}\n\n${corrector}`;
  return instr;
}
/** Lo que hacía `guardar` antes de escribir: el bloque de idioma al final de las instrucciones. */
const cerrar = (c: Carpeta, nombre: string, docs: string[], instr: string): Llamada => ({ nombre, docs, instr: conIdioma(c, nombre, instr) });
/** llamada.mjs:146: las líneas de más de 400 caracteres se parten en un espacio (era para el lector de archivos de la sesión). */
const partir = (t: string): string => t.split('\n').map((l) => (l.length <= 400 ? l : l.replace(/(.{1,400})(\s+|$)/g, '$1\n').trimEnd())).join('\n');
export const textoDeLlamada = (l: Llamada): string => partir(`${l.docs.join('\n\n')}\n\n${l.instr}\n`);
export const textoParaElModelo = (l: Llamada): string => `${l.docs.join('\n\n')}\n\n${l.instr}`;

// ---------- los pasos (llamada.mjs:151-281, solo los del modo puro) ----------
export const llamadaRegistro = (c: Carpeta, o: ConError = {}): Llamada =>
  cerrar(c, '1-registro', base(c, 'registro'), conError(promptsDe('### Paso 1')[0] + esquemaDe('### Paso 1'), o.error));

export const llamadaPlan = (c: Carpeta, o: ConError = {}): Llamada =>
  cerrar(c, '2-plan', [...base(c, 'plan'), tag('registro', JSON.stringify(registro(c), null, 1))], conError(promptsDe('### Paso 2 ·')[0] + esquemaDe('### Paso 2 ·'), o.error));

export function llamadaPrimera(c: Carpeta, o: ConError = {}): Llamada {
  const { docs, instr } = llamadaPura(c, 'primera_pagina', { error: o.error });
  return cerrar(c, '3a-primera', docs, instr);
}

export function llamadaCapitulo(c: Carpeta, n: number, o: ConError = {}): Llamada {
  const { docs, instr } = llamadaPura(c, `cap_${n}`, {});
  // v5, C30: si la versión anterior dejó afuera más de un tercio, se reescribe con el aviso.
  const aviso = o.error ? `\n\nTu versión anterior de este capítulo dejó afuera más de un tercio de sus respuestas. Escribilo de nuevo: como mucho un tercio afuera; lo que no empuja el hilo entra en una línea donde corresponde.\n${o.error}` : '';
  return cerrar(c, `3b-capitulo-${String(n).padStart(2, '0')}`, docs, instr + aviso);
}

export function llamadaAntes(c: Carpeta): Llamada | null {
  if (!(plan(c).antes_de_cerrar?.ids || []).length) return null;
  const { docs, instr } = llamadaPura(c, 'antes_de_cerrar', {});
  return cerrar(c, '3d-antes-de-cerrar', docs, instr);
}

export function llamadaCarta(c: Carpeta): Llamada {
  const { docs, instr } = llamadaPura(c, 'carta', {});
  return cerrar(c, '3c-carta', docs, instr);
}

export const llamadaSusFrases = (c: Carpeta): Llamada =>
  cerrar(c, '3e-sus-frases', [tag('voz', voz(c)), tag('respuestas', respuestasXML(respuestas(c)))], promptsDe('### Paso 3e puro')[0]);

export function llamadaEstilo(c: Carpeta, pieza: string, ronda: 1 | 2): Llamada {
  // v5.3, Paso 7: el corrector de estilo de una pieza (devuelve estilo/cambios-<pieza>.json).
  const x = piezas(c).find((q) => q.pieza === pieza);
  if (!x) throw new Error(`no existe la pieza ${pieza}`);
  // v5.3.1: ronda 2, segunda pasada sobre la pieza ya corregida.
  const dos = ronda === 2;
  return cerrar(c, `7-estilo-${pieza}${dos ? '-2' : ''}`, [tag('ficha', ficha(c)), tag('voz', voz(c)), tag('pieza', x.texto)], promptsDe('### Paso 7')[0] + (dos ? '\n\nEsta es la SEGUNDA pasada: la pieza ya pasó por un corrector. Buscá lo que quedó; lo que ya está bien no se toca.' : ''));
}

export function llamadaTitulo(c: Carpeta, n: number): Llamada {
  // v5.5, Paso 3t: el título del capítulo N, leyendo el capítulo ya escrito (salidas/titulos/cap_N.json).
  const x = piezas(c).find((q) => q.pieza === `cap_${n}`);
  if (!x) throw new Error(`no existe el capítulo ${n}`);
  return cerrar(c, `3t-titulo-${String(n).padStart(2, '0')}`, [tag('capitulo', sinMarcas(x.texto))], promptsDe('### Paso 3t')[0]);
}

export function llamadaArmador(c: Carpeta, n: number): Llamada {
  const { docs, instr } = llamadaPura(c, `cap_${n}`, { armador: true });
  return cerrar(c, `2h-armador-${String(n).padStart(2, '0')}`, docs, instr);
}

export function llamadaResumen(c: Carpeta, pieza: string): Llamada {
  // v5.1, Paso 3r: ficha corta de una pieza recién escrita, para que las siguientes no repitan (salidas/resumenes/<pieza>.md).
  const x = piezas(c).find((q) => q.pieza === pieza);
  if (!x) throw new Error(`no existe la pieza ${pieza}`);
  return cerrar(c, `3r-resumen-${pieza}`, [tag('pieza', sinMarcas(x.texto))], promptsDe('### Paso 3r')[0]);
}

export function llamadaVeedor(c: Carpeta): Llamada {
  // v5.1, Paso 5c: el veedor final lee el libro entero de corrido (sin marcas) y marca lo que hay que corregir.
  const ps = piezas(c).filter((q) => q.pieza !== 'sus_frases').map((q) => ({ ...q, texto: sinMarcas(q.texto) }));
  return cerrar(c, '5c-veedor', [tag('libro', libroComo(ps))], promptsDe('### Paso 5c')[0]);
}

/**
 * El registro que lee el verificador (07/10, ahorro sin tocar la receta): sin las dudas, la voz ni sin_lugar, y de cada
 * episodio solo lo que usa para verificar (qué, cuándo, si es seguro, si sigue hoy o terminó, personas e ids), sin los
 * detalles ni las variantes. Las respuestas (la fuente) las recibe enteras.
 */
export function registroParaHechos(c: Carpeta): Json {
  const { dudas: _d, voz: _v, sin_lugar: _s, ...resto } = registro(c);
  const eps = (resto.episodios || []).map((e: Json) => Object.fromEntries(['id', 'que', 'cuando', 'segura', 'estado', 'personas', 'ids'].filter((k) => k in e).map((k) => [k, e[k]])));
  return { ...resto, episodios: eps };
}

export function llamadaHechos(c: Carpeta, o: { repaso: boolean }): Llamada {
  // "hechos repaso": después del arreglo, con las decisiones de la ronda anterior (receta v3, C26).
  const repaso = o.repaso;
  const arregladas = (p: { pieza: string }) => c.existe(`arreglos/respuesta-${p.pieza}.txt`);
  const ps = piezas(c).filter((p) => !repaso || arregladas(p));
  if (repaso && !ps.length) throw new Error('No hay piezas arregladas (arreglos/respuesta-<pieza>.txt): no hay repaso que hacer');
  const docs = [...base(c, 'hechos'), tag('registro', JSON.stringify(registroParaHechos(c), null, 1)), tag('libro', libroComo(ps)),
    tag('presentes', presentes(ps.map((p) => ({ ...p, texto: sinMarcas(p.texto) }))).map((x) => `${x.pieza} §${x.parrafo}: ${x.oracion}`).join('\n')),
    // receta v3.1, C27: pasados que nombran a alguien que sigue hoy
    tag('pasados', pasados(ps.map((p) => ({ ...p, texto: sinMarcas(p.texto) })), registro(c)).map((x) => `${x.pieza} §${x.parrafo} (${x.personas.join(', ')}): ${x.oracion}`).join('\n') || '(ninguna)')];
  if (repaso) docs.push(tag('decisiones_anteriores', JSON.stringify(decisionesAnteriores(c), null, 1)));
  const [principal, agregado] = promptsDe('### Paso 4');
  if (repaso && !agregado) throw new Error('La receta no tiene el agregado del repaso en el Paso 4');
  return cerrar(c, repaso ? '4-hechos-repaso' : '4-hechos', docs, principal + esquemaDe('### Paso 4') + (repaso ? `\n\n${agregado}` : ''));
}

export function llamadaArreglo(c: Carpeta, pieza: string): Llamada {
  // v5.1: el arreglo también con el oficio del novelista (pedido corto), no con la instrucción larga.
  const probs = leerJSON(c, `arreglos/problemas-${pieza}.json`);
  const actual = piezas(c).find((p) => p.pieza === pieza);
  return cerrar(c, `6-arreglo-${pieza}`, [tag('ficha', ficha(c)), tag('voz', voz(c)), tag('respuestas', respuestasEnElTiempo(c, idsDePieza(c, pieza))), tag('pieza_actual', actual ? actual.texto : ''), tag('problemas', JSON.stringify(probs, null, 1))], promptsDe('### Paso 6 puro')[0]);
}
