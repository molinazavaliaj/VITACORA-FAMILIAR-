// Mails a los socios (MAIL_SOCIOS) desde el escritor en producción: una Etapa A que no pasó sus controles,
// las dudas de datos que salieron de la Etapa A, un libro que no se pudo escribir. Son internos: no los ve
// ninguna familia. Mismo camino que el aviso del candado V3 (v3/candado.ts): Resend directo.
import { cargarConfig } from '../../config.js';

const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';

/**
 * Devuelve true si el mail salió o si no hay a quién mandarlo (sin MAIL_SOCIOS o sin clave de Resend:
 * se loguea y no se insiste). Devuelve false si Resend lo rechazó o la red falló: quien llama decide si
 * reintenta. Nunca tira.
 */
export async function avisarSocios(asunto: string, texto: string, o: { fetch?: typeof fetch } = {}): Promise<boolean> {
  try {
    console.warn(`aviso a socios: ${asunto}`);
    const { resendApiKey } = cargarConfig();
    const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!resendApiKey || para.length === 0) return true;
    const r = await (o.fetch ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: para, subject: `[Vitácora escritor] ${asunto}`, text: texto }),
    });
    if (!r.ok) {
      console.error(`aviso a socios: Resend rechazó "${asunto}" (${r.status}).`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`aviso a socios: no salió "${asunto}": ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
