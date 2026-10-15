// El candado de la entrevista V3 (spec 2026-10-07, "Fábrica"): un narrador
// con fila en `entrevistas_v3` contestó el banco nuevo, que el libro viejo no
// sabe leer (sus `respuestas.pregunta_orden` son números de llegada). La
// fábrica no le arma nada viejo —anticipo, estructura, previsualización ni
// paquete— y avisa a los socios una vez. El escritor V3 lo enchufa el chat del
// escritor (docs/v5/escritor-fabrica/).

import type { SupabaseClient } from '@supabase/supabase-js';
import { cargarConfig } from '../config.js';
import { TIMEOUT_RESEND_MS } from '../mail/resend.js';
import { descargarTextoOpcional, subirTexto } from '../libro/comun.js';

export const CANDADO_AVISO_V3 = 'v3_candado_avisado.txt';
const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';

function esTablaAusente(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message ?? '');
}

/** Los narradores con entrevista V3. Sin la tabla (migración sin aplicar), ninguno; con otro error, tira. */
export async function narradoresConV3(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from('entrevistas_v3').select('narrador_id');
  if (error) {
    if (esTablaAusente(error)) return new Set();
    throw new Error(`No pude leer entrevistas_v3: ${error.message}`);
  }
  return new Set(((data as { narrador_id: string }[] | null) ?? []).map((f) => f.narrador_id));
}

/**
 * El idioma de la entrevista de cada narrador V3 (es-AR, es-ES, ca). Sin la tabla, vacío; con otro error,
 * tira: quien llama no puede tratar a un narrador V3 como viejo por no haber podido leer.
 */
export async function idiomasV3(db: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await db.from('entrevistas_v3').select('narrador_id, idioma');
  if (error) {
    if (esTablaAusente(error)) return new Map();
    throw new Error(`No pude leer entrevistas_v3: ${error.message}`);
  }
  return new Map(((data as { narrador_id: string; idioma: string | null }[] | null) ?? []).map((f) => [f.narrador_id, f.idioma ?? 'es-AR']));
}

export class NarradorV3Error extends Error {
  constructor(readonly narradorId: string, donde: string) {
    super(`${donde}: ${narradorId} tiene entrevista V3; el libro viejo no se arma (spec 2026-10-07).`);
    this.name = 'NarradorV3Error';
  }
}

export async function exigirSinV3(db: SupabaseClient, narradorId: string, donde: string): Promise<void> {
  const { data, error } = await db.from('entrevistas_v3').select('narrador_id').eq('narrador_id', narradorId).maybeSingle();
  if (error) {
    if (esTablaAusente(error)) return;
    throw new Error(`${donde}: no pude saber si ${narradorId} tiene entrevista V3: ${error.message}`);
  }
  if (data) throw new NarradorV3Error(narradorId, donde);
}

/** Avisa a los socios (MAIL_SOCIOS) una vez por narrador; el candado queda solo si el mail salió (o si no hay a quién mandarlo). Nunca tira. */
export async function avisarCandadoV3(db: SupabaseClient, narradorId: string, donde: string, o: { fetch?: typeof fetch } = {}): Promise<void> {
  try {
    const ruta = `${narradorId}/paquete/${CANDADO_AVISO_V3}`;
    if ((await descargarTextoOpcional(db, ruta)) !== null) return;
    const detalle = `${narradorId} tiene entrevista V3. La fábrica saltea ${donde} y todo lo del libro viejo; el libro V3 lo enchufa el chat del escritor (docs/v5/escritor-fabrica/).`;
    console.warn(`candado V3: ${detalle}`);
    const { resendApiKey } = cargarConfig();
    const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (resendApiKey && para.length > 0) {
      const r = await (o.fetch ?? fetch)('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(TIMEOUT_RESEND_MS),
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: REMITENTE, to: para, subject: `[Vitácora V3] La fábrica no arma el libro viejo de ${narradorId}`, text: detalle }),
      });
      if (!r.ok) {
        console.error(`candado V3: Resend rechazó el aviso de ${narradorId} (${r.status}); se reintenta el próximo tick.`);
        return;
      }
    }
    await subirTexto(db, ruta, new Date().toISOString(), 'text/plain');
  } catch (err) {
    console.error(`candado V3: no pude avisar por ${narradorId}:`, err instanceof Error ? err.message : err);
  }
}
