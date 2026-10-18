// Sentry (18/10): hasta hoy los errores de la fábrica quedaban en los logs de Railway,
// que nadie lee. Ahora cada error (console.error y lo que se escape sin atrapar) llega
// a Sentry, que junta los repetidos y avisa por mail. Mismo archivo que el del bot.
//
// Privacidad: a Sentry va solo el error técnico. Nunca el cuerpo de un pedido, ni
// el usuario, ni los datos extra, ni las «migas» (lo que pasó antes del error, que
// pueden traer el texto de un narrador o de su libro). Sin SENTRY_DSN, o en los tests, no hace nada.

import * as Sentry from '@sentry/node';
import type { ErrorEvent } from '@sentry/node';

let prendido = false;

/** Lo que se le saca a cada evento antes de mandarlo. Puro: para los tests. */
export function limpiarEvento(evento: ErrorEvent): ErrorEvent {
  delete evento.request;
  delete evento.user;
  delete evento.extra;
  delete evento.breadcrumbs;
  if (evento.contexts) {
    const { os, runtime, app, device } = evento.contexts;
    evento.contexts = { os, runtime, app, device };
  }
  return evento;
}

export function iniciarSentry(env: NodeJS.ProcessEnv = process.env): boolean {
  const dsn = (env.SENTRY_DSN ?? '').trim();
  if (!dsn || env.NODE_ENV === 'test' || prendido) return prendido;
  Sentry.init({
    dsn,
    environment: 'produccion',
    release: env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 12),
    sendDefaultPii: false,
    // El bot y la fábrica pueden compartir proyecto de Sentry: la etiqueta dice de cuál es.
    initialScope: { tags: { servicio: 'fabrica' } },
    tracesSampleRate: 0,
    integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
    beforeBreadcrumb: () => null,
    beforeSend: (evento) => limpiarEvento(evento),
  });
  prendido = true;
  return true;
}
