// Lee una entrevista V3 de WhatsApp desde la base (entrevistas_v3 + respuestas)
// y la devuelve con el formato que espera de-entrevista.ts ({ficha, familia,
// respuestas, charla}), el mismo del estado.json de la página web y de las
// simulaciones. Spec 2026-10-07, "Fábrica". Genérico: no tiene datos de nadie.
//
// Además del formato: saca la marca de la foto de FO1 (⟦foto⟧, la imagen no
// está en el material), suma lo que estaba contando y no se cerró (si la
// familia cerró antes) y devuelve los audios con su clave V3 (para «Su voz»).
//
// Lo reservado ("esto que no vaya al libro"): el estado no lo contiene (el pase
// no carga lo reservado), y los audios/transcripciones con reserva, entera o de
// tramo, se tratan con las mismas reglas de comun.ts (esPublicable/textoRespuesta).

import type { SupabaseClient } from '@supabase/supabase-js';
import { esPublicable, textoRespuesta } from '../../libro/comun.js';
import { idiomaDe } from '../../v3/entrevista/idioma.js';
import { sumarAudio } from '../../v3/entrevista/respuesta.js';
import type { EstadoEntrevista } from './de-entrevista.js';

/** La misma marca que entrevistador/src/v3/tipos.ts. */
export const MARCA_FOTO = '⟦foto⟧';

export type FilaEntrevistaV3 = {
  narrador_id: string;
  idioma: string;
  ficha: { nombre: string; genero: 'varon' | 'mujer' | 'otro'; formaTrato?: 'masculino' | 'femenino'; quienRegala?: string };
  estado: {
    respuestas: [string, string][];
    familia?: { id: string; texto: string }[];
    charla?: unknown[];
    esperando?: string;
    tocoSi?: boolean;
    borrador?: string;
  };
};

export type AudioV3 = { clave: string; audioPath: string | null; transcripcion: string | null; recibidoAt: string };
export type EntrevistaDeBase = EstadoEntrevista & { audios: AudioV3[] };

type FilaRespuesta = {
  clave_v3: string; audio_path: string | null; transcripcion: string | null; recibido_at: string;
  texto_directo?: string | null; reservada?: boolean | null; reservado_tramo?: string | null;
};

const sinMarcaFoto = (r: string) => r.replace(MARCA_FOTO, '').trim();

export function entrevistaDeFila(fila: FilaEntrevistaV3): EstadoEntrevista {
  const idioma = idiomaDe({ idioma: fila.idioma });
  const f = fila.ficha;
  const ficha = {
    nombre: f.nombre,
    genero: f.genero,
    ...(f.formaTrato ? { formaTrato: f.formaTrato } : {}),
    ...(f.quienRegala ? { quienRegala: f.quienRegala } : {}),
    ...(idioma !== 'es-AR' ? { idioma } : {}),
  };
  const respuestas: [string, string][] = fila.estado.respuestas.map(([k, r]) => [k, sinMarcaFoto(r)]);
  const abierta = sinMarcaFoto(fila.estado.borrador ?? '');
  if (fila.estado.esperando && abierta) {
    const ultima = respuestas.at(-1);
    if (fila.estado.tocoSi && ultima && ultima[0] === fila.estado.esperando) ultima[1] = sumarAudio(ultima[1], abierta);
    else respuestas.push([fila.estado.esperando, abierta]);
  }
  return {
    ficha,
    familia: fila.estado.familia ?? [],
    respuestas,
    charla: (fila.estado.charla ?? []) as NonNullable<EstadoEntrevista['charla']>,
  };
}

export async function leerEntrevistaV3(db: SupabaseClient, narradorId: string): Promise<EntrevistaDeBase | null> {
  const { data, error } = await db.from('entrevistas_v3').select('narrador_id,idioma,ficha,estado').eq('narrador_id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer la entrevista V3 de ${narradorId}: ${error.message}`);
  if (!data) return null;

  const consulta = (campos: string) => db.from('respuestas').select(campos).eq('narrador_id', narradorId).not('clave_v3', 'is', null).order('recibido_at', { ascending: true });
  let res = await consulta('clave_v3,audio_path,transcripcion,texto_directo,recibido_at,reservada,reservado_tramo');
  // Sin la migración de las reservas (columna inexistente) nadie pudo reservar nada.
  if (res.error?.code === '42703') res = await consulta('clave_v3,audio_path,transcripcion,texto_directo,recibido_at');
  if (res.error) throw new Error(`No pude leer las respuestas de ${narradorId}: ${res.error.message}`);

  const audios: AudioV3[] = ((res.data as unknown as FilaRespuesta[] | null) ?? []).map((r) => ({
    clave: r.clave_v3,
    // Un tramo reservado no se recorta de una grabación: el audio queda afuera.
    audioPath: esPublicable(r) ? r.audio_path : null,
    transcripcion: textoRespuesta({ transcripcion: r.transcripcion, texto_directo: r.texto_directo ?? null, reservada: r.reservada, reservado_tramo: r.reservado_tramo }),
    recibidoAt: r.recibido_at,
  }));
  return { ...entrevistaDeFila(data as unknown as FilaEntrevistaV3), audios };
}
