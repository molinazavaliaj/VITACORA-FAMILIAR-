// Los tipos de «Vitácora de una historia» en WhatsApp: la fila de `historias`
// (supabase/migrations/20261023000000_historias.sql) y su `estado` (jsonb).
// Copia de src/v3/tipos.ts sin lo de la vida entera (la familia, el botón
// «Sí» con M30, OR6 con el nombre de pila, la migración de la entrevista
// vieja) y con lo propio de historia: la bienvenida y el SÍ, el tema abierto,
// las preguntas de quien regala. Puro: sin base ni red.

import type { Descartada, ResultadoCaza } from './nucleo/entrevista/cazador.js';
import type { Repregunta } from './nucleo/entrevista/flujo.js';
import type { Idioma } from './nucleo/entrevista/idioma.js';
import { vueltasEnCero, type AcusePendiente, type Vueltas } from './nucleo/entrevista/mensajes.js';
import { esTema, type TemaHistoria } from './nucleo/entrevista/temas.js';
import type { FichaTexto } from './nucleo/entrevista/texto.js';
import type { Genero } from './nucleo/ficha.js';

export type { Genero } from './nucleo/ficha.js';

/** Una línea de un mensaje, con el ID del banco de donde sale. */
export type Parte = { id: string; texto: string };

/** Un globo de la charla (el mismo formato que V3: lo va a leer el material del escritor). */
export type Globo =
  | { de: 'bio'; partes: Parte[]; botones?: string[] }
  | { de: 'persona'; pregunta: string; texto: string; boton?: string }
  | { de: 'bloque'; bloque: number; nombre: string };

/** Lo que se anota de cada llamada al cazador (como en V3). */
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
 * pregunta); `suelto`: M22, M23, el acuse de una foto, la pausa;
 * `recordatorio`: M8 (fuera de las 24 h sale con la plantilla de
 * recordatorio); `bienvenida`: BIEN-H, BIEN-HR o BIEN-HR-A como texto (la
 * ventana está abierta porque escribió).
 */
export type TipoSaliente = 'turno' | 'suelto' | 'recordatorio' | 'bienvenida';
export type Saliente = { id: number; texto: string; botones?: string[]; tipo: TipoSaliente };

/**
 * En qué parte está (banco.md, "Reglas del flujo" 1 a 3):
 * `bienvenida`: le llegó (o tiene que llegarle) BIEN-H y se espera el SÍ;
 * `tema`: dijo SÍ con el tema abierto y se espera que elija su historia (TEMA-ABIERTO, TEMA-LISTA);
 * `entrevista`: salió COMO y van las preguntas.
 */
export type Fase = 'bienvenida' | 'tema' | 'entrevista';

/** La clave con que se guarda lo que contestó en TEMA-ABIERTO (`respuestas.clave_historia = 'TEMA'`, CONTRATO). */
export const CLAVE_TEMA = 'TEMA';

export type EstadoHistoria = {
  formato: 1;
  fase: Fase;
  /** El narrador elige su historia (quien regala dejó el tema abierto): va TEMA-ABIERTO y después HC1-A. */
  temaAbierto: boolean;
  /** TEMA-LISTA ya salió (una sola vez). */
  temaLista?: boolean;
  /** Ya se avisó a los socios que sigue sin elegir historia después de TEMA-LISTA. */
  temaSinElegirAvisado?: boolean;
  /** Las preguntas de quien regala, en el orden de la compra (hasta 3; las copia el alta de `compra`). */
  propias: string[];
  /** Respuestas en el orden en que llegaron: [clave, texto]. Es la verdad de la entrevista. */
  respuestas: [string, string][];
  /** Lo que se mandó y no espera respuesta (FIN-H), o FOTO-H si pasaron 24 h sin foto. */
  enviados: string[];
  vueltas: Vueltas;
  /** El acuse de la última respuesta, pendiente de armarse con lo que se mande después. */
  acuse?: AcusePendiente;
  /** La clave que espera respuesta (un ID del banco, TEMA, FOTO-H, PR-H1…, RP~X). */
  esperando?: string;
  /** Las transcripciones de la abierta, sumadas, hasta que el reloj cierre la respuesta. */
  borrador?: string;
  /** La pregunta abierta sin acuse, para reenviarla tal cual (vuelta de una pausa, o con botones después de una plantilla). */
  preguntaAbierta?: { partes: Parte[]; botones?: string[] };
  bloqueActual: number;
  terminada: boolean;
  repreguntas?: Repregunta[];
  cazador?: { gastoUsd: number; escenasContadas: string[]; registro: RegistroCaza[] };
  /** Los mensajes tal como salieron (y lo que contestó). */
  charla: Globo[];
  /** La cola de WhatsApp: lo que todavía no salió. Un envío que falla queda acá y se reintenta. */
  salientes: Saliente[];
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
  /** Los últimos WAMIDS_VISTOS wa_message_id ya aplicados al estado (o dejados de lado a propósito). */
  wamidsVistos?: string[];
  /** La pregunta abierta salió por plantilla (fuera de la ventana): sin botones. */
  abiertaPorPlantilla?: boolean;
  /** Las claves que el narrador pidió que no vayan al libro (como en V3). */
  reservadas?: string[];
  /** La bienvenida (plantilla de Meta o texto): cuándo salió y cómo. */
  bienvenida?: { en: string; por: 'plantilla' | 'texto' };
  /** Antes del SÍ ya se le contestó una vez algo que no era SÍ (`noEntendi` / `noQuiere`): después, silencio. */
  sePidioSi?: boolean;
  /** Cuándo se avisó a los socios que no aceptó en DIAS_PARA_NO_ACEPTO días (una sola vez). */
  avisoNoAcepto?: string;
};

/**
 * La ficha de la fila: `FichaHistoria` de la fábrica (`nucleo/ficha.ts`) más
 * quién regala. `nombre` es como le dicen (`narradores.como_le_dicen`).
 */
export type FichaFila = {
  nombre: string;
  genero: Genero;
  formaTrato?: 'masculino' | 'femenino';
  quienRegala?: string;
  tema: TemaHistoria;
  temaLibre?: string;
};

export type CompraHistoria = { preguntasPropias?: string[] };

export type FilaHistoria = {
  narrador_id: string;
  idioma: Idioma;
  ficha: FichaFila;
  compra: CompraHistoria;
  estado: EstadoHistoria;
  version: number;
  ultimo_audio_at: string | null;
  tanda_dia: string | null;
  tanda_cuenta: number;
  enviando_hasta: string | null;
  creada_at: string;
};

/** Lo que historia necesita de `narradores`. */
export type NarradorHistoria = {
  id: string;
  familia_id: string;
  como_le_dicen: string;
  nombre?: string | null;
  telefono_whatsapp: string;
  hora_preferida: string;
  zona_horaria: string;
  contexto: Record<string, any>;
  estado: string;
  dia_actual: number;
  ultima_respuesta_at: string | null;
};

/** La respuesta de FOTO-H cuando llega la foto (la fábrica la saca al armar el material). Igual que en V3. */
export const MARCA_FOTO = '⟦foto⟧';

/**
 * `respuestas.clave_historia` de una fila que se guardó y NO entra a la
 * entrevista a propósito (CONTRATO). La reconciliación del reloj la saltea.
 */
export const SIN_CLAVE_HISTORIA = '∅';

/** Cuántos wa_message_id recuerda el estado (`wamidsVistos`). */
export const WAMIDS_VISTOS = 50;

export function estadoInicial(o: { temaAbierto: boolean; propias: string[] }): EstadoHistoria {
  return {
    formato: 1,
    fase: 'bienvenida',
    temaAbierto: o.temaAbierto,
    propias: [...o.propias],
    respuestas: [],
    enviados: [],
    vueltas: vueltasEnCero(),
    bloqueActual: 0,
    terminada: false,
    charla: [],
    salientes: [],
    seq: 0,
    fallosEnvio: 0,
  };
}

/** La ficha que usan los textos del núcleo. Sin `idioma` para es-AR, como en V3. */
export function fichaTexto(fila: Pick<FilaHistoria, 'ficha' | 'idioma'>): FichaTexto {
  const f = fila.ficha;
  return {
    nombre: f.nombre,
    genero: f.genero,
    ...(f.formaTrato ? { formaTrato: f.formaTrato } : {}),
    ...(f.quienRegala ? { quienRegala: f.quienRegala } : {}),
    tema: f.tema,
    ...(f.temaLibre ? { temaLibre: f.temaLibre } : {}),
    ...(fila.idioma !== 'es-AR' ? { idioma: fila.idioma } : {}),
  };
}

export function esGenero(x: unknown): x is Genero {
  return x === 'varon' || x === 'mujer' || x === 'otro';
}

export { esTema };
