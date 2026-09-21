import type { SupabaseClient } from '@supabase/supabase-js';

// Cuánto costó de verdad cada llamada del entrevistador. Es el gemelo de
// fabrica/src/costos.ts, con una diferencia: la fila va a la tabla `consumo_ia`
// de Supabase y no a un JSON en Storage, porque el panel suma el gasto del día
// y no puede recorrer la carpeta de cada narrador.
//
// La regla de oro es la misma de la fábrica: anotar el costo es secundario a
// atender al narrador. Cualquier fallo se avisa por consola y NUNCA tira.

export type Servicio = 'entrevistador' | 'fabrica' | 'voz';
export type Proveedor = 'anthropic' | 'openai' | 'local';
export type Unidad = 'segundos' | 'caracteres';

export type Uso = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
};

export type Precio = { input: number; output: number; cache_write: number; cache_read: number };

/** USD por millón de tokens. Misma tabla que la fábrica (`fabrica/src/costos.ts`). */
export const PRECIOS_USD_POR_MILLON: Record<string, Precio> = {
  'claude-fable-5': { input: 10, output: 50, cache_write: 12.5, cache_read: 1 },
  'claude-opus-5': { input: 5, output: 25, cache_write: 6.25, cache_read: 0.5 },
  'claude-haiku-4-5': { input: 1, output: 5, cache_write: 1.25, cache_read: 0.1 },
};

/**
 * Los que no se cobran por token. El precio es **por unidad** (segundo o carácter).
 *
 * - `gpt-transcribe`: medido (GASTOS.md): USD 0,0045 por minuto de audio.
 * - `gpt-4o-mini-tts`: **estimado** desde lo medido (GASTOS.md: ~USD 0,15 por las 30
 *   preguntas de un narrador, de ~200 caracteres cada una). Se corrige cuando haya
 *   una factura real de OpenAI que lo confirme.
 */
export const PRECIOS_POR_UNIDAD: Record<string, { unidad: Unidad; usdPorUnidad: number }> = {
  'gpt-transcribe': { unidad: 'segundos', usdPorUnidad: 0.0045 / 60 },
  'gpt-4o-mini-tts': { unidad: 'caracteres', usdPorUnidad: 0.15 / 30 / 200 },
};

export type FilaConsumo = {
  servicio: Servicio;
  paso: string;
  modelo: string;
  proveedor: Proveedor;
  cuenta?: string | null;
  narradorId?: string | null;
  uso?: Uso | null;
  cantidad?: number | null;
  unidad?: Unidad | null;
};

/** Seis decimales: un token de haiku cuesta 0,000001 USD. */
function redondearUsd(valor: number): number {
  return Math.round(valor * 1e6) / 1e6;
}

function tokens(valor: number | null | undefined): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
}

function precioDe(modelo: string): Precio | null {
  if (PRECIOS_USD_POR_MILLON[modelo]) return PRECIOS_USD_POR_MILLON[modelo];
  const base = Object.keys(PRECIOS_USD_POR_MILLON).find((clave) => modelo.startsWith(`${clave}-`));
  return base ? PRECIOS_USD_POR_MILLON[base] : null;
}

/** Un modelo que no está en la tabla vale 0 y se avisa: los tokens igual quedan anotados. */
export function calcularUsd(modelo: string, uso: Uso): number {
  const precio = precioDe(modelo);
  if (!precio) {
    console.warn(`costos: no hay precio cargado para el modelo ${modelo}; se anota con usd 0.`);
    return 0;
  }
  const porMillon =
    tokens(uso.input_tokens) * precio.input +
    tokens(uso.output_tokens) * precio.output +
    tokens(uso.cache_creation_input_tokens) * precio.cache_write +
    tokens(uso.cache_read_input_tokens) * precio.cache_read;
  return redondearUsd(porMillon / 1_000_000);
}

/** Para los que se cobran por segundo (transcribir) o por carácter (TTS). */
export function calcularUsdPorUnidad(modelo: string, cantidad: number): number {
  const precio = PRECIOS_POR_UNIDAD[modelo];
  if (!precio) {
    console.warn(`costos: no hay precio por unidad cargado para ${modelo}; se anota con usd 0.`);
    return 0;
  }
  return redondearUsd(precio.usdPorUnidad * cantidad);
}

/**
 * Anota una llamada en `consumo_ia`. Sin tokens y sin unidades no hay nada que
 * anotar (los mocks de los tests no traen `usage`). Cualquier fallo —la tabla sin
 * crear, Supabase caído, la red— se avisa y no frena a quien llama.
 */
/** Si la anotación tarda más que esto, se sigue sin esperarla: el narrador primero. */
export const TIMEOUT_ANOTACION_MS = 1500;

export async function registrarUso(
  db: SupabaseClient,
  fila: FilaConsumo,
  opciones: { timeoutMs?: number } = {}
): Promise<void> {
  const conTokens = tokens(fila.uso?.input_tokens) + tokens(fila.uso?.output_tokens) > 0;
  const porUnidad = typeof fila.cantidad === 'number' && Number.isFinite(fila.cantidad) && fila.cantidad > 0;
  if (!conTokens && !porUnidad) return;

  const usd = porUnidad ? calcularUsdPorUnidad(fila.modelo, fila.cantidad!) : calcularUsd(fila.modelo, fila.uso ?? {});

  const ms = opciones.timeoutMs ?? TIMEOUT_ANOTACION_MS;

  try {
    const insert = Promise.resolve(db.from('consumo_ia').insert({
      servicio: fila.servicio,
      paso: fila.paso,
      modelo: fila.modelo,
      proveedor: fila.proveedor,
      cuenta: fila.cuenta ?? null,
      narrador_id: fila.narradorId ?? null,
      input_tokens: tokens(fila.uso?.input_tokens),
      output_tokens: tokens(fila.uso?.output_tokens),
      cache_write: tokens(fila.uso?.cache_creation_input_tokens),
      cache_read: tokens(fila.uso?.cache_read_input_tokens),
      cantidad: porUnidad ? fila.cantidad : null,
      unidad: porUnidad ? (fila.unidad ?? null) : null,
      usd,
    }) as unknown as PromiseLike<{ error: { message: string } | null }>);

    // Si el insert pierde la carrera, su rechazo tardío no puede tumbar el proceso.
    insert.then(undefined, () => {});

    const resultado = await Promise.race([
      insert,
      new Promise<{ error: { message: string } | null }>((listo) =>
        setTimeout(() => listo({ error: { message: `tardó más de ${ms} ms` } }), ms)
      ),
    ]);
    if (resultado.error) {
      console.warn(`costos: no se anotó el paso ${fila.paso} (${fila.modelo}): ${resultado.error.message}`);
    }
  } catch (err) {
    console.warn(`costos: no se pudo anotar el paso ${fila.paso} (${fila.modelo}): ${(err as Error).message}`);
  }
}

/** Quién paga la key de este servicio. Se cambia por variable, no por código. */
export function cuentaDeEsteServicio(): string | null {
  const cuenta = process.env.CUENTA_IA?.trim();
  return cuenta ? cuenta : null;
}
