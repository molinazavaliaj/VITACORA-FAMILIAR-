// Algo preocupante (paso-4-huecos-decisiones.md, Naza 05/10): si salta la
// lista de palabras, ese día solo un acuse sobrio (los del día feo), nada más
// (ni foto, ni seguir, ni botones), y marca a Naza. "Ese día" dura hasta la
// hora del día siguiente; ahí sigue con lo que tocaba. La foto pegada que se
// pierde así vuelve al final (cambio A, 05/10).

import { aInstante, sumarDias } from '../horas.js';
import { acuseSobrio, guardarFotoVencida, hoy, marcar, type Ctx } from './flujo.js';
import type { Fase } from './tipos.js';

export const enDiaSobrio = (c: Ctx): boolean => c.e.sobrioHasta !== null && c.ahora < new Date(c.e.sobrioHasta);

/**
 * Qué item sale a la hora del día siguiente (null: no se toca la fase).
 * En las extras del final no se toca: lo que se esperaba (la oferta, una extra,
 * una foto vencida) sigue esperando y al otro día sus botones vuelven a andar
 * (con la fase libre, la hora no la retomaría: en las extras solo corre el cierre a los 2 días).
 */
function siguienteDespuesDeSobrio(fase: Fase, cursor: number, enExtras: boolean): number | null {
  if (fase.tipo === 'terminado' || fase.tipo === 'sin-empezar' || enExtras) return null;
  if (fase.tipo === 'libre') return fase.siguiente;
  if (fase.tipo === 'bienvenida') return 0;
  if (fase.tipo === 'aviso-seria' || fase.tipo === 'retenido') return cursor;
  return cursor + 1;
}

/** `trajoFoto`: en la ráfaga vino una foto (si se esperaba la foto pegada, llegó y no se pierde). */
export function alPreocupante(c: Ctx, frase: string, trajoFoto = false): void {
  const e = c.e;
  acuseSobrio(c);
  marcar(c, 'preocupante', `"${frase}" en ${e.guion[e.cursor]?.clave ?? 'el arranque'}`);
  e.sobrioHasta = aInstante(sumarDias(hoy(c), 1), e.ficha.hora, e.ficha.zona).toISOString();
  e.diaHecho = hoy(c);
  const item = e.guion[e.cursor];
  if (item?.tipo === 'final') return;
  const sig = siguienteDespuesDeSobrio(e.fase, e.cursor, item?.tipo === 'extras');
  if (sig === null) return;
  if (!(trajoFoto && e.fase.tipo === 'foto')) guardarFotoVencida(e);
  e.extra = null;
  e.fase = { tipo: 'libre', siguiente: sig };
}
