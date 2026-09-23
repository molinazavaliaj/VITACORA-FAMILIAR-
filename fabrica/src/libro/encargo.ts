// El encargo del libro (biógrafo v2, 23/09 — BORRADOR de la reescritura; los textos los aprueba
// Naza). Lo comparten todos los prompts que escriben algo del libro: el capítulo, las páginas
// del editor y el anticipo. Antes cada uno tenía sus reglas, y las de "la voz" chocaban con lo
// que Naza decidió que es fidelidad:
//
//   "que no invente historias de la vida del usuario y que de verdad sean sus historias, pero
//    redactadas por un escritor de la putísima madre: que hable con sus palabras como si fuese
//    él, pero con mejor redacción — nadie redacta bien hablando por audio".
//
// O sea: los HECHOS son sagrados; la PROSA no es transcripción. Y quién cuenta —mujer u hombre—
// se dice, no se supone: los siete prompts viejos decían "él", y un libro en primera persona con
// la concordancia equivocada ("cuando era chico", escrito por una mujer) no tiene arreglo impreso.

export type Genero = 'mujer' | 'hombre';
export type Quien = { nombre: string; genero: Genero | null };

export function quienCuenta(q: Quien): string {
  if (q.genero === 'mujer') {
    return `Quien cuenta es ${q.nombre}, una mujer. El libro está en primera persona y en femenino de punta a punta: "cuando era chica", "estaba cansada", "me quedé sola".`;
  }
  if (q.genero === 'hombre') {
    return `Quien cuenta es ${q.nombre}, un hombre. El libro está en primera persona y en masculino de punta a punta: "cuando era chico", "estaba cansado", "me quedé solo".`;
  }
  return `Quien cuenta es ${q.nombre}. No sabemos si es mujer u hombre: fijate cómo se nombra en lo que contó ("cuando era chica", "cuando era chico") y usá eso en todo el texto. Si no aparece en ningún lado, escribí sin formas que lleven género.`;
}

const HECHOS = `LOS HECHOS SON SAGRADOS
1. Todo lo que se cuenta, lo contó esta persona en sus audios. Nada inventado: ni un hecho, ni un
   detalle, ni una emoción, ni una conclusión que no haya dado.
2. Nada de otra persona: si algo del material no parece de su vida, no lo uses.
3. No juntes en una escena cosas que contó por separado: si contó los muñecos un día y el balcón
   otro, no escribas "los muñecos en el balcón". Donde el material dice […], se saltó un tramo:
   lo de antes y lo de después no son el mismo momento.
4. Si hay poco material, el texto es corto. Corto y verdadero gana siempre.`;

const VOZ = `LA VOZ
Escribís como un escritor de primera que le presta la pluma: habla esta persona, en primera
persona, con SUS palabras, SUS giros, SUS dichos ("mi vieja", "el laburo", lo que diga). Pero
bien escrito: nadie redacta bien hablando por audio, y vos sí. Ordenás, sacás las vueltas y lo
que se repite al hablar, armás frases que se leen de corrido, elegís el orden que mejor cuenta
la historia y le das a cada escena su lugar y su momento.
Lo que no cambia es quién habla: no la hagas sonar más culta, más solemne ni más poética de lo
que es. Si una frase la podría haber escrito cualquiera, o suena a folleto («fue una época llena
de desafíos», «sin duda», «cabe destacar»), sacala.

LAS CITAS VAN TEXTUALES
Las frases que destacás como cita (líneas que empiezan con >) van palabra por palabra como las
dijo: su familia las va a escuchar en su voz, escaneando un QR. Elegí para citar frases suyas que
se entiendan solas. Todo lo demás lo podés escribir; las citas, no.`;

/** El encargo completo: quién cuenta, los hechos y la voz. */
export function encargoDelLibro(q: Quien): string {
  return `${quienCuenta(q)}\n\n${HECHOS}\n\n${VOZ}`;
}

// ── El género, a partir de lo que cuenta ─────────────────────────────────────────────────────
// La compra no pregunta si la persona es mujer u hombre (23/09), así que se deduce de cómo se
// nombra en primera persona. Solo formas que no se confunden con otra persona: "fui", "estuve",
// "quedé", "me sentí", "soy" son de primera; "era" y "estaba" solo si viene "yo" adelante ("mi
// vieja estaba cansada" no dice nada de quien cuenta).

const RAICES = ['chic', 'cansad', 'content', 'asustad', 'enamorad', 'embarazad', 'casad', 'separad', 'viud',
  'nervios', 'preocupad', 'agradecid', 'orgullos', 'criad', 'acostumbrad', 'obligad', 'encerrad', 'perdid',
  'enojad', 'emocionad', 'sorprendid', 'aburrid', 'hij', 'sol', 'nacid', 'jubilad', 'recibid'];
const ADVERBIO = '(?:muy |re |tan |medio |bastante |un poco )?';
const PRIMERA = String.raw`(?:\byo (?:era|estaba|soy|fui|estuve|quede|me sentia|me quede)|\b(?:fui|estuve|quede|me quede|me senti|me sentia|me puse|me volvi|soy|naci))`;
const FORMA = new RegExp(String.raw`${PRIMERA} ${ADVERBIO}(${RAICES.join('|')})(a|o)s?\b`, 'g');

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Las formas de la charla de verdad (medidas sobre Joaquín y Osvaldo: con las de arriba solas no
// aparecía ninguna). "Cuando era chica" es ambiguo —puede ser de la madre—, así que no cuenta si
// justo antes se nombra a otra persona.
const CHARLA: { re: RegExp; ambigua: boolean }[] = [
  { re: /\bde (chic)(a|o)s?\b/g, ambigua: false },
  { re: /\bcuando era (chic|pequen|jovencit)(a|o)\b/g, ambigua: true },
  { re: /\b(?:me fui a vivir|vivo|viviendo|vivia) (sol)(a|o)\b/g, ambigua: false },
];
const PIBE = /\byo,? (?:que )?era (?:el|la|un|una) (pibe|piba|chico|chica|nene|nena)\b/g;
const OTRA_PERSONA = /\b(mi|su|tu) (madre|mama|vieja|viejo|papa|padre|hermana|hermano|abuela|abuelo|tia|tio|hija|hijo|esposa|esposo|mujer|marido|novia|novio|prima|primo)\b|\b(ella|el)\b/;

/** Las formas en primera persona de cada género que aparecen en un texto. */
export function formasDeGenero(texto: string): { mujer: string[]; hombre: string[] } {
  const r = { mujer: [] as string[], hombre: [] as string[] };
  const limpio = sinAcentos(texto);
  const anotar = (femenino: boolean, forma: string) => (femenino ? r.mujer : r.hombre).push(forma);
  for (const m of limpio.matchAll(FORMA)) anotar(m[2] === 'a', m[0]);
  for (const { re, ambigua } of CHARLA) {
    for (const m of limpio.matchAll(re)) {
      const antes = limpio.slice(Math.max(0, (m.index ?? 0) - 30), m.index);
      if (ambigua && OTRA_PERSONA.test(antes)) continue;
      anotar(m[2] === 'a', m[0]);
    }
  }
  for (const m of limpio.matchAll(PIBE)) anotar(/a$/.test(m[1]), m[0]);
  return r;
}

/**
 * Mujer u hombre según cómo se nombra en sus respuestas. Decide solo con al menos dos formas y
 * casi todas del mismo lado; si no, null (y el encargo pide escribir sin formas con género).
 */
export function generoDelMaterial(transcripciones: string[]): { genero: Genero | null; evidencia: string[] } {
  const { mujer, hombre } = formasDeGenero(transcripciones.join('\n'));
  const [mas, menos, genero] = mujer.length >= hombre.length ? [mujer, hombre, 'mujer' as const] : [hombre, mujer, 'hombre' as const];
  if (mas.length >= 2 && menos.length <= mas.length * 0.2) return { genero, evidencia: mas };
  return { genero: null, evidencia: [...mujer, ...hombre] };
}
