// La clave de cada `recibido` (plan-conexion-bot.md, T1): a qué item respondió
// lo que mandó el número de las preguntas, con lo que el motor esperaba en el
// momento en que lo aplicó (lo de la noche, a las 9, con lo que se esperaba a
// las 9). Quien conecta la guarda en respuestas.clave_kids. Los IDs son los
// mismos que el motor usa para sus mensajes.
//
// La regla:
// - Nada que esperar (sin empezar, terminado) → SIN_CLAVE_KIDS. Un botón que no
//   hizo nada (viejo o ya tocado por `aMensaje`, el día sobrio, uno que no
//   corresponde a lo que se espera) también: eso lo ve motor.ts, que mira si el
//   botón sacó algo o movió el estado.
// - La bienvenida → su ID (BIEN-CHICO, BIEN-CHICO-PL, BIEN-PADRE). Un PREG-NUEVA
//   sin tocar → el suyo (PREG-NUEVA-CHICO, PREG-NUEVA-PADRE): lo retenido
//   todavía no le llegó, así que no se le cuelga a eso.
// - Una extra en curso (la de una más o la del final) → su ID (X1-2). Una foto
//   vencida que volvió al final, igual: es la extra en curso (K16-FOTO).
// - Una rama de una principal → el ID del mensaje de ese paso (K12-R1, K12-R1-2).
//   Tocar el botón propio de una rama → la rama (K12-R2), aunque no pregunte nada.
// - La otra puerta → K12-OP.
// - La foto pegada (y la espera del audio después de [No tengo]) → el ID de su
//   mensaje: K10-FOTO, también si se mudó a K16 (como sale en el día).
// - Todo lo demás → la clave del item del guion en curso: la principal (K12) o
//   la pregunta del padre (PADRE-1) sin rama; lo que espera un botón después de
//   contestar (B-SEGUIR → K12, B-TRANQUILA → K39); el aviso de K39 (K39); la una
//   más (UNA-MAS-2); el cierre (CIERRE-2, CIERRE-FINAL); la oferta de extras
//   (EXTRAS); la fase libre (el último item que empezó; antes de K1, la bienvenida).

import { pregunta } from '../banco.js';
import { fotoDelItem } from '../compra.js';
import { esPlural } from '../texto.js';
import { idRama } from './mensajes.js';
import type { Estado } from './tipos.js';

/** La clave de lo que llegó y no hizo nada. */
export const SIN_CLAVE_KIDS = '∅';

/** El ID de la bienvenida que le llegó (o le llega) a este chico. */
export function idBienvenida(e: Estado): 'BIEN-CHICO' | 'BIEN-CHICO-PL' | 'BIEN-PADRE' {
  if (e.ficha.canal === 'B') return 'BIEN-PADRE';
  return esPlural(e.ficha.quienRegala) ? 'BIEN-CHICO-PL' : 'BIEN-CHICO';
}

/** La clave de algo contado (o de un botón que hizo algo), con el estado de antes de aplicarlo. */
export function claveDe(e: Estado): string {
  const f = e.fase;
  if (f.tipo === 'sin-empezar' || f.tipo === 'terminado') return SIN_CLAVE_KIDS;
  if (f.tipo === 'bienvenida') return idBienvenida(e);
  if (f.tipo === 'retenido') return e.ficha.canal === 'A' ? 'PREG-NUEVA-CHICO' : 'PREG-NUEVA-PADRE';
  if (e.extra) return e.extra;
  const item = e.guion[e.cursor];
  if (!item) return idBienvenida(e); // libre antes de K1 (algo preocupante en la bienvenida)
  if (f.tipo === 'op') return `${f.clave}-OP`;
  if (f.tipo === 'foto' || f.tipo === 'foto-audio') {
    const foto = fotoDelItem(item);
    return foto ? `${foto.de}-FOTO` : item.clave;
  }
  if (f.tipo === 'pregunta' && f.rama !== null && item.tipo === 'principal') {
    const ri = pregunta(item.clave).ramas.findIndex((r) => r.boton === f.rama);
    return ri < 0 ? item.clave : idRama(item.clave, ri, f.pasoRama);
  }
  return item.clave;
}

/** La clave de un botón, con el estado de antes de tocarlo: el botón propio de una rama es la rama. */
export function claveDelBoton(e: Estado, boton: string): string {
  const f = e.fase;
  const item = e.guion[e.cursor];
  if (f.tipo === 'pregunta' && f.rama === null && !e.extra && item?.tipo === 'principal') {
    const ri = pregunta(item.clave).ramas.findIndex((r) => r.boton === boton);
    if (ri >= 0) return idRama(item.clave, ri);
  }
  return claveDe(e);
}
