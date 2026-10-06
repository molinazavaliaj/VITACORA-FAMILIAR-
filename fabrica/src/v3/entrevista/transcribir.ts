// Transcribe un audio del narrador con OpenAI, igual que
// `entrevistador/src/ia/transcribir.ts` (que es de Joaquín y no se importa):
// modelo `gpt-transcribe`, castellano, y un prompt corto de vocabulario
// rioplatense + el nombre del narrador. La duración viene en `usage.seconds`.
//
// ES PAGO (unos centavos por minuto). Los tests usan un `fetch` falso.
// La key NUNCA se imprime: los errores muestran el status y el mensaje de
// OpenAI, y cualquier cosa con forma de key se tapa antes de salir.

import { readFileSync } from 'node:fs';
import { IDIOMA_POR_DEFECTO, type Idioma } from './idioma.js';

export type Transcripcion = { texto: string; duracionSegundos: number | null };

export const URL_TRANSCRIPCION = 'https://api.openai.com/v1/audio/transcriptions';

/** Prompt de vocabulario: corto, porque el modelo lo corta a ~224 tokens. En catalán, vocabulario de Cataluña (Naza, 04/10); en es-ES, de España (Naza, 05/10). */
export function promptDeTranscripcion(nombre: string, idioma: Idioma = IDIOMA_POR_DEFECTO): string {
  if (idioma === 'ca') {
    return `${nombre} explica la seva vida en català. Vocabulari: feina, colla, la mili, l'avi, l'àvia, el poble, el barri, la masia, la plaça, la festa major, l'institut, l'escola, la parella, els nets, la sardana, la mona, la castanyada, pa amb tomàquet.`;
  }
  if (idioma === 'es-ES') {
    return `${nombre} cuenta su vida en castellano de España. Vocabulario: curro, currar, chaval, chavala, crío, cría, piso, el pueblo, la mili, el instituto, el bachillerato, la carrera, las fiestas del pueblo, la verbena, los abuelos, la cuadrilla, vale, tío, majo.`;
  }
  return `${nombre} cuenta su vida en castellano rioplatense. Vocabulario: laburo, laburar, pibe, piba, gurí, botija, mina, colectivo, bondi, guita, quilombo, che, viejo, vieja, barrio, liceo, facultad, cancha, asado, mate.`;
}

/** El código de idioma que se le pasa a OpenAI. */
export const IDIOMA_OPENAI: Readonly<Record<Idioma, string>> = { 'es-AR': 'es', ca: 'ca', 'es-ES': 'es' };

/** Tapa la key y cualquier cosa con forma de key (sk-…) en un texto que va a salir por pantalla. */
export function taparKey(texto: string, key?: string): string {
  let t = texto;
  if (key) t = t.split(key).join('[key tapada]');
  return t.replace(/sk-[A-Za-z0-9_*.\-]{4,}/g, '[key tapada]');
}

export type OpcionesTranscribir = {
  key: string;
  /** El tipo real del audio (p. ej. audio/webm). */
  tipo: string;
  /** Nombre con la extensión correcta: OpenAI mira la extensión. */
  nombreArchivo: string;
  prompt?: string;
  /** El idioma del audio (Naza, 04/10: la entrevista en catalán). Sin idioma, castellano. */
  idioma?: Idioma;
  fetch?: typeof fetch;
  /** Cuánto se espera a OpenAI antes de cortar (por defecto 60 s); cortar cuenta como error de red. */
  timeoutMs?: number;
};

/** Si OpenAI no contesta en 60 segundos, se corta y se reintenta como un error de red (revisión de la prueba de Naza, 30/09). */
export const TIMEOUT_TRANSCRIPCION_MS = 60_000;

/**
 * Un error de la transcripción que dice si vale la pena reintentar: la red
 * caída, o OpenAI con 5xx o 429 (a Naza se le cortó el wifi en la prueba,
 * 30/09). Una key mala o un audio que no sirve (4xx) no se reintentan.
 */
export class ErrorTranscripcion extends Error {
  constructor(
    mensaje: string,
    readonly reintentable: boolean,
  ) {
    super(mensaje);
    this.name = 'ErrorTranscripcion';
  }
}

/** Fallas de red de `fetch` en Node ("fetch failed", conexión cortada, sin DNS…). */
const RED_CAIDA = /fetch failed|network|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket/i;

/** ¿Vale la pena reintentar? Lo marca `ErrorTranscripcion`; un TypeError de red de `fetch` también. */
export function esReintentable(err: unknown): boolean {
  if (err instanceof ErrorTranscripcion) return err.reintentable;
  return err instanceof TypeError && RED_CAIDA.test(`${err.message} ${String((err as { cause?: unknown }).cause ?? '')}`);
}

export async function transcribirAudio(audio: Buffer, o: OpcionesTranscribir): Promise<Transcripcion> {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(audio)], { type: o.tipo }), o.nombreArchivo);
  form.append('model', 'gpt-transcribe');
  form.append('language', IDIOMA_OPENAI[o.idioma ?? IDIOMA_POR_DEFECTO]);
  form.append('response_format', 'json');
  if (o.prompt) form.append('prompt', o.prompt);
  const timeoutMs = o.timeoutMs ?? TIMEOUT_TRANSCRIPCION_MS;
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), timeoutMs);
  let res: Response;
  let cuerpo: string;
  try {
    res = await (o.fetch ?? fetch)(URL_TRANSCRIPCION, {
      method: 'POST',
      headers: { Authorization: `Bearer ${o.key}` },
      body: form,
      signal: corte.signal,
    });
    cuerpo = await res.text();
  } catch (err) {
    if (corte.signal.aborted) throw new ErrorTranscripcion(`La transcripción tardó más de ${Math.round(timeoutMs / 1000)} s (límite: 60 s) y se cortó.`, true);
    throw new ErrorTranscripcion(taparKey(`La transcripción no llegó a OpenAI (¿sin conexión?): ${(err as Error).message}`, o.key), esReintentable(err));
  } finally {
    clearTimeout(reloj);
  }
  if (!res.ok) {
    let mensaje = cuerpo;
    try {
      mensaje = (JSON.parse(cuerpo) as { error?: { message?: string } }).error?.message ?? cuerpo;
    } catch {
      // no era JSON: va el texto tal cual (tapado)
    }
    const reintentable = res.status >= 500 || res.status === 429;
    throw new ErrorTranscripcion(taparKey(`La transcripción falló (OpenAI ${res.status}): ${mensaje.slice(0, 500)}`, o.key), reintentable);
  }
  const json = JSON.parse(cuerpo) as { text?: string; duration?: number; usage?: { seconds?: number } };
  if (typeof json.text !== 'string') throw new Error('La transcripción no devolvió texto.');
  const segundos = json.usage?.seconds ?? json.duration;
  return { texto: json.text, duracionSegundos: typeof segundos === 'number' ? Math.round(segundos) : null };
}

/** Lee OPENAI_API_KEY de process.env o, si no está, del .env indicado. Nunca la imprime. */
export function leerKeyOpenAI(rutaEnv: string, env: NodeJS.ProcessEnv = process.env): string {
  if (env.OPENAI_API_KEY) return env.OPENAI_API_KEY;
  let contenido: string;
  try {
    contenido = readFileSync(rutaEnv, 'utf8');
  } catch {
    throw new Error(`No encontré OPENAI_API_KEY: no está en el entorno y no pude leer ${rutaEnv}.`);
  }
  for (const linea of contenido.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?OPENAI_API_KEY\s*=\s*(.*)$/.exec(linea);
    if (m) {
      const valor = m[1].trim().replace(/^(['"])(.*)\1$/, '$2');
      if (valor) return valor;
    }
  }
  throw new Error(`No encontré OPENAI_API_KEY en el entorno ni en ${rutaEnv}.`);
}

export type Transcribir = (audio: Buffer, info: { tipo: string; nombreArchivo: string; narrador: string; idioma?: Idioma }) => Promise<Transcripcion>;

/** El `transcribir` de verdad para el servidor web: la key se busca recién cuando llega un audio. */
export function transcribirConOpenAI(o: { key: () => string; fetch?: typeof fetch }): Transcribir {
  return async (audio, info) => {
    let key: string | undefined;
    try {
      key = o.key();
      return await transcribirAudio(audio, { key, tipo: info.tipo, nombreArchivo: info.nombreArchivo, prompt: promptDeTranscripcion(info.narrador, info.idioma), idioma: info.idioma, fetch: o.fetch });
    } catch (err) {
      throw new ErrorTranscripcion(taparKey((err as Error).message, key), esReintentable(err));
    }
  };
}
