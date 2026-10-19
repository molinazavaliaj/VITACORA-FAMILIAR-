// El aviso de gasto raro por narrador (18/10). Un narrador normal gasta centavos de
// IA por día (el más pesado, USD 1,6), pero el 24/09 uno gastó USD 11 en un día y
// nadie se enteró. Ahora, cuando lo que gastó un narrador HOY cruza USD 2, sale un
// mail a los socios. Solo avisa: nunca corta la entrevista (decisión de Naza, 18/10).
// Mucha gente el mismo día no lo dispara: el tope es por narrador, no por total.
//
// Nunca tira y nunca se espera en el camino del narrador: se llama sin await.

import type { SupabaseClient } from '@supabase/supabase-js';
import { avisarSocios } from './v3/avisos.js';

export const TOPE_AVISO_DIA_USD = 2;

type Avisar = (clave: string, asunto: string, detalle: string) => Promise<boolean>;

/**
 * Suma lo que el narrador gastó hoy (UTC) en el entrevistador y, si pasa el tope,
 * avisa (una vez por día por narrador). Devuelve si avisó.
 */
export async function vigilarGastoDelDia(
  db: SupabaseClient,
  narradorId: string,
  o: { ahora?: Date; avisar?: Avisar; tope?: number } = {},
): Promise<boolean> {
  try {
    const tope = o.tope ?? TOPE_AVISO_DIA_USD;
    const ahora = o.ahora ?? new Date();
    const dia = ahora.toISOString().slice(0, 10);
    const { data, error } = await db
      .from('consumo_ia')
      .select('paso, usd')
      .eq('servicio', 'entrevistador')
      .eq('narrador_id', narradorId)
      .gte('fecha', `${dia}T00:00:00Z`);
    if (error || !data) return false;

    const filas = data as Array<{ paso: string | null; usd: number | string | null }>;
    const total = filas.reduce((s, f) => s + Number(f.usd ?? 0), 0);
    // avisarSocios no repite la misma clave en el día (memoria + marca en Storage).
    if (total < tope) return false;

    const porPaso = new Map<string, number>();
    for (const f of filas) porPaso.set(f.paso ?? 'sin paso', (porPaso.get(f.paso ?? 'sin paso') ?? 0) + Number(f.usd ?? 0));
    const desglose = [...porPaso.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([paso, usd]) => `- ${paso}: USD ${usd.toFixed(2)}`)
      .join('\n');

    const detalle =
      `El narrador ${narradorId} ya gastó USD ${total.toFixed(2)} de IA hoy (${dia}, hora UTC) en el entrevistador, ` +
      `en ${filas.length} llamadas. Lo normal es menos de USD 0,10 por día.\n\n` +
      `Por paso\n${desglose}\n\n` +
      'La entrevista sigue igual, esto es solo un aviso. Si no es una prueba de ustedes, conviene mirar ' +
      'su conversación y los logs de Railway por si el bot se trabó repitiendo algo.\n' +
      'Este aviso sale una vez por día por narrador.';
    return await (o.avisar ?? avisarSocios)(
      `gasto-dia:${narradorId}`,
      `Un narrador gastó más de USD ${tope} de IA hoy`,
      detalle,
    );
  } catch (err) {
    console.warn('aviso-gasto: no pude revisar el gasto del día:', err instanceof Error ? err.message : err);
    return false;
  }
}
