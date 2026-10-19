// Los controles del libro de Kids que hace el código, sin modelo (receta, sección 2, y plan, etapa C):
// - cada respuesta con texto está en alguna pieza, en el sobre, en el álbum (su foto) o en `afuera`;
// - ninguna pieza sin ids; cada id es de esa parte; la clave es de un item de esa parte;
// - ningún «:» en títulos, textos ni epígrafes (salvo el de la hora, «10:30»);
// - el texto de una pieza no es más largo que 1,5 veces lo que dijo en sus ids (no se estira);
// - las PADRE-n llevan la pregunta tal cual, la línea si va y el título vacío; las demás, título;
// - en el sobre, cada pregunta es la del material;
// - «Su voz» solo con respuestas con audio, que no son del sobre ni de lo marcado como preocupante (y nunca un QR
//   del sobre: el sobre no lleva QR).
// Los que fallan en las partes 1 a 4 van como problema al arreglo, junto con los del veedor. Los del sobre y el
// álbum van al informe para los socios (esos pasos no tienen arreglo).
// También están acá las formas mínimas de cada JSON (lo que pide su esquema): si no las cumple, el paso se pide
// otra vez con el error.
import type { AfueraKids, EpigrafeKids, PiezaKids, ProblemaKids, SalidaAlbum, SalidaLectura, SalidaParte, SalidaSobre, SalidaVeedor } from './llamadas.js';
import type { MaterialKids, ParteKids, RespuestaKids } from './material/tipos.js';
import { todasLasRespuestas } from './material/de-filas.js';

export const LARGO_MAXIMO = 1.5;
const ID = /^R\d+$/;
const CLAVE_PIEZA = /^(K\d+|X\d+-\d+|CIERRE-\d+|PADRE-\d+)$/;
const TIPOS = new Set(['inventado', 'falta', 'suena_a_grande', 'dos_puntos', 'estirado', 'otro']);

/** ¿Tiene un «:» que no es el de una hora? */
export const tieneDosPuntos = (s: string): boolean => s.replace(/\d{1,2}:\d{2}/g, '').includes(':');

// ---------- Formas (esquemas) ----------

const esTexto = (x: unknown): x is string => typeof x === 'string';
const sonIds = (x: unknown, minimo = 1): boolean => Array.isArray(x) && x.length >= minimo && x.every((i) => esTexto(i) && ID.test(i));

export function formaParte(j: unknown): string[] {
  const e: string[] = [];
  const o = j as SalidaParte;
  if (!o || !Array.isArray(o.piezas)) return ['falta "piezas" (una lista)'];
  if (!Array.isArray(o.afuera)) e.push('falta "afuera" (una lista, vacía si no hay nada)');
  o.piezas.forEach((p, i) => {
    if (!p || !esTexto(p.clave) || !CLAVE_PIEZA.test(p.clave)) e.push(`pieza ${i + 1}: la clave no es K12, X2-3, CIERRE-2 ni PADRE-1`);
    if (!esTexto(p?.titulo)) e.push(`pieza ${i + 1}: falta "titulo"`);
    if (!esTexto(p?.texto) || !p.texto.trim()) e.push(`pieza ${i + 1}: falta "texto"`);
    if (!sonIds(p?.ids)) e.push(`pieza ${i + 1}: "ids" tiene que tener al menos un id R01…`);
  });
  for (const a of o.afuera ?? []) if (!a || !esTexto(a.id) || !ID.test(a.id) || !esTexto(a.por_que)) e.push('afuera: cada entrada lleva "id" (R01…) y "por_que"');
  return e;
}

export function formaSobre(j: unknown): string[] {
  const o = j as SalidaSobre;
  if (!o || !Array.isArray(o.piezas)) return ['falta "piezas" (una lista)'];
  const e: string[] = [];
  o.piezas.forEach((p, i) => {
    if (!p || !esTexto(p.clave) || !p.clave) e.push(`pieza ${i + 1}: falta "clave"`);
    if (!esTexto(p?.pregunta) || !p.pregunta) e.push(`pieza ${i + 1}: falta "pregunta"`);
    if (!esTexto(p?.texto) || !p.texto.trim()) e.push(`pieza ${i + 1}: falta "texto"`);
    if (!sonIds(p?.ids)) e.push(`pieza ${i + 1}: "ids" tiene que tener al menos un id R01…`);
  });
  return e;
}

export function formaAlbum(j: unknown): string[] {
  const o = j as SalidaAlbum;
  if (!o || !Array.isArray(o.fotos)) return ['falta "fotos" (una lista)'];
  const e: string[] = [];
  o.fotos.forEach((f, i) => {
    if (!f || !esTexto(f.id) || !f.id) e.push(`foto ${i + 1}: falta "id"`);
    if (!esTexto(f?.epigrafe)) e.push(`foto ${i + 1}: falta "epigrafe" (vacío si no dijo nada)`);
    if (!sonIds(f?.ids, 0)) e.push(`foto ${i + 1}: "ids" es una lista de ids R01…`);
  });
  return e;
}

export function formaLectura(j: unknown): string[] {
  const o = j as SalidaLectura;
  if (!o || typeof o !== 'object') return ['no es un objeto JSON'];
  const e: string[] = [];
  if (!Array.isArray(o.preocupante)) e.push('falta "preocupante" (una lista, vacía si no hay nada)');
  else for (const p of o.preocupante) if (!p || !sonIds(p.ids) || !esTexto(p.cita) || !p.cita || !esTexto(p.por_que)) e.push('preocupante: cada entrada lleva "ids", "cita" y "por_que"');
  if (!Array.isArray(o.dudas)) e.push('falta "dudas" (una lista, vacía si no hay)');
  if (!sonIds(o.su_voz, 0)) e.push('"su_voz" es una lista de ids R01…');
  if (!esTexto(o.notas)) e.push('falta "notas" (vacío si no hay)');
  return e;
}

export function formaVeedor(j: unknown): string[] {
  const o = j as SalidaVeedor;
  if (!o || !Array.isArray(o.problemas)) return ['falta "problemas" (una lista, vacía si no hay)'];
  return o.problemas.flatMap((p, i) => (!p || !esTexto(p.clave) || !TIPOS.has(p.tipo) || !esTexto(p.cita) || !esTexto(p.arreglo) ? [`problema ${i + 1}: lleva "clave", "tipo" (inventado|falta|suena_a_grande|dos_puntos|estirado|otro), "cita" y "arreglo"`] : []));
}

// ---------- Contenido ----------

export type Salidas = { partes: Map<number, SalidaParte>; sobre: SalidaSobre | null; album: SalidaAlbum | null };

const textoDe = (rs: RespuestaKids[]): Map<string, RespuestaKids> => new Map(rs.map((r) => [r.id, r]));

/** Los ids que ya están en algún lado: piezas de cualquier parte, afuera, sobre, epígrafes, y lo de cada foto que está en el álbum. */
export function cubiertas(m: MaterialKids, s: Salidas): Set<string> {
  const c = new Set<string>();
  for (const p of s.partes.values()) {
    for (const pz of p.piezas) for (const id of pz.ids) c.add(id);
    for (const a of p.afuera ?? []) c.add(a.id);
  }
  for (const pz of s.sobre?.piezas ?? []) for (const id of pz.ids) c.add(id);
  const enAlbum = new Set((s.album?.fotos ?? []).map((f) => f.id));
  for (const f of s.album?.fotos ?? []) for (const id of f.ids) c.add(id);
  for (const f of m.fotos) if (enAlbum.has(f.id)) for (const r of f.respuestas) c.add(r.id);
  return c;
}

const corto = (s: string, n = 90): string => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

/** Los problemas que encuentra el código en una parte (van al arreglo con los del veedor). */
export function controlarParte(m: MaterialKids, parte: ParteKids, salida: SalidaParte, cub: Set<string>): ProblemaKids[] {
  const out: ProblemaKids[] = [];
  const propias = textoDe(parte.items.flatMap((i) => i.respuestas));
  const claves = new Set(parte.items.map((i) => i.clave));
  const vistas = new Set<string>();
  for (const pz of salida.piezas) {
    const nuevo = (tipo: ProblemaKids['tipo'], cita: string, arreglo: string) => out.push({ clave: pz.clave, tipo, cita, arreglo });
    if (!claves.has(pz.clave)) nuevo('otro', pz.clave, `la clave ${pz.clave} no es de un item de esta parte; usar la del item`);
    if (vistas.has(pz.clave)) nuevo('otro', pz.clave, `hay dos piezas con la clave ${pz.clave}; va una sola por item`);
    vistas.add(pz.clave);
    if (!pz.ids.length) nuevo('otro', corto(pz.texto), 'la pieza no tiene ids; poner los de las respuestas que usa');
    const ajenas = pz.ids.filter((id) => !propias.has(id));
    if (ajenas.length) nuevo('otro', ajenas.join(', '), `${ajenas.join(', ')} no son respuestas de esta parte; sacarlos de los ids`);
    if (tieneDosPuntos(pz.titulo)) nuevo('dos_puntos', pz.titulo, 'sacar el «:» del título');
    if (tieneDosPuntos(pz.texto)) nuevo('dos_puntos', corto(pz.texto.slice(Math.max(0, pz.texto.indexOf(':') - 40), pz.texto.indexOf(':') + 20)), 'sacar el «:»; una coma o un punto');
    const dijo = pz.ids.reduce((s, id) => s + (propias.get(id)?.texto.length ?? 0), 0);
    if (dijo > 0 && pz.texto.length > LARGO_MAXIMO * dijo) nuevo('estirado', corto(pz.texto), `la pieza tiene ${pz.texto.length} caracteres y lo que dijo ${dijo}; que no pase de lo que dijo`);
    const padre = m.ficha.preguntasPadre.find((p) => p.clave === pz.clave);
    if (padre) {
      if ((pz.pregunta ?? '') !== padre.texto) nuevo('otro', pz.pregunta ?? '(sin pregunta)', `la pregunta va tal cual, «${padre.texto}»`);
      if ((pz.linea ?? '') !== padre.linea) nuevo('otro', pz.linea || '(sin línea)', padre.linea ? `la línea es «${padre.linea}»` : 'esta pregunta va sin línea; "linea" vacía');
      if (pz.titulo.trim()) nuevo('otro', pz.titulo, 'en las preguntas del padre el título va vacío');
    } else if (!pz.titulo.trim()) nuevo('otro', corto(pz.texto), 'la pieza no tiene título; de 2 a 6 palabras suyas');
  }
  for (const a of salida.afuera ?? []) if (!propias.has(a.id)) out.push({ clave: 'afuera', tipo: 'otro', cita: a.id, arreglo: `${a.id} no es de esta parte; sacarlo de afuera` });
  for (const it of parte.items) for (const r of it.respuestas) {
    if (!cub.has(r.id)) out.push({ clave: it.clave, tipo: 'falta', cita: `${r.id} · ${corto(r.texto, 80)}`, arreglo: 'que entre con sus palabras en la pieza de su item, o en afuera si es solo un no sé' });
  }
  return out;
}

/** Los problemas del sobre (van al informe). */
export function controlarSobre(m: MaterialKids, s: SalidaSobre | null, cub: Set<string>): string[] {
  const rs = textoDe(m.sobre.items.flatMap((i) => i.respuestas));
  const out: string[] = [];
  for (const pz of s?.piezas ?? []) {
    const ajenas = pz.ids.filter((id) => !rs.has(id));
    if (ajenas.length) out.push(`${pz.clave}: ${ajenas.join(', ')} no son del sobre`);
    const propia = pz.ids.map((id) => rs.get(id)).find(Boolean);
    if (propia && pz.pregunta !== propia.pregunta) out.push(`${pz.clave}: la pregunta no es la del material («${corto(propia.pregunta, 60)}»)`);
    if (tieneDosPuntos(pz.texto)) out.push(`${pz.clave}: tiene «:»`);
    const dijo = pz.ids.reduce((sum, id) => sum + (rs.get(id)?.texto.length ?? 0), 0);
    if (dijo > 0 && pz.texto.length > LARGO_MAXIMO * dijo) out.push(`${pz.clave}: es más largo que lo que dijo (${pz.texto.length} contra ${dijo})`);
  }
  for (const r of rs.values()) if (!cub.has(r.id)) out.push(`${r.id} (${r.clave}) no está en el sobre ni en ningún lado`);
  return out;
}

/** Los problemas del álbum (van al informe). */
export function controlarAlbum(m: MaterialKids, a: SalidaAlbum | null): string[] {
  const out: string[] = [];
  const porId = new Map((a?.fotos ?? []).map((f) => [f.id, f]));
  for (const f of m.fotos) if (!porId.has(f.id)) out.push(`${f.id} no está en el álbum`);
  for (const e of a?.fotos ?? []) {
    const foto = m.fotos.find((f) => f.id === e.id);
    if (!foto) { out.push(`${e.id} no es una foto del material`); continue; }
    const propias = new Set(foto.respuestas.map((r) => r.id));
    const ajenas = e.ids.filter((id) => !propias.has(id));
    if (ajenas.length) out.push(`${e.id}: ${ajenas.join(', ')} no son de esa foto`);
    if (tieneDosPuntos(e.epigrafe)) out.push(`${e.id}: el epígrafe tiene «:»`);
    if (e.epigrafe.trim() && !e.ids.length) out.push(`${e.id}: el epígrafe no tiene ids`);
    const dijo = foto.respuestas.reduce((s, r) => s + r.texto.length, 0);
    if (e.epigrafe.length > LARGO_MAXIMO * Math.max(dijo, 1)) out.push(`${e.id}: el epígrafe es más largo que lo que dijo`);
  }
  return out;
}

/** «Su voz»: solo respuestas con audio, que no son del sobre ni de lo preocupante. Devuelve las que quedan y por qué salió cada una. */
export function suVozValida(m: MaterialKids, l: SalidaLectura): { ids: string[]; sacadas: { id: string; por_que: string }[] } {
  const todas = textoDe(todasLasRespuestas(m));
  const delSobre = new Set(m.sobre.items.flatMap((i) => i.respuestas.map((r) => r.id)));
  const preocupa = new Set(l.preocupante.flatMap((p) => p.ids));
  const ids: string[] = [];
  const sacadas: { id: string; por_que: string }[] = [];
  for (const id of l.su_voz) {
    const r = todas.get(id);
    if (!r) sacadas.push({ id, por_que: 'no existe' });
    else if (!r.audio) sacadas.push({ id, por_que: 'no tiene audio' });
    else if (delSobre.has(id)) sacadas.push({ id, por_que: 'es del sobre cerrado' });
    else if (preocupa.has(id)) sacadas.push({ id, por_que: 'está marcada como preocupante' });
    else if (ids.includes(id)) sacadas.push({ id, por_que: 'repetida' });
    else ids.push(id);
  }
  return { ids, sacadas };
}

/** Aplica el arreglo de una parte: cada pieza devuelta reemplaza a la de su clave; lo que cambió de lugar a afuera. */
export function aplicarArreglo(parte: ParteKids, vieja: SalidaParte, arreglo: SalidaParte, permitidas: Set<string>): { salida: SalidaParte; ignoradas: string[] } {
  const ignoradas = arreglo.piezas.filter((p) => !permitidas.has(p.clave)).map((p) => p.clave);
  const nuevas = new Map(arreglo.piezas.filter((p) => permitidas.has(p.clave)).map((p) => [p.clave, p]));
  const piezas: PiezaKids[] = vieja.piezas.map((p) => nuevas.get(p.clave) ?? p);
  for (const [clave, p] of nuevas) if (!vieja.piezas.some((v) => v.clave === clave)) piezas.push(p);
  const orden = new Map(parte.items.map((i, k) => [i.clave, k]));
  piezas.sort((a, b) => (orden.get(a.clave) ?? 999) - (orden.get(b.clave) ?? 999));
  const enPiezas = new Set(piezas.flatMap((p) => p.ids));
  const afuera: AfueraKids[] = [...(vieja.afuera ?? []), ...(arreglo.afuera ?? [])].filter((a, i, xs) => !enPiezas.has(a.id) && xs.findIndex((y) => y.id === a.id) === i);
  return { salida: { piezas, afuera }, ignoradas };
}

export type { EpigrafeKids };
