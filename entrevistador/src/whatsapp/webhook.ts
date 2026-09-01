import type { FastifyInstance } from 'fastify';
import { cargarConfig } from '../config.js';

export type MensajeEntrante = {
  telefono: string;
  tipo: 'audio' | 'texto';
  texto?: string;
  mediaId?: string;
  waMessageId: string;
};

export function parsearEntrante(body: any): MensajeEntrante | null {
  const mensaje = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!mensaje) return null;
  const base = { telefono: `+${mensaje.from}`, waMessageId: mensaje.id };
  if (mensaje.type === 'audio') return { ...base, tipo: 'audio', mediaId: mensaje.audio.id };
  if (mensaje.type === 'text') return { ...base, tipo: 'texto', texto: mensaje.text.body };
  return null; // imágenes, stickers, reacciones: se ignoran en v1
}

export function registrarWebhook(app: FastifyInstance, procesar: (m: MensajeEntrante) => Promise<void>) {
  const config = cargarConfig();

  app.get('/webhook', async (req, reply) => {
    const q = req.query as Record<string, string>;
    if (q['hub.mode'] === 'subscribe' && q['hub.verify_token'] === config.waVerifyToken) {
      return reply.send(q['hub.challenge']);
    }
    return reply.code(403).send();
  });

  app.post('/webhook', async (req, reply) => {
    reply.send({ ok: true }); // 200 inmediato: Meta reintenta ante cualquier otra cosa
    const entrante = parsearEntrante(req.body);
    if (entrante) {
      procesar(entrante).catch((err) => app.log.error({ err, entrante }, 'fallo procesando entrante'));
    }
  });
}
