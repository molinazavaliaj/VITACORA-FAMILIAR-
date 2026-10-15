// Volver a cazar los bloques que fallaron (11/10). La key de Anthropic del
// entrevistador en Railway estaba revocada y el cazador falló en todos los
// bloques: quedaron marcados en el registro como cazados con error y no se
// reintentan solos. Esto es lo puro; el script es scripts/v3-recazar.ts.

import type { ResultadoCaza } from './nucleo/entrevista/cazador.js';
import type { EstadoV3 } from './tipos.js';
import { sumarCaza } from './turno.js';

/** Los bloques cuya caza terminó en error. */
export function bloquesConError(e: EstadoV3): number[] {
  return (e.cazador?.registro ?? []).filter((r) => r.motivo === 'error').map((r) => r.bloque);
}

/** Una copia sin las marcas de error de esos bloques (lo demás queda igual). */
export function sinErrores(e: EstadoV3, bloques: number[]): EstadoV3 {
  const copia = structuredClone(e);
  if (copia.cazador) copia.cazador.registro = copia.cazador.registro.filter((r) => !(r.motivo === 'error' && bloques.includes(r.bloque)));
  return copia;
}

/**
 * Suma lo que se volvió a cazar sobre el estado de AHORA (la entrevista siguió
 * mientras tanto). Solo para los bloques que siguen con error: si el bot ya
 * cazó uno bien, ese queda como está.
 */
export function aplicarRecaza(e: EstadoV3, resultados: ResultadoCaza[]): EstadoV3 {
  for (const r of resultados) if (r.error) throw new Error(`la caza del bloque ${r.bloque} falló otra vez: no se aplica`);
  const aplicables = bloquesAplicables(e, resultados);
  // Solo se limpian los bloques que traen su resultado: uno que falló después
  // del dry-run conserva su marca de error (revisión del 11/10).
  let final = sinErrores(e, aplicables);
  for (const r of resultados) if (aplicables.includes(r.bloque)) final = sumarCaza(final, r);
  return final;
}

/** Los bloques de `resultados` que siguen con error en `e` (los que se aplican y cuyo costo se registra). */
export function bloquesAplicables(e: EstadoV3, resultados: ResultadoCaza[]): number[] {
  const conError = bloquesConError(e);
  return resultados.map((r) => r.bloque).filter((b) => conError.includes(b));
}
