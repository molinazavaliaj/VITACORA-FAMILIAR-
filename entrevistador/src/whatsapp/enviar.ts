import { cargarConfig } from '../config.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

async function postMensaje(payload: Record<string, unknown>): Promise<string> {
  const config = cargarConfig();
  const res = await fetch(`${GRAPH}/${config.waPhoneNumberId}/messages`, {
    method: 'POST',
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

export function enviarTexto(telefono: string, texto: string) {
  return postMensaje({ to: telefono, type: 'text', text: { body: texto } });
}

/** `idioma`: el código de Meta de la plantilla aprobada ('es', 'es_ES', 'ca'). Lo viejo sigue en 'es'. */
export function enviarPlantilla(telefono: string, nombre: string, variables: string[], idioma = 'es') {
  return postMensaje({
    to: telefono,
    type: 'template',
    template: {
      name: nombre,
      language: { code: idioma },
      components: [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: v })) }],
    },
  });
}

/**
 * Texto con botones de respuesta rápida (entrevista V3). Meta: hasta 3
 * botones, título de hasta 20 letras, cuerpo de hasta 1024. Lo que la persona
 * toca vuelve por el webhook como `interactive.button_reply` con el título.
 */
export function enviarBotones(telefono: string, texto: string, botones: string[]) {
  return postMensaje({
    to: telefono,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: texto },
      action: { buttons: botones.map((title, i) => ({ type: 'reply', reply: { id: `b${i + 1}`, title } })) },
    },
  });
}

export function enviarAudioPorLink(telefono: string, url: string) {
  return postMensaje({ to: telefono, type: 'audio', audio: { link: url } });
}

/** Una imagen por link firmado (la pregunta-foto). `caption` opcional: el epígrafe. */
export function enviarImagenPorLink(telefono: string, url: string, caption?: string) {
  return postMensaje({ to: telefono, type: 'image', image: caption ? { link: url, caption } : { link: url } });
}
