// La firma de Meta en el webhook (18/10). Hasta hoy el POST /webhook procesaba
// cualquier body: quien supiera la URL podía mandar un mensaje con el teléfono de
// un narrador y el bot lo tomaba como suyo. Meta firma cada aviso con el App
// Secret (HMAC-SHA256 del body crudo, cabecera X-Hub-Signature-256 = "sha256=<hex>").
// Acá se recalcula y se compara en tiempo constante.

import { createHmac, timingSafeEqual } from 'node:crypto';

/** ¿La cabecera es la firma de este body con este secreto? Nunca tira. */
export function firmaValida(cuerpoCrudo: Buffer | string, cabecera: unknown, secreto: string): boolean {
  if (typeof cabecera !== 'string' || !cabecera.startsWith('sha256=')) return false;
  const recibida = Buffer.from(cabecera.slice('sha256='.length), 'hex');
  const esperada = createHmac('sha256', secreto).update(cuerpoCrudo).digest();
  if (recibida.length !== esperada.length) return false;
  return timingSafeEqual(recibida, esperada);
}
