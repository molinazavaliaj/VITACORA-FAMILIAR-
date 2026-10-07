// Lee una entrevista V3 de WhatsApp desde la base (entrevistas_v3 + respuestas)
// y la devuelve con el formato que espera de-entrevista.ts ({ficha, familia,
// respuestas, charla}), el mismo del estado.json de la página web y de las
// simulaciones. Spec 2026-10-07, "Fábrica". Genérico: no tiene datos de nadie.
//
// Además del formato: saca la marca de la foto de FO1 (⟦foto⟧, la imagen no
// está en el material), suma lo que estaba contando y no se cerró (si la
// familia cerró antes) y devuelve los audios con su clave V3 (para «Su voz»).
//
// Lo reservado ("esto que no vaya al libro"): el pase no carga lo reservado
// de antes, pero una reserva hecha DESPUÉS (a mano en `respuestas`, ver
// CONTRATO) no llega al estado, que ya sumó el texto. Por eso leerEntrevistaV3
// la aplica sobre estado.respuestas y el borrador, y sobre audios[], con las
// reglas de comun.ts (esPublicable/textoRespuesta). Ante la duda, se reserva más.

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

type Reserva = { total: boolean; tramos: string[] };

/** La clave "madre" de una repregunta (RP~X) o segunda oportunidad (X~2): comparten la reserva de X. */
const claveMadre = (k: string) => (k.startsWith('RP~') ? k.slice(3) : k.replace(/~\d+$/, ''));

function reservasPorClave(filas: FilaRespuesta[]): Map<string, Reserva> {
  const m = new Map<string, Reserva>();
  for (const r of filas) {
    const tramo = typeof r.reservado_tramo === 'string' ? r.reservado_tramo.trim() : '';
    if (!tramo && r.reservada !== true) continue;
    const e = m.get(r.clave_v3) ?? { total: false, tramos: [] };
    if (tramo) e.tramos.push(tramo); else e.total = true;
    m.set(r.clave_v3, e);
  }
  return m;
}

/** La reserva de la clave sumada a la de su madre: entera si alguna lo es; si no, los tramos de las dos. */
function juntar(propia: Reserva | undefined, madre: Reserva | undefined): Reserva | undefined {
  if (!propia || !madre) return propia ?? madre;
  return { total: propia.total || madre.total, tramos: [...propia.tramos, ...madre.tramos] };
}

/** El texto sin lo reservado, o null si no queda nada publicable (tramo que no está textual: se reserva todo). */
function sinReserva(texto: string, r: Reserva | undefined): string | null {
  if (!r) return texto;
  if (r.total) return null;
  let t = texto;
  for (const tramo of r.tramos) {
    if (!t.includes(tramo)) return null;
    t = t.split(tramo).join(' ');
  }
  t = t.replace(/\s+/g, ' ').trim();
  return t === '' ? null : t;
}

/** Aplica las reservas al texto ya armado (incluye el borrador, que entrevistaDeFila suma bajo `esperando`). */
function aplicarReservas(e: EstadoEntrevista, reservas: Map<string, Reserva>): EstadoEntrevista {
  if (reservas.size === 0) return e;
  const de = (k: string) => juntar(reservas.get(k), k === claveMadre(k) ? undefined : reservas.get(claveMadre(k)));
  const respuestas: [string, string][] = [];
  for (const [k, texto] of e.respuestas) {
    const limpio = sinReserva(texto, de(k));
    if (limpio !== null) respuestas.push([k, limpio]);
  }
  return { ...e, respuestas };
}

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
    // Sin los globos 'persona' (lo que dijo el narrador): de-entrevista.ts solo lee 'bio' y 'bloque',
    // y la reserva se aplica sobre `respuestas`, no acá. Así lo reservado no viaja en la charla.
    charla: ((fila.estado.charla ?? []) as NonNullable<EstadoEntrevista['charla']>).filter((g) => g.de !== 'persona'),
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

  const filasResp = (res.data as unknown as FilaRespuesta[] | null) ?? [];
  const audios: AudioV3[] = filasResp.map((r) => ({
    clave: r.clave_v3,
    // Un tramo reservado no se recorta de una grabación: el audio queda afuera.
    audioPath: esPublicable(r) ? r.audio_path : null,
    transcripcion: textoRespuesta({ transcripcion: r.transcripcion, texto_directo: r.texto_directo ?? null, reservada: r.reservada, reservado_tramo: r.reservado_tramo }),
    recibidoAt: r.recibido_at,
  }));
  return { ...aplicarReservas(entrevistaDeFila(data as unknown as FilaEntrevistaV3), reservasPorClave(filasResp)), audios };
}
