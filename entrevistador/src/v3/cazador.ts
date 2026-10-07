// El cazador de escenas en WhatsApp (spec 2026-10-07, "El cazador"): cuando
// se cierra un cierre de bloque (CIn), `cazarBloque` del núcleo corre en
// segundo plano con Opus 5.5 y tope de USD 3 por entrevista. Nunca tira: si
// falla, ese bloque queda sin repreguntas y la entrevista sigue. Lo que trae se
// suma a la fila con compare-and-swap; si llega tarde, la repregunta sale en el
// turno siguiente. El costo va a `consumo_ia` (registrarUso).

import Anthropic from '@anthropic-ai/sdk';
import { cuentaDeEsteServicio, registrarUso } from '../costos.js';
import type { DepsV3 } from './deps.js';
import { conReintento, leerFila } from './estado.js';
import { MODELO_CAZADOR, type ClienteModelo, type ResultadoCaza } from './nucleo/entrevista/cazador.js';
import { fichaTexto } from './tipos.js';
import { cazarAlCerrar, sumarCaza } from './turno.js';

export function cazadorPrendido(): boolean {
  return process.env.V3_CAZADOR !== '0';
}

/** El SDK de Anthropic cumple la forma de ClienteModelo (la que usa el núcleo). */
export function clienteCazador(apiKey: string): ClienteModelo {
  return new Anthropic({ apiKey }) as unknown as ClienteModelo;
}

export async function cazarEnSegundoPlano(deps: DepsV3, narradorId: string, bloque: number): Promise<ResultadoCaza | null> {
  try {
    if (!deps.cazador) return null;
    const fila = await leerFila(deps.db, narradorId);
    if (!fila || fila.estado.cazador?.registro.some((x) => x.bloque === bloque)) return null;
    const r = await cazarAlCerrar(fila.estado, fichaTexto(fila), bloque, deps.cazador);
    if (r.tokens) {
      await registrarUso(deps.db, {
        servicio: 'entrevistador', paso: 'cazador_v3', modelo: MODELO_CAZADOR, proveedor: 'anthropic',
        cuenta: cuentaDeEsteServicio(), narradorId,
        uso: { input_tokens: r.tokens.entrada, output_tokens: r.tokens.salida },
      });
    }
    await conReintento(deps.db, narradorId, (f) =>
      f.estado.cazador?.registro.some((x) => x.bloque === bloque) ? null : { cambio: { estado: sumarCaza(f.estado, r) }, resultado: true });
    console.log(`cazador V3: ${narradorId}, bloque ${bloque}: ${r.repreguntas.length} repregunta(s) · USD ${r.costoUsd.toFixed(2)} · acumulado USD ${r.gastoUsd.toFixed(2)}${r.motivo ? ` (${r.motivo})` : ''}`);
    return r;
  } catch (err) {
    console.error(`cazador V3: falló el bloque ${bloque} de ${narradorId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

const EN_CURSO = new Set<Promise<unknown>>();

/** Lo lanza sin esperarlo (el narrador no espera al cazador). */
export function lanzarCazador(deps: DepsV3, narradorId: string, bloque: number): void {
  const promesa: Promise<unknown> = cazarEnSegundoPlano(deps, narradorId, bloque).finally(() => EN_CURSO.delete(promesa));
  EN_CURSO.add(promesa);
}

/** Para la simulación y los tests: espera a los cazadores que estén corriendo. */
export async function esperarCazas(): Promise<void> {
  await Promise.allSettled([...EN_CURSO]);
}
