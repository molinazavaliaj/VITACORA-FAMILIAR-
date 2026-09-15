/**
 * Las partes puras de la puerta manual: sin base, sin red y sin WhatsApp.
 *
 * Viven separadas del CLI (`scripts/manual.ts`) para poder testearlas sin
 * levantar nada — es el mismo criterio que el resto del módulo, donde la
 * lógica vive en `src/` y el script es sólo la cáscara.
 *
 * Contexto: mientras Meta no habilite la API de WhatsApp, las preguntas salen
 * a mano y los audios vuelven a mano. La puerta manual hace con un archivo del
 * disco lo mismo que `procesar.ts` hace con un `mediaId` del webhook.
 */

import type { Trato } from '../ia/trato.js';

export type Args = {
  comando: string;
  posicionales: string[];
  /** `--orden 3` → '3' · `--repregunta` (sin valor) → true · `--si` → true. */
  flags: Record<string, string | boolean>;
};

/** `cargar imma dia_03.ogg --orden 3 --repregunta` → comando + args + flags. */
export function parsearArgs(argv: string[]): Args {
  const [comando = '', ...resto] = argv;
  const posicionales: string[] = [];
  const flags: Record<string, string | true> = {};

  for (let i = 0; i < resto.length; i++) {
    const token = resto[i];
    if (!token.startsWith('--')) {
      posicionales.push(token);
      continue;
    }
    const [nombre, valorInline] = token.slice(2).split('=');
    if (valorInline !== undefined) {
      flags[nombre] = valorInline;
      continue;
    }
    const siguiente = resto[i + 1];
    if (siguiente !== undefined && !siguiente.startsWith('--')) {
      flags[nombre] = siguiente;
      i++;
    } else {
      flags[nombre] = true;
    }
  }
  return { comando, posicionales, flags };
}

/** 'Pequeña Imma' → 'pequena-imma': el slug que usan las carpetas de audios. */
export function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type NombreCanonico = { orden: number; sufijo: number };

export const EXTENSIONES_AUDIO = ['.ogg', '.opus', '.oga', '.mp3', '.m4a', '.wav', '.aac', '.mp4'];

export function esAudio(nombre: string): boolean {
  const punto = nombre.lastIndexOf('.');
  return punto > 0 && EXTENSIONES_AUDIO.includes(nombre.slice(punto).toLowerCase());
}

/**
 * `dia_07.ogg` → { orden: 7, sufijo: 1 } · `dia_07_2.ogg` → { orden: 7, sufijo: 2 }.
 * Cualquier otro nombre (una nota de voz recién bajada, `PTT-20260914-WA0007.ogg`)
 * devuelve null: ahí el orden lo decide la base, no el nombre.
 */
export function ordenDeArchivo(nombre: string): NombreCanonico | null {
  const m = nombre.match(/^dia_(\d{1,3})(?:_(\d+))?\.[a-z0-9]+$/i);
  if (!m) return null;
  return { orden: Number(m[1]), sufijo: m[2] ? Number(m[2]) : 1 };
}

/**
 * El nombre canónico del archivo de esa respuesta. Es EXACTAMENTE el que espera
 * el audiolibro (`fabrica/src/audio/audiolibro.ts`): sin sufijo la respuesta
 * principal, con sufijo las repreguntas del mismo día.
 */
export function archivoCanonico(orden: number, sufijo = 1): string {
  const base = `dia_${String(orden).padStart(2, '0')}`;
  return sufijo <= 1 ? `${base}.ogg` : `${base}_${sufijo}.ogg`;
}

/**
 * Qué orden le toca a un audio cuando el nombre del archivo no lo dice:
 * la pregunta vigente si sigue sin responder, y si ya está respondida, la que
 * sigue. Con `dia_actual` 0 (todavía no salió ninguna) arranca en la 1.
 */
export function proximoOrden(diaActual: number, ordenesRespondidas: number[]): number {
  if (diaActual < 1) return 1;
  return ordenesRespondidas.includes(diaActual) ? diaActual + 1 : diaActual;
}

/**
 * El texto que se le pega al narrador: la pregunta sola.
 *
 * Hasta el 2026-09-14 esto llevaba adelante un "reconocimiento" generado por el
 * modelo (una o dos frases con un detalle de lo que había contado ayer). Se sacó
 * por decisión de producto de los socios: costaba ~USD 3,36 por narrador —el 70%
 * de la entrevista— porque cada día le pegaba TODA la historia al prompt.
 *
 * Es el mismo texto que arma el camino de WhatsApp en `preguntar.ts` — de hecho
 * ahora es LITERALMENTE el mismo: hasta el 2026-09-15 vivía escrito dos veces,
 * acá y allá, y con dos tratos serían cuatro frases sueltas que divergen el día
 * que se cambie una.
 *
 * ⚠️ La plantilla de Meta (`PLANTILLAS.md`) lleva su propia copia en usted, y
 * esa la aprueba Meta: fuera de la ventana de 24 h el narrador lee la cola en
 * usted aunque su trato sea vos.
 */
export function mensajeDePregunta(pregunta: string, trato: Trato = 'usted'): string {
  const cierre = trato === 'vos'
    ? 'Cuando quieras, me respondés con un audio. Sin apuro. 🎙️'
    : 'Cuando quiera, me responde con un audio. Sin apuro. 🎙️';
  return `La pregunta de hoy: ${pregunta}\n\n${cierre}`;
}

/** La despedida final. Único hogar del texto: `src/flujo/cierre.ts` la importa de acá. */
export function despedida(comoLeDicen: string, trato: Trato = 'usted'): string {
  const final = trato === 'vos'
    ? 'Fue un honor enorme escucharte. Tu historia ya está siendo convertida en tu libro.'
    : 'Fue un honor enorme escucharlo. Su historia ya está siendo convertida en su libro.';
  return `${comoLeDicen}... llegamos al final del viaje. Treinta charlas, una vida entera. ${final}`;
}

/** Lo que recibe cuando dice que SÍ. Único hogar del texto: `src/flujo/procesar.ts` lo importa de acá. */
export function bienvenidaAceptacion(comoLeDicen: string, trato: Trato = 'usted'): string {
  return trato === 'vos'
    ? `¡Qué alegría, ${comoLeDicen}! Mañana a la mañana te llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre vos y yo, a tu ritmo. 📖`
    : `¡Qué alegría, ${comoLeDicen}! Mañana a la mañana le llega la primera pregunta. No hay apuro ni respuestas incorrectas: esto es una charla entre usted y yo, a su ritmo. 📖`;
}

export type PasoDeCarga = { archivo: string; orden: number; sufijo: number };

/**
 * Reparte una lista de archivos (ya ordenada por fecha, del más viejo al más
 * nuevo) entre las órdenes que siguen a partir de `desde`.
 * En modo repregunta todos van a la MISMA orden, con sufijo creciente.
 */
export function planDeCarga(archivos: string[], desde: number, esRepregunta = false): PasoDeCarga[] {
  return archivos.map((archivo, i) =>
    esRepregunta
      ? { archivo, orden: desde, sufijo: i + 2 }
      : { archivo, orden: desde + i, sufijo: 1 },
  );
}

/**
 * El índice del primer carácter donde dos textos difieren (-1 si son iguales).
 * Sirve para mostrar QUÉ cambió al retranscribir sin imprimir todo de nuevo.
 */
export function primeraDiferencia(a: string, b: string): number {
  const largo = Math.min(a.length, b.length);
  for (let i = 0; i < largo; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : largo;
}

/**
 * El vocabulario base del habla rioplatense. Es la mitad del sesgo que se le
 * pasa a la transcripción: sin esto, un narrador porteño diciendo "mi viejo
 * llegando de laburar" se oye como "llegando de la URA".
 *
 * Se mantiene CORTO a propósito: Whisper sólo mira los últimos ~224 tokens del
 * prompt, y un glosario largo hace que el modelo "escuche" palabras de la lista
 * que el narrador nunca dijo.
 */
export const GLOSARIO_RIOPLATENSE =
  'laburar, laburo, pileta, mate, pastafrola, milanesas, galgo, barrio, pibe, ' +
  'viejo, vieja, hermano, abuela, escapar, quilombo, colectivo, zapatillas';

/**
 * Lo que NO es un nombre aunque viva en el árbol familiar: la familia escribe
 * "no tuvo" cuando el narrador no tuvo pareja o hijos. Si eso entra al prompt,
 * el modelo empieza a "escuchar" palabras que no están en el audio.
 */
const NO_ES_NOMBRE = /^(no|ninguno|ninguna|no\s+tuvo|no\s+tiene|no\s+aplica|sin\s+datos|n\/a)$/i;

/**
 * Arma el contexto que se le sopla a la transcripción, con lo que YA está en la
 * fila del narrador (nada que cargar a mano): su vocabulario esperable, cómo le
 * dicen, las personas de su árbol y sus datos de vida.
 *
 * Es la diferencia entre transcribir sonidos y transcribir a Joaquín. Y no
 * depende de la conversación: va con el primer audio igual que con el trigésimo.
 */
export function promptDeTranscripcion(contexto: Record<string, any> = {}, comoLeDicen = ''): string {
  const partes = [
    'Entrevista de historia de vida en castellano rioplatense (Argentina). Transcribí literal, sin corregir la sintaxis.',
    `Vocabulario frecuente: ${GLOSARIO_RIOPLATENSE}.`,
  ];
  if (comoLeDicen) partes.push(`El narrador es ${comoLeDicen}.`);

  const arbol = contexto?.arbol ?? {};
  const personas = Object.values(arbol)
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim().replace(/[,;.]+$/, ''))
    .filter((v) => v !== '' && !NO_ES_NOMBRE.test(v));
  if (personas.length) partes.push(`Personas de su vida: ${personas.join('; ')}.`);
  if (contexto?.lugarNacimiento) partes.push(`Lugar: ${contexto.lugarNacimiento}.`);
  if (contexto?.oficio) partes.push(`Oficio: ${contexto.oficio}.`);
  // `datosExtra` es texto libre que carga la familia y puede ser larguísimo:
  // se recorta porque el prompt se corta a ~224 tokens.
  if (typeof contexto?.datosExtra === 'string' && contexto.datosExtra.trim()) {
    partes.push(`Contexto: ${contexto.datosExtra.trim().slice(0, 200)}.`);
  }
  return partes.join(' ');
}
