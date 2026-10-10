// Todo lo que la Viaje V2 toca de afuera, en un solo objeto (como v3/deps.ts): los tests y la simulación pasan una
// base en memoria y un WhatsApp falso; las de verdad están en deps-reales.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Idioma } from './nucleo/idioma.js';

export type WhatsAppViaje = {
  /** Texto libre (dentro de la ventana de 24 h). Devuelve el id de Meta. */
  texto(telefono: string, texto: string): Promise<string>;
  /** Plantilla aprobada en Meta (fuera de la ventana). `idiomaMeta`: 'es', 'es_ES', 'ca'. */
  plantilla(telefono: string, nombre: string, idiomaMeta: string, variables: string[]): Promise<string>;
  /** La ❤️ sobre un mensaje de la persona (dentro de la ventana). */
  reaccion(telefono: string, waMessageId: string, emoji: string): Promise<string>;
  /** Baja un audio o una imagen de Meta. */
  descargar(mediaId: string): Promise<Buffer>;
};

export type DepsViaje = {
  db: SupabaseClient;
  wa: WhatsAppViaje;
  transcribir(audio: Buffer, o: { nombre: string; idioma: Idioma; narradorId: string }): Promise<{ texto: string; duracionSegundos: number }>;
  /** Aviso a los socios (consola + mail). Nunca tira. */
  avisar(clave: string, asunto: string, detalle: string): Promise<void>;
  /** El mail «dijo que sí» a quien regaló el viaje (mail/hitos.ts, una sola vez). Nunca tira. */
  mailSi(narradorId: string): Promise<void>;
  ahora(): Date;
};
