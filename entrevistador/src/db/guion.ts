import { db } from './cliente.js';

// El guion de UN narrador (docs/panel-usuario.md §11.1). Desde el 12/09 cada
// narrador tiene sus propias filas en `preguntas` (la web copia las fijas al
// comprar y la familia las edita, saca, reordena y agrega). La plantilla
// global (`narrador_id = null`) es solo eso: plantilla. Vale únicamente para
// un narrador anterior a la migración que todavía no tenga copia.
//
// Antes esto se resolvía con un `.or(narrador_id.eq.X, narrador_id.is.null)`
// en cada consulta, y mezclaba las dos: si la familia sacaba la 26, "la
// última pregunta" seguía siendo la 26 de la plantilla y el narrador nunca
// terminaba. Ahora: si hay guion propio, es la única verdad.

export type PreguntaDelGuion = {
  id: string;
  orden: number;
  texto: string;
  capitulo: string;
  tipo: string;
  foto_id: string | null;
  narrador_id: string | null;
};

const CAMPOS = 'id,orden,texto,capitulo,tipo,foto_id,narrador_id';

/** Todas las preguntas de este narrador, en orden. `propio` dice si son suyas o la plantilla. */
export async function guionDe(narradorId: string): Promise<{ preguntas: PreguntaDelGuion[]; propio: boolean }> {
  const { data: propias } = await db.from('preguntas').select(CAMPOS).eq('narrador_id', narradorId).order('orden');
  const lista = (propias as PreguntaDelGuion[] | null) ?? [];
  if (lista.some((p) => p.tipo === 'fija')) return { preguntas: lista, propio: true };

  // Sin copia todavía: la plantilla, más lo propio que ya exista (reemplazos, adaptativas).
  const { data: globales } = await db.from('preguntas').select(CAMPOS).is('narrador_id', null).order('orden');
  const porOrden = new Map<number, PreguntaDelGuion>();
  for (const p of (globales as PreguntaDelGuion[] | null) ?? []) porOrden.set(p.orden, p);
  for (const p of lista) porOrden.set(p.orden, p); // lo propio pisa a la plantilla del mismo orden
  return { preguntas: [...porOrden.values()].sort((a, b) => a.orden - b.orden), propio: false };
}

/** La pregunta de ese orden, o null si no existe. */
export async function preguntaDeOrden(narradorId: string, orden: number): Promise<PreguntaDelGuion | null> {
  const { preguntas } = await guionDe(narradorId);
  return preguntas.find((p) => p.orden === orden) ?? null;
}

/**
 * La secuencia de días: el guion sin las preguntas de objeto (3t.30).
 *
 * Las de objeto viven en la banda 101-108, fuera de la cuenta de días: no
 * avanzan `dia_actual` y no son "la última pregunta" de nadie. Todo lo que
 * razona sobre el recorrido —cuándo generar las adaptativas, cuándo cerrar—
 * mira esta lista y no la otra.
 */
export async function guionDeDias(narradorId: string): Promise<PreguntaDelGuion[]> {
  const { preguntas } = await guionDe(narradorId);
  return preguntas.filter((p) => p.tipo !== 'objeto');
}

/** El orden más alto de la secuencia de días (0 si no hay ninguna). */
export async function ultimoOrden(narradorId: string): Promise<number> {
  const dias = await guionDeDias(narradorId);
  return dias.length ? dias[dias.length - 1].orden : 0;
}

/**
 * ¿Con esta pregunta se termina su capítulo? (La siguiente del recorrido es de
 * otro capítulo, o no hay siguiente.) Es el momento de pedir el objeto.
 */
export async function esUltimaDelCapitulo(narradorId: string, orden: number): Promise<boolean> {
  const dias = await guionDeDias(narradorId);
  const i = dias.findIndex((p) => p.orden === orden);
  if (i === -1) return false;
  const siguiente = dias[i + 1];
  return siguiente === undefined || siguiente.capitulo !== dias[i].capitulo;
}

/** El pedido de objeto de ese capítulo, si el narrador lo tiene y no lo sacó del panel. */
export async function objetoDelCapitulo(narradorId: string, capitulo: string): Promise<PreguntaDelGuion | null> {
  const { preguntas } = await guionDe(narradorId);
  return preguntas.find((p) => p.tipo === 'objeto' && p.capitulo === capitulo) ?? null;
}

/** ¿Ya se generaron las adaptativas (las 4 finales del biógrafo)? */
export async function tieneAdaptativas(narradorId: string): Promise<boolean> {
  const { data } = await db.from('preguntas').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'adaptativa').limit(1);
  return (data?.length ?? 0) > 0;
}

/** Los capítulos del libro, en el orden del guion. */
export async function capitulosDe(narradorId: string): Promise<string[]> {
  return [...new Set((await guionDeDias(narradorId)).map((p) => p.capitulo))];
}

/**
 * Las preguntas que el narrador YA respondió antes de `ordenActual`, con el
 * texto que de verdad recibió (`contexto.preguntasEnviadas`, la personalizada)
 * o, si no está, el del guion. Es la lista que ve la evaluación para ubicar un
 * recuerdo que aparece tarde ("esto es de otra parte", 21/09): orden, capítulo
 * y pregunta. Sin esa lista el modelo no puede acertar una orden real.
 */
export async function preguntasHechasAntes(
  narradorId: string, ordenActual: number, contexto: Record<string, any> | null | undefined,
): Promise<{ orden: number; capitulo: string; texto: string }[]> {
  const { preguntas } = await guionDe(narradorId);
  const enviadas = (contexto?.preguntasEnviadas ?? {}) as Record<string, unknown>;
  return preguntas
    .filter((p) => p.orden < ordenActual)
    .map((p) => {
      const enviada = enviadas[String(p.orden)];
      return { orden: p.orden, capitulo: p.capitulo, texto: typeof enviada === 'string' && enviada.trim() ? enviada : p.texto };
    });
}
