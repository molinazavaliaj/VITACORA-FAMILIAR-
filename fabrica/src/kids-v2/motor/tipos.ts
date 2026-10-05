// Tipos del motor de Kids V2: eventos que entran, salidas que salen y el
// estado de un chico. Todo serializable a JSON (lo guarda quien conecte el
// motor a WhatsApp).

import type { Ficha, ItemGuion } from '../compra.js';

/** Lo que manda el chico (o el padre en canal B). La transcripción la pone quien conecta (no es un modelo que decide). */
export type Contenido = { tipo: 'audio'; seg: number; transcripcion?: string } | { tipo: 'texto'; texto: string } | { tipo: 'foto' };

export type Evento =
  /** Pagó: arranca. */
  | { tipo: 'inicio' }
  | { tipo: 'respuesta'; contenido: Contenido }
  /** Tocó un botón: el texto del botón, tal cual. */
  | { tipo: 'boton'; boton: string }
  /** Pasa el tiempo: quien conecta lo llama en `proximoDespertar` (o cada minuto). */
  | { tipo: 'reloj' }
  /** El padre cambió algo en el panel (#34): la hora, los temas, sus preguntas. */
  | { tipo: 'ficha'; cambios: Partial<Pick<Ficha, 'hora' | 'temasSacados' | 'preguntasPadre'>> };

/** A qué número va: en canal B todo lo del chico va al número del padre. */
export type Destino = 'chico' | 'padre';

export type Mensaje = {
  a: Destino;
  /** ID del banco (K12, ACUSE-3, B-SEGUIR…) o derivado (K12-R1, K12-OP, K10-FOTO, PADRE-1). */
  id: string;
  texto: string;
  botones: string[];
  /** Si sale como plantilla de Meta: nombre y variables {{1}}, {{2}}… */
  plantilla: { nombre: string; variables: string[] } | null;
};

export type MotivoMarca = 'preocupante' | 'silencio-8-dias' | 'escribio-despues-del-final' | 'cerro-sin-respuesta';

export type Salida = ({ tipo: 'mensaje' } & Mensaje) | { tipo: 'marca'; motivo: MotivoMarca; detalle: string };

/** Qué estamos esperando. */
export type Fase =
  | { tipo: 'sin-empezar' }
  | { tipo: 'bienvenida' }
  /** Una principal, una pregunta del padre o una extra, sin contestar. `rama`: el botón propio que tocó (K12…). */
  | { tipo: 'pregunta'; clave: string; rama: string | null; pasoRama: number }
  | { tipo: 'op'; clave: string }
  | { tipo: 'foto'; clave: string }
  /** Después de [No tengo] o [Hoy no la como]: espera un audio, hasta ESPERA_AUDIO_FOTO_MS. */
  | { tipo: 'foto-audio'; clave: string; desde: string }
  | { tipo: 'seguir' }
  | { tipo: 'aviso-seria' }
  | { tipo: 'tranquila' }
  | { tipo: 'una-mas' }
  | { tipo: 'cierre' }
  /** Tocó [Sí, hay algo]: espera lo que cuente. */
  | { tipo: 'cierre-cuenta' }
  | { tipo: 'extras-oferta' }
  | { tipo: 'extras-otra' }
  /** Salió PREG-NUEVA (más de 24 h, o canal B): lo que correspondía espera el botón. */
  | { tipo: 'retenido'; mensajes: Mensaje[]; luego: Fase }
  /** Nada pendiente: a la hora sale el item `siguiente` del guion. */
  | { tipo: 'libre'; siguiente: number }
  | { tipo: 'terminado' };

/** Lo que va llegando antes de los 90 s de silencio. */
export type Rafaga = { desde: string; ultima: string; seg: number; palabras: number; fotos: number; textos: string[] };

export type Estado = {
  ficha: Ficha;
  guion: ItemGuion[];
  fase: Fase;
  /** El item del guion en curso (o el último que empezó). -1 antes de K1. */
  cursor: number;
  /** La extra en curso (una más de un capítulo, o del final). */
  extra: string | null;
  /** El item en curso tuvo respuesta (no "paso"): para B-TRANQUILA después de K39. */
  conto: boolean;
  opsUsadas: string[];
  extrasUsadas: string[];
  hermanos: boolean | null;
  peleaK36: boolean;
  rotacion: { acuse: string | null; foto: string | null; diaFeo: string | null };
  rafaga: Rafaga | null;
  /** Lo que llegó entre las 22 y las 9: se procesa a las 9. */
  nocturnos: Evento[];
  /** ISO. */
  inicio: string | null;
  /** ISO: el último mensaje o botón del número de las preguntas (ventana de 24 h, recordatorios). */
  ultimaEntrada: string | null;
  /** Fecha local del último día que ya tuvo su principal (o dijo "mañana", o le llegó algo que espera un botón: decisiones 6 y 10). */
  diaHecho: string | null;
  /** Fecha local del último día en que corrió "la hora". */
  horaHecha: string | null;
  /** ISO: hasta cuándo dura "ese día" después de algo preocupante. */
  sobrioHasta: string | null;
  /** Recordatorios al padre en este silencio: 0, 1 (4 días), 2 (8 días + marca). */
  recordatorios: number;
  /** Canal B: salió RECORD-B y su [Estamos listos] tiene que volver a mandar la pregunta pendiente. */
  reenviar: boolean;
  /** Canal B: fecha local en que sale TERMINO-PADRE (al día siguiente, a la hora). */
  terminoPadre: string | null;
  /** ISO: cuándo empezó la oferta de extras del final (para el cierre solo a los 2 días). */
  extrasDesde: string | null;
  /** IDs de las principales cuya foto pegada venció o se perdió: vuelven a ofrecerse al final. */
  fotosVencidas: string[];
};
