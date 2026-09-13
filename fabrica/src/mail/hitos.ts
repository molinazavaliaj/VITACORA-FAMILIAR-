// Los mails de los hitos del cierre del libro: "terminó de contar", los
// recordatorios a los 3, 7 y 14 días sin Cerrar libro, el cierre automático
// a los 30 y el "libro listo" cuando el paquete se entregó.
//
// Van por Resend con la API HTTP directa, igual que el anticipo (una sola
// llamada POST, sin sumar el SDK). Cada mail tiene su candado en Storage
// (`CANDADO_POR_HITO`) que el worker deja SOLO si Resend confirmó el envío.
//
// Textos aprobados por Naza el 2026-09-13. Voz de marca: castellano neutro
// de "tú" — el voseo vive solo en los ads argentinos. Cualquier cambio de
// estas palabras lo aprueba ella antes de commitear (regla de la casa).

import { cargarConfig } from '../config.js';
import { escaparHtml } from '../libro/comun.js';

const REMITENTE = 'Vitácora Familiar <hola@vitacorafamiliar.com>';

export type Hito =
  | 'terminado'
  | 'libro_listo'
  | 'recordatorio_3'
  | 'recordatorio_7'
  | 'recordatorio_14'
  | 'cierre_automatico';

/** Nombre del archivo candado en `{narrador_id}/paquete/` para cada hito. */
export const CANDADO_POR_HITO: Record<Hito, string> = {
  terminado: 'terminado_enviado.txt',
  libro_listo: 'libro_listo_enviado.txt',
  recordatorio_3: 'recordatorio_cierre_3.txt',
  recordatorio_7: 'recordatorio_cierre_7.txt',
  recordatorio_14: 'recordatorio_cierre_14.txt',
  cierre_automatico: 'cierre_automatico_enviado.txt',
};

/**
 * Los textos, uno por hito. `quien` ya llega escapado para el cuerpo (es
 * `como_le_dicen`: "papá", "la abuela", "Roberto"); en el asunto va crudo
 * porque el asunto no es HTML.
 */
const TEXTOS: Record<Hito, { asunto: (quien: string) => string; parrafos: (quien: string) => string[]; boton: string }> = {
  terminado: {
    asunto: (quien) => `Tu ${quien} terminó de contar`,
    parrafos: (quien) => [
      `Tu ${quien} respondió la última pregunta. Su historia está completa.`,
      'Ahora te toca a ti: entra, revisa los nombres y lugares que anotamos, elige el orden de los capítulos y la foto de la tapa, y cierra el libro.',
      'Cuando lo cierres, lo escribimos con sus palabras y te avisamos.',
    ],
    boton: 'Cerrar el libro',
  },
  recordatorio_3: {
    asunto: (quien) => `El libro de tu ${quien} espera que lo cierres`,
    parrafos: (quien) => [
      `Hace tres días que tu ${quien} terminó de contar. El libro no se escribe hasta que lo cierres.`,
      'Son cinco minutos: revisar nombres, elegir el orden de los capítulos y la foto de la tapa.',
    ],
    boton: 'Cerrar el libro',
  },
  recordatorio_7: {
    asunto: (quien) => `Una semana sin cerrar el libro de tu ${quien}`,
    parrafos: (quien) => [
      `Pasó una semana desde que tu ${quien} terminó. Su libro sigue esperándote.`,
      'Si no tienes nada que cambiar, entra y ciérralo tal como te lo proponemos: queda perfecto igual.',
    ],
    boton: 'Cerrar el libro',
  },
  recordatorio_14: {
    asunto: (quien) => `Todavía no cerraste el libro de tu ${quien}`,
    parrafos: (quien) => [
      `Hace dos semanas que la historia de tu ${quien} está completa y sin cerrar.`,
      'Si en dos semanas más no lo cierras, lo cerramos nosotros con nuestra propuesta y lo escribimos igual — está en los términos, para que ningún libro quede sin hacer.',
    ],
    boton: 'Cerrar el libro',
  },
  cierre_automatico: {
    asunto: (quien) => `Cerramos el libro de tu ${quien} por ti`,
    parrafos: (quien) => [
      `Pasaron treinta días desde que tu ${quien} terminó de contar y el libro seguía abierto, así que lo cerramos nosotros con la propuesta que te habíamos hecho.`,
      'Ya lo estamos escribiendo con sus palabras. Cuando esté, te avisamos.',
    ],
    boton: 'Ver el libro',
  },
  libro_listo: {
    asunto: (quien) => `El libro de tu ${quien} está listo`,
    parrafos: (quien) => [
      `Ya está. El libro de tu ${quien}, escrito con sus palabras, y el audiolibro con su voz.`,
      'Queda ahí para siempre. Entra cuando quieras a leerlo, escucharlo o descargarlo.',
    ],
    boton: 'Leer el libro',
  },
};

export function asuntoHito(hito: Hito, comoLeDicen: string): string {
  return TEXTOS[hito].asunto(comoLeDicen);
}

/**
 * El cuerpo del mail: la misma tabla que el anticipo (copiada, no importada —
 * son textos distintos y cada uno se aprueba solo), un párrafo por fila, el
 * botón con el enlace al tablero y el pie de la casa.
 */
export function cuerpoHito(hito: Hito, opciones: { comoLeDicen: string; enlace: string }): string {
  const quien = escaparHtml(opciones.comoLeDicen);
  const url = escaparHtml(opciones.enlace);
  const texto = TEXTOS[hito];

  const parrafos = texto
    .parrafos(quien)
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
            ${texto.boton}
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
 * Manda el mail de un hito. Devuelve `false` (sin tirar) si falta la clave de
 * Resend: la fábrica sigue con lo suyo aunque el correo no esté configurado,
 * y sin candado el próximo tick reintenta. Si Resend rechaza, tira — eso sí
 * es un error a mirar.
 */
export async function enviarMailHito(opciones: {
  hito: Hito;
  para: string;
  comoLeDicen: string;
  enlace: string;
}): Promise<boolean> {
  const { resendApiKey } = cargarConfig();
  if (!resendApiKey) {
    console.warn(`enviarMailHito: falta RESEND_API_KEY, no se manda el mail "${opciones.hito}".`);
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
      subject: asuntoHito(opciones.hito, opciones.comoLeDicen),
      html: cuerpoHito(opciones.hito, { comoLeDicen: opciones.comoLeDicen, enlace: opciones.enlace }),
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Resend rechazó el mail "${opciones.hito}" (${respuesta.status}): ${await respuesta.text()}`);
  }
  return true;
}
