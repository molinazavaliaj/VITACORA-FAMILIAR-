// El flujo de la entrevista (docs/v3/entrevista/banco.md, "Reglas del
// flujo"): qué cuenta como "no" corto, si una pregunta se manda según las
// respuestas, cuál es la próxima, qué acuse va después y qué dudas deja la
// ficha contra las respuestas. Todo puro, sin I/O: el entrevistador guarda el
// estado y llama a estas funciones.

import { estado, type FichaV3 } from '../ficha.js';
import { BANCO, condicionesDe, mensajePorId, preguntaPorId, type Boton, type CondicionSimple, type PreguntaEntrevista, type ValeBoton } from './banco.js';
import { habilitaLasQueDependen, interpretar, PREGUNTA_COMUN, respuestaDeBoton, valeBoton, type Interpretacion, type PreguntaParaInterpretar } from './respuesta.js';

/** Respuesta a una pregunta: el texto (transcripción) o lo que dijo, incluido "paso". */
export type Respuesta = string;
/** Respuestas por ID de pregunta. Solo están las preguntas que se mandaron y se contestaron. */
export type Respuestas = ReadonlyMap<string, Respuesta>;

// ---------------------------------------------------------------- respuestas

// Qué dijo la persona lo decide una sola función, `interpretar` (respuesta.ts;
// Naza, 30/09, simulaciones). Estas son las preguntas que le hacen los demás
// módulos; todas pasan por ahí, con la pregunta para saber el tope del "no".

export { normalizar, PALABRAS_NO_CORTO } from './respuesta.js';

// ---------------------------------------------------------------- claves que no son del banco

/**
 * Las 8 preguntas que piden un día y su segunda oportunidad (Naza, 01/10,
 * chat "La entrevista trae escenas"): la salida "contame en general" ya no va
 * en la pregunta (con la salida a la vista, el día no llegaba); va sola,
 * después de un olvido puro, una sola vez.
 */
export const PIDEN_DIA: Readonly<Record<string, string>> = {
  CA16: 'M33.1',
  AD5: 'M33.2',
  JU12: 'M33.3',
  TR5: 'M33.4',
  HG4: 'M33.5',
  GI2: 'M33.6',
  GI9: 'M33.7',
  HO2: 'M33.8',
};

/** Lo que contesta en la segunda oportunidad de X se guarda como "X~2" (no es un ID del banco). */
export const SUFIJO_SEGUNDA = '~2';
/** Lo que contesta a una repregunta del cazador sobre la respuesta X se guarda como "RP~X". */
export const PREFIJO_REPREGUNTA = 'RP~';

export function claveSegunda(id: string): string {
  return `${id}${SUFIJO_SEGUNDA}`;
}

/** Si la clave es "X~2" de una de las 8, X; si no, undefined. */
export function deSegunda(clave: string): string | undefined {
  if (!clave.endsWith(SUFIJO_SEGUNDA)) return undefined;
  const id = clave.slice(0, -SUFIJO_SEGUNDA.length);
  return PIDEN_DIA[id] ? id : undefined;
}

export function claveRepregunta(origen: string): string {
  return `${PREFIJO_REPREGUNTA}${origen}`;
}

/** Si la clave es "RP~X", X; si no, undefined. */
export function deRepregunta(clave: string): string | undefined {
  return clave.startsWith(PREFIJO_REPREGUNTA) ? clave.slice(PREFIJO_REPREGUNTA.length) : undefined;
}

/**
 * El único botón de una repregunta del cazador: [Ya lo conté todo], que vale
 * "no" (Naza, 01/10). Va acá y no en el banco porque la repregunta no es una
 * fila del banco.
 */
export const BOTON_YA_LO_CONTE: Boton = { texto: 'Ya lo conté todo', vale: 'no' };

/**
 * Una repregunta del cazador de escenas (Naza, 01/10; cazador.ts): sobre la
 * respuesta `origen` (un ID del banco) del bloque `bloque`, con la `cita`
 * textual y la `pregunta` que escribió el modelo; `tema` es el momento que
 * pide, para que no se repita. Lo que contesta se guarda con `clave`
 * ("RP~<origen>").
 */
export type Repregunta = { clave: string; origen: string; bloque: number; cita: string; pregunta: string; tema: string };

/** Lo que hace falta de una pregunta para interpretar su respuesta y elegir el acuse. */
export type PreguntaDeClave = PreguntaParaInterpretar & Pick<PreguntaEntrevista, 'bloque'>;

/**
 * La pregunta detrás de una clave de `respuestas`: la del banco; o, para
 * "X~2", una común del bloque de X con el texto de su segunda oportunidad
 * (así lo que repite el mensaje no es un "pedacito"); o, para "RP~X", una
 * común del bloque de X con el botón [Ya lo conté todo]. Una de la familia
 * (o una clave desconocida) da undefined.
 */
export function preguntaDeClave(clave: string): PreguntaDeClave | undefined {
  const delBanco = preguntaPorId(clave);
  if (delBanco) return delBanco;
  const x = deSegunda(clave);
  if (x) return { id: clave, bloque: preguntaPorId(x)!.bloque, clase: 'historia', sensible: false, texto: mensajePorId(PIDEN_DIA[x])?.texto };
  const origen = deRepregunta(clave);
  if (origen !== undefined) return { id: clave, bloque: preguntaPorId(origen)?.bloque ?? 0, clase: 'historia', sensible: false, botones: [BOTON_YA_LO_CONTE] };
  return undefined;
}

/** Los botones de lo que está esperando respuesta: los del banco, o [Ya lo conté todo] en una repregunta. */
export function botonesDeClave(clave: string): readonly Boton[] | undefined {
  return preguntaDeClave(clave)?.botones;
}

/** La pregunta del banco con ese ID (o la de una clave X~2 / RP~X); si no está (una de la familia), una común. */
function preguntaDe(id: string): PreguntaParaInterpretar {
  return preguntaDeClave(id) ?? { ...PREGUNTA_COMUN, id };
}

/** ¿Dijo "paso"? (o tocó [Prefiero no contarla]). Sin pregunta, se toma como una común. */
export function esPaso(respuesta: Respuesta, pregunta: PreguntaParaInterpretar = PREGUNTA_COMUN): boolean {
  return interpretar(pregunta, respuesta) === 'paso';
}

/**
 * ¿Fue un "no" corto (o tocó un botón de "No")? Hasta 15 palabras en una
 * común y hasta 40 en cierres, LE9, sensibles y las que abren tema (Naza,
 * 30/09, simulaciones; antes: menos de 15 en todas). Sin pregunta, se toma
 * como una común.
 */
export function esNoCorto(respuesta: Respuesta, pregunta: PreguntaParaInterpretar = PREGUNTA_COMUN): boolean {
  return interpretar(pregunta, respuesta) === 'no';
}

/** Qué dijo en la pregunta X (undefined si X no se contestó). */
export function interpretacionDe(respuestas: Respuestas, id: string): Interpretacion | undefined {
  const r = respuestas.get(id);
  return r === undefined ? undefined : interpretar(preguntaDe(id), r);
}

/** X se contestó con un "no" corto o un botón de "No". */
export function respondioNo(respuestas: Respuestas, id: string): boolean {
  return interpretacionDe(respuestas, id) === 'no';
}

/** X se contestó contando algo (o tocando "Sí", o con un "ya te lo conté"): no un "no", un "paso", un olvido ni nada. */
export function contoAlgo(respuestas: Respuestas, id: string): boolean {
  const i = interpretacionDe(respuestas, id);
  // Ronda 2 (Naza, 30/09): el olvido a medias y el que se niega pero sigue contando también contaron algo.
  return i === 'conto' || i === 'ya-conto' || i === 'olvido-a-medias' || i === 'no-ahondar';
}

/**
 * ¿Se manda la pregunta, según sus condiciones? Sin condiciones, sí. Con
 * varias, alcanza una (OR). `si:X` pide que X haya sido un "sí": tocó "Sí",
 * contó algo, dijo "ya te lo conté" o no se acordó (un olvido cuenta como
 * "sí": mejor una pregunta de más que un capítulo de menos; Naza, 30/09,
 * simulaciones). `sino:X` pide que X haya sido un "no" corto o un botón de
 * "No". `paso:X` pide que X haya sido "paso" (ronda 2; hoy sin uso). Si X no
 * se mandó, no se cumple ninguna. Un término con " y " pide todas sus
 * condiciones (AM19: `sino:AMH y si:AM3`, solo si esa persona ya no está y
 * convivieron).
 */
export function cumple(pregunta: Pick<PreguntaEntrevista, 'depende'>, respuestas: Respuestas): boolean {
  if (pregunta.depende.length === 0) return true;
  const simple = (c: CondicionSimple) => {
    const i = interpretacionDe(respuestas, c.de);
    if (i === undefined) return false;
    return c.tipo === 'si' ? habilitaLasQueDependen(i) : c.tipo === 'sino' ? i === 'no' : i === 'paso';
  };
  return pregunta.depende.some((c) => condicionesDe(c).every(simple));
}

// ---------------------------------------------------------------- orden

/** Una pregunta que manda la familia (va con M15, al final). */
export type PreguntaFamilia = { id: string; texto: string };

export type RondaExtra = 'sin-ofrecer' | 'aceptada' | 'rechazada';

export type EstadoEntrevista = {
  /**
   * Preguntas contestadas (incluye "paso"), del banco y de la familia, en el
   * orden en que llegaron. Desde el 01/10 también "X~2" (la segunda
   * oportunidad de X) y "RP~X" (la repregunta del cazador sobre X).
   */
  respuestas: Respuestas;
  /** Lo que se mandó y no espera respuesta (AV11, FIN). */
  enviados?: ReadonlySet<string>;
  /** Si no viene: 'sin-ofrecer' cuando `ofrecerExtra`, y si no 'rechazada' (no se ofrece). */
  rondaExtra?: RondaExtra;
  /** ¿Se ofrece la ronda extra al terminar el núcleo? Por ahora no (Naza, 30/09: "ya dijimos que acá estaba todo"). */
  ofrecerExtra?: boolean;
  /** Preguntas de la familia, en el orden en que llegaron. */
  familia?: readonly PreguntaFamilia[];
  /**
   * La cola de repreguntas del cazador (Naza, 01/10): las que entraron, en
   * orden; las que ya tienen respuesta ("RP~X" en `respuestas`) no salen más.
   */
  repreguntas?: readonly Repregunta[];
};

export type Siguiente =
  /**
   * Mandar la pregunta; si `conM1`, con M1 abajo en línea aparte y en
   * cursiva. Si viene `entrada` (EN2…EN15), mandar antes ese mensaje: es la
   * primera pregunta que se manda de su bloque (Naza, 30/09).
   * Desde las simulaciones (Naza, 30/09): `botones`, los botones de
   * respuesta que van debajo del mensaje (si lleva); `ayudaBotones`, si es el
   * primer mensaje con botones de la entrevista (va M31 debajo, una sola vez);
   * `esperaFoto`, en FO1: no corre el reloj de minutos, se espera una foto o un
   * audio (el tope de 24 horas y pegar la foto a FO1 los hace el entrevistador).
   */
  | {
      tipo: 'pregunta';
      pregunta: PreguntaEntrevista;
      conM1: boolean;
      esperaRespuesta: boolean;
      entrada?: string;
      botones?: readonly Boton[];
      ayudaBotones?: true;
      esperaFoto?: true;
    }
  /**
   * La segunda oportunidad de `de` (Naza, 01/10): mandar el mensaje `mensaje`
   * (M33.n) solo, sin acuse delante, y esperar respuesta; lo que conteste se
   * guarda con la clave `clave` ("CA16~2").
   */
  | { tipo: 'segunda-oportunidad'; de: string; mensaje: string; clave: string }
  /**
   * Una repregunta del cazador (Naza, 01/10): mandar `mensajeRepregunta`
   * (cazador.ts) con `botones` ([Ya lo conté todo]) y esperar respuesta; lo
   * que conteste se guarda con `repregunta.clave` ("RP~CA2").
   */
  | { tipo: 'repregunta'; repregunta: Repregunta; botones: readonly Boton[] }
  /** Mandar M15 y después la pregunta de la familia. */
  | { tipo: 'familia'; pregunta: PreguntaFamilia; antes: 'M15' }
  /** Terminó el núcleo: ofrecer la ronda extra (texto a redactar con Fable, pendiente de Naza). */
  | { tipo: 'ofrecer-extra' }
  /** No queda nada por mandar. */
  | { tipo: 'terminada' };

/** Bloque que se manda entero al final (legado: LE1, LE2, FU1, LE7, la familia, FO1, LE9, LE8 y FIN). */
export const BLOQUE_FINAL = 15;
/** Las preguntas de la familia van antes de esta: después de LE7 y antes de FO1, LE9 y LE8 (Naza, 30/09, ronda 2). */
export const FAMILIA_ANTES_DE = 'FO1';

/** ¿Espera respuesta? El aviso y el mensaje final no. */
export function esperaRespuesta(p: Pick<PreguntaEntrevista, 'clase'>): boolean {
  return p.clase !== 'aviso' && p.clase !== 'final';
}

/** M1 va debajo de las primeras preguntas que se mandan: estas. */
export const M1_PRIMERAS = 3;
/** Las preguntas que abren un tema llevan M1 (Naza, 30/09). */
export const M1_ABREN_TEMA: readonly string[] = ['CA6', 'JU8', 'AM0', 'AM9', 'HI0', 'HI8'];
/** Todas las preguntas de historia de este bloque (momentos difíciles) llevan M1. */
export const M1_BLOQUE = 11;

/**
 * ¿Va M1 debajo? Solo en preguntas de historia, y solo en las 3 primeras que
 * se mandan, en las que abren un tema y en las del bloque 11 (Naza, 30/09,
 * después de leer la entrevista de corrido: debajo de todas se repetía).
 */
export function llevaM1(p: Pick<PreguntaEntrevista, 'id' | 'bloque' | 'clase'>, respuestas: Respuestas, banco: readonly PreguntaEntrevista[] = BANCO): boolean {
  if (p.clase !== 'historia') return false;
  if (M1_ABREN_TEMA.includes(p.id) || p.bloque === M1_BLOQUE) return true;
  const yaContestadas = banco.filter((q) => q.clase === 'historia' && respuestas.has(q.id)).length;
  return yaContestadas < M1_PRIMERAS;
}

/** El ID de la frase de entrada de un bloque (EN2…), si el bloque tiene. */
export function entradaDeBloque(bloque: number): string | undefined {
  const id = `EN${bloque}`;
  return mensajePorId(id) ? id : undefined;
}

function comoSiguiente(p: PreguntaEntrevista, respuestas: Respuestas, banco: readonly PreguntaEntrevista[], hecha: (id: string) => boolean): Siguiente {
  const primeraDelBloque = !banco.some((q) => q.bloque === p.bloque && hecha(q.id));
  const entrada = primeraDelBloque ? entradaDeBloque(p.bloque) : undefined;
  // M31 va una sola vez: debajo del primer mensaje con botones que se manda (regla 8).
  const ayudaBotones = p.botones !== undefined && !banco.some((q) => q.botones && q.id !== p.id && hecha(q.id));
  return {
    tipo: 'pregunta',
    pregunta: p,
    conM1: llevaM1(p, respuestas, banco),
    esperaRespuesta: esperaRespuesta(p),
    ...(entrada ? { entrada } : {}),
    ...(p.botones ? { botones: p.botones } : {}),
    ...(ayudaBotones ? { ayudaBotones: true as const } : {}),
    ...(p.clase === 'foto' ? { esperaFoto: true as const } : {}),
  };
}

/** Qué hacer cuando la persona toca un botón (reglas 2 a 5). */
export type AlTocarBoton =
  /** "Sí": se manda M30 ("Contame, te escucho.") solo y se sigue esperando audio en la misma pregunta; los audios se suman a `respuesta`. */
  | { vale: 'si'; respuesta: string; mandar: 'M30'; esperaAudio: true }
  /** "No" o "Prefiero no contarla" (y el "Sí" de AMH, que no pide audio): la respuesta queda cerrada así y sigue el flujo (acuse y siguiente pregunta). */
  | { vale: ValeBoton; respuesta: string; esperaAudio: false };

/**
 * Preguntas de ubicación: su botón de "Sí" no pide audio (no va M30), cierra
 * la respuesta. AMH, "¿Hoy estás en pareja?" (Naza, 30/09, prueba en la
 * página; antes "¿esa persona sigue hoy a tu lado?").
 */
export const SI_SIN_AUDIO: readonly string[] = ['AMH'];

/**
 * Tocó un botón: la respuesta que se guarda (la marca del botón; si después
 * manda audio, se suma atrás con `sumarAudio`) y qué sigue. Con "Sí", M30 y
 * esperar el audio; con "No" o "Paso", seguir (Naza, 30/09, simulaciones).
 */
export function alTocarBoton(pregunta: Pick<PreguntaParaInterpretar, 'botones'> & { id?: string }, texto: string): AlTocarBoton {
  const vale = valeBoton(pregunta, texto);
  const respuesta = respuestaDeBoton(texto);
  const pideAudio = vale === 'si' && !SI_SIN_AUDIO.includes(pregunta.id ?? '');
  return pideAudio ? { vale, respuesta, mandar: 'M30', esperaAudio: true } : { vale, respuesta, esperaAudio: false };
}

/**
 * La próxima cosa para mandar. Orden (banco.md, Reglas del flujo y Dudas 3-4):
 *   1. el núcleo de los bloques 1 a 14, en orden, salteando lo que no cumple;
 *   2. la oferta de la ronda extra;
 *   3. si la aceptó, las extra de los bloques 1 a 14, en orden;
 *   4. el bloque 15 (con LE6 solo si aceptó la extra), y las preguntas de
 *      la familia justo antes de FO1.
 * Una pregunta ya está hecha si tiene respuesta o figura en `enviados`.
 * Antes de todo eso, la segunda oportunidad, si la última respuesta fue un
 * olvido puro en una de las 8 que piden un día (Naza, 01/10).
 */
export function siguientePregunta(e: EstadoEntrevista, banco: readonly PreguntaEntrevista[] = BANCO): Siguiente {
  const segunda = segundaOportunidad(e.respuestas);
  if (segunda) return segunda;
  const delBanco = siguienteDelBanco(e, banco);
  const repregunta = repreguntaLista(e, delBanco);
  return repregunta ? { tipo: 'repregunta', repregunta, botones: [BOTON_YA_LO_CONTE] } : delBanco;
}

/** Cuántas respuestas del banco tienen que pasar después de la de origen para mandar su repregunta (Naza, 01/10). */
export const RESPUESTAS_ANTES_DE_REPREGUNTAR = 3;

/**
 * ¿Sale una repregunta de la cola? La primera pendiente que ya tiene 3 o más
 * respuestas del banco después de la de origen (las X~2, RP~X y las de la
 * familia no cuentan), si lo último que contestó no fue una repregunta:
 * nunca dos seguidas. Antes de entrar al bloque 15 (o a la familia, o al
 * final) salen todas las que queden, aunque no hayan pasado 3 y aunque vayan
 * seguidas: después ya no hay dónde (plan, B2).
 */
function repreguntaLista(e: EstadoEntrevista, delBanco: Siguiente): Repregunta | undefined {
  const pendientes = (e.repreguntas ?? []).filter((r) => !e.respuestas.has(r.clave));
  if (pendientes.length === 0) return undefined;
  const entraAlFinal = delBanco.tipo === 'familia' || delBanco.tipo === 'terminada' || (delBanco.tipo === 'pregunta' && delBanco.pregunta.bloque === BLOQUE_FINAL);
  if (entraAlFinal) return pendientes[0];
  const claves = [...e.respuestas.keys()];
  const ultima = claves.at(-1);
  if (ultima !== undefined && deRepregunta(ultima) !== undefined) return undefined;
  return pendientes.find((r) => {
    const desde = claves.indexOf(r.origen);
    if (desde < 0) return false;
    return claves.slice(desde + 1).filter((k) => preguntaPorId(k) !== undefined).length >= RESPUESTAS_ANTES_DE_REPREGUNTAR;
  });
}

/**
 * ¿Toca la segunda oportunidad? Solo si lo último que contestó fue una de
 * las 8 que piden un día, con un olvido puro (no a medias, ni "paso", ni un
 * "no" corto, ni un botón), y todavía no contestó su "X~2": una sola vez por
 * pregunta (Naza, 01/10).
 */
function segundaOportunidad(respuestas: Respuestas): Siguiente | undefined {
  let ultima: [string, Respuesta] | undefined;
  for (const par of respuestas) ultima = par;
  if (!ultima) return undefined;
  const [id, r] = ultima;
  const mensaje = PIDEN_DIA[id];
  if (!mensaje || respuestas.has(claveSegunda(id)) || interpretar(preguntaDe(id), r) !== 'olvido') return undefined;
  return { tipo: 'segunda-oportunidad', de: id, mensaje, clave: claveSegunda(id) };
}

/** Lo que sigue del banco (y la familia), sin la segunda oportunidad. */
function siguienteDelBanco(e: EstadoEntrevista, banco: readonly PreguntaEntrevista[]): Siguiente {
  const enviados = e.enviados ?? new Set<string>();
  const ronda = e.rondaExtra ?? (e.ofrecerExtra ? 'sin-ofrecer' : 'rechazada');
  const hecha = (id: string) => e.respuestas.has(id) || enviados.has(id);
  const pendiente = (p: PreguntaEntrevista) => !hecha(p.id) && cumple(p, e.respuestas);

  // Desde el 30/09 todos los cierres son del núcleo (llegan siempre), así que
  // ya no hace falta la regla de "paso en una pregunta que abre tema → el
  // cierre va en el núcleo aunque sea extra" (correcciones-lectura.md).
  const vaEnNucleo = (p: PreguntaEntrevista) => p.parte === 'nucleo';

  const principal = banco.filter((p) => p.bloque !== BLOQUE_FINAL);
  for (const p of principal) if (vaEnNucleo(p) && pendiente(p)) return comoSiguiente(p, e.respuestas, banco, hecha);

  if (ronda === 'sin-ofrecer') return { tipo: 'ofrecer-extra' };
  if (ronda === 'aceptada') for (const p of principal) if (p.parte === 'extra' && pendiente(p)) return comoSiguiente(p, e.respuestas, banco, hecha);

  const final = banco.filter((p) => p.bloque === BLOQUE_FINAL && (p.parte === 'nucleo' || ronda === 'aceptada'));
  const ordenFamilia = banco.find((p) => p.id === FAMILIA_ANTES_DE)?.orden ?? Infinity;
  const familia = (e.familia ?? []).find((f) => !e.respuestas.has(f.id));
  for (const p of final) {
    if (familia && p.orden >= ordenFamilia) return { tipo: 'familia', pregunta: familia, antes: 'M15' };
    if (pendiente(p)) return comoSiguiente(p, e.respuestas, banco, hecha);
  }
  if (familia) return { tipo: 'familia', pregunta: familia, antes: 'M15' };
  return { tipo: 'terminada' };
}

/** Después de esta pregunta va directo el mensaje final, sin acuse (Naza, 30/09, ronda 2: el final es LE7 → familia → FO1 → LE9 → LE8 → FIN). */
export const SIN_ACUSE_ANTES_DEL_FINAL = 'LE8';
/** Después de LE9 tampoco va acuse: "Ahora sí, hablale a tu familia…" (LE8) arranca sola (Naza, 30/09, ronda 4). */
export const SIN_ACUSE: readonly string[] = ['LE9', SIN_ACUSE_ANTES_DEL_FINAL];

/**
 * Las familias de acuse. Rotan M3 (8), M4 (4), M24 (4), M25 (3), M27 (3),
 * M32 (2, ronda 2) y M28.4 (olvido a medias: M28.4 y M28.5, desde la prueba
 * de Naza en la página);
 * M28 tiene uno solo en uso (M28.1: M28.2 y M28.3 en reserva); M21, M26 y
 * M29 son uno.
 */
export type FamiliaAcuse = 'M3' | 'M4' | 'M21' | 'M24' | 'M25' | 'M26' | 'M27' | 'M28' | 'M28.4' | 'M29' | 'M32';

/**
 * Después de estas el acuse es siempre "Gracias, {{nombre}}.": PG1 ("tus
 * viejos de grande", a veces su muerte; Naza, 30/09, simulaciones) y AMH
 * (un "Bien, seguimos." después de [No estoy en pareja] (antes "Ya no está conmigo") es frío; prueba de
 * Naza en la página, 30/09).
 */
export const SIEMPRE_M26: readonly string[] = ['PG1', 'AMH'];
/** M29 va una sola vez, al tercer olvido seguido (regla 17). */
export const OLVIDOS_PARA_M29 = 3;

/** ¿Después de esta pregunta puede ir un acuse de olvido? (no en las que no llevan acuse ni en PG1, que lleva M26). */
function llevaAcuseDeOlvido(id: string): boolean {
  const p = preguntaPorId(id);
  return (!p || esperaRespuesta(p)) && !SIN_ACUSE.includes(id) && !SIEMPRE_M26.includes(id);
}

/**
 * ¿Este olvido lleva M29? Solo el primero que llega con 3 o más olvidos
 * seguidos y que lleva acuse; después de eso, nunca más en la entrevista
 * (regla 17). Se recorren las respuestas anteriores en el orden en que
 * llegaron (el Map conserva el orden de inserción).
 */
function esElOlvidoDeM29(pregunta: Pick<PreguntaEntrevista, 'id'>, anteriores: Respuestas): boolean {
  let seguidos = 0;
  let usado = false;
  const toca = (id: string, r: Respuesta) => {
    const i = interpretar(preguntaDe(id), r);
    // El olvido a medias no suma ni corta la cuenta (ronda 2: contó un pedacito, pero sigue costándole).
    if (i === 'olvido-a-medias') return false;
    if (i !== 'olvido') {
      seguidos = 0;
      return false;
    }
    seguidos++;
    if (usado || seguidos < OLVIDOS_PARA_M29 || !llevaAcuseDeOlvido(id)) return false;
    usado = true;
    return true;
  };
  for (const [id, r] of anteriores) {
    if (id === pregunta.id) continue;
    // Lo que contesta a una repregunta no suma ni corta la cuenta (Naza, 01/10: "olvido → M28.1 sin sumar a M29").
    if (deRepregunta(id) !== undefined) continue;
    // La pregunta entera cuenta como UN olvido (Naza, 01/10): si X tuvo segunda oportunidad, cuenta la de X~2, no la de X.
    if (PIDEN_DIA[id] && (anteriores.has(claveSegunda(id)) || pregunta.id === claveSegunda(id))) continue;
    toca(id, r);
  }
  return !usado && seguidos + 1 >= OLVIDOS_PARA_M29;
}

/**
 * Qué acuse va después de contestar (textos-finales.md, reglas 26 a 31;
 * Naza, 30/09, simulaciones). El aviso y el final no se contestan: nada;
 * después de LE9 y LE8, nada. Después de PG1, siempre M26. Si no, según lo
 * que dijo (`interpretar`):
 *   - "no" corto o botón de "No", y "ya te lo conté" → M25 (en todas);
 *   - "paso" → M25 en un cierre, M27 en una sensible, M21 en una común;
 *   - olvido → M28 (M28.1), o M29 al tercero seguido, una sola vez: para eso
 *     hacen falta las respuestas anteriores, en orden (`anteriores`);
 *   - contó algo (o tocó "Sí") → M24 en un cierre, M4 en una sensible, M3.
 * La segunda oportunidad (Naza, 01/10): un olvido puro en una de las 8 que
 * piden un día no lleva acuse (el "Está bien, {{nombre}}…" de M33 hace de
 * acuse); y lo que contesta en "X~2" lleva M28.4/M28.5 si contó, M28 (o M29)
 * si fue otro olvido o un "no" corto, M21 si dijo "paso".
 * Qué acuse de la familia va y si cambia por lo que sigue (M26 antes de un
 * cierre, LE9 o una sensible): `acuseDeTurno` en mensajes.ts; cómo se arma
 * el mensaje: `armarTurno`.
 */
export function mensajesDespues(
  pregunta: Pick<PreguntaEntrevista, 'id' | 'bloque' | 'clase' | 'sensible'> & Pick<PreguntaParaInterpretar, 'botones'>,
  respuesta: Respuesta,
  anteriores: Respuestas = new Map(),
): FamiliaAcuse[] {
  if (!esperaRespuesta(pregunta)) return [];
  if (SIN_ACUSE.includes(pregunta.id)) return [];
  if (SIEMPRE_M26.includes(pregunta.id)) return ['M26'];
  const dijo = interpretar(pregunta, respuesta);
  if (deSegunda(pregunta.id)) return acuseDeSegunda(dijo, pregunta, anteriores);
  if (deRepregunta(pregunta.id) !== undefined) return acuseDeRepregunta(dijo);
  if (dijo === 'olvido' && PIDEN_DIA[pregunta.id] && !anteriores.has(claveSegunda(pregunta.id))) return [];
  if (dijo === 'no' || dijo === 'ya-conto') return ['M25'];
  if (dijo === 'paso') return [pregunta.clase === 'cierre' ? 'M25' : pregunta.sensible ? 'M27' : 'M21'];
  if (dijo === 'olvido') return [esElOlvidoDeM29(pregunta, anteriores) ? 'M29' : 'M28'];
  // Ronda 2 (Naza, 30/09): en lugar de M3 o M4, el acuse que respeta lo que pasó; en un cierre sigue M24.
  if (dijo === 'olvido-a-medias' && pregunta.clase !== 'cierre') return ['M28.4'];
  if (dijo === 'no-ahondar' && pregunta.clase !== 'cierre') return ['M32'];
  if (pregunta.clase === 'cierre') return ['M24'];
  return [pregunta.sensible ? 'M4' : 'M3'];
}

/**
 * El acuse de lo que contesta en la segunda oportunidad (Naza, 01/10): ya
 * se le pidió dos veces, así que si contó algo va el acuse del pedacito
 * (M28.4/M28.5, que rotan; delante de un cierre o de LE9, M26 como
 * siempre); un olvido o un "no" corto, M28.1 (o M29, que cuenta este
 * olvido y no el de X); "paso", M21. Un "ya te lo conté" corto, M25, como
 * en todas (el plan no lo nombra).
 */
/**
 * El acuse de lo que contesta a una repregunta del cazador (Naza, 01/10):
 * contó → M3 (que con `acuseAntesDe` pasa a M26 delante de un cierre, LE9 o
 * una sensible); [Ya lo conté todo], un "no" corto o "ya te lo conté" → M25;
 * olvido → M28.1, nunca M29 (no suma a la cuenta); "paso" → M21. El olvido a
 * medias y el que se niega pero sigue llevan su acuse de siempre (M28.4, M32).
 */
function acuseDeRepregunta(dijo: Interpretacion): FamiliaAcuse[] {
  if (dijo === 'no' || dijo === 'ya-conto') return ['M25'];
  if (dijo === 'paso') return ['M21'];
  if (dijo === 'olvido') return ['M28'];
  if (dijo === 'olvido-a-medias') return ['M28.4'];
  if (dijo === 'no-ahondar') return ['M32'];
  return ['M3'];
}

function acuseDeSegunda(dijo: Interpretacion, pregunta: Pick<PreguntaEntrevista, 'id'>, anteriores: Respuestas): FamiliaAcuse[] {
  if (dijo === 'paso') return ['M21'];
  if (dijo === 'ya-conto') return ['M25'];
  if (dijo === 'olvido') return [esElOlvidoDeM29(pregunta, anteriores) ? 'M29' : 'M28'];
  if (dijo === 'no') return ['M28'];
  return ['M28.4'];
}

/** Las familias que rotan y cuántos tienen. */
export const ROTAN = { M3: 8, M4: 4, M24: 4, M25: 3, M27: 3, M32: 2, 'M28.4': 2 } as const;

/** El olvido a medias rota entre estos dos: nunca dos "Con ese pedacito" seguidos (Naza, 30/09, prueba en la página). */
export const OLVIDO_A_MEDIAS = ['M28.4', 'M28.5'] as const;

/** El acuse de turno de una familia que rota: M3 tiene 8 (M3.1…M3.8), M4 y M24 tienen 4, M25 y M27 tienen 3; M28.4 da M28.4 o M28.5. */
export function acuseRotado(familia: keyof typeof ROTAN, n: number): string {
  const total = ROTAN[familia];
  const i = ((n % total) + total) % total;
  return familia === 'M28.4' ? OLVIDO_A_MEDIAS[i] : `${familia}.${i + 1}`;
}

// ---------------------------------------------------------------- ficha contra respuestas

/**
 * Una duda para el dashboard (no se manda por WhatsApp: Naza, 30/09). `mensaje`
 * dice qué texto aprobado mostrar (DD1: la ficha dice que sí y contestó que
 * no; DD2: la ficha dice que no y contó algo) y `temaTexto` llena {{tema}}.
 * `texto` es la descripción interna, para el equipo.
 */
export type DudaFicha = {
  tema: 'hermanos' | 'pareja' | 'hijos' | 'nietos' | 'mudarse';
  pregunta: string;
  texto: string;
  mensaje: 'DD1' | 'DD2';
  temaTexto: string;
};

type Tema = { tema: DudaFicha['tema']; pregunta: string; campo: keyof FichaV3; si: string; no: string };

/** Las preguntas que abren un tema y el campo de la ficha que dice lo mismo. */
/** Cómo se nombra el tema en DD1 y DD2 ({{tema}}). "El amor" y no "tu pareja" (Naza, 30/09). */
export const TEMA_TEXTO: Record<DudaFicha['tema'], string> = {
  hermanos: 'tus hermanos',
  pareja: 'el amor',
  hijos: 'tus hijos',
  nietos: 'tus nietos',
  mudarse: 'vivir en otro lugar',
};

const TEMAS: readonly Tema[] = [
  { tema: 'hermanos', pregunta: 'CA6', campo: 'hermanos', si: 'tiene hermanos', no: 'no tiene hermanos' },
  { tema: 'mudarse', pregunta: 'JU8', campo: 'migracion', si: 'se fue a vivir a otro lugar', no: 'no se fue a vivir a otro lugar' },
  { tema: 'pareja', pregunta: 'AM0', campo: 'parejas', si: 'tuvo pareja', no: 'no tuvo pareja' },
  { tema: 'hijos', pregunta: 'HI0', campo: 'hijos', si: 'tiene hijos', no: 'no tiene hijos' },
  { tema: 'nietos', pregunta: 'HI8', campo: 'nietos', si: 'tiene nietos', no: 'no tiene nietos' },
];

/**
 * La ficha no decide qué se manda, pero se compara con las respuestas que
 * abren un tema: si la ficha dice que tiene y contestó un "no" corto, o si la
 * ficha dice que no tiene y contó algo, queda una duda neutral para el
 * dashboard (decide el narrador). Si la ficha no dice nada, o la respuesta
 * fue "paso" o no llegó, no hay duda.
 */
export function contradiccionesConFicha(ficha: FichaV3, respuestas: Respuestas): DudaFicha[] {
  const dudas: DudaFicha[] = [];
  for (const t of TEMAS) {
    const segunFicha = estado(ficha[t.campo]);
    if (segunFicha === 'lleno' && respondioNo(respuestas, t.pregunta)) {
      dudas.push({ tema: t.tema, pregunta: t.pregunta, texto: `La ficha dice que ${t.si} y en la entrevista contestó que no (${t.pregunta}).`, mensaje: 'DD1', temaTexto: TEMA_TEXTO[t.tema] });
    } else if (segunFicha === 'no-tiene' && contoAlgo(respuestas, t.pregunta)) {
      dudas.push({ tema: t.tema, pregunta: t.pregunta, texto: `La ficha dice que ${t.no} y en la entrevista contó algo (${t.pregunta}).`, mensaje: 'DD2', temaTexto: TEMA_TEXTO[t.tema] });
    }
  }
  return dudas;
}
