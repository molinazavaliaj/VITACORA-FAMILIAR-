import Fastify from 'fastify';
import { cargarConfig } from './config.js';
import { registrarWebhook } from './whatsapp/webhook.js';
import { procesarEntrante } from './flujo/procesar.js';
import { iniciarScheduler } from './flujo/scheduler.js';
import { chequearClaveAlArrancar } from './ia/alarma.js';
import { db } from './db/cliente.js';
import { marcaEnStorage, usarMarcaPersistente } from './v3/avisos.js';
import { avisarVariablesAlArrancar } from './variables.js';

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
  // Los avisos a los socios, una vez por día aunque Railway se reinicie (11/10).
  usarMarcaPersistente(marcaEnStorage(db));
  // Prueba la clave de Anthropic (models.list, gratis); si da 401 avisa a los socios.
  // Sin await: nunca frena el arranque (timeout de 10 s, nunca tira).
  void chequearClaveAlArrancar();
  // Revisa las variables de Railway; si falta alguna, avisa a los socios (una vez por día).
  // Sin await: no frena el arranque y nunca tira.
  void avisarVariablesAlArrancar();
  iniciarScheduler(); // el reloj: cada 15 min revisa a quién le toca qué
  app.listen({ port: config.puerto, host: '0.0.0.0' });
}
