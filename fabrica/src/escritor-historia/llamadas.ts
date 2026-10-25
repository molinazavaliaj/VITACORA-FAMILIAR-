// Las llamadas del escritor de historia (receta, secciones 2 y 4), sobre la Carpeta. Copia adaptada de
// escritor/llamadas/armar.ts, que no se toca. Lo que cambia:
//   - las respuestas llevan su origen (el tramo, «la dejó escrita …», la foto);
//   - el documento nuevo <hilo_libro> en el Armador y el Capítulo; <golpe> solo en el capítulo del golpe;
//   - la carta es a quien era (plan.carta.ids); no hay primera página ni Antes de cerrar;
//   - los huecos {{NOMBRE}}, {{N}}, {{ETAPA}} (el tramo del plan) y {{TEMA}};
//   - los bloques de idioma: catalán y, nuevo, castellano de España.
// Los nombres de las llamadas son los de Familiar (3b-capitulo-NN, 7-estilo-…): así les toca el mismo modelo
// (escritor/modelo/configuracion.ts, rolDe) y el ejecutor, los controles y el armado las encuentran igual.
import { Carpeta, leerJSON } from '../escritor/carpeta.js';
import { decisionesAnteriores } from '../escritor/controles/estructura.js';
import { pasados, presentes } from '../escritor/controles/texto.js';
import { libroComo, tag, type Llamada } from '../escritor/llamadas/armar.js';
import { ficha, idsDeCapitulo, nombreDePila, piezas, salida } from '../escritor/lectura.js';
import { sinMarcas } from '../escritor/texto.js';
import type { Json } from '../escritor/tipos.js';
import { idiomaHistoria, respuestasConOrigen, temaHueco, type RespuestaHistoria } from './lectura.js';
import type { ClaveHistoria } from './prompts/compilar.js';
import { bloquesHistoria, guiaHistoria, instruccionesHistoria, lineaFijaHistoria, type HuecosHistoria } from './prompts/index.js';

type ConError = { error?: string };

const registro = (c: Carpeta): Json => leerJSON(c, salida('registro.json'));
const plan = (c: Carpeta): Json => leerJSON(c, salida('plan.json'));
const voz = (c: Carpeta): string => JSON.stringify(registro(c).voz, null, 1);
const origenAttr = (r: RespuestaHistoria): string => (r.origen ? ` origen="${r.origen.replace(/"/g, "'")}"` : '');
const respuestasXml = (rs: RespuestaHistoria[]): string => rs.map((r) => `<respuesta id="${r.id}"${origenAttr(r)}>\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`).join('\n\n');
const base = (c: Carpeta, paso: 'registro' | 'plan' | 'hechos'): string[] => [lineaFijaHistoria(), tag('guia', guiaHistoria(paso)), tag('ficha', ficha(c)), tag('respuestas', respuestasXml(respuestasConOrigen(c)))];
const conError = (instr: string, error?: string): string => (error ? `${instr}\n\nTu respuesta anterior no pasó estos controles. Devolvé el JSON completo corregido:\n${error}` : instr);
const nn = (n: number): string => String(n).padStart(2, '0');

/** Los huecos de la pieza (receta, sección 2). */
function huecos(c: Carpeta, n?: number): HuecosHistoria {
  const h: HuecosHistoria = { NOMBRE: nombreDePila(c), TEMA: temaHueco(c) };
  if (n === undefined) return h;
  const cap = plan(c).capitulos.find((k: Json) => k.n === n), a = cap?.anios || {};
  return { ...h, N: String(n), ETAPA: `${cap?.etapa || ''}${a.desde ? ` (${a.desde}–${a.hasta || 'hoy'})` : ''}` };
}

const aR = (c: Carpeta, ids: string[] | undefined): string[] => {
  const eps = Object.fromEntries((registro(c).episodios || []).map((e: Json) => [e.id, e.ids]));
  return [...new Set((ids || []).flatMap((i) => (/^E\d+$/.test(i) ? eps[i] || [] : [i])).filter((i: string) => /^R\d+$/.test(i)))] as string[];
};

/** Respuestas en el orden del tiempo (el del plan) y con su "cuándo" del registro, como Familiar, más su origen. */
function respuestasEnElTiempo(c: Carpeta, ids: Set<string>): string {
  const reg = registro(c), p = plan(c), orden = new Map<string, number>(), cuando = new Map<string, string>();
  const ep = Object.fromEntries((reg.episodios || []).map((e: Json) => [e.id, e]));
  for (const e of reg.episodios || []) if (e.cuando) for (const r of e.ids) if (!cuando.has(r)) cuando.set(r, e.cuando);
  for (const cp of p.capitulos) for (const pz of cp.piezas || []) for (const r of ep[pz.episodio]?.ids || []) if (!orden.has(r)) { orden.set(r, orden.size); if (!cuando.has(r)) cuando.set(r, cp.etapa || ''); }
  const rs = respuestasConOrigen(c).filter((r) => ids.has(r.id)).sort((a, b) => (orden.get(a.id) ?? 1e9) - (orden.get(b.id) ?? 1e9) || Number(a.id.slice(1)) - Number(b.id.slice(1)));
  return rs.map((r) => `<respuesta id="${r.id}" cuando="${(cuando.get(r.id) || '').replace(/"/g, "'")}"${origenAttr(r)}>\n<pregunta>${r.pregunta}</pregunta>\n<texto>${r.texto}</texto>\n</respuesta>`).join('\n\n');
}

/** Las fichas de lo ya escrito (salidas/resumenes/<pieza>.md), en orden. */
function resumenHastaAca(c: Carpeta, antesDe: (pieza: string) => boolean): string {
  const ps = piezas(c).filter((x) => x.pieza !== 'sus_frases' && antesDe(x.pieza));
  return ps.map((x) => { const f = salida(`resumenes/${x.pieza}.md`); return c.existe(f) ? `=== ${x.pieza} ===\n${c.leer(f).trim()}` : ''; }).filter(Boolean).join('\n\n') || '(todavía nada)';
}

const idsDePieza = (c: Carpeta, pieza: string): Set<string> => (pieza === 'carta' ? new Set(aR(c, plan(c).carta?.ids)) : idsDeCapitulo(c, Number(pieza.slice(4))));

/** <hilo_libro>: el hilo de todo el libro y la lista de capítulos con su tramo y su hilo, del plan. */
export function hiloLibro(c: Carpeta): string {
  const p = plan(c), h = p.hilo_libro || {};
  return [
    `El hilo del libro: ${h.texto || '(el plan no lo trae)'}${(h.ids || []).length ? ` (${h.ids.join(', ')})` : ''}`,
    'Los capítulos:',
    ...p.capitulos.map((k: Json) => `- Capítulo ${k.n} · ${k.etapa || ''}: ${k.hilo || ''}${k.golpe?.episodio ? ' (es el del golpe del libro)' : ''}`),
  ].join('\n');
}

/** El golpe del libro, lo que lo prepara y su frase (como golpeTexto de Familiar); solo en el capítulo del golpe. */
function golpeTexto(c: Carpeta, g: Json, propias: Set<string>): string {
  const ep = Object.fromEntries((registro(c).episodios || []).map((e: Json) => [e.id, e]));
  const rs = Object.fromEntries(respuestasConOrigen(c).map((r) => [r.id, r.texto]));
  const linea = (id: string) => { const e = ep[id]; return e ? `${id} — ${e.que || ''} (${(e.ids || []).join(', ')}${(e.ids || []).some((i: string) => propias.has(i)) ? '' : '; de un capítulo anterior: está en <para_preparar>, va como recuerdo breve'})` : id; };
  return [
    `El golpe del libro: ${linea(g.episodio)}`,
    `Lo prepara, en este orden: ${(g.preparacion || []).length ? '' : '(nada en el plan)'}`,
    ...(g.preparacion || []).map((e: string) => `- ${linea(e)}`),
    g.frase_id ? `Su frase está en ${g.frase_id}: "${rs[g.frase_id] || ''}". Elegí de ahí la frase que lo dice, con sus palabras, y ponela en el golpe o en su salida.` : '',
  ].filter(Boolean).join('\n');
}

/** El Armador y el Capítulo: los mismos documentos, en el orden de la receta (voz justo antes de las instrucciones). */
function docsDeCapitulo(c: Carpeta, n: number, armador: boolean): string[] {
  const cap = plan(c).capitulos.find((k: Json) => k.n === n);
  const propias = idsDePieza(c, `cap_${n}`);
  const g = cap?.golpe?.episodio ? cap.golpe : null;
  const prep = new Set(aR(c, [...(cap?.preparacion || []), ...(g?.preparacion || []), ...(cap?.imagen?.ids || []), cap?.imagen?.episodio].filter(Boolean)).filter((i) => !propias.has(i)));
  const respuestas = tag('respuestas', respuestasEnElTiempo(c, propias));
  const hilo = tag('hilo_libro', hiloLibro(c));
  const golpe = g ? [tag('golpe', golpeTexto(c, g, propias))] : [];
  const paraPreparar = tag('para_preparar', prep.size ? respuestasEnElTiempo(c, prep) : '(nada)');
  const resumen = tag('resumen_hasta_aca', resumenHastaAca(c, (x) => x.startsWith('cap_') && Number(x.slice(4)) < n));
  if (armador) {
    const eps = (registro(c).episodios || []).filter((e: Json) => e.ids.some((i: string) => propias.has(i) || prep.has(i))).map(({ id, que, cuando, tipo, tramo, es_escena, momento_clave, detalles, ids }: Json) => ({ id, que, cuando, tipo, tramo, es_escena, momento_clave, detalles, ids }));
    return [respuestas, hilo, ...golpe, paraPreparar, tag('episodios', JSON.stringify(eps, null, 1)), resumen];
  }
  const hist = salida(`historias/cap_${n}.md`);
  return [tag('ficha', ficha(c)), respuestas, hilo, ...(c.existe(hist) ? [tag('historias', c.leer(hist))] : []), ...golpe, paraPreparar, resumen, tag('voz', voz(c))];
}

// ---------- idioma ----------
const ESCRIBEN = /^(3b-|3c-|3t-|6-arreglo-)/;
const CORRIGE = /^7-estilo-/;
function conIdioma(c: Carpeta, nombre: string, instr: string): string {
  const id = idiomaHistoria(c);
  if (id === 'es-AR') return instr;
  const [escritura, corrector] = bloquesHistoria(id === 'ca' ? '### Historia · Idioma · catalán' : '### Historia · Idioma · España');
  if (ESCRIBEN.test(nombre)) return `${instr}\n\n${escritura}`;
  if (CORRIGE.test(nombre)) return `${instr}\n\n${corrector}`;
  return instr;
}
const cerrar = (c: Carpeta, nombre: string, docs: string[], instr: string): Llamada => ({ nombre, docs, instr: conIdioma(c, nombre, instr) });
const instr = (c: Carpeta, clave: ClaveHistoria, n?: number): string => instruccionesHistoria(clave, huecos(c, n));

// ---------- los pasos ----------
export const llamadaRegistro = (c: Carpeta, o: ConError = {}): Llamada =>
  cerrar(c, '1-registro', base(c, 'registro'), conError(instr(c, '### Historia · Leer todo'), o.error));

export const llamadaPlan = (c: Carpeta, o: ConError = {}): Llamada =>
  cerrar(c, '2-plan', [...base(c, 'plan'), tag('registro', JSON.stringify(registro(c), null, 1))], conError(instr(c, '### Historia · Plan'), o.error));

export const llamadaArmador = (c: Carpeta, n: number): Llamada =>
  cerrar(c, `2h-armador-${nn(n)}`, docsDeCapitulo(c, n, true), instr(c, '### Historia · Armador', n));

export function llamadaCapitulo(c: Carpeta, n: number, o: ConError = {}): Llamada {
  // C30, como Familiar: si la versión anterior dejó afuera más de un tercio, se reescribe con el aviso.
  const aviso = o.error ? `\n\nTu versión anterior de este capítulo dejó afuera más de un tercio de sus respuestas. Escribilo de nuevo: como mucho un tercio afuera; lo que no empuja el hilo entra en una línea donde corresponde.\n${o.error}` : '';
  return cerrar(c, `3b-capitulo-${nn(n)}`, docsDeCapitulo(c, n, false), instr(c, '### Historia · Capítulo', n) + aviso);
}

/** La carta a quien era: solo si el plan trae carta.ids. */
export function llamadaCarta(c: Carpeta): Llamada | null {
  const ids = idsDePieza(c, 'carta');
  if (!ids.size) return null;
  const docs = [tag('ficha', ficha(c)), tag('respuestas', respuestasEnElTiempo(c, ids)), tag('resumen_hasta_aca', resumenHastaAca(c, (x) => x.startsWith('cap_'))), tag('voz', voz(c))];
  return cerrar(c, '3c-carta', docs, instr(c, '### Historia · Carta'));
}

export const llamadaSusFrases = (c: Carpeta): Llamada =>
  cerrar(c, '3e-sus-frases', [tag('respuestas', respuestasXml(respuestasConOrigen(c))), tag('resumen_hasta_aca', resumenHastaAca(c, () => true)), tag('voz', voz(c))], instr(c, '### Historia · Sus frases'));

export function llamadaResumen(c: Carpeta, pieza: string): Llamada {
  const x = piezas(c).find((q) => q.pieza === pieza);
  if (!x) throw new Error(`no existe la pieza ${pieza}`);
  return cerrar(c, `3r-resumen-${pieza}`, [tag('pieza', sinMarcas(x.texto))], instr(c, '### Historia · Ficha de lo escrito'));
}

/** Las piezas que se revisan y se corrigen: los capítulos y la carta (Sus frases no). */
const piezasDelLibro = (c: Carpeta) => piezas(c).filter((q) => q.pieza !== 'sus_frases');

export function llamadaHechos(c: Carpeta, o: { repaso: boolean }): Llamada {
  const repaso = o.repaso;
  const ps = piezas(c).filter((p) => !repaso || c.existe(`arreglos/respuesta-${p.pieza}.txt`));
  if (repaso && !ps.length) throw new Error('No hay piezas arregladas (arreglos/respuesta-<pieza>.txt): no hay repaso que hacer');
  const limpias = ps.map((p) => ({ ...p, texto: sinMarcas(p.texto) }));
  const docs = [...base(c, 'hechos'), tag('registro', JSON.stringify(registro(c), null, 1)), tag('libro', libroComo(ps)),
    tag('presentes', presentes(limpias).map((x) => `${x.pieza} §${x.parrafo}: ${x.oracion}`).join('\n')),
    tag('pasados', pasados(limpias, registro(c)).map((x) => `${x.pieza} §${x.parrafo} (${x.personas.join(', ')}): ${x.oracion}`).join('\n') || '(ninguna)')];
  if (repaso) docs.push(tag('decisiones_anteriores', JSON.stringify(decisionesAnteriores(c), null, 1)));
  const agregado = bloquesHistoria('### Historia · Hechos')[1];
  return cerrar(c, repaso ? '4-hechos-repaso' : '4-hechos', docs, instr(c, '### Historia · Hechos') + (repaso ? `\n\n${agregado}` : ''));
}

export function llamadaVeedor(c: Carpeta): Llamada {
  const ps = piezasDelLibro(c).map((q) => ({ ...q, texto: sinMarcas(q.texto) }));
  return cerrar(c, '5c-veedor', [tag('libro', libroComo(ps))], instr(c, '### Historia · Veedor'));
}

export function llamadaArreglo(c: Carpeta, pieza: string): Llamada {
  const probs = leerJSON(c, `arreglos/problemas-${pieza}.json`);
  const actual = piezas(c).find((p) => p.pieza === pieza);
  const docs = [tag('ficha', ficha(c)), tag('respuestas', respuestasEnElTiempo(c, idsDePieza(c, pieza))), tag('pieza_actual', actual ? actual.texto : ''), tag('problemas', JSON.stringify(probs, null, 1)), tag('voz', voz(c))];
  return cerrar(c, `6-arreglo-${pieza}`, docs, instr(c, '### Historia · Arreglo'));
}

export function llamadaEstilo(c: Carpeta, pieza: string, ronda: 1 | 2): Llamada {
  const x = piezas(c).find((q) => q.pieza === pieza);
  if (!x) throw new Error(`no existe la pieza ${pieza}`);
  const dos = ronda === 2;
  // La línea de la segunda pasada es la de Familiar (escritor/llamadas/armar.ts, llamadaEstilo).
  return cerrar(c, `7-estilo-${pieza}${dos ? '-2' : ''}`, [tag('ficha', ficha(c)), tag('pieza', x.texto), tag('voz', voz(c))], instr(c, '### Historia · Corrector') + (dos ? '\n\nEsta es la SEGUNDA pasada: la pieza ya pasó por un corrector. Buscá lo que quedó; lo que ya está bien no se toca.' : ''));
}

export function llamadaTitulo(c: Carpeta, n: number): Llamada {
  const x = piezas(c).find((q) => q.pieza === `cap_${n}`);
  if (!x) throw new Error(`no existe el capítulo ${n}`);
  return cerrar(c, `3t-titulo-${nn(n)}`, [tag('capitulo', sinMarcas(x.texto))], instr(c, '### Historia · Título del capítulo'));
}
