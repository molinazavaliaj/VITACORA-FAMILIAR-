import Fastify from 'fastify';
import { cargarConfig } from './config.js';

const config = cargarConfig();
export const app = Fastify({ logger: true });

app.get('/salud', async () => ({ ok: true }));

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: config.puerto, host: '0.0.0.0' });
}
