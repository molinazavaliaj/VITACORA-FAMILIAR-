// Mails a los socios (MAIL_SOCIOS) desde el escritor en producción: una Etapa A que no pasó sus controles,
// las dudas de datos que salieron de la Etapa A, un libro que no se pudo escribir. Son internos: no los ve
// ninguna familia. Mismo camino que el aviso del candado V3 (v3/candado.ts): Resend directo.
import type { SupabaseClient } from '@supabase/supabase-js';
import { cargarConfig } from '../../config.js';
import { TIMEOUT_RESEND_MS } from '../../mail/resend.js';

const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';

/**
 * La clave de Resend. Si falta otra variable obligatoria, cargarConfig tira; el aviso
 * igual tiene que poder salir (es justo el que avisa que falta algo, variables.ts).
 */
function claveResend(): string | null {
  try {
    return cargarConfig().resendApiKey;
  } catch {
    return process.env.RESEND_API_KEY?.trim() || null;
  }
}

/**
 * Devuelve true si el mail salió o si no hay a quién mandarlo (sin MAIL_SOCIOS o sin clave de Resend:
 * se loguea y no se insiste). Devuelve false si Resend lo rechazó o la red falló: quien llama decide si
 * reintenta. Nunca tira.
 */
/** ¿Hay a quién mandarle los avisos? (MAIL_SOCIOS y la clave de Resend). */
export function hayAQuienAvisar(): boolean {
  try {
    const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return Boolean(claveResend()) && para.length > 0;
  } catch {
    return false;
  }
}

/** Lo que queda en `avisos` para verlo en /admin/notificaciones (02/11). */
export type FilaAviso = { asunto: string; detalle: string; salio_mail: boolean | null };
let registro: ((fila: FilaAviso) => Promise<void>) | null = null;

/** Lo configura el worker al arrancar. Sin él (tests, scripts), el aviso no queda en la tabla. */
export function usarRegistroDeAvisos(r: ((fila: FilaAviso) => Promise<void>) | null): void {
  registro = r;
}

/** Una fila en `avisos` por cada aviso a los socios. Nunca tira. */
export function registroEnTabla(db: Pick<SupabaseClient, 'from'>): (fila: FilaAviso) => Promise<void> {
  return async (fila) => {
    try {
      const { error } = await db.from('avisos').insert({ servicio: 'fabrica', ...fila });
      if (error) console.warn(`aviso a socios: no quedó en el panel "${fila.asunto}" (${error.message}).`);
    } catch (err) {
      console.warn(`aviso a socios: no quedó en el panel "${fila.asunto}": ${err instanceof Error ? err.message : String(err)}`);
    }
  };
}

/** Anota el aviso en el panel (lo usa también el candado V3, que manda su propio mail). Nunca tira. */
export async function anotarAvisoEnPanel(fila: FilaAviso): Promise<void> {
  try {
    await registro?.(fila);
  } catch {
    // el registro ya no tira; esto es por si alguien enchufa uno que sí
  }
}

export async function avisarSocios(asunto: string, texto: string, o: { fetch?: typeof fetch } = {}): Promise<boolean> {
  let salio: boolean | null = false;
  try {
    console.warn(`aviso a socios: ${asunto}`);
    const resendApiKey = claveResend();
    const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!resendApiKey || para.length === 0) {
      salio = null;
      return true;
    }
    const r = await (o.fetch ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_RESEND_MS),
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: para, subject: `[Vitácora escritor] ${asunto}`, text: texto }),
    });
    if (!r.ok) {
      console.error(`aviso a socios: Resend rechazó "${asunto}" (${r.status}).`);
      return false;
    }
    salio = true;
    return true;
  } catch (err) {
    console.error(`aviso a socios: no salió "${asunto}": ${err instanceof Error ? err.message : String(err)}`);
    return false;
  } finally {
    // El panel lo ve aunque el mail no salga: justamente ahí es cuando más hace falta.
    await anotarAvisoEnPanel({ asunto, detalle: texto, salio_mail: salio });
  }
}
