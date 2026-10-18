// El aviso de libro caro (18/10). Un libro cuesta entre USD 3 y 8 de IA. Si lo que la
// fábrica lleva gastado en un narrador pasa USD 20, algo se repite de más (un lote
// reintentado en bucle, un capítulo que no termina nunca) y sale un mail a los
// socios. Solo avisa: el libro sigue (decisión de Naza, 18/10).
//
// Una vez por narrador mientras viva el proceso (en memoria: tras un reinicio de
// Railway puede repetirse una vez, como la alarma de la clave). Nunca tira y no se
// espera en el camino del libro: se llama sin await.

import type { obtenerClienteDb } from './db.js';
import { avisarSocios } from './escritor/produccion/avisos.js';

type Db = ReturnType<typeof obtenerClienteDb>;

export const TOPE_AVISO_LIBRO_USD = 20;

const YA_AVISADO = new Set<string>();

/** Para los tests. */
export function olvidarAvisosDeGasto(): void {
  YA_AVISADO.clear();
}

/** Suma lo que la fábrica gastó en este narrador y, si pasa el tope, avisa una vez. Devuelve si avisó. */
export async function vigilarGastoDelLibro(
  db: Db,
  narradorId: string,
  o: { avisar?: (asunto: string, texto: string) => Promise<boolean>; tope?: number } = {},
): Promise<boolean> {
  try {
    if (YA_AVISADO.has(narradorId)) return false;
    const tope = o.tope ?? TOPE_AVISO_LIBRO_USD;
    const { data, error } = await db
      .from('consumo_ia')
      .select('paso, usd')
      .eq('servicio', 'fabrica')
      .eq('narrador_id', narradorId);
    if (error || !data) return false;

    const filas = data as Array<{ paso: string | null; usd: number | string | null }>;
    const total = filas.reduce((s, f) => s + Number(f.usd ?? 0), 0);
    if (total < tope || YA_AVISADO.has(narradorId)) return false;
    YA_AVISADO.add(narradorId);

    const porPaso = new Map<string, number>();
    for (const f of filas) porPaso.set(f.paso ?? 'sin paso', (porPaso.get(f.paso ?? 'sin paso') ?? 0) + Number(f.usd ?? 0));
    const desglose = [...porPaso.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([paso, usd]) => `- ${paso}: USD ${usd.toFixed(2)}`)
      .join('\n');

    return await (o.avisar ?? avisarSocios)(
      `Un libro ya gastó más de USD ${tope} de IA`,
      `La fábrica lleva gastados USD ${total.toFixed(2)} de IA en el narrador ${narradorId}, en ${filas.length} llamadas. ` +
        'Un libro normal cuesta entre USD 3 y 8.\n\n' +
        `Por paso\n${desglose}\n\n` +
        'El libro sigue, esto es solo un aviso. Si no lo están rehaciendo a propósito, conviene mirar los logs ' +
        'de la fábrica en Railway por si algo se está repitiendo.',
    );
  } catch (err) {
    console.warn('aviso-gasto-libro: no pude revisar el gasto del libro:', err instanceof Error ? err.message : err);
    return false;
  }
}
