import { perfilDesdeFicha, type Perfil, type TemaPendiente } from '../ia/perfil.js';
import type { Tramo } from '../ia/plan-preguntas.js';
import { armarSecuencia, rearmar, type Secuencia, type Hecha } from '../ia/secuencia.js';
import { recortarHecha, MAX_REPREGUNTA_HECHA, type YaHecha, type Objetivo } from '../ia/pregunta-v2.js';
import { firmaGuion } from '../ia/guion-v2.js';
import { tratoDelPerfil } from '../ia/encargo-entrevista.js';
import { DIAS_SIN_REPREGUNTAR, type EvaluacionV2 } from '../ia/evaluar-v2.js';
import type { Marca } from '../ia/control-pregunta.js';
import { calcularUsd, calcularUsdPorUnidad, type Uso } from '../costos.js';
import { MODELO_PREGUNTA } from '../ia/modelos-v2.js';

// Lo puro de la puerta manual v2 (diseño 23/09, §4.1): qué se guarda, qué pregunta está abierta,
// si toca repreguntar y los textos fijos que se pegan en WhatsApp. Vive acá y no en el script para
// que se pueda probar sin base ni modelo: el script (`scripts/manual-v2.ts`) solo lee, llama y
// guarda. Todo el estado v2 va bajo UNA clave, `contexto.v2`, para no chocar con las claves del
// flujo v1 (`preguntasEnviadas`, `repreguntasEnviadas`, `evitar`…); el cambio de CONTRATO se
// escribe en la Task 14.

export type EstadoV2 = {
  perfil: Perfil;
  secuencia: Secuencia;
  /** La marca de lo que salió igual después de tres intentos: `orden`, `orden-repregunta`. */
  marcas: Record<string, Marca>;
  /** El texto que de verdad recibió, por orden (0 = presentación, 101+ = objetos). */
  preguntasEnviadas: Record<string, string>;
  repreguntasEnviadas: Record<string, string>;
  /** Cansancio (§2.8): hasta esta fecha (YYYY-MM-DD, en su zona) no se repregunta. */
  sinRepreguntarHasta?: string;
  /** La orden en la que se anotó la última pausa por cansancio: las repreguntas de antes ya se contaron. */
  cansancioDesdeOrden?: number;
  /** La firma del guion (edad, árbol, eventos) con la que se armó la secuencia: si la ficha la cambia, se rearma. */
  firmaGuion: string;
  /** "Hoy no" (§2.8): la orden que se vuelve a mandar tal cual; mientras esté, no se avanza. */
  retomar?: number;
  /** USD acumulados de esta entrevista (modelo + transcripción). */
  gastoUsd: number;
  /**
   * "No quiero seguir" (§2.8): la pausa vive ACÁ y no en `narradores.estado`, porque el narrador v2
   * está siempre en 'pausado' (el único estado que el scheduler de producción no toca; ver el
   * script). `siguiente` frena mientras esté; `--reanudar` la saca.
   */
  pausa?: { motivo: 'quiereParar'; fecha: string };
  /** Las respuestas (id) que ya pasaron por perfil + evaluación: una fila fuera de esta lista es una carga cortada. */
  procesadas: string[];
  /** Las respuestas (id) que frenó el candado de audio cruzado: no entran a los prompts ni cuentan como contestadas. */
  bloqueadas: string[];
  /**
   * Cuándo terminó la entrevista (YYYY-MM-DD). Vive ACÁ y no en `narradores.estado = 'completado'`:
   * la fábrica de producción arma la estructura v1 (una llamada paga con el guion viejo) y manda el
   * mail "terminó" a la familia apenas ve un narrador 'completado'. El narrador v2 se queda en
   * 'pausado' de punta a punta; su libro lo arma `fabrica/scripts/prueba-reparto.ts` a mano.
   */
  terminada?: string;
  /**
   * Solo en el piloto "de cero, reusando respuestas viejas" (ajuste D, 24/09; `empezar --reusar`):
   * de qué narrador se toman y cuáles ya se usaron (orden nueva → id de la respuesta vieja). Sin
   * `--reusar` no existe y nada cambia.
   */
  reusar?: ReusarConfig;
};

export type ReusarConfig = { desde: string; usadas: Record<string, string> };

/** El estado del día 0: el perfil con lo que haya en la ficha y el guion ya armado. */
export function estadoNuevo(contexto: Record<string, any>, zonaHoraria: string, anioActual = new Date().getFullYear()): EstadoV2 {
  const perfil = perfilDesdeFicha(contexto, zonaHoraria);
  return {
    perfil,
    secuencia: armarSecuencia(perfil, anioActual),
    firmaGuion: firmaGuion(perfil, anioActual),
    marcas: {},
    preguntasEnviadas: {},
    repreguntasEnviadas: {},
    gastoUsd: 0,
    procesadas: [],
    bloqueadas: [],
  };
}

/** El estado guardado, o null si la entrevista v2 no empezó (así `cargar` y `siguiente` saben frenar). */
export function leerEstado(contexto: Record<string, any>, zonaHoraria: string): EstadoV2 | null {
  const v2 = contexto?.v2;
  if (!v2 || typeof v2 !== 'object' || !v2.perfil || !v2.secuencia) return null;
  // Los defaults sin armar el guion: el perfil y la secuencia vienen siempre del guardado. (La zona
  // ya está dentro del perfil guardado; el parámetro queda por compatibilidad con quien llama.)
  void zonaHoraria;
  const defaults = { marcas: {}, preguntasEnviadas: {}, repreguntasEnviadas: {}, gastoUsd: 0, procesadas: [], bloqueadas: [] };
  const { bisagrasPlanificadas: _plan, ...guardado } = v2 as Record<string, any>;
  void _plan;
  const conFirma = typeof guardado.firmaGuion === 'string';
  const secuencia = { cubiertos: [], nombrados: {}, objetos: [], ultimoTramo: null, caidas: [], libres: 0, ...guardado.secuencia } as Secuencia;
  // Sin firma es un estado del piloto del 24/09 (plan por peso): las `var-*` de `replanificar` no son
  // libres del guion; si quedaran, `rearmar` las conservaría como libres y se comerían el techo.
  // Las `libre-*` sí quedan. Con firma '' `rearmarSiHaceFalta` rearma sí o sí la primera vez.
  if (!conFirma) secuencia.pendientes = secuencia.pendientes.filter((o) => o.tipo !== 'variable' || o.id.startsWith('libre-'));
  const estado: EstadoV2 = { ...defaults, ...guardado, perfil: guardado.perfil as Perfil, secuencia, firmaGuion: conFirma ? guardado.firmaGuion : '' };
  return estado;
}

/** El contexto con el estado adentro, sin tocar las otras claves (el panel y el flujo v1 las leen). */
export function contextoConEstado(contexto: Record<string, any>, estado: EstadoV2): Record<string, any> {
  return { ...contexto, v2: estado };
}

/** Rearma la secuencia cuando la ficha cambió lo que decide el guion (edad, árbol, noTuvo, eventos). */
export function rearmarSiHaceFalta(estado: EstadoV2, anioActual = new Date().getFullYear()): EstadoV2 {
  const firma = firmaGuion(estado.perfil, anioActual);
  if (firma === estado.firmaGuion) return estado;
  return { ...estado, secuencia: rearmar(estado.secuencia, estado.perfil, anioActual), firmaGuion: firma };
}

/** Los temas que todavía faltan, para que el perfil diga cuáles ya contó o cuál abrió hoy. Las libres no. */
export function pendientesParaPerfil(s: Secuencia): TemaPendiente[] {
  return s.pendientes.flatMap((o): TemaPendiente[] => (o.tipo === 'nucleo' && o.id !== 'presentacion' ? [{ id: o.id, tema: o.tema }] : []));
}

/**
 * A qué pregunta va la respuesta que se carga: la última enviada, u otra ya enviada con `--orden`
 * (la respuesta a la presentación puede llegar después de que salió la casa, §2.2), o un objeto
 * (órdenes 101+: lo que contó de la cosa que mostró). Con `--repregunta`, la repregunta de esa
 * orden tiene que existir (los objetos no tienen).
 */
export function preguntaParaCargar(
  estado: EstadoV2, orden: number | undefined, esRepregunta: boolean,
): { orden: number; objetivo: Objetivo; texto: string; esObjeto: boolean } | { error: string } {
  const hechas = estado.secuencia.hechas;
  if (!hechas.length) return { error: 'Todavía no se le mandó nada: corré "empezar" primero.' };
  const objeto = orden === undefined ? undefined : estado.secuencia.objetos.find((o) => o.orden === orden);
  if (objeto) {
    if (esRepregunta) return { error: `La orden ${orden} es un objeto: no tiene repregunta.` };
    const texto = estado.preguntasEnviadas[String(objeto.orden)];
    if (!texto) return { error: `No encuentro el texto enviado del objeto ${objeto.orden}.` };
    return { orden: objeto.orden, objetivo: objetoDe(objeto), texto, esObjeto: true };
  }
  const hecha = orden === undefined ? hechas.at(-1)! : hechas.find((h) => h.orden === orden);
  if (!hecha) {
    const objetos = estado.secuencia.objetos.map((o) => o.orden);
    return { error: `La orden ${orden} no se le mandó. Las enviadas: ${[...hechas.map((h) => h.orden), ...objetos].join(', ')}.` };
  }
  const texto = (esRepregunta ? estado.repreguntasEnviadas : estado.preguntasEnviadas)[String(hecha.orden)];
  if (!texto) {
    return { error: esRepregunta ? `La orden ${hecha.orden} no tiene repregunta enviada.` : `No encuentro el texto enviado de la orden ${hecha.orden}.` };
  }
  return { orden: hecha.orden, objetivo: hecha.objetivo, texto, esObjeto: false };
}

export type FilaParaSiguiente = { id: string; pregunta_orden: number; es_repregunta: boolean };

export type QueHaceSiguiente =
  | { tipo: 'seguir' }
  | { tipo: 'bloqueada'; filas: FilaParaSiguiente[] }
  | { tipo: 'sin-procesar'; filas: FilaParaSiguiente[] }
  | { tipo: 'retomar'; orden: number; texto: string }
  | { tipo: 'falta-respuesta'; orden: number };

/**
 * Qué hace `siguiente`, en este orden:
 * 1. Una respuesta que frenó el candado de audio cruzado y sigue en la base: frena SIEMPRE (ni
 *    `--saltar`): es de otra persona hasta que se descarte o se recargue con `--es-suyo`.
 * 2. Una respuesta que quedó a medio procesar (se cortó el modelo después de guardarla): frena,
 *    salvo `--saltar`, para que no se pierda lo que aprendería el perfil.
 * 3. Con "hoy no" pendiente, repite la misma pregunta (`--saltar` no lo saltea).
 * 4. Si la última no tiene respuesta procesada, frena (salvo `--saltar`). La presentación no
 *    espera: la casa sale a los pocos minutos aunque no haya contestado (§2.2).
 */
export function queHaceSiguiente(estado: EstadoV2, filas: FilaParaSiguiente[], saltar: boolean): QueHaceSiguiente {
  const bloqueadas = filas.filter((f) => estado.bloqueadas.includes(f.id));
  if (bloqueadas.length) return { tipo: 'bloqueada', filas: bloqueadas };
  const sinProcesar = filas.filter((f) => !estado.procesadas.includes(f.id));
  if (sinProcesar.length && !saltar) return { tipo: 'sin-procesar', filas: sinProcesar };
  if (estado.retomar !== undefined) {
    return { tipo: 'retomar', orden: estado.retomar, texto: estado.preguntasEnviadas[String(estado.retomar)] ?? '' };
  }
  const ultima = estado.secuencia.hechas.at(-1);
  const contestada = (o: number) => filas.some((f) => f.pregunta_orden === o && !f.es_repregunta && estado.procesadas.includes(f.id));
  if (!ultima || ultima.orden === 0 || saltar || contestada(ultima.orden)) return { tipo: 'seguir' };
  return { tipo: 'falta-respuesta', orden: ultima.orden };
}

type FilaRespuesta = { id?: string; pregunta_orden: number; es_repregunta: boolean; transcripcion: string | null; texto_directo: string | null; recibido_at?: string };

/**
 * Las últimas respuestas, cada una con la pregunta que la originó (sin la pregunta, el modelo no
 * sabe de qué hablaba: C6). Las que frenó el candado de audio cruzado no entran: son de otra persona.
 * "Últimas" es por cuándo llegaron (`recibido_at`), no por número de pregunta: los objetos van en
 * 101+ y, ordenados por número, después de tres objetos "lo último que hablaron" eran siempre las
 * fotos y nunca la pregunta de ayer.
 */
export function conversacionDe(estado: EstadoV2, filas: FilaRespuesta[], max = 3): { pregunta: string; respuesta: string }[] {
  const porLlegada = filas.every((f) => f.recibido_at)
    ? [...filas].sort((a, b) => String(a.recibido_at).localeCompare(String(b.recibido_at)))
    : filas;
  return porLlegada
    .filter((f) => !(f.id && estado.bloqueadas.includes(f.id)))
    .map((f) => ({
      pregunta: (f.es_repregunta ? estado.repreguntasEnviadas : estado.preguntasEnviadas)[String(f.pregunta_orden)] ?? '',
      respuesta: (f.transcripcion ?? f.texto_directo ?? '').trim(),
    }))
    .filter((c) => c.respuesta)
    .slice(-max);
}

/**
 * El objetivo de un objeto ya registrado. El final es `objeto-final` (con `final: true`), no
 * `objeto-<tramo>`: así nunca hay dos objetos "de hoy" (arreglo final I3).
 */
export function objetoDe(o: { tramo: Tramo; final?: boolean }): Extract<Objetivo, { tipo: 'objeto' }> {
  return o.final ? { tipo: 'objeto', id: 'objeto-final', tramo: o.tramo, final: true } : { tipo: 'objeto', id: `objeto-${o.tramo}`, tramo: o.tramo };
}

/** Los temas ya preguntados (id y tema, no el texto: el prompt no crece) y las repreguntas mandadas. */
export function yaHechasDe(estado: EstadoV2): YaHecha[] {
  const temas: YaHecha[] = estado.secuencia.hechas
    .filter((h) => h.id !== 'presentacion')
    .map((h) => ({ id: h.id, tema: h.objetivo.tipo === 'nucleo' ? h.objetivo.tema : h.objetivo.tipo === 'variable' ? `(libre) ${h.objetivo.anclas.join('; ')}` : h.objetivo.id }));
  const repreguntas: YaHecha[] = Object.entries(estado.repreguntasEnviadas).map(([orden, texto]) => {
    const h = estado.secuencia.hechas.find((x) => String(x.orden) === orden);
    // Recortada (arreglo final I1): el texto entero de cada repregunta hacía crecer el prompt.
    return { id: `${h?.id ?? orden}-repregunta`, tema: `(repregunta) ${recortarHecha(texto, MAX_REPREGUNTA_HECHA)}` };
  });
  // Los objetos ya pedidos, cortos (arreglo final I3): sin esto, el modelo no sabía que ya había
  // pedido el de "hoy" y el final lo repetía.
  const objetos: YaHecha[] = estado.secuencia.objetos.map((o) => {
    const cual = o.final ? 'final' : o.tramo;
    return { id: `objeto-${cual}`, tema: `(objeto) ${cual}` };
  });
  return [...temas, ...repreguntas, ...objetos];
}

/** `contexto.evitar` es texto libre (lo escribe la familia en el panel, y `sumarTemaEvitado`): el encargo v2 lo quiere en lista. */
export function evitarDe(contexto: Record<string, any>): string[] {
  const texto = typeof contexto?.evitar === 'string' ? contexto.evitar : '';
  return texto.split('\n').map((l) => l.replace(/\(lo pidió él en la entrevista\)/, '').trim()).filter(Boolean);
}

/** La fecha de hoy en la zona de la persona (YYYY-MM-DD): el cansancio se cuenta en sus días, no en los del servidor. */
export function hoyEn(zona: string, ahora = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: zona }).format(ahora);
}

/**
 * E18 (piloto esqueleto v2, 25/09): cuándo llegó la última respuesta, dicho como lo diría el
 * biógrafo, contado en los días de la persona (su zona): "hace unos minutos" (menos de una hora),
 * "hoy más temprano", "ayer", "hace N días". null si no hay hora: el prompt dice que no marque el
 * tiempo. Se pueden pedir varias preguntas por día: sin esto, el modelo suponía "ayer".
 */
export function cuandoContesto(recibidoAt: string | null | undefined, zona: string, ahora = new Date()): string | null {
  if (!recibidoAt) return null;
  const llego = new Date(recibidoAt);
  if (Number.isNaN(llego.getTime())) return null;
  if (ahora.getTime() - llego.getTime() < 60 * 60 * 1000) return 'hace unos minutos';
  const dias = Math.round((Date.parse(`${hoyEn(zona, ahora)}T12:00:00Z`) - Date.parse(`${hoyEn(zona, llego)}T12:00:00Z`)) / 86_400_000);
  if (dias <= 0) return 'hoy más temprano';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

/** E18: la hora de la última respuesta cargada (por llegada), sin las que frenó el candado de audio cruzado. */
export function ultimaRespuestaAt(estado: EstadoV2, filas: { id?: string; recibido_at?: string }[]): string | undefined {
  return filas
    .filter((f) => f.recibido_at && !(f.id && estado.bloqueadas.includes(f.id)))
    .map((f) => f.recibido_at as string)
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .at(-1);
}

/**
 * E18 (revisión del ajuste F): la hora en que llegó la respuesta que se está procesando. Si ya estaba
 * en la base (`--reprocesar`, quizá horas después), la suya real; si se acaba de cargar, ahora. Así
 * la repregunta de un reproceso no dice "hace unos minutos".
 */
export function recibidoAtDe(filas: { id?: string; recibido_at?: string }[], respuestaId: string, ahora = new Date()): string {
  return filas.find((f) => f.id === respuestaId)?.recibido_at ?? ahora.toISOString();
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Las repreguntas que cuentan para el cansancio: las de antes de la pregunta de hoy (la de hoy
 * todavía puede contestarse) y después de la última pausa (si no, pasados los tres días las
 * mismas dos viejas la volverían a disparar para siempre).
 */
export function repreguntasParaCansancio(estado: EstadoV2, ordenActual: number, contestadas: number[]): { contestada: boolean }[] {
  const desde = estado.cansancioDesdeOrden ?? -1;
  return Object.keys(estado.repreguntasEnviadas)
    .map(Number)
    .filter((o) => o < ordenActual && o > desde)
    .sort((a, b) => a - b)
    .map((o) => ({ contestada: contestadas.includes(o) }));
}

export type Decision =
  | { accion: 'parar' }
  | { accion: 'hoyNo' }
  | { accion: 'repreguntar'; falto: string[] }
  | { accion: 'nada'; motivo: string; sinRepreguntarHasta?: string; cansancioDesdeOrden?: number };

/** Una respuesta más corta que esto, que saltó dos o más pormenores, merece la segunda repregunta de la etapa. */
export const SEGUNDOS_RESPUESTA_CORTA = 40;

/**
 * Qué se hace con la evaluación (guion §2, decidido 24/09): parar manda; una respuesta a repregunta u
 * objeto no se repregunta; "hoy no" deja la misma pregunta; si alcanza, nada. Si no alcanza: la
 * primera repregunta de la etapa sale siempre; la segunda solo si la respuesta duró menos de
 * SEGUNDOS_RESPUESTA_CORTA y faltaron dos o más pormenores; una tercera, nunca. Y nunca si ya hubo una en esa orden, hay
 * pausa por cansancio o el cansancio aparece hoy.
 */
export function decidirTrasEvaluar(
  ev: EvaluacionV2,
  c: { esRepregunta: boolean; yaHayRepregunta: boolean; hoy: string; orden: number; cansancio: boolean; sinRepreguntarHasta?: string; repreguntasEnEtapa: number; segundos: number },
): Decision {
  if (ev.quiereParar) return { accion: 'parar' };
  if (c.esRepregunta) return { accion: 'nada', motivo: 'es la respuesta a una repregunta o a un objeto: no se repregunta' };
  if (ev.hoyNo) return { accion: 'hoyNo' };
  if (ev.suficiente || !ev.falto.length) return { accion: 'nada', motivo: 'la respuesta alcanza' };
  if (c.yaHayRepregunta) return { accion: 'nada', motivo: 'ya hubo una repregunta en esta orden' };
  if (c.sinRepreguntarHasta && c.sinRepreguntarHasta > c.hoy) return { accion: 'nada', motivo: `pausa por cansancio hasta el ${c.sinRepreguntarHasta}` };
  if (c.cansancio) {
    return { accion: 'nada', motivo: `cansancio: las dos últimas repreguntas quedaron sin contestar; no se repregunta por ${DIAS_SIN_REPREGUNTAR} días`, sinRepreguntarHasta: sumarDias(c.hoy, DIAS_SIN_REPREGUNTAR), cansancioDesdeOrden: c.orden };
  }
  // Una por etapa, más una si la respuesta fue corta: dos es el techo (guion §2 y §6).
  if (c.repreguntasEnEtapa >= 2) return { accion: 'nada', motivo: 'ya hubo dos repreguntas en esta etapa' };
  if (c.repreguntasEnEtapa >= 1 && !(c.segundos < SEGUNDOS_RESPUESTA_CORTA && ev.falto.length >= 2)) {
    return { accion: 'nada', motivo: 'ya hubo una repregunta en esta etapa y la respuesta no fue corta' };
  }
  return { accion: 'repreguntar', falto: ev.falto };
}

/**
 * La etapa de una hecha: el `bloque` de la fila del guion (una libre: su tramo). No el `tramo`: muchas
 * filas tienen `tramo: null` (inicio, futuro, reflexión…) y `casa-infancia` es del inicio aunque su
 * tramo sea infancia. Es el mismo criterio con el que `secuencia.ts` cierra las etapas.
 */
export function bloqueDeHecha(h: Hecha): string {
  return h.objetivo.tipo === 'nucleo' ? h.objetivo.bloque : (h.tramo ?? 'inicio');
}

/**
 * Cuántas repreguntas se mandaron en hechas de la misma etapa (bloque) que `hecha` —la que se está
 * evaluando—. Guion §2: una repregunta por etapa (más la excepción de la respuesta corta).
 */
export function repreguntasEnEtapa(estado: EstadoV2, hecha: Hecha): number {
  const bloque = bloqueDeHecha(hecha);
  const ordenes = new Set(estado.secuencia.hechas.filter((h) => bloqueDeHecha(h) === bloque).map((h) => String(h.orden)));
  return Object.keys(estado.repreguntasEnviadas).filter((o) => ordenes.has(o)).length;
}

/**
 * Suma al gasto de la entrevista lo que costaron estas llamadas (y los segundos transcriptos). Los
 * `usos` son todos del mismo `modelo` (el del paso: `modeloDePaso`): quien llama suma paso por paso.
 */
export function sumarGasto(estado: EstadoV2, usos: Uso[], segundosTranscriptos = 0, modelo: string = MODELO_PREGUNTA): EstadoV2 {
  const usd = usos.reduce((s, u) => s + calcularUsd(modelo, u), 0);
  const audio = segundosTranscriptos > 0 ? calcularUsdPorUnidad('gpt-transcribe', segundosTranscriptos) : 0;
  return { ...estado, gastoUsd: Math.round((estado.gastoUsd + usd + audio) * 1e6) / 1e6 };
}

// ── Los textos fijos (los aprueba Naza) ──────────────────────────────────
// No los escribe el modelo: son cortos, no preguntan nada, y no pueden salir mal el día que la
// persona dice "hoy no" o "no quiero seguir". Van en su trato y su castellano, sin género.

/** El trato para los textos fijos: el que eligió; si todavía no se sabe, usted (como el encargo). */
export function tratoParaTextos(perfil: Perfil): 'vos' | 'usted' | 'tu' {
  return tratoDelPerfil(perfil) ?? 'usted';
}

const esEspania = (p: Perfil) => p.castellano === 'españa';

/** "Hoy no puedo": la misma pregunta vuelve mañana. */
export function mensajeHoyNo(nombre: string, perfil: Perfil): string {
  const apuro = esEspania(perfil) ? 'prisa' : 'apuro';
  return tratoParaTextos(perfil) === 'usted'
    ? `No hay ${apuro}, ${nombre}. Mañana se la vuelvo a mandar y seguimos cuando pueda.`
    : `No hay ${apuro}, ${nombre}. Mañana te la vuelvo a mandar y seguimos cuando puedas.`;
}

/** "No quiero seguir": el cierre con cariño, sin preguntar ni convencer. La puerta queda abierta. */
export function cierreQuiereParar(nombre: string, perfil: Perfil): string {
  const trato = tratoParaTextos(perfil);
  if (esEspania(perfil)) {
    return trato === 'usted'
      ? `Está bien, ${nombre}: paramos aquí. Gracias por todo lo que me ha contado; queda guardado con mucho cuidado. Si algún día le apetece seguir, aquí estaré.`
      : `Está bien, ${nombre}: paramos aquí. Gracias por todo lo que me has contado; queda guardado con mucho cuidado. Si algún día te apetece seguir, aquí estaré.`;
  }
  return trato === 'usted'
    ? `Está bien, ${nombre}: paramos acá. Gracias por todo lo que me contó; queda guardado con mucho cuidado. Si algún día tiene ganas de seguir, acá voy a estar.`
    : `Está bien, ${nombre}: paramos acá. Gracias por todo lo que me contaste; queda guardado con mucho cuidado. Si algún día tenés ganas de seguir, acá voy a estar.`;
}

/**
 * El nombre solo, sin la aclaración que a veces trae la ficha (E20): "Naza (así quiere que le
 * digan; también le dicen Nazareno)" tiene que quedar en "Naza". Se corta antes del primer "(" o
 * ";" y se recortan los espacios. Se usa en todo lo que el v2 le muestra a la persona o a los
 * dueños con el nombre que sacó de la ficha (presentación, despedida, mail, objetos).
 */
export function nombreLimpio(valor: string): string {
  const corte = valor.search(/[(;]/);
  return (corte === -1 ? valor : valor.slice(0, corte)).trim();
}

/**
 * La despedida del v2 (aprobada 25/09). La de `puro.ts` dice "Treinta charlas" y en el v2 son
 * entre 29 y 40, y "escucharlo" supone un hombre: esta no cuenta ni supone.
 */
export function despedidaV2(nombre: string, perfil: Perfil): string {
  return tratoParaTextos(perfil) === 'usted'
    ? `${nombre}, llegamos al final. Gracias por abrirme su vida entera, con lo lindo y con lo que costó contar. `
      + `Cada historia que me dio ahora tiene su lugar, y los suyos la van a poder leer y escuchar cuando quieran. `
      + `Fue un honor hacer este viaje con usted.`
    : `${nombre}, llegamos al final. Gracias por abrirme tu vida entera, con lo lindo y con lo que costó contar. `
      + `Cada historia que me diste ahora tiene su lugar, y los tuyos la van a poder leer y escuchar cuando quieran. `
      + `Fue un honor acompañarte en este viaje.`;
}

/** El mail para los dueños cuando pide parar: el biógrafo no decide solo (§2.8). Se imprime; no se manda. */
export function mailQuiereParar(d: {
  nombre: string; narradorId: string; orden: number; pregunta: string; respuesta: string; respuestas: number; comandoReanudar?: string;
}): { asunto: string; cuerpo: string } {
  const respuesta = d.respuesta.length > 1000 ? `${d.respuesta.slice(0, 1000)}…` : d.respuesta;
  return {
    asunto: `Vitácora Familiar: ${d.nombre} pidió no seguir con la entrevista`,
    cuerpo: [
      `${d.nombre} dijo que no quiere seguir con la entrevista.`,
      '',
      `Fue al contestar la pregunta ${d.orden}:`,
      `  «${d.pregunta}»`,
      '',
      'Lo que respondió:',
      `  «${respuesta}»`,
      '',
      'Qué hicimos: le mandamos un cierre con cariño, sin ninguna pregunta, y la entrevista quedó en pausa.',
      'No sale ninguna pregunta más hasta que alguien la retome a mano. Lo que contó hasta acá',
      `(${d.respuestas} respuestas) queda guardado.`,
      '',
      'Qué falta: hablarlo con la familia. El biógrafo no decide solo. Si después de hablarlo quiere',
      'seguir, se retoma desde donde quedó' + (d.comandoReanudar ? `:\n  ${d.comandoReanudar}` : '.'),
      '',
      `Narrador: ${d.narradorId}`,
    ].join('\n'),
  };
}
