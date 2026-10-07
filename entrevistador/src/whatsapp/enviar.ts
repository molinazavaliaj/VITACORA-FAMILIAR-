import { cargarConfig } from '../config.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

/**
 * `timeoutMs` (opcional, lo usa la V3): corta el pedido a Meta si no contesta
 * a tiempo, para que un envío colgado no dure más que la toma del turno. Sin
 * él, todo sigue como siempre (el flujo viejo no lo pasa).
 */
export type OpcionesEnvio = { timeoutMs?: number };

async function postMensaje(payload: Record<string, unknown>, o: OpcionesEnvio = {}): Promise<string> {
  const config = cargarConfig();
  const res = await fetch(`${GRAPH}/${config.waPhoneNumberId}/messages`, {
    method: 'POST',
    ...(o.timeoutMs !== undefined ? { signal: AbortSignal.timeout(o.timeoutMs) } : {}),
    headers: {
      Authorization: `Bearer ${config.waToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  });
  const json = await res.json() as { messages?: { id: string }[]; error?: { message: string } };
  if (!res.ok || !json.messages) throw new Error(`WhatsApp rechazó el envío: ${json.error?.message ?? res.status}`);
  return json.messages[0].id;
}

export function enviarTexto(telefono: string, texto: string, o: OpcionesEnvio = {}) {
  return postMensaje({ to: telefono, type: 'text', text: { body: texto } }, o);
}

/** `idioma`: el código de Meta de la plantilla aprobada ('es', 'es_ES', 'ca'). Lo viejo sigue en 'es'. */
export function enviarPlantilla(telefono: string, nombre: string, variables: string[], idioma = 'es', o: OpcionesEnvio = {}) {
  return postMensaje({
    to: telefono,
    type: 'template',
    template: {
      name: nombre,
      language: { code: idioma },
      components: [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: v })) }],
    },
  }, o);
}

/**
 * Texto con botones de respuesta rápida (entrevista V3). Meta: hasta 3
 * botones, título de hasta 20 letras, cuerpo de hasta 1024. Lo que la persona
 * toca vuelve por el webhook como `interactive.button_reply` con el título.
 */
export function enviarBotones(telefono: string, texto: string, botones: string[], o: OpcionesEnvio = {}) {
  return postMensaje({
    to: telefono,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: texto },
      action: { buttons: botones.map((title, i) => ({ type: 'reply', reply: { id: `b${i + 1}`, title } })) },
    },
  }, o);
}

export function enviarAudioPorLink(telefono: string, url: string) {
  return postMensaje({ to: telefono, type: 'audio', audio: { link: url } });
}

/** Una imagen por link firmado (la pregunta-foto). `caption` opcional: el epígrafe. */
export function enviarImagenPorLink(telefono: string, url: string, caption?: string) {
  return postMensaje({ to: telefono, type: 'image', image: caption ? { link: url, caption } : { link: url } });
}
