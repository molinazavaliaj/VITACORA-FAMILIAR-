import type { Objetivo } from '../ia/pregunta-v2.js';
import type { Candidata } from '../ia/reusar-v2.js';
import type { RespuestaDeBase } from './comparar-modelos.js';
import type { ReusarConfig } from './estado-v2.js';

// Ajuste D (24/09): lo puro del piloto "de cero, reusando respuestas viejas" (ver `src/ia/reusar-v2.ts`
// para la búsqueda). Las respuestas viejas se leen con `leerViejasDeBase` (solo `select`: el narrador
// viejo no se toca nunca); acá se arman las candidatas, se decide qué se busca y quién pasa por el candado.

/** Una respuesta vieja como sale de la base, con su reserva: lo reservado NUNCA se reusa. */
export type RespuestaVieja = RespuestaDeBase & { reservada?: boolean | null; reservado_tramo?: string | null };
export type DatosViejos = { contexto: Record<string, any>; respuestas: RespuestaVieja[] };

/** Los objetos (lo que contó de una foto) van en 101+: no contestan una pregunta del guion. */
const PRIMER_OBJETO = 101;

type BaseSoloLectura = { from: (tabla: string) => any };

/**
 * Lee el piloto viejo: su contexto y sus respuestas CON la reserva (`leerPiloto` de la comparación no
 * la trae). Solo `select`. Si la base no tiene las columnas de reserva, frena: reusar sin saber qué
 * pidió que no vaya al libro podría meterlo en el libro nuevo (la fábrica solo esconde lo marcado).
 */
export async function leerViejasDeBase(db: BaseSoloLectura, narradorId: string): Promise<DatosViejos> {
  const n = await db.from('narradores').select('id, contexto').eq('id', narradorId).maybeSingle();
  if (n.error) throw new Error(`No pude leer el narrador ${narradorId}: ${n.error.message}`);
  if (!n.data) throw new Error(`No encontré el narrador ${narradorId}.`);
  const r = await db.from('respuestas')
    .select('id, pregunta_orden, es_repregunta, transcripcion, texto_directo, recibido_at, reservada, reservado_tramo')
    .eq('narrador_id', narradorId).order('recibido_at');
  if (r.error) throw new Error(`No pude leer las respuestas de ${narradorId} (con su reserva): ${r.error.message}`);
  return { contexto: (n.data.contexto ?? {}) as Record<string, any>, respuestas: (r.data ?? []) as RespuestaVieja[] };
}

const textoDe = (f: RespuestaDeBase) => (f.transcripcion || f.texto_directo || '').trim();

/** Una respuesta del piloto anterior, lista para reusar. `corto` (R1, R2…) es estable: va por orden de llegada. */
export type Vieja = Candidata & { id: string; orden: number; esRepregunta: boolean };

/**
 * Las respuestas viejas que se pueden reusar, con la pregunta (o repregunta) que de verdad se le
 * mandó. Afuera: las vacías; las que frenó el candado de audio cruzado en el piloto viejo (son de
 * otra persona: el hallazgo 43); las reservadas, enteras o por un tramo (incluido el "hoy no", que se
 * reserva entero): la nueva fila no llevaría la marca y llegaría al libro; y los objetos (101+).
 */
export function viejasDe(datos: DatosViejos): Vieja[] {
  const v2 = (datos.contexto?.v2 ?? {}) as Record<string, any>;
  const bloqueadas: string[] = Array.isArray(v2.bloqueadas) ? v2.bloqueadas : [];
  const preguntas: Record<string, string> = v2.preguntasEnviadas ?? {};
  const repreguntas: Record<string, string> = v2.repreguntasEnviadas ?? {};
  const porLlegada = [...datos.respuestas].sort((a, b) => String(a.recibido_at ?? '').localeCompare(String(b.recibido_at ?? '')));
  const vivas = porLlegada.filter((f) =>
    f.id && !bloqueadas.includes(f.id) && textoDe(f)
    && f.reservada !== true && !f.reservado_tramo
    && f.pregunta_orden < PRIMER_OBJETO);
  return vivas.map((f, i) => ({
    id: f.id!,
    corto: `R${i + 1}`,
    orden: f.pregunta_orden,
    esRepregunta: f.es_repregunta,
    pregunta: ((f.es_repregunta ? repreguntas : preguntas)[String(f.pregunta_orden)] ?? '').trim(),
    respuesta: textoDe(f),
  }));
}

/** Las que todavía no se usaron: una respuesta vieja entra una sola vez. */
export function candidatasPara(viejas: Vieja[], usadas: ReusarConfig['usadas']): Vieja[] {
  const ya = new Set(Object.values(usadas));
  return viejas.filter((v) => !ya.has(v.id));
}

/** Se busca para la presentación, un núcleo del guion o una libre. Repreguntas y objetos: nunca (los contesta Naza en vivo). */
export const seBusca = (o: Objetivo): boolean => o.tipo === 'nucleo' || o.tipo === 'variable';

/**
 * ¿Pasa por el candado de audio cruzado? (hallazgo 43.) Lo que Naza carga en audio, sí (salvo
 * `--es-suyo`). Una reusada, NUNCA: es texto de esta misma persona, del piloto viejo (otro
 * narrador_id), y contra ese narrador el candado diría "ya está cargado en otro" siempre. Las que el
 * piloto viejo tenía frenadas ya no son candidatas (`viejasDe`). El texto escrito (`--texto`) sigue
 * como estaba: no pasa (no hay audio que se haya podido cruzar).
 */
export function pasaPorCandado(origen: 'audio' | 'texto' | 'reusada', esSuyo = false): boolean {
  return origen === 'audio' && !esSuyo;
}

export function lineaReusada(v: Vieja): string {
  const p = v.pregunta.length > 80 ? `${v.pregunta.slice(0, 80)}…` : v.pregunta;
  return `Reusé tu respuesta del piloto anterior a «${p}» para esta pregunta.`;
}

export const MAX_PASOS_POR_DEFECTO = 8;

/** `--seguido` (sí por defecto; `--seguido no` lo apaga) y `--max N` (pasos por corrida, 8 por defecto). */
export function opcionesDeReuso(flags: Record<string, string | boolean>): { seguido: boolean; max: number } {
  const seguido = flags['seguido'] !== 'no';
  const crudo = flags['max'];
  if (crudo === undefined) return { seguido, max: MAX_PASOS_POR_DEFECTO };
  const max = Number(crudo);
  if (!Number.isInteger(max) || max < 1) throw new Error('--max tiene que ser un número entero mayor que 0 (los pasos de esta corrida).');
  return { seguido, max };
}

/** Para `estado`: cuántas se reusaron de cuántas, y la lista corta orden → tema. */
export function reusadasEnTexto(config: ReusarConfig, total: number, hechas: { orden: number; id: string }[]): string[] {
  const ordenes = Object.keys(config.usadas).map(Number).sort((a, b) => a - b);
  return [
    `reusadas: ${ordenes.length} de ${total} (del narrador ${config.desde})`,
    ...ordenes.map((o) => `  ${String(o).padStart(2)} · ${hechas.find((h) => h.orden === o)?.id ?? '?'}`),
  ];
}

/**
 * El narrador que reusa las respuestas de `id` (su `contexto.v2.reusar.desde` apunta ahí), o null.
 * Sirve para frenar `siguiente`/`cargar` sobre el piloto VIEJO por error (los dos se llaman "Naza").
 */
export function quienLoReusa<T extends { id: string; contexto?: Record<string, any> | null }>(narradores: T[], id: string): T | null {
  return narradores.find((n) => n.id !== id && n.contexto?.v2?.reusar?.desde === id) ?? null;
}
