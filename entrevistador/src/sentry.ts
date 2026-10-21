// Sentry (18/10): hasta hoy los errores del bot quedaban en los logs de Railway, que
// nadie lee. Ahora cada error (console.error, los logs de nivel error de Fastify y
// lo que se escape sin atrapar) llega a Sentry, que junta los repetidos y avisa por mail.
//
// Privacidad: a Sentry va solo el error técnico. Nunca el cuerpo de un pedido, ni
// el usuario, ni los datos extra, ni las «migas» (lo que pasó antes del error, que
// pueden traer el texto de un narrador). Sin SENTRY_DSN, o en los tests, no hace nada.

import * as Sentry from '@sentry/node';
import type { ErrorEvent, NodeOptions } from '@sentry/node';

let prendido = false;

/**
 * Lo que Sentry junta solo, todo apagado. Desde Sentry 11 (21/10) ya no existe
 * `sendDefaultPii`: lo reemplaza `dataCollection`, que por defecto junta TODO
 * (el usuario, cuerpos y encabezados de los pedidos, lo que se le manda a la IA,
 * los datos de las consultas a la base, las variables locales de cada línea del
 * error). Cualquiera de esas puede traer el texto o el teléfono de un narrador,
 * así que cada categoría va apagada a mano. `limpiarEvento` igual borra lo que se escape.
 */
export const RECOLECCION: NonNullable<NodeOptions['dataCollection']> = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
};

/** Lo que se le saca a cada evento antes de mandarlo. Puro: para los tests. */
export function limpiarEvento(evento: ErrorEvent): ErrorEvent {
  delete evento.request;
  delete evento.user;
  delete evento.extra;
  delete evento.breadcrumbs;
  for (const valor of evento.exception?.values ?? []) {
    for (const linea of valor.stacktrace?.frames ?? []) delete linea.vars;
  }
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
    dataCollection: RECOLECCION,
    // El bot y la fábrica pueden compartir proyecto de Sentry: la etiqueta dice de cuál es.
    initialScope: { tags: { servicio: 'bot' } },
    tracesSampleRate: 0,
    integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
    beforeBreadcrumb: () => null,
    beforeSend: (evento) => limpiarEvento(evento),
  });
  prendido = true;
  return true;
}

/**
 * Para el logger de Fastify (pino): los logs de nivel error (50) o peor van a Sentry
 * con el error y el mensaje, nunca el resto del objeto (puede traer el mensaje del narrador).
 */
export function aSentryDesdeElLog(args: unknown[], nivel: number): void {
  if (!prendido || nivel < 50) return;
  try {
    const [primero, segundo] = args;
    const mensaje = typeof primero === 'string' ? primero : typeof segundo === 'string' ? segundo : 'error del servidor';
    const err = primero && typeof primero === 'object' ? (primero as { err?: unknown }).err : undefined;
    if (err instanceof Error) Sentry.captureException(err, { tags: { donde: mensaje.slice(0, 120) } });
    else Sentry.captureMessage(mensaje.slice(0, 300), 'error');
  } catch {
    // Sentry nunca puede romper un log.
  }
}
