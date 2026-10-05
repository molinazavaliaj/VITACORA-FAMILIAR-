// Los números del flujo de Kids (paso-4-huecos-decisiones.md, defaults
// técnicos del 05/10). Si Naza quiere otra cosa, se cambia una constante.

export const MIN = 60_000;
export const HORA_MS = 60 * MIN;
export const DIA_MS = 24 * HORA_MS;

/** #19: varios audios seguidos → un solo acuse, cuando pasan 90 s sin nada nuevo. */
export const SILENCIO_MS = 90_000;
/** #20: "muy corto" = audio de menos de 15 s o texto de menos de 8 palabras. */
export const CORTO_AUDIO_SEG = 15;
export const CORTO_PALABRAS = 8;
/** Ventana de WhatsApp: pasado esto, solo plantillas. */
export const VENTANA_MS = 24 * HORA_MS;
/** Recordatorios al padre: a los 4 y a los 8 días de silencio; a los 8, además, marca a Naza. */
export const RECORDATORIO_DIAS = [4, 8] as const;
/** Si no contesta la oferta de extras del final, a los 2 días cierra solo. */
export const CIERRE_SOLO_DIAS = 2;
/** Después de [No tengo] o [Hoy no la como]: cuánto se espera el audio antes de seguir (lo fijó el plan). */
export const ESPERA_AUDIO_FOTO_MS = 10 * MIN;
/** Si el chico mandó algo hace menos de esto, "la hora" espera: no se le cruza una pregunta nueva mientras está contando (lo fijó el plan). */
export const ACTIVO_MS = 30 * MIN;
export const HORA_POR_DEFECTO = '18:00';
export const MAX_PREGUNTAS_PADRE = 3;
