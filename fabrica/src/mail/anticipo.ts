// El mail del anticipo: el único mail del sistema que trae plata.
//
// Va por Resend con la API HTTP directa (fetch nativo de Node 22) en vez de
// sumar el SDK: una dependencia menos que instalar en el Dockerfile por una
// sola llamada POST.
//
// Textos aprobados por Naza el 2026-09-10. Voz de marca: castellano neutro
// de "tú" — el voseo vive solo en los ads argentinos. Cualquier cambio de
// estas palabras lo aprueba ella antes de commitear (regla de la casa).

import { cargarConfig } from '../config.js';
import { escaparHtml } from '../libro/comun.js';

const REMITENTE = 'Vitácora Familiar <hola@vitacorafamiliar.com>';

export function asuntoAnticipo(comoLeDicen: string): string {
  return `Tu ${comoLeDicen} ya empezó a contar`;
}

/**
 * El cuerpo del mail. `comoLeDicen` es como la familia lo nombra ("papá",
 * "la abuela", "Roberto"), así que el texto se arma alrededor de eso y no de
 * un nombre propio pelado.
 */
export function cuerpoAnticipo(opciones: {
  comoLeDicen: string;
  primeraPregunta: string;
  enlace: string;
}): string {
  const { comoLeDicen, primeraPregunta, enlace } = opciones;
  const quien = escaparHtml(comoLeDicen);
  const url = escaparHtml(enlace);

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,'Times New Roman',serif;color:#14140F;font-size:17px;line-height:1.65;">

        <tr><td style="padding-bottom:24px;">
          <strong style="font-size:22px;font-weight:normal;">Tu ${quien} ya contó tres cosas.</strong>
        </td></tr>

        <tr><td style="padding-bottom:24px;">
          La primera pregunta fue esta:
        </td></tr>

        <tr><td style="padding-bottom:24px;padding-left:16px;border-left:2px solid #e7e5e4;font-style:italic;color:#57534e;">
          ${escaparHtml(primeraPregunta)}
        </td></tr>

        <tr><td style="padding-bottom:24px;">
          Te dejamos un minuto de esa respuesta, con su voz, tal como la grabó.
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <a href="${url}" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;letter-spacing:0.02em;">
            Escuchar a tu ${quien}
          </a>
        </td></tr>

        <tr><td style="padding-bottom:24px;">
          Con lo que lleva contado ya empezamos su libro: tiene portada, tiene
          índice, y tiene su primera página escrita con sus propias palabras.
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          <a href="${url}" style="color:#5D3FD3;">Ver el libro de tu ${quien}</a>
        </td></tr>

        <tr><td style="padding-bottom:32px;">
          Él va a seguir contando. Tú decides si el libro se termina.
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

/**
 * Manda el mail del anticipo. Devuelve `false` (sin tirar) si falta la clave
 * de Resend: la fábrica tiene que seguir generando libros aunque el correo no
 * esté configurado todavía — un mail que no sale no puede tumbar el worker.
 */
export async function enviarMailAnticipo(opciones: {
  para: string;
  comoLeDicen: string;
  primeraPregunta: string;
  enlace: string;
}): Promise<boolean> {
  const { resendApiKey } = cargarConfig();
  if (!resendApiKey) {
    console.warn('enviarMailAnticipo: falta RESEND_API_KEY, no se manda el mail del anticipo.');
    return false;
  }

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: REMITENTE,
      to: [opciones.para],
      subject: asuntoAnticipo(opciones.comoLeDicen),
      html: cuerpoAnticipo(opciones),
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Resend rechazó el mail del anticipo (${respuesta.status}): ${await respuesta.text()}`);
  }
  return true;
}
