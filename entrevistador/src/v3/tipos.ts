// Los tipos de la entrevista V3 en WhatsApp (spec 2026-10-07, "Datos"): la
// fila de `entrevistas_v3` y su `estado` (jsonb). Puro: sin base ni red.

import type { Descartada, ResultadoCaza } from './nucleo/entrevista/cazador.js';
import type { PreguntaFamilia, Repregunta } from './nucleo/entrevista/flujo.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import { vueltasEnCero, type AcusePendiente, type Vueltas } from './nucleo/entrevista/mensajes.js';
import type { FichaTexto } from './nucleo/entrevista/texto.js';

/** Una línea de un mensaje, con el ID del banco de donde sale. */
export type Parte = { id: string; texto: string };

/** Un globo de la charla (igual que en v3-entrevista-turno.ts: lo lee de-entrevista.ts de la fábrica). */
export type Globo =
  | { de: 'bio'; partes: Parte[]; botones?: string[] }
  | { de: 'persona'; pregunta: string; texto: string; boton?: string }
  | { de: 'bloque'; bloque: number; nombre: string };

/** Lo que se anota de cada llamada al cazador (igual que en v3-entrevista-turno.ts). */
export type RegistroCaza = {
  bloque: number;
  llamo: boolean;
  motivo?: ResultadoCaza['motivo'];
  repreguntas: string[];
  descartadas: Descartada[];
  tokens?: { entrada: number; salida: number };
  costoUsd: number;
  error?: string;
};

/**
 * Un mensaje en la cola de WhatsApp. `turno`: parte de un turno (acuse,
 * entrada, pregunta); `suelto`: M30, M22, M23, el acuse de una foto;
 * `recordatorio`: M8 (fuera de las 24 h sale con la plantilla de recordatorio).
 */
export type TipoSaliente = 'turno' | 'suelto' | 'recordatorio';
export type Saliente = { id: number; texto: string; botones?: string[]; tipo: TipoSaliente };

export type EstadoV3 = {
  formato: 1;
  /** Respuestas en el orden en que llegaron: [clave, texto]. Es la verdad de la entrevista. */
  respuestas: [string, string][];
  /** Lo que se mandó y no espera respuesta (AV11, FIN). */
  enviados: string[];
  vueltas: Vueltas;
  /** El acuse de la última respuesta, pendiente de armarse con lo que se mande después. */
  acuse?: AcusePendiente;
  /** La clave de la pregunta que espera respuesta. */
  esperando?: string;
  /** Tocó un botón de "Sí" en `esperando`: la marca ya está en `respuestas` y los audios se le suman. */
  tocoSi?: boolean;
  /** Las transcripciones de la abierta, sumadas, hasta que el reloj cierre la respuesta. */
  borrador?: string;
  /** La pregunta abierta sin acuse ni entrada, para reenviarla tal cual al día siguiente. */
  preguntaAbierta?: { partes: Parte[]; botones?: string[] };
  bloqueActual: number;
  terminada: boolean;
  familia: PreguntaFamilia[];
  repreguntas?: Repregunta[];
  cazador?: { gastoUsd: number; escenasContadas: string[]; registro: RegistroCaza[] };
  /** Los mensajes tal como salieron (y lo que contestó). */
  charla: Globo[];
  /** La cola de WhatsApp: lo que todavía no salió. Un envío que falla queda acá y se reintenta. */
  salientes: Saliente[];
  /** El último id de saliente usado. */
  seq: number;
  /** El último mensaje que mandó el narrador (ventana de 24 h de Meta). */
  ultimoEntranteAt?: string;
  /** Cuándo se mandó la pregunta abierta (M8 sale a los 2 días sin respuesta). */
  abiertaDesde?: string;
  /** La clave en la que ya salió M8 (una sola vez por pregunta). */
  m8En?: string;
  /** M22 ya salió (una sola vez en toda la entrevista). */
  m22Enviado?: boolean;
  fallosEnvio: number;
  avisoFallos?: boolean;
};

export type Genero = 'varon' | 'mujer' | 'otro';
export type FichaFila = { nombre: string; genero: Genero; formaTrato?: 'masculino' | 'femenino'; quienRegala?: string };
export type MigradaDe = { de: 'v-vieja'; dia_actual: number };

export type FilaV3 = {
  narrador_id: string;
  idioma: Idioma;
  ficha: FichaFila;
  estado: EstadoV3;
  version: number;
  ultimo_audio_at: string | null;
  tanda_dia: string | null;
  tanda_cuenta: number;
  enviando_hasta: string | null;
  creada_at: string;
  migrada_de: MigradaDe | null;
};

/** Lo que la V3 necesita de `narradores` (compatible con `Narrador` de flujo/preguntar.ts). */
export type NarradorV3 = {
  id: string;
  familia_id: string;
  como_le_dicen: string;
  telefono_whatsapp: string;
  hora_preferida: string;
  zona_horaria: string;
  contexto: Record<string, any>;
  estado: string;
  dia_actual: number;
  ultima_respuesta_at: string | null;
};

/** La respuesta de FO1 cuando llega la foto (la fábrica la saca al armar el material). */
export const MARCA_FOTO = '⟦foto⟧';

export function estadoInicial(familia: PreguntaFamilia[] = []): EstadoV3 {
  return {
    formato: 1,
    respuestas: [],
    enviados: [],
    vueltas: vueltasEnCero(),
    bloqueActual: 0,
    terminada: false,
    familia,
    charla: [],
    salientes: [],
    seq: 0,
    fallosEnvio: 0,
  };
}

/** La ficha que usan los textos del núcleo. Sin `idioma` para es-AR: así la arma también la fábrica. */
export function fichaTexto(fila: Pick<FilaV3, 'ficha' | 'idioma'>): FichaTexto {
  const f = fila.ficha;
  return {
    nombre: f.nombre,
    genero: f.genero,
    ...(f.formaTrato ? { formaTrato: f.formaTrato } : {}),
    ...(f.quienRegala ? { quienRegala: f.quienRegala } : {}),
    ...(fila.idioma !== 'es-AR' ? { idioma: fila.idioma } : {}),
  };
}

export function esGenero(x: unknown): x is Genero {
  return x === 'varon' || x === 'mujer' || x === 'otro';
}
