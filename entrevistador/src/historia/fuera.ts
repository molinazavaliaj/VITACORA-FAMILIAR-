// «Que esto no vaya al libro» por respuesta, desde el panel (respuestas_fuera; CONTRATO, "Respuestas sacadas por la
// familia"). Copia de src/v3/fuera.ts con `clave_historia`. La dueña saca UNA fila. El bot no toca el estado por eso:
// lo lee antes de cada turno y
//   - el cazador recibe las respuestas sin lo sacado (no se repregunta sobre eso);
//   - una repregunta en cola sobre lo sacado no sale.
// La misma regla que la fábrica (fabrica/src/escritor/material/de-base.ts, sinLoSacado). Nunca tira: si no se
// puede leer, el turno sigue como antes (lo sacado igual no va al libro: eso lo hace la fábrica).

import type { SupabaseClient } from '@supabase/supabase-js';
import { SIN_CLAVE_HISTORIA, type EstadoHistoria } from './tipos.js';

/** Las filas de cada clave que tiene alguna sacada, en orden de llegada. Solo esas claves. */
export type Sacadas = ReadonlyMap<string, readonly { texto: string; fuera: boolean }[]>;

export const SIN_SACADAS: Sacadas = new Map();

const MARCAS = /⟦[^⟧]*⟧/g;
const normal = (t: string) => t.replace(/\s+/g, ' ').trim();
/** El texto de una fila como lo sumó el bot: la transcripción o lo escrito, sin las marcas ⟦…⟧. */
const textoDeFila = (r: { transcripcion: string | null; texto_directo: string | null }) => normal((r.transcripcion ?? r.texto_directo ?? '').replace(MARCAS, ' '));

/** Lo sacado del narrador. Sin la tabla, con un error o sin nada sacado: ninguna (y una sola consulta). */
export async function leerSacadas(db: SupabaseClient, narradorId: string): Promise<Sacadas> {
  try {
    const f = await db.from('respuestas_fuera').select('respuesta_id').eq('narrador_id', narradorId);
    if (f.error) {
      if (f.error.code !== '42P01' && f.error.code !== 'PGRST205') console.warn(`historia: no pude leer las respuestas sacadas de ${narradorId}: ${f.error.message}`);
      return SIN_SACADAS;
    }
    const ids = new Set(((f.data as { respuesta_id: string }[] | null) ?? []).map((r) => r.respuesta_id));
    if (ids.size === 0) return SIN_SACADAS;
    const r = await db.from('respuestas').select('id,clave_historia,transcripcion,texto_directo,recibido_at')
      .eq('narrador_id', narradorId).not('clave_historia', 'is', null).order('recibido_at', { ascending: true });
    if (r.error) {
      console.warn(`historia: no pude leer las respuestas de ${narradorId}: ${r.error.message}`);
      return SIN_SACADAS;
    }
    type Fila = { id: string; clave_historia: string; transcripcion: string | null; texto_directo: string | null };
    const filas = ((r.data as Fila[] | null) ?? []).filter((x) => x.clave_historia !== SIN_CLAVE_HISTORIA);
    const conSacada = new Set(filas.filter((x) => ids.has(x.id)).map((x) => x.clave_historia));
    const m = new Map<string, { texto: string; fuera: boolean }[]>();
    for (const x of filas) {
      if (!conSacada.has(x.clave_historia)) continue;
      m.set(x.clave_historia, [...(m.get(x.clave_historia) ?? []), { texto: textoDeFila(x), fuera: ids.has(x.id) }]);
    }
    return m;
  } catch (err) {
    console.warn(`historia: no pude leer las respuestas sacadas de ${narradorId}:`, err instanceof Error ? err.message : err);
    return SIN_SACADAS;
  }
}

/** El texto de una clave sin las filas sacadas: se borra cada una; si alguna no está tal cual, se rearma con las que quedan. */
export function sinLoSacado(texto: string, filas: readonly { texto: string; fuera: boolean }[]): string | null {
  if (!filas.some((f) => f.fuera)) return texto;
  const quedan = () => filas.filter((f) => !f.fuera).map((f) => normal(f.texto)).filter(Boolean).join(' ');
  let t = normal(texto);
  // El texto es la suma de las filas en orden: si coincide entero, se rearma sin las sacadas (sin buscar nada).
  if (t === filas.map((f) => normal(f.texto)).filter(Boolean).join(' ')) t = quedan();
  else {
    for (const s of filas.filter((f) => f.fuera).map((f) => normal(f.texto)).filter(Boolean)) {
      // Solo como palabras enteras y una sola vez: un «Sí» sacado no puede comerse el «así» de otra respuesta.
      const lugares: number[] = [];
      for (let i = t.indexOf(s); i >= 0; i = t.indexOf(s, i + 1)) {
        if ((i === 0 || t[i - 1] === ' ') && (i + s.length === t.length || t[i + s.length] === ' ')) lugares.push(i);
      }
      if (lugares.length !== 1) {
        t = quedan();
        break;
      }
      t = normal(`${t.slice(0, lugares[0])} ${t.slice(lugares[0] + s.length)}`);
    }
  }
  return t === '' ? null : t;
}

/** Las respuestas sin lo sacado (las claves que quedan vacías salen). Para el cazador. */
export function respuestasSinSacadas(respuestas: readonly [string, string][], s: Sacadas): [string, string][] {
  if (s.size === 0) return [...respuestas];
  const out: [string, string][] = [];
  for (const [k, t] of respuestas) {
    const filas = s.get(k);
    const limpio = filas ? sinLoSacado(t, filas) : t;
    if (limpio !== null) out.push([k, limpio]);
  }
  return out;
}

const parecido = (t: string) => normal(t).toLowerCase();

/**
 * La cola de repreguntas sin las que son sobre algo sacado: su origen tiene filas sacadas y la cita está en
 * una sacada o no está en ninguna de las que quedan (ante la duda, no se repregunta). Las ya contestadas
 * quedan como están.
 */
export function sinRepreguntasSacadas(e: EstadoHistoria, s: Sacadas): EstadoHistoria {
  if (s.size === 0 || !e.repreguntas?.length) return e;
  const contestadas = new Set(e.respuestas.map(([k]) => k));
  const repreguntas = e.repreguntas.filter((rp) => {
    const filas = s.get(rp.origen);
    if (!filas || contestadas.has(rp.clave) || e.esperando === rp.clave) return true;
    const cita = parecido(rp.cita);
    const enSacada = filas.some((f) => f.fuera && parecido(f.texto).includes(cita));
    const enOtra = filas.some((f) => !f.fuera && parecido(f.texto).includes(cita));
    return !enSacada && enOtra;
  });
  return repreguntas.length === e.repreguntas.length ? e : { ...e, repreguntas };
}
