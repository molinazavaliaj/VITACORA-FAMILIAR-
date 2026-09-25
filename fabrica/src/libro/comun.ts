import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
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

/**
 * El pedido del narrador sobre una respuesta puntual: "esto que no vaya al libro"
 * (hallazgo 19). `reservada` = no se publica nada de esa respuesta;
 * `reservado_tramo` = se publica todo menos ese tramo textual.
 */
export type ReservaDeRespuesta = Pick<Respuesta, 'reservada' | 'reservado_tramo'>;
/**
 * Una respuesta con lo mínimo para saber qué se puede publicar de ella y a qué
 * tema pertenece. `tema_de_orden` / `tema_motivo` son la marca del tema real
 * (ver `armarContextoDeTemas`): quedan parciales para que esto siga tipando con
 * la migración sin aplicar.
 */
export type RespuestaPublicable = Pick<Respuesta, 'transcripcion' | 'texto_directo'>
  & Partial<ReservaDeRespuesta>
  & Partial<Pick<Respuesta, 'id' | 'tema_de_orden' | 'tema_motivo'>>;

/**
 * El texto publicable de una respuesta, ya sin lo que el narrador pidió reservar.
 *
 * Existe por el hallazgo 19: en el piloto el narrador dijo "estas historias
 * prefiero que queden en mi mente, no en mi biografía" y la transcripción entró
 * entera al material del libro. Publicar lo que pidió guardar es la peor falla
 * posible del producto, así que esta decisión vive en UN solo lugar y la usan
 * todos los que publican: el capítulo, "la historia completa" (`armarMaterial`),
 * el audiolibro híbrido y la muestra de audio del anticipo.
 *
 * - `reservado_tramo` con texto → se publica todo MENOS ese tramo (el caso
 *   "reservada = true + reservado_tramo = …" es reserva PARCIAL, no total: el
 *   tramo es la información más fina que tenemos). Si el tramo NO aparece
 *   textual en la transcripción, se reserva la respuesta entera: sacar un texto
 *   que no está no sacaría nada y lo reservado se publicaría igual.
 * - `reservada` sin tramo → null (no hay nada publicable de esta respuesta).
 */
export function textoRespuesta(r: RespuestaPublicable): string | null {
  const texto = r.transcripcion?.trim() || r.texto_directo;
  if (!texto || texto.trim() === '') return null;

  const tramo = typeof r.reservado_tramo === 'string' ? r.reservado_tramo.trim() : '';
  if (tramo) {
    if (!texto.includes(tramo)) {
      // Con el id, alguien puede encontrar la respuesta y volver a publicarla a mano.
      console.warn(`textoRespuesta: el tramo reservado de la respuesta ${r.id ?? '(sin id)'} no está en la transcripción; se reserva la respuesta entera.`);
      return null;
    }
    const limpio = texto.split(tramo).join(' ').replace(/\s+/g, ' ').trim();
    return limpio === '' ? null : limpio;
  }

  return r.reservada === true ? null : texto;
}

/**
 * ¿De esta respuesta se puede publicar el AUDIO? (la muestra del anticipo, el
 * audiolibro híbrido).
 *
 * Un tramo reservado no se puede recortar de una grabación —no se puede sacar
 * una frase de en medio de su voz—, así que alcanza con CUALQUIERA de las dos
 * marcas para dejar el audio afuera. Mirar solo `reservada` dejaba pasar el audio
 * completo de una reserva parcial cargada a mano (CONTRATO invita a escribir esa
 * columna a mano). Ante la duda, de menos.
 */
export function esPublicable(r: Partial<ReservaDeRespuesta>): boolean {
  const tramo = typeof r.reservado_tramo === 'string' ? r.reservado_tramo.trim() : '';
  return r.reservada !== true && tramo === '';
}

/**
 * Los audios del narrador (nombres en Storage, `dia_NN[_k].ogg`) que pueden sonar en el audiolibro:
 * sin el de las respuestas que la familia excluyó en el tablero (`edicion.excluidas`, D1 25/09) ni
 * el de las reservadas (`esPublicable`). Un archivo que no es de ninguna respuesta conocida queda,
 * como siempre. El audiolibro arma su lista por nombre de archivo, no por respuesta: sin este filtro
 * lo reservado y lo excluido sonaban igual.
 */
export function audiosPublicables(
  archivos: string[],
  narradorId: string,
  respuestas: (Partial<ReservaDeRespuesta> & { id?: string; audio_path?: string | null })[],
  excluidas: Iterable<string>
): string[] {
  const fuera = new Set(excluidas);
  const callados = new Set(
    respuestas
      .filter((r) => r.audio_path && ((r.id && fuera.has(r.id)) || !esPublicable(r)))
      .map((r) => r.audio_path as string)
  );
  return archivos.filter((archivo) => !callados.has(`${narradorId}/${archivo}`));
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
 * La marca `tema_de_orden` (columna nueva de `respuestas`, la escribe el
 * entrevistador; la migración todavía puede no estar aplicada).
 *
 * Una marca cuenta solo si es un entero: la columna puede llegar ausente
 * (`undefined` = migración sin aplicar), nula (sin marca) o con cualquier cosa
 * que alguien haya tipeado a mano. Una marca que no se entiende se ignora en
 * SILENCIO y con un aviso, nunca tira: un libro ya pagado no puede caerse por
 * una marca rara en una respuesta.
 */
function temaMarcado(r: RespuestaPublicable): number | null {
  const tema = r.tema_de_orden;
  if (tema === undefined || tema === null) return null;
  if (typeof tema !== 'number' || !Number.isInteger(tema)) {
    console.warn(
      `temaMarcado: la respuesta ${r.id ?? '(sin id)'} trae tema_de_orden ${JSON.stringify(tema)}, que no es una orden de pregunta; se ignora la marca.`
    );
    return null;
  }
  return tema;
}

/** Un recuerdo: una respuesta que pertenece a un tema, aunque el narrador la haya contado contestando otra pregunta. */
export type RecuerdoDeTema = {
  /** La orden de la pregunta que el narrador estaba contestando cuando la contó. */
  ordenPropia: number;
  respuesta: RespuestaPublicable;
};

/**
 * Lo que `armarMaterial` necesita saber para respetar la marca `tema_de_orden`:
 *
 * - `recuerdosPorTema`: qué respuestas pertenecen de verdad a cada orden.
 * - `numeroDeCapituloPorOrden`: en qué capítulo del libro vive cada orden. Son
 *   los números del orden FINAL (con la edición de la dueña ya aplicada) y no
 *   los de `estructura.json`: la aclaración que lee el escritor tiene que decir
 *   el capítulo que va a ver impreso, y la dueña puede reordenar el libro.
 */
export type ContextoDeTemas = {
  recuerdosPorTema: Map<number, RecuerdoDeTema[]>;
  numeroDeCapituloPorOrden: Map<number, number>;
};

/**
 * Arma el contexto de la marca `tema_de_orden` para un libro cuyos capítulos ya
 * están en el orden FINAL. Se arma una sola vez por libro y se le pasa a
 * `armarMaterial` capítulo por capítulo: así todos los capítulos ven el mismo
 * número final, y ninguna respuesta se cuenta dos veces.
 *
 * `respuestasPorOrden` viene con las respuestas ya agrupadas por la orden que el
 * narrador contestó (el `pregunta_orden` de siempre), así que cada recuerdo sabe
 * de dónde salió: con eso `armarMaterial` evita repetir, en el capítulo donde la
 * respuesta está por derecho propio, la historia que ya está ahí.
 */
export function armarContextoDeTemas(
  capitulos: { ordenes: number[] }[],
  respuestasPorOrden: Map<number, RespuestaPublicable[]>
): ContextoDeTemas {
  const numeroDeCapituloPorOrden = new Map<number, number>();
  capitulos.forEach((capitulo, i) => {
    for (const orden of capitulo.ordenes) {
      // El primer capítulo gana si una orden apareciera en dos: `agruparCapitulos`
      // dedupea por orden (una orden vive en un solo capítulo), así que esto solo
      // evita inventar un número si algún día eso cambia.
      if (!numeroDeCapituloPorOrden.has(orden)) numeroDeCapituloPorOrden.set(orden, i + 1);
    }
  });

  const recuerdosPorTema = new Map<number, RecuerdoDeTema[]>();
  for (const [ordenPropia, respuestas] of respuestasPorOrden) {
    for (const respuesta of respuestas) {
      const tema = temaMarcado(respuesta);
      if (tema === null) continue;
      const lista = recuerdosPorTema.get(tema) ?? [];
      lista.push({ ordenPropia, respuesta });
      recuerdosPorTema.set(tema, lista);
    }
  }

  return { recuerdosPorTema, numeroDeCapituloPorOrden };
}

/**
 * La aclaración que se agrega al material del capítulo donde el narrador CONTÓ
 * la historia, cuando esa historia pertenece a otro capítulo:
 * "(recuerdo de otro tema: ya va en el capítulo N)".
 *
 * Existe por la marca `tema_de_orden`: la historia se SUMA al capítulo de su
 * tema (el narrador la contó una sola vez y el libro la lleva una sola vez),
 * pero NO se saca del capítulo donde la contó — sacarla sería reescribir lo que
 * él dijo que estaba contando ahí. El aviso le dice al escritor que esa clase
 * ya está dada en otro lado, para que la cuente una sola vez.
 *
 * Devuelve '' (nada que aclarar) en todos los casos en que hoy no pasaría nada:
 * sin contexto de temas (el camino de `historiaCompleta`, que ya tiene todo),
 * sin marca, con una marca que no se entiende, o cuando el tema es de este mismo
 * capítulo — ahí la historia ya está donde va y no hay nada que avisar.
 */
function aclaracionDeRecuerdo(
  respuesta: RespuestaPublicable,
  ordenesPropias: Set<number>,
  contexto: ContextoDeTemas | undefined
): string {
  if (!contexto) return '';
  const tema = temaMarcado(respuesta);
  if (tema === null) return '';
  if (ordenesPropias.has(tema)) return '';

  const numero = contexto.numeroDeCapituloPorOrden.get(tema);
  if (numero === undefined) {
    // La marca apunta a una orden que no está en ningún capítulo del libro (una
    // pregunta que no existe, o que quedó sin respuesta): no hay a dónde mandar
    // la historia. Como hoy: la respuesta se queda donde la contó, sin aviso.
    console.warn(
      `aclaracionDeRecuerdo: la respuesta ${respuesta.id ?? '(sin id)'} dice tratar el tema de la orden ${tema}, que no está en ningún capítulo del libro; se ignora la marca.`
    );
    return '';
  }
  return `\n(recuerdo de otro tema: ya va en el capítulo ${numero})`;
}

/**
 * Arma el bloque "P: ... / R: ..." para un conjunto de órdenes de pregunta,
 * en el orden dado. Se usa tanto para el material de un capítulo (subset de
 * órdenes) como para "la historia completa" (todos los órdenes).
 *
 * Con `temas` (ver `armarContextoDeTemas`) el material de un capítulo SUMA las
 * respuestas marcadas con `tema_de_orden` hacia una de sus órdenes: el narrador
 * que, contestando la 9, recuerda algo que pertenece a la historia de la 2, hace
 * que ese recuerdo entre al capítulo de la 2 además de quedarse en el de la 9 con
 * la aclaración de a dónde va. "La historia completa" no lleva `temas` a
 * propósito: ya tiene todas las respuestas, en su propia pregunta, y ahí una
 * aclaración no tendría a quién avisarle nada.
 */
export function armarMaterial(
  ordenes: number[],
  preguntasPorOrden: Map<number, Pick<Pregunta, 'texto'>>,
  respuestasPorOrden: Map<number, RespuestaPublicable[]>,
  temas?: ContextoDeTemas
): string {
  const bloques: string[] = [];
  const ordenesPropias = new Set(ordenes);

  for (const orden of ordenes) {
    const pregunta = preguntasPorOrden.get(orden);
    for (const respuesta of respuestasPorOrden.get(orden) ?? []) {
      const texto = textoRespuesta(respuesta);
      if (!texto) continue;
      bloques.push(
        `P: ${pregunta?.texto ?? `Pregunta ${orden}`}\nR: ${texto}${aclaracionDeRecuerdo(respuesta, ordenesPropias, temas)}`
      );
    }

    // Los recuerdos que apuntan a esta orden: van con la pregunta de ESTE tema
    // (es la que da el encuadre del capítulo), avisando que no salieron de esa
    // pregunta para que el escritor no la tome por una respuesta al pie de la
    // letra. Una respuesta que ya está en este capítulo por su propia orden no
    // se repite: cada historia se cuenta una sola vez.
    for (const recuerdo of temas?.recuerdosPorTema.get(orden) ?? []) {
      if (ordenesPropias.has(recuerdo.ordenPropia)) continue;
      const texto = textoRespuesta(recuerdo.respuesta);
      if (!texto) continue;
      bloques.push(
        `P: ${pregunta?.texto ?? `Pregunta ${orden}`} (lo contó respondiendo otra pregunta)\nR: ${texto}`
      );
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
 * ¿Este error de Supabase Storage dice "el objeto no está"? Storage no lo
 * distingue con un tipo: según la versión responde 404, o 400 con
 * `error: 'not_found'`, y un mensaje "Object not found". Cualquier otra cosa
 * (red caída, 500, permisos) NO es "no está".
 */
export function esErrorDeNoEncontrado(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { message?: unknown; statusCode?: unknown; status?: unknown; error?: unknown };
  if (typeof e.message === 'string' && /not found/i.test(e.message)) return true;
  if (e.statusCode === 404 || e.statusCode === '404' || e.status === 404) return true;
  if (e.error === 'not_found') return true;
  return false;
}

/**
 * Descarga un archivo de texto de Storage si existe; a diferencia de
 * `descargarJson`, acá "no existe" es un resultado válido (null), no un
 * error — lo usan los checkpoints de borrador: si no hay nada cacheado, el
 * llamador genera de cero.
 *
 * Solo "no existe" devuelve null. Un fallo transitorio (red, 500) tira: si
 * se confundiera con "no existe", un borrador cacheado se regeneraría (y se
 * le pagaría al modelo de nuevo), o un `estructura.json` que sí está se
 * daría por ausente.
 */
export async function descargarTextoOpcional(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string
): Promise<string | null> {
  const { data, error } = await db.storage.from('audios').download(ruta);
  if (error) {
    if (esErrorDeNoEncontrado(error)) return null;
    throw new Error(`No se pudo descargar ${ruta}: ${error.message}`);
  }
  if (!data) return null;
  return typeof data.text === 'function' ? await data.text() : String(data);
}

/**
 * Sube un archivo de texto a Storage (upsert). Se usa para cachear la salida
 * cara del modelo (borrador de capítulo, pasada de editor) ANTES de los
 * pasos baratos que pueden fallar (PDF, audio) — así un reintento no vuelve
 * a pagarle al modelo por algo que ya escribió. Por defecto markdown; los
 * JSON (narracion.json) pasan su `contentType`.
 *
 * Siempre con `cacheControl: '0'`: el bucket sirve copias cacheadas, y este
 * archivo lo escriben y lo leen tres actores (la fábrica, el worker de la PC
 * de audio y la web). Se vio en serio: dos lecturas seguidas del mismo
 * `frases.json` recién subido devolvieron resultados distintos —sin
 * cache-buster, la versión vieja—, así que una lectura cacheada puede hacer
 * que uno pise el trabajo del otro. Sin caché, lo que se lee es lo que hay.
 */
export async function subirTexto(
  db: ReturnType<typeof obtenerClienteDb>,
  ruta: string,
  contenido: string,
  contentType = 'text/markdown'
): Promise<void> {
  const { error } = await db.storage.from('audios').upload(ruta, contenido, {
    contentType,
    cacheControl: '0',
    upsert: true,
  });
  if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
}

/** El borrador de un capítulo (numerado por el orden FINAL) y el del libro editado. */
export const RUTA_BORRADOR_CAP = (narradorId: string, numeroCapitulo: number) =>
  `${narradorId}/paquete/borrador_cap_${String(numeroCapitulo).padStart(2, '0')}.md`;
export const RUTA_BORRADOR_LIBRO = (narradorId: string) => `${narradorId}/paquete/borrador_libro.md`;
/**
 * Con qué se escribieron los borradores (revisión del ajuste G). Los borradores se guardan por
 * posición: si entre dos corridas cambia la lista de capítulos (una respuesta descartada, un
 * capítulo que se cae por excluidas) o lo que la familia excluyó o corrigió, reusarlos metería
 * contenido excluido o correría los capítulos uno. `capitulos` es el nombre del guion de cada
 * posición ya escrita, en orden; `libro`, si el borrador del libro editado es de esta misma huella.
 */
export const RUTA_MANIFIESTO_BORRADORES = (narradorId: string) => `${narradorId}/paquete/borradores.json`;
export type ManifiestoBorradores = { huella: string; capitulos: string[]; libro: boolean };

/**
 * La huella de lo que decide el contenido de los borradores más allá de la lista de capítulos: las
 * respuestas que entran al libro, las excluidas y las correcciones de la familia.
 */
export function huellaDeBorradores(respuestas: { id?: string }[], excluidas: string[], correcciones: string | null): string {
  const datos = {
    respuestas: respuestas.map((r) => r.id ?? '').sort(),
    excluidas: [...excluidas].sort(),
    correcciones: correcciones ?? '',
  };
  return createHash('sha256').update(JSON.stringify(datos)).digest('hex');
}

/** Lee el manifiesto guardado; uno roto o de otra forma vale como "no hay" (se escribe todo de nuevo). */
export function leerManifiestoBorradores(texto: string | null): ManifiestoBorradores | null {
  if (!texto) return null;
  try {
    const m = JSON.parse(texto) as Partial<ManifiestoBorradores>;
    if (typeof m.huella !== 'string' || !Array.isArray(m.capitulos)) return null;
    return { huella: m.huella, capitulos: m.capitulos.filter((c): c is string => typeof c === 'string'), libro: m.libro === true };
  } catch {
    return null;
  }
}

/** Los conectores de un capítulo del audiolibro híbrido (mismo número que el borrador): también son caché del modelo. */
export const RUTA_CONECTORES_CAP = (narradorId: string, numeroCapitulo: number) =>
  `${narradorId}/paquete/conectores_cap_${String(numeroCapitulo).padStart(2, '0')}.json`;

/**
 * Todos los borradores de un narrador con `cantidadCapitulos` capítulos: lo
 * que se borra al entregar. Incluye los conectores de cada capítulo aunque
 * el pedido no haya sido de voz clonada (o el capítulo no fuera híbrido):
 * Storage no se queja de borrar lo que no está, y así no hay que recordar
 * qué se cacheó.
 */
export const rutasDeBorradores = (narradorId: string, cantidadCapitulos: number): string[] => [
  ...Array.from({ length: cantidadCapitulos }, (_, i) => RUTA_BORRADOR_CAP(narradorId, i + 1)),
  RUTA_BORRADOR_LIBRO(narradorId),
  ...Array.from({ length: cantidadCapitulos }, (_, i) => RUTA_CONECTORES_CAP(narradorId, i + 1)),
];

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
 * no es un error: se avisa y se sigue sin muestra. Las que el narrador pidió
 * reservar no se usan: la muestra se publica en la landing (hallazgo 19).
 */
export async function recortarMuestraDeAudio(
  db: ReturnType<typeof obtenerClienteDb>,
  respuestas: Respuesta[],
  rutaDestino: string
): Promise<void> {
  const primeraConAudio = respuestas
    .filter((r): r is Respuesta & { audio_path: string } => Boolean(r.audio_path) && esPublicable(r))
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
