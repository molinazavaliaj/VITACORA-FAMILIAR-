// Todo lo que la V3 toca de afuera, en un solo objeto: así los tests y la
// simulación pasan una base en memoria y un WhatsApp falso, y el código de
// `src/v3/` no importa `db/cliente.ts` (que exige las variables de entorno al
// importarse). Las de verdad están en deps-reales.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ClienteModelo } from './nucleo/entrevista/cazador.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';

export type WhatsAppV3 = {
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

export type DepsV3 = {
  db: SupabaseClient;
  wa: WhatsAppV3;
  transcribir(audio: Buffer, o: { nombre: string; idioma: Idioma; narradorId: string }): Promise<Transcripcion>;
  /** Aviso a los socios (consola + mail). Nunca tira. */
  avisar(clave: string, asunto: string, detalle: string): Promise<void>;
  /** Los mails de hito a la familia que ya existen (mail/hitos.ts). Nunca tira. */
  hito(narradorId: string, hito: 'primera' | 'mitad'): Promise<void>;
  /** El cliente del cazador; null = apagado. */
  cazador: ClienteModelo | null;
  ahora(): Date;
};
