// Privacidad del panel en la fábrica (Naza y Joaquín, 05/11; CONTRATO, «Lo contado es privado»). La misma regla que
// loContadoEsPrivado de la web (web/src/lib/panel.ts): en Familiar y en una historia, si el libro es para otra persona,
// quien regala no ve lo contado. Viaje y Kids siguen igual, y «para mí» no cambia. Sin vínculo cargado, cuenta como regalo.
//
// Acá viven las dos esperas por quien contó: 48 horas desde su último mensaje para sacar lo que quiera y 72 para
// contestar las dudas (Naza, 06/11: todas las dudas de un regalo van a quien contó). Las dos tienen fin aunque nadie
// escriba nada: un mensaje que no salió nunca traba un libro.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Almacen } from '../almacen/tipos.js';

type Db = SupabaseClient;

export function esPrivado(contexto: unknown): boolean {
  const c = contexto as { modo?: unknown; vinculoComprador?: unknown } | null | undefined;
  if (c?.modo === 'viaje' || c?.modo === 'kids') return false;
  return c?.vinculoComprador !== 'yo mismo';
}

// ---------------------------------------------------------------- las 48 horas del narrador

/** Lo que tiene el narrador, desde su último mensaje, para sacar algo del libro. La web usa el mismo número. */
export const HORAS_PARA_SACAR = 48;
const MS_PARA_SACAR = HORAS_PARA_SACAR * 60 * 60 * 1000;

/** Hasta cuándo puede sacar algo. Null si no es privado o si todavía no contó nada. */
export function plazoParaSacar(n: { contexto?: unknown; ultima_respuesta_at?: string | null }): number | null {
  if (!esPrivado(n.contexto) || !n.ultima_respuesta_at) return null;
  const t = Date.parse(n.ultima_respuesta_at);
  return Number.isFinite(t) ? t + MS_PARA_SACAR : null;
}

/** Cuántos ms faltan para que el libro se pueda escribir (0 = ya). Si la base falla, tira: quien llama reintenta. */
export async function esperaPorElNarrador(db: Db, narradorId: string, ahora: number = Date.now()): Promise<number> {
  const { data, error } = await db.from('narradores').select('contexto, ultima_respuesta_at').eq('id', narradorId).maybeSingle();
  if (error) throw new Error(`No pude leer al narrador ${narradorId}: ${error.message}`);
  const plazo = plazoParaSacar((data as { contexto?: unknown; ultima_respuesta_at?: string | null } | null) ?? {});
  return plazo === null ? 0 : Math.max(0, plazo - ahora);
}

// ---------------------------------------------------------------- las esperas

/** ISO, lo escribe el entrevistador: salió el aviso de las dudas. Vacío: una Etapa A rehecha lo dejó sin valor (CONTRATO). */
export const DUDAS_NARRADOR_AVISADAS = 'dudas-narrador-avisadas.txt';
const MS_PLAZO_DUDAS = 72 * 60 * 60 * 1000;
const MS_VOLVER_A_MIRAR = 15 * 60 * 1000;

/**
 * Cuánto tarda en volver a reclamarse un pedido que espera: poco, porque lo que lo libera llega de afuera (la última
 * respuesta a las dudas) y el libro tiene que seguir enseguida, no al vencer el plazo.
 */
export const volverAMirarEn = (espera: number): number => Math.min(espera, MS_VOLVER_A_MIRAR);

const fecha = (texto: string | null): number | null => {
  const f = Date.parse(texto?.trim() ?? '');
  return Number.isFinite(f) ? f : null;
};

/**
 * Cuántos ms faltan del plazo de las dudas: desde dudas-narrador-avisadas.txt o, si nunca salió, desde `desdeRespaldo`
 * (el ISO de dudas-avisadas.txt, el mail a los socios). Sin ninguna de las dos, el plazo entero. Una fecha del futuro no lo alarga.
 */
export async function restaPlazoDudas(almacen: Almacen, desdeRespaldo: string | null, ahora: number = Date.now()): Promise<number> {
  const desde = fecha(await almacen.leer(DUDAS_NARRADOR_AVISADAS)) ?? fecha(desdeRespaldo) ?? ahora;
  return Math.max(0, Math.min(MS_PLAZO_DUDAS, desde + MS_PLAZO_DUDAS - ahora));
}
