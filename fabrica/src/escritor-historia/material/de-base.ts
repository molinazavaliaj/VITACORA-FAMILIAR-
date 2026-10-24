// Lee una historia desde la base (historias + respuestas) y la devuelve como EntrevistaHistoria, lista para el
// escritor. Mismo molde que escritor/material/de-base.ts (leerEntrevistaV3), que no se toca: la verdad es
// `historias.estado.respuestas` (con lo abierto del borrador sumado), y encima se aplica
//   - lo reservado («esto que no vaya al libro»): las claves de `estado.reservadas` y las filas con
//     `respuestas.reservada` o `reservado_tramo`, con su repregunta (RP~X comparte la reserva de X);
//   - lo que la familia destildó al cerrar (`narradores.edicion.excluidas`), como reservado entero;
//   - lo que la dueña sacó desde el panel (`respuestas_fuera`), por fila (sinLoSacado de Familiar).
// Las filas con `clave_historia` '∅' se ignoran. No escribe nada.
import type { SupabaseClient } from '@supabase/supabase-js';
import { sinLoSacado } from '../../escritor/material/de-base.js';
import { esPublicable, textoRespuesta } from '../../libro/comun.js';
import type { PreguntaPanel } from '../../historia/entrevista/flujo.js';
import { idiomaDe } from '../../historia/entrevista/idioma.js';
import { sumarAudio } from '../../historia/entrevista/respuesta.js';
import { MARCA_FOTO } from './filas.js';
import type { EntrevistaHistoria, FichaHistoriaFila, GloboHistoria } from './tipos.js';

/** `respuestas.clave_historia` de una fila que quedó afuera a propósito (CONTRATO). */
export const SIN_CLAVE_HISTORIA = '∅';

export type FilaHistoriaBase = {
  narrador_id: string;
  idioma: string;
  ficha: FichaHistoriaFila;
  estado: {
    respuestas: [string, string][];
    charla?: GloboHistoria[];
    propias?: string[];
    panel?: PreguntaPanel[];
    esperando?: string;
    borrador?: string;
    reservadas?: string[];
  };
};

type FilaRespuesta = {
  id: string; clave_historia: string; transcripcion: string | null; texto_directo?: string | null;
  audio_path?: string | null; reservada?: boolean | null; reservado_tramo?: string | null;
};

/** Un audio de la entrevista, para «Su voz» (el worker de audio corta la frase de esa fila). Como AudioV3. */
export type AudioHistoria = { respuestaId: string; clave: string; audioPath: string | null; transcripcion: string | null };
type Reserva = { total: boolean; tramos: string[] };

const claveMadre = (k: string): string => (k.startsWith('RP~') ? k.slice(3) : k);

function reservasPorClave(filas: FilaRespuesta[]): Map<string, Reserva> {
  const m = new Map<string, Reserva>();
  for (const r of filas) {
    const tramo = typeof r.reservado_tramo === 'string' ? r.reservado_tramo.trim() : '';
    if (!tramo && r.reservada !== true) continue;
    const e = m.get(r.clave_historia) ?? { total: false, tramos: [] };
    if (tramo) e.tramos.push(tramo); else e.total = true;
    m.set(r.clave_historia, e);
  }
  return m;
}

function juntar(propia: Reserva | undefined, madre: Reserva | undefined): Reserva | undefined {
  if (!propia || !madre) return propia ?? madre;
  return { total: propia.total || madre.total, tramos: [...propia.tramos, ...madre.tramos] };
}

/** El texto sin lo reservado, o null si no queda nada (un tramo que no está textual reserva todo: ante la duda, más). */
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

const MARCAS = /⟦[^⟧]*⟧/g;
const normal = (t: string): string => t.replace(/\s+/g, ' ').trim();
const textoDeFila = (r: Pick<FilaRespuesta, 'transcripcion' | 'texto_directo'>): string => normal((r.transcripcion ?? r.texto_directo ?? '').replace(MARCAS, ' '));

/** La entrevista de la fila, con lo abierto del borrador sumado a su clave. Sin los globos 'persona'. */
export function entrevistaDeFilaHistoria(fila: FilaHistoriaBase): EntrevistaHistoria {
  const respuestas: [string, string][] = fila.estado.respuestas.map(([k, r]) => [k, r]);
  const abierta = (fila.estado.borrador ?? '').trim();
  if (fila.estado.esperando && abierta && abierta !== MARCA_FOTO) {
    const ultima = respuestas.at(-1);
    if (ultima && ultima[0] === fila.estado.esperando) ultima[1] = sumarAudio(ultima[1], abierta);
    else respuestas.push([fila.estado.esperando, abierta]);
  }
  return {
    ficha: fila.ficha,
    idioma: idiomaDe({ idioma: fila.idioma }),
    respuestas,
    charla: (fila.estado.charla ?? []).filter((g) => g.de !== 'persona'),
    propias: fila.estado.propias ?? [],
    panel: fila.estado.panel ?? [],
  };
}

/** Aplica lo sacado (por fila) y después lo reservado (por clave) a las respuestas ya armadas. */
export function limpiarEntrevista(e: EntrevistaHistoria, filas: FilaRespuesta[], fuera: Set<string>, reservadasEnEstado: Set<string>): EntrevistaHistoria {
  const marcadas = filas.map((r) => (reservadasEnEstado.has(claveMadre(r.clave_historia)) ? { ...r, reservada: true, reservado_tramo: null } : r));
  const reservas = reservasPorClave(marcadas);
  for (const k of reservadasEnEstado) reservas.set(k, { total: true, tramos: [] });
  const de = (k: string) => juntar(reservas.get(k), k === claveMadre(k) ? undefined : reservas.get(claveMadre(k)));
  const respuestas: [string, string][] = [];
  for (const [k, texto] of e.respuestas) {
    const propias = filas.filter((r) => r.clave_historia === k).map((r) => ({ texto: textoDeFila(r), fuera: fuera.has(r.id) }));
    const sinSacado = fuera.size ? sinLoSacado(texto, propias) : texto;
    const limpio = sinSacado === null ? null : sinReserva(sinSacado, de(k));
    if (limpio !== null) respuestas.push([k, limpio]);
  }
  return { ...e, respuestas };
}

const excluidasDe = (edicion: unknown): string[] => {
  const lista = edicion && typeof edicion === 'object' ? (edicion as { excluidas?: unknown }).excluidas : undefined;
  return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : [];
};

async function idsFuera(db: SupabaseClient, narradorId: string): Promise<Set<string>> {
  const { data, error } = await db.from('respuestas_fuera').select('respuesta_id').eq('narrador_id', narradorId);
  if (error?.code === '42P01' || error?.code === 'PGRST205') return new Set();
  if (error) throw new Error(`No pude leer las respuestas sacadas de ${narradorId}: ${error.message}`);
  return new Set(((data as { respuesta_id: string }[] | null) ?? []).map((r) => r.respuesta_id));
}

export async function leerEntrevistaHistoria(db: SupabaseClient, narradorId: string): Promise<{ entrevista: EntrevistaHistoria; audios: AudioHistoria[] } | null> {
  const h = await db.from('historias').select('narrador_id,idioma,ficha,estado').eq('narrador_id', narradorId).maybeSingle();
  if (h.error) throw new Error(`No pude leer la historia de ${narradorId}: ${h.error.message}`);
  if (!h.data) return null;
  const fila = h.data as unknown as FilaHistoriaBase;

  const consulta = (campos: string) => db.from('respuestas').select(campos).eq('narrador_id', narradorId).not('clave_historia', 'is', null).order('recibido_at', { ascending: true });
  let res = await consulta('id,clave_historia,audio_path,transcripcion,texto_directo,reservada,reservado_tramo');
  // Sin la migración de las reservas (columna inexistente) nadie pudo reservar nada.
  if (res.error?.code === '42703') res = await consulta('id,clave_historia,audio_path,transcripcion,texto_directo');
  if (res.error) throw new Error(`No pude leer las respuestas de ${narradorId}: ${res.error.message}`);
  const filas = ((res.data as unknown as FilaRespuesta[] | null) ?? []).filter((r) => r.clave_historia !== SIN_CLAVE_HISTORIA);

  const nar = await db.from('narradores').select('edicion').eq('id', narradorId).maybeSingle();
  if (nar.error) throw new Error(`No pude leer la edición de ${narradorId}: ${nar.error.message}`);
  const excluidas = new Set(excluidasDe((nar.data as { edicion?: unknown } | null)?.edicion));
  const reservadas = new Set(fila.estado.reservadas ?? []);
  for (const r of filas) if (excluidas.has(r.id)) reservadas.add(claveMadre(r.clave_historia));

  const fuera = await idsFuera(db, narradorId);
  const reservada = (r: FilaRespuesta): boolean => reservadas.has(claveMadre(r.clave_historia));
  // Un tramo reservado no se recorta de una grabación: el audio queda afuera. Una fila sacada, también.
  const audios: AudioHistoria[] = filas.map((r) => ({
    respuestaId: r.id,
    clave: r.clave_historia,
    audioPath: esPublicable(r) && !reservada(r) && !fuera.has(r.id) ? r.audio_path ?? null : null,
    transcripcion: fuera.has(r.id) || reservada(r) ? null : textoRespuesta({ transcripcion: r.transcripcion, texto_directo: r.texto_directo ?? null, reservada: r.reservada, reservado_tramo: r.reservado_tramo }),
  }));
  return { entrevista: limpiarEntrevista(entrevistaDeFilaHistoria(fila), filas, fuera, reservadas), audios };
}
