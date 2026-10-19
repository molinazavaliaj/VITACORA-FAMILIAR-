import { describe, it, expect } from 'vitest';
import type { ErrorEvent } from '@sentry/node';
import { limpiarEvento, iniciarSentry } from '../src/sentry.js';

// Sentry (18/10): a Sentry va solo el error técnico, nunca datos de un narrador.

describe('limpiarEvento', () => {
  it('saca el pedido, el usuario, los extras, las migas y los contextos raros', () => {
    const evento = {
      message: 'fallo procesando entrante',
      exception: { values: [{ type: 'Error', value: 'boom' }] },
      request: { data: '{"texto":"mi mamá se llamaba Rosa"}', headers: { 'x-hub-signature-256': 'sha256=x' } },
      user: { id: '+5491155551234' },
      extra: { arguments: ['fallo', { entrante: { texto: 'mi mamá se llamaba Rosa' } }] },
      breadcrumbs: [{ message: 'mi mamá se llamaba Rosa' }],
      contexts: { os: { name: 'linux' }, runtime: { name: 'node' }, narrador: { nombre: 'Rosa' } },
    } as unknown as ErrorEvent;
    const limpio = limpiarEvento(evento);
    expect(JSON.stringify(limpio)).not.toContain('Rosa');
    expect(JSON.stringify(limpio)).not.toContain('5491155551234');
    expect(limpio.exception?.values?.[0]?.value).toBe('boom');
    expect(limpio.contexts?.os).toEqual({ name: 'linux' });
  });
});

describe('iniciarSentry', () => {
  it('sin SENTRY_DSN o en los tests no prende nada', () => {
    expect(iniciarSentry({})).toBe(false);
    expect(iniciarSentry({ SENTRY_DSN: 'https://a@o1.ingest.de.sentry.io/1', NODE_ENV: 'test' })).toBe(false);
  });
});
