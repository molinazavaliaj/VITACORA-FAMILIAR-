// Los datos de la compra de Vitácora de Viaje V2 (flujo-vigente.md §1).
// El código no sabe de ciudades: solo fechas y zonas horarias.

import type { Idioma } from './idioma.js';

/** Fecha local, 'YYYY-MM-DD'. */
export type Fecha = string;
/** Hora local, 'HH:MM' (24 h). */
export type Hora = string;
/** Zona horaria IANA, por ejemplo 'America/Argentina/Buenos_Aires'. */
export type Zona = string;

export type Formato = 'impreso' | 'pdf';
export type FotosAlbum = 20 | 40;

export type Compra = {
  /** Cómo le dicen a la persona: {{nombre}}. */
  nombre: string;
  /** Día de salida (hora de casa). */
  salida: Fecha;
  /** "El día que emprendés la vuelta": el día de salir de allá (revisión de Fable, B3b). */
  vuelta: Fecha;
  zonaCasa: Zona;
  /** La del país principal del viaje (se corrige desde el panel si cambia de país). */
  zonaViaje: Zona;
  /** La hora de la noche que eligió; si no está, 21:30. */
  horaNoche?: Hora;
  /** Solo si es un regalo: {{quien_regala}} y BIEN-1R / PR-R. */
  regalo?: { quienRegala: string };
  /** Hasta 5, tal cual las escribieron (PR-R o PR-P). */
  preguntasPropias: string[];
  formato: Formato;
  fotosAlbum: FotosAlbum;
  /** En qué idioma va la entrevista. Vacío = es-AR (el de siempre). */
  idioma?: Idioma;
};

export const HORA_NOCHE_POR_DEFECTO: Hora = '21:30';
export const MAX_PREGUNTAS_PROPIAS = 5;

/** Un mensaje de WhatsApp ya armado: los IDs del banco de donde sale cada parte, y el texto final. */
export type Mensaje = { ids: string[]; texto: string };
