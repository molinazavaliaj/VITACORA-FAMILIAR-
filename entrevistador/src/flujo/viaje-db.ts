import { randomUUID } from 'node:crypto';
import { db } from '../db/cliente.js';
import { descargarAudio } from '../whatsapp/media.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { guionDelViaje, diaDeHoy, etapaDeFecha, fechaDelDia, viajeDe, SIN_ETAPA } from './viaje.js';
import type { Narrador } from './preguntar.js';

// Vitácora de viaje: lo que toca la base. Lo puro está en viaje.ts.

/** Al aceptar (SÍ): el guion entero, una pregunta por día. Si ya tiene, no duplica. */
export async function crearGuionDelViaje(n: Narrador): Promise<void> {
  const { data } = await db.from('preguntas').select('id').eq('narrador_id', n.id).limit(1);
  if ((data?.length ?? 0) > 0) return;
  const filas = guionDelViaje(viajeDe(n.contexto)).map((p) => ({ narrador_id: n.id, ...p, tipo: 'fija' }));
  const { error } = await db.from('preguntas').insert(filas);
  if (error) throw new Error(`No pude crear el guion del viaje de ${n.id}: ${error.message}`);
}

/**
 * Una foto que llega por WhatsApp: al álbum del día (la etapa vigente), con lo
 * que escribió abajo como epígrafe. Se guarda el original. La primera del día
 * no se marca principal: eso lo decide la familia en Encargar libro.
 */
export async function guardarFotoEntrante(n: Narrador, mediaId: string, mimeType: string | undefined, caption: string | undefined): Promise<string> {
  const viaje = viajeDe(n.contexto);
  const dia = diaDeHoy(viaje, new Date(), n.zona_horaria) ?? Math.max(1, n.dia_actual);
  const capitulo = etapaDeFecha(viaje, fechaDelDia(viaje, dia));
  const bytes = await descargarAudio(mediaId); // baja cualquier media de Meta, no solo audio
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const id = randomUUID();
  const path = `${n.id}/fotos/${id}.${ext}`;
  const { error: errorSubida } = await db.storage.from('audios').upload(path, bytes, { contentType: mimeType ?? 'image/jpeg', upsert: false });
  if (errorSubida) throw new Error(`No pude subir la foto de ${n.id}: ${errorSubida.message}`);
  const { error } = await db.from('fotos').insert({
    id, narrador_id: n.id, capitulo: capitulo === SIN_ETAPA ? null : capitulo, storage_path: path,
    epigrafe: caption?.trim().slice(0, 300) || null, principal: false, subida_por: null,
  });
  if (error) {
    await db.storage.from('audios').remove([path]);
    throw new Error(`No pude anotar la foto de ${n.id}: ${error.message}`);
  }
  return capitulo;
}

/** La confirmación de la foto, corta, en vos. */
export async function confirmarFoto(n: Narrador, capitulo: string): Promise<void> {
  const donde = capitulo === SIN_ETAPA ? 'en tu álbum' : `en ${capitulo}`;
  await enviarTexto(n.telefono_whatsapp, `📷 Guardada ${donde}. Si querés, contame qué pasaba ahí.`);
}
