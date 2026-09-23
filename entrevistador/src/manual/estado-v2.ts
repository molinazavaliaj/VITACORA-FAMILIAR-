import { perfilDesdeFicha, type Perfil, type TemaPendiente } from '../ia/perfil.js';
import { armarSecuencia, aplicarPerfil, type Secuencia } from '../ia/secuencia.js';
import { replanificar, edadDe, type Variable } from '../ia/plan-preguntas.js';
import { NUCLEO, type Objetivo } from '../ia/pregunta-v2.js';
import { tratoDelPerfil } from '../ia/encargo-entrevista.js';
import { DIAS_SIN_REPREGUNTAR, type EvaluacionV2 } from '../ia/evaluar-v2.js';
import type { Marca } from '../ia/control-pregunta.js';
import { calcularUsd, calcularUsdPorUnidad, type Uso } from '../costos.js';

// Lo puro de la puerta manual v2 (diseño 23/09, §4.1): qué se guarda, qué pregunta está abierta,
// si toca repreguntar y los textos fijos que se pegan en WhatsApp. Vive acá y no en el script para
// que se pueda probar sin base ni modelo: el script (`scripts/manual-v2.ts`) solo lee, llama y
// guarda. Todo el estado v2 va bajo UNA clave, `contexto.v2`, para no chocar con las claves del
// flujo v1 (`preguntasEnviadas`, `repreguntasEnviadas`, `evitar`…); el cambio de CONTRATO se
// escribe en la Task 14.

/** El modelo de todas las llamadas del cerebro v2 (perfil, pregunta, evaluación): para el gasto. */
const MODELO_V2 = 'claude-opus-5';

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
  /** Cuántas bisagras tenía el perfil la última vez que se planificó (-1: nunca). */
  bisagrasPlanificadas: number;
  /** "Hoy no" (§2.8): la orden que se vuelve a mandar tal cual; mientras esté, no se avanza. */
  retomar?: number;
  /** USD acumulados de esta entrevista (modelo + transcripción). */
  gastoUsd: number;
};

/** El estado del día 0: el perfil con lo que haya en la ficha y la secuencia sin variables (sin edad no hay plan). */
export function estadoNuevo(contexto: Record<string, any>, zonaHoraria: string): EstadoV2 {
  return {
    perfil: perfilDesdeFicha(contexto, zonaHoraria),
    secuencia: armarSecuencia([]),
    marcas: {},
    preguntasEnviadas: {},
    repreguntasEnviadas: {},
    bisagrasPlanificadas: -1,
    gastoUsd: 0,
  };
}

/** El estado guardado, o null si la entrevista v2 no empezó (así `cargar` y `siguiente` saben frenar). */
export function leerEstado(contexto: Record<string, any>, zonaHoraria: string): EstadoV2 | null {
  const v2 = contexto?.v2;
  if (!v2 || typeof v2 !== 'object' || !v2.perfil || !v2.secuencia) return null;
  return { ...estadoNuevo(contexto, zonaHoraria), ...v2 };
}

/** El contexto con el estado adentro, sin tocar las otras claves (el panel y el flujo v1 las leen). */
export function contextoConEstado(contexto: Record<string, any>, estado: EstadoV2): Record<string, any> {
  return { ...contexto, v2: estado };
}

/**
 * TODAS las variables ya asignadas —las hechas y las pendientes—, en el orden en que se asignaron.
 * `replanificar` las conserva y suma lo que falte; `aplicarPerfil` cuenta hechas + pendientes por
 * tramo para numerar. Si acá fueran solo las pendientes (el borrador del plan lo hacía así), el
 * plan nuevo "creería" que faltan más y `aplicarPerfil` se comería las nuevas al cortar por tramo.
 */
export function variablesAsignadas(s: Secuencia): Variable[] {
  const aVariable = (o: Objetivo): Variable | null =>
    o.tipo === 'variable' ? { tramo: o.tramo, desde: o.desde, hasta: o.hasta, anclas: o.anclas } : null;
  return [...s.hechas.map((h) => h.objetivo), ...s.pendientes]
    .map(aVariable)
    .filter((v): v is Variable => v !== null);
}

/**
 * Planifica cuando hace falta: la primera vez que el perfil trae edad, y de nuevo cuando aparecen
 * bisagras nuevas. Es un solo camino (`replanificar` con lo ya asignado): con nada asignado es el
 * plan entero, y si un tema cubierto ya sumó una variable antes de saberse la edad, no se pierde
 * ni se duplica. Sin edad no toca nada (la entrevista nunca frena por la edad, §2.2).
 */
export function planSiHaceFalta(estado: EstadoV2, anioActual = new Date().getFullYear()): EstadoV2 {
  const { perfil, secuencia } = estado;
  if (edadDe(perfil, anioActual) === null) return estado;
  const nunca = estado.bisagrasPlanificadas < 0;
  if (!nunca && perfil.bisagras.length <= estado.bisagrasPlanificadas) return estado;
  const plan = replanificar(perfil, NUCLEO, variablesAsignadas(secuencia), secuencia.hechas.length, anioActual);
  if (!plan.ok) return estado;
  // Sin cubiertos ni puerta: acá solo entran las variables; el perfil de hoy se aplica aparte.
  const soloPlan = { ...perfil, cubiertos: [], puertaAbierta: null };
  return { ...estado, secuencia: aplicarPerfil(secuencia, soloPlan, plan.variables), bisagrasPlanificadas: perfil.bisagras.length };
}

/** Los temas que todavía faltan, para que el perfil diga cuáles ya contó o cuál abrió hoy. */
export function pendientesParaPerfil(s: Secuencia): TemaPendiente[] {
  return s.pendientes.flatMap((o): TemaPendiente[] => {
    if (o.tipo === 'nucleo') return o.id === 'presentacion' ? [] : [{ id: o.id, tema: o.tema }];
    if (o.tipo === 'variable') {
      const cuando = o.tramo === 'hoy' ? 'su vida de hoy' : `su ${o.tramo}, entre los ${o.desde} y los ${o.hasta} años`;
      return [{ id: o.id, tema: `Algo de ${cuando} que todavía no contó` }];
    }
    return [];
  });
}

/**
 * A qué pregunta va la respuesta que se carga: la última enviada, u otra ya enviada con `--orden`
 * (la respuesta a la presentación puede llegar después de que salió la casa, §2.2). Con
 * `--repregunta`, la repregunta de esa orden tiene que existir.
 */
export function preguntaParaCargar(
  estado: EstadoV2, orden: number | undefined, esRepregunta: boolean,
): { orden: number; objetivo: Objetivo; texto: string } | { error: string } {
  const hechas = estado.secuencia.hechas;
  if (!hechas.length) return { error: 'Todavía no se le mandó nada: corré "empezar" primero.' };
  const hecha = orden === undefined ? hechas.at(-1)! : hechas.find((h) => h.orden === orden);
  if (!hecha) return { error: `La orden ${orden} no se le mandó. Las enviadas: ${hechas.map((h) => h.orden).join(', ')}.` };
  const texto = (esRepregunta ? estado.repreguntasEnviadas : estado.preguntasEnviadas)[String(hecha.orden)];
  if (!texto) {
    return { error: esRepregunta ? `La orden ${hecha.orden} no tiene repregunta enviada.` : `No encuentro el texto enviado de la orden ${hecha.orden}.` };
  }
  return { orden: hecha.orden, objetivo: hecha.objetivo, texto };
}

/**
 * Qué hace `siguiente`: con "hoy no" pendiente, repite la misma pregunta; si la última no tiene
 * respuesta, frena (salvo `--saltar`: así no se pierde una respuesta sin cargar). La presentación
 * no espera: la casa sale a los pocos minutos aunque no haya contestado (§2.2).
 */
export function queHaceSiguiente(
  estado: EstadoV2, ordenesRespondidas: number[], saltar: boolean,
): { tipo: 'seguir' } | { tipo: 'retomar'; orden: number; texto: string } | { tipo: 'falta-respuesta'; orden: number } {
  if (estado.retomar !== undefined) {
    return { tipo: 'retomar', orden: estado.retomar, texto: estado.preguntasEnviadas[String(estado.retomar)] ?? '' };
  }
  const ultima = estado.secuencia.hechas.at(-1);
  if (!ultima || ultima.orden === 0 || saltar || ordenesRespondidas.includes(ultima.orden)) return { tipo: 'seguir' };
  return { tipo: 'falta-respuesta', orden: ultima.orden };
}

type FilaRespuesta = { pregunta_orden: number; es_repregunta: boolean; transcripcion: string | null; texto_directo: string | null };

/** Las últimas respuestas, cada una con la pregunta que la originó (sin la pregunta, el modelo no sabe de qué hablaba: C6). */
export function conversacionDe(estado: EstadoV2, filas: FilaRespuesta[], max = 6): { pregunta: string; respuesta: string }[] {
  return filas
    .map((f) => ({
      pregunta: (f.es_repregunta ? estado.repreguntasEnviadas : estado.preguntasEnviadas)[String(f.pregunta_orden)] ?? '',
      respuesta: (f.transcripcion ?? f.texto_directo ?? '').trim(),
    }))
    .filter((c) => c.respuesta)
    .slice(-max);
}

/** Todo lo que ya se le preguntó (para no repetir): preguntas, objetos y repreguntas; la presentación no pregunta. */
export function yaHechasDe(estado: EstadoV2): string[] {
  const sinPresentacion = Object.entries(estado.preguntasEnviadas).filter(([o]) => o !== '0').map(([, t]) => t);
  return [...sinPresentacion, ...Object.values(estado.repreguntasEnviadas)];
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
  | { accion: 'repreguntar'; texto: string }
  | { accion: 'nada'; motivo: string; sinRepreguntarHasta?: string; cansancioDesdeOrden?: number };

/**
 * Qué se hace con la evaluación (§2.8). "No quiero seguir" manda sobre todo; la respuesta a una
 * repregunta no se vuelve a repreguntar ni reabre la pregunta con un "hoy no" (se evalúa solo para
 * la reserva y los pedidos); "hoy no" deja la misma pregunta para mañana; y la repregunta no sale si ya hubo una en esa orden, si hay una pausa por cansancio
 * vigente, o si hoy aparece el cansancio (y ahí se anota la pausa).
 */
export function decidirTrasEvaluar(
  ev: EvaluacionV2,
  c: { esRepregunta: boolean; yaHayRepregunta: boolean; hoy: string; orden: number; cansancio: boolean; sinRepreguntarHasta?: string },
): Decision {
  if (ev.quiereParar) return { accion: 'parar' };
  // La pregunta del día ya está contestada: un "hoy no" en la repregunta no la vuelve a abrir.
  if (c.esRepregunta) return { accion: 'nada', motivo: 'es la respuesta a la repregunta: no se repregunta de nuevo' };
  if (ev.hoyNo) return { accion: 'hoyNo' };
  if (ev.suficiente || !ev.repregunta) return { accion: 'nada', motivo: 'la respuesta alcanza' };
  if (c.yaHayRepregunta) return { accion: 'nada', motivo: 'ya hubo una repregunta en esta orden' };
  if (c.sinRepreguntarHasta && c.sinRepreguntarHasta > c.hoy) {
    return { accion: 'nada', motivo: `pausa por cansancio hasta el ${c.sinRepreguntarHasta}` };
  }
  if (c.cansancio) {
    return {
      accion: 'nada',
      motivo: `cansancio: las dos últimas repreguntas quedaron sin contestar; no se repregunta por ${DIAS_SIN_REPREGUNTAR} días`,
      sinRepreguntarHasta: sumarDias(c.hoy, DIAS_SIN_REPREGUNTAR),
      cansancioDesdeOrden: c.orden,
    };
  }
  return { accion: 'repreguntar', texto: ev.repregunta };
}

/** Suma al gasto de la entrevista lo que costaron estas llamadas (y los segundos transcriptos). */
export function sumarGasto(estado: EstadoV2, usos: Uso[], segundosTranscriptos = 0): EstadoV2 {
  const modelo = usos.reduce((s, u) => s + calcularUsd(MODELO_V2, u), 0);
  const audio = segundosTranscriptos > 0 ? calcularUsdPorUnidad('gpt-transcribe', segundosTranscriptos) : 0;
  return { ...estado, gastoUsd: Math.round((estado.gastoUsd + modelo + audio) * 1e6) / 1e6 };
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
 * La despedida del v2. La de `puro.ts` dice "Treinta charlas" y en el v2 son entre 29 y 40, y
 * "escucharlo" supone un hombre: esta no cuenta ni supone.
 */
export function despedidaV2(nombre: string, perfil: Perfil): string {
  const su = tratoParaTextos(perfil) === 'usted' ? 'su' : 'tu';
  return `${nombre}... llegamos al final del viaje. Una vida entera, charla por charla. Fue un honor enorme escuchar ${su} historia, y ya la estamos convirtiendo en ${su} libro.`;
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
      'Qué hicimos: le mandamos un cierre con cariño, sin ninguna pregunta, y la entrevista quedó en pausa',
      `(estado «pausado»). No sale ninguna pregunta más hasta que alguien la retome a mano. Lo que contó`,
      `hasta acá (${d.respuestas} respuestas) queda guardado.`,
      '',
      'Qué falta: hablarlo con la familia. El biógrafo no decide solo. Si después de hablarlo quiere',
      'seguir, se retoma desde donde quedó' + (d.comandoReanudar ? `:\n  ${d.comandoReanudar}` : '.'),
      '',
      `Narrador: ${d.narradorId}`,
    ].join('\n'),
  };
}
