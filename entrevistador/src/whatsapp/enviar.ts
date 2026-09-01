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

export function enviarPlantilla(telefono: string, nombre: string, variables: string[]) {
  return postMensaje({
    to: telefono,
    type: 'template',
    template: {
      name: nombre,
      language: { code: 'es' },
      components: [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: v })) }],
    },
  });
}

export function enviarAudioPorLink(telefono: string, url: string) {
  return postMensaje({ to: telefono, type: 'audio', audio: { link: url } });
}
