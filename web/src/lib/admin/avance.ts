import { claveMadre } from "@/lib/v3";

// Cuánto lleva contado cada narrador, como lo ve el panel de la empresa (Naza, 02/11: «los
// porcentajes están mal»). Antes la barra era `dia_actual / 30`, y eso solo vale para la
// entrevista vieja de 30 preguntas. Desde el 07/10 las entrevistas son V3
// (`entrevistas_v3`): no tienen guion de 30 ni avanzan `dia_actual` (queda en 0, o en el
// número que tenía al migrar), así que la barra mentía.
//
// La verdad de cada una:
// - V3: el bloque del banco por el que va (`estado.bloqueActual`, de 1 a 15) y si terminó
//   (`estado.terminada`). Las respuestas son las claves distintas de `respuestas.clave_v3`
//   (una repregunta RP~X y una segunda oportunidad X~2 cuentan con su pregunta X; `∅`
//   quedó afuera a propósito y null todavía no se sumó).
// - Guion viejo: las preguntas distintas contestadas (`pregunta_orden`, sin repreguntas)
//   sobre 30, la misma cuenta que el panel del cliente.

/** Los bloques del banco V3 (entrevistador/src/v3/nucleo/entrevista/flujo.ts, BLOQUE_FINAL). */
export const BLOQUES_V3 = 15;
export const PREGUNTAS_GUION = 30;
const SIN_CLAVE_V3 = "∅";

export type FilaV3 = { narrador_id: string; bloque: number | null; terminada: boolean | null };
export type FilaConteo = { narrador_id: string; pregunta_orden: number; es_repregunta: boolean; clave_v3: string | null };

export type Avance =
  | { tipo: "v3"; bloque: number; respondidas: number; terminada: boolean; proporcion: number }
  | { tipo: "guion"; respondidas: number; pregunta: number; proporcion: number };

const acotar = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);

/**
 * El avance de un narrador. `v3` es su fila de `entrevistas_v3` (o undefined si es del guion
 * viejo); `filas` son sus respuestas (las de otros se ignoran). Un narrador terminado
 * (`terminado`) va lleno aunque su entrevista no lo diga.
 */
export function avanceDe(
  n: { id: string; dia_actual: number | null },
  v3: FilaV3 | undefined,
  filas: readonly FilaConteo[],
  terminado = false,
): Avance {
  const suyas = filas.filter((f) => f.narrador_id === n.id);
  if (v3) {
    const claves = new Set(
      suyas.map((f) => f.clave_v3).filter((c): c is string => !!c && c !== SIN_CLAVE_V3).map(claveMadre),
    );
    const terminada = terminado || v3.terminada === true;
    const bloque = Math.max(0, Math.min(BLOQUES_V3, Math.round(Number(v3.bloque) || 0)));
    return { tipo: "v3", bloque, respondidas: claves.size, terminada, proporcion: terminada ? 1 : acotar(bloque / BLOQUES_V3) };
  }
  const respondidas = new Set(suyas.filter((f) => !f.es_repregunta).map((f) => f.pregunta_orden)).size;
  return {
    tipo: "guion",
    respondidas,
    pregunta: Math.max(0, n.dia_actual ?? 0),
    proporcion: terminado ? 1 : acotar(respondidas / PREGUNTAS_GUION),
  };
}

/** El avance en una línea, para las filas del panel. */
export function avanceEnPalabras(a: Avance): string {
  const resp = `${a.respondidas} ${a.respondidas === 1 ? "respuesta" : "respuestas"}`;
  if (a.tipo === "v3") {
    if (a.terminada) return `entrevista terminada · ${resp}`;
    return a.bloque === 0 ? `todavía no arrancó · ${resp}` : `bloque ${a.bloque} de ${BLOQUES_V3} · ${resp}`;
  }
  return `${a.respondidas} de ${PREGUNTAS_GUION} preguntas contestadas`;
}
