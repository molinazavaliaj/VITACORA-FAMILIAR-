// Los dos mails del libro de Kids al padre (la dueña: `familias.email` del narrador). Los de la casa no sirven tal
// cual: dicen «el libro de tu {como_le_dicen}» (para un chico quedaría «tu Juani»), prometen «sus mejores frases» y
// llevan al tablero de biografías, que no es el panel de Kids.
//
//   revisar      el libro ya está escrito y espera que el padre lo lea y lo apruebe en su panel (decisión 9).
//   libro_listo  el padre lo aprobó: el libro quedó entregado.
//
// Van en el idioma del chico (`ficha.idioma`, si no `kids_v2.idioma`): es-AR en vos, es-ES en tú, ca de tu. Un idioma
// sin textos aprobados tiraría SinTextosKids (nunca un mail en castellano). Mismo camino
// que los hitos de la casa (Resend directo, mail/hitos.ts); sin clave de Resend devuelven false y el próximo tick reintenta.
import { cargarConfig } from '../../config.js';
import { escaparHtml } from '../../libro/comun.js';
import { TIMEOUT_RESEND_MS } from '../../mail/resend.js';
import { IDIOMA_POR_DEFECTO, type IdiomaKids } from '../../kids-v2/idioma.js';
import { deIdioma } from '../idioma-textos.js';

const REMITENTE = 'Vitácora Familiar <hola@vitacorafamiliar.com>';

export type MailKids = 'revisar' | 'libro_listo';

type Texto = { asunto: (apodo: string) => string; parrafos: (apodo: string) => string[]; boton: string };

/** Los de es-AR (vos). */
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

/** Los de es-ES (tú). El asunto de «revisar», con la propuesta A de docs/kids/v2/idiomas/lectura-espana-2026-10-16.md. */
export const TEXTOS_MAIL_KIDS_ES_ES: Record<MailKids, Texto> = {
  // APROBADO por Naza 16/10 (tanda 8)
  revisar: {
    asunto: (apodo) => `El libro de ${apodo} ya se puede leer. Revísalo antes de aprobarlo`,
    parrafos: (apodo) => [
      `Ya hemos escrito el libro de ${apodo} con lo que contó. Entra en tu panel y léelo.`,
      'Si está bien, apruébalo desde ahí.',
    ],
    boton: 'Ver el libro',
  },
  // APROBADO por Naza 16/10 (tanda 8)
  libro_listo: {
    asunto: (apodo) => `El libro de ${apodo} está listo`,
    parrafos: (apodo) => [
      `Ya está. El libro de ${apodo}, con sus palabras y con sus audios para escuchar desde los códigos del libro.`,
      'Se queda en tu panel para leerlo o descargarlo cuando quieras.',
    ],
    boton: 'Ver el libro',
  },
};

/** Los de catalán (de tu), de docs/rediseno-2026-10/kids/textos-ca-2026-10-16.md (columna Català, rama de la web). */
export const TEXTOS_MAIL_KIDS_CA: Record<MailKids, Texto> = {
  // Aprobado por Naza el 16/10/2026 (tanda 10)
  revisar: {
    asunto: (apodo) => `El llibre de ${apodo} ja es pot llegir. Revisa'l abans d'aprovar-lo`,
    parrafos: (apodo) => [
      `Ja hem escrit el llibre de ${apodo} amb el que ha explicat. Entra al teu panell i llegeix-lo.`,
      "Si està bé, aprova'l des d'allà.",
    ],
    boton: 'Veure el llibre',
  },
  // Aprobado por Naza el 16/10/2026 (tanda 10)
  libro_listo: {
    asunto: (apodo) => `El llibre de ${apodo} està llest`,
    parrafos: (apodo) => [
      `Ja està. El llibre de ${apodo}, amb les seves paraules i amb els seus àudios per escoltar des dels codis del llibre.`,
      'Es queda al teu panell per llegir-lo o descarregar-lo quan vulguis.',
    ],
    boton: 'Veure el llibre',
  },
};

/** Los idiomas con sus mails aprobados. */
export const TEXTOS_MAIL_KIDS_DE: Readonly<Partial<Record<IdiomaKids, Record<MailKids, Texto>>>> = { 'es-AR': TEXTOS_MAIL_KIDS, 'es-ES': TEXTOS_MAIL_KIDS_ES_ES, ca: TEXTOS_MAIL_KIDS_CA };

/** El pie de los dos mails. En catalán, el que ya usa la web de la casa (Aprobado por Naza el 16/10/2026, tanda 10). */
export const PIE_MAIL_KIDS: Readonly<Record<IdiomaKids, string>> = {
  'es-AR': 'En cada familia hay un libro sin escribir.',
  'es-ES': 'En cada familia hay un libro sin escribir.',
  ca: 'A cada família hi ha un llibre per escriure.',
};

export const textosMailKids = (idioma: IdiomaKids = IDIOMA_POR_DEFECTO): Record<MailKids, Texto> => deIdioma(TEXTOS_MAIL_KIDS_DE, idioma, 'los mails al padre (revisar y libro listo)');

export function cuerpoMailKids(mail: MailKids, o: { apodo: string; enlace: string; idioma?: IdiomaKids }): string {
  const t = textosMailKids(o.idioma)[mail];
  const filas = t
    .parrafos(escaparHtml(o.apodo))
    .map((p) => `        <tr><td style="padding-bottom:24px;">${p}</td></tr>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="${o.idioma === 'ca' ? 'ca' : 'es'}">
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
          ${PIE_MAIL_KIDS[o.idioma ?? IDIOMA_POR_DEFECTO]}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Devuelve true si Resend lo aceptó. Sin clave, o si falla, false (el próximo tick reintenta). Solo tira si no hay
 * textos en el idioma del chico (SinTextosKids): eso no lo arregla reintentar.
 */
export async function enviarMailKids(mail: MailKids, o: { para: string; apodo: string; enlace: string; idioma?: IdiomaKids }): Promise<boolean> {
  textosMailKids(o.idioma);
  try {
    const { resendApiKey } = cargarConfig();
    if (!resendApiKey) return false;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(TIMEOUT_RESEND_MS),
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: REMITENTE, to: [o.para], subject: textosMailKids(o.idioma)[mail].asunto(o.apodo), html: cuerpoMailKids(mail, o) }),
    });
    if (!r.ok) console.error(`kids: Resend rechazó el mail «${mail}» (${r.status}).`);
    return r.ok;
  } catch (err) {
    console.error(`kids: no salió el mail «${mail}»: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
