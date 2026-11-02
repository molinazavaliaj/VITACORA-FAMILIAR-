// Las fotos que la familia subió por capítulo (tabla `fotos`, la escribe la
// web — spec docs/panel-usuario.md §6.3). La principal abre el capítulo, las
// demás lo cierran en su orden. Se bajan del bucket privado y se embeben
// como data URI: el PDF se imprime desde un HTML autocontenido, y el lector
// online carga ese mismo HTML.
//
// Original sin recomprimir (la resolución la valida la web al subir): el
// impreso necesita los píxeles. Una foto que no baja no frena el libro — se
// avisa y se omite.
//
// La principal de cada capítulo puede ir arriba (su propia página, después de
// la portadilla, como siempre) o abajo (dentro de la portadilla, debajo del
// título), y se recorta al marco con el `foco` que eligió la familia; las de
// cierre van enteras. Eso vive en `fotos.posicion` / `fotos.foco` (migración
// 20260918): sin esos datos —migración sin aplicar, fila vieja o un valor que
// no se entiende— no hay recorte ni cambio de lugar y el libro sale como antes
// (ver `normalizarFoco`).

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Foto } from '../db.js';
import type { ProcesarFotos } from './preparar-fotos.js';

/** El punto de la foto que tiene que quedar a la vista al recortarla al marco (0..1 por eje). */
export type Foco = { x: number; y: number };

/**
 * El atributo `style` con el punto de foco para `object-fit: cover`, o '' si no
 * hay foco usable. Devuelve el atributo ENTERO (y no el valor pelado) para que
 * el caso "sin foco" no escriba ni `style=""` ni un `object-position: 50% 50%`
 * inventado: sin dato, el marcado de la foto tiene que salir igual que antes de
 * la migración 20260918, cuando este atributo no existía. Revalida el crudo en
 * vez de confiar en el tipo: un dato raro que se cuele no puede terminar en un
 * `object-position: NaN%` dentro del libro.
 */
export function atributoFoco(crudo: unknown): string {
  const foco = normalizarFoco(crudo);
  if (!foco) return '';
  return ` style="object-position: ${Math.round(foco.x * 100)}% ${Math.round(foco.y * 100)}%"`;
}

/** Dónde va la principal del capítulo: `arriba` = página propia después de la
 *  portadilla (como siempre); `abajo` = dentro de la portadilla, debajo del título. */
export type PosicionApertura = 'arriba' | 'abajo';

export type FotoLibro = { dataUri: string; epigrafe: string | null; foco?: Foco };
export type FotosCapitulo = { apertura: FotoLibro | null; posicionApertura?: PosicionApertura; cierre: FotoLibro[] };
export type FotosDelLibro = {
  porCapitulo: Map<string, FotosCapitulo>;
  porId: Map<string, FotoLibro>;
  /** Todas, en el orden en que las subió la familia (sin repetidas): de acá sale el álbum (`fotosDelAlbum`).
   *  `ids`: la fila y las repetidas que se juntaron con ella (cualquiera puede ser la elegida para la tapa). */
  enOrden: { ids: string[]; capitulo: string | null; foto: FotoLibro }[];
};

/**
 * Las fotos que van al álbum del final del libro (Naza, 02/11: «no puede ser que quede el libro sin las fotos»).
 * Todas las que subió la familia, en su orden, menos la de tapa (ya está en la tapa) y las que ya entraron en un
 * capítulo. El libro V3 no pone fotos por capítulo (sus capítulos los arma el escritor): ahí van todas al álbum.
 */
export function fotosDelAlbum(fotos: FotosDelLibro, o: { tapaId?: string | null; capitulosConFotos?: Iterable<string> } = {}): FotoLibro[] {
  const enCapitulo = new Set(o.capitulosConFotos ?? []);
  return fotos.enOrden
    .filter((f) => !(o.tapaId && f.ids.includes(o.tapaId)) && !(f.capitulo !== null && enCapitulo.has(f.capitulo)))
    .map((f) => f.foto);
}

/** Diferencia media (0–255 por píxel) hasta la que dos firmas son la misma foto. Medido con las 43 de Juan Domingo
 *  (02/11): la misma foto en otro tamaño da 0–7, dos tomas seguidas casi iguales 12, fotos distintas más de 30. */
export const DIFERENCIA_MISMA_FOTO = 15;

/** Una foto que la familia puso en un capítulo (el libro de antes de la V3); las del álbum llegan sin capítulo. */
const enCapitulo = (f: Foto): boolean => Boolean(f.capitulo);

/** Diferencia media entre dos firmas de preparar-fotos.ts (16×16 grises, dos hex por píxel). */
export function diferenciaDeFirmas(a: string, b: string): number {
  if (a.length !== b.length || !a.length) return Infinity;
  let suma = 0;
  for (let i = 0; i < a.length; i += 2) suma += Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16));
  return suma / (a.length / 2);
}

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Formatos que Chromium (el que imprime el PDF) no decodifica: una foto así
 * embebida sale como una página en blanco. La web ya no las acepta al subir;
 * las que entraron antes se saltean acá.
 */
const EXTENSIONES_SIN_SOPORTE = new Set(['heic', 'heif']);

function extensionDeRuta(ruta: string): string {
  return ruta.split('.').pop()?.toLowerCase() ?? '';
}

export function mimeDeRuta(ruta: string): string {
  return MIME_POR_EXTENSION[extensionDeRuta(ruta)] ?? 'image/jpeg';
}

/**
 * `fotos.foco` viene como jsonb que escribe la web; acá se vuelve un par de
 * números seguros, o `undefined` si no hay dato usable. `undefined` quiere decir
 * "como siempre": la foto va entera, sin recorte. Sin la migración 20260918
 * aplicada la columna no existe y la fila llega sin `foco`, y el libro tiene que
 * salir igual que antes de esa migración — no recortado desde el centro. Por el
 * mismo motivo un valor que no se entiende (texto vacío, un número suelto,
 * `null`, un eje que no es número, `NaN`) se IGNORA en vez de caer al centro: no
 * se inventa un foco que la familia no eligió. Fuera de 0..1 se recorta al borde
 * (CONTRATO). Nunca tira: un foco raro no puede frenar un libro.
 */
export function normalizarFoco(crudo: unknown): Foco | undefined {
  if (typeof crudo !== 'object' || crudo === null) return undefined;
  const { x, y } = crudo as { x?: unknown; y?: unknown };
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  const acotar = (v: number) => Math.min(1, Math.max(0, v));
  return { x: acotar(x), y: acotar(y) };
}

/** `posicion`: solo `'abajo'` cambia algo. Cualquier otra cosa —sin la columna,
 *  `null`, un valor que no existe en el check de la migración— es `'arriba'`, que
 *  es lo que la fábrica hacía siempre. */
function normalizarPosicion(cruda: unknown): PosicionApertura {
  return cruda === 'abajo' ? 'abajo' : 'arriba';
}

/**
 * Cotas de lo que se embebe en el HTML. Cada foto va entera como data URI
 * (base64 pesa un tercio más que el original), y Chromium tiene que sostener
 * todo el documento en memoria para paginar e imprimir: una foto de 40 MB o
 * un libro con 200 MB de fotos lo tumban. Lo que pasa la cota se omite con
 * aviso; achicar las fotos al subirlas es el siguiente paso de la web.
 */
export const LIMITE_BYTES_FOTO = 8 * 1024 * 1024;
export const LIMITE_BYTES_TOTAL = 60 * 1024 * 1024;

async function bajarFoto(db: SupabaseClient, ruta: string): Promise<Buffer | null> {
  // Todo lo que puede fallar acá (la descarga en sí, o leer el blob) cae en
  // el mismo catch: una foto rota no frena el libro, solo se avisa y se
  // omite — ver el comentario del módulo.
  try {
    const { data, error } = await db.storage.from('audios').download(ruta);
    if (error || !data) throw new Error(error?.message ?? 'sin datos');
    return Buffer.from(await data.arrayBuffer());
  } catch (err) {
    console.warn(`cargarFotos: no se pudo bajar ${ruta} (${(err as Error).message}); la foto se omite.`);
    return null;
  }
}

function enMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * `procesar` (opcional, `procesarFotosConChromium` de preparar-fotos.ts): achica las fotos pesadas y le saca a
 * cada una una firma de cómo se ve, para reconocer la misma foto subida dos veces en distinto tamaño. Sin él, las
 * fotos van tal cual y solo se sacan las repetidas byte por byte. La tapa no lo necesita (quiere la original).
 */
export async function cargarFotos(db: SupabaseClient, narradorId: string, o: { procesar?: ProcesarFotos } = {}): Promise<FotosDelLibro> {
  // `select('*')` y no la lista explícita de columnas: nombrar `posicion` y
  // `foco` haría que PostgREST rechace la consulta ENTERA mientras la migración
  // 20260918 no esté aplicada ("column fotos.posicion does not exist"), y sin
  // fotos no hay libro: el pedido caería a `fallido`. Con `*` la fila viene sin
  // esas columnas y el libro sale como siempre — el mismo criterio que la marca
  // `tema_de_orden` (ver comun.ts).
  const { data, error } = await db
    .from('fotos')
    .select('*')
    .eq('narrador_id', narradorId)
    .order('orden', { ascending: true });
  if (error) throw new Error(`No se pudieron leer las fotos de ${narradorId}: ${error.message}`);

  // Se ordena acá por las dudas — no confiar en que la consulta ya vino
  // ordenada. Entre dos principales del mismo capítulo gana la de menor orden.
  const fotosOrdenadas = [...((data ?? []) as Foto[])].sort((a, b) => a.orden - b.orden);

  // 1. Bajarlas. La misma foto subida dos veces (mismos bytes) entra una sola vez.
  type Bajada = { foto: Foto; bytes: Buffer; mime: string; pixeles: number; firma: string | null; repetidas: string[] };
  const bajadas: Bajada[] = [];
  const vistas = new Map<string, Bajada>();
  for (const foto of fotosOrdenadas) {
    if (EXTENSIONES_SIN_SOPORTE.has(extensionDeRuta(foto.storage_path))) {
      console.warn(`cargarFotos: ${foto.storage_path} es HEIC/HEIF y el navegador no lo decodifica; la foto se omite.`);
      continue;
    }
    const bytes = await bajarFoto(db, foto.storage_path);
    if (bytes === null) continue;
    const hash = createHash('sha1').update(bytes).digest('hex');
    const primera = vistas.get(hash);
    // Una que la familia puso en un capítulo no se junta con otra: ese lugar lo eligió ella.
    if (primera && !enCapitulo(foto) && !enCapitulo(primera.foto)) {
      console.warn(`cargarFotos: ${foto.storage_path} es la misma foto que otra ya subida; va una sola vez.`);
      primera.repetidas.push(foto.id);
      continue;
    }
    const bajada: Bajada = { foto, bytes, mime: mimeDeRuta(foto.storage_path), pixeles: 0, firma: null, repetidas: [] };
    if (!vistas.has(hash)) vistas.set(hash, bajada);
    bajadas.push(bajada);
  }

  // 2. Achicar las pesadas y firmar cada una (si hay con qué). Una que no se puede procesar sigue como vino.
  if (o.procesar && bajadas.length) {
    const procesadas = await o.procesar(bajadas.map((b) => ({ bytes: b.bytes, mime: b.mime })));
    procesadas.forEach((p, i) => {
      if (!p) return;
      Object.assign(bajadas[i], { bytes: p.bytes, mime: p.mime, pixeles: p.ancho * p.alto, firma: p.firma });
    });
  }

  // 3. La misma foto en dos tamaños (la familia la subió chica y después grande): queda una, en el lugar de la
  // primera y con los píxeles de la más grande.
  const quedan: Bajada[] = [];
  for (const b of bajadas) {
    const igual = b.firma && !enCapitulo(b.foto)
      ? quedan.find((q) => q.firma && !enCapitulo(q.foto) && diferenciaDeFirmas(q.firma, b.firma!) <= DIFERENCIA_MISMA_FOTO)
      : undefined;
    if (!igual) { quedan.push(b); continue; }
    console.warn(`cargarFotos: ${b.foto.storage_path} es la misma foto que ${igual.foto.storage_path} en otro tamaño; va una sola vez.`);
    igual.repetidas.push(b.foto.id, ...b.repetidas);
    if (b.pixeles > igual.pixeles) Object.assign(igual, { bytes: b.bytes, mime: b.mime, pixeles: b.pixeles });
  }

  const porCapitulo = new Map<string, FotosCapitulo>();
  const porId = new Map<string, FotoLibro>();
  const enOrden: FotosDelLibro['enOrden'] = [];
  let bytesEmbebidos = 0;
  for (const { foto, bytes, mime, repetidas } of quedan) {
    if (bytes.length > LIMITE_BYTES_FOTO) {
      console.warn(`cargarFotos: ${foto.storage_path} pesa ${enMb(bytes.length)} (tope ${enMb(LIMITE_BYTES_FOTO)}); la foto se omite.`);
      continue;
    }
    if (bytesEmbebidos + bytes.length > LIMITE_BYTES_TOTAL) {
      console.warn(
        `cargarFotos: con ${foto.storage_path} las fotos del libro pasarían ${enMb(LIMITE_BYTES_TOTAL)} ` +
          `(ya van ${enMb(bytesEmbebidos)}); la foto se omite.`
      );
      continue;
    }
    bytesEmbebidos += bytes.length;
    const fotoLibro: FotoLibro = {
      dataUri: `data:${mime};base64,${bytes.toString('base64')}`,
      epigrafe: foto.epigrafe?.trim() || null,
      foco: normalizarFoco(foto.foco),
    };
    // Una repetida que se juntó con esta sigue encontrándose por su id (la tapa puede haber elegido esa).
    for (const id of [foto.id, ...repetidas]) porId.set(id, fotoLibro);
    enOrden.push({ ids: [foto.id, ...repetidas], capitulo: foto.capitulo, foto: fotoLibro });

    const capitulo = porCapitulo.get(foto.capitulo) ?? { apertura: null, cierre: [] };
    if (foto.principal && capitulo.apertura === null) {
      capitulo.apertura = fotoLibro;
      // La posición es de la principal; las de cierre la ignoran (CONTRATO).
      capitulo.posicionApertura = normalizarPosicion(foto.posicion);
    } else {
      capitulo.cierre.push(fotoLibro);
    }
    porCapitulo.set(foto.capitulo, capitulo);
  }

  return { porCapitulo, porId, enOrden };
}
