// Qué dijo la persona (docs/v3/entrevista/simulaciones/textos-finales.md,
// reglas 2 a 18; Naza, 30/09, simulaciones). Una sola función, `interpretar`,
// decide si una respuesta es un "no", un "paso", un olvido, un "ya te lo
// conté", algo contado o nada, según la pregunta. Primero mandan los botones
// de WhatsApp; si contestó en audio, valen las reglas de respaldo sobre la
// transcripción. Puro: no lee nada de afuera.

import type { Boton, PreguntaEntrevista, ValeBoton } from './banco-md.js';

export type Interpretacion = 'no' | 'paso' | 'olvido' | 'ya-conto' | 'conto' | 'vacio';

/** Lo que hace falta saber de la pregunta para interpretar: si es cierre, si es sensible y qué botones tiene. */
export type PreguntaParaInterpretar = Pick<PreguntaEntrevista, 'id' | 'clase' | 'sensible'> & { botones?: readonly Boton[] };

/** Una pregunta común, para cuando no se sabe cuál es (una de la familia). */
export const PREGUNTA_COMUN: PreguntaParaInterpretar = { id: '', clase: 'historia', sensible: false };

// ---------------------------------------------------------------- botones

/**
 * Un toque se guarda como texto, con una marca al principio, así la
 * respuesta sigue siendo un string: "⟦botón:No tuve hijos⟧". Si después manda
 * audio, se suma atrás (PLAN-codigo.md).
 */
export function respuestaDeBoton(texto: string): string {
  return `⟦botón:${texto}⟧`;
}

const MARCA = /^⟦botón:([^⟧]*)⟧\s*/;

/** El botón que tocó (si tocó) y el resto de la respuesta (los audios de después). */
export function leerBoton(respuesta: string): { boton?: string; resto: string } {
  const m = MARCA.exec(respuesta);
  return m ? { boton: m[1], resto: respuesta.slice(m[0].length) } : { resto: respuesta };
}

/** Suma un audio (su transcripción) a lo que ya tenía esa pregunta. */
export function sumarAudio(respuesta: string, audio: string): string {
  return [respuesta.trim(), audio.trim()].filter(Boolean).join(' ');
}

/**
 * Qué vale tocar ese botón en esa pregunta: lo dice el banco. Si la pregunta
 * no lo tiene (no debería pasar), "Sí…" vale sí (regla 2: "cualquier botón
 * que empiece con Sí"), "Paso esta" vale paso y cualquier otro vale no.
 */
export function valeBoton(pregunta: Pick<PreguntaParaInterpretar, 'botones'>, texto: string): ValeBoton {
  const b = pregunta.botones?.find((x) => x.texto === texto);
  if (b) return b.vale;
  if (/^s[ií](?![a-záéíóúñ])/i.test(texto.trim())) return 'si';
  return normalizar(texto) === 'paso esta' ? 'paso' : 'no';
}

// ---------------------------------------------------------------- palabras

/** Minúsculas, sin tildes y sin signos: "¡No, Nunca!" → "no nunca". */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Marca de un signo entre palabras: "No, se fue" no es "no se" (olvido), y "Paso." no sigue con "a…". */
const CORTE = '|';

/**
 * "Pasó" no es "paso": "Sí, te cuento lo que pasó." contó algo. Es la única
 * palabra que conserva la tilde, para que no la confundan las reglas del paso.
 */
const PASO_CON_TILDE = 'pasó';

/** Las palabras en minúscula, sin tildes (salvo "pasó") y con las letras estiradas achicadas ("Nooo" → "no"); cada signo deja un CORTE. */
function fichas(texto: string): string[] {
  const crudas = texto.toLowerCase().normalize('NFC').match(/[\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}\s]+/gu) ?? [];
  const out: string[] = [];
  for (const c of crudas) {
    const esPalabra = /^[\p{L}\p{M}\p{N}]/u.test(c);
    if (!esPalabra) {
      if (out.length > 0 && out.at(-1) !== CORTE) out.push(CORTE);
      continue;
    }
    const w = c === PASO_CON_TILDE ? c : c.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out.push(w.replace(/(\p{L})\1{2,}/gu, '$1'));
  }
  return out;
}

/** Muletillas de audio que se saltean al principio ("Eh, no", "Bueno, paso"). */
const MULETILLAS = new Set(['eh', 'em', 'm', 'mm', 'este', 'bueno', 'mira', 'mire', 'ay', 'ah', 'uh', 'pues']);
const MULETILLAS_DOBLES = [['a', 'ver'], ['o', 'sea']];

/** Las fichas sin las muletillas (ni los signos) del principio. */
function sinMuletillas(f: string[]): string[] {
  let i = 0;
  for (;;) {
    if (f[i] === CORTE || MULETILLAS.has(f[i])) { i++; continue; }
    if (MULETILLAS_DOBLES.some(([a, b]) => f[i] === a && f[i + 1] === b)) { i += 2; continue; }
    return f.slice(i);
  }
}

/** ¿Las fichas desde `i` son esa frase, palabra por palabra y sin un signo en el medio? */
function hayFraseEn(f: readonly string[], i: number, frase: readonly string[]): boolean {
  return frase.every((w, k) => f[i + k] === w);
}

const frases = (lista: string[]) => lista.map((x) => x.split(' '));

// ---------------------------------------------------------------- reglas

/** Tope del "no" corto en una pregunta común: hasta 15 palabras (regla 13; antes era "menos de 15"). */
export const PALABRAS_NO_CORTO = 15;
/** Tope del "no" corto en cierres, LE9, sensibles y las que abren tema (regla 13). */
export const PALABRAS_NO_LARGO = 40;
/** Las 9 que abren tema (llevan botón de "Sí"; regla 1). */
export const ABREN_TEMA: readonly string[] = ['CA6', 'JU8', 'AM0', 'AM3', 'AM9', 'AM16', 'AM20', 'HI0', 'HI8'];
const LE9 = 'LE9';

/** Hasta cuántas palabras puede tener un "no" corto en esta pregunta (regla 13). */
export function topeNoCorto(p: PreguntaParaInterpretar): number {
  return p.clase === 'cierre' || p.id === LE9 || p.sensible || ABREN_TEMA.includes(p.id) ? PALABRAS_NO_LARGO : PALABRAS_NO_CORTO;
}

/** Hasta cuántas palabras vale "paso" como última palabra, o una frase de la lista (reglas 10 y 11). */
const PALABRAS_PASO = 12;
/** "Paso a contarte…", "paso por la casa…": ahí "paso" es un verbo, no un "paso" (regla 10). */
const DESPUES_DE_PASO = new Set(['a', 'por', 'de', 'que']);
/** Las frases que valen como paso (regla 11), sin tildes. */
const FRASES_PASO = frases([
  'siguiente', 'otra', 'mejor otra', 'salteala', 'esa no', 'eso no', 'de eso no', 'no quiero hablar de eso',
  'prefiero no', 'mejor no', 'eso me lo guardo', 'me lo guardo', 'dejemoslo ahi',
]);
/** Lo que se admite adelante de una frase de la lista ("Ahí prefiero no", "Esa mejor no"). */
const ANTES_DE_FRASE = frases(['de eso', 'eso', 'esa', 'ahi', 'mejor']);

/** Los lugares donde puede empezar la frase: el principio y después de cada cosa admitida adelante. */
function comienzos(f: readonly string[]): number[] {
  const out = [0];
  let i = 0;
  for (;;) {
    const antes = ANTES_DE_FRASE.find((a) => hayFraseEn(f, i, a));
    if (!antes) return out;
    i += antes.length;
    if (f[i] === CORTE) i++;
    out.push(i);
  }
}

function esPasoDicho(f: string[], pal: string[]): boolean {
  if (f[0] === 'paso' && !DESPUES_DE_PASO.has(f[1])) return true; // f[1] puede ser un signo: "Paso. A mí…" es paso
  if (pal.length > PALABRAS_PASO) return false;
  if (pal.at(-1) === 'paso') return true;
  return comienzos(f).some((i) => FRASES_PASO.some((frase) => hayFraseEn(f, i, frase)));
}

/** "Ya te lo conté" corto (regla 18). */
const FRASES_YA_CONTO = ['ya te lo conte', 'ya te conte', 'ya lo conte', 'ya te lo dije'];

function esYaConto(pal: string[]): boolean {
  const t = ` ${pal.join(' ')} `;
  return pal.length <= PALABRAS_NO_CORTO && FRASES_YA_CONTO.some((x) => t.includes(` ${x} `));
}

/** Olvido (regla 15): hasta 40 palabras. */
const PALABRAS_OLVIDO = 40;
const ARRANQUES_OLVIDO = frases(['no me acuerdo', 'no recuerdo', 'no se', 'ni idea', 'no tengo idea']);
const OLVIDO_ADENTRO = ['se me borro', 'la memoria', 'la cabeza'];
/** En las primeras palabras (regla 15: "en las primeras 8"). */
const PRIMERAS_OLVIDO = 8;

function esOlvido(f: string[], pal: string[]): boolean {
  if (pal.length > PALABRAS_OLVIDO) return false;
  // "No, no me acuerdo" también arranca con "no me acuerdo": el primer "no," es el mismo olvido dicho dos veces.
  const desde = f[0] === 'no' && f[1] === CORTE ? [0, 2] : [0];
  if (desde.some((i) => ARRANQUES_OLVIDO.some((a) => hayFraseEn(f, i, a)))) return true;
  const primeras = ` ${pal.slice(0, PRIMERAS_OLVIDO).join(' ')} `;
  return OLVIDO_ADENTRO.some((x) => primeras.includes(` ${x} `));
}

/** "No" corto (reglas 13 y 14). */
const ARRANQUES_NO = new Set(['no', 'nunca', 'jamas', 'ninguno', 'ninguna', 'nada', 'tampoco']);
/** Si aparecen al principio, el "no" viene seguido de algo que contar ("Nunca lo pensé, pero…"). */
const CONTRASTES = new Set(['pero', 'aunque']);
/** Solo cuentan en las primeras 5 palabras (regla 14). */
const PRIMERAS_CONTRASTE = 5;

function esNoDicho(p: PreguntaParaInterpretar, pal: string[]): boolean {
  if (!ARRANQUES_NO.has(pal[0]) || pal.length > topeNoCorto(p)) return false;
  // En los cierres "pero" no lo da vuelta: "No, pero ya está todo" sigue siendo que no.
  return p.clase === 'cierre' || !pal.slice(0, PRIMERAS_CONTRASTE).some((w) => CONTRASTES.has(w));
}

/**
 * Qué dijo, según la pregunta (Naza, 30/09, simulaciones):
 *   - si tocó un botón, manda el botón, aunque después haya mandado audio
 *     (regla 6): "sí" → 'conto', "no" → 'no', "paso" → 'paso';
 *   - si no dijo nada (transcripción vacía, un emoji) → 'vacio';
 *   - paso (reglas 10 y 11), "ya te lo conté" (18), olvido (15) y "no" corto
 *     (13 y 14), en ese orden: "Paso, mejor no. Ya lo conté…" es paso, y
 *     "No me acuerdo" es olvido antes que "no";
 *   - si no, contó algo.
 */
export function interpretar(pregunta: PreguntaParaInterpretar, respuesta: string): Interpretacion {
  const { boton, resto } = leerBoton(respuesta);
  if (boton !== undefined) {
    const vale = valeBoton(pregunta, boton);
    return vale === 'si' ? 'conto' : vale;
  }
  const f = sinMuletillas(fichas(resto));
  const pal = f.filter((w) => w !== CORTE);
  if (pal.length === 0) return 'vacio';
  if (esPasoDicho(f, pal)) return 'paso';
  if (esYaConto(pal)) return 'ya-conto';
  if (esOlvido(f, pal)) return 'olvido';
  if (esNoDicho(pregunta, pal)) return 'no';
  return 'conto';
}

/** Para las que dependen (`si:X`): tocó "Sí", contó algo, dijo "ya te lo conté" o no se acordó (reglas 16 y 18). */
export function habilitaLasQueDependen(i: Interpretacion): boolean {
  return i === 'conto' || i === 'ya-conto' || i === 'olvido';
}
