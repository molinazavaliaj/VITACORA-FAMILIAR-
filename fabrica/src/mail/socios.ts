// Los avisos a los socios (no a la familia) cuando el buzón de voz clonada
// se atasca: una narración que nadie tomó en 24 h (la PC de voz está
// apagada), una que lleva 6 h procesando (se colgó), una fallida (el
// worker ya dijo por qué) o una que la fábrica no logra ensamblar (la voz
// volvió pero ffmpeg/Storage fallan). Van por Resend a MAIL_SOCIOS, igual que los
// hitos; el worker deja un candado por (narración, motivo) SOLO si Resend
// confirmó — sin clave, el próximo tick reintenta.
//
// Texto llano y en castellano de casa: es para Naza y Joaquín, no para un
// cliente.

import { cargarConfig } from '../config.js';
import { escaparHtml } from '../libro/comun.js';
import type { MotivoAtascada } from '../voz/narraciones.js';

const REMITENTE = 'Vitácora Familiar <hola@vitacorafamiliar.com>';

const PREFIJO_ASUNTO = 'Vitácora — voz clonada:';

/** Por qué se avisa: los atascos del buzón (worker) más el ensamblado que falla de este lado. */
export type MotivoAviso = MotivoAtascada | 'ensamblado_fallido';

/** Nombre del candado en `{narrador_id}/paquete/` de un aviso ya mandado. */
export const CANDADO_AVISO = (narracionId: string, motivo: MotivoAviso) =>
  `aviso_narracion_${narracionId}_${motivo}.txt`;

export type AvisoNarracion = { id: string; motivo: MotivoAviso; error: string | null };

const RESUMEN: Record<MotivoAviso, (quien: string) => string> = {
  pendiente_24h: (quien) => `la narración de ${quien} lleva 24 h sin tomarse`,
  procesando_6h: (quien) => `la narración de ${quien} se colgó`,
  fallida: (quien) => `la narración de ${quien} falló`,
  ensamblado_fallido: (quien) => `no se pudo armar el audiolibro de ${quien}`,
};

export function asuntoAviso(motivo: MotivoAviso, comoLeDicen: string): string {
  return `${PREFIJO_ASUNTO} ${RESUMEN[motivo](comoLeDicen)}`;
}

/** Los textos del cuerpo; `quien`, `error` e `id` llegan ya escapados. */
const TEXTOS: Record<MotivoAviso, (quien: string, aviso: { id: string; error: string }) => string[]> = {
  pendiente_24h: (quien) => [`La narración de ${quien} lleva más de 24 h sin tomarse: ¿está prendida la PC de voz?`],
  procesando_6h: (quien) => [
    `La narración de ${quien} se colgó (más de 6 h procesando).`,
    `El worker la retoma solo; si sigue así, mirá logs\\worker.log en la PC de voz.`,
  ],
  fallida: (quien, aviso) => [
    `La narración de ${quien} falló: ${aviso.error}.`,
    `Para reintentar: <code>npm run narracion -- reintentar ${aviso.id}</code>`,
  ],
  ensamblado_fallido: (quien, aviso) => [
    `La fábrica no pudo armar el audiolibro clonado de ${quien}: ${aviso.error}.`,
    `Lo reintenta en cada vuelta; si sigue así, mirá los logs de Railway.`,
  ],
};

export function cuerpoAviso(aviso: AvisoNarracion, comoLeDicen: string): string {
  const parrafos = TEXTOS[aviso.motivo](escaparHtml(comoLeDicen), {
    id: escaparHtml(aviso.id),
    error: escaparHtml(aviso.error ?? 'sin motivo anotado'),
  });
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="font-family:Georgia,'Times New Roman',serif;color:#14140F;font-size:16px;line-height:1.6;">
${parrafos.map((p) => `<p>${p}</p>`).join('\n')}
</body>
</html>`;
}

/**
 * Manda un mail a los socios. Devuelve `false` (sin tirar) si falta la clave
 * de Resend — igual que `enviarMailHito`: sin candado, el próximo tick
 * reintenta. Si Resend rechaza, tira.
 */
export async function avisarSocios(asunto: string, cuerpoHtml: string): Promise<boolean> {
  const { resendApiKey, mailSocios } = cargarConfig();
  if (!resendApiKey) {
    console.warn(`avisarSocios: falta RESEND_API_KEY, no se manda "${asunto}".`);
    return false;
  }

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: REMITENTE, to: [mailSocios], subject: asunto, html: cuerpoHtml }),
  });

  if (!respuesta.ok) {
    throw new Error(`Resend rechazó el aviso "${asunto}" (${respuesta.status}): ${await respuesta.text()}`);
  }
  return true;
}
