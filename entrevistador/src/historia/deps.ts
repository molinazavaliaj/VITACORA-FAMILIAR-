// Todo lo que historia toca de afuera, en un solo objeto (como src/v3/deps.ts):
// los tests y la simulación pasan una base en memoria y un WhatsApp falso, y
// el código de `src/historia/` no importa `db/cliente.ts`. Las de verdad están
// en deps-reales.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClienteModelo } from './nucleo/entrevista/cazador.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';

export type WhatsAppHistoria = {
  /** Texto libre (dentro de la ventana de 24 h). Devuelve el id de Meta. */
  texto(telefono: string, texto: string): Promise<string>;
  /** Texto con botones de respuesta rápida (hasta 3, título de hasta 20 letras). */
  botones(telefono: string, texto: string, botones: string[]): Promise<string>;
  /** Plantilla aprobada en Meta (fuera de la ventana). `idiomaMeta`: 'es', 'es_ES', 'ca'. */
  plantilla(telefono: string, nombre: string, idiomaMeta: string, variables: string[]): Promise<string>;
  /** Baja un audio o una imagen de Meta. */
  descargar(mediaId: string): Promise<Buffer>;
};

export type Transcripcion = { texto: string; duracionSegundos: number };

export type DepsHistoria = {
  db: SupabaseClient;
  wa: WhatsAppHistoria;
  transcribir(audio: Buffer, o: { nombre: string; idioma: Idioma; narradorId: string }): Promise<Transcripcion>;
  /** Aviso a los socios (consola + mail). Nunca tira. */
  avisar(clave: string, asunto: string, detalle: string): Promise<void>;
  /**
   * Los mails de hito a la familia que ya existen (mail/hitos.ts). Nunca tira. 'acepto': el «dijo que sí» de un
   * regalo; 'silencio': 3 días sin contestar («un llamado tuyo ayuda»).
   */
  hito(narradorId: string, hito: 'acepto' | 'primera' | 'mitad' | 'silencio'): Promise<void>;
  /** El cliente del cazador; null = apagado. */
  cazador: ClienteModelo | null;
  ahora(): Date;
};
