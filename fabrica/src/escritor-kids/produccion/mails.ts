// Los dos mails del libro de Kids al padre (la dueña: `familias.email` del narrador). Los de la casa no sirven tal
// cual: dicen «el libro de tu {como_le_dicen}» (para un chico quedaría «tu Juani»), prometen «sus mejores frases» y
// llevan al tablero de biografías, que no es el panel de Kids.
//
//   revisar      el libro ya está escrito y espera que el padre lo lea y lo apruebe en su panel (decisión 9).
//   libro_listo  el padre lo aprobó: el libro quedó entregado.
//
// Kids hoy es solo es-AR (CONTRATO, kids_v2.idioma): van en vos. Mismo camino que los hitos de la casa (Resend
// directo, mail/hitos.ts); sin clave de Resend devuelven false y el próximo tick reintenta.
import { cargarConfig } from '../../config.js';
import { escaparHtml } from '../../libro/comun.js';
import { TIMEOUT_RESEND_MS } from '../../mail/resend.js';

const REMITENTE = 'Vitácora Familiar <hola@vitacorafamiliar.com>';

export type MailKids = 'revisar' | 'libro_listo';

type Texto = { asunto: (apodo: string) => string; parrafos: (apodo: string) => string[]; boton: string };

export const TEXTOS_MAIL_KIDS: Record<MailKids, Texto> = {
  // APROBADO por Naza 16/10 (tanda 4)
  revisar: {
    asunto: (apodo) => `El libro de ${apodo} está para que lo revises`,
    parrafos: (apodo) => [
      `Ya escribimos el libro de ${apodo} con lo que contó. Entrá a tu panel y leelo.`,
      'Si está bien, aprobalo desde ahí.',
    ],
    boton: 'Ver el libro',
  },
  // APROBADO por Naza 16/10 (tanda 4)
  libro_listo: {
    asunto: (apodo) => `El libro de ${apodo} está listo`,
    parrafos: (apodo) => [
      `Ya está. El libro de ${apodo}, con sus palabras y con sus audios para escuchar desde los códigos del libro.`,
      'Queda en tu panel para leerlo o descargarlo cuando quieras.',
    ],
    boton: 'Ver el libro',
  },
};

export function cuerpoMailKids(mail: MailKids, o: { apodo: string; enlace: string }): string {
  const t = TEXTOS_MAIL_KIDS[mail];
  const filas = t
    .parrafos(escaparHtml(o.apodo))
    .map((p) => `        <tr><td style="padding-bottom:24px;">${p}</td></tr>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,'Times New Roman',serif;color:#14140F;font-size:17px;line-height:1.65;">
${filas}
        <tr><td style="padding-bottom:32px;">
          <a href="${escaparHtml(o.enlace)}" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;letter-spacing:0.02em;">${t.boton}</a>
        </td></tr>
        <tr><td style="border-top:1px solid #e7e5e4;padding-top:20px;font-size:14px;color:#78716c;font-style:italic;">
          En cada familia hay un libro sin escribir.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Devuelve true si Resend lo aceptó. Sin clave, o si falla, false (el próximo tick reintenta). Nunca tira. */
export async function enviarMailKids(mail: MailKids, o: { para: string; apodo: string; enlace: string }): Promise<boolean> {
  try {
    const { resendApiKey } = cargarConfig();
    if (!resendApiKey) return false;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_RESEND_MS),
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: [o.para], subject: TEXTOS_MAIL_KIDS[mail].asunto(o.apodo), html: cuerpoMailKids(mail, o) }),
    });
    if (!r.ok) console.error(`kids: Resend rechazó el mail «${mail}» (${r.status}).`);
    return r.ok;
  } catch (err) {
    console.error(`kids: no salió el mail «${mail}»: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
