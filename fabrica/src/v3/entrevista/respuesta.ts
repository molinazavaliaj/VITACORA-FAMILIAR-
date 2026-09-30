// Qué dijo la persona (docs/v3/entrevista/simulaciones/textos-finales.md,
// reglas 2 a 18; Naza, 30/09, simulaciones). Una sola función, `interpretar`,
// decide si una respuesta es un "no", un "paso", un olvido, un "ya te lo
// conté", algo contado o nada, según la pregunta. Primero mandan los botones
// de WhatsApp; si contestó en audio, valen las reglas de respaldo sobre la
// transcripción. Puro: no lee nada de afuera.

import type { Boton, PreguntaEntrevista, ValeBoton } from './banco-md.js';

/**
 * Qué dijo. Desde la ronda 2 de simulaciones (Naza, 30/09) hay dos formas de
 * "contó algo" con su propio acuse: 'olvido-a-medias' (arranca con "no me
 * acuerdo" y sigue contando: M28.4) y 'no-ahondar' (arranca negándose y
 * sigue largo: M32).
 */
export type Interpretacion = 'no' | 'paso' | 'olvido' | 'olvido-a-medias' | 'no-ahondar' | 'ya-conto' | 'conto' | 'vacio';

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
// Revisión del 30/09: "Paso el río en bote", "Paso la tarde…", "Paso mucho tiempo…" también son el verbo.
const DESPUES_DE_PASO = new Set(['a', 'por', 'de', 'que', 'el', 'la', 'los', 'las', 'un', 'una', 'mucho', 'tiempo', 'todo']);
/**
 * Las frases que valen como paso (regla 11), sin tildes. Desde la revisión
 * del 30/09 (Naza, decisión A: "otra" y "siguiente" valen solo si son casi
 * toda la respuesta), estas valen solo si van solas: seguidas de un signo o
 * del final ("Siguiente.", "Esa no.", "De eso no. Hay cosas…"). "Otra vez
 * fuimos al río" o "Esa no era mi casa" cuentan algo.
 */
const FRASES_PASO_SOLAS = frases(['siguiente', 'otra', 'salteala', 'esa no', 'eso no', 'de eso no', 'prefiero no', 'mejor no', 'no hablemos']);
/** Las negativas completas: valen como paso aunque sigan palabras ("Eso me lo guardo, ya fue"). */
const FRASES_PASO_COMPLETAS = frases([
  'no quiero hablar de eso', 'prefiero no hablar de eso', 'prefiero no contarlo', 'eso me lo guardo', 'me lo guardo', 'dejemoslo ahi', 'mejor otra',
  // Después de la revisión: "De eso mejor no hablemos" y las formas con "esto" también son negativas completas.
  'no hablemos de eso', 'no hablemos de esto', 'no quiero hablar de esto', 'prefiero no hablar de esto', 'de eso no quiero hablar',
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
  return comienzos(f).some(
    (i) =>
      FRASES_PASO_COMPLETAS.some((frase) => hayFraseEn(f, i, frase)) ||
      FRASES_PASO_SOLAS.some((frase) => hayFraseEn(f, i, frase) && (f[i + frase.length] === undefined || f[i + frase.length] === CORTE)),
  );
}

/** "Ya te lo conté" corto (regla 18). */
const FRASES_YA_CONTO = ['ya te lo conte', 'ya te conte', 'ya lo conte', 'ya te lo dije'];

function esYaConto(pal: string[]): boolean {
  const t = ` ${pal.join(' ')} `;
  return pal.length <= PALABRAS_NO_CORTO && FRASES_YA_CONTO.some((x) => t.includes(` ${x} `));
}

/**
 * Olvido (regla 15), más angosto desde la revisión del 30/09: hasta 20
 * palabras, sin "pero" ni "aunque" ("La memoria me falla pero mi abuela…"
 * cuenta algo), y "no sé" no puede seguir con "si", "por (dónde)", "cómo",
 * "qué"… ("No sé por dónde empezar. Mi hija nació…" cuenta algo).
 */
const PALABRAS_OLVIDO = 20;
const ARRANQUES_OLVIDO = frases(['no me acuerdo', 'no recuerdo', 'no se', 'ni idea', 'no tengo idea']);
const DESPUES_DE_NO_SE = new Set(['si', 'por', 'como', 'que', 'cual', 'donde', 'cuando']);
/** "Se me borró" vale solo; "la memoria" y "la cabeza", solo con que falla ("La memoria me falla", no "En la cabeza tenía la idea…"). */
const SE_ME_BORRO = 'se me borro';
const MEMORIA = ['la memoria', 'la cabeza'];
const FALLA = ['me falla', 'me esta fallando', 'se me borro', 'no me da'];
/** "Se me borró" cuenta en las primeras palabras (regla 15: "en las primeras 8"). */
const PRIMERAS_OLVIDO = 8;
const CONTRASTES = new Set(['pero', 'aunque']);

/** ¿Arranca con una frase de olvido? ("No, no me acuerdo" también; "no sé si/por/cómo…" no). */
function arrancaConOlvido(f: string[]): boolean {
  // "No, no me acuerdo" también arranca con "no me acuerdo": el primer "no," es el mismo olvido dicho dos veces.
  const desde = f[0] === 'no' && f[1] === CORTE ? [0, 2] : [0];
  return desde.some((i) => ARRANQUES_OLVIDO.some((a) => hayFraseEn(f, i, a) && !(a.join(' ') === 'no se' && DESPUES_DE_NO_SE.has(f[i + 2]))));
}

function esOlvido(f: string[], pal: string[]): boolean {
  if (pal.length > PALABRAS_OLVIDO || pal.some((w) => CONTRASTES.has(w))) return false;
  if (arrancaConOlvido(f)) return true;
  const todo = ` ${pal.join(' ')} `;
  if (` ${pal.slice(0, PRIMERAS_OLVIDO).join(' ')} `.includes(` ${SE_ME_BORRO} `)) return true;
  return MEMORIA.some((m) => todo.includes(` ${m} `)) && FALLA.some((x) => todo.includes(` ${x} `));
}

/**
 * Olvido a medias (ronda 2, Naza, 30/09): arranca con una frase de olvido
 * pero no es olvido (más de 20 palabras o con "pero/aunque"): "No me acuerdo
 * bien, pero sé que había un patio…". Contó algo; lleva M28.4.
 */
function esOlvidoAMedias(f: string[], pal: string[]): boolean {
  return arrancaConOlvido(f) && !esOlvido(f, pal);
}

/**
 * Se negó pero siguió contando (ronda 2, Naza, 30/09; antes la regla 12): la
 * respuesta arranca con una frase de la lista del paso que es una negativa
 * (una completa, una sola seguida de un signo, o una seguida de "hablemos",
 * "hablar", "contar"… y de un signo o "de eso") y sigue larga, así que no es paso. "De eso mejor no
 * hablemos. La política es complicada…" lleva M32. "Otra vez fuimos al río"
 * o "Mejor no ir solo" no son negarse.
 */
const VERBOS_DE_NEGARSE = new Set(['hablemos', 'hablar', 'hablo', 'contar', 'contarlo', 'contarte', 'entrar', 'meterme']);

function esNoAhondar(f: string[]): boolean {
  return comienzos(f).some(
    (i) =>
      FRASES_PASO_COMPLETAS.some((frase) => hayFraseEn(f, i, frase)) ||
      FRASES_PASO_SOLAS.some((frase) => {
        if (!hayFraseEn(f, i, frase)) return false;
        const j = i + frase.length;
        const cierra = (k: number) => f[k] === undefined || f[k] === CORTE || (f[k] === 'de' && f[k + 1] === 'eso');
        // "Mejor no hablemos." o "prefiero no hablar de eso": se niega. "Prefiero no hablar mal de él…": cuenta.
        return cierra(j) || (VERBOS_DE_NEGARSE.has(f[j]) && cierra(j + 1));
      }),
  );
}

/** "No" corto (reglas 13 y 14). */
const ARRANQUES_NO = new Set(['no', 'nunca', 'jamas', 'ninguno', 'ninguna', 'nada', 'tampoco']);
/** Arranques con "no" que en realidad cuentan algo (revisión del 30/09): "No sabés lo que fue…", "Nunca me voy a olvidar…", "No sé por dónde empezar…". */
const ARRANQUES_QUE_CUENTAN = frases([
  'nada que ver', 'nunca me voy a olvidar', 'nunca me olvido', 'nunca voy a olvidar', 'no sabes', 'no te imaginas', 'no me lo vas a creer', 'no se',
]);
/** Solo cuentan en las primeras 5 palabras (regla 14). */
const PRIMERAS_CONTRASTE = 5;

/**
 * En HI0 ("¿Tuviste hijos, o criaste a alguno como si lo fuera?") un "no
 * tuve hijos propios, criamos a Lucas" es un sí: la pregunta pide a los
 * criados (revisión del 30/09).
 */
const HI0 = 'HI0';
const CRIAR = /^cri(e|o|amos|aron|aste|ar|ado|ada|ados|adas|aba|abamos|aban)$/;
const COMO_HIJO = ['como un hijo', 'como mi hijo', 'como una hija', 'como mi hija'];

function crioAAlguien(pal: string[]): boolean {
  const t = ` ${pal.join(' ')} `;
  return pal.some((w) => w === 'propios' || w === 'propias' || CRIAR.test(w)) || COMO_HIJO.some((x) => t.includes(` ${x} `));
}

/**
 * En los cierres y en LE9, "está todo / es todo / ya está / nada más" en las
 * primeras 6 palabras es un "no" aunque no empiece con "no" ("Sí, está todo.
 * Fue una vida plena"); con "pero" o "aunque" en las primeras 5 palabras, no
 * (ronda 2, Naza, 30/09). Revisión: la fórmula tiene que cerrar la frase
 * (seguida de un signo o del final), así "Nada más lindo que esos veranos…"
 * cuenta algo; y vale el tope de 40 palabras (decisión B de Naza), así un
 * "Ya está, eso es todo. Ahora que lo pienso, había un chico…" largo también.
 */
const FORMULAS_DE_CIERRE = frases(['esta todo', 'es todo', 'ya esta', 'nada mas']);
const PRIMERAS_FORMULA = 6;

/** Después de la fórmula: un signo, el final, "por ahora" o "lo que…" ("Es todo lo que tengo para contar"). */
function cierraFormula(f: readonly string[], k: number): boolean {
  return f[k] === undefined || f[k] === CORTE || (f[k] === 'por' && f[k + 1] === 'ahora') || (f[k] === 'lo' && f[k + 1] === 'que');
}

function esFormulaDeCierre(p: PreguntaParaInterpretar, f: string[], pal: string[]): boolean {
  if (p.clase !== 'cierre' && p.id !== LE9) return false;
  // El tope de 40 no corre si arranca con "no" ("No, creo que está todo. Las historias que tengo son esas…").
  if ((pal[0] !== 'no' && pal.length > topeNoCorto(p)) || pal.slice(0, PRIMERAS_CONTRASTE).some((w) => CONTRASTES.has(w))) return false;
  let palabras = 0;
  for (let i = 0; i < f.length && palabras < PRIMERAS_FORMULA; i++) {
    if (f[i] === CORTE) continue;
    const cierra = FORMULAS_DE_CIERRE.some((x) => hayFraseEn(f, i, x) && cierraFormula(f, i + x.length));
    if (cierra) return true;
    palabras++;
  }
  return false;
}

function esNoDicho(p: PreguntaParaInterpretar, f: string[], pal: string[]): boolean {
  if (esNoCortoDicho(p, f, pal)) return true;
  return esFormulaDeCierre(p, f, pal);
}

function esNoCortoDicho(p: PreguntaParaInterpretar, f: string[], pal: string[]): boolean {
  if (!ARRANQUES_NO.has(pal[0]) || pal.length > topeNoCorto(p)) return false;
  if (ARRANQUES_QUE_CUENTAN.some((a) => hayFraseEn(f, 0, a))) return false;
  // "Nada más lindo que esos veranos…" cuenta algo; "Nada más." o "Nada más, gracias." no.
  if (f[0] === 'nada' && f[1] === 'mas' && f[2] !== undefined && f[2] !== CORTE) return false;
  if (p.id === HI0 && crioAAlguien(pal)) return false;
  // En los cierres "pero" no lo da vuelta: "No, pero ya está todo" sigue siendo que no.
  return p.clase === 'cierre' || !pal.slice(0, PRIMERAS_CONTRASTE).some((w) => CONTRASTES.has(w));
}

/**
 * Qué dijo, según la pregunta (Naza, 30/09, simulaciones):
 *   - si tocó un botón, manda el botón, aunque después haya mandado audio
 *     (regla 6): "sí" → 'conto', "no" → 'no', "paso" → 'paso';
 *   - si no dijo nada (transcripción vacía, un emoji) → 'vacio';
 *   - paso (reglas 10 y 11), olvido (15), olvido a medias y "no ahondar"
 *     (ronda 2), "no" corto (13 y 14, y las fórmulas de cierre de la ronda 2)
 *     y "ya te lo conté" (18), en ese orden: "Paso, mejor no. Ya lo conté…" es paso,
 *     "No me acuerdo" es olvido antes que "no", y "No tuve hijos, ya te lo
 *     conté" es un "no" (revisión del 30/09: el "no" le gana);
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
  if (esOlvido(f, pal)) return 'olvido';
  if (esOlvidoAMedias(f, pal)) return 'olvido-a-medias';
  if (esNoAhondar(f)) return 'no-ahondar';
  if (esNoDicho(pregunta, f, pal)) return 'no';
  if (esYaConto(pal)) return 'ya-conto';
  return 'conto';
}

/** Para las que dependen (`si:X`): tocó "Sí", contó algo, dijo "ya te lo conté" o no se acordó (reglas 16 y 18). */
export function habilitaLasQueDependen(i: Interpretacion): boolean {
  return i === 'conto' || i === 'ya-conto' || i === 'olvido' || i === 'olvido-a-medias' || i === 'no-ahondar';
}
