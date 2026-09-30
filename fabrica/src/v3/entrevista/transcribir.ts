// Transcribe un audio del narrador con OpenAI, igual que
// `entrevistador/src/ia/transcribir.ts` (que es de Joaquín y no se importa):
// modelo `gpt-transcribe`, castellano, y un prompt corto de vocabulario
// rioplatense + el nombre del narrador. La duración viene en `usage.seconds`.
//
// ES PAGO (unos centavos por minuto). Los tests usan un `fetch` falso.
// La key NUNCA se imprime: los errores muestran el status y el mensaje de
// OpenAI, y cualquier cosa con forma de key se tapa antes de salir.

import { readFileSync } from 'node:fs';

export type Transcripcion = { texto: string; duracionSegundos: number | null };

export const URL_TRANSCRIPCION = 'https://api.openai.com/v1/audio/transcriptions';

/** Prompt de vocabulario: corto, porque el modelo lo corta a ~224 tokens. */
export function promptDeTranscripcion(nombre: string): string {
  return `${nombre} cuenta su vida en castellano rioplatense. Vocabulario: laburo, laburar, pibe, piba, gurí, botija, mina, colectivo, bondi, guita, quilombo, che, viejo, vieja, barrio, liceo, facultad, cancha, asado, mate.`;
}

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
  fetch?: typeof fetch;
};

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
  form.append('language', 'es');
  form.append('response_format', 'json');
  if (o.prompt) form.append('prompt', o.prompt);
  let res: Response;
  try {
    res = await (o.fetch ?? fetch)(URL_TRANSCRIPCION, {
      method: 'POST',
      headers: { Authorization: `Bearer ${o.key}` },
      body: form,
    });
  } catch (err) {
    throw new ErrorTranscripcion(taparKey(`La transcripción no llegó a OpenAI (¿sin conexión?): ${(err as Error).message}`, o.key), esReintentable(err));
  }
  const cuerpo = await res.text();
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

export type Transcribir = (audio: Buffer, info: { tipo: string; nombreArchivo: string; narrador: string }) => Promise<Transcripcion>;

/** El `transcribir` de verdad para el servidor web: la key se busca recién cuando llega un audio. */
export function transcribirConOpenAI(o: { key: () => string; fetch?: typeof fetch }): Transcribir {
  return async (audio, info) => {
    let key: string | undefined;
    try {
      key = o.key();
      return await transcribirAudio(audio, { key, tipo: info.tipo, nombreArchivo: info.nombreArchivo, prompt: promptDeTranscripcion(info.narrador), fetch: o.fetch });
    } catch (err) {
      throw new ErrorTranscripcion(taparKey((err as Error).message, key), esReintentable(err));
    }
  };
}
