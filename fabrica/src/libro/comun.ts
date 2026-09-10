import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { obtenerClienteDb, type Pregunta, type Respuesta } from '../db.js';

// Helpers compartidos entre anticipo.ts (la tercera respuesta, antes de
// pagar), previsualizar.ts (capítulo 1, para enamorar antes de comprar) y
// generar-paquete.ts (el libro completo, ya pagado). Viven acá para no
// duplicar lógica que tiene que comportarse idéntico en los tres lugares —
// dos implementaciones del mismo "cómo armamos el material de un capítulo"
// es la clase de divergencia silenciosa que después cuesta cara.

const execFileAsync = promisify(execFile);

export type Nombres = { correcciones: { original: string; corregido: string }[] };

/**
 * Junta los bloques de texto de una respuesta del SDK de Anthropic
 * (`finalMessage().content`) en un solo string. Lo usan todas las llamadas
 * a `claude-fable-5` de la fábrica (capítulo, editor, detección de
 * entidades) — el shape de la respuesta es siempre el mismo.
 */
export function extraerTexto(bloques: Array<{ type: string; text?: string }>): string {
  return bloques
    .filter((bloque): bloque is { type: 'text'; text: string } => bloque.type === 'text' && typeof bloque.text === 'string')
    .map((bloque) => bloque.text)
    .join('\n');
}

export function textoRespuesta(r: Pick<Respuesta, 'transcripcion' | 'texto_directo'>): string | null {
  const texto = r.transcripcion?.trim() || r.texto_directo;
  return texto && texto.trim() !== '' ? texto : null;
}

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Formatea las correcciones de nombres para el prompt del capítulo:
 * "original → corregido", una por línea. Vacío → "(sin correcciones)" (el
 * prompt igual necesita algo ahí para no confundir al modelo).
 */
export function formatearNombresCorregidos(correcciones: Nombres['correcciones']): string {
  if (correcciones.length === 0) return '(sin correcciones)';
  return correcciones.map((c) => `${c.original} → ${c.corregido}`).join('\n');
}

/**
 * Arma el bloque "P: ... / R: ..." para un conjunto de órdenes de pregunta,
 * en el orden dado. Se usa tanto para el material de un capítulo (subset de
 * órdenes) como para "la historia completa" (todos los órdenes).
 */
export function armarMaterial(
  ordenes: number[],
  preguntasPorOrden: Map<number, Pick<Pregunta, 'texto'>>,
  respuestasPorOrden: Map<number, Pick<Respuesta, 'transcripcion' | 'texto_directo'>[]>
): string {
  const bloques: string[] = [];
  for (const orden of ordenes) {
    const pregunta = preguntasPorOrden.get(orden);
    const respuestas = respuestasPorOrden.get(orden) ?? [];
    for (const respuesta of respuestas) {
      const texto = textoRespuesta(respuesta);
      if (!texto) continue;
      bloques.push(`P: ${pregunta?.texto ?? `Pregunta ${orden}`}\nR: ${texto}`);
    }
  }
  return bloques.join('\n\n');
}

/**
 * Convierte el Markdown mínimo que devuelve el modelo (párrafos + líneas
 * "> cita") a HTML. No es un parser de Markdown general — el prompt solo
 * pide estas dos formas, así que alcanza con esto.
 */
export function capituloMarkdownAHtml(texto: string): string {
  const lineas = texto.split(/\r?\n/);
  const bloques: string[] = [];
  let actual: string[] = [];
  let tipoActual: 'p' | 'blockquote' | null = null;

  function cerrarBloque() {
    if (actual.length === 0) return;
    const contenido = actual.join(' ').trim();
    if (contenido) {
      const etiqueta = tipoActual === 'blockquote' ? 'blockquote' : 'p';
      bloques.push(`<${etiqueta}>${escaparHtml(contenido)}</${etiqueta}>`);
    }
    actual = [];
    tipoActual = null;
  }

  for (const lineaCruda of lineas) {
    const linea = lineaCruda.trim();
    if (linea === '') {
      cerrarBloque();
      continue;
    }
    const esCita = linea.startsWith('>');
    const tipo: 'p' | 'blockquote' = esCita ? 'blockquote' : 'p';
    if (tipoActual !== null && tipoActual !== tipo) cerrarBloque();
    tipoActual = tipo;
    actual.push(esCita ? linea.replace(/^>\s?/, '') : linea);
  }
  cerrarBloque();

  return bloques.join('\n');
}

/**
 * Descarga y parsea un JSON de Storage. Tira si no existe o no parsea —
 * ambos casos son "no cumple la precondición" para quien llama.
 */
export async function descargarJson<T>(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string,
  descripcion: string
): Promise<T> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error || !data) {
    throw new Error(`No se pudo descargar ${descripcion} (${ruta}): ${error?.message ?? 'sin datos'}`);
  }
  const texto = typeof data.text === 'function' ? await data.text() : String(data);
  try {
    return JSON.parse(texto) as T;
  } catch (err) {
    throw new Error(`${descripcion} (${ruta}) no es JSON válido: ${(err as Error).message}`);
  }
}

/**
 * Descarga un archivo de texto de Storage si existe; a diferencia de
 * `descargarJson`, acá "no existe" es un resultado válido (null), no un
 * error — lo usan los checkpoints de borrador: si no hay nada cacheado, el
 * llamador genera de cero.
 */
export async function descargarTextoOpcional(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string
): Promise<string | null> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error || !data) return null;
  return typeof data.text === 'function' ? await data.text() : String(data);
}

/**
 * Sube un archivo de texto a Storage (upsert). Se usa para cachear la salida
 * cara del modelo (borrador de capítulo, pasada de editor) ANTES de los
 * pasos baratos que pueden fallar (PDF, audio) — así un reintento no vuelve
 * a pagarle al modelo por algo que ya escribió.
 */
export async function subirTexto(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string,
  contenido: string
): Promise<void> {
  const { error } = await db.storage.from('audios').upload(ruta, contenido, {
    contentType: 'text/markdown',
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
}

/**
 * Borra una lista de archivos de Storage. Se usa para limpiar los borradores
 * cacheados una vez que el paquete se entregó y ya no hacen falta.
 */
export async function borrarArchivos(
  db: ReturnType<typeof obtenerClienteDb>,
  rutas: string[]
): Promise<void> {
  if (rutas.length === 0) return;
  const { error } = await db.storage.from('audios').remove(rutas);
  if (error) throw new Error(`No se pudieron borrar (${rutas.join(', ')}): ${error.message}`);
}

/**
 * Recorta los primeros 60 segundos del primer audio que grabó el narrador y
 * lo deja en `rutaDestino` como mp3. Es la pieza más persuasiva que tenemos
 * —su voz de verdad— y la única que no le paga a ningún modelo: es ffmpeg
 * cortando un archivo que él ya mandó.
 *
 * Si no hay ninguna respuesta con audio (narrador que responde escribiendo),
 * no es un error: se avisa y se sigue sin muestra.
 */
export async function recortarMuestraDeAudio(
  db: ReturnType<typeof obtenerClienteDb>,
  respuestas: Respuesta[],
  rutaDestino: string
): Promise<void> {
  const primeraConAudio = respuestas
    .filter((r): r is Respuesta & { audio_path: string } => Boolean(r.audio_path))
    .sort((a, b) => a.pregunta_orden - b.pregunta_orden)[0];

  if (!primeraConAudio) {
    console.warn(`recortarMuestraDeAudio: no hay respuestas con audio, se omite ${rutaDestino}.`);
    return;
  }

  const { data: audioBlob, error: errorAudio } = await db.storage
    .from('audios')
    .download(primeraConAudio.audio_path);
  if (errorAudio || !audioBlob) {
    throw new Error(
      `No se pudo descargar el audio de muestra (${primeraConAudio.audio_path}): ${errorAudio?.message ?? 'sin datos'}`
    );
  }

  const dirTemp = await mkdtemp(path.join(tmpdir(), 'vitacora-muestra-'));
  const entradaPath = path.join(dirTemp, 'entrada.ogg');
  const salidaPath = path.join(dirTemp, 'muestra.mp3');

  try {
    await writeFile(entradaPath, Buffer.from(await audioBlob.arrayBuffer()));

    await execFileAsync('ffmpeg', ['-y', '-i', entradaPath, '-t', '60', '-acodec', 'libmp3lame', salidaPath]);

    const { error: errorSubida } = await db.storage
      .from('audios')
      .upload(rutaDestino, await readFile(salidaPath), {
        contentType: 'audio/mpeg',
        upsert: true,
      });
    if (errorSubida) throw new Error(`No se pudo subir ${rutaDestino}: ${errorSubida.message}`);
  } finally {
    await rm(dirTemp, { recursive: true, force: true });
  }
}
