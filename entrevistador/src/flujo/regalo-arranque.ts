// El arranque de un regalo en su idioma (plan 2026-10-09-regalo-idiomas, Task 4).
//
// Un regalo va siempre por la V3: su bienvenida es el BIEN del banco de la
// entrevista, que describe la V3 (audios, ritmo, «si alguna pregunta no tiene
// que ver con tu vida…»), y solo la V3 habla catalán y castellano de España.
// Debajo va el pedido de SÍ (ARRANQUE.pedidoSi), que también pide el permiso
// para guardar sus audios.

import type { Genero } from '../v3/nucleo/ficha.js';
import { mensajePorId } from '../v3/nucleo/entrevista/banco.js';
import { idiomaDe, type Idioma } from '../v3/nucleo/entrevista/idioma.js';
import { renderizar } from '../v3/nucleo/entrevista/texto.js';
import { ARRANQUE, type TextosArranque } from './regalo-textos.js';

export type FichaBienvenida = { nombre: string; genero: Genero; quienRegala?: string };

/** El BIEN del banco en ese idioma, una línea en blanco y el pedido de SÍ. Nunca cae a otro idioma: sin BIEN, tira. */
export function bienvenidaDeRegalo(idioma: Idioma, ficha: FichaBienvenida): string {
  const bien = mensajePorId('BIEN', idioma);
  if (!bien) throw new Error(`El banco no tiene el mensaje BIEN en ${idioma}.`);
  return `${renderizar(bien.texto, { ...ficha, idioma })}\n\n${ARRANQUE[idioma].pedidoSi}`;
}

/** Un texto de ARRANQUE con {{nombre}} lleno (como_le_dicen). */
export function textoDeArranque(idioma: Idioma, clave: keyof TextosArranque, nombre: string): string {
  return renderizar(ARRANQUE[idioma][clave], { nombre, genero: 'otro', idioma });
}

/**
 * El idioma del regalo (`contexto.idioma`). Uno desconocido no debería llegar
 * (la web solo escribe es-ES y ca): si llega, es-AR y se avisa, porque a quien
 * ya tiene la tarjeta en la mano hay que contestarle igual.
 */
export function idiomaDeRegalo(contexto: { idioma?: unknown } | null | undefined): Idioma {
  try {
    return idiomaDe(contexto ?? undefined);
  } catch (err) {
    console.error('regalo: idioma desconocido en la ficha, sigo en es-AR:', err instanceof Error ? err.message : err);
    return 'es-AR';
  }
}

/**
 * Para «no encuentro ese código»: todavía no se sabe de qué regalo es, así que
 * el idioma sale del teléfono. +34 → castellano de España; cualquier otro, es-AR.
 */
export function idiomaPorTelefono(tel: string): Idioma {
  // Igual que zonaPorTelefono: con o sin el «+» (Meta lo manda sin).
  const t = tel.trim();
  return (t.startsWith('+') ? t : `+${t}`).startsWith('+34') ? 'es-ES' : 'es-AR';
}
