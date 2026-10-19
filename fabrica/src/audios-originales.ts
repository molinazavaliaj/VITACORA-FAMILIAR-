// El borrado de los audios originales a los 3 meses del libro (18/10). Lo prometen
// los términos y la política de privacidad (revisión legal del 17/10, L3-01 y L3-05):
// «Los audios originales se borran 3 meses después de producir el libro. Quedan solo
// los recortes de Su voz». Hasta hoy no existía y el texto mentía.
//
// Opción A de Naza (18/10): antes de borrar, la familia recibe un mail con TODOS los
// audios para descargar. Para muchas familias es la voz de su abuela contando cada
// historia, y no la pueden perder sin saberlo.
//
// La cuenta arranca el día del mail «el libro está listo» (su candado en el paquete):
//   - día 76: se arman los ZIP de descarga en `{narrador}/descarga/`, se manda el mail
//     con un link firmado a cada uno, y queda el candado `aviso_borrado_audios.txt`.
//   - día 90, y al menos 14 días después del aviso: se borran de Storage los audios de
//     `respuestas.audio_path` y queda `audios_borrados.txt`. El libro, las
//     transcripciones y los recortes de «Su voz» (`{narrador}/voz/…`) no se tocan.
//   - 45 días después del aviso: se borran los ZIP y queda `descarga_borrada.txt`.
// Si el mail no sale, no se borra nada: primero la familia tiene que poder descargarlos.
//
// APAGADO hasta el OK de Joaquín (Naza aprobó el texto del mail el 18/10): se prende con
// BORRADO_AUDIOS_ORIGINALES=1 en Railway. Los chicos de Kids quedan afuera (su sección
// legal todavía no existe).

import type { obtenerClienteDb } from './db.js';
import { armarZip, type ArchivoZip } from './libro/zip.js';
import { subirTexto } from './libro/comun.js';
import { enviarMailBorradoAudios } from './mail/borrado-audios.js';

type Db = ReturnType<typeof obtenerClienteDb>;

export const DIAS_AVISO = 76;
export const DIAS_BORRADO = 90;
export const DIAS_MINIMOS_TRAS_AVISO = 14;
export const DIAS_DESCARGA = 45;
/** Storage de Supabase rechaza archivos muy grandes: los ZIP van en partes de hasta 45 MB. */
export const MAX_BYTES_PARTE = 45 * 1024 * 1024;

export const CANDADO_AVISO = 'aviso_borrado_audios.txt';
export const CANDADO_BORRADO = 'audios_borrados.txt';
export const CANDADO_DESCARGA_BORRADA = 'descarga_borrada.txt';

const MS_DIA = 86_400_000;
const dias = (desde: string | undefined, ahora: Date) =>
  desde ? Math.floor((ahora.getTime() - new Date(desde).getTime()) / MS_DIA) : NaN;

export type Paso = 'nada' | 'avisar' | 'borrar' | 'borrar-descarga';

/** Puro: qué toca hoy, según cuándo se creó cada candado del paquete. */
export function queToca(c: { libroListo?: string; aviso?: string; borrado?: string; descargaBorrada?: string }, ahora: Date): Paso {
  const desdeLibro = dias(c.libroListo, ahora);
  if (!Number.isFinite(desdeLibro)) return 'nada';
  if (c.borrado) {
    return c.aviso && !c.descargaBorrada && dias(c.aviso, ahora) >= DIAS_DESCARGA ? 'borrar-descarga' : 'nada';
  }
  if (!c.aviso) return desdeLibro >= DIAS_AVISO ? 'avisar' : 'nada';
  return desdeLibro >= DIAS_BORRADO && dias(c.aviso, ahora) >= DIAS_MINIMOS_TRAS_AVISO ? 'borrar' : 'nada';
}

/** El día en que se borran, para el mail: a los 90 días del libro, o 14 después del aviso si eso es más tarde. */
export function fechaDeBorrado(libroListo: string, aviso: Date): Date {
  const porLibro = new Date(new Date(libroListo).getTime() + DIAS_BORRADO * MS_DIA);
  const porAviso = new Date(aviso.getTime() + DIAS_MINIMOS_TRAS_AVISO * MS_DIA);
  return porLibro > porAviso ? porLibro : porAviso;
}

export type AudioOriginal = { path: string; orden: number; repregunta: boolean; recibido: string };

/** Los audios que se borran: los de las respuestas. Nunca los recortes de «Su voz» ni el paquete del libro. */
export function soloOriginales(filas: AudioOriginal[], narradorId: string): AudioOriginal[] {
  return filas.filter((f) => f.path && !f.path.startsWith(`${narradorId}/voz/`) && !f.path.startsWith(`${narradorId}/paquete/`));
}

/** El nombre dentro del ZIP: «2026-09-14 pregunta 05.ogg», «… pregunta 05 (repregunta).ogg». */
export function nombreEnZip(a: AudioOriginal, usados: Set<string>): string {
  const ext = (a.path.match(/\.[a-z0-9]{2,4}$/i)?.[0] ?? '.ogg').toLowerCase();
  const base = `${a.recibido.slice(0, 10)} pregunta ${String(a.orden).padStart(2, '0')}${a.repregunta ? ' (repregunta)' : ''}`;
  let nombre = `${base}${ext}`;
  for (let i = 2; usados.has(nombre); i++) nombre = `${base} (${i})${ext}`;
  usados.add(nombre);
  return nombre;
}

/** Puro: reparte los archivos en partes de hasta `max` bytes (un archivo más grande va solo). */
export function enPartes<T extends { datos: Buffer }>(archivos: T[], max = MAX_BYTES_PARTE): T[][] {
  const partes: T[][] = [];
  let actual: T[] = [];
  let tam = 0;
  for (const a of archivos) {
    if (actual.length > 0 && tam + a.datos.length > max) {
      partes.push(actual);
      actual = [];
      tam = 0;
    }
    actual.push(a);
    tam += a.datos.length;
  }
  if (actual.length > 0) partes.push(actual);
  return partes;
}

async function candados(db: Db, narradorId: string): Promise<Map<string, string>> {
  const { data, error } = await db.storage.from('audios').list(`${narradorId}/paquete`);
  if (error) throw new Error(`No se pudo listar el paquete de ${narradorId}: ${error.message}`);
  return new Map((data ?? []).filter((a) => a.created_at).map((a) => [a.name, a.created_at as string]));
}

async function audiosDe(db: Db, narradorId: string): Promise<AudioOriginal[]> {
  const { data, error } = await db
    .from('respuestas')
    .select('audio_path, pregunta_orden, es_repregunta, recibido_at')
    .eq('narrador_id', narradorId)
    .not('audio_path', 'is', null)
    .order('recibido_at');
  if (error) throw new Error(`No se pudieron leer las respuestas de ${narradorId}: ${error.message}`);
  const filas = (data ?? []) as Array<{ audio_path: string; pregunta_orden: number; es_repregunta: boolean; recibido_at: string }>;
  return soloOriginales(
    filas.map((f) => ({ path: f.audio_path, orden: f.pregunta_orden, repregunta: f.es_repregunta, recibido: f.recibido_at })),
    narradorId,
  );
}

async function avisar(db: Db, narradorId: string, libroListo: string, ahora: Date): Promise<boolean> {
  const audios = await audiosDe(db, narradorId);
  if (audios.length === 0) {
    // Respondió todo por texto: no hay nada que descargar ni que borrar.
    await subirTexto(db, `${narradorId}/paquete/${CANDADO_AVISO}`, ahora.toISOString());
    await subirTexto(db, `${narradorId}/paquete/${CANDADO_BORRADO}`, ahora.toISOString());
    return false;
  }

  const usados = new Set<string>();
  const archivos: ArchivoZip[] = [];
  for (const a of audios) {
    const { data, error } = await db.storage.from('audios').download(a.path);
    if (error || !data) {
      console.warn(`audios-originales: falta ${a.path} de ${narradorId}; va sin ese audio.`);
      continue;
    }
    archivos.push({ nombre: nombreEnZip(a, usados), datos: Buffer.from(await data.arrayBuffer()) });
  }

  const enlaces: string[] = [];
  const partes = enPartes(archivos);
  for (const [i, parte] of partes.entries()) {
    const ruta = `${narradorId}/descarga/audios-originales${partes.length > 1 ? `-${i + 1}` : ''}.zip`;
    const { error } = await db.storage.from('audios').upload(ruta, armarZip(parte, ahora), { contentType: 'application/zip', upsert: true });
    if (error) throw new Error(`No se pudo subir ${ruta}: ${error.message}`);
    const firmado = await db.storage.from('audios').createSignedUrl(ruta, DIAS_DESCARGA * 86_400, { download: true });
    if (firmado.error || !firmado.data) throw new Error(`No se pudo firmar ${ruta}: ${firmado.error?.message ?? 'sin datos'}`);
    enlaces.push(firmado.data.signedUrl);
  }

  const { data: narrador, error: e1 } = await db.from('narradores').select('como_le_dicen, familia_id').eq('id', narradorId).single();
  if (e1 || !narrador) throw new Error(`No se pudo leer el narrador ${narradorId}: ${e1?.message ?? 'sin datos'}`);
  const { data: familia, error: e2 } = await db.from('familias').select('email, region').eq('id', (narrador as { familia_id: string }).familia_id).single();
  if (e2 || !familia) throw new Error(`No se pudo leer la familia de ${narradorId}: ${e2?.message ?? 'sin datos'}`);

  const enviado = await enviarMailBorradoAudios({
    para: (familia as { email: string }).email,
    comoLeDicen: (narrador as { como_le_dicen: string }).como_le_dicen,
    fecha: fechaDeBorrado(libroListo, ahora),
    enlaces,
    vos: (familia as { region?: string }).region === 'AR',
  });
  if (enviado) await subirTexto(db, `${narradorId}/paquete/${CANDADO_AVISO}`, ahora.toISOString());
  return enviado;
}

async function borrarEnTandas(db: Db, rutas: string[]): Promise<void> {
  for (let i = 0; i < rutas.length; i += 100) {
    const { error } = await db.storage.from('audios').remove(rutas.slice(i, i + 100));
    if (error) throw new Error(`No se pudieron borrar audios: ${error.message}`);
  }
}

async function borrarOriginales(db: Db, narradorId: string, ahora: Date): Promise<void> {
  const audios = await audiosDe(db, narradorId);
  await borrarEnTandas(db, audios.map((a) => a.path));
  await subirTexto(db, `${narradorId}/paquete/${CANDADO_BORRADO}`, ahora.toISOString());
  console.log(`audios-originales: borrados ${audios.length} audios originales de ${narradorId}.`);
}

async function borrarDescarga(db: Db, narradorId: string, ahora: Date): Promise<void> {
  const { data, error } = await db.storage.from('audios').list(`${narradorId}/descarga`);
  if (error) throw new Error(`No se pudo listar la descarga de ${narradorId}: ${error.message}`);
  await borrarEnTandas(db, (data ?? []).map((a) => `${narradorId}/descarga/${a.name}`));
  await subirTexto(db, `${narradorId}/paquete/${CANDADO_DESCARGA_BORRADA}`, ahora.toISOString());
}

/**
 * La rama del tick. Recorre los narradores con un pedido entregado (sin Kids) y hace
 * lo que toque hoy a cada uno. Un narrador que falla no frena a los demás.
 */
export async function revisarAudiosOriginales(
  db: Db,
  o: { ahora?: Date; env?: NodeJS.ProcessEnv; kids?: Set<string>; candadoLibroListo: string },
): Promise<Record<Paso, number>> {
  const cuenta: Record<Paso, number> = { nada: 0, avisar: 0, borrar: 0, 'borrar-descarga': 0 };
  if ((o.env ?? process.env).BORRADO_AUDIOS_ORIGINALES !== '1') return cuenta;
  const ahora = o.ahora ?? new Date();

  const { data: pedidos, error } = await db.from('pedidos').select('narrador_id').eq('estado', 'entregado');
  if (error) {
    console.error('audios-originales: no se pudieron leer los pedidos entregados:', error.message);
    return cuenta;
  }
  const narradores = new Set(((pedidos ?? []) as { narrador_id: string }[]).map((p) => p.narrador_id));
  for (const narradorId of narradores) {
    if (o.kids?.has(narradorId)) continue;
    try {
      const c = await candados(db, narradorId);
      const libroListo = c.get(o.candadoLibroListo);
      const paso = queToca(
        { libroListo, aviso: c.get(CANDADO_AVISO), borrado: c.get(CANDADO_BORRADO), descargaBorrada: c.get(CANDADO_DESCARGA_BORRADA) },
        ahora,
      );
      if (paso === 'avisar' && libroListo) await avisar(db, narradorId, libroListo, ahora);
      if (paso === 'borrar') await borrarOriginales(db, narradorId, ahora);
      if (paso === 'borrar-descarga') await borrarDescarga(db, narradorId, ahora);
      cuenta[paso]++;
    } catch (err) {
      console.error(`audios-originales: falló ${narradorId}:`, err);
    }
  }
  return cuenta;
}
