import type { FastifyInstance } from 'fastify';
import { cargarConfig } from '../config.js';
import { anotarEntrega, parsearEntregas } from './entregas.js';

export type MensajeEntrante = {
  telefono: string;
  tipo: 'audio' | 'texto' | 'imagen';
  texto?: string;     // el texto, o el epígrafe de la imagen
  mediaId?: string;
  mimeType?: string;  // imagen: image/jpeg, image/png, image/webp
  waMessageId: string;
};

/**
 * Lo que dice el botón que apretó, sea de una plantilla o nuestro.
 *
 * Se prefiere el texto visible sobre el payload: es lo que la persona leyó y
 * creyó estar diciendo, y es lo que después lee `leerSiNo`.
 */
export function textoDelBoton(mensaje: any): string | null {
  if (mensaje?.type === 'button') {
    const t = mensaje.button?.text ?? mensaje.button?.payload;
    return typeof t === 'string' && t.trim() ? t.trim() : null;
  }
  if (mensaje?.type === 'interactive') {
    const i = mensaje.interactive ?? {};
    const t = i.button_reply?.title ?? i.button_reply?.id ?? i.list_reply?.title ?? i.list_reply?.id;
    return typeof t === 'string' && t.trim() ? t.trim() : null;
  }
  return null;
}

export function parsearEntrante(body: any): MensajeEntrante | null {
  const mensaje = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!mensaje) return null;
  const base = { telefono: `+${mensaje.from}`, waMessageId: mensaje.id };
  if (mensaje.type === 'audio') return { ...base, tipo: 'audio', mediaId: mensaje.audio.id };
  if (mensaje.type === 'text') return { ...base, tipo: 'texto', texto: mensaje.text.body };
  // Vitácora de viaje (18/09): las fotos del día llegan por acá, con su epígrafe.
  if (mensaje.type === 'image') return { ...base, tipo: 'imagen', mediaId: mensaje.image.id, mimeType: mensaje.image.mime_type, texto: mensaje.image.caption };
  // El botón de la plantilla (23/09). Mariano apretó el «SI» que trae la
  // bienvenida de Meta, su respuesta llegó a nuestro número con doble tilde —y
  // acá se tiraba a la basura, porque un botón NO llega como `text`: llega como
  // `button` (las quick replies de una plantilla) o como `interactive` (los
  // botones que mandamos nosotros). Le dimos a la gente el camino más fácil
  // para contestar y era el único que no escuchábamos: leyeron la bienvenida,
  // apretaron SI, y del otro lado no pasó nada.
  const apretado = textoDelBoton(mensaje);
  if (apretado) return { ...base, tipo: 'texto', texto: apretado };
  return null; // stickers, reacciones, documentos, ubicaciones: se ignoran
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
    // Los avisos de entrega (23/09): Meta los manda por acá y hasta hoy los
    // tirábamos. Son la única forma de saber si el mensaje LLEGÓ.
    for (const aviso of parsearEntregas(req.body)) {
      anotarEntrega(aviso).catch((err) => app.log.error({ err, aviso }, 'fallo anotando la entrega'));
    }
    const entrante = parsearEntrante(req.body);
    if (entrante) {
      procesar(entrante).catch((err) => app.log.error({ err, entrante }, 'fallo procesando entrante'));
    }
  });
}
