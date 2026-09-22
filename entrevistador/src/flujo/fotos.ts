import { randomUUID } from 'node:crypto';
import { db } from '../db/cliente.js';
import { descargarAudio } from '../whatsapp/media.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { preguntaDeOrden } from '../db/guion.js';
import { tratoDe, type Trato } from '../ia/trato.js';
import type { Narrador } from './preguntar.js';

/*
 * Las fotos que llegan por WhatsApp.
 *
 * Hasta el 22/09 esto vivía entero en `viaje-db.ts` y `procesar.ts` tiraba a la
 * basura, en silencio, cualquier foto de un narrador del Familiar. Una señora
 * que manda la foto de su casamiento no recibía ni un acuse: el bot se hacía el
 * distraído. Acá queda lo común a los dos productos; lo que cambia entre ellos
 * es de qué capítulo es la foto, y eso lo decide cada uno.
 */

/** La extensión según lo que dijo Meta. Todo lo que no reconocemos se guarda como jpg. */
export function extensionDe(mimeType: string | undefined): string {
  return mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
}

/** El epígrafe: lo que escribió abajo de la foto, recortado. Vacío = null. */
export function epigrafeDe(caption: string | undefined): string | null {
  return caption?.trim().slice(0, 300) || null;
}

/**
 * Baja la foto de Meta, la sube al storage y la anota en `fotos`.
 *
 * `capitulo` null = todavía no sabemos de qué capítulo es (el viaje antes de la
 * primera etapa, el Familiar antes de la primera pregunta). La familia lo
 * acomoda desde el panel. Nunca se marca `principal`: esa la elige ella.
 *
 * Si la anotación falla se borra el archivo: una foto en el storage que no está
 * en la tabla no la ve nadie y ocupa lugar para siempre.
 */
export async function guardarFoto(
  n: Narrador, mediaId: string, mimeType: string | undefined, caption: string | undefined, capitulo: string | null,
): Promise<void> {
  const bytes = await descargarAudio(mediaId); // baja cualquier media de Meta, no solo audio
  const id = randomUUID();
  const path = `${n.id}/fotos/${id}.${extensionDe(mimeType)}`;
  const { error: errorSubida } = await db.storage.from('audios')
    .upload(path, bytes, { contentType: mimeType ?? 'image/jpeg', upsert: false });
  if (errorSubida) throw new Error(`No pude subir la foto de ${n.id}: ${errorSubida.message}`);
  const { error } = await db.from('fotos').insert({
    id, narrador_id: n.id, capitulo, storage_path: path,
    epigrafe: epigrafeDe(caption), principal: false, subida_por: null,
  });
  if (error) {
    await db.storage.from('audios').remove([path]);
    throw new Error(`No pude anotar la foto de ${n.id}: ${error.message}`);
  }
}

/**
 * Vitácora Familiar: la foto es del capítulo de la pregunta que está
 * contestando. Es lo más probable y lo único que podemos saber sin adivinar:
 * si está hablando de la infancia, la foto que manda es de la infancia.
 */
export async function capituloVigente(n: Narrador): Promise<string | null> {
  if (n.dia_actual < 1) return null;
  return (await preguntaDeOrden(n.id, n.dia_actual))?.capitulo ?? null;
}

/** El acuse de la foto, corto. ⚠️ Texto a revisar por Naza (22/09). */
export function textoFotoGuardada(trato: Trato): string {
  return trato === 'vos'
    ? '📷 Guardada. Si querés, contame qué pasaba ahí.'
    : '📷 Guardada. Si quiere, cuénteme qué pasaba ahí.';
}

/** Una foto de un narrador del Familiar: se guarda en su capítulo y se acusa recibo. */
export async function recibirFotoFamiliar(
  n: Narrador, mediaId: string, mimeType: string | undefined, caption: string | undefined,
): Promise<void> {
  await guardarFoto(n, mediaId, mimeType, caption, await capituloVigente(n));
  await enviarTexto(n.telefono_whatsapp, textoFotoGuardada(await tratoDe(n)));
}
