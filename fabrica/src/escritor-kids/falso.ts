// Respuestas falsas del modelo para correr la receta de Kids sin gastar (tests y `--falso` del script). Salen del
// material: cada pieza es lo que dijo con lo oral limpiado a mano de código (muletillas, repeticiones, risas), lo
// que es solo «no sé» va a afuera, las PADRE-n llevan su pregunta y su línea, el sobre su texto limpio y cada foto
// la primera o las dos primeras oraciones de lo que dijo. Lo que un chico concreto necesita escrito a mano (la
// lectura, los títulos, los problemas del veedor) viene en `extras` (para el chico inventado,
// test/fijos/escritor-kids/chico-inventado/modelo-falso.json). No es la receta: es un doble para probar la máquina.
import type { PiezaKids, ProblemaKids, SalidaAlbum, SalidaLectura, SalidaParte, SalidaSobre } from './llamadas.js';
import { NOMBRES } from './llamadas.js';
import type { ItemKids, MaterialKids, RespuestaKids } from './material/tipos.js';

export type ExtrasFalsos = { lectura?: SalidaLectura; titulos?: Record<string, string>; veedor?: Record<string, ProblemaKids[]> };

const mayuscula = (s: string): string => s.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_m, a: string, b: string) => a + b.toUpperCase());

/** Lo oral que sale (receta, Parte, regla 2), hecho con reglas simples. */
export function limpiarOral(t: string): string {
  let s = t.trim();
  s = s.replace(/\[risas\]/gi, ' ').replace(/\bja(ja)+\b/gi, ' ');
  s = s.replace(/(^|[\s,.])[Ee]h(\.\.\.|…)?,?(?=\s)/g, '$1');
  s = s.replace(/,?\s*\bo sea\b,?/gi, ',');
  s = s.replace(/(^|[.?!]\s+)(Bah|Bueno|Nada|Y nada),\s*/g, '$1');
  s = s.replace(/(^|[.?!]\s+)(Bueno|Nada)\.\s*/g, '$1');
  s = s.replace(/\b(\p{L}+),\s+\1\b/giu, '$1');
  s = s.replace(/(\d)\s*:\s*(\d\d)/g, '$1§$2').replace(/:/g, ',').replace(/§/g, ':');
  s = s.replace(/([.?!…])\s*,/g, '$1').replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/,\s*\./g, '.').replace(/(^|\s),\s*/g, '$1').replace(/\s+/g, ' ').trim();
  return mayuscula(s);
}

const SOLO_NO_SE = /^(no sé|no se|no me acuerdo|no tengo)\.?$/i;
const sinSignos = (s: string): string => s.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
const tituloDe = (texto: string): string => sinSignos(texto).split(' ').slice(0, 4).join(' ') || 'Esto';

function piezaDe(m: MaterialKids, it: ItemKids, titulos: Record<string, string>): { pieza: PiezaKids | null; afuera: { id: string; por_que: string }[] } {
  const usadas: RespuestaKids[] = [];
  const afuera: { id: string; por_que: string }[] = [];
  for (const r of it.respuestas) {
    if (SOLO_NO_SE.test(limpiarOral(r.texto))) afuera.push({ id: r.id, por_que: 'es solo un no sé' });
    else usadas.push(r);
  }
  if (!usadas.length) return { pieza: null, afuera };
  const texto = usadas.map((r) => limpiarOral(r.texto)).join(' ');
  const padre = m.ficha.preguntasPadre.find((p) => p.clave === it.clave);
  const pieza: PiezaKids = padre
    ? { clave: it.clave, titulo: '', texto, ids: usadas.map((r) => r.id), linea: padre.linea, pregunta: padre.texto }
    : { clave: it.clave, titulo: titulos[it.clave] ?? tituloDe(texto), texto, ids: usadas.map((r) => r.id) };
  return { pieza, afuera };
}

export function parteFalsa(m: MaterialKids, n: number, titulos: Record<string, string> = {}, soloClaves?: Set<string>): SalidaParte {
  const p = m.partes.find((x) => x.n === n);
  const out: SalidaParte = { piezas: [], afuera: [] };
  for (const it of p?.items ?? []) {
    if (soloClaves && !soloClaves.has(it.clave)) continue;
    const r = piezaDe(m, it, titulos);
    if (r.pieza) out.piezas.push(r.pieza);
    out.afuera.push(...r.afuera);
  }
  return out;
}

export const sobreFalso = (m: MaterialKids): SalidaSobre => ({
  piezas: m.sobre.items.flatMap((it) => it.respuestas.map((r) => ({ clave: r.clave, pregunta: r.pregunta, texto: limpiarOral(r.texto), ids: [r.id] }))),
});

export const albumFalso = (m: MaterialKids): SalidaAlbum => ({
  fotos: m.fotos.map((f) => {
    const r = f.respuestas.find((x) => x.audio) ?? f.respuestas[0];
    if (!r) return { id: f.id, epigrafe: '', ids: [] };
    const oraciones = limpiarOral(r.texto).match(/[^.!?]+[.!?]?/g) ?? [];
    const epigrafe = oraciones.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim();
    return { id: f.id, epigrafe, ids: epigrafe ? [r.id] : [] };
  }),
});

export function lecturaFalsa(m: MaterialKids): SalidaLectura {
  const conAudio = m.partes.flatMap((p) => p.items.flatMap((i) => i.respuestas.filter((r) => r.audio && r.texto.length > 40).slice(0, 1)).slice(0, 2));
  return { preocupante: [], dudas: [], su_voz: conAudio.slice(0, 8).map((r) => r.id), notas: '' };
}

/** Las salidas por nombre de llamada (como las busca ModeloFalso: por clave sin etapa y sin #). */
export function salidasFalsasKids(m: MaterialKids, x: ExtrasFalsos = {}): Record<string, string> {
  const titulos = x.titulos ?? {};
  const s: Record<string, string> = {
    [NOMBRES.leer]: JSON.stringify(x.lectura ?? lecturaFalsa(m)),
    [NOMBRES.sobre]: JSON.stringify(sobreFalso(m)),
    [NOMBRES.album]: JSON.stringify(albumFalso(m)),
  };
  for (const p of m.partes) {
    s[NOMBRES.parte(p.n)] = JSON.stringify(parteFalsa(m, p.n, titulos));
    const problemas = x.veedor?.[String(p.n)] ?? [];
    s[NOMBRES.veedor(p.n)] = JSON.stringify({ problemas });
    const claves = new Set(problemas.map((q) => q.clave));
    s[NOMBRES.arreglo(p.n)] = JSON.stringify({ ...parteFalsa(m, p.n, titulos, claves), afuera: [] });
  }
  return s;
}
