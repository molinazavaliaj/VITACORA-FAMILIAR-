import type { Objetivo } from '../ia/pregunta-v2.js';
import type { Candidata } from '../ia/reusar-v2.js';
import type { DatosPiloto } from './comparar-modelos.js';
import type { ReusarConfig } from './estado-v2.js';

// Ajuste D (24/09): lo puro del piloto "de cero, reusando respuestas viejas" (ver `src/ia/reusar-v2.ts`
// para la búsqueda). Las respuestas viejas se leen con `leerPiloto` (solo `select`: el narrador viejo
// no se toca nunca); acá se arman las candidatas, se decide qué se busca y quién pasa por el candado.

/** Una respuesta del piloto anterior, lista para reusar. `corto` (R1, R2…) es estable: va por orden de llegada. */
export type Vieja = Candidata & { id: string; orden: number; esRepregunta: boolean };

/**
 * Las respuestas viejas que se pueden reusar, con la pregunta (o repregunta) que de verdad se le
 * mandó. Afuera las vacías y las que frenó el candado de audio cruzado en el piloto viejo (son de
 * otra persona: el hallazgo 43).
 */
export function viejasDe(datos: DatosPiloto): Vieja[] {
  const v2 = (datos.contexto?.v2 ?? {}) as Record<string, any>;
  const bloqueadas: string[] = Array.isArray(v2.bloqueadas) ? v2.bloqueadas : [];
  const preguntas: Record<string, string> = v2.preguntasEnviadas ?? {};
  const repreguntas: Record<string, string> = v2.repreguntasEnviadas ?? {};
  const porLlegada = [...datos.respuestas].sort((a, b) => String(a.recibido_at ?? '').localeCompare(String(b.recibido_at ?? '')));
  const vivas = porLlegada.filter((f) => f.id && !bloqueadas.includes(f.id) && (f.transcripcion ?? f.texto_directo ?? '').trim());
  return vivas.map((f, i) => ({
    id: f.id!,
    corto: `R${i + 1}`,
    orden: f.pregunta_orden,
    esRepregunta: f.es_repregunta,
    pregunta: ((f.es_repregunta ? repreguntas : preguntas)[String(f.pregunta_orden)] ?? '').trim(),
    respuesta: (f.transcripcion ?? f.texto_directo ?? '').trim(),
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
