// El aviso de que se borran los audios originales (18/10). Los términos dicen que
// los audios originales se borran 3 meses después de producir el libro (revisión
// legal del 17/10). Antes de borrarlos, la familia recibe UN mail con el link para
// descargarlos todos: para muchos es la voz de su abuela contando cada historia,
// y no la puede perder sin saberlo (decisión de Naza, 18/10, opción A).
//
// ✅ TEXTO APROBADO POR NAZA (2026-10-18), tal cual. El borrado sigue apagado hasta
// el OK de Joaquín (BORRADO_AUDIOS_ORIGINALES, ver audios-originales.ts).

import { cargarConfig } from '../config.js';
import { TIMEOUT_RESEND_MS } from './resend.js';
import { escaparHtml } from '../libro/comun.js';

const REMITENTE = 'Vitácora Familiar <hola@vitacorafamiliar.com>';

/** «12 de enero». */
export function fechaLarga(d: Date): string {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

/** Sin dos puntos (Naza), y igual en vos y en tú. */
export function asuntoBorradoAudios(comoLeDicen: string, fecha: Date): string {
  return `Los audios de tu ${comoLeDicen} se borran el ${fechaLarga(fecha)}`;
}

const PARRAFOS_VOS = (quien: string, fecha: string, partes: number): string[] => [
  `Hace casi tres meses terminamos el libro de tu ${quien}. Como te contamos al comprar, el ${fecha} borramos los audios originales de la entrevista.`,
  `Si los querés guardar, descargalos desde acá. Están todos, uno por respuesta, con la fecha en que los grabó.${partes > 1 ? ` Son ${partes} archivos porque pesan mucho juntos.` : ''}`,
  `El libro y las frases de «Su voz» no se borran. Siguen en tu panel como siempre.`,
];

const PARRAFOS = (quien: string, fecha: string, partes: number): string[] => [
  `Hace casi tres meses terminamos el libro de tu ${quien}. Como te contamos al comprar, el ${fecha} borramos los audios originales de la entrevista.`,
  `Si los quieres guardar, descárgalos desde aquí. Están todos, uno por respuesta, con la fecha en que los grabó.${partes > 1 ? ` Son ${partes} archivos porque pesan mucho juntos.` : ''}`,
  `El libro y las frases de «Su voz» no se borran. Siguen en tu panel como siempre.`,
];

export function cuerpoBorradoAudios(o: { comoLeDicen: string; fecha: Date; enlaces: string[]; vos?: boolean }): string {
  const quien = escaparHtml(o.comoLeDicen);
  const parrafos = (o.vos ? PARRAFOS_VOS : PARRAFOS)(quien, fechaLarga(o.fecha), o.enlaces.length)
    .map((p) => `        <tr><td style="padding-bottom:24px;">
          ${p}
        </td></tr>`)
    .join('\n\n');
  const botones = o.enlaces
    .map((url, i) => `        <tr><td style="padding-bottom:16px;">
          <a href="${escaparHtml(url)}" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;letter-spacing:0.02em;">
            ${o.enlaces.length > 1 ? `Descargar los audios (${i + 1} de ${o.enlaces.length})` : 'Descargar los audios'}
          </a>
        </td></tr>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,'Times New Roman',serif;color:#14140F;font-size:17px;line-height:1.65;">

${parrafos}

${botones}

        <tr><td style="border-top:1px solid #e7e5e4;padding-top:20px;font-size:14px;color:#78716c;font-style:italic;">
          En cada familia hay un libro sin escribir.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Devuelve false sin tirar si falta la clave de Resend (sin candado, el próximo tick reintenta); tira si Resend rechaza. */
export async function enviarMailBorradoAudios(o: {
  para: string; comoLeDicen: string; fecha: Date; enlaces: string[]; vos?: boolean;
}): Promise<boolean> {
  const { resendApiKey } = cargarConfig();
  if (!resendApiKey) {
    console.warn('enviarMailBorradoAudios: falta RESEND_API_KEY, no se manda el aviso de borrado de audios.');
    return false;
  }
  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_RESEND_MS),
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: REMITENTE,
      to: [o.para],
      subject: asuntoBorradoAudios(o.comoLeDicen, o.fecha),
      html: cuerpoBorradoAudios(o),
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`Resend rechazó el aviso de borrado de audios (${respuesta.status}): ${await respuesta.text()}`);
  }
  return true;
}
