// Aviso a los socios (spec 2026-10-07: plantilla que falta, 3 fallos de envío,
// alta frenada sin género). No existía un canal: va a la consola de Railway y,
// si están RESEND_API_KEY y MAIL_SOCIOS (separados por coma), por mail. Una vez
// por clave y por día (en memoria: tras un reinicio puede repetirse una vez).
// Nunca tira: un aviso no puede frenar la entrevista. Es un mail interno, no un
// texto para el narrador.

const REMITENTE = process.env.MAIL_FROM ?? 'Vitácora Familiar <hola@vitacorafamiliar.com>';
const YA_AVISADO = new Set<string>();

export function olvidarAvisos(): void {
  YA_AVISADO.clear();
}

export async function avisarSocios(
  clave: string, asunto: string, detalle: string,
  o: { ahora?: Date; fetch?: typeof fetch } = {},
): Promise<boolean> {
  const dia = (o.ahora ?? new Date()).toISOString().slice(0, 10);
  const llave = `${clave}|${dia}`;
  if (YA_AVISADO.has(llave)) return false;
  YA_AVISADO.add(llave);
  console.error(`AVISO A LOS SOCIOS [${clave}]: ${asunto} — ${detalle}`);
  const claveResend = process.env.RESEND_API_KEY;
  const para = (process.env.MAIL_SOCIOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!claveResend || para.length === 0) {
    console.warn('avisos: falta RESEND_API_KEY o MAIL_SOCIOS; el aviso quedó solo en la consola.');
    return true;
  }
  try {
    const r = await (o.fetch ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${claveResend}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: para, subject: `[Vitácora V3] ${asunto}`, text: detalle }),
    });
    if (!r.ok) console.error(`avisos: Resend rechazó el aviso «${asunto}» (${r.status}).`);
  } catch (err) {
    console.error(`avisos: no pude mandar el aviso «${asunto}» por mail:`, err instanceof Error ? err.message : err);
  }
  return true;
}
