// Qué dijo la persona (docs/v3/entrevista/simulaciones/textos-finales.md,
// reglas 2 a 18; Naza, 30/09, simulaciones). Una sola función, `interpretar`,
// decide si una respuesta es un "no", un "paso", un olvido, un "ya te lo
// conté", algo contado o nada, según la pregunta. Primero mandan los botones
// de WhatsApp; si contestó en audio, valen las reglas de respaldo sobre la
// transcripción. Puro: no lee nada de afuera.

import type { Boton, PreguntaEntrevista, ValeBoton } from './banco-md.js';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';

/**
 * Qué dijo. Desde la ronda 2 de simulaciones (Naza, 30/09) hay dos formas de
 * "contó algo" con su propio acuse: 'olvido-a-medias' (arranca con "no me
 * acuerdo" y sigue contando: M28.4) y 'no-ahondar' (arranca negándose y
 * sigue largo: M32).
 */
export type Interpretacion = 'no' | 'paso' | 'olvido' | 'olvido-a-medias' | 'no-ahondar' | 'ya-conto' | 'conto' | 'vacio';

/**
 * Lo que hace falta saber de la pregunta para interpretar: si es cierre, si
 * es sensible y qué botones tiene. El texto, si viene, sirve para el olvido:
 * lo que repite la pregunta no es un "pedacito" (prueba de Naza, 30/09).
 */
export type PreguntaParaInterpretar = Pick<PreguntaEntrevista, 'id' | 'clase' | 'sensible'> & { botones?: readonly Boton[]; texto?: string };

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
  return BOTONES_DE_PASO.includes(normalizar(texto)) ? 'paso' : 'no';
}

/** [Paso esta] pasó a llamarse [Prefiero no contarla] (Naza, 30/09, prueba en la página); el viejo sigue valiendo paso en los estados guardados. */
const BOTONES_DE_PASO = ['prefiero no contarla', 'paso esta'];

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
 * Un signo fuerte (punto, punto y coma, dos puntos, exclamación, pregunta):
 * "Esa no." se niega; "Esa no, la otra casa…" cuenta (revisión de la ronda 2).
 * Es también un corte: `esCorte` vale para los dos.
 */
const PUNTO = '.';
const SIGNO_FUERTE = /[.;:!?…¡¿]/;

function esCorte(w: string | undefined): boolean {
  return w === CORTE || w === PUNTO;
}

/**
 * "Pasó" no es "paso": "Sí, te cuento lo que pasó." contó algo. Es la única
 * palabra que conserva la tilde, para que no la confundan las reglas del paso.
 */
const PASO_CON_TILDE = 'pasó';

/**
 * Una palabra catalana con apóstrofo, guion o punto volado adentro
 * ("me'n", "parlar-ne", "col·legi") es una sola ficha: si no, "no me'n
 * recordo" quedaba cortada en "me" | "n" (Naza, 04/10, entrevista en catalán).
 */
const PALABRA_CATALANA = /[\p{L}\p{M}\p{N}]+(?:['’·-][\p{L}\p{M}\p{N}]+)*|[^\p{L}\p{M}\p{N}\s]+/gu;
const PALABRA = /[\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}\s]+/gu;

/**
 * Las palabras en minúscula, sin tildes (salvo "pasó") y con las letras
 * estiradas achicadas ("Nooo" → "no"); cada signo deja un CORTE. Con
 * `unirApostrofos` (catalán), el apóstrofo curvo pasa a recto y el punto
 * volado se borra ("col·legi" → "collegi").
 */
function fichas(texto: string, unirApostrofos = false): string[] {
  const t = texto.toLowerCase().normalize('NFC');
  const crudas = (unirApostrofos ? t.match(PALABRA_CATALANA)?.map((c) => c.replace(/’/g, "'").replace(/·/g, '')) : t.match(PALABRA)) ?? [];
  const out: string[] = [];
  for (const c of crudas) {
    const esPalabra = /^[\p{L}\p{M}\p{N}]/u.test(c);
    if (!esPalabra) {
      const marca = SIGNO_FUERTE.test(c) ? PUNTO : CORTE;
      if (out.length === 0) continue;
      if (esCorte(out.at(-1))) {
        if (marca === PUNTO) out[out.length - 1] = PUNTO;
      } else out.push(marca);
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
function sinMuletillas(f: string[], fr: Frases): string[] {
  let i = 0;
  for (;;) {
    if (esCorte(f[i]) || fr.muletillas.has(f[i])) { i++; continue; }
    // "Que no, hijo…", "Que sí": el "que" de insistir no tapa la respuesta (simulación es-ES, 06/10).
    if (f[i] === 'que' && (f[i + 1] === 'no' || f[i + 1] === 'si')) { i++; continue; }
    if (fr.muletillasDobles.some(([a, b]) => f[i] === a && f[i + 1] === b)) { i += 2; continue; }
    return f.slice(i);
  }
}

/** ¿Las fichas desde `i` son esa frase, palabra por palabra y sin un signo en el medio? */
function hayFraseEn(f: readonly string[], i: number, frase: readonly string[]): boolean {
  return frase.every((w, k) => f[i + k] === w);
}

const frases = (lista: string[]) => lista.map((x) => x.split(' '));

/** ¿Hay un "pero" (o "aunque", "encara que"…) en estas palabras? */
function hayContraste(pal: readonly string[], fr: Frases): boolean {
  if (pal.some((w) => fr.contrastes.has(w))) return true;
  const t = ` ${pal.join(' ')} `;
  return fr.contrastesFrases.some((x) => t.includes(` ${x} `));
}

// ---------------------------------------------------------------- reglas

/** Tope del "no" corto en una pregunta común: hasta 15 palabras (regla 13; antes era "menos de 15"). */
export const PALABRAS_NO_CORTO = 15;
/** Tope del "no" corto en cierres, LE9, sensibles y las que abren tema (regla 13). */
export const PALABRAS_NO_LARGO = 40;
/**
 * Las 8 que abren tema (llevan botón de "Sí"; regla 1). Desde la prueba de
 * Naza en la página (30/09): entran AMH y AM21; salen AM9 (ya no abre tema:
 * sigue con tope 40 por sensible), AM16 y AM20 (fuera del banco).
 */
export const ABREN_TEMA: readonly string[] = ['CA6', 'JU8', 'AM0', 'AMH', 'AM3', 'AM21', 'HI0', 'HI8'];
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
  'no quiero hablar de eso', 'prefiero no hablar de eso', 'prefiero no contarlo', 'prefiero no contarla', 'eso me lo guardo', 'me lo guardo', 'dejemoslo ahi', 'mejor otra',
  // Después de la revisión: "De eso mejor no hablemos" y las formas con "esto" también son negativas completas.
  'no hablemos de eso', 'no hablemos de esto', 'no quiero hablar de esto', 'prefiero no hablar de esto', 'de eso no quiero hablar',
]);
/** Lo que se admite adelante de una frase de la lista ("Ahí prefiero no", "Esa mejor no"). */
const ANTES_DE_FRASE = frases(['de eso', 'eso', 'esa', 'ahi', 'mejor']);

/** Los lugares donde puede empezar la frase: el principio y después de cada cosa admitida adelante. */
function comienzos(f: readonly string[], fr: Frases): number[] {
  const out = [0];
  let i = 0;
  for (;;) {
    const antes = fr.antesDeFrase.find((a) => hayFraseEn(f, i, a));
    if (!antes) return out;
    i += antes.length;
    if (esCorte(f[i])) i++;
    out.push(i);
  }
}

/** "Otra, dijo mi mamá…", "Me lo guardo, dijo mi papá…": la frase es de otro, está contando (revisión de la ronda 2). */
function sigueDijo(f: readonly string[], k: number, fr: Frases): boolean {
  const j = esCorte(f[k]) ? k + 1 : k;
  return fr.dijo.some((d) => hayFraseEn(f, j, d));
}

function esPasoDicho(f: string[], pal: string[], fr: Frases): boolean {
  if (fr.paso.has(f[0]) && !fr.despuesDePaso.has(f[1])) return true; // f[1] puede ser un signo: "Paso. A mí…" es paso
  if (pal.length > PALABRAS_PASO) return false;
  if (fr.paso.has(pal[pal.length - 1])) return true;
  return comienzos(f, fr).some(
    (i) =>
      fr.pasoCompletas.some((frase) => hayFraseEn(f, i, frase) && !sigueDijo(f, i + frase.length, fr)) ||
      fr.pasoSolas.some((frase) => hayFraseEn(f, i, frase) && (f[i + frase.length] === undefined || esCorte(f[i + frase.length])) && !sigueDijo(f, i + frase.length, fr)),
  );
}

/** "Ya te lo conté" corto (regla 18). */
const FRASES_YA_CONTO = ['ya te lo conte', 'ya te conte', 'ya lo conte', 'ya te lo dije'];

function esYaConto(pal: string[], fr: Frases): boolean {
  const t = ` ${pal.join(' ')} `;
  return pal.length <= PALABRAS_NO_CORTO && fr.yaConto.some((x) => t.includes(` ${x} `));
}

/**
 * Olvido (regla 15), más angosto desde la revisión del 30/09: hasta 20
 * palabras, sin "pero" ni "aunque" ("La memoria me falla pero mi abuela…"
 * cuenta algo), y "no sé" no puede seguir con "si", "por (dónde)", "cómo",
 * "qué"… ("No sé por dónde empezar. Mi hija nació…" cuenta algo).
 */
const PALABRAS_OLVIDO = 20;
/** Revisión de la ronda 2: después de la frase de olvido quedan como mucho 6 palabras ("No me acuerdo bien, pasó hace mucho."); si sigue contando, es olvido a medias. */
const DESPUES_DEL_OLVIDO = 6;
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
/** Dónde termina la frase de olvido con la que arranca (índice en las fichas), o -1. */
function finDelArranqueDeOlvido(f: string[], fr: Frases): number {
  // "No, no me acuerdo" también arranca con "no me acuerdo": el primer "no," es el mismo olvido dicho dos veces.
  const desde = f[0] === 'no' && esCorte(f[1]) ? [0, 2] : [0];
  for (const i of desde) {
    const a = fr.arranquesOlvido.find((x) => hayFraseEn(f, i, x) && !(fr.noSe.includes(x.join(' ')) && fr.despuesDeNoSe.has(f[i + x.length])));
    if (a) return i + a.length;
  }
  return -1;
}

/** ¿Arranca con una frase de olvido? ("No, no me acuerdo" también; "no sé si/por/cómo…" no). */
function arrancaConOlvido(f: string[], fr: Frases): boolean {
  return finDelArranqueDeOlvido(f, fr) >= 0;
}

/**
 * Palabras sin contenido: no cuentan ni como "pedacito" en la respuesta ni
 * como palabra de la pregunta (revisión de la tanda de la prueba de Naza).
 */
const SIN_CONTENIDO = new Set(
  ('a al algo algun alguna alguno algunos ante asi bien cada casi como con cual cuando de del donde el ella ellas ellos en entonces era eran es esa ese eso esta este esto estaba '
    + 'fue fueron ha hace haya hay la las le les lo los me mi mis mucho muy nada ni no nos o para pero poco por que quien se si sin su sus tan te tu tus un una uno unos unas vos y ya yo').split(' '),
);
/** Con texto de pregunta: después de la frase de olvido, como mucho estas palabras con contenido que no estén en la pregunta. */
const PEDACITO = 3;

/** Las palabras con contenido de la pregunta, completas y sin tildes. */
function palabrasDeLaPregunta(texto: string, fr: Frases): Set<string> {
  return new Set(fichas(texto, fr.unirApostrofos).filter((w) => !esCorte(w) && !fr.sinContenido.has(w)));
}

function esOlvido(f: string[], pal: string[], fr: Frases, pregunta?: PreguntaParaInterpretar): boolean {
  if (pal.length > PALABRAS_OLVIDO || hayContraste(pal, fr)) return false;
  const fin = finDelArranqueDeOlvido(f, fr);
  if (fin >= 0) {
    const despues = f.slice(fin).filter((w) => !esCorte(w));
    if (!pregunta?.texto) return despues.length <= DESPUES_DEL_OLVIDO;
    // Prueba de Naza (30/09): lo que repite la pregunta no es un pedacito ("No recuerdo, la verdad, algún maestro o maestra que me haya
    // marcado en la primaria"). Revisión: palabras completas y solo las que tienen contenido.
    const deLaPregunta = palabrasDeLaPregunta(pregunta.texto, fr);
    return despues.filter((w) => !fr.sinContenido.has(w) && !deLaPregunta.has(w)).length <= PEDACITO;
  }
  const todo = ` ${pal.join(' ')} `;
  const primeras = ` ${pal.slice(0, PRIMERAS_OLVIDO).join(' ')} `;
  if (fr.seMeBorro.some((x) => primeras.includes(` ${x} `))) return true;
  return fr.memoria.some((m) => todo.includes(` ${m} `)) && fr.falla.some((x) => todo.includes(` ${x} `));
}

/**
 * Olvido a medias (ronda 2, Naza, 30/09): arranca con una frase de olvido
 * pero no es olvido (más de 20 palabras o con "pero/aunque"): "No me acuerdo
 * bien, pero sé que había un patio…". Contó algo; lleva M28.4.
 */
function esOlvidoAMedias(f: string[], pal: string[], fr: Frases, pregunta?: PreguntaParaInterpretar): boolean {
  return arrancaConOlvido(f, fr) && !esOlvido(f, pal, fr, pregunta);
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

function esNoAhondar(f: string[], fr: Frases): boolean {
  return comienzos(f, fr).some(
    (i) =>
      fr.pasoCompletas.some((frase) => hayFraseEn(f, i, frase) && !sigueDijo(f, i + frase.length, fr)) ||
      fr.pasoSolas.some((frase) => {
        if (!hayFraseEn(f, i, frase)) return false;
        const j = i + frase.length;
        // Revisión de la ronda 2: la frase sola se niega solo con un signo fuerte ("Esa no." sí, "Esa no, la otra casa…" no).
        const cierra = (k: number) => f[k] === undefined || f[k] === PUNTO || fr.deEso.some((d) => hayFraseEn(f, k, d));
        // "Mejor no hablemos." o "prefiero no hablar de eso": se niega. "Prefiero no hablar mal de él…": cuenta.
        return cierra(j) || (fr.verbosDeNegarse.has(f[j]) && cierra(j + 1));
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

function crioAAlguien(pal: string[], fr: Frases): boolean {
  const t = ` ${pal.join(' ')} `;
  return pal.some((w) => fr.propios.has(w) || fr.criar.some((c) => c.test(w))) || fr.comoHijo.some((x) => t.includes(` ${x} `));
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
/** Segunda revisión de la ronda 2: la fórmula tiene que empezar en las primeras 4 palabras. */
const PRIMERAS_FORMULA = 4;
/** Si no arranca con "no", después de la fórmula quedan como mucho 6 palabras ("Sí, está todo. Fue una vida plena."). */
const DESPUES_DE_FORMULA = 6;
/** Con "lo que…" ("Es todo lo que tengo para contar de eso."), hasta 12 palabras en total. */
const PALABRAS_FORMULA_LO_QUE = 12;
/** Señales de que agrega algo: con cualquiera, en un cierre o LE9 no es "no" ("Nada más, que me acordé de algo: mi tío…"). */
const SENIALES_DE_AGREGAR = ['agregar', 'sumar', 'me acorde', 'me acuerdo de', 'quiero contar', 'ah y'];

function agregaAlgo(pal: string[], fr: Frases): boolean {
  const t = ` ${pal.join(' ')} `;
  return fr.senialesDeAgregar.some((x) => t.includes(` ${x} `));
}

/** "lo que…" ("Es todo lo que tengo para contar"); en catalán, "el que…". */
function sigueLoQue(f: readonly string[], k: number, fr: Frases): boolean {
  return fr.loQue.some((x) => hayFraseEn(f, k, x));
}

/** Después de la fórmula: un signo, el final, "por ahora" o "lo que…" ("Es todo lo que tengo para contar"). */
function cierraFormula(f: readonly string[], k: number, fr: Frases): boolean {
  return f[k] === undefined || esCorte(f[k]) || fr.porAhora.some((x) => hayFraseEn(f, k, x)) || sigueLoQue(f, k, fr);
}

function esFormulaDeCierre(p: PreguntaParaInterpretar, f: string[], pal: string[], fr: Frases): boolean {
  if (p.clase !== 'cierre' && p.id !== LE9) return false;
  // El tope de 40 no corre si arranca con "no" ("No, creo que está todo. Las historias que tengo son esas…").
  if ((pal[0] !== 'no' && pal.length > topeNoCorto(p)) || hayContraste(pal.slice(0, PRIMERAS_CONTRASTE), fr)) return false;
  let palabras = 0;
  for (let i = 0; i < f.length && palabras < PRIMERAS_FORMULA; i++) {
    if (esCorte(f[i])) continue;
    const x = fr.formulasDeCierre.find((fo) => hayFraseEn(f, i, fo) && cierraFormula(f, i + fo.length, fr));
    if (x) {
      if (pal[0] === 'no') return true;
      const k = i + x.length;
      const despues = f.slice(k).filter((w) => !esCorte(w)).length;
      // "Ya está, mi hermano se fue a vivir a Rosario…" sigue contando; "Ya está, eso es todo lo que me acuerdo." no (vale la segunda fórmula).
      const cierraCorto = sigueLoQue(f, k, fr) ? pal.length <= PALABRAS_FORMULA_LO_QUE : despues <= DESPUES_DE_FORMULA;
      if (cierraCorto) return true;
    }
    palabras++;
  }
  return false;
}

function esNoDicho(p: PreguntaParaInterpretar, f: string[], pal: string[], fr: Frases): boolean {
  // En un cierre o LE9, si agrega algo no es "no", aunque empiece con "no" o con la fórmula (segunda revisión de la ronda 2).
  if ((p.clase === 'cierre' || p.id === LE9) && agregaAlgo(pal, fr)) return false;
  if (esNoCortoDicho(p, f, pal, fr)) return true;
  return esFormulaDeCierre(p, f, pal, fr);
}

/**
 * AMH ("¿Hoy estás en pareja?"; Naza, 30/09: antes "¿esa persona sigue hoy a
 * tu lado?", que no se entendía de quién hablaba):
 *   - si arranca con "sí", está en pareja;
 *   - si en las primeras 5 palabras dice que no hay nadie ("no estoy en
 *     pareja", "no estoy con nadie", "no tengo pareja", "estoy sola",
 *     "quedé solo", "sin pareja", "soltera"…), no está;
 *   - si dice que hoy hay alguien ("estoy en pareja", "tengo pareja",
 *     "volvimos", "seguimos juntos/casados", "sigue conmigo", "estoy con…"),
 *     está en pareja, aunque arranque con "no" ("No, estoy con Hugo");
 *   - si no, una palabra de final en las primeras 10 palabras (falleció,
 *     murió, quedé viuda, ya no está, nos separamos…), "ya no" solo o un
 *     "no" corto, no está;
 *   - ante la duda, está en pareja.
 */
const AMH = 'AMH';
const HOY_HAY_ALGUIEN = frases(['estoy en pareja', 'tengo pareja', 'volvimos', 'seguimos juntos', 'seguimos casados', 'sigue conmigo', 'estoy con']);
const HOY_NO_HAY_NADIE = frases([
  'no estoy en pareja', 'no estoy con nadie', 'no tengo pareja', 'estoy sola', 'estoy solo', 'estoy viuda', 'estoy viudo', 'soy viuda', 'soy viudo', 'quede sola', 'quede solo', 'sin pareja', 'soltera', 'soltero',
]);
/** "No hay nadie" cuenta en las primeras 5 palabras ("Estoy con Rubén, aunque a veces estoy sola" está en pareja). */
const PRIMERAS_NADIE = 5;
const FINALES = frases([
  'fallecio', 'murio', 'se murio', 'quede viuda', 'quede viudo', 'enviude', 'ya no esta', 'nos separamos', 'me separe', 'nos divorciamos', 'me divorcie', 'terminamos', 'cortamos',
]);
/** La palabra de final cuenta en las primeras 10 palabras. */
const PRIMERAS_FINAL = 10;

const hayFraseEnPalabras = (pal: readonly string[], frase: readonly string[]) => pal.some((_, i) => hayFraseEn(pal, i, frase));

function interpretarAMH(p: PreguntaParaInterpretar, f: string[], pal: string[], fr: Frases): Interpretacion {
  if (pal[0] === 'si') return 'conto';
  if (fr.hoyNoHayNadie.some((x) => hayFraseEnPalabras(pal.slice(0, PRIMERAS_NADIE), x))) return 'no';
  if (fr.hoyHayAlguien.some((x) => hayFraseEnPalabras(pal, x))) return 'conto';
  const primeras = pal.slice(0, PRIMERAS_FINAL);
  if (fr.finales.some((x) => hayFraseEnPalabras(primeras, x))) return 'no';
  if (fr.yaNo.includes(pal.join(' '))) return 'no';
  if (esNoCortoDicho(p, f, pal, fr)) return 'no';
  return 'conto';
}

function esNoCortoDicho(p: PreguntaParaInterpretar, f: string[], pal: string[], fr: Frases): boolean {
  if (!fr.arranquesNo.has(pal[0]) || pal.length > topeNoCorto(p)) return false;
  if (fr.arranquesQueCuentan.some((a) => hayFraseEn(f, 0, a))) return false;
  // "Nada más lindo que esos veranos…" cuenta algo; "Nada más." o "Nada más, gracias." no.
  if (fr.nadaMas.some((x) => hayFraseEn(f, 0, x) && f[x.length] !== undefined && !esCorte(f[x.length]))) return false;
  if (p.id === HI0 && crioAAlguien(pal, fr)) return false;
  // En los cierres "pero" no lo da vuelta: "No, pero ya está todo" sigue siendo que no.
  return p.clase === 'cierre' || !hayContraste(pal.slice(0, PRIMERAS_CONTRASTE), fr);
}

// ---------------------------------------------------------------- frases por idioma

/**
 * Las frases que busca el detector, por idioma (Naza, 04/10: la entrevista en
 * catalán). Las reglas (topes, "pero", signos) son las mismas en todos; acá
 * solo cambian las palabras. Todo en minúscula y sin tildes, como lo deja
 * `fichas`.
 */
export type Frases = {
  /** Catalán: "me'n", "parlar-ne" y "col·legi" son una sola palabra. */
  unirApostrofos: boolean;
  muletillas: ReadonlySet<string>;
  muletillasDobles: readonly string[][];
  /**
   * Muletillas que, solas, son un "sí" (en España, "Vale."): al principio se
   * saltean ("Vale, no me acuerdo" es olvido), pero si son toda la respuesta
   * valen como "Sí." (contó algo), no como nada.
   */
  siSueltos: ReadonlySet<string>;
  /** "Paso" (y en catalán, "passo"). */
  paso: ReadonlySet<string>;
  despuesDePaso: ReadonlySet<string>;
  pasoSolas: readonly string[][];
  pasoCompletas: readonly string[][];
  antesDeFrase: readonly string[][];
  /** "dijo / decía / me dijo": la frase es de otro. */
  dijo: readonly string[][];
  yaConto: readonly string[];
  arranquesOlvido: readonly string[][];
  /** Los arranques de olvido que no valen si siguen con "si / por / cómo…" ("no sé"). */
  noSe: readonly string[];
  despuesDeNoSe: ReadonlySet<string>;
  seMeBorro: readonly string[];
  memoria: readonly string[];
  falla: readonly string[];
  contrastes: ReadonlySet<string>;
  /** Contrastes de más de una palabra ("encara que", "tot i que"): valen igual que "pero". */
  contrastesFrases: readonly string[];
  sinContenido: ReadonlySet<string>;
  verbosDeNegarse: ReadonlySet<string>;
  /** "de eso" después de una frase de negarse ("prefiero no hablar de eso"). */
  deEso: readonly string[][];
  arranquesNo: ReadonlySet<string>;
  arranquesQueCuentan: readonly string[][];
  /** "Nada más": solo es "no" si cierra la frase. */
  nadaMas: readonly string[][];
  propios: ReadonlySet<string>;
  criar: readonly RegExp[];
  comoHijo: readonly string[];
  formulasDeCierre: readonly string[][];
  porAhora: readonly string[][];
  loQue: readonly string[][];
  senialesDeAgregar: readonly string[];
  hoyHayAlguien: readonly string[][];
  hoyNoHayNadie: readonly string[][];
  finales: readonly string[][];
  yaNo: readonly string[];
};

/** El castellano rioplatense: las listas de siempre, sin cambiar nada. */
const FRASES_ES: Frases = {
  unirApostrofos: false,
  muletillas: MULETILLAS,
  muletillasDobles: MULETILLAS_DOBLES,
  siSueltos: new Set(),
  paso: new Set(['paso']),
  despuesDePaso: DESPUES_DE_PASO,
  pasoSolas: FRASES_PASO_SOLAS,
  pasoCompletas: FRASES_PASO_COMPLETAS,
  antesDeFrase: ANTES_DE_FRASE,
  dijo: frases(['dijo', 'decia', 'me dijo', 'me decia']),
  yaConto: FRASES_YA_CONTO,
  arranquesOlvido: ARRANQUES_OLVIDO,
  noSe: ['no se'],
  despuesDeNoSe: DESPUES_DE_NO_SE,
  seMeBorro: [SE_ME_BORRO],
  memoria: MEMORIA,
  falla: FALLA,
  contrastes: CONTRASTES,
  contrastesFrases: [],
  sinContenido: SIN_CONTENIDO,
  verbosDeNegarse: VERBOS_DE_NEGARSE,
  deEso: frases(['de eso']),
  arranquesNo: ARRANQUES_NO,
  arranquesQueCuentan: ARRANQUES_QUE_CUENTAN,
  nadaMas: frases(['nada mas']),
  propios: new Set(['propios', 'propias']),
  criar: [CRIAR],
  comoHijo: COMO_HIJO,
  formulasDeCierre: FORMULAS_DE_CIERRE,
  porAhora: frases(['por ahora']),
  loQue: frases(['lo que']),
  senialesDeAgregar: SENIALES_DE_AGREGAR,
  hoyHayAlguien: HOY_HAY_ALGUIEN,
  hoyNoHayNadie: HOY_NO_HAY_NADIE,
  finales: FINALES,
  yaNo: ['ya no'],
};

/**
 * Lo que el catalán suma (Naza, 04/10). Los casos, en
 * test/v3-catala-respuesta.test.ts.
 */
const SOLO_CATALAN = {
  muletillas: ['doncs', 'be', 'home', 'dona', 'ostres', 'vaja', 'ai', 'escolta', 'miri'],
  muletillasDobles: [['a', 'veure'], ['o', 'sigui']],
  paso: ['passo'],
  // "Passo per davant de casa…", "passo la tarda…": es el verbo.
  despuesDePaso: ['per', 'pel', 'pels', 'al', 'als', 'els', 'les', 'molt', 'temps', 'tot', 'tota', 'gana', 'fred', 'calor', 'pena'],
  pasoSolas: ['la seguent', 'seguent', 'una altra', 'aquesta no', 'aixo no', "d'aixo no", 'prefereixo que no', 'millor no', 'no en parlem'],
  pasoCompletas: [
    'no en vull parlar', "no vull parlar d'aixo", 'no vull parlar-ne', 'prefereixo no parlar-ne', "prefereixo no parlar d'aixo", 'prefereixo no explicar-ho',
    'prefereixo no dir-ho', "aixo m'ho guardo", "m'ho guardo", "m'ho reservo", "deixem-ho aqui", "deixem-ho correr", 'millor una altra', "d'aixo no en vull parlar",
    "no t'ho vull explicar",
  ],
  antesDeFrase: ["d'aixo", 'aixo', 'aquesta', 'aqui', 'millor'],
  dijo: ['va dir', 'deia', 'em va dir', 'em deia'],
  yaConto: [
    "ja t'ho he explicat", "ja t'ho vaig explicar", "ja t'ho he dit", "ja t'ho vaig dir", 'ja ho he explicat', "ja te l'he explicat", "ja te l'he dit",
    "ja t'ho he comptat", "ja t'ho he contat",
  ],
  arranquesOlvido: [
    "no me'n recordo", 'no ho recordo', 'no recordo', "no me'n enrecordo", "no m'enrecordo", "no me n'enrecordo", "no me'n acordo", "no me n'acordo",
    'no ho se', 'no en tinc ni idea', 'no tinc ni idea', 'ni idea',
    // Revisión del 04/10: "no em recordo" (se dice, aunque no sea normativo) y las formas valencianas.
    'no em recordo', "no me'n record", "no m'enrecord", "no me'n recorde", "no me'n enrecorde",
  ],
  noSe: ['no ho se'],
  despuesDeNoSe: ['per', 'com', 'quin', 'quina', 'on', 'quan', 'qui'],
  seMeBorro: ["se m'ha esborrat", "se m'ha oblidat", 'ho he oblidat', "m'ho he oblidat", "se m'ha anat del cap"],
  memoria: ['la memoria', 'el cap'],
  falla: ['em falla', 'em comenca a fallar', 'ja no em dona', "se m'ha esborrat", 'no em funciona'],
  // "Sinó" es una palabra; "encara que" y "tot i que", frases ("encara" solo es "todavía": "No, encara no" es un no).
  contrastes: ['sino'],
  contrastesFrases: ['encara que', 'tot i que'],
  sinContenido: (
    'a al als amb aquell aquella aquest aquesta aixo cada com de del dels el els em en era eren es et fa fins fou ha havia hi ho i jo ja la les li '
    + 'm me meu meva meus meves mi molt n ne no o on per pero perque poc qual quan que qui s se sense si som son sou t te teu teva tu un una uns unes '
    + 'va vaig vam van vas vos ni res mai'
  ).split(' '),
  verbosDeNegarse: ['parlem', 'parlar', 'parlar-ne', 'parlo', 'explicar', 'explicar-ho', 'explicar-te', "explicar-t'ho", 'entrar', 'entrar-hi', 'ficar-me', "ficar-m'hi"],
  deEso: ["d'aixo"],
  arranquesNo: ['mai', 'tampoc', 'gens', 'cap', 'res'],
  arranquesQueCuentan: [
    "mai m'oblidare", 'mai ho oblidare', 'no ho oblidare mai', 'no saps', 'no et pots imaginar', "no t'ho creuras", "no t'ho creuries", 'no ho se', 'res a veure',
    // "Cap als vint anys…": "cap a" es "hacia", cuenta algo.
    'cap a', 'cap al', 'cap als',
  ],
  nadaMas: ['res mes'],
  propis: ['propis', 'propies'],
  // "Vaig criar", "el vam criar", "criar-lo", "els criàvem".
  criar: [/^cri(o|es|a|em|eu|en|ar|at|ada|ats|ades|ava|aves|avem|aveu|aven|i)$/, /^criar-(lo|la|los|les|ne)$/],
  comoHijo: ['com un fill', 'com el meu fill', 'com una filla', 'com la meva filla', 'com si fos meu', 'com si fos meva', 'com a fill', 'com a filla'],
  formulasDeCierre: ['esta tot', 'es tot', 'ja esta', 'res mes'],
  porAhora: ['per ara', 'de moment'],
  loQue: ['el que'],
  senialesDeAgregar: ['afegir', 'sumar', "m'he recordat", "me n'he recordat", 'ara recordo', "m'he enrecordat", 'vull explicar', 'ah i'],
  hoyHayAlguien: ['estic en parella', 'tinc parella', 'hem tornat', 'seguim junts', 'seguim casats', 'encara estem junts', 'continua amb mi', 'estic amb', 'visc amb'],
  hoyNoHayNadie: [
    'no estic en parella', 'no estic amb ningu', 'no tinc parella', 'estic sola', 'estic sol', 'em vaig quedar sola', 'em vaig quedar sol', 'sense parella', 'soltera',
    'solter', 'vidua', 'vidu',
  ],
  finales: [
    'va morir', 'es va morir', 'va faltar', 'em vaig quedar vidua', 'em vaig quedar vidu', 'ja no hi es', 'ens vam separar', 'em vaig separar', 'ens vam divorciar',
    'em vaig divorciar', 'ho vam deixar', 'vam trencar', 'ens vam deixar',
  ],
  yaNo: ['ja no'],
};

const unirConjunto = (a: ReadonlySet<string>, b: readonly string[]) => new Set([...a, ...b]);

/**
 * El catalán: sus frases más las del castellano (quien habla catalán mezcla:
 * "no me acuerdo" también es olvido). Lo que choca se resuelve a favor del
 * catalán ("passo per…" es el verbo; "cap a…" es "hacia").
 */
const FRASES_CA: Frases = {
  unirApostrofos: true,
  muletillas: unirConjunto(FRASES_ES.muletillas, SOLO_CATALAN.muletillas),
  muletillasDobles: [...FRASES_ES.muletillasDobles, ...SOLO_CATALAN.muletillasDobles],
  siSueltos: FRASES_ES.siSueltos,
  paso: unirConjunto(FRASES_ES.paso, SOLO_CATALAN.paso),
  despuesDePaso: unirConjunto(FRASES_ES.despuesDePaso, SOLO_CATALAN.despuesDePaso),
  pasoSolas: [...FRASES_ES.pasoSolas, ...frases(SOLO_CATALAN.pasoSolas)],
  pasoCompletas: [...FRASES_ES.pasoCompletas, ...frases(SOLO_CATALAN.pasoCompletas)],
  antesDeFrase: [...FRASES_ES.antesDeFrase, ...frases(SOLO_CATALAN.antesDeFrase)],
  dijo: [...FRASES_ES.dijo, ...frases(SOLO_CATALAN.dijo)],
  yaConto: [...FRASES_ES.yaConto, ...SOLO_CATALAN.yaConto],
  arranquesOlvido: [...FRASES_ES.arranquesOlvido, ...frases(SOLO_CATALAN.arranquesOlvido)],
  noSe: [...FRASES_ES.noSe, ...SOLO_CATALAN.noSe],
  despuesDeNoSe: unirConjunto(FRASES_ES.despuesDeNoSe, SOLO_CATALAN.despuesDeNoSe),
  seMeBorro: [...FRASES_ES.seMeBorro, ...SOLO_CATALAN.seMeBorro],
  memoria: [...FRASES_ES.memoria, ...SOLO_CATALAN.memoria],
  falla: [...FRASES_ES.falla, ...SOLO_CATALAN.falla],
  contrastes: unirConjunto(FRASES_ES.contrastes, SOLO_CATALAN.contrastes),
  contrastesFrases: [...FRASES_ES.contrastesFrases, ...SOLO_CATALAN.contrastesFrases],
  sinContenido: unirConjunto(FRASES_ES.sinContenido, SOLO_CATALAN.sinContenido),
  verbosDeNegarse: unirConjunto(FRASES_ES.verbosDeNegarse, SOLO_CATALAN.verbosDeNegarse),
  deEso: [...FRASES_ES.deEso, ...frases(SOLO_CATALAN.deEso)],
  arranquesNo: unirConjunto(FRASES_ES.arranquesNo, SOLO_CATALAN.arranquesNo),
  arranquesQueCuentan: [...FRASES_ES.arranquesQueCuentan, ...frases(SOLO_CATALAN.arranquesQueCuentan)],
  nadaMas: [...FRASES_ES.nadaMas, ...frases(SOLO_CATALAN.nadaMas)],
  propios: unirConjunto(FRASES_ES.propios, SOLO_CATALAN.propis),
  criar: [...FRASES_ES.criar, ...SOLO_CATALAN.criar],
  comoHijo: [...FRASES_ES.comoHijo, ...SOLO_CATALAN.comoHijo],
  formulasDeCierre: [...FRASES_ES.formulasDeCierre, ...frases(SOLO_CATALAN.formulasDeCierre)],
  porAhora: [...FRASES_ES.porAhora, ...frases(SOLO_CATALAN.porAhora)],
  loQue: [...FRASES_ES.loQue, ...frases(SOLO_CATALAN.loQue)],
  senialesDeAgregar: [...FRASES_ES.senialesDeAgregar, ...SOLO_CATALAN.senialesDeAgregar],
  hoyHayAlguien: [...FRASES_ES.hoyHayAlguien, ...frases(SOLO_CATALAN.hoyHayAlguien)],
  hoyNoHayNadie: [...FRASES_ES.hoyNoHayNadie, ...frases(SOLO_CATALAN.hoyNoHayNadie)],
  finales: [...FRASES_ES.finales, ...frases(SOLO_CATALAN.finales)],
  yaNo: [...FRASES_ES.yaNo, ...SOLO_CATALAN.yaNo],
};

/**
 * Lo que suma el castellano de España, de tú (Naza, 05/10). Los casos, en
 * test/v3-es-ES.test.ts.
 */
const SOLO_ESPANA = {
  muletillas: ['vale', 'hombre', 'oye', 'venga', 'vaya', 'bah', 'buah', 'jo'],
  // "Vale." solo es un sí.
  siSueltos: ['vale'],
  // "Paso muchas horas en el huerto…": es el verbo.
  despuesDePaso: ['muchas', 'muchos', 'horas', 'ratos', 'en'],
  pasoSolas: ['la siguiente', 'esta no', 'esto no', 'de esto no', 'dejalo', 'no me apetece'],
  pasoCompletas: [
    'paso de esta', 'paso de esa', 'paso de eso', 'paso de esto', 'paso de contarlo', 'paso de hablar de eso', 'no quiero hablar de ello', 'prefiero no hablar de ello',
    'prefiero no hablarlo', 'prefiero no decirlo', 'eso me lo reservo', 'me lo reservo', 'dejalo estar', 'dejemoslo aqui', 'dejemoslo ahi', 'mejor lo dejamos', 'lo dejamos aqui',
    'no me apetece hablar de eso', 'no me apetece contarlo', 'de eso no quiero hablar', 'de esto no quiero hablar',
  ],
  antesDeFrase: ['esta', 'esto', 'de esto', 'aqui'],
  dijo: ['ha dicho', 'me ha dicho'],
  yaConto: ['te lo he contado ya', 'te lo he dicho ya', 'ya te lo he contado', 'ya te he contado', 'ya lo he contado', 'ya te lo he dicho', 'ya te lo habia contado', 'ya te lo habia dicho'],
  arranquesOlvido: ['no lo recuerdo', 'no lo se', 'no tengo ni idea', 'no sabria decirte', 'no te sabria decir'],
  noSe: ['no lo se'],
  seMeBorro: ['se me ha olvidado', 'se me olvido', 'se me ha ido', 'se me ha borrado', 'lo he olvidado', 'me he olvidado', 'no me viene a la cabeza'],
  falla: ['me empieza a fallar', 'ya no me da', 'me juega malas pasadas'],
  sinContenido: ['aqui', 'alli', 'ahi', 'os', 'vuestro', 'vuestra', 'ello', 'he', 'has', 'hemos', 'habia', 'tu', 'ti'],
  verbosDeNegarse: ['hablarlo', 'contartelo', 'contarla', 'decirlo'],
  deEso: ['de ello', 'de esto'],
  arranquesQueCuentan: ['no te puedes imaginar', 'no te lo vas a creer', 'no te lo creeras', 'nunca lo olvidare', 'nunca olvidare', 'jamas lo olvidare', 'no lo olvidare nunca', 'nunca se me olvidara'],
  // "Lo crié", "la criamos", "criarla", "los criasteis".
  criar: [/^cri(asteis|abais)$/, /^criar(lo|la|los|las|le)$/],
  comoHijo: ['como si fuera mio', 'como si fuera mia', 'como si fuera mi hijo', 'como si fuera mi hija', 'como a un hijo', 'como a una hija', 'como a mi hijo', 'como a mi hija'],
  formulasDeCierre: ['eso es todo', 'esta todo dicho', 'ya lo he dicho todo', 'ya lo he contado todo'],
  porAhora: ['de momento', 'por el momento'],
  senialesDeAgregar: ['anadir', 'me he acordado', 'me acabo de acordar', 'quiero contarte'],
  hoyHayAlguien: ['estoy casado', 'estoy casada', 'sigo casado', 'sigo casada', 'tengo novio', 'tengo novia', 'vivo con mi marido', 'vivo con mi mujer', 'vivo con mi pareja', 'sigue a mi lado'],
  hoyNoHayNadie: [
    'me he quedado sola', 'me he quedado solo', 'estoy viuda', 'estoy viudo', 'soy viuda', 'soy viudo', 'estoy divorciada', 'estoy divorciado', 'estoy separada', 'estoy separado',
    'no tengo a nadie',
    // Negar lo de hoyHayAlguien ("No tengo novia", "Ya no sigo casada"): sin esto gana el sí (revisión).
    'no estoy casado', 'no estoy casada', 'no sigo casado', 'no sigo casada', 'no tengo novio', 'no tengo novia',
  ],
  finales: ['ha muerto', 'ha fallecido', 'nos hemos separado', 'me he separado', 'me he divorciado', 'nos hemos divorciado', 'lo dejamos', 'nos dejamos'],
};

/**
 * El castellano de España: sus frases más las rioplatenses (no molestan, y
 * "no me acuerdo", "ya te lo conté" o "paso" se dicen igual).
 */
const FRASES_ES_ES: Frases = {
  ...FRASES_ES,
  muletillas: unirConjunto(FRASES_ES.muletillas, SOLO_ESPANA.muletillas),
  siSueltos: unirConjunto(FRASES_ES.siSueltos, SOLO_ESPANA.siSueltos),
  despuesDePaso: unirConjunto(FRASES_ES.despuesDePaso, SOLO_ESPANA.despuesDePaso),
  pasoSolas: [...FRASES_ES.pasoSolas, ...frases(SOLO_ESPANA.pasoSolas)],
  pasoCompletas: [...FRASES_ES.pasoCompletas, ...frases(SOLO_ESPANA.pasoCompletas)],
  antesDeFrase: [...FRASES_ES.antesDeFrase, ...frases(SOLO_ESPANA.antesDeFrase)],
  dijo: [...FRASES_ES.dijo, ...frases(SOLO_ESPANA.dijo)],
  yaConto: [...FRASES_ES.yaConto, ...SOLO_ESPANA.yaConto],
  arranquesOlvido: [...FRASES_ES.arranquesOlvido, ...frases(SOLO_ESPANA.arranquesOlvido)],
  noSe: [...FRASES_ES.noSe, ...SOLO_ESPANA.noSe],
  seMeBorro: [...FRASES_ES.seMeBorro, ...SOLO_ESPANA.seMeBorro],
  falla: [...FRASES_ES.falla, ...SOLO_ESPANA.falla],
  sinContenido: unirConjunto(FRASES_ES.sinContenido, SOLO_ESPANA.sinContenido),
  verbosDeNegarse: unirConjunto(FRASES_ES.verbosDeNegarse, SOLO_ESPANA.verbosDeNegarse),
  deEso: [...FRASES_ES.deEso, ...frases(SOLO_ESPANA.deEso)],
  arranquesQueCuentan: [...FRASES_ES.arranquesQueCuentan, ...frases(SOLO_ESPANA.arranquesQueCuentan)],
  criar: [...FRASES_ES.criar, ...SOLO_ESPANA.criar],
  comoHijo: [...FRASES_ES.comoHijo, ...SOLO_ESPANA.comoHijo],
  formulasDeCierre: [...FRASES_ES.formulasDeCierre, ...frases(SOLO_ESPANA.formulasDeCierre)],
  porAhora: [...FRASES_ES.porAhora, ...frases(SOLO_ESPANA.porAhora)],
  senialesDeAgregar: [...FRASES_ES.senialesDeAgregar, ...SOLO_ESPANA.senialesDeAgregar],
  hoyHayAlguien: [...FRASES_ES.hoyHayAlguien, ...frases(SOLO_ESPANA.hoyHayAlguien)],
  hoyNoHayNadie: [...FRASES_ES.hoyNoHayNadie, ...frases(SOLO_ESPANA.hoyNoHayNadie)],
  finales: [...FRASES_ES.finales, ...frases(SOLO_ESPANA.finales)],
};

export const FRASES: Readonly<Record<Idioma, Frases>> = { 'es-AR': FRASES_ES, ca: FRASES_CA, 'es-ES': FRASES_ES_ES };

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
export function interpretar(pregunta: PreguntaParaInterpretar, respuesta: string, idioma: Idioma = IDIOMA_POR_DEFECTO): Interpretacion {
  const { boton, resto } = leerBoton(respuesta);
  if (boton !== undefined) {
    const vale = valeBoton(pregunta, boton);
    return vale === 'si' ? 'conto' : vale;
  }
  const fr = FRASES[idioma];
  const crudas = fichas(resto, fr.unirApostrofos);
  const f = sinMuletillas(crudas, fr);
  const pal = f.filter((w) => !esCorte(w));
  // "Vale." solo (España) es un "Sí.", no nada.
  if (pal.length === 0) return crudas.some((w) => fr.siSueltos.has(w)) ? 'conto' : 'vacio';
  if (esPasoDicho(f, pal, fr)) return 'paso';
  if (pregunta.id === AMH) return interpretarAMH(pregunta, f, pal, fr);
  if (esOlvido(f, pal, fr, pregunta)) return 'olvido';
  if (esOlvidoAMedias(f, pal, fr, pregunta)) return 'olvido-a-medias';
  if (esNoAhondar(f, fr)) return 'no-ahondar';
  if (esNoDicho(pregunta, f, pal, fr)) return 'no';
  if (esYaConto(pal, fr)) return 'ya-conto';
  return 'conto';
}

/** Para las que dependen (`si:X`): tocó "Sí", contó algo, dijo "ya te lo conté" o no se acordó (reglas 16 y 18). */
export function habilitaLasQueDependen(i: Interpretacion): boolean {
  return i === 'conto' || i === 'ya-conto' || i === 'olvido' || i === 'olvido-a-medias' || i === 'no-ahondar';
}
