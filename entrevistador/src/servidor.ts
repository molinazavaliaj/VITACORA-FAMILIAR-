import Fastify from 'fastify';
import { cargarConfig } from './config.js';
import { registrarWebhook } from './whatsapp/webhook.js';
import { procesarEntrante } from './flujo/procesar.js';
import { iniciarScheduler } from './flujo/scheduler.js';

const config = cargarConfig();
export const app = Fastify({ logger: true });

app.get('/salud', async () => ({ ok: true }));

// Sugeridas a pedido (§11.7): la web llama con el narrador y una clave
// compartida (SUGERIDAS_CLAVE). Sin la clave configurada, la ruta no existe.
app.post<{ Body: { narradorId?: string } }>('/sugeridas', async (req, reply) => {
  const clave = process.env.SUGERIDAS_CLAVE;
  if (!clave) return reply.code(404).send({ error: 'No disponible.' });
  if (req.headers['x-clave'] !== clave) return reply.code(401).send({ error: 'No autorizado.' });
  const narradorId = req.body?.narradorId;
  if (typeof narradorId !== 'string' || !narradorId) return reply.code(400).send({ error: 'Falta narradorId.' });
  try {
    const { sugerirPreguntas } = await import('./ia/sugeridas.js');
    return { sugeridas: await sugerirPreguntas(narradorId) };
  } catch (err) {
    req.log.error({ err }, 'sugeridas: fallo');
    return reply.code(500).send({ error: 'No pudimos armar las sugerencias. Intenta de nuevo.' });
  }
});

registrarWebhook(app, procesarEntrante);

if (process.env.NODE_ENV !== 'test') {
  iniciarScheduler(); // el reloj: cada 15 min revisa a quién le toca qué
  app.listen({ port: config.puerto, host: '0.0.0.0' });
}
