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

/** El orden más alto que existe para este narrador (0 si no hay ninguna). */
export async function ultimoOrden(narradorId: string): Promise<number> {
  const { preguntas } = await guionDe(narradorId);
  return preguntas.length ? preguntas[preguntas.length - 1].orden : 0;
}

/** ¿Ya se generaron las adaptativas (las 4 finales del biógrafo)? */
export async function tieneAdaptativas(narradorId: string): Promise<boolean> {
  const { data } = await db.from('preguntas').select('id')
    .eq('narrador_id', narradorId).eq('tipo', 'adaptativa').limit(1);
  return (data?.length ?? 0) > 0;
}

/** Los capítulos del libro, en el orden del guion. */
export async function capitulosDe(narradorId: string): Promise<string[]> {
  const { preguntas } = await guionDe(narradorId);
  return [...new Set(preguntas.map((p) => p.capitulo))];
}
