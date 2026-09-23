// Lo puro de `prueba-reparto.ts`: de las filas de la base al material del libro v2 (respuestas,
// épocas, línea de tiempo, reservados). Vive aparte del script para poder probarlo sin base ni
// modelo (el script corre todo al importarse). Naza lo corre pago y tiene que andar la primera vez.
//
// El estado v2 lo escribe el ENTREVISTADOR en `narradores.contexto.v2` (ver
// `entrevistador/src/manual/estado-v2.ts`). Son paquetes separados: acá NO se importa código del
// entrevistador; se copian solo los tipos mínimos que se leen y la tabla de tramos, cada uno con la
// fuente al lado. Si cambian allá, hay que cambiarlos acá.
import type { Respuesta } from '../src/db.js';
import { textoRespuesta } from '../src/libro/comun.js';
import type { EpocaDeRespuesta } from '../src/libro/etapas.js';

/** Copia de `Tramo` (entrevistador/src/ia/plan-preguntas.ts). */
export type Tramo = 'infancia' | 'juventud' | 'adulto joven' | 'adultez media' | 'segunda mitad' | 'hoy';

/**
 * Copia de `RANGO_TRAMO` (entrevistador/src/ia/plan-preguntas.ts). "hoy" allá es [0, 200] (no es una
 * edad, es el presente): acá no se usa como rango, ver `epocaDeTramo`.
 */
export const RANGO_TRAMO: Record<Tramo, [number, number]> = {
  infancia: [0, 12],
  juventud: [13, 22],
  'adulto joven': [23, 35],
  'adultez media': [36, 55],
  'segunda mitad': [56, 200],
  hoy: [0, 200],
};

/** Lo mínimo de `Objetivo` (entrevistador/src/ia/pregunta-v2.ts) que hace falta para la época. */
type ObjetivoV2 =
  | { tipo: 'nucleo'; id: string; bloque?: string; tramo?: Tramo | null }
  | { tipo: 'variable'; id: string; tramo: Tramo; desde: number; hasta: number }
  | { tipo: 'objeto'; id: string; tramo: Tramo };

/** Lo mínimo de `EstadoV2` (entrevistador/src/manual/estado-v2.ts) + `Secuencia` (ia/secuencia.ts) + `Perfil` (ia/perfil.ts). */
export type ContextoV2 = {
  perfil?: {
    persona?: { genero?: { valor?: string } | null };
    etapas?: { edades?: string; anios?: string; lugar?: string; conQuien?: string; queHacia?: string }[];
    bisagras?: string[];
  };
  secuencia?: {
    hechas?: { id: string; orden: number; tramo: Tramo | null; objetivo: ObjetivoV2 }[];
    objetos?: { orden: number; tramo: Tramo; final?: boolean }[];
  };
  preguntasEnviadas?: Record<string, string>;
  repreguntasEnviadas?: Record<string, string>;
  /** Respuestas (id) que frenó el candado de audio cruzado: no son material del libro. */
  bloqueadas?: string[];
};

/** El `contexto.v2` si el narrador se entrevistó con el cerebro v2 (mismo criterio que `leerEstado` allá), o null. */
export function leerContextoV2(contexto: unknown): ContextoV2 | null {
  const v2 = (contexto as { v2?: unknown } | null)?.v2 as ContextoV2 | undefined;
  return v2 && typeof v2 === 'object' && v2.perfil && v2.secuencia ? v2 : null;
}

/**
 * La época de un tramo. "hoy" no es una edad (es el presente): sin época, la ubica el modelo — como
 * rango [0, 200] daría el medio en 100 años y no caería en ninguna etapa igual.
 */
function epocaDeTramo(orden: number, tramo: Tramo | null | undefined): EpocaDeRespuesta {
  if (!tramo || tramo === 'hoy' || !RANGO_TRAMO[tramo]) return { orden, desde: null, hasta: null };
  const [desde, hasta] = RANGO_TRAMO[tramo];
  return { orden, desde, hasta };
}

/**
 * La época de cada orden en la entrevista v2 (diseño §3.4): el tramo de la pregunta que la originó.
 * - reflexión (núcleo del bloque 'reflexion') → al capítulo de reflexión;
 * - variable → su propio rango de edad (el que usó para preguntar, más fino que el del tramo);
 * - tramo null (presentación, inicio) → sin época: la presentación no es material de una etapa y
 *   solo entra si el modelo la ubica;
 * - objeto (101+) → el rango de su tramo.
 */
export function epocaV2(v2: ContextoV2, orden: number): EpocaDeRespuesta {
  const objeto = v2.secuencia?.objetos?.find((o) => o.orden === orden);
  if (objeto) return epocaDeTramo(orden, objeto.tramo);
  const hecha = v2.secuencia?.hechas?.find((h) => h.orden === orden);
  if (!hecha) return { orden, desde: null, hasta: null };
  const o = hecha.objetivo;
  if (o?.tipo === 'nucleo' && o.bloque === 'reflexion') return { orden, desde: null, hasta: null, reflexion: true };
  if (o?.tipo === 'variable' && Number.isFinite(o.desde) && Number.isFinite(o.hasta) && o.tramo !== 'hoy') {
    return { orden, desde: o.desde, hasta: o.hasta };
  }
  return epocaDeTramo(orden, hecha.tramo);
}

/**
 * La línea de tiempo que el biógrafo ya sabe (perfil v2): una etapa por línea, y las bisagras. Solo
 * eso — no el perfil entero —: es lo que `armarEtapas` necesita para cortar donde cortó su vida.
 */
export function lineaDeTiempoV2(v2: ContextoV2): string {
  const limpio = (s: string | undefined) => (typeof s === 'string' ? s.trim() : '');
  const etapas = (v2.perfil?.etapas ?? []).map((e) => {
    const cuando = [limpio(e.edades), limpio(e.anios) ? `(${limpio(e.anios)})` : ''].filter(Boolean).join(' ');
    const que = [limpio(e.lugar), limpio(e.conQuien) ? `con ${limpio(e.conQuien)}` : '', limpio(e.queHacia)].filter(Boolean).join(' · ');
    return `- ${cuando || 'edad sin saber'}: ${que || 'sin datos'}`;
  });
  const bisagras = (v2.perfil?.bisagras ?? []).map(limpio).filter(Boolean).map((b) => `- Bisagra: ${b}`);
  return [...etapas, ...bisagras].join('\n');
}

/** El género que dijo (o puso la ficha), si es uno de los dos; si no, null y decide el material. */
export function generoV2(v2: ContextoV2): 'mujer' | 'hombre' | null {
  const g = v2.perfil?.persona?.genero?.valor;
  return g === 'mujer' || g === 'hombre' ? g : null;
}

/**
 * La época de cada capítulo del guion VIEJO (Joaquín, material de antes del v2): con eso cada
 * respuesta arranca en su etapa. Los que cruzan toda la vida (el amor, el oficio, los hijos, las
 * pruebas) no tienen época: esas respuestas las ubica el modelo.
 */
export const EPOCA_DEL_CAPITULO_GUION: Record<string, [number, number] | 'reflexion'> = {
  'la infancia': [0, 12],
  'las raices': [0, 12],
  'la juventud': [13, 22],
  'la sabiduria': 'reflexion',
};

const clave = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function epocaDelGuion(orden: number, capituloGuion: string): EpocaDeRespuesta {
  const epoca = EPOCA_DEL_CAPITULO_GUION[clave(capituloGuion)];
  if (epoca === 'reflexion') return { orden, desde: null, hasta: null, reflexion: true };
  if (epoca) return { orden, desde: epoca[0], hasta: epoca[1] };
  return { orden, desde: null, hasta: null };
}

export type FilaRespuesta = Pick<Respuesta, 'id' | 'pregunta_orden' | 'es_repregunta' | 'audio_path' | 'recibido_at' | 'transcripcion' | 'texto_directo'>
  & Partial<Pick<Respuesta, 'reservada' | 'reservado_tramo'>>;

export type RespuestaDelLibro = { orden: number; pregunta: string; texto: string; fuenteId: string };

/**
 * De las filas de `respuestas` al material del libro, en orden de pregunta y de llegada:
 * - lo que se excluye (`--excluir`, y las `bloqueadas` del candado v2) no existe para esta corrida;
 * - lo reservado sale con `textoRespuesta` (la ÚNICA regla de reserva de la fábrica, hallazgo 19):
 *   una reserva total no entra, una parcial entra sin su tramo;
 * - lo reservado va aparte, a `reservados`, para que el lector final avise si algo se coló.
 */
export function materialDeRespuestas(
  filas: FilaRespuesta[],
  excluidas: Set<string>,
  preguntaDe: (orden: number, esRepregunta: boolean) => string,
): { respuestas: RespuestaDelLibro[]; reservados: string[] } {
  const vivas = filas.filter((r) => !excluidas.has(r.id))
    .sort((a, b) => a.pregunta_orden - b.pregunta_orden || String(a.recibido_at).localeCompare(String(b.recibido_at)));
  const respuestas: RespuestaDelLibro[] = [];
  const reservados: string[] = [];
  for (const r of vivas) {
    const tramo = typeof r.reservado_tramo === 'string' ? r.reservado_tramo.trim() : '';
    const original = (r.transcripcion?.trim() || r.texto_directo || '').trim();
    if (tramo) reservados.push(tramo);
    else if (r.reservada === true && original) reservados.push(original);
    const texto = textoRespuesta(r);
    if (!texto) continue;
    const fuenteId = r.audio_path?.split('/').pop() ?? `orden_${r.pregunta_orden}${r.es_repregunta ? '_repregunta' : ''}`;
    respuestas.push({ orden: r.pregunta_orden, pregunta: preguntaDe(r.pregunta_orden, r.es_repregunta), texto, fuenteId });
  }
  return { respuestas, reservados };
}
