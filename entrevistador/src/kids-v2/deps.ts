// Todo lo que Kids V2 toca de afuera, en un solo objeto (como viaje-v2/deps.ts): los tests y la simulación pasan
// una base en memoria y un WhatsApp falso; las de verdad están en deps-reales.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IdiomaKids } from './nucleo/idioma.js';

export type WhatsAppKids = {
  /** Texto libre (dentro de la ventana de 24 h). Devuelve el id de Meta. */
  texto(telefono: string, texto: string): Promise<string>;
  /** Texto con botones de respuesta rápida (dentro de la ventana; hasta 3, título de hasta 20 letras). */
  botones(telefono: string, texto: string, botones: string[]): Promise<string>;
  /** Plantilla aprobada en Meta (fuera de la ventana, o la que el motor pide como plantilla). `idiomaMeta`: 'es' o 'es_ES'. */
  plantilla(telefono: string, nombre: string, idiomaMeta: string, variables: string[]): Promise<string>;
  /** Baja un audio o una imagen de Meta. */
  descargar(mediaId: string): Promise<Buffer>;
};

export type DepsKids = {
  db: SupabaseClient;
  wa: WhatsAppKids;
  /** Transcripción en el castellano del chico: rioplatense (es-AR) o de España (es-ES). */
  transcribir(audio: Buffer, o: { nombre: string; idioma: IdiomaKids; narradorId: string }): Promise<{ texto: string; duracionSegundos: number }>;
  /** Aviso a los socios (consola + mail). Nunca tira. */
  avisar(clave: string, asunto: string, detalle: string): Promise<void>;
  ahora(): Date;
};
