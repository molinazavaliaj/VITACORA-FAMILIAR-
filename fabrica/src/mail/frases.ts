// El recordatorio de las frases de «Su voz»: UN mail, a los 15 días de la
// entrega, si la familia todavía no confirmó qué frases se imprimen.
//
// Por qué existe: la selección se cierra cuando alguien aprieta "imprimir", y
// hasta ese momento la familia puede cambiarla desde el panel. Si nadie dice
// nada, a los 15 días se le recuerda una sola vez y queda la selección del
// biógrafo (spec `2026-09-20-su-voz-design.md`, "Decisiones abiertas" 2). El
// mail es solo un aviso: no frena la entrega ni cambia ningún estado del
// pedido, y si no sale, el próximo tick lo reintenta.
//
// Va por Resend con la API HTTP directa, igual que el anticipo y los hitos (una
// sola llamada POST, sin sumar el SDK). El candado
// (`RUTA_RECORDATORIO_FRASES`) lo deja el worker SOLO si Resend confirmó el
// envío: sin candado, el próximo tick reintenta.
//
// ✅ TEXTO APROBADO POR NAZA (2026-09-21), en castellano neutro de "tú": este mail
// es comunicación de la empresa, así que va con el tono formal de los otros mails
// de la casa (anticipo, hitos), no con el rioplatense del texto del plan. El
// contenido también es de ella: el primer párrafo dice "las mejores historias con
// su voz", no "las frases de «Su voz»".

import { cargarConfig } from '../config.js';
import { escaparHtml } from '../libro/comun.js';

const REMITENTE = 'Vitácora Familiar <hola@vitacorafamiliar.com>';

/** A los 15 días de la entrega se recuerda (decisión de los socios, 20/09). */
export const DIAS_RECORDATORIO_FRASES = 15;

/**
 * El candado en `{narrador_id}/paquete/`. Es un archivo y no una columna
 * porque la promesa es "un solo mail": mientras exista, no se manda de nuevo.
 */
export const CANDADO_RECORDATORIO_FRASES = 'recordatorio_frases_enviado.txt';
export const RUTA_RECORDATORIO_FRASES = (narradorId: string) =>
  `${narradorId}/paquete/${CANDADO_RECORDATORIO_FRASES}`;

export function asuntoRecordatorioFrases(comoLeDicen: string): string {
  return `Las frases de tu ${comoLeDicen}: ¿quieres elegir tú las que se imprimen?`;
}

/**
 * El cuerpo, con la misma tabla que los hitos y el anticipo (copiada, no
 * importada: son textos distintos y cada uno se aprueba solo). `quien` llega ya
 * escapado para el HTML.
 *
 * Tres párrafos, en este orden y por esto: (1) qué está listo, para que se
 * entienda de qué le hablamos; (2) qué puede hacer y que no hay ninguna
 * obligación —la familia no tiene por qué confirmar nada—; (3) qué pasa si no
 * hace nada, que es la promesa del spec: se imprime lo que eligió el biógrafo.
 */
const PARRAFOS = (quien: string): string[] => [
  `El libro de tu ${quien} ya está terminado, y las mejores historias con su voz ya se pueden escuchar.`,
  `Las eligió el biógrafo entre las cosas que dijo ${quien}. Si quieres sacar alguna, poner otra en su lugar o cambiar el orden, puedes hacerlo desde tu panel.`,
  `No hay ninguna obligación de hacerlo: si no tocas nada, cuando se imprima va la lista que eligió el biógrafo, tal como está.`,
];

export function cuerpoRecordatorioFrases(opciones: { comoLeDicen: string; enlace: string }): string {
  const quien = escaparHtml(opciones.comoLeDicen);
  const url = escaparHtml(opciones.enlace);

  const parrafos = PARRAFOS(quien)
    .map(
      (parrafo) => `        <tr><td style="padding-bottom:24px;">
          ${parrafo}
        </td></tr>`
    )
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Georgia,'Times New Roman',serif;color:#14140F;font-size:17px;line-height:1.65;">

${parrafos}

        <tr><td style="padding-bottom:32px;">
          <a href="${url}" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;letter-spacing:0.02em;">
            Ver las frases
          </a>
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
 * Manda el recordatorio. Devuelve `false` (sin tirar) si falta la clave de
 * Resend —igual que `enviarMailHito`: sin candado, el próximo tick reintenta— y
 * tira si Resend rechaza (eso sí es un error a mirar; quien llama lo atrapa por
 * narrador y sigue con el resto).
 */
export async function enviarMailRecordatorioFrases(opciones: {
  para: string;
  comoLeDicen: string;
  enlace: string;
}): Promise<boolean> {
  const { resendApiKey } = cargarConfig();
  if (!resendApiKey) {
    console.warn('enviarMailRecordatorioFrases: falta RESEND_API_KEY, no se manda el recordatorio de frases.');
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
      subject: asuntoRecordatorioFrases(opciones.comoLeDicen),
      html: cuerpoRecordatorioFrases({ comoLeDicen: opciones.comoLeDicen, enlace: opciones.enlace }),
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Resend rechazó el recordatorio de frases (${respuesta.status}): ${await respuesta.text()}`);
  }
  return true;
}
